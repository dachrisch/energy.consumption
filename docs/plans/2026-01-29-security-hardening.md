# Security Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve four critical security vulnerabilities: hardcoded secrets, plaintext sensitive data in DB, API key leakage in URLs, and lack of rate limiting.

**Architecture:** 
1. **Strict Secrets**: Remove fallback values for `JWT_SECRET` and `ENCRYPTION_KEY`, forcing process termination if missing.
2. **At-Rest Encryption**: Implement transparent AES-256 encryption for user-provided Google API keys before saving to MongoDB.
3. **In-Transit Privacy**: Move API keys from URL query parameters to secure `x-goog-api-key` headers for Gemini API calls.
4. **Rate Limiting**: Apply IP-based rate limiting to authentication and expensive OCR endpoints.

**Tech Stack:** Node.js, Express, `express-rate-limit`, `crypto-js`, Mongoose.

---

### Task 1: Enforce Strict Secrets

**Files:**
- Modify: `src/api/handler.ts:12`
- Modify: `src/api/server.ts`

**Step 1: Remove JWT_SECRET fallback**

```typescript
// src/api/handler.ts
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1); 
}
```

**Step 2: Add validation to server.ts**

Ensure the production server also validates its environment variables on startup.

**Step 3: Commit**

```bash
git add src/api/handler.ts
git commit -m "security: enforce strict JWT_SECRET requirement"
```

---

### Task 2: Encrypt Google API Keys in MongoDB

**Files:**
- Create: `src/lib/encryption.ts`
- Modify: `src/models/User.ts`
- Modify: `src/api/handler.ts`

**Step 1: Create encryption utility**

```typescript
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: ENCRYPTION_KEY environment variable is required in production.');
}

// Fallback for dev only to prevent breaking local setup
const KEY = ENCRYPTION_KEY || 'dev-encryption-key-321';

export function encrypt(text: string): string {
    if (!text) return '';
    return CryptoJS.AES.encrypt(text, KEY).toString();
}

export function decrypt(ciphertext: string): string {
    if (!ciphertext) return '';
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        console.error('Decryption failed:', e);
        return '';
    }
}
```

**Step 2: Update handler to encrypt on save and decrypt on read**

In `src/api/handler.ts`:
- Update `handleProfileUpdate` to encrypt `googleApiKey`.
- Update `handleSession` and `handleOcrScan` (where keys are used) to decrypt them.

**Step 3: Commit**

```bash
git add src/lib/encryption.ts src/api/handler.ts
git commit -m "security: encrypt Google API keys at rest using AES-256"
```

---

### Task 3: Secure Gemini API Key In-Transit

**Files:**
- Modify: `src/lib/geminiOcrv2.ts`

**Step 1: Refactor fetch to use headers**

```typescript
// src/lib/geminiOcrv2.ts
// OLD: const url = `...?key=${apiKey}`;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

const response = await fetch(url, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey // Secure header
    },
    body: JSON.stringify(payload)
});
```

**Step 2: Commit**

```bash
git add src/lib/geminiOcrv2.ts
git commit -m "security: move Gemini API key to secure headers"
```

---

### Task 3: Implement Rate Limiting

**Files:**
- Modify: `src/api/server.ts`

**Step 1: Configure and apply limiters**

```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per window
	standardHeaders: true,
	legacyHeaders: false,
});

const authLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 10, // Limit each IP to 10 registration/login attempts per hour
	message: 'Too many accounts created from this IP, please try again after an hour',
    standardHeaders: true,
	legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/register', authLimiter);
app.use('/api/login', authLimiter);
```

**Step 2: Commit**

```bash
git add src/api/server.ts
git commit -m "security: implement IP-based rate limiting on sensitive routes"
```
