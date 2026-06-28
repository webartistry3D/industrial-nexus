import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : true;

@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: corsOrigins,
    credentials: true,
  },
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private redis: RedisService,
  ) {
    console.log('[TrackingGateway] Constructor called - gateway instantiated');
  }

  afterInit() {
    console.log('[TrackingGateway] afterInit - server ready, subscribing to Redis');
    this.subscribeToRedis();
  }

  async handleConnection(client: Socket) {
    try {
      console.log('[Tracking] New connection attempt - namespace:', client.nsp.name, 'id:', client.id);
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      console.log('[Tracking] Token present:', !!token);
      
      if (!token) {
        console.log('[Tracking] No token provided, disconnecting');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      console.log('[Tracking] Token verified - userId:', payload.sub, 'role:', payload.role);

      // Re-validation: reject tokens issued more than 24 hours ago
      const TOKEN_MAX_AGE_S = 24 * 60 * 60;
      if (payload.iat && Math.floor(Date.now() / 1000) - payload.iat > TOKEN_MAX_AGE_S) {
        console.log('[Tracking] Token too old, forcing re-auth for userId:', payload.sub);
        client.emit('auth:expired', { message: 'Token expired, please re-authenticate' });
        client.disconnect();
        return;
      }

      client.data.userId = payload.sub;
      client.data.role = payload.role;

      // Auto-join user to their personal room for targeted notifications
      const room = `user:${payload.sub}`;
      client.join(room);
      console.log('[Tracking] User joined room:', room);
      
      console.log(`[Tracking] User ${payload.sub} connected successfully`);
    } catch (error) {
      console.error('[Tracking] Connection error:', error);
      console.error('[Tracking] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[Tracking] User ${client.data.userId} disconnected`);
  }

  @SubscribeMessage('subscribe:trip')
  async subscribeToTrip(
    @MessageBody() data: { tripId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `trip:${data.tripId}`;
    client.join(room);
    console.log(`[Tracking] User ${client.data.userId} joined ${room}`);
    client.emit('subscribed', { room });
  }

  @SubscribeMessage('subscribe:fleet')
  async subscribeToFleet(@ConnectedSocket() client: Socket) {
    const room = 'fleet';
    client.join(room);
    console.log(`[Tracking] User ${client.data.userId} joined ${room}`);
    client.emit('subscribed', { room });
  }

  @SubscribeMessage('unsubscribe:trip')
  async unsubscribeFromTrip(
    @MessageBody() data: { tripId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `trip:${data.tripId}`;
    client.leave(room);
    console.log(`[Tracking] User ${client.data.userId} left ${room}`);
  }

  @SubscribeMessage('unsubscribe:fleet')
  async unsubscribeFromFleet(@ConnectedSocket() client: Socket) {
    const room = 'fleet';
    client.leave(room);
    console.log(`[Tracking] User ${client.data.userId} left ${room}`);
  }

  @SubscribeMessage('subscribe:package')
  async subscribeToPackage(
    @MessageBody() data: { packageTrackerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `package:${data.packageTrackerId}`;
    client.join(room);
    console.log(`[Tracking] User ${client.data.userId} joined ${room}`);
    client.emit('subscribed', { room });
  }

  @SubscribeMessage('unsubscribe:package')
  async unsubscribeFromPackage(
    @MessageBody() data: { packageTrackerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `package:${data.packageTrackerId}`;
    client.leave(room);
    console.log(`[Tracking] User ${client.data.userId} left ${room}`);
  }

  private subscribeToRedis() {
    // Subscribe to location updates
    this.redis.subscribe('tracking:location', (message) => {
      try {
        const data = JSON.parse(message);
        
        // Broadcast to trip-specific subscribers
        this.server.to(`trip:${data.tripId}`).emit('location:update', data);
        
        // Broadcast to fleet subscribers
        this.server.to('fleet').emit('location:update', data);
        
        console.log(`[Tracking] Location update broadcast for trip ${data.tripId}`);
      } catch (error) {
        console.error('[Tracking] Error processing location update:', error);
      }
    });

    // Subscribe to geofence events
    this.redis.subscribe('geofence:event', (message) => {
      try {
        const data = JSON.parse(message);
        
        // Broadcast to trip-specific subscribers
        this.server.to(`trip:${data.tripId}`).emit('geofence:event', data);
        
        // Broadcast to fleet subscribers
        this.server.to('fleet').emit('geofence:event', data);
        
        console.log(`[Tracking] Geofence event broadcast for trip ${data.tripId}: ${data.eventType}`);
      } catch (error) {
        console.error('[Tracking] Error processing geofence event:', error);
      }
    });

    // Subscribe to package location updates
    this.redis.subscribe('tracking:package:location', (message) => {
      try {
        const data = JSON.parse(message);
        const room = `package:${data.packageTrackerId}`;
        this.server.to(room).emit('package:location:update', data);
        console.log(`[Tracking] Package location update broadcast for ${data.packageTrackerId}`);
      } catch (error) {
        console.error('[Tracking] Error processing package location update:', error);
      }
    });

    // Subscribe to notification events — push to per-user room
    this.redis.subscribe('notification:new', (message) => {
      try {
        const data = JSON.parse(message);
        const room = `user:${data.userId}`;
        console.log(`[Tracking] Emitting notification to room ${room}`);
        // Each user is joined to a room named "user:<userId>" on connection
        this.server.to(room).emit('notification:new', data.notification);
      } catch (error) {
        console.error('[Tracking] Error processing notification:', error);
      }
    });
  }
}
