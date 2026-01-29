# Fix Security Alerts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve all open CodeQL security alerts including NoSQL injection, insecure encryption, and missing rate limiting.

**Architecture:** 
1. **Prevent NoSQL Injection**: Wrap all user-provided query parameters in Mongoose queries with the `$eq` operator.
2. **Modernize Encryption**: Switch from `crypto-js` to Node's native `crypto` module using `aes-256-gcm` for authenticated encryption of Google API keys.
3. **Comprehensive Rate Limiting**: Apply rate limiting to all static asset and SPA fallback routes.

**Tech Stack:** Node.js, Express, Mongoose, `crypto`.

---

### Task 1: Fix NoSQL Injections in API Handler

**Files:**
- Modify: `src/api/handler.ts`

**Step 1: Update findOne and findById calls**

Ensure all queries involving `email`, `id`, `meterId`, etc., use `$eq` for user-provided values.

```typescript
// Example fix:
// OLD: const user = await User.findOne({ email });
// NEW: const user = await User.findOne({ email: { $eq: email } });
```

**Step 2: Apply to all relevant routes**
- `handleRegister` (email)
- `handleLogin` (email)
- `handleProfileUpdate` (email)
- `handleMeters` (id)
- `handleMeterItem` (id)
- `getGeminiApiKey` (userId)
- `handleReadings` (meterId)
- `handleReadingItem` (id)
- `handleContracts` (id, meterId)
- `handleContractItem` (id)

**Step 3: Commit**

```bash
git add src/api/handler.ts
git commit -m "security: prevent NoSQL injection by using \$eq operator in queries"
```

---

### Task 2: Fix NoSQL Injection in Reading Service

**Files:**
- Modify: `src/lib/readingService.ts`

**Step 1: Update processBulkReadings**

```typescript
// src/lib/readingService.ts
// OLD: const existing = await ReadingModel.find({ meterId: reading.meterId, ... });
// NEW: const existing = await ReadingModel.find({ meterId: { $eq: reading.meterId }, ... });
```

**Step 2: Commit**

```bash
git add src/lib/readingService.ts
git commit -m "security: prevent NoSQL injection in bulk reading processing"
```

---

### Task 3: Modernize Encryption Utility (Fix Alert 18)

**Files:**
- Modify: `src/lib/encryption.ts`

**Step 1: Implement AES-256-GCM using Node crypto**

Maintain a fallback for `CryptoJS` to decrypt existing keys, but use `aes-256-gcm` for all new encryptions.

```typescript
import crypto from 'crypto';
import CryptoJS from 'crypto-js';

// ... key derivation logic ...

export function encrypt(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(ciphertext: string): string {
    if (!ciphertext) return '';
    try {
        // Try AES-GCM first (new format)
        const data = Buffer.from(ciphertext, 'base64');
        const iv = data.subarray(0, 12);
        const tag = data.subarray(12, 28);
        const encrypted = data.subarray(28);
        const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    } catch (e) {
        // Fallback to CryptoJS (old format)
        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, KEY);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch {
            return ciphertext;
        }
    }
}
```

**Step 2: Commit**

```bash
git add src/lib/encryption.ts
git commit -m "security: upgrade to AES-256-GCM for authenticated encryption"
```

---

### Task 4: Fix Missing Rate Limiting (Fix Alert 17)

**Files:**
- Modify: `src/api/server.ts`

**Step 1: Apply global limiter to all routes**

```typescript
// src/api/server.ts
// Move apiLimiter to be applied before static and SPA routes
app.use(apiLimiter);
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => { ... });
```

**Step 2: Commit**

```bash
git add src/api/server.ts
git commit -m "security: apply rate limiting to static and SPA fallback routes"
```
