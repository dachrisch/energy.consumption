# Top Priority Security Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address critical security vulnerabilities including hardcoded secrets, plaintext API keys in DB, exposed API keys in URLs, and lack of rate limiting.

**Architecture:** 
1. Move JWT secret validation to a strict check (no fallback).
2. Implement symmetric encryption (AES-256) for sensitive fields in MongoDB.
3. Refactor Gemini OCR calls to use headers/proxying to avoid URL query parameter leakage.
4. Add Express middleware for rate limiting on sensitive API endpoints.

**Tech Stack:** Node.js, Express, `express-rate-limit`, `crypto-js`, Mongoose.

---

### Task 1: Secure JWT Secret

**Files:**
- Modify: `src/api/handler.ts:12`
- Modify: `src/api/server.ts`

**Step 1: Update handler to throw error if JWT_SECRET is missing**

```typescript
// src/api/handler.ts
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set.');
}
```

**Step 2: Ensure JWT_SECRET is passed in server.ts (Production)**

No code change expected in `server.ts` but verify it reads from `process.env`.

**Step 3: Commit**

```bash
git add src/api/handler.ts
git commit -m "security: remove hardcoded JWT secret fallback"
```

---

### Task 2: Encrypt Google API Keys in MongoDB

**Files:**
- Create: `src/lib/encryption.ts`
- Modify: `src/models/User.ts`
- Modify: `src/api/handler.ts` (Usage)

**Step 1: Create encryption utility**

```typescript
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
    throw new Error('CRITICAL: ENCRYPTION_KEY environment variable is not set.');
}

export function encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}
```

**Step 2: Update User model and handler to use encryption**

In `src/api/handler.ts`, update `handleProfileUpdate` and any point where `googleApiKey` is saved/retrieved to call `encrypt()` and `decrypt()`.

**Step 3: Commit**

```bash
git add src/lib/encryption.ts src/models/User.ts src/api/handler.ts
git commit -m "security: implement AES-256 encryption for Google API keys"
```

---

### Task 3: Secure Gemini API Key Exposure

**Files:**
- Modify: `src/lib/geminiOcrv2.ts`

**Step 1: Move API Key from URL query to Header**

```typescript
// src/lib/geminiOcrv2.ts
// Replace: const url = `...?key=${apiKey}`;
// With:
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

const response = await fetch(url, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey // Secure header instead of query param
    },
    body: JSON.stringify(payload)
});
```

**Step 2: Commit**

```bash
git add src/lib/geminiOcrv2.ts
git commit -m "security: move Gemini API key from query param to header"
```

---

### Task 4: Implement Rate Limiting

**Files:**
- Modify: `src/api/server.ts`

**Step 1: Add rate limiting middleware**

```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // Limit each IP to 10 register/login requests per window
	message: 'Too many authentication attempts, please try again after 15 minutes',
    standardHeaders: true,
	legacyHeaders: false,
});

const ocrLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 20, // Limit each IP to 20 OCR scans per hour
	message: 'OCR usage limit reached, please try again later',
    standardHeaders: true,
	legacyHeaders: false,
});

app.use('/api/register', authLimiter);
app.use('/api/login', authLimiter);
app.use('/api/ocr/scan', ocrLimiter);
```

**Step 2: Commit**

```bash
git add src/api/server.ts
git commit -m "security: add rate limiting to sensitive endpoints"
```
