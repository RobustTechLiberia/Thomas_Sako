import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

// Integration smoke tests that boot the real app on an ephemeral port.
// Requires a reachable MySQL `db_poll` (see server/.env) plus the seeded
// admin account (ADMIN_INITIAL_EMAIL / ADMIN_INITIAL_PASSWORD).
//
// Run with: npm test

let server;
let base;
let adminToken;
let app;

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const call = async (path, { method = "GET", body, token } = {}) => {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, data, headers: res.headers };
};

before(async () => {
  app = createApp();
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  const db = app?.locals?.services?.db;
  if (db && typeof db.end === "function") {
    await new Promise((resolve) => db.end(resolve));
  }
});

test("GET /health returns ok", async () => {
  const { status, data } = await call("/health");
  assert.equal(status, 200);
  assert.equal(data.status, "ok");
});

test("public poll + content + social endpoints respond", async () => {
  for (const path of ["/api/polls/current", "/api/social", "/api/content/settings"]) {
    const { status } = await call(path);
    assert.ok(status === 200 || status === 404, `${path} -> ${status}`);
  }
});

test("admin login issues a token and /me round-trips", async () => {
  const email = process.env.ADMIN_INITIAL_EMAIL || "admin@liberty.local";
  const password = process.env.ADMIN_INITIAL_PASSWORD || "@Admin1234";

  const { status, data } = await call("/api/admin/auth/login", {
    method: "POST",
    body: { email, password },
  });
  assert.equal(status, 200, JSON.stringify(data));
  assert.ok(data.token);
  adminToken = data.token;

  const me = await call("/api/admin/auth/me", { token: adminToken });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.email, email);
});

test("admin routes reject unauthenticated requests", async () => {
  for (const path of ["/api/admin/polls", "/api/admin/pages", "/api/admin/users"]) {
    const { status } = await call(path);
    assert.equal(status, 401, `${path} expected 401, got ${status}`);
  }
});

test("poll create -> vote dedupe -> results -> archive round-trip", async () => {
  const question = `smoke-${uid()}`;
  const created = await call("/api/admin/polls", {
    method: "POST",
    token: adminToken,
    body: { question, options: ["Aaa", "Bbb"], status: "active" },
  });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  const pollId = created.data.poll.id;

  const v1 = await call(`/api/polls/${pollId}/vote`, {
    method: "POST",
    body: { answer: "Aaa" },
  });
  assert.equal(v1.status, 201);

  const v2 = await call(`/api/polls/${pollId}/vote`, {
    method: "POST",
    body: { answer: "Bbb" },
  });
  assert.equal(v2.status, 409, "duplicate vote must be rejected");
  assert.match(String(v2.data?.error || ""), /already/i);

  const results = await call(`/api/polls/${pollId}/results`);
  assert.equal(results.status, 200);
  assert.equal(results.data.counts?.Aaa, 1);

  const archived = await call(`/api/admin/polls/${pollId}/archive`, {
    method: "POST",
    token: adminToken,
  });
  assert.equal(archived.status, 200);

  const removed = await call(`/api/admin/polls/${pollId}`, {
    method: "DELETE",
    token: adminToken,
  });
  assert.equal(removed.status, 204);
});

test("subscribe is idempotent then unsubscribes", async () => {
  const email = `smoke-${uid()}@example.com`;
  const s1 = await call("/api/subscribe", { method: "POST", body: { email } });
  assert.equal(s1.status, 201, JSON.stringify(s1.data));

  const s2 = await call("/api/subscribe", { method: "POST", body: { email } });
  assert.equal(s2.status, 200);

  const unsubscribeUrl = s2.data.unsubscribeUrl || s1.data.unsubscribeUrl;
  assert.ok(unsubscribeUrl, "unsubscribeUrl should be exposed");
  const token = new URL(unsubscribeUrl).searchParams.get("token");
  const un = await call(`/api/subscribe/unsubscribe?token=${encodeURIComponent(token)}`);
  assert.equal(un.status, 200);
  assert.equal(un.data.message, "unsubscribed");
});