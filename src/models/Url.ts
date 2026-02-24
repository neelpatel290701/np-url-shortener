import mongoose from 'mongoose';

export interface IUrl extends mongoose.Document {
    shortCode: string;
    longUrl: string;
    clicks: number;
    lastAccessed: Date;
    createdAt: Date;
}

const urlSchema = new mongoose.Schema({
    shortCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
    },
    longUrl: {
        type: String,
        required: true,
        trim: true,
    },
    clicks: {
        type: Number,
        required: true,
        default: 0,
    },
    lastAccessed: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.model<IUrl>('Url', urlSchema);
