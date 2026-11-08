# Pilot authentication setup

The application now supports Supabase email/password sign-in. The Express API validates each bearer token with Supabase Auth and resolves the requested workspace from the server's membership records. `X-Tenant-Id` selects a workspace only after membership is checked; `X-Actor-Name` is ignored.

## Configure the Supabase project

1. Use the provided project: `jjfzzppihiatvmeoxlgo` (`https://jjfzzppihiatvmeoxlgo.supabase.co`) and enable email/password sign-in.
2. Create the pilot user in Supabase Auth. Keep public sign-up disabled unless the onboarding flow is ready.
3. Copy the user's Auth UUID from the Supabase Users page.
4. Set the following variables in the server environment and the Vite environment. Use the project URL and publishable key in both places; never place a Supabase secret/service key in browser variables.

```dotenv
SUPABASE_URL=https://jjfzzppihiatvmeoxlgo.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
PILOT_AUTH_EMAIL=pilot@example.com
PILOT_TENANT_ID=tenant-jeneconk-hq

VITE_SUPABASE_URL=https://jjfzzppihiatvmeoxlgo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
VITE_PILOT_TENANT_ID=tenant-jeneconk-hq
```

5. Set `PILOT_AUTH_EMAIL` to the pilot user's confirmed Supabase Auth email (or use `PILOT_AUTH_USER_ID` with the Auth UUID). Restart the server and rebuild the frontend after setting `VITE_` variables. On the allowlisted pilot user's first authenticated request, the server creates an owner membership for `PILOT_TENANT_ID` if that user has no memberships yet. Additional users must be provisioned with trusted membership records; the invitation endpoint intentionally returns `501` until real invitation delivery is connected.

## Local demo mode

For a disposable local-only demo, set both `ALLOW_UNAUTHENTICATED_DEMO_API=true` and `VITE_ALLOW_UNAUTHENTICATED_DEMO_API=true`, with `NODE_ENV` other than `production`. This uses the seeded single workspace. Never enable it on a shared or deployed environment.

## Render free pilot

The repository includes a Render Blueprint for a free web service. Create a Blueprint from this repository and provide the requested Supabase URL, publishable key, confirmed pilot email, and optional Gemini key in Render's environment-variable form. The Vite-prefixed Supabase settings must be available during the build.

This is a disposable demo deployment. The app's business records and background jobs still use `data_store.json`, while Render Free has an ephemeral filesystem and may sleep or restart the service. Demo edits and jobs can be lost; use seeded/sample data only. Supabase Free can also pause after a week of low activity. Move application records and durable jobs to Supabase Postgres before relying on saved work or using real customer data.

## Current limits

- There is no self-service registration or invitation flow yet.
- Authenticated workspace records are loaded from the existing API, but most UI mutations are still in-memory and the server still uses a JSON file store. This is not yet shared, durable production storage.
- The seeded company/contact/project directory is shared sample intelligence. It is not live or licensed provider data.
- Enrichment, tender intake, fake credit purchases, and email delivery are disabled or return unavailable responses until real providers and operational controls are connected.
- The pilot bootstrap maps one Supabase Auth UUID to the configured seed workspace. Replace this bootstrap convention with managed membership administration before onboarding more than the pilot account.
