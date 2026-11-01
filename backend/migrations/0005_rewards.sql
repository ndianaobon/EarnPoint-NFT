-- Points, referrals, staking and airdrops. Points are kept apart from USDT by design.

CREATE TYPE referral_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE reward_status AS ENUM ('pending', 'confirmed', 'rejected');
CREATE TYPE staking_position_status AS ENUM ('active', 'unstaking', 'closed');
CREATE TYPE airdrop_reward_status AS ENUM ('confirmed', 'estimated', 'subject_to_approval');
CREATE TYPE airdrop_participation_status AS ENUM ('joined', 'submitted', 'approved', 'rejected', 'distributed');

CREATE TABLE point_entries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users (id),
  delta integer NOT NULL CHECK (delta <> 0),
  reason text NOT NULL,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX point_entries_user ON point_entries (user_id, created_at DESC);
CREATE TRIGGER point_entries_append_only BEFORE UPDATE OR DELETE ON point_entries
  FOR EACH ROW EXECUTE FUNCTION forbid_change();

CREATE TABLE daily_claims (
  user_id uuid NOT NULL REFERENCES users (id),
  claim_date date NOT NULL,
  points integer NOT NULL CHECK (points > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- One claim per user per day, whatever the app does.
  PRIMARY KEY (user_id, claim_date)
);

CREATE TABLE referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES users (id),
  referee_id uuid NOT NULL UNIQUE REFERENCES users (id),
  status referral_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  CHECK (referrer_id <> referee_id)
);
CREATE INDEX referrals_referrer ON referrals (referrer_id);

CREATE TABLE referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES referrals (id),
  source_order_id uuid NOT NULL REFERENCES orders (id),
  amount numeric(38, 18) NOT NULL CHECK (amount > 0),
  status reward_status NOT NULL DEFAULT 'pending',
  ledger_transaction_id uuid REFERENCES ledger_transactions (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referral_id, source_order_id)
);

CREATE TABLE staking_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  asset text NOT NULL,
  min_amount numeric(38, 18) NOT NULL CHECK (min_amount > 0),
  max_amount numeric(38, 18),
  lock_days integer NOT NULL CHECK (lock_days >= 0),
  reward_source text,
  reward_method text,
  early_exit_terms text,
  review_approved_at timestamptz,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- A program can't run without a stated reward source and a recorded review.
  CHECK (NOT is_enabled OR (reward_source IS NOT NULL AND reward_method IS NOT NULL AND review_approved_at IS NOT NULL))
);

CREATE TABLE staking_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES staking_programs (id),
  user_id uuid NOT NULL REFERENCES users (id),
  amount numeric(38, 18) NOT NULL CHECK (amount > 0),
  status staking_position_status NOT NULL DEFAULT 'active',
  matures_at timestamptz NOT NULL,
  open_ledger_transaction_id uuid REFERENCES ledger_transactions (id),
  close_ledger_transaction_id uuid REFERENCES ledger_transactions (id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX staking_positions_user ON staking_positions (user_id);

CREATE TABLE airdrop_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  project text NOT NULL,
  description text,
  reward_asset text,
  eligibility text,
  tasks jsonb NOT NULL DEFAULT '[]',
  reward_status airdrop_reward_status NOT NULL DEFAULT 'subject_to_approval',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE airdrop_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES airdrop_campaigns (id),
  user_id uuid NOT NULL REFERENCES users (id),
  status airdrop_participation_status NOT NULL DEFAULT 'joined',
  submission jsonb,
  reward_tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, user_id)
);
