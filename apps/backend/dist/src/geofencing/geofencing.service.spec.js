"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const geofencing_service_1 = require("./geofencing.service");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const client_1 = require("@prisma/client");
describe('GeofencingService', () => {
    let service;
    let prisma;
    let redis;
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                geofencing_service_1.GeofencingService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: redis_service_1.RedisService, useValue: mockRedis },
            ],
        }).compile();
        service = module.get(geofencing_service_1.GeofencingService);
        prisma = module.get(prisma_service_1.PrismaService);
        redis = module.get(redis_service_1.RedisService);
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
            const gpsPoint = { lat: 6.5244, lng: 3.3793, accuracy: 10 };
            mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
            mockPrisma.trackingPoint.findFirst.mockResolvedValue(null);
            mockRedis.get.mockResolvedValue(null);
            mockPrisma.trackingPoint.create.mockResolvedValue({ id: 'point-1' });
            mockPrisma.geofence.findMany.mockResolvedValue([]);
            const result = await service.processGPSUpdate('trip-1', gpsPoint);
            expect(result.processed).toBe(true);
            expect(result.geofenceEvents).toContain(client_1.GeofenceEventType.RADIUS_C_ENTERED);
            expect(mockPrisma.trip.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { status: client_1.TripStatus.ARRIVED },
            }));
        });
        it('should detect Radius B entry (approaching)', async () => {
            const mockTrip = {
                id: 'trip-1',
                order: {
                    deliveryLocation: { lat: 6.5244, lng: 3.3792 },
                },
            };
            const gpsPoint = { lat: 6.52, lng: 3.38, accuracy: 10 };
            mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
            mockPrisma.trackingPoint.findFirst.mockResolvedValue(null);
            mockRedis.get.mockResolvedValue(null);
            mockPrisma.trackingPoint.create.mockResolvedValue({ id: 'point-1' });
            mockPrisma.geofence.findMany.mockResolvedValue([]);
            const result = await service.processGPSUpdate('trip-1', gpsPoint);
            expect(result.processed).toBe(true);
            expect(result.geofenceEvents).toContain(client_1.GeofenceEventType.RADIUS_B_ENTERED);
            expect(mockRedis.publish).toHaveBeenCalled();
        });
        it('should detect Radius A entry (early awareness)', async () => {
            const mockTrip = {
                id: 'trip-1',
                order: {
                    deliveryLocation: { lat: 6.5244, lng: 3.3792 },
                },
            };
            const gpsPoint = { lat: 6.5, lng: 3.4, accuracy: 10 };
            mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
            mockPrisma.trackingPoint.findFirst.mockResolvedValue(null);
            mockRedis.get.mockResolvedValue(null);
            mockPrisma.trackingPoint.create.mockResolvedValue({ id: 'point-1' });
            mockPrisma.geofence.findMany.mockResolvedValue([]);
            const result = await service.processGPSUpdate('trip-1', gpsPoint);
            expect(result.processed).toBe(true);
            expect(result.geofenceEvents).toContain(client_1.GeofenceEventType.RADIUS_A_ENTERED);
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
            mockRedis.get.mockResolvedValue('1');
            mockPrisma.trackingPoint.create.mockResolvedValue({ id: 'point-1' });
            mockPrisma.geofence.findMany.mockResolvedValue([]);
            const result = await service.processGPSUpdate('trip-1', gpsPoint);
            expect(result.processed).toBe(true);
            expect(result.geofenceEvents).toContain(client_1.GeofenceEventType.RADIUS_C_ENTERED);
            expect(mockPrisma.geofenceEvent.create).not.toHaveBeenCalled();
            expect(mockPrisma.trip.update).not.toHaveBeenCalled();
        });
        it('should reject GPS points with low accuracy', async () => {
            const gpsPoint = { lat: 6.5244, lng: 3.3792, accuracy: 50 };
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
            const gpsPoint = { lat: 6.52441, lng: 3.37921, accuracy: 5 };
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
            expect(result.geofenceEvents).toContain(client_1.GeofenceEventType.POLYGON_ENTERED);
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
            expect(mockPrisma.trackingPoint.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    tripId: 'trip-1',
                    lat: 6.5244,
                    lng: 3.3793,
                    accuracy: 10,
                }),
            }));
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
            expect(mockRedis.publish).toHaveBeenCalledWith('trip:trip-1:geofence', expect.stringContaining('RADIUS_C_ENTERED'));
        });
    });
});
//# sourceMappingURL=geofencing.service.spec.js.map