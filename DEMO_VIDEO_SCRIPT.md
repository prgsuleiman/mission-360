# Mission 360 demo video recording guide

Target length: 2 minutes 20 seconds. The hackathon rules require a public YouTube video under three minutes with footage of the working project. Record the real deployed app at <https://mission-360-7t7t.onrender.com/>; do not present slides or a mockup as app footage.

## Before recording

- Open the live app and wait for the AI matching status to finish. Confirm it says `AI MATCHING · PERSONALIZED FOR YOU`; if it says demo mode or matching is unavailable, wait and retry before recording.
- Use the visible sample missions only. They are labeled as samples, not real user submissions.
- Keep the browser at a readable desktop size and hide unrelated tabs, notifications, email addresses, and personal information.
- Do not show API keys, Render environment settings, Supabase credentials, or private account data.
- Use only original narration and app audio. Do not add music or third-party logos. Keep PayPal Sandbox credentials and buyer accounts private.
- Do not claim that the app pays workers automatically, holds escrow, verifies mission completion, or handles missing-person investigations. Those capabilities are not implemented.

## Timed narration and shots

### 0:00–0:18 — The problem

**Show:** Mission 360 homepage and the judge quick-start panel.

**Say:** “Many young people have to work too hard just to find a useful next step. Mission 360 is a shared board for practical opportunities: people can ask for help, offer skills, and make progress together, locally or online.”

### 0:18–0:48 — Browse the board

**Show:** Sample mission cards. Point out local and worldwide examples, then select a category such as Research & enquiry.

**Say:** “Missions can be academic, community, creative, technical, or a public-information enquiry. Each card shows the scope, skills, reward type, and expected result. These examples are labeled as samples.”

### 0:48–1:18 — Live AI matching

**Show:** Edit the profile to “I can research, write clearly, and help people find local services.” Select **Find my matches** and show the returned fit scores.

**Say:** “The app sends this profile and the available missions to a free OpenRouter model. It ranks the best fits and explains them. If the free model is temporarily busy, the app labels its local fallback instead of pretending it was AI.”

### 1:18–1:40 — Inspect a mission

**Show:** Open “Confirm local support services’ opening hours” or another Research & enquiry sample. Show its description and deliverable, then close it.

**Say:** “Before anyone takes on work, they can inspect what needs to be done and what to bring back. Enquiries are scoped to public information and practical community help.”

### 1:40–2:04 — Sign-in and payments

**Show:** Open the sign-in prompt, then close it. If a verified test account is available, show the signed-in flow for posting a cash-reward mission through the PayPal Sandbox. Do not use a live PayPal account or capture real money.

**Say:** “Anyone can explore the public board and try matching. Posting and accepting shared work require sign-in. A mission creator can fund a cash reward through PayPal Sandbox. Funds go to the configured merchant; automatic worker payouts and escrow are not part of this demo.”

**If sign-in is unavailable during recording:** show the sign-in gate, do not claim a mission was posted or accepted, and keep the video focused on the working public board and live AI match. The backend Sandbox order endpoint was verified separately, but that check is not a substitute for showing a user-facing checkout flow.

### 2:04–2:20 — Close

**Show:** Return to the mission board with the AI results visible.

**Say:** “Mission 360 turns a request into a clear, shared next step. Browse the live demo and source code from the project links. This is an early community-work prototype, not an emergency or investigation service.”

## Final check before uploading

- Keep the finished video under 3:00; aim for 2:20.
- Watch it once to confirm the app is legible and every claimed feature is visibly working.
- Make it public on YouTube and paste that URL into the Devpost video field.
- Link the live app and public repository in the Devpost submission. The submission period closes Nov 12, 2026 at 12:00 PM Pacific Time, so verify the deadline shown on Devpost before submitting.
