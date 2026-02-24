import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGO_URI;
        const dbName = process.env.DB_NAME;
        if (!mongoURI) {
            throw new Error('MONGO_URI environment variable is not defined');
        }
        const conn = await mongoose.connect(mongoURI, {
            dbName: dbName
        });
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        logger.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
