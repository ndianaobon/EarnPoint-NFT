-- USDT deposits and withdrawals. Tables only: no money can move until the wallet
-- module is built and the legal, custody and security reviews have passed.

CREATE TYPE deposit_status AS ENUM ('pending', 'confirmed', 'failed', 'rejected');
CREATE TYPE withdrawal_status AS ENUM (
  'requested', 'under_review', 'approved', 'rejected',
  'processing', 'broadcast', 'completed', 'failed', 'cancelled'
);

-- A network can't be enabled until its contract and confirmation rules are verified and
-- entered, so nothing here relies on remembered values.
CREATE TABLE networks (
  code text PRIMARY KEY,
  name text NOT NULL,
  token_symbol text NOT NULL DEFAULT 'USDT',
  token_contract text,
  token_decimals integer CHECK (token_decimals BETWEEN 0 AND 18),
  required_confirmations integer CHECK (required_confirmations > 0),
  deposits_enabled boolean NOT NULL DEFAULT false,
  withdrawals_enabled boolean NOT NULL DEFAULT false,
  CHECK (
    NOT (deposits_enabled OR withdrawals_enabled)
    OR (token_contract IS NOT NULL AND token_decimals IS NOT NULL AND required_confirmations IS NOT NULL)
  )
);
INSERT INTO networks (code, name) VALUES ('TRC20', 'TRON'), ('BEP20', 'BNB Smart Chain');

CREATE TABLE deposit_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id),
  network text NOT NULL REFERENCES networks (code),
  address text NOT NULL,
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (network, address),
  UNIQUE (user_id, network)
);

CREATE TABLE deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id),
  network text NOT NULL REFERENCES networks (code),
  address_id uuid NOT NULL REFERENCES deposit_addresses (id),
  tx_hash text NOT NULL,
  log_index integer NOT NULL CHECK (log_index >= 0),
  amount numeric(38, 18) NOT NULL CHECK (amount > 0),
  confirmations integer NOT NULL DEFAULT 0,
  status deposit_status NOT NULL DEFAULT 'pending',
  ledger_transaction_id uuid REFERENCES ledger_transactions (id),
  credited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- One on-chain transfer can only ever be credited once.
  UNIQUE (network, tx_hash, log_index),
  CHECK (status <> 'confirmed' OR (ledger_transaction_id IS NOT NULL AND credited_at IS NOT NULL))
);
CREATE INDEX deposits_user ON deposits (user_id, created_at DESC);
CREATE TRIGGER deposits_updated_at BEFORE UPDATE ON deposits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE withdrawal_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id),
  network text NOT NULL REFERENCES networks (code),
  address text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);
CREATE UNIQUE INDEX withdrawal_addresses_unique ON withdrawal_addresses (user_id, network, address)
  WHERE removed_at IS NULL;

CREATE TABLE withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id),
  network text NOT NULL REFERENCES networks (code),
  address text NOT NULL,
  amount numeric(38, 18) NOT NULL CHECK (amount > 0),
  fee numeric(38, 18) NOT NULL CHECK (fee >= 0),
  status withdrawal_status NOT NULL DEFAULT 'requested',
  idempotency_key text NOT NULL,
  tx_hash text,
  reviewed_by uuid REFERENCES users (id),
  reviewed_at timestamptz,
  review_note text,
  reserve_ledger_transaction_id uuid REFERENCES ledger_transactions (id),
  settle_ledger_transaction_id uuid REFERENCES ledger_transactions (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key),
  UNIQUE (network, tx_hash),
  CHECK (reviewed_by IS NULL OR reviewed_by <> user_id),
  CHECK (status <> 'completed' OR (tx_hash IS NOT NULL AND settle_ledger_transaction_id IS NOT NULL))
);
CREATE INDEX withdrawals_user ON withdrawals (user_id, created_at DESC);
CREATE INDEX withdrawals_status ON withdrawals (status, created_at);
CREATE TRIGGER withdrawals_updated_at BEFORE UPDATE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
