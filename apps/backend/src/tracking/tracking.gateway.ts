import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
    credentials: true,
  },
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private redis: RedisService,
  ) {
    this.subscribeToRedis();
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.data.role = payload.role;

      // Auto-join user to their personal room for targeted notifications
      client.join(`user:${payload.sub}`);
      
      console.log(`[Tracking] User ${payload.sub} connected`);
    } catch (error) {
      console.error('[Tracking] Connection error:', error);
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

    // Subscribe to notification events — push to per-user room
    this.redis.subscribe('notification:new', (message) => {
      try {
        const data = JSON.parse(message);
        // Each user is joined to a room named "user:<userId>" on connection
        this.server.to(`user:${data.userId}`).emit('notification:new', data.notification);
        console.log(`[Tracking] Notification pushed to user ${data.userId}`);
      } catch (error) {
        console.error('[Tracking] Error processing notification:', error);
      }
    });
  }
}
