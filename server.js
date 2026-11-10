const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname, port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

async function paypal(pathname, method, body) {
  const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) return { demo: true, id: `DEMO-${Date.now()}` };
  const base = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
  const tokenRes = await fetch(`${base}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
  if (!tokenRes.ok) throw new Error('PayPal sandbox authentication failed. Check the credentials.');
  const { access_token } = await tokenRes.json();
  const res = await fetch(`${base}${pathname}`, { method, headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const result = await res.json(); if (!res.ok) throw new Error(result.message || 'PayPal request failed.'); return result;
}
async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'GET' && url.pathname === '/api/config') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ paypalReady: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET), paypalClientId: process.env.PAYPAL_CLIENT_ID || null, aiReady: Boolean(process.env.OPENAI_API_KEY), supabaseUrl: process.env.SUPABASE_URL || null, supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || null })); }
  if (req.method === 'POST' && url.pathname === '/api/auth/magiclink') {
    let raw = ''; for await (const chunk of req) raw += chunk;
    try { const { email } = JSON.parse(raw); if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) throw new Error('Shared sign-in is not configured yet.'); if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.'); const base = process.env.SUPABASE_URL.replace(/\/$/, ''), redirect = process.env.SITE_URL || `http://${req.headers.host}`; const response = await fetch(`${base}/auth/v1/otp?redirect_to=${encodeURIComponent(redirect)}`, { method: 'POST', headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, create_user: true }) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.msg || data.message || 'Could not send sign-in link.'); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true })); }
    catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); } return;
  }
  if (req.method === 'POST' && (url.pathname === '/api/paypal/orders' || /^\/api\/paypal\/orders\/[^/]+\/capture$/.test(url.pathname))) {
    let raw = ''; for await (const chunk of req) raw += chunk;
    try {
      let result;
      if (url.pathname === '/api/paypal/orders') { const { amount, mission, currency = 'USD' } = JSON.parse(raw); const supported = new Set(['AUD','BRL','CAD','CNY','CZK','DKK','EUR','HKD','HUF','ILS','JPY','MYR','MXN','NOK','NZD','PHP','PLN','GBP','SGD','SEK','CHF','THB','TWD','USD']); if (!supported.has(currency)) throw new Error('PayPal does not support that transaction currency. Choose a local or non-cash reward instead.'); if (!Number.isFinite(Number(amount)) || Number(amount) < 1 || Number(amount) > 10000) throw new Error('Reward amount must be between 1 and 10,000.'); const value = ['HUF','JPY','TWD'].includes(currency) ? String(Math.round(Number(amount))) : Number(amount).toFixed(2); result = await paypal('/v2/checkout/orders', 'POST', { intent: 'CAPTURE', purchase_units: [{ description: `Student mission reward: ${String(mission).slice(0, 120)}`, amount: { currency_code: currency, value } }] }); if (result.demo) result = { id: result.id, demo: true }; }
      else { const id = url.pathname.split('/')[4]; result = await paypal(`/v2/checkout/orders/${encodeURIComponent(id)}/capture`, 'POST'); }
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(result));
    } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); } return;
  }
  if (req.method === 'POST' && url.pathname === '/api/match') {
    let raw = ''; for await (const chunk of req) raw += chunk;
    try {
      const { profile, missions } = JSON.parse(raw); let result;
      if (process.env.OPENAI_API_KEY) {
        const api = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'Match a student profile to varied missions including research, public enquiries, community work, creative tasks, events, technology, and peer support. Use skills, interests, location or remote preference, time, impact, and the expected deliverable. Return JSON {"matches":[{"id":"provided ID","reason":"one concise sentence","fit":0-100}]}. Only use provided mission IDs.' }, { role: 'user', content: JSON.stringify({ profile, missions: missions.map(({ id, title, description, skills, category, deliverable, reward, rewardCurrency, rewardType, location, scope }) => ({ id, title, description, skills, category, deliverable, reward, rewardCurrency, rewardType, location, scope })) }) }] }) });
        const data = await api.json(); if (!api.ok) throw new Error(data.error?.message || 'AI matching failed.'); result = JSON.parse(data.choices[0].message.content);
      } else {
        const tokens = String(profile).toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 2);
        result = { matches: missions.map(m => { const words = `${m.title} ${m.category} ${m.description || ''} ${m.deliverable || ''} ${m.location || ''} ${(m.skills || []).join(' ')}`.toLowerCase(), hits = tokens.filter(t => words.includes(t)); return { id: m.id, fit: Math.min(98, 42 + hits.length * 14), reason: hits.length ? `A strong fit for your ${hits.slice(0, 2).join(' and ')} experience.` : `A good stretch mission in ${m.category.toLowerCase()}.` }; }).sort((a,b) => b.fit-a.fit), demo: true };
      }
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(result));
    } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); } return;
  }
  const requested = url.pathname === '/' ? '/index.html' : url.pathname, file = path.resolve(root, `.${decodeURIComponent(requested)}`);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (e, data) => { if (e) { res.writeHead(404); return res.end('Not found'); } res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); res.end(data); });
}
http.createServer(handle).listen(port, () => console.log(`Campus Missions running at http://localhost:${port}`));
