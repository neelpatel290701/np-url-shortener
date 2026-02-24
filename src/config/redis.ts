import { createClient } from 'redis';

import logger from './logger.js';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not defined');
}

const redisClient = createClient({
    url: redisUrl
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

await redisClient.connect();

export default redisClient;
