/**
 * Redis service — optional, gracefully degrades if REDIS_URL not set.
 * Used for: Socket.IO adapter, tournament/leaderboard caching.
 */

import { createClient } from 'redis';

let pubClient = null;
let subClient = null;
let isConnected = false;

export async function initRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log('⚠️  REDIS_URL not set — Redis disabled, running without cache');
    return null;
  }

  try {
    pubClient = createClient({ url, socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3000) } });
    subClient = pubClient.duplicate();

    pubClient.on('error', (err) => console.error('Redis pub error:', err.message));
    subClient.on('error', (err) => console.error('Redis sub error:', err.message));

    await Promise.all([pubClient.connect(), subClient.connect()]);
    isConnected = true;
    console.log('✅ Redis connected');
    return { pubClient, subClient };
  } catch (err) {
    console.error('❌ Redis connection failed (continuing without cache):', err.message);
    isConnected = false;
    return null;
  }
}

export function getPubClient() { return pubClient; }
export function getSubClient() { return subClient; }
export function isRedisConnected() { return isConnected; }

/** Cache a value with TTL in seconds. Silent fail if Redis down. */
export async function cacheSet(key, value, ttlSeconds = 60) {
  if (!isConnected || !pubClient) return;
  try {
    await pubClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.warn('Redis cacheSet error:', err.message);
  }
}

/** Get cached value. Returns null if miss or Redis down. */
export async function cacheGet(key) {
  if (!isConnected || !pubClient) return null;
  try {
    const val = await pubClient.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.warn('Redis cacheGet error:', err.message);
    return null;
  }
}

/** Delete a cache key (call on mutation). Silent fail if Redis down. */
export async function cacheDel(...keys) {
  if (!isConnected || !pubClient) return;
  try {
    await Promise.all(keys.map(k => pubClient.del(k)));
  } catch (err) {
    console.warn('Redis cacheDel error:', err.message);
  }
}

/** Delete all keys matching a pattern (e.g. "tournament:*"). */
export async function cacheDelPattern(pattern) {
  if (!isConnected || !pubClient) return;
  try {
    const keys = await pubClient.keys(pattern);
    if (keys.length > 0) await Promise.all(keys.map(k => pubClient.del(k)));
  } catch (err) {
    console.warn('Redis cacheDelPattern error:', err.message);
  }
}
