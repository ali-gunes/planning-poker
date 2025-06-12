import Redis from 'ioredis';

// This is the recommended pattern for managing database connections in a serverless environment like Vercel.
// It uses a global cache to ensure a single, stable connection is created and reused across function invocations.

const getRedisUrl = () => {
    const url = process.env.REDIS_URL;
    if (url) {
        return url;
    }
    throw new Error("REDIS_URL is not defined in the environment");
}

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

// If the client is not already cached, create a new one.
const redis = global.redis || new Redis(getRedisUrl(), {
  tls: {},
  // These settings are recommended by Upstash for Vercel deployments
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// In development, cache the client in the global scope to prevent
// too many connections during hot reloads.
if (process.env.NODE_ENV !== 'production') {
  global.redis = redis;
}

export { redis }; 