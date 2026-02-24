import Url, { IUrl } from '../models/Url.js';
import redisClient from '../config/redis.js';
import { generateShortCode } from '../utils/shortCodeGenerator.js';
import logger from '../config/logger.js';

const CACHE_TTL = 3600 * 24; // 24 hours

export const shortenUrl = async (originalUrl: string): Promise<IUrl> => {
    // Simple validation (can be enhanced)
    if (!originalUrl) throw new Error('Original URL is required');

    let shortCode: string = '';
    let isUnique = false;
    let retries = 0;

    // Retry logic for collision (unlikely with 7 chars base62 but good practice)
    while (!isUnique && retries < 5) {
        shortCode = generateShortCode();
        const existing = await Url.findOne({ shortCode });
        if (!existing) {
            isUnique = true;
        }
        retries++;
    }

    if (!isUnique) throw new Error('Failed to generate unique code, please try again.');

    const newUrl = new Url({
        longUrl: originalUrl,
        shortCode
    });
    logger.info('ShortenUrl: Saving to DB');
    await newUrl.save();

    // Optionally cache immediately? standard practice is cache-aside on read.
    // But we can prime the cache.
    await redisClient.set(shortCode, originalUrl, {
        EX: CACHE_TTL
    });

    return newUrl;
};

export const getOriginalUrl = async (shortCode: string): Promise<string | null> => {
    // 1. Check Cache
    const cachedUrl = await redisClient.get(shortCode);
    if (cachedUrl) {
        logger.info('getOriginalUrl: Cache hit');
        return cachedUrl;
    }

    // 2. Check DB
    logger.info('getOriginalUrl: Cache miss');
    const urlDoc = await Url.findOne({ shortCode });
    if (!urlDoc) {
        logger.info('getOriginalUrl: No URL found');
        return null;
    }

    // 3. Set Cache
    await redisClient.set(shortCode, urlDoc.longUrl, {
        EX: CACHE_TTL
    });

    return urlDoc.longUrl;
};

export const getUrlStats = async (shortCode: string): Promise<IUrl | null> => {
    return await Url.findOne({ shortCode });
};

export const incrementClicks = async (shortCode: string): Promise<void> => {
    // Fire and forget, or await. For analytics, fire and forget is faster for the user.
    // But here we might want to ensure it counts.
    await Url.findOneAndUpdate({ shortCode }, { $inc: { clicks: 1 }, lastAccessed: Date.now() });
};
