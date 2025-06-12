import { Redis } from '@upstash/redis'

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

if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error('UPSTASH_REDIS_REST_URL is not set');
}
if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_TOKEN is not set');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
}); 