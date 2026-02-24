import winston from 'winston';
import 'winston-daily-rotate-file';
import { v4 as uuidv4 } from 'uuid';
import { getTraceId } from '../utils/tracer.js';

// Placeholder removed, imported instead

const accessTransport = new winston.transports.DailyRotateFile({
    level: 'debug',
    filename: './logs/zen-url-shortener-access-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxFiles: '14d',
    auditFile: './logs/winston-audit.json'
});

const errorTransport = new winston.transports.DailyRotateFile({
    level: 'error',
    filename: './logs/zen-url-shortener-error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxFiles: '14d',
    auditFile: './logs/winston-audit.json'
});

//Log levels: error > warn > info > http > verbose > debug > silly
const logger = winston.createLogger({
    level: process.env.WINSTON_LOG_LEVEL == 'debug' ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.label({
            'label': uuidv4()
        }),
        winston.format.splat(),
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.printf(({ level, message, label, timestamp, }) => {
            return `${timestamp} [${label}] [${getTraceId()}] ${level}: ${message}`
        })
    ),
    transports: [
        accessTransport,
        errorTransport
    ],
});

//
// If we're not in production then log to the `console` with the format:
//
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
        level: 'debug'
    }));
}

export default logger;
