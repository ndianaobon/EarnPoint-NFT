-- Double-entry ledger: the only source of truth for money balances.
-- A balance is always the sum of entries. Entries are never edited or deleted, and
-- corrections are new transactions. The database enforces this, not just the app.

CREATE TYPE ledger_account_kind AS ENUM (
  'user_available',
  'user_reserved',
  'platform_custody',
  'platform_fees',
  'platform_clearing'
);

CREATE TABLE ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES users (id),
  kind ledger_account_kind NOT NULL,
  asset text NOT NULL,
  allow_negative boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (owner_user_id, kind, asset),
  CHECK ((owner_user_id IS NOT NULL) = (kind IN ('user_available', 'user_reserved'))),
  CHECK (kind NOT IN ('user_available', 'user_reserved') OR NOT allow_negative)
);

CREATE TABLE ledger_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  reference text,
  created_by uuid REFERENCES users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ledger_entries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transaction_id uuid NOT NULL REFERENCES ledger_transactions (id),
  account_id uuid NOT NULL REFERENCES ledger_accounts (id),
  amount numeric(38, 18) NOT NULL CHECK (amount <> 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ledger_entries_transaction ON ledger_entries (transaction_id);
CREATE INDEX ledger_entries_account ON ledger_entries (account_id);

CREATE TRIGGER ledger_transactions_append_only BEFORE UPDATE OR DELETE ON ledger_transactions
  FOR EACH ROW EXECUTE FUNCTION forbid_change();
CREATE TRIGGER ledger_transactions_no_truncate BEFORE TRUNCATE ON ledger_transactions
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_change();
CREATE TRIGGER ledger_entries_append_only BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION forbid_change();
CREATE TRIGGER ledger_entries_no_truncate BEFORE TRUNCATE ON ledger_entries
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_change();

-- Checked at commit, once all of a transaction's entries exist: each asset must net
-- to zero, and accounts that can't go negative must not.
CREATE FUNCTION check_ledger_entry() RETURNS trigger AS $$
DECLARE
  unbalanced text;
  account ledger_accounts%ROWTYPE;
  balance numeric;
BEGIN
  SELECT a.asset INTO unbalanced
    FROM ledger_entries e
    JOIN ledger_accounts a ON a.id = e.account_id
    WHERE e.transaction_id = NEW.transaction_id
    GROUP BY a.asset
    HAVING sum(e.amount) <> 0
    LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'ledger transaction % does not balance for %', NEW.transaction_id, unbalanced
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO account FROM ledger_accounts WHERE id = NEW.account_id FOR UPDATE;
  IF NOT account.allow_negative THEN
    SELECT sum(amount) INTO balance FROM ledger_entries WHERE account_id = NEW.account_id;
    IF balance < 0 THEN
      RAISE EXCEPTION 'ledger account % would go negative', NEW.account_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER ledger_entries_valid AFTER INSERT ON ledger_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_ledger_entry();

CREATE VIEW ledger_balances AS
  SELECT a.id AS account_id, a.owner_user_id, a.kind, a.asset,
         coalesce(sum(e.amount), 0) AS balance
    FROM ledger_accounts a
    LEFT JOIN ledger_entries e ON e.account_id = a.id
    GROUP BY a.id;
