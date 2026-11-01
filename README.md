# Earn Point NFT

A Next.js website (this folder) and a NestJS API with PostgreSQL (`backend/`).

Working today: accounts, email verification, login, password reset, two-step verification, session
management and the full database. Deposits, withdrawals, trading, staking and rewards aren't built
yet, so their buttons say "Coming soon". No real money can move.

## Run it

You need three terminals, one for each command.

**1. Database.** A private PostgreSQL on port 5433, stored in `backend/.data`. No install needed.

```bash
npm --prefix backend run db:dev
```

**2. API.** Applies any new migrations, then starts on port 4000. The first time, copy
`backend/.env.example` to `backend/.env` and fill in `APP_ENCRYPTION_KEY`.

```bash
npm --prefix backend run dev
```

Verification and password reset emails print in this terminal, because no email provider is
connected yet.

**3. Website.** Starts on port 3000, or the next free port. If it isn't 3000, change `APP_URL` in
`backend/.env` so email links point to the right place.

```bash
npm run dev
```

Install packages first with `npm install` in this folder and in `backend/`.

## Test it

With the database running, this runs the API tests against a separate test database:

```bash
npm --prefix backend test
```

## Live NFT images

Copy `.env.example` to `.env.local` and add your OpenSea API key. Images then appear on Home and
Explore and refresh every 5 minutes. The key stays on the server. `OPENSEA_COLLECTIONS` chooses
which collections appear. OpenSea's terms require its written permission for commercial use, so get
that before launch.

## Database

`backend/migrations/` holds the schema as plain SQL. Each file runs once, in order. To change the
schema, add a new file and never edit one that has already run.

| File | Contains |
| --- | --- |
| `0001_accounts.sql` | Users, sessions, one-time tokens, login history |
| `0002_ledger.sql` | Double-entry ledger, with rules enforced by the database |
| `0003_wallet.sql` | Networks (TRC20, BEP20, both switched off), deposits, withdrawals |
| `0004_marketplace.sql` | Collections, NFTs, listings, orders |
| `0005_rewards.sql` | Points, daily claims, referrals, staking, airdrops |
| `0006_admin.sql` | Audit log, support tickets, announcements |

## Before production

The API refuses to start with `NODE_ENV=production` until a real email provider replaces the
console stand-in in `backend/src/auth/mailer.ts`. Production also needs a managed PostgreSQL, HTTPS,
and a shared store for rate limits if it runs on more than one server. Phone numbers are collected
but not verified, because no SMS provider is connected.

## Where to change things

- `lib/site.ts`: navigation, FAQs and `MARKETPLACE_LIVE`. Set that flag to `true` only when real
  trading is open. It changes the hero badge to "Live, marketplace now open". Buy, claim, deposit and
  withdraw buttons use `ComingSoonButton` until the backend connects them to real actions.
- `lib/nfts.ts`: artwork details and sample listings, to be replaced with backend data.
- `lib/api.ts`: how the website calls the API.
- `app/globals.css`: colours, spacing and responsive rules. Light and dark colours are at the top.
- `public/brand/`: logo files from the EarnPoint brand kit.
- `design/hero-reference.webp`: the original hero design.
