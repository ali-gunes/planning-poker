import Redis, { type RedisOptions } from "ioredis";

// Use a global variable to cache the connection
declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

let redis: Redis;

const getRedisUrl = () => {
    const url = process.env.REDIS_URL;
    if (url) {
        return url;
    }
    throw new Error("REDIS_URL is not defined in the environment");
}

const options: RedisOptions = {
  // This is required for Upstash Redis to work with Vercel
  tls: {},
  connectTimeout: 10000, // 10 seconds
  // Do not retry on connection errors, fail fast
  maxRetriesPerRequest: 0,
  enableOfflineQueue: false,
};

if (process.env.NODE_ENV === 'production') {
  redis = new Redis(getRedisUrl(), options);
} else {
  // In development, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global.redis) {
    global.redis = new Redis(getRedisUrl(), options);
  }
  redis = global.redis;
}

export { redis }; 