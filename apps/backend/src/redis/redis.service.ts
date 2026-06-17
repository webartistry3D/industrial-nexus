import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// In-memory fallback storage
class InMemoryStore {
  private store = new Map<string, { value: string; expiresAt?: number }>();
  private subscribers = new Map<string, ((message: string) => void)[]>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, { value });
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async publish(channel: string, message: string): Promise<void> {
    const callbacks = this.subscribers.get(channel) || [];
    callbacks.forEach(cb => cb(message));
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, []);
    }
    this.subscribers.get(channel)!.push(callback);
  }
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(RedisService.name);
  private inMemoryStore = new InMemoryStore();
  private enabled = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.enabled = this.configService.get<string>('REDIS_ENABLED', 'true') === 'true';
    
    if (!this.enabled) {
      this.logger.log('Redis disabled - using in-memory store');
      return;
    }

    try {
      const { default: Redis } = await import('ioredis');
      const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
      
      const client = new Redis(redisUrl);
      const subscriber = new Redis(redisUrl);

      await client.ping();
      this.logger.log('Redis connected successfully');
      
      // Store references for cleanup
      (this as any).client = client;
      (this as any).subscriber = subscriber;
    } catch (error) {
      this.logger.warn('Redis connection failed - falling back to in-memory store');
      this.enabled = false;
    }
  }

  async onModuleDestroy() {
    if (this.enabled) {
      await (this as any).client?.quit();
      await (this as any).subscriber?.quit();
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.enabled) {
      return (this as any).client.get(key);
    }
    return this.inMemoryStore.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    if (this.enabled) {
      await (this as any).client.set(key, value);
    } else {
      await this.inMemoryStore.set(key, value);
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (this.enabled) {
      await (this as any).client.setex(key, seconds, value);
    } else {
      await this.inMemoryStore.setex(key, seconds, value);
    }
  }

  async del(key: string): Promise<void> {
    if (this.enabled) {
      await (this as any).client.del(key);
    } else {
      await this.inMemoryStore.del(key);
    }
  }

  async publish(channel: string, message: string): Promise<void> {
    if (this.enabled) {
      await (this as any).client.publish(channel, message);
    } else {
      await this.inMemoryStore.publish(channel, message);
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    if (this.enabled) {
      const subscriber = (this as any).subscriber;
      await subscriber.subscribe(channel);
      subscriber.on('message', (chan: string, message: string) => {
        if (chan === channel) {
          callback(message);
        }
      });
    } else {
      await this.inMemoryStore.subscribe(channel, callback);
    }
  }
}
