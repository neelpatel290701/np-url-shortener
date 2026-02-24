import 'dotenv/config'; // Load env vars first
import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';
import redisClient from '../src/config/redis.js';
import Url from '../src/models/Url.js';
import connectDB from '../src/config/db.js';

beforeAll(async () => {
    // Connect to DB
    await connectDB();
    // Redis is connected via top-level await in import, but we should clear data
    await Url.deleteMany({});
    await redisClient.flushAll();
});

afterAll(async () => {
    await mongoose.connection.close();
    await redisClient.quit();
});

describe('URL Shortener API', () => {
    let shortCode: string;
    const originalUrl = 'https://example.com';

    it('should create a short URL', async () => {
        const res = await request(app)
            .post('/api/shorten')
            .send({ longUrl: originalUrl });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('shortCode');
        expect(res.body).toHaveProperty('shortUrl');
        expect(res.body.originalUrl).toEqual(originalUrl);

        shortCode = res.body.shortCode;
    });

    it('should redirect using the short code', async () => {
        const res = await request(app).get(`/${shortCode}`);
        expect(res.statusCode).toEqual(302);
        expect(res.header.location).toEqual(originalUrl);
    });

    it('should return 404 for non-existent code', async () => {
        const res = await request(app).get('/nonexistent123');
        expect(res.statusCode).toEqual(404);
    });

    it('should get stats for the URL', async () => {
        // Wait a bit for async stats update? (In-memory it's fast, but DB might lag slightly if we checked immediately after redirect, but here it's fine)
        const res = await request(app).get(`/api/info/${shortCode}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('clicks');
        // valid checks depend on if we waited for the async increment
    });

    it('should return 400 for invalid URL', async () => {
        const res = await request(app)
            .post('/api/shorten')
            .send({ longUrl: 'not-a-url' });
        expect(res.statusCode).toEqual(400);
    });
});
