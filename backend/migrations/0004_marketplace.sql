-- NFTs, listings and orders.

CREATE TYPE listing_status AS ENUM ('active', 'sold', 'cancelled', 'expired');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'failed');

CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  royalty_bps integer NOT NULL DEFAULT 0 CHECK (royalty_bps BETWEEN 0 AND 10000),
  is_supported boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE nfts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES collections (id),
  chain text NOT NULL,
  contract text NOT NULL,
  token_id text NOT NULL,
  name text NOT NULL,
  description text,
  image_url text,
  owner_user_id uuid REFERENCES users (id),
  owner_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chain, contract, token_id)
);
CREATE INDEX nfts_owner ON nfts (owner_user_id);
CREATE TRIGGER nfts_updated_at BEFORE UPDATE ON nfts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id uuid NOT NULL REFERENCES nfts (id),
  seller_id uuid NOT NULL REFERENCES users (id),
  price numeric(38, 18) NOT NULL CHECK (price > 0),
  asset text NOT NULL DEFAULT 'USDT',
  status listing_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- An NFT can only be actively listed once.
CREATE UNIQUE INDEX listings_one_active ON listings (nft_id) WHERE status = 'active';
CREATE INDEX listings_seller ON listings (seller_id, created_at DESC);
CREATE TRIGGER listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings (id),
  buyer_id uuid NOT NULL REFERENCES users (id),
  price numeric(38, 18) NOT NULL CHECK (price > 0),
  marketplace_fee numeric(38, 18) NOT NULL DEFAULT 0 CHECK (marketplace_fee >= 0),
  royalty numeric(38, 18) NOT NULL DEFAULT 0 CHECK (royalty >= 0),
  status order_status NOT NULL DEFAULT 'pending',
  idempotency_key text NOT NULL,
  reserve_ledger_transaction_id uuid REFERENCES ledger_transactions (id),
  settle_ledger_transaction_id uuid REFERENCES ledger_transactions (id),
  transfer_tx_hash text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (buyer_id, idempotency_key),
  -- A purchase can't complete until payment and the on-chain transfer are recorded.
  CHECK (status <> 'completed' OR (settle_ledger_transaction_id IS NOT NULL AND transfer_tx_hash IS NOT NULL))
);
-- Only one buyer at a time can hold a listing.
CREATE UNIQUE INDEX orders_one_open ON orders (listing_id) WHERE status IN ('pending', 'processing');
CREATE INDEX orders_buyer ON orders (buyer_id, created_at DESC);
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
