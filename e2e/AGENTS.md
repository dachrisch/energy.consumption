# `e2e/` — Playwright end-to-end tests

Browser-level specs for the full user flows. Repo-wide commands, CI and style live in [`../AGENTS.md`](../AGENTS.md); this file holds the rules specific to E2E tests.

## Scope & runtime

- Specs are `e2e/*.spec.ts`. The config is `playwright.config.ts` at the repo root and sets `testDir: './e2e'`.
- Run from the repo root with `npm run test:e2e`. The only project is Desktop Chrome (chromium).
- Specs run **serially**: `fullyParallel: false` and `workers: 1`. Do not rely on cross-spec parallelism or on data left behind by another spec.
- `baseURL` is `http://localhost:3000`. Playwright starts the app itself with `npm run dev` (which brings up the in-memory MongoDB) and waits up to 120 s. Locally an existing server on port 3000 is reused; in CI (`process.env.CI`) it is not.
- CI behaviour: `forbidOnly`, 2 retries, `list` reporter, trace on first retry and screenshot on failure.

## Test conventions

- Log in through the UI at `/login` with the test account used by the existing specs (`test@example.com` / `password123`), then navigate the app as a user would. These are throwaway dev-database credentials, not production users.
- Create records with a unique timestamp suffix (e.g. `E2E-${Date.now()}`) so repeated runs don't collide.
- Use visible, user-facing locators and assertions (`page.locator('.card', { hasText: name })`, `toHaveURL`, `toBeVisible`). The main login → add meter → log reading flows are marked `test.slow()`.
- Responsive checks set the viewport explicitly (e.g. 375×667 or 320×568) and assert the mobile `.btm-nav` visibility or the absence of horizontal overflow.
- The `npm run dev` web server owns the in-memory database; specs create their own data through the UI rather than seeding it directly.

## Linting

`npm run lint` (oxlint) excludes `e2e/**` via `.oxlintrc.json`; keep specs type-correct and consistent with the neighbouring tests anyway.
