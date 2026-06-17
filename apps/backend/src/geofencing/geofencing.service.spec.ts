import { Test, TestingModule } from '@nestjs/testing';
import { GeofencingService } from './geofencing.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { GeofenceEventType, TripStatus } from '@prisma/client';

describe('GeofencingService', () => {
  let service: GeofencingService;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockPrisma = {
    trip: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    trackingPoint: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    geofence: {
      findMany: jest.fn(),
    },
    geofenceEvent: {
      create: jest.fn(),
    },
  };

  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn(),
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeofencingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<GeofencingService>(GeofencingService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);

    jest.clearAllMocks();
  });

  describe('processGPSUpdate', () => {
    it('should process GPS update and detect Radius C entry (arrival)', async () => {
      const mockTrip = {
        id: 'trip-1',
        order: {
          deliveryLocation: { lat: 6.5244, lng: 3.3792 },
        },
      };

      const gpsPoint = { lat: 6.5244, lng: 3.3793, accuracy: 10 }; // ~11m from destination

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.trackingPoint.findFirst.mockResolvedValue(null);
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.trackingPoint.create.mockResolvedValue({ id: 'point-1' });
      mockPrisma.geofence.findMany.mockResolvedValue([]);

      const result = await service.processGPSUpdate('trip-1', gpsPoint);

      expect(result.processed).toBe(true);
      expect(result.geofenceEvents).toContain(GeofenceEventType.RADIUS_C_ENTERED);
      expect(mockPrisma.trip.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: TripStatus.ARRIVED },
        }),
      );
    });

    it('should detect Radius B entry (approaching)', async () => {
      const mockTrip = {
        id: 'trip-1',
        order: {
          deliveryLocation: { lat: 6.5244, lng: 3.3792 },
        },
      };

      const gpsPoint = { lat: 6.52, lng: 3.38, accuracy: 10 }; // ~500m from destination

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.trackingPoint.findFirst.mockResolvedValue(null);
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.trackingPoint.create.mockResolvedValue({ id: 'point-1' });
      mockPrisma.geofence.findMany.mockResolvedValue([]);

      const result = await service.processGPSUpdate('trip-1', gpsPoint);

      expect(result.processed).toBe(true);
      expect(result.geofenceEvents).toContain(GeofenceEventType.RADIUS_B_ENTERED);
      expect(mockRedis.publish).toHaveBeenCalled();
    });

    it('should detect Radius A entry (early awareness)', async () => {
      const mockTrip = {
        id: 'trip-1',
        order: {
          deliveryLocation: { lat: 6.5244, lng: 3.3792 },
        },
      };

      const gpsPoint = { lat: 6.5, lng: 3.4, accuracy: 10 }; // ~3km from destination

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.trackingPoint.findFirst.mockResolvedValue(null);
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.trackingPoint.create.mockResolvedValue({ id: 'point-1' });
      mockPrisma.geofence.findMany.mockResolvedValue([]);

      const result = await service.processGPSUpdate('trip-1', gpsPoint);

      expect(result.processed).toBe(true);
      expect(result.geofenceEvents).toContain(GeofenceEventType.RADIUS_A_ENTERED);
    });

    it('should suppress duplicate events within cooldown period', async () => {
      const mockTrip = {
        id: 'trip-1',
        order: {
          deliveryLocation: { lat: 6.5244, lng: 3.3792 },
        },
      };

      const gpsPoint = { lat: 6.5244, lng: 3.3793, accuracy: 10 };

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.trackingPoint.findFirst.mockResolvedValue(null);
      mockRedis.get.mockResolvedValue('1'); // Cooldown active
      mockPrisma.trackingPoint.create.mockResolvedValue({ id: 'point-1' });
      mockPrisma.geofence.findMany.mockResolvedValue([]);

      const result = await service.processGPSUpdate('trip-1', gpsPoint);

      expect(result.processed).toBe(true);
      // Events are detected but not stored due to cooldown
      expect(result.geofenceEvents).toContain(GeofenceEventType.RADIUS_C_ENTERED);
      expect(mockPrisma.geofenceEvent.create).not.toHaveBeenCalled();
      expect(mockPrisma.trip.update).not.toHaveBeenCalled(); // Arrival not processed
    });

    it('should reject GPS points with low accuracy', async () => {
      const gpsPoint = { lat: 6.5244, lng: 3.3792, accuracy: 50 }; // >30m accuracy

      const result = await service.processGPSUpdate('trip-1', gpsPoint);

      expect(result.processed).toBe(false);
      expect(result.reason).toBe('Accuracy too low');
    });

    it('should reject minimal movement updates', async () => {
      const mockTrip = {
        id: 'trip-1',
        order: {
          deliveryLocation: { lat: 6.5244, lng: 3.3792 },
        },
      };

      const lastPoint = { lat: 6.5244, lng: 3.3792, timestamp: new Date() };
      const gpsPoint = { lat: 6.52441, lng: 3.37921, accuracy: 5 }; // <10m movement

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.trackingPoint.findFirst.mockResolvedValue(lastPoint);

      const result = await service.processGPSUpdate('trip-1', gpsPoint);

      expect(result.processed).toBe(false);
      expect(result.reason).toBe('Minimal movement');
    });

    it('should detect polygon entry for warehouse zones', async () => {
      const mockTrip = {
        id: 'trip-1',
        order: {
          deliveryLocation: { lat: 6.5244, lng: 3.3792 },
        },
      };

      const gpsPoint = { lat: 6.5244, lng: 3.3792, accuracy: 10 };

      const warehousePolygon = {
        id: 'geofence-1',
        type: 'POLYGON',
        polygon: [
          { lat: 6.5240, lng: 3.3788 },
          { lat: 6.5248, lng: 3.3788 },
          { lat: 6.5248, lng: 3.3796 },
          { lat: 6.5240, lng: 3.3796 },
        ],
        isActive: true,
      };

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.trackingPoint.findFirst.mockResolvedValue(null);
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.trackingPoint.create.mockResolvedValue({ id: 'point-1' });
      mockPrisma.geofence.findMany.mockResolvedValue([warehousePolygon]);

      const result = await service.processGPSUpdate('trip-1', gpsPoint);

      expect(result.processed).toBe(true);
      expect(result.geofenceEvents).toContain(GeofenceEventType.POLYGON_ENTERED);
    });

    it('should store GPS tracking point', async () => {
      const mockTrip = {
        id: 'trip-1',
        order: {
          deliveryLocation: { lat: 6.5244, lng: 3.3792 },
        },
      };

      const gpsPoint = { lat: 6.5244, lng: 3.3793, accuracy: 10 };

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.trackingPoint.findFirst.mockResolvedValue(null);
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.trackingPoint.create.mockResolvedValue({ id: 'point-1' });
      mockPrisma.geofence.findMany.mockResolvedValue([]);

      await service.processGPSUpdate('trip-1', gpsPoint);

      expect(mockPrisma.trackingPoint.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tripId: 'trip-1',
            lat: 6.5244,
            lng: 3.3793,
            accuracy: 10,
          }),
        }),
      );
    });

    it('should publish events to Redis for real-time updates', async () => {
      const mockTrip = {
        id: 'trip-1',
        order: {
          deliveryLocation: { lat: 6.5244, lng: 3.3792 },
        },
      };

      const gpsPoint = { lat: 6.5244, lng: 3.3793, accuracy: 10 };

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.trackingPoint.findFirst.mockResolvedValue(null);
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.trackingPoint.create.mockResolvedValue({ id: 'point-1' });
      mockPrisma.geofence.findMany.mockResolvedValue([]);

      await service.processGPSUpdate('trip-1', gpsPoint);

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'trip:trip-1:geofence',
        expect.stringContaining('RADIUS_C_ENTERED'),
      );
    });
  });
});
