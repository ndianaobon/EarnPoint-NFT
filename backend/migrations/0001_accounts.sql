-- Accounts, sessions and login security.

CREATE TYPE user_status AS ENUM ('active', 'suspended', 'closed');
CREATE TYPE user_role AS ENUM ('user', 'support', 'finance', 'admin');
CREATE TYPE one_time_token_purpose AS ENUM ('email_verify', 'password_reset', 'mfa_challenge');

CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Shared by every table whose history must never change.
CREATE FUNCTION forbid_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  email text NOT NULL CHECK (email = lower(email) AND length(email) <= 254),
  phone text NOT NULL CHECK (phone ~ '^\+[1-9][0-9]{6,14}$'),
  password_hash text NOT NULL,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  status user_status NOT NULL DEFAULT 'active',
  role user_role NOT NULL DEFAULT 'user',
  referral_code text NOT NULL UNIQUE,
  referred_by uuid REFERENCES users (id),
  totp_secret_encrypted text,
  totp_enabled_at timestamptz,
  totp_last_step bigint,
  failed_login_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (referred_by IS NULL OR referred_by <> id)
);
CREATE UNIQUE INDEX users_username_unique ON users (lower(username));
CREATE UNIQUE INDEX users_email_unique ON users (email);
CREATE UNIQUE INDEX users_phone_unique ON users (phone);
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX recovery_codes_user ON recovery_codes (user_id);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX sessions_user ON sessions (user_id);

CREATE TABLE one_time_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  purpose one_time_token_purpose NOT NULL,
  token_hash text NOT NULL UNIQUE,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX one_time_tokens_user ON one_time_tokens (user_id, purpose);

CREATE TABLE login_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  email text NOT NULL,
  success boolean NOT NULL,
  reason text NOT NULL,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX login_events_user ON login_events (user_id, created_at DESC);
