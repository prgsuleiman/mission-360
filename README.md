# Mission 360

Mission 360 is a local-and-worldwide mission board. Individuals, student groups, nonprofits, community organizations, and small businesses can post practical work; people choose missions that fit their skills and return a defined result. Missions can include research and enquiries, public information gathering, creative work, technology, events, peer support, and local community help.

## Why it exists

For many young people, building a life can feel like starting from zero: finding trustworthy guidance, getting a first chance to contribute, and navigating everyday systems can take more effort than it should. Mission 360 is meant to make useful next steps easier to find. It lets people ask for help, share local knowledge, work together, and build a visible record of completed contributions. The goal is to connect people to what already exists around them—not make them figure it out alone.

## Run locally

Requirements: Node.js 20 or newer. The app has no npm dependencies.

```sh
cp .env.example .env
# Fill in the provider values you want to exercise.
npm start
```

Open <http://localhost:4173>. To check the server and API paths:

```sh
npm test
```

`.env` is ignored by Git. Never commit PayPal client secrets or OpenAI API keys.

## Deploy a public demo

The repository includes a Render Blueprint in [`render.yaml`](render.yaml). Open [Render's Blueprint deploy flow](https://dashboard.render.com/blueprint/new?repo=https://github.com/prgsuleiman/mission-360) and deploy the `mission-360` service on the Free plan. The service uses Supabase for persistent missions; the free web service may sleep after 15 minutes without traffic and take about a minute to wake. Add `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `OPENAI_API_KEY` to the service's Environment settings to enable provider-backed sandbox checkout and model matching. Until then, both features remain clearly marked demo fallbacks.

After Render assigns the public URL, add that URL to Supabase Auth's allowed redirect URLs. The server uses Render's `RENDER_EXTERNAL_URL` automatically for magic-link redirects.

## Supabase

The shared board uses Supabase Auth and the `public.missions` table. The browser receives only the publishable key; mission access is protected by PostgreSQL row-level security. For a fresh project, run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor. Existing installations can apply the ordered files in `supabase/migrations/`.

Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SITE_URL` in `.env`. In Supabase Auth, allow the local/deployed `SITE_URL` as a redirect URL and enable email magic links. Posting and accepting missions require a signed-in account. Do not use a service-role or secret key in the app.

## AI matching

Mission matching is a core feature: the model ranks missions against a person's skills, interests, location preference, and available time, then explains each fit. Add `OPENAI_API_KEY` and optionally `OPENAI_MODEL` to `.env`. Without a key, the app reports and uses a clearly marked local demo matcher. The server bounds request sizes and filters model results to mission IDs supplied by the app.

## PayPal Sandbox

PayPal is used to fund a cash-reward mission through Checkout Orders. Add a Sandbox `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`; keep `PAYPAL_API_BASE=https://api-m.sandbox.paypal.com`. Without credentials, checkout is simulated and explicitly identified as demo mode. Do not use live credentials for the hackathon demo.

Captured funds go to the configured platform merchant. Mission 360 does **not** yet distribute funds to helpers, hold funds in escrow, resolve disputes, or verify completion. PayPal availability and currencies vary by market, so the app also supports locally arranged and non-cash rewards. The project is a demo, not a payment or employment service.

## Trust and safety scope

The current MVP handles ordinary local and remote missions, enquiries, and public information tasks. It is not a law-enforcement, emergency, or private-investigation service. Do not post requests to confront, follow, identify, accuse, or detain a person, or to collect private or sensitive personal information. Real missing-person or crime-related cases are out of scope until an authorized-partner verification and private tip-routing workflow exists. For emergencies, contact local emergency services.

Before a wider launch, add organization verification, moderation and reporting, dispute handling, privacy review, and country-specific payment and legal checks.
