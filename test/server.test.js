'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server');

delete process.env.PAYPAL_CLIENT_ID;
delete process.env.PAYPAL_CLIENT_SECRET;
delete process.env.OPENAI_API_KEY;
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_PUBLISHABLE_KEY;

const server = createServer();
let baseUrl;

before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test('serves the app shell', async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(await response.text(), /Mission Board|Campus Missions|Mission 360/);
});

test('reports provider readiness without exposing server secrets', async () => {
  const response = await fetch(`${baseUrl}/api/config`);
  const config = await response.json();
  assert.equal(response.status, 200);
  assert.equal(config.paypalReady, false);
  assert.equal(config.aiReady, false);
  assert.equal(config.paypalClientId, null);
});

test('returns ranked demo matches limited to submitted mission IDs', async () => {
  const response = await fetch(`${baseUrl}/api/match`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ profile: 'research and design', missions: [
      { id: 'research', title: 'Research transit', category: 'Research', skills: ['research'] },
      { id: 'garden', title: 'Plant a garden', category: 'Community', skills: ['gardening'] },
    ] }),
  });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.demo, true);
  assert.equal(result.matches[0].id, 'research');
  assert.ok(result.matches.every(match => ['research', 'garden'].includes(match.id)));
});

test('creates only a simulated PayPal order when Sandbox credentials are absent', async () => {
  const response = await fetch(`${baseUrl}/api/paypal/orders`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ amount: 5, mission: 'Test mission', currency: 'USD' }),
  });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.demo, true);
  assert.match(result.id, /^DEMO-/);
});

test('rejects unsupported PayPal currencies and malformed AI input', async () => {
  const currencyResponse = await fetch(`${baseUrl}/api/paypal/orders`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ amount: 5, mission: 'Test mission', currency: 'NGN' }),
  });
  assert.equal(currencyResponse.status, 400);
  const matchResponse = await fetch(`${baseUrl}/api/match`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad json',
  });
  assert.equal(matchResponse.status, 400);
});
