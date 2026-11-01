# Google Provider Intake — Design

Date: 2026-11-01 · Status: Phase 1 (#720) and the Phase 2 backend (#723) are
merged; the intake/comparison UI and background sync are still open.

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

## Phase 2 — sync pipeline (backend merged in #723)

What a sync does today:

```
POST /api/intake/sync
  → Gmail search (per Provider) → download attachment → sha256 dedupe
  → ProviderDocument
  → processDocument()          src/lib/intake/processDocument.ts
       guards → extract → Drive archive (+ JSON sidecar) → planIntake()
  → IntakeItem (pending | agrees | conflict) + Bill
  → GET /api/intake/items, POST /api/intake/items/:id/accept|reject, GET /api/intake/bills
```

- `planIntake()` is the pure half: meter lookup by normalized number, agreement
  or conflict against the readings **of the matched meter only**, and a bill
  only when the meter is known.
- Documents that were already processed are skipped, so a retried sync is a
  no-op on top of the existing `sha256` dedupe.
- A document that fails extraction is recorded as `failed` with its error and
  does not abort the rest of the batch.
- The Drive root folder (`Energy Monitor`) is created lazily and cached on
  `User.google.rootFolderId`; `google.lastSyncAt` is stamped per sync.
- The per-user Gemini key is decrypted before it is handed to the extractor;
  without one, PDFs fail with a readable message while CSV/HTML/text still work.
- Variance is never stored: `/api/intake/bills` derives expected cost and
  variance from the meter's contract on read.

### Remaining

| Item | Notes |
|---|---|
| Intake list UI | A card listing `GET /api/intake/items?status=pending,conflict` with Accept/Reject and a "create meter" shortcut for items whose meter number is unknown. Endpoints exist and are tested; only the SolidJS view is missing. |
| Bill comparison UI | `GET /api/intake/bills` already returns billed, expected and variance per bill. The card must reuse that data instead of recomputing the formula (the earlier `BillComparisonCard` duplicated it and hardcoded a non-EUR currency). |
| Background sync (step 5) | Scheduled `POST /api/intake/sync` per connected user via the existing Ofelia/cron setup, guarded by `google.lastSyncAt` (15 min) and switched to Gmail `history.list` with `google.lastHistoryId` instead of a full search. |

### Test coverage

- `src/lib/intake/__tests__/processDocument.test.ts` — guards
  (unsupported/oversized/empty/already-processed), PDF-without-key, and
  `planIntake` (meter matching incl. leading zeros, same-meter-only comparison,
  agree/conflict, bill attribution).
- `src/api/controllers/intake.controller.test.ts` — CSV sync end-to-end into
  `IntakeItem`s plus Drive file and sidecar, failed-extraction bookkeeping,
  sha256 idempotency, item listing/filtering, accept/reject rules (unknown
  meter, double accept, duplicate meter/date, cross-user 404, malformed id,
  wrong method) and the bill variance numbers.
- No E2E for Drive/Gemini: both are injectable (`DriveClientLike`,
  `extractDocument`), so unit coverage is the contract; a live smoke test stays
  manual via `HOWTO_GOOGLE_CREDS.md`.

### Open decisions

- Gemini key per user vs. deployment-wide: still per user (`User.googleApiKey`),
  matching the OCR flow; missing key → `failed` with a clear message.
- Year bucket for the Drive folder: bill `periodEnd` when stated, else
  `receivedAt`.
- Auto-accept: none. Even an `agrees` item stays a staged fact; promotion into
  `Reading` is an explicit `POST …/accept`.
