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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
class InMemoryStore {
    constructor() {
        this.store = new Map();
        this.subscribers = new Map();
    }
    async get(key) {
        const item = this.store.get(key);
        if (!item)
            return null;
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value) {
        this.store.set(key, { value });
    }
    async setex(key, seconds, value) {
        this.store.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
    }
    async del(key) {
        this.store.delete(key);
    }
    async publish(channel, message) {
        const callbacks = this.subscribers.get(channel) || [];
        callbacks.forEach(cb => cb(message));
    }
    async subscribe(channel, callback) {
        if (!this.subscribers.has(channel)) {
            this.subscribers.set(channel, []);
        }
        this.subscribers.get(channel).push(callback);
    }
}
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
        this.inMemoryStore = new InMemoryStore();
        this.enabled = false;
    }
    async onModuleInit() {
        this.enabled = this.configService.get('REDIS_ENABLED', 'true') === 'true';
        if (!this.enabled) {
            this.logger.log('Redis disabled - using in-memory store');
            return;
        }
        try {
            const { default: Redis } = await Promise.resolve().then(() => require('ioredis'));
            const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
            const client = new Redis(redisUrl);
            const subscriber = new Redis(redisUrl);
            await client.ping();
            this.logger.log('Redis connected successfully');
            this.client = client;
            this.subscriber = subscriber;
        }
        catch (error) {
            this.logger.warn('Redis connection failed - falling back to in-memory store');
            this.enabled = false;
        }
    }
    async onModuleDestroy() {
        if (this.enabled) {
            await this.client?.quit();
            await this.subscriber?.quit();
        }
    }
    async get(key) {
        if (this.enabled) {
            return this.client.get(key);
        }
        return this.inMemoryStore.get(key);
    }
    async set(key, value) {
        if (this.enabled) {
            await this.client.set(key, value);
        }
        else {
            await this.inMemoryStore.set(key, value);
        }
    }
    async setex(key, seconds, value) {
        if (this.enabled) {
            await this.client.setex(key, seconds, value);
        }
        else {
            await this.inMemoryStore.setex(key, seconds, value);
        }
    }
    async del(key) {
        if (this.enabled) {
            await this.client.del(key);
        }
        else {
            await this.inMemoryStore.del(key);
        }
    }
    async publish(channel, message) {
        if (this.enabled) {
            await this.client.publish(channel, message);
        }
        else {
            await this.inMemoryStore.publish(channel, message);
        }
    }
    async subscribe(channel, callback) {
        if (this.enabled) {
            const subscriber = this.subscriber;
            await subscriber.subscribe(channel);
            subscriber.on('message', (chan, message) => {
                if (chan === channel) {
                    callback(message);
                }
            });
        }
        else {
            await this.inMemoryStore.subscribe(channel, callback);
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map