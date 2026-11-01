import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import type { INestApplication } from "@nestjs/common";
import { generate } from "otplib";
import { hashPassword, newToken, verifyPassword } from "../auth/crypto.js";
import { Mailer } from "../auth/mailer.js";
import { createApp } from "../create-app.js";
import { Db } from "../db/db.service.js";
import { runMigrations } from "../db/migrate.js";

let app: INestApplication;
let db: Db;
let mailer: Mailer;
let base: string;

type Reply = { status: number; body: any; cookie?: string };

async function call(method: string, path: string, body?: unknown, cookie?: string, origin?: string): Promise<Reply> {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
      ...(origin ? { origin } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const setCookie = response.headers.get("set-cookie") ?? undefined;
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
    cookie: setCookie?.split(";")[0],
  };
}

let counter = 0;
function identity(overrides: Record<string, string> = {}) {
  counter += 1;
  return {
    username: `user_${counter}`,
    phone: `+1555010${String(counter).padStart(4, "0")}`,
    email: `user${counter}@example.test`,
    password: "correct-horse-battery",
    ...overrides,
  };
}

const tokenFromEmail = (path: string) => {
  const email = [...mailer.sent].reverse().find((item) => item.text.includes(path));
  assert.ok(email, `no email containing ${path}`);
  return email.text.match(/token=([\w-]+)/)![1]!;
};

async function verifiedUser(overrides: Record<string, string> = {}) {
  const person = identity(overrides);
  assert.equal((await call("POST", "/auth/register", person)).status, 201);
  const verified = await call("POST", "/auth/verify-email", { token: tokenFromEmail("/verify-email") });
  assert.equal(verified.status, 200);
  return person;
}

async function loggedIn(overrides: Record<string, string> = {}) {
  const person = await verifiedUser(overrides);
  const login = await call("POST", "/auth/login", { email: person.email, password: person.password });
  assert.equal(login.status, 200);
  assert.ok(login.cookie);
  return { person, cookie: login.cookie };
}

// A code from a later window, so tests don't collide with the single-use rule.
const totp = (secret: string, stepsAhead = 0) =>
  generate({ secret, epoch: Math.floor(Date.now() / 1000) + stepsAhead * 30 });

before(async () => {
  const { app: created } = await createApp();
  app = created;
  db = app.get(Db);
  mailer = app.get(Mailer);
  await db.query("DROP SCHEMA public CASCADE");
  await db.query("CREATE SCHEMA public");
  await runMigrations(db.pool);
  await app.listen(0);
  const address = app.getHttpServer().address();
  base = `http://localhost:${address.port}`;
});

after(() => app.close());

beforeEach(() => {
  mailer.sent.length = 0;
});

describe("database migrations", () => {
  it("are recorded, so running them again changes nothing", async () => {
    assert.deepEqual(await runMigrations(db.pool), []);
    const { rows } = await db.query("SELECT count(*)::int AS n FROM schema_migrations");
    assert.equal(rows[0]!.n, 6);
  });

  it("keep both deposit networks switched off", async () => {
    const { rows } = await db.query("SELECT code, deposits_enabled, withdrawals_enabled FROM networks ORDER BY code");
    assert.deepEqual(rows, [
      { code: "BEP20", deposits_enabled: false, withdrawals_enabled: false },
      { code: "TRC20", deposits_enabled: false, withdrawals_enabled: false },
    ]);
    await assert.rejects(db.query("UPDATE networks SET deposits_enabled = true WHERE code = 'TRC20'"));
  });
});

describe("registration", () => {
  it("stores a scrypt hash, never the password", async () => {
    const person = identity();
    const result = await call("POST", "/auth/register", person);
    assert.equal(result.status, 201);
    assert.deepEqual(result.body, { email: person.email });
    const { rows } = await db.query("SELECT password_hash FROM users WHERE email = $1", [person.email]);
    assert.match(rows[0]!.password_hash, /^scrypt\$/);
    assert.ok(!rows[0]!.password_hash.includes(person.password));
  });

  it("normalizes email case and phone formatting", async () => {
    const person = identity();
    const spaced = `${person.phone.slice(0, 2)} (${person.phone.slice(2, 5)}) ${person.phone.slice(5)}`;
    const result = await call("POST", "/auth/register", { ...person, email: person.email.toUpperCase(), phone: spaced });
    assert.equal(result.status, 201);
    const { rows } = await db.query("SELECT email, phone FROM users WHERE email = $1", [person.email]);
    assert.equal(rows[0]!.phone, person.phone);
  });

  it("explains each invalid field", async () => {
    const result = await call("POST", "/auth/register", {
      username: "a b",
      phone: "12",
      email: "nope",
      password: "short",
      referralCode: "!!",
    });
    assert.equal(result.status, 400);
    assert.deepEqual(Object.keys(result.body.fields).sort(), ["email", "password", "phone", "referralCode", "username"]);
  });

  it("rejects duplicates, ignoring username case", async () => {
    const first = identity();
    await call("POST", "/auth/register", first);
    const cases = [
      [{ ...identity(), username: first.username.toUpperCase() }, "username"],
      [{ ...identity(), email: first.email }, "email"],
      [{ ...identity(), phone: first.phone }, "phone"],
    ] as const;
    for (const [person, field] of cases) {
      const result = await call("POST", "/auth/register", person);
      assert.equal(result.status, 409);
      assert.ok(result.body.fields[field], field);
    }
  });

  it("links a valid referral code and refuses an unknown one", async () => {
    const { cookie } = await loggedIn();
    const referrer = (await call("GET", "/me", undefined, cookie)).body;
    const person = identity({ referralCode: referrer.referralCode.toLowerCase() });
    assert.equal((await call("POST", "/auth/register", person)).status, 201);
    const { rows } = await db.query(
      "SELECT r.status FROM referrals r JOIN users u ON u.id = r.referee_id WHERE u.email = $1 AND r.referrer_id = $2",
      [person.email, referrer.id],
    );
    assert.equal(rows[0]!.status, "pending");

    const bad = await call("POST", "/auth/register", identity({ referralCode: "NOSUCHCODE" }));
    assert.equal(bad.status, 400);
    assert.ok(bad.body.fields.referralCode);
  });

  it("handles simultaneous sign-ups for one email without an error", async () => {
    const email = identity().email;
    const results = await Promise.all(
      [identity({ email }), identity({ email }), identity({ email })].map((person) =>
        call("POST", "/auth/register", person),
      ),
    );
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409]);
  });
});

describe("email verification", () => {
  it("is required to log in, and each link works once", async () => {
    const person = identity();
    await call("POST", "/auth/register", person);
    const blocked = await call("POST", "/auth/login", { email: person.email, password: person.password });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.code, "EMAIL_NOT_VERIFIED");
    assert.equal(blocked.cookie, undefined);

    const token = tokenFromEmail("/verify-email");
    assert.equal((await call("POST", "/auth/verify-email", { token })).status, 200);
    assert.equal((await call("POST", "/auth/verify-email", { token })).status, 400);
    assert.equal((await call("POST", "/auth/login", { email: person.email, password: person.password })).status, 200);
  });

  it("stores only a hash of the link's token", async () => {
    const person = identity();
    await call("POST", "/auth/register", person);
    const token = tokenFromEmail("/verify-email");
    const { rows } = await db.query("SELECT 1 FROM one_time_tokens WHERE token_hash = $1", [token]);
    assert.equal(rows.length, 0);
  });

  it("resending invalidates the old link and reveals nothing about the email", async () => {
    const person = identity();
    await call("POST", "/auth/register", person);
    const old = tokenFromEmail("/verify-email");
    assert.equal((await call("POST", "/auth/resend-verification", { email: person.email })).status, 200);
    assert.equal((await call("POST", "/auth/resend-verification", { email: "nobody@example.test" })).status, 200);
    assert.equal((await call("POST", "/auth/verify-email", { token: old })).status, 400);
    assert.equal((await call("POST", "/auth/verify-email", { token: tokenFromEmail("/verify-email") })).status, 200);
  });
});

describe("login and sessions", () => {
  it("sets a protected cookie, and logout ends the session", async () => {
    const person = await verifiedUser();
    const response = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: person.email, password: person.password }),
    });
    const header = response.headers.get("set-cookie") ?? "";
    assert.match(header, /HttpOnly/);
    assert.match(header, /SameSite=Lax/);
    const cookie = header.split(";")[0]!;
    assert.equal((await response.json() as any).user.email, person.email);

    assert.equal((await call("GET", "/me", undefined, cookie)).status, 200);
    assert.equal((await call("POST", "/auth/logout", undefined, cookie)).status, 200);
    assert.equal((await call("GET", "/me", undefined, cookie)).status, 401);
  });

  it("never exposes the password hash or 2FA secret", async () => {
    const { cookie } = await loggedIn();
    const text = JSON.stringify((await call("GET", "/me", undefined, cookie)).body);
    assert.ok(!text.includes("scrypt"));
    assert.ok(!text.includes("password"));
    assert.ok(!text.includes("totp_secret"));
  });

  it("gives the same answer for a wrong password and an unknown email", async () => {
    const person = await verifiedUser();
    const wrong = await call("POST", "/auth/login", { email: person.email, password: "wrong-password-here" });
    const unknown = await call("POST", "/auth/login", { email: "nobody@example.test", password: "wrong-password-here" });
    assert.equal(wrong.status, 401);
    assert.deepEqual(wrong.body, unknown.body);
  });

  it("locks the account after 5 failures, even for the right password", async () => {
    const person = await verifiedUser();
    for (let i = 0; i < 5; i++) {
      assert.equal((await call("POST", "/auth/login", { email: person.email, password: "wrong-password-here" })).status, 401);
    }
    assert.equal((await call("POST", "/auth/login", { email: person.email, password: person.password })).status, 401);
    await db.query("UPDATE users SET locked_until = now() - interval '1 second' WHERE email = $1", [person.email]);
    assert.equal((await call("POST", "/auth/login", { email: person.email, password: person.password })).status, 200);
  });

  it("blocks suspended accounts and ends their existing sessions", async () => {
    const { person, cookie } = await loggedIn();
    await db.query("UPDATE users SET status = 'suspended' WHERE email = $1", [person.email]);
    assert.equal((await call("GET", "/me", undefined, cookie)).status, 401);
    assert.equal((await call("POST", "/auth/login", { email: person.email, password: person.password })).status, 403);
  });

  it("lists sessions and login history, and only lets you end your own", async () => {
    const a = await loggedIn();
    const second = await call("POST", "/auth/login", { email: a.person.email, password: a.person.password });
    const list = (await call("GET", "/me/sessions", undefined, a.cookie)).body;
    assert.equal(list.length, 2);
    assert.equal(list.filter((s: any) => s.current).length, 1);
    const other = list.find((s: any) => !s.current);

    const b = await loggedIn();
    assert.equal((await call("DELETE", `/me/sessions/${other.id}`, undefined, b.cookie)).status, 404);
    assert.equal((await call("GET", "/me", undefined, second.cookie)).status, 200);

    assert.equal((await call("DELETE", `/me/sessions/${other.id}`, undefined, a.cookie)).status, 200);
    assert.equal((await call("GET", "/me", undefined, second.cookie)).status, 401);

    const history = (await call("GET", "/me/login-history", undefined, a.cookie)).body;
    assert.equal(history.length, 2);
    assert.ok(history.every((event: any) => event.success));
  });

  it("requires a login for account routes", async () => {
    for (const path of ["/me", "/me/sessions", "/me/login-history"]) {
      assert.equal((await call("GET", path)).status, 401);
    }
    assert.equal((await call("GET", "/me", undefined, `ep_session=${newToken()}`)).status, 401);
  });

  it("rejects other websites, but allows the site's own origin", async () => {
    const person = identity();
    const foreign = await call("POST", "/auth/register", person, undefined, "https://evil.example");
    assert.equal(foreign.status, 403);
    assert.equal((await call("POST", "/auth/register", person, undefined, "http://localhost:3000")).status, 201);
  });
});

describe("password reset", () => {
  it("changes the password, logs out everywhere and works once", async () => {
    const { person, cookie } = await loggedIn();
    assert.equal((await call("POST", "/auth/forgot-password", { email: person.email })).status, 200);
    const token = tokenFromEmail("/reset-password");
    const password = "a-brand-new-password";
    assert.equal((await call("POST", "/auth/reset-password", { token, password })).status, 200);
    assert.equal((await call("POST", "/auth/reset-password", { token, password: "another-new-password" })).status, 400);

    assert.equal((await call("GET", "/me", undefined, cookie)).status, 401);
    assert.equal((await call("POST", "/auth/login", { email: person.email, password: person.password })).status, 401);
    assert.equal((await call("POST", "/auth/login", { email: person.email, password })).status, 200);
    assert.ok(mailer.sent.some((email) => email.subject.includes("security notice")));
  });

  it("reveals nothing about unregistered emails, and rejects weak passwords", async () => {
    const result = await call("POST", "/auth/forgot-password", { email: "nobody@example.test" });
    assert.equal(result.status, 200);
    assert.equal(mailer.sent.length, 0);

    const { person } = await loggedIn();
    await call("POST", "/auth/forgot-password", { email: person.email });
    const weak = await call("POST", "/auth/reset-password", { token: tokenFromEmail("/reset-password"), password: "short" });
    assert.equal(weak.status, 400);
  });
});

describe("two-step verification", () => {
  async function withTwoFactor() {
    const { person, cookie } = await loggedIn();
    const setup = await call("POST", "/me/2fa/setup", { password: person.password }, cookie);
    assert.equal(setup.status, 200);
    const { secret } = setup.body;
    const enabled = await call("POST", "/me/2fa/enable", { code: await totp(secret) }, cookie);
    assert.equal(enabled.status, 200);
    return { person, cookie, secret, recoveryCodes: enabled.body.recoveryCodes as string[] };
  }

  const startLogin = async (person: { email: string; password: string }) => {
    const login = await call("POST", "/auth/login", { email: person.email, password: person.password });
    assert.equal(login.status, 200);
    assert.equal(login.body.twoFactorRequired, true);
    assert.equal(login.cookie, undefined);
    return login.body.challengeToken as string;
  };

  it("needs the password to start, and a correct code to turn on", async () => {
    const { person, cookie } = await loggedIn();
    assert.equal((await call("POST", "/me/2fa/setup", { password: "wrong-password-here" }, cookie)).status, 400);
    const setup = await call("POST", "/me/2fa/setup", { password: person.password }, cookie);
    assert.match(setup.body.qrCode, /^data:image\/png;base64,/);
    assert.match(setup.body.otpauthUrl, /^otpauth:\/\/totp\//);
    assert.equal((await call("POST", "/me/2fa/enable", { code: "000000" }, cookie)).status, 400);
    assert.equal((await call("GET", "/me", undefined, cookie)).body.twoFactorEnabled, false);
  });

  it("encrypts the secret at rest", async () => {
    const { person, secret } = await withTwoFactor();
    const { rows } = await db.query("SELECT totp_secret_encrypted FROM users WHERE email = $1", [person.email]);
    assert.ok(!rows[0]!.totp_secret_encrypted.includes(secret));
  });

  it("requires a code at login, and each code works only once", async () => {
    const { person, secret } = await withTwoFactor();
    const challengeToken = await startLogin(person);
    const code = await totp(secret, 1);
    const ok = await call("POST", "/auth/login/2fa", { challengeToken, code });
    assert.equal(ok.status, 200);
    assert.ok(ok.cookie);
    assert.equal((await call("GET", "/me", undefined, ok.cookie)).body.twoFactorEnabled, true);

    const again = await startLogin(person);
    assert.equal((await call("POST", "/auth/login/2fa", { challengeToken: again, code })).status, 400);
  });

  it("lets only one of two simultaneous uses of a code succeed", async () => {
    const { person, secret } = await withTwoFactor();
    const code = await totp(secret, 1);
    const challengeToken = await startLogin(person);
    const results = await Promise.all([
      call("POST", "/auth/login/2fa", { challengeToken, code }),
      call("POST", "/auth/login/2fa", { challengeToken, code }),
      call("POST", "/auth/login/2fa", { challengeToken, code }),
    ]);
    assert.equal(results.filter((r) => r.status === 200).length, 1);
  });

  it("stops guessing after 5 wrong codes", async () => {
    const { person, secret } = await withTwoFactor();
    const challengeToken = await startLogin(person);
    for (let i = 0; i < 5; i++) {
      const wrong = await call("POST", "/auth/login/2fa", { challengeToken, code: "000000" });
      assert.equal(wrong.body.code, "INVALID_CODE");
    }
    const blocked = await call("POST", "/auth/login/2fa", { challengeToken, code: await totp(secret, 1) });
    assert.equal(blocked.status, 400);
    assert.equal(blocked.body.code, "CHALLENGE_EXPIRED");
  });

  it("accepts each recovery code once", async () => {
    const { person, recoveryCodes } = await withTwoFactor();
    assert.equal(recoveryCodes.length, 10);
    const code = recoveryCodes[0]!;
    assert.equal((await call("POST", "/auth/login/2fa", { challengeToken: await startLogin(person), code: code.toLowerCase() })).status, 200);
    assert.equal((await call("POST", "/auth/login/2fa", { challengeToken: await startLogin(person), code })).status, 400);
  });

  it("needs both password and code to turn off, and logs out other devices", async () => {
    const { person, cookie, secret, recoveryCodes } = await withTwoFactor();
    const challengeToken = await startLogin(person);
    const other = await call("POST", "/auth/login/2fa", { challengeToken, code: recoveryCodes[0] });

    const noPassword = await call("POST", "/me/2fa/disable", { password: "wrong-password-here", code: await totp(secret, 1) }, cookie);
    assert.equal(noPassword.status, 400);
    assert.equal((await call("POST", "/me/2fa/disable", { password: person.password, code: "000000" }, cookie)).status, 400);

    assert.equal((await call("POST", "/me/2fa/disable", { password: person.password, code: await totp(secret, 1) }, cookie)).status, 200);
    assert.equal((await call("GET", "/me", undefined, cookie)).body.twoFactorEnabled, false);
    assert.equal((await call("GET", "/me", undefined, other.cookie)).status, 401);
    const login = await call("POST", "/auth/login", { email: person.email, password: person.password });
    assert.equal(login.body.twoFactorRequired, false);
  });
});

describe("ledger rules enforced by the database", () => {
  async function accounts() {
    const person = await verifiedUser();
    const { rows: users } = await db.query("SELECT id FROM users WHERE email = $1", [person.email]);
    const userId = users[0]!.id;
    const user = await db.query(
      `INSERT INTO ledger_accounts (owner_user_id, kind, asset, allow_negative)
       VALUES ($1, 'user_available', 'USDT', false) RETURNING id`,
      [userId],
    );
    const custody = await db.query(
      `INSERT INTO ledger_accounts (owner_user_id, kind, asset, allow_negative)
       VALUES (NULL, 'platform_custody', 'USDT', true)
       ON CONFLICT (owner_user_id, kind, asset) DO UPDATE SET asset = EXCLUDED.asset RETURNING id`,
    );
    return { userAccount: user.rows[0]!.id as string, custody: custody.rows[0]!.id as string };
  }

  const post = (key: string, entries: [string, string][]) =>
    db.tx(async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        "INSERT INTO ledger_transactions (kind, idempotency_key) VALUES ('test', $1) RETURNING id",
        [key],
      );
      for (const [account, amount] of entries) {
        await tx.query("INSERT INTO ledger_entries (transaction_id, account_id, amount) VALUES ($1, $2, $3)", [
          rows[0]!.id,
          account,
          amount,
        ]);
      }
    });

  const balance = async (account: string) =>
    (await db.query("SELECT balance FROM ledger_balances WHERE account_id = $1", [account])).rows[0]!.balance;

  it("accepts a balanced transaction and sums it precisely", async () => {
    const { userAccount, custody } = await accounts();
    await post(newToken(), [[custody, "-100.000000000000000001"], [userAccount, "100.000000000000000001"]]);
    assert.equal(await balance(userAccount), "100.000000000000000001");
  });

  it("rejects a transaction that doesn't balance", async () => {
    const { userAccount, custody } = await accounts();
    await assert.rejects(post(newToken(), [[custody, "-100"], [userAccount, "99"]]), /does not balance/);
    assert.equal(await balance(userAccount), "0");
  });

  it("stops a user balance going negative", async () => {
    const { userAccount, custody } = await accounts();
    await post(newToken(), [[custody, "-10"], [userAccount, "10"]]);
    await assert.rejects(post(newToken(), [[userAccount, "-11"], [custody, "11"]]), /would go negative/);
    assert.equal(await balance(userAccount), "10.000000000000000000");
  });

  it("stops two simultaneous spends of the same money", async () => {
    const { userAccount, custody } = await accounts();
    await post(newToken(), [[custody, "-10"], [userAccount, "10"]]);
    const spends = await Promise.allSettled([
      post(newToken(), [[userAccount, "-7"], [custody, "7"]]),
      post(newToken(), [[userAccount, "-7"], [custody, "7"]]),
    ]);
    assert.equal(spends.filter((s) => s.status === "fulfilled").length, 1);
    assert.equal(await balance(userAccount), "3.000000000000000000");
  });

  it("refuses to run the same transaction twice", async () => {
    const { userAccount, custody } = await accounts();
    const key = newToken();
    await post(key, [[custody, "-5"], [userAccount, "5"]]);
    await assert.rejects(post(key, [[custody, "-5"], [userAccount, "5"]]));
    assert.equal(await balance(userAccount), "5.000000000000000000");
  });

  it("makes entries impossible to edit or delete", async () => {
    const { userAccount, custody } = await accounts();
    await post(newToken(), [[custody, "-1"], [userAccount, "1"]]);
    await assert.rejects(db.query("UPDATE ledger_entries SET amount = 999 WHERE account_id = $1", [userAccount]), /append-only/);
    await assert.rejects(db.query("DELETE FROM ledger_entries WHERE account_id = $1", [userAccount]), /append-only/);
    await assert.rejects(db.query("TRUNCATE ledger_entries CASCADE"), /append-only/);
  });

  it("can never credit the same on-chain transfer twice", async () => {
    const person = await verifiedUser();
    const { rows: users } = await db.query("SELECT id FROM users WHERE email = $1", [person.email]);
    const userId = users[0]!.id;
    const { rows: addresses } = await db.query(
      "INSERT INTO deposit_addresses (user_id, network, address) VALUES ($1, 'TRC20', $2) RETURNING id",
      [userId, newToken()],
    );
    const insert = () =>
      db.query(
        `INSERT INTO deposits (user_id, network, address_id, tx_hash, log_index, amount)
         VALUES ($1, 'TRC20', $2, 'same-hash', 0, 5)`,
        [userId, addresses[0]!.id],
      );
    await insert();
    await assert.rejects(insert());
  });
});

describe("password hashing", () => {
  it("verifies only the right password, and salts each hash", async () => {
    const [one, two] = await Promise.all([hashPassword("secret-password-1"), hashPassword("secret-password-1")]);
    assert.notEqual(one, two);
    assert.equal(await verifyPassword("secret-password-1", one), true);
    assert.equal(await verifyPassword("secret-password-2", one), false);
  });
});

describe("rate limiting", () => {
  it("returns 429 once the limit is reached", async () => {
    const previous = process.env.AUTH_RATE_LIMIT;
    process.env.AUTH_RATE_LIMIT = "3";
    try {
      const statuses: number[] = [];
      for (let i = 0; i < 5; i++) {
        statuses.push((await call("POST", "/auth/resend-verification", { email: "nobody@example.test" })).status);
      }
      assert.ok(statuses.includes(429), `got ${statuses}`);
    } finally {
      process.env.AUTH_RATE_LIMIT = previous;
    }
  });
});

describe("health", () => {
  it("reports the database is reachable", async () => {
    assert.deepEqual((await call("GET", "/health")).body, { status: "ok" });
  });
});
