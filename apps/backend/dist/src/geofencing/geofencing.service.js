"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeofencingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const client_1 = require("@prisma/client");
let GeofencingService = class GeofencingService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.COOLDOWN_SECONDS = 120;
        this.MIN_MOVEMENT_THRESHOLD = 10;
    }
    async processGPSUpdate(tripId, point) {
        if (point.accuracy && point.accuracy > 30) {
            return { processed: false, reason: 'Accuracy too low' };
        }
        const lastPoint = await this.getLastGPSPoint(tripId);
        if (lastPoint) {
            const distance = this.calculateDistance({ lat: lastPoint.lat, lng: lastPoint.lng }, point);
            if (distance < this.MIN_MOVEMENT_THRESHOLD) {
                return { processed: false, reason: 'Minimal movement' };
            }
        }
        await this.storeGPSPoint(tripId, point);
        const geofenceResults = await this.checkGeofences(tripId, point);
        for (const result of geofenceResults) {
            if (result.eventType) {
                await this.emitGeofenceEvent(tripId, result);
            }
        }
        return {
            processed: true,
            geofenceEvents: geofenceResults.filter(r => r.eventType).map(r => r.eventType),
        };
    }
    async checkGeofences(tripId, point) {
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            include: { order: true },
        });
        if (!trip)
            return [];
        const destination = trip.order.deliveryLocation;
        const results = [];
        const distance = this.calculateDistance(point, destination);
        const radiusA = 5000;
        const radiusB = 1000;
        const radiusC = 100;
        if (distance <= radiusC) {
            results.push({
                eventType: client_1.GeofenceEventType.RADIUS_C_ENTERED,
                distance,
                insidePolygon: false,
            });
        }
        else if (distance <= radiusB) {
            results.push({
                eventType: client_1.GeofenceEventType.RADIUS_B_ENTERED,
                distance,
                insidePolygon: false,
            });
        }
        else if (distance <= radiusA) {
            results.push({
                eventType: client_1.GeofenceEventType.RADIUS_A_ENTERED,
                distance,
                insidePolygon: false,
            });
        }
        const geofences = await this.prisma.geofence.findMany({
            where: { isActive: true },
        });
        for (const geofence of geofences) {
            if (geofence.type === 'POLYGON' && geofence.polygon) {
                const polygon = geofence.polygon;
                const insidePolygon = this.isPointInPolygon(point, polygon);
                if (insidePolygon) {
                    results.push({
                        eventType: client_1.GeofenceEventType.POLYGON_ENTERED,
                        distance: 0,
                        insidePolygon: true,
                        geofenceId: geofence.id,
                    });
                }
            }
        }
        return results;
    }
    async emitGeofenceEvent(tripId, result) {
        if (!result.eventType)
            return;
        const cooldownKey = `geofence:${tripId}:${result.eventType}`;
        const cooldownActive = await this.redis.get(cooldownKey);
        if (cooldownActive) {
            return;
        }
        await this.redis.setex(cooldownKey, this.COOLDOWN_SECONDS, '1');
        if (result.geofenceId) {
            await this.prisma.geofenceEvent.create({
                data: {
                    tripId,
                    geofenceId: result.geofenceId,
                    eventType: result.eventType,
                    lat: 0,
                    lng: 0,
                    triggeredAt: new Date(),
                },
            });
        }
        if (result.eventType === client_1.GeofenceEventType.RADIUS_C_ENTERED) {
            await this.prisma.trip.update({
                where: { id: tripId },
                data: { status: client_1.TripStatus.ARRIVED },
            });
        }
        await this.redis.publish(`trip:${tripId}:geofence`, JSON.stringify({
            eventType: result.eventType,
            timestamp: new Date().toISOString(),
            distance: result.distance,
        }));
    }
    async getLastGPSPoint(tripId) {
        const point = await this.prisma.trackingPoint.findFirst({
            where: { tripId },
            orderBy: { timestamp: 'desc' },
        });
        return point;
    }
    async storeGPSPoint(tripId, point) {
        await this.prisma.trackingPoint.create({
            data: {
                tripId,
                lat: point.lat,
                lng: point.lng,
                accuracy: point.accuracy,
                timestamp: new Date(),
            },
        });
    }
    calculateDistance(p1, p2) {
        const R = 6371e3;
        const φ1 = (p1.lat * Math.PI) / 180;
        const φ2 = (p2.lat * Math.PI) / 180;
        const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
        const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    isPointInPolygon(point, polygon) {
        let inside = false;
        let j = polygon.length - 1;
        for (let i = 0; i < polygon.length; i++) {
            const pi = polygon[i];
            const pj = polygon[j];
            if (((pi.lng > point.lng) !== (pj.lng > point.lng)) &&
                (point.lat < ((pj.lat - pi.lat) * (point.lng - pi.lng)) / (pj.lng - pi.lng) + pi.lat)) {
                inside = !inside;
            }
            j = i;
        }
        return inside;
    }
};
exports.GeofencingService = GeofencingService;
exports.GeofencingService = GeofencingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], GeofencingService);
//# sourceMappingURL=geofencing.service.js.map