import mongoose from 'mongoose';

const ocrCacheSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  resultText: { type: String, required: true },
}, { timestamps: true });

// Global cache, no session filtering needed as the same image should yield same OCR result regardless of user
const OcrCache = mongoose.models.OcrCache || mongoose.model('OcrCache', ocrCacheSchema);
export default OcrCache;
