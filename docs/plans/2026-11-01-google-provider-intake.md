# Google Provider Intake — Design

Date: 2026-11-01 · Status: Phase 1 merged (OAuth + Gmail ingest of document
metadata); extraction → Drive archive → `IntakeItem` staging is planned below.

## Goal

Pull provider finance data (consumption + billed cost) into the app from Gmail,
archive originals to Drive, and consolidate with what the user entered —
without ever overwriting manual readings.

## Why Gmail, not Drive

- `drive.file` only sees files the app creates; reading a folder the user drops
  into needs `drive.readonly` (restricted → CASA for a public app).
- `gmail.readonly` is the same restricted tier as `drive.readonly`, so it adds no
  new verification posture. The OAuth client runs **unverified / Testing** —
  Google explicitly allows this for personal use (warning screen + 100-account
  cap). The app is already in that posture via queen's `drive.readonly`.
- One consent flow, one encrypted refresh token, two scopes:
  `gmail.readonly` + `drive.file`.
- IMAP + app password was considered and rejected: the stored credential can read
  the whole mailbox, and Google keeps pushing that path toward deprecation.

## Architecture

```
Gmail (provider mail)
  → /api/google/connect   (browser redirect, state JWT)
  → /api/google/callback  (exchange code → encrypted refresh token on User)
  → /api/intake/sync      (per-provider: list → fetch → extract → archive → stage)
  → IntakeItem (pending/agrees/conflict/accepted/rejected)
  → Reading (+ source, providerDocId) / Bill
```

Provider data never writes straight into `Reading`. It lands in `IntakeItem`
first; the user (or an unambiguous match) promotes it.

## Models

| Model | Purpose |
|---|---|
| `Provider` | name, senders, subject hints, optional raw Gmail query, default unit |
| `ProviderDocument` | one ingested file; `sha256` makes sync idempotent; `driveFileId` + `sidecarDriveId` |
| `IntakeItem` | one extracted fact: `pending`/`agrees`/`conflict`/`accepted`/`rejected` |
| `Bill` | period consumption + billed amount vs what contract rates compute |
| `User.google` | `sub`, `email`, `refreshToken` (encrypted), `scopes`, `status: ok\|reconnect_required` |
| `Reading.source` | `manual\|ocr\|import\|provider`; `providerDocId` |

## Extraction

- **PDF** → Gemini (`gemini-2.5-flash`, JSON prompt). Needs a per-user API key
  (the existing `googleApiKey` field).
- **CSV/TSV/semicolon** → `parseCsv` + heuristic header matching (date/value/unit),
  flexible German/ISO dates and comma/point numbers.
- **HTML/plain text** → regex for meter readings + amounts.
- **XML / .xls** → rejected with a clear message (export as CSV).

## Reconciliation

- Meter matched by normalized meter number (alphanumeric only, leading-zero
  tolerant).
- Reading matched within ±5 days, ±1 unit tolerance.
- Agreement → `agrees` (auto-verified). Disagreement → `conflict`, both kept.
- Unknown meter number → `pending` with "create meter?" rather than auto-creating.
- `Bill` variance = `billed − expected` (contract rate × consumption).

## Drive layout

`Energy Monitor/<provider>/<YYYY>/<original-name>` plus a `.json` sidecar of the
extracted fields, so re-processing never needs Gmail again.

## In-app flow

Profile page now has a **Google Connectivity** card:
- Not connected → "Connect Google" button (redirects to `/api/google/connect`).
- Connected → green status + "Reconnect".
- Authorization expired (password change) → warning + "Reconnect Google".

On return, `?google=connected` shows a toast and the session revalidates.

## Environment

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/api/google/callback
```

See `HOWTO_GOOGLE_CREDS.md` for the full setup guide.

## Phase 2 — remaining pipeline work (planned, not implemented)

Phase 1 ships the OAuth round-trip and the Gmail listing loop: `POST
/api/intake/sync` authenticates, searches, downloads each attachment, hashes it
and stores a `ProviderDocument` with `status: 'new'`. It stops there.

The extraction, archive and reconciliation layers exist and are unit-tested, but
nothing in `src/` calls them yet:

| Module | Would be used by |
|---|---|
| `lib/intake/extract.ts` (`extractDocument`) | nothing |
| `lib/intake/geminiDocument.ts` (`extractPdfText`) | only `extract.ts` |
| `lib/google/drive.ts` (`ensureFolder`, `archiveDocument`) | nothing |
| `lib/intake/reconcile.ts` (`findMeterByNumber`, `classifyReading`, …) | nothing |
| `models/Bill.ts`, `models/IntakeItem.ts` | nothing |

So today a synced document is visible in Mongo but never archived to Drive,
never parsed, and never reaches the user as an `IntakeItem`. Phase 2 closes that
gap in four steps (plus an optional fifth for background sync).

### Step 1 — one document pipeline function (the missing middle)

New `src/lib/intake/processDocument.ts`, deliberately dependency-injected in the
same style as `drive.ts`/`gmail.ts` so it can be tested without network:

```ts
processDocument({
  document,            // ProviderDocument (lean) incl. buffer or gmailAttachmentId
  provider,            // Provider: name, defaultUnit
  extractedApiKey,     // decrypted User.googleApiKey, optional
  drive,               // DriveClientLike
  rootFolderId,        // User.google.rootFolderId
  userId,
}): Promise<ProcessResult>   // { status, intakeItemIds, billId, driveFileId, sidecarDriveId }
```

Order of operations (each step persisted, so a retry never redoes finished work):

1. **Guard**: skip when `!isSupported(document.mimeType)` → `status: 'failed'`
   with `error: 'unsupported format'`; skip when `size > MAX_ATTACHMENT_BYTES`
   (15 MiB) without downloading.
2. **Extract**: `extractDocument({ mimeType, buffer, textBody, unitHint: provider.defaultUnit, apiKey })`.
   `textBody` comes from `collectTextBody(payload)` for HTML mail parts, so a
   provider that puts the numbers in the body still works without an attachment.
3. **Archive**: `ensureFolder(drive, 'Energy Monitor')` once per user, cached in
   `User.google.rootFolderId`; then `archiveDocument(drive, { rootFolderId, providerName: provider.name, year: (periodEnd ?? receivedAt).getUTCFullYear(), fileName, mimeType, buffer, extracted })`.
   Store `driveFileId`, `driveWebLink`, `sidecarDriveId`, `extracted`,
   `processedAt`, `status: 'parsed'`.
4. **Reconcile** — for each extracted reading: `findMeterByNumber(meters, doc.meterNumber)`
   over the user's meters; unknown meter → one `IntakeItem` with
   `status: 'pending'` and note `"unknown meter number"` (never auto-create a
   meter); known meter → `classifyReading(candidate, existingReadings)` →
   `agrees` / `conflict` / `pending` with `matchedReadingId`.
5. **Bill** — when the document carries a bill and a meter matched: write one
   `Bill` (period, consumption, amountGross/Net) and compute
   `computeVariance(amountGross, expectedCostForBill(contract, consumption, periodDays(...)))`
   with the contract active at `periodEnd`. No contract → variance stays `null`.
6. **Failure isolation**: any thrown error marks only that document
   `status: 'failed'` + `error` and is reported in the sync response; the rest of
   the batch continues.

Idempotency: `ProviderDocument.sha256` already dedupes at sync time; additionally
`processDocument` returns early for `status` in `('parsed', 'imported')` so a
retry of the same document is a no-op.

### Step 2 — call it from the sync endpoint

In `src/api/controllers/intake/sync`, after the existing
`ProviderDocument.create(...)`:

- decrypt `user.googleApiKey` once per request (`getUserGoogleAccount` already
  loads the user — extend it to return the key and `rootFolderId`);
- build one `driveFor(client)` per sync and reuse it for the whole batch;
- `await processDocument(...)` per new document, collecting
  `{ documentId, status, intakeItems, billId }` into the existing `processed[]`
  array;
- update `User.google.lastSyncAt` and, when a folder was created,
  `User.google.rootFolderId`;
- keep returning 200 with per-document results (an individual failure must not
  fail the request), 409 on `invalid_grant`, 500 only for request-level errors.

Also raise `maxResults` (currently 20) to a configurable `INTAKE_MAX_MESSAGES`
and stop after the first `ProviderDocument` that fails twice, so a broken
provider cannot burn the whole rate-limit budget.

### Step 3 — accept / reject the staged items

Endpoints in `intake.controller.ts`, registered in `router.ts`:

| Route | Effect |
|---|---|
| `GET /api/intake/items?status=pending,conflict` | list the user's items (always `.setOptions({ userId })`) |
| `POST /api/intake/items/:id/accept` | promote: `Reading.create({ meterId, date, value, source: 'provider', providerDocId })` (or `Bill`), item → `accepted`; refused with 409 when the meter is unknown — the user must pick/create a meter first |
| `POST /api/intake/items/:id/reject` | item → `rejected`, no data written |

UI: a **Provider intake** card on the dashboard listing pending/conflict items
with value, date, meter and the note text, Accept/Reject buttons, and a
"create meter" shortcut for items whose meter number is unknown. Uses the
existing toast + card patterns; no new dependency.

### Step 4 — bill comparison view

Read-only card comparing `Bill` against contract rates over the same period:
billed, expected, variance absolute/percent (`computeVariance`), grouped per
meter and year. Sourced from a single aggregate per user.

### Step 5 (optional) — background sync

Once Steps 1–4 are stable: a scheduled `POST /api/intake/sync` per connected user
via the existing Ofelia/cron infrastructure, with a per-user lock
(`User.google.lastSyncAt` + 15 min guard) and `lastHistoryId` incremental Gmail
`history.list` instead of a full search. Keep the manual endpoint for the UI.

### Test plan for Phase 2

- `src/lib/intake/__tests__/processDocument.test.ts` — fake `DriveClientLike`
  (same helper as `drive.test.ts`), stubbed `extractDocument`; assert: unsupported
  mime → `failed`; oversized attachment is not downloaded; happy path writes
  Drive file + sidecar + `IntakeItem`s; unknown meter → `pending` item and no
  meter created; `agrees` vs `conflict` mapping; bill variance with and without a
  contract; second call is a no-op.
- `src/api/controllers/intake.controller.test.ts` — extend the existing memory-mongo
  suite: sync with a mocked Gmail payload that yields a PDF → one document, one
  `IntakeItem`; a document that fails extraction → 200 with `status: 'failed'`
  and `ProviderDocument.error` set; accept/reject endpoint happy paths and the
  409 for an unknown meter; cross-user access returns 404.
- No E2E for Drive/Gemini — both are injectable, so unit coverage is the
  contract. A live smoke test stays manual via `HOWTO_GOOGLE_CREDS.md`.

### Open decisions for Phase 2

- Gemini key per user vs. deployment-wide: the field exists (`User.googleApiKey`),
  the OCR flow already uses it, so Phase 2 keeps it per user and reports
  `needs_review` when it is missing (extraction of PDFs is then skipped, CSVs
  still work).
- Year bucket for the Drive folder: `periodEnd` when the document states a
  period, else `receivedAt`.
- Auto-accept: not planned. Even an `agrees` item is only marked verified; the
  promotion into `Reading` stays an explicit user action.
