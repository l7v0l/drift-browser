# Sign-in with Google / Microsoft

Drift can remember a Google or Microsoft (Hotmail / Outlook) account. This is **not** browser sync and it does not log you in to websites. What it does:

- shows your account in the toolbar;
- adds `login_hint=<your email>` to Google and Microsoft sign-in pages, so the account chooser starts with your email filled in. You still sign in yourself.

On first launch Drift offers to sign in (or **Not now**). After a successful sign-in you choose **Save** (kept on this device) or **Cancel** (discarded). Sign out any time from the account button. Private windows never use the account.

## What is stored

Only the profile: provider, email, name and picture URL. No password and no tokens: the access token is used once to read the profile and then dropped.

## How it works

OAuth 2.0 authorization-code flow with PKCE, run in your normal browser:

1. Drift opens the provider's sign-in page in the system browser.
2. The provider redirects to a one-shot server on `127.0.0.1` (random port) that only accepts the matching `state`.
3. Drift exchanges the code for a token, reads the OpenID profile, and shows Save / Cancel.

## Setting it up (needed once per build)

OAuth client ids belong to whoever builds the app, so they are not in the repository. Without them the buttons show "not configured".

Copy `.env.example` to `.env` and fill in:

```
MAIN_VITE_GOOGLE_CLIENT_ID=
MAIN_VITE_GOOGLE_CLIENT_SECRET=
MAIN_VITE_MICROSOFT_CLIENT_ID=
```

`.env` is git-ignored. For releases, add the same names as GitHub Actions secrets (the release workflow passes them to the build).

### Google

1. Google Cloud Console → *APIs & Services* → *OAuth consent screen* → configure (External), add scopes `openid`, `email`, `profile`.
2. *Credentials* → *Create credentials* → *OAuth client ID* → application type **Desktop app**.
3. Put the client id and secret in `.env`. (For Desktop apps Google treats the secret as non-confidential.)

Loopback redirects (`http://127.0.0.1:<port>`) are allowed automatically for Desktop clients.

### Microsoft

1. Azure portal → *Microsoft Entra ID* → *App registrations* → *New registration*.
2. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**.
3. *Authentication* → *Add a platform* → *Mobile and desktop applications* → add redirect URI `http://localhost`, and enable *Allow public client flows*.
4. Put the *Application (client) ID* in `.env`. No secret is used.

### Check it

```bash
npm run dev
```

Click **Continue with Google** or **Continue with Microsoft** in the welcome dialog (or the account button in the toolbar).
