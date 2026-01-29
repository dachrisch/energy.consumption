# Image Hash OCR Caching Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement caching for OCR results based on image hashes to reduce API calls and improve performance.

**Architecture:** 
1. **Cache Model**: Create a global (non-user-filtered) MongoDB model to store image hashes and their corresponding Gemini OCR raw response text.
2. **Hashing Logic**: Calculate SHA-256 hashes of the base64 image data in the API handler.
3. **Lookup & Storage**: Check the cache before calling the Gemini API; if missing, perform the scan and store the result.

**Tech Stack:** Node.js, MongoDB (Mongoose), `crypto`.

---

### Task 1: Create OcrCache Model

**Files:**
- Create: `src/models/OcrCache.ts`

**Step 1: Implement the schema**

```typescript
import mongoose from 'mongoose';

const ocrCacheSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  resultText: { type: String, required: true },
}, { timestamps: true });

// Global cache, no session filtering needed
const OcrCache = mongoose.models.OcrCache || mongoose.model('OcrCache', ocrCacheSchema);
export default OcrCache;
```

**Step 2: Commit**

```bash
git add src/models/OcrCache.ts
git commit -m "feat: add OcrCache model for image hash caching"
```

---

### Task 2: Integrate Caching in OCR Handler

**Files:**
- Modify: `src/api/handler.ts`

**Step 1: Import OcrCache and update handleOcrScan**

```typescript
import OcrCache from '../models/OcrCache';

// Inside handleOcrScan:
const base64Data = image.split(',')[1] || image;
const hash = crypto.createHash('sha256').update(base64Data).digest('hex');

// Check cache
const cached = await OcrCache.findOne({ hash: { $eq: hash } });
let ocrResultText: string;

if (cached) {
  ocrResultText = cached.resultText;
} else {
  const blob = new Blob([Buffer.from(base64Data, 'base64')], { type: 'image/jpeg' });
  ocrResultText = await scanImageWithGemini(blob, apiKey);
  // Save to cache
  await OcrCache.create({ hash, resultText: ocrResultText });
}

const result = parseGeminiResult(ocrResultText);
// ... continue with meter matching ...
```

**Step 2: Commit**

```bash
git add src/api/handler.ts
git commit -m "feat: implement image hash caching in OCR scan handler"
```

---

### Task 3: Verify and Release

**Step 1: Run tests**

```bash
npm run test
```

**Step 2: Trigger Release**

```bash
npm run release:patch
```
