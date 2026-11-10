# Campus Missions

Campus Missions is a student community board for small, useful projects. Student clubs, campus groups, and students post missions; others find work that fits their skills, accept it, and mark it complete. Missions can be limited to a campus or open to remote students worldwide. Mission types include research and enquiries, community work, creative work, technology and data, events, peer support, and career projects. Posters can say what evidence or deliverable should come back.

## Run locally

Requires Node.js 18 or newer. There are no package dependencies.

```sh
npm start
```

Then open http://localhost:4173. Without credentials, mission matching uses a local demo matcher and reward checkout is explicitly labeled as simulated.

## Enable a shared worldwide board

Create a dedicated Supabase project, expose the `public` schema through its Data API, run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor, and set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SITE_URL` in the server environment. In Supabase Auth, allow the `SITE_URL` as a redirect URL and enable email magic links. The browser sends only the publishable key and signed-in user's access token; row-level security limits mission creation, acceptance, and completion. Do not use a Supabase secret or service-role key in the app.

When configured, the board reads and writes shared missions in Supabase and asks users to sign in before posting or accepting. The demo still runs without Supabase, but browser-only missions are temporary. For a hosted global launch, deploy the Node server and Supabase project in suitable regions and configure the deployed HTTPS URL as `SITE_URL`.

## Connect PayPal sandbox

Create sandbox REST API credentials in the PayPal developer dashboard, then set these environment variables before starting the server:

```sh
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
```

The app loads PayPal Checkout Buttons and creates and captures sandbox orders through the server. It supports the PayPal transaction currencies in the currency selector. PayPal account and country eligibility still applies; the board also lets organizers offer a locally arranged or non-cash reward where PayPal checkout is unavailable. Captured funds go to the platform's configured PayPal business account, not to the mission poster or student; automated student payouts are not implemented. For local preview only, leaving either variable unset enables a simulated checkout. Never put the client secret in browser code or commit credentials.

## Enable AI mission matching

Set an OpenAI API key before starting the server to use model based matching:

```sh
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```

The server sends the student's skills and interests plus public mission details to the model, and returns ranked mission matches with short explanations. If no key is configured, local keyword matching keeps the demo usable.

## Current demo scope

- Without Supabase configuration, seed missions and in-progress states live in browser memory and reset on refresh. With Supabase configured, user-created missions and their accepted/completed status are shared.
- Campus membership verification, moderation, and profile management are not implemented yet.
- Research and enquiry missions should use public or volunteered information, explain how the results will be used, and avoid collecting sensitive personal details.
- PayPal availability differs by market and account type. For example, PayPal currently lists Nigeria as a send-only market for seller onboarding, so a Nigerian account cannot be the receiving merchant for this checkout. The board can still list remote missions and locally arranged rewards there. Review current [seller onboarding availability](https://developer.paypal.com/platforms/seller-onboarding) and [payout country support](https://developer.paypal.com/payouts/supported-features/) before enabling cash rewards in a new country.
- PayPal checkout captures the reward into the platform's configured PayPal business account. It does not automatically transfer money to the student who completes a mission; that needs a payout flow, recipient verification, a completion approval process, and PayPal coverage for the recipient's country.
- Marking a mission complete is a student-side demo action and does not itself prove delivery or trigger payment.

These are prototype boundaries. Before real campus use, add persistent storage, user identity and permissions, dispute handling, and a verified release or payout workflow.
