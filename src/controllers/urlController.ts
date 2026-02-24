import { Request, Response } from 'express';
import * as shortenService from '../services/shortenService.js';
import logger from '../config/logger.js';

export const shorten = async (req: Request, res: Response) => {
    try {
        const { longUrl } = req.body || {};
        // Basic URL validation
        try {
            new URL(longUrl);
        } catch (e: any) {
            logger.error(`URL Validation Error: ${e.message}`);
            return res.status(400).json({ error: 'Invalid URL format', details: e.message });
        }

        const result = await shortenService.shortenUrl(longUrl);

        const shortUrl = `${process.env.BASE_URL}/${result.shortCode}`;

        res.status(201).json({
            shortCode: result.shortCode,
            shortUrl: shortUrl,
            originalUrl: result.longUrl
        });
    } catch (error) {
        logger.error('ShortenUrl: Error', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const redirect = async (req: Request, res: Response) => {
    try {
        const code = req.params.code as string;
        const originalUrl = await shortenService.getOriginalUrl(code);

        if (originalUrl) {
            // Async increment stats (don't block redirect)
            shortenService.incrementClicks(code).catch(err => logger.error('Stats error:', err));
            return res.redirect(originalUrl);
        } else {
            return res.status(404).json({ error: 'URL not found' });
        }
    } catch (error) {
        logger.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getStats = async (req: Request, res: Response) => {
    try {
        const code = req.params.code as string;
        const stats = await shortenService.getUrlStats(code);

        if (stats) {
            res.json(stats);
        } else {
            res.status(404).json({ error: 'URL not found' });
        }
    } catch (error) {
        logger.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
