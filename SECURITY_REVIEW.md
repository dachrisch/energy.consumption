# Security and Code Review Report

**Application:** EnergyMonitor (energy.consumption)
**Version:** 3.7.1
**Review Date:** 2026-01-29
**Reviewer:** Automated Security Analysis

---

## Executive Summary

This document presents findings from an intensive security and code review of the EnergyMonitor application. The application is a full-stack web application built with SolidJS (frontend) and Express.js/MongoDB (backend) for tracking energy consumption and utility bills.

**Overall Risk Level: MEDIUM-HIGH**

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 6 |
| Medium | 9 |
| Low | 5 |
| Informational | 4 |

---

## Critical Findings

### CRIT-01: Hardcoded Default JWT Secret

**File:** `src/api/handler.ts:12`

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-123';
```

**Risk:** If the `JWT_SECRET` environment variable is not set in production, the application defaults to `'dev-secret-123'`. Any attacker knowing this default can forge valid JWT tokens and impersonate any user.

**Impact:** Complete authentication bypass, full account takeover for all users.

**Recommendation:**
- Remove the default fallback entirely
- Fail application startup if `JWT_SECRET` is not configured
- Use a cryptographically random 256-bit (32-byte) secret minimum

---

### CRIT-02: Google API Key Stored in Plaintext

**File:** `src/models/User.ts:7`

```typescript
googleApiKey: { type: String },
```

**Risk:** User-provided Google Gemini API keys are stored unencrypted in MongoDB. A database breach exposes all API keys.

**Impact:** Compromised keys can be used for unauthorized Google API access, incurring costs to users and potentially accessing their Google account resources.

**Recommendation:**
- Encrypt API keys at rest using AES-256-GCM with a server-side key
- Consider using a secrets manager (AWS Secrets Manager, HashiCorp Vault)
- Alternatively, never store the key and require it per-session

---

### CRIT-03: API Key Exposed in URL Query Parameter

**File:** `src/lib/geminiOcrv2.ts:7`

```typescript
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
```

**Risk:** API keys in URL query parameters are logged by web servers, proxies, CDNs, and browser history. This is a well-known anti-pattern.

**Impact:** API key leakage through standard logging mechanisms.

**Recommendation:**
- Use the `Authorization: Bearer` header instead
- If the Google API requires the key in URL, proxy through a server-side endpoint that doesn't log query parameters

---

### CRIT-04: No Rate Limiting on Authentication Endpoints

**File:** `src/api/handler.ts:78-90`, `src/api/handler.ts:53-76`

**Risk:** The `/api/login` and `/api/register` endpoints have no rate limiting. Attackers can perform unlimited brute force attempts.

**Impact:**
- Account compromise via credential stuffing
- Denial of service through registration spam
- User enumeration (see HIGH-01)

**Recommendation:**
- Implement rate limiting middleware (e.g., `express-rate-limit`)
- Suggested limits: 5 failed login attempts per IP per minute
- Add CAPTCHA after 3 failed attempts
- Implement account lockout after 10 failed attempts

---

## High Severity Findings

### HIGH-01: User Enumeration via Error Messages

**File:** `src/api/handler.ts:62-65`, `src/api/handler.ts:81-84`

```typescript
// Registration
res.end(JSON.stringify({ error: 'User already exists' }));

// Login
res.end(JSON.stringify({ error: 'Invalid credentials' }));
```

**Risk:** The registration endpoint reveals whether an email is registered. Combined with different error messages, attackers can enumerate valid user accounts.

**Recommendation:** Return generic messages:
- Registration: "If this email is not registered, a confirmation will be sent"
- Login: "Invalid email or password" (same message for both cases)

---

### HIGH-02: No Password Strength Requirements

**File:** `src/api/handler.ts:67-72`

```typescript
if (!password) {
  res.statusCode = 400;
  res.end(JSON.stringify({ error: 'Password required' }));
  return;
}
```

**Risk:** Passwords can be as short as 1 character. Weak passwords are easily compromised.

**Recommendation:**
- Minimum 12 characters
- Require mix of uppercase, lowercase, numbers, and symbols
- Check against common password lists (Have I Been Pwned API)

---

### HIGH-03: Misleading Security Claim in UI

**File:** `src/pages/Profile.tsx:119`

```tsx
<p class="...">Enable AI-powered meter scanning. Your key is stored securely.</p>
```

**Risk:** The UI claims the API key is "stored securely" but it's stored in plaintext (see CRIT-02). This is misleading to users.

**Recommendation:** Either encrypt the key properly or update the messaging to reflect reality.

---

### HIGH-04: No Rate Limiting on OCR Endpoint

**File:** `src/api/handler.ts:208-244`

**Risk:** The `/api/ocr/scan` endpoint calls external Google APIs. Without rate limiting:
- Users can abuse the endpoint causing API quota exhaustion
- Attackers can cause cost escalation for users with their own API keys

**Recommendation:** Implement per-user rate limiting (e.g., 10 scans per minute).

---

### HIGH-05: Unbounded Bulk Import

**File:** `src/lib/readingService.ts:7`

```typescript
export async function processBulkReadings(readings: any[], ...)
```

**Risk:** No limit on the size of bulk import arrays. An attacker could submit millions of readings, causing:
- Memory exhaustion (OOM)
- Database performance degradation
- Denial of service

**Recommendation:**
- Limit array size (e.g., max 10,000 readings per import)
- Process in batches with streaming
- Add request timeout

---

### HIGH-06: Missing HTTPS Enforcement

**Files:** `src/api/server.ts`, `nginx.conf`

**Risk:** No HTTP to HTTPS redirect. Sessions, credentials, and API keys can be intercepted on unsecured networks.

**Recommendation:**
- Add HTTPS redirect middleware in Express
- Configure nginx for SSL termination
- Set `Secure` flag on cookies in production

---

## Medium Severity Findings

### MED-01: Missing Security Headers

**File:** `src/api/server.ts`

**Risk:** No security headers configured:
- No `Content-Security-Policy` (CSP)
- No `X-Content-Type-Options`
- No `X-Frame-Options`
- No `X-XSS-Protection`
- No `Strict-Transport-Security`

**Recommendation:** Add `helmet` middleware:
```typescript
import helmet from 'helmet';
app.use(helmet());
```

---

### MED-02: No CORS Configuration

**File:** `src/api/server.ts`

**Risk:** No explicit CORS policy. While browsers enforce same-origin by default, explicit configuration provides defense in depth.

**Recommendation:**
```typescript
import cors from 'cors';
app.use(cors({ origin: 'https://yourdomain.com', credentials: true }));
```

---

### MED-03: Request Body Spread Without Validation

**File:** `src/api/handler.ts:126`, `src/api/handler.ts:145`, `src/api/handler.ts:257`, `src/api/handler.ts:272`, `src/api/handler.ts:288`, `src/api/handler.ts:303`

```typescript
const meter = await Meter.create({ ...req.body, userId });
const updated = await Meter.findOneAndUpdate({ _id: id }, { $set: req.body }, ...);
```

**Risk:** Request body is spread directly into database operations. Attackers can:
- Inject unexpected fields
- Attempt to overwrite `userId` (though this is protected)
- Set fields like `_id`, `createdAt`, `updatedAt`

**Recommendation:**
- Explicitly destructure and validate expected fields
- Use a validation library (Zod, Joi)
- Whitelist allowed fields before spreading

---

### MED-04: No Email Format Validation (Backend)

**File:** `src/api/handler.ts:60-65`

**Risk:** Email is only validated on frontend (`type="email"`). Backend accepts any string.

**Recommendation:** Add email validation:
```typescript
import { isEmail } from 'validator';
if (!isEmail(email)) { ... }
```

---

### MED-05: JWT Token Lifetime Too Long

**File:** `src/api/handler.ts:86`

```typescript
const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
```

**Risk:** 7-day token lifetime means a stolen token remains valid for a week. No refresh token mechanism exists.

**Recommendation:**
- Short-lived access tokens (15-60 minutes)
- Implement refresh token rotation
- Add token revocation capability

---

### MED-06: Globally Unique Meter Number Without User Scope

**File:** `src/models/Meter.ts:6`

```typescript
meterNumber: { type: String, required: true, unique: true },
```

**Risk:** Meter numbers are globally unique across all users. This could:
- Allow user enumeration (try creating a meter with a number that fails = another user has it)
- Cause collisions if two users have the same physical meter

**Recommendation:** Change unique constraint to compound index on `(meterNumber, userId)`.

---

### MED-07: No Audit Logging

**Risk:** No logging of:
- Authentication attempts (success/failure)
- Data modifications
- Administrative actions
- API access patterns

**Impact:** Cannot investigate security incidents or maintain compliance.

**Recommendation:** Implement structured logging with:
- Timestamp, user ID, action, resource, result
- Ship to centralized logging (ELK, CloudWatch, etc.)

---

### MED-08: Cookie Not Marked Secure in Production

**File:** `src/api/handler.ts:87`

```typescript
res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax`);
```

**Risk:** Cookie is missing `Secure` flag. If accidentally accessed over HTTP, the cookie is exposed.

**Recommendation:**
```typescript
const securePart = process.env.NODE_ENV === 'production' ? '; Secure' : '';
res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax${securePart}`);
```

---

### MED-09: No CSRF Token Protection

**Risk:** Relies solely on `SameSite=Lax` for CSRF protection. While effective for modern browsers, older browsers may not support it.

**Recommendation:** Add explicit CSRF token validation for state-changing requests.

---

## Low Severity Findings

### LOW-01: Version Disclosure

**File:** `vite.config.ts:49-51`, `src/pages/Profile.tsx:137`

**Risk:** Application version is exposed in the UI. Attackers can target known vulnerabilities for specific versions.

**Recommendation:** Consider hiding version in production or moving to admin-only area.

---

### LOW-02: No Account Lockout Mechanism

**Risk:** No account lockout after failed login attempts facilitates brute force.

**Recommendation:** Lock account after 5-10 failed attempts with email notification.

---

### LOW-03: No Two-Factor Authentication

**Risk:** Password-only authentication is increasingly insufficient for sensitive data.

**Recommendation:** Implement optional TOTP-based 2FA.

---

### LOW-04: Dependency Version Ranges

**File:** `package.json`

**Risk:** Uses caret (`^`) version ranges. Minor/patch updates could introduce vulnerabilities.

**Recommendation:**
- Lock exact versions in production
- Regular dependency audits with `npm audit`

---

### LOW-05: No Password Reset Mechanism

**Risk:** Users cannot recover accounts if they forget passwords. May lead to:
- Account abandonment
- Support overhead
- Insecure workarounds

**Recommendation:** Implement email-based password reset with time-limited tokens.

---

## Informational Findings

### INFO-01: Development Script Contains Hardcoded Test Credentials

**File:** `e2e/full-flow.spec.ts:10`, `e2e/navigation.spec.ts:8`

```typescript
await page.fill('input[type="password"]', 'password123');
```

**Note:** These are test credentials. Ensure they don't match any production accounts.

---

### INFO-02: TypeScript Strict Mode Enabled (Positive)

**File:** `tsconfig.json`

The project uses TypeScript strict mode, which helps prevent type-related bugs.

---

### INFO-03: Session Isolation Implemented (Positive)

**File:** `src/models/sessionFilter.ts`

The `applyPreFilter` middleware provides strong data isolation between users by automatically filtering all database queries by `userId`.

---

### INFO-04: Secure Password Hashing (Positive)

**File:** `src/api/handler.ts:72`

Uses bcrypt with 10 rounds, which is currently acceptable for password hashing.

---

## Code Quality Observations

### Strong Points
1. **TypeScript strict mode** - Reduces runtime errors
2. **Data isolation middleware** - Prevents cross-user data access
3. **HttpOnly cookies** - Protects against XSS token theft
4. **Bcrypt password hashing** - Industry standard
5. **Mongoose schema validation** - Type enforcement at database level
6. **Comprehensive test coverage** - E2E and unit tests present

### Areas for Improvement
1. **Input validation** - Needs systematic validation layer
2. **Error handling** - Some errors expose internal details
3. **API documentation** - No OpenAPI/Swagger spec
4. **Dependency injection** - Hard-coded dependencies limit testability
5. **Configuration management** - Mix of env vars and hardcoded values

---

## Remediation Priority Matrix

| Priority | Findings | Effort | Impact |
|----------|----------|--------|--------|
| P0 (Immediate) | CRIT-01, CRIT-04 | Low | Critical |
| P1 (This Sprint) | CRIT-02, CRIT-03, HIGH-01, HIGH-02 | Medium | High |
| P2 (Next Sprint) | HIGH-04, HIGH-05, HIGH-06, MED-01, MED-02 | Medium | Medium-High |
| P3 (Backlog) | MED-03 through MED-09 | Medium | Medium |
| P4 (Enhancement) | LOW-01 through LOW-05 | Low-Medium | Low |

---

## Compliance Considerations

### GDPR
- **Missing:** User data export functionality
- **Missing:** Account deletion capability
- **Missing:** Consent management

### OWASP Top 10 Coverage

| Vulnerability | Status |
|--------------|--------|
| A01: Broken Access Control | Partial - Missing rate limiting |
| A02: Cryptographic Failures | Issue - Plaintext API keys |
| A03: Injection | Good - Mongoose ORM protects |
| A04: Insecure Design | Issue - Default JWT secret |
| A05: Security Misconfiguration | Issue - Missing headers |
| A06: Vulnerable Components | Needs audit |
| A07: Auth Failures | Issues - No lockout, weak passwords |
| A08: Software/Data Integrity | Good - Signed tokens |
| A09: Logging Failures | Issue - No security logging |
| A10: SSRF | Good - Limited external calls |

---

## Conclusion

The EnergyMonitor application has a solid foundation with good practices like TypeScript strict mode, data isolation middleware, and bcrypt password hashing. However, several critical and high-severity issues need immediate attention:

1. **JWT Secret Default** - Must be fixed before any production deployment
2. **API Key Storage** - Encrypt or redesign key handling
3. **Rate Limiting** - Essential for production use
4. **Input Validation** - Systematic validation layer needed

The development team should prioritize P0 items immediately and plan P1/P2 items for upcoming sprints.

---

*Report generated by automated security analysis. Manual verification recommended for all findings.*
