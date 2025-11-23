import { redis } from './redis';

const DEFAULT_TTL = 3600; // 1 hour

export const cache = {
    async get<T>(key: string): Promise<T | null> {
        if (!redis) return null;
        try {
            return await redis.get<T>(key);
        } catch (error) {
            console.warn('Redis get error:', error);
            return null;
        }
    },

    async set(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> {
        if (!redis) return;
        try {
            await redis.set(key, value, { ex: ttl });
        } catch (error) {
            console.warn('Redis set error:', error);
        }
    },

    async del(key: string): Promise<void> {
        if (!redis) return;
        try {
            await redis.del(key);
        } catch (error) {
            console.warn('Redis del error:', error);
        }
    },

    async invalidatePattern(pattern: string): Promise<void> {
        if (!redis) return;
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (error) {
            console.warn('Redis invalidatePattern error:', error);
        }
    },
};
