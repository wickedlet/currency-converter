import { CacheManager, CacheConfig } from '../types';

export class RedisCacheManager implements CacheManager {
  private client: any;
  private config: Required<CacheConfig>;

  constructor(redisClient: any, config: CacheConfig = {}) {
    this.client = redisClient;
    this.config = {
      ttl: config.ttl || 86400, // 24 hours default
      keyPrefix: config.keyPrefix || 'currency_rate',
    };
  }

  private getKey(key: string): string {
    return `${this.config.keyPrefix}:${key}`;
  }

  public async get(key: string): Promise<string | null> {
    try {
      const fullKey = this.getKey(key);
      const value = await this.client.get(fullKey);
      return value;
    } catch (error) {
      console.error('Redis cache get error:', error);
      return null;
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      const expiry = ttl || this.config.ttl;
      
      if (this.client.setEx) {
        // Redis v4+
        await this.client.setEx(fullKey, expiry, value);
      } else {
        // Redis v3 or older
        await this.client.set(fullKey, value, 'EX', expiry);
      }
    } catch (error) {
      console.error('Redis cache set error:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  public async del(key: string): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      await this.client.del(fullKey);
    } catch (error) {
      console.error('Redis cache delete error:', error);
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.getKey(key);
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('Redis cache exists error:', error);
      return false;
    }
  }

  public async clear(pattern?: string): Promise<void> {
    try {
      const searchPattern = pattern 
        ? this.getKey(pattern) 
        : `${this.config.keyPrefix}:*`;
      
      const keys = await this.client.keys(searchPattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Redis cache clear error:', error);
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      const fullKey = this.getKey(key);
      return await this.client.ttl(fullKey);
    } catch (error) {
      console.error('Redis cache TTL error:', error);
      return -1;
    }
  }
}
