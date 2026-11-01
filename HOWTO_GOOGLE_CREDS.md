## Google Client Credentials — How to Obtain + Configure

### 1️⃣ Open the Google Cloud Console
- Go to <https://console.cloud.google.com/apis/credentials>
- Create a **new project** (or select an existing one). This project owns the OAuth client.

### 2️⃣ Create a Web‑Application OAuth Client
1. Click **CREATE CLIENT** → **Web application**.
2. **Name**: anything you like (e.g. "Energy Monitor Intake").
3. **Authorized JavaScript origins** (must be HTTPS for production, HTTP for localhost):
   - **Development**: `http://localhost` and `http://localhost:3000`
   - **Production**: `https://yourdomain.com` (replace with your real domain)
4. **Authorized redirect URIs** (critical — must match exactly):
   - **Development**: `http://localhost:3000/api/google/callback`
   - **Production**: `https://yourdomain.com/api/google/callback`
5. Click **CREATE**.

You will receive:
- **Client ID** — looks like `1234567890-abc123def456.apps.googleusercontent.com`
- **Client Secret** — a 24‑character string shown **once**. Download it or copy it immediately; it will not be visible again.

> **Important**: The client secret is stored in the app environment variable `GOOGLE_CLIENT_SECRET`. Do **not** commit it to source control.

### 3️⃣ Configure the OAuth Consent Screen
1. In the left navigation, open **APIs & services → OAuth consent screen**.
2. If prompted, **select your project**.
3. Fill in at minimum:
   - **App name**: e.g. "Energy Monitor"
   - **User support email**: your email
   - **Authorized domains**: e.g. `localhost`, your production domain
4. **Data access scopes** — add the two scopes the app requests:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/drive.file`
5. Leave **Verification status** as **Testing** (unverified app). This is allowed for personal use as long as the total Google Accounts granting access stays under 100. Google explicitly lists this case: *"if you are the only user of your app or if your app is used by only a few users, all of whom are known personally to you"*.

> **Do not** set Publishing status to *In production* unless you complete full verification (CASA). For now keep it in *Testing*.

### 4️⃣ Set Environment Variables (in `.env` or your hosting platform)
```
# Google OAuth
GOOGLE_CLIENT_ID=1234567890-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-string-here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/google/callback   # or your production URL
```

### 5️⃣ Run the connection flow
In your app (local dev, port 3000 by default):

1. **Connect Google** — `GET /api/google/connect`
   - Redirects to Google consent screen with scopes `gmail.readonly drive.file`.
   - A signed `state` JWT is passed, containing the user's `userId`.

2. **Google callback** — `GET /api/google/callback`
   - After the user consents, Google redirects back with `code` and `state`.
   - The code is exchanged for an **offline refresh token** (stored encrypted on the User doc).
   - `User.google` gets: `sub`, `email`, `refreshTokenEnc`, `scopes[]`, `connectedAt`.

3. **Sync** — `POST /api/intake/sync` with `{ "providerName": "Your Provider Name" }`
   - Uses the stored refresh token to query Gmail for the provider's mail.
   - Attachments are archived to Drive under `Energy Monitor/<provider>/<year>/`.
   - A JSON sidecar with extracted fields is also stored.

4. **Review intake** — `GET /api/intake/sync` returns a list; you can then accept/reject per‑reading decisions through the UI (IntakeItem status: pending/agrees/conflict/accepted/rejected).

### 6️⃣ What the user sees
- The first time someone connects Google, they will see the **standard Google consent screen** listing the two scopes.
- Because the app is in *Testing* mode, there will be a small **"Unverified app"** badge. This is expected — Google explicitly allows it for personal/few‑user use. The user just clicks **Continue** (or **Advanced** → *Go to ... (unsafe)*).
- After consent, the refresh token is stored. If the user later changes their Google password, the token becomes invalid and the app will surface a **"Reconnect Google"** banner (status `reconnect_required`); clicking the banner repeats the flow.

### 7️⃣ Production checklist (optional, beyond Phase 1)
- Increase the test‑user allowlist if you have >100 beta users (add them in the Cloud Console under **Testing → Add users**).
- When you’re ready to open to the public, you’ll need full OAuth verification (CASA) for the restricted scope `gmail.readonly`. Until then keep the user count < 100 and stay in *Testing* mode.
- Set the `GOOGLE_CALLBACK_URL` to your real domain’s HTTPS endpoint.
- Consider rotating the client secret periodically via Secret Manager if you expose it in code.

### TL;DR — Minimal working setup
```
# .env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/api/google/callback
```

Then in the app:
```
GET /api/google/connect   # user consents
GET /api/google/callback  # app stores encrypted refresh token
POST /api/intake/sync { providerName: "Provider Name" }  # syncs Gmail → Drive
```

That's it — the rest (meter matching, Drive folder creation, reconciliation) is already wired in.