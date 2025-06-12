import Redis from "ioredis";

// Use a global variable to cache the connection
declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

let redis: Redis;

const getRedisUrl = () => {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }
    throw new Error("REDIS_URL is not defined in the environment");
}

if (process.env.NODE_ENV === 'production') {
  redis = new Redis(getRedisUrl());
} else {
  // In development, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global.redis) {
    global.redis = new Redis(getRedisUrl());
  }
  redis = global.redis;
}

export { redis }; 