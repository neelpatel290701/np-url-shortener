import './config/env.js'; // Must be first
import app from './app.js';
import connectDB from './config/db.js';
// import './config/redis.js'; // Initialize Redis connection
import logger from './config/logger.js';

// Connect to Database
connectDB();

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  logger.info(`NP-URL-Shortener Server running on port ${PORT}`);
});

