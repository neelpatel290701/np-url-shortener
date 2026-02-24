import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Trust Proxy (for Nginx)
app.set('trust proxy', 'loopback');

import { v4 as uuidv4 } from 'uuid';
import { storage } from './utils/tracer.js';

// Tracing Middleware
app.use((req, res, next) => {
    const traceId = uuidv4();
    res.setHeader('X-Trace-Id', traceId);
    storage.run(traceId, () => {
        next();
    });
});

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Body parser
app.use(express.json());

// Serve static files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Routes
app.use('/', routes);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});

export default app;
