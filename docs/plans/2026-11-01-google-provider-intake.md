# Google Provider Intake — Design

Date: 2026-11-01 · Status: implemented (Phase 1 core pipeline)

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

## Remaining (out of scope for this implementation)

- Accept/Reject UI for `IntakeItem` items.
- Bill comparison view showing variance.
- Background sync (currently manual `POST /api/intake/sync`).