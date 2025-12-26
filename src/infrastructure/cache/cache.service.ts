import { Injectable, Inject } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(
      key,
      ttl,
      typeof value === 'string' ? value : JSON.stringify(value),
    );
  }

  
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  
  async deletePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  
  async clear(): Promise<void> {
    await this.redis.flushdb();
  }

  
  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  
  async getTtl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }
}

