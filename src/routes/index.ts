import { Router, Request, Response } from 'express';
import { shorten, redirect, getStats } from '../controllers/urlController.js';

const router = Router();

// Health check
router.get('/ping', (req: Request, res: Response) => res.send(`ZT-URL-Shortener is up as of ${new Date()}`));

// API routes
router.post('/api/urls/shorten', shorten);
router.get('/api/urls/info/:code', getStats);

// Redirect route (Root level for short codes)
// MUST be last to avoid catching specific routes
router.get('/:code', redirect);

export default router;
