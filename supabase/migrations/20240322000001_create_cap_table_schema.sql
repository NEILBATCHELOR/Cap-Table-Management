-- Create investors table
CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  type TEXT NOT NULL,
  kyc_status TEXT NOT NULL DEFAULT 'Pending',
  wallet TEXT NOT NULL,
  country TEXT,
  investor_id TEXT,
  kyc_expiry_date TIMESTAMP WITH TIME ZONE,
  accreditation_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  subscription_id TEXT NOT NULL,
  fiat_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  allocated BOOLEAN NOT NULL DEFAULT FALSE,
  distributed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  subscription_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token_allocations table
CREATE TABLE IF NOT EXISTS token_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL,
  token_amount NUMERIC NOT NULL,
  distributed BOOLEAN NOT NULL DEFAULT FALSE,
  distribution_date TIMESTAMP WITH TIME ZONE,
  distribution_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token_designs table
CREATE TABLE IF NOT EXISTS token_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  total_supply NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  contract_address TEXT,
  deployment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_investors_kyc_status ON investors(kyc_status);
CREATE INDEX IF NOT EXISTS idx_investors_type ON investors(type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_investor_id ON subscriptions(investor_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_confirmed ON subscriptions(confirmed);
CREATE INDEX IF NOT EXISTS idx_subscriptions_allocated ON subscriptions(allocated);
CREATE INDEX IF NOT EXISTS idx_subscriptions_distributed ON subscriptions(distributed);
CREATE INDEX IF NOT EXISTS idx_token_allocations_subscription_id ON token_allocations(subscription_id);
CREATE INDEX IF NOT EXISTS idx_token_allocations_distributed ON token_allocations(distributed);

-- Enable Row Level Security (RLS)
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_designs ENABLE ROW LEVEL SECURITY;

-- Create policies for investors table
DROP POLICY IF EXISTS "Public read access for investors" ON investors;
CREATE POLICY "Public read access for investors"
  ON investors FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Auth users can insert investors" ON investors;
CREATE POLICY "Auth users can insert investors"
  ON investors FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can update investors" ON investors;
CREATE POLICY "Auth users can update investors"
  ON investors FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create policies for subscriptions table
DROP POLICY IF EXISTS "Public read access for subscriptions" ON subscriptions;
CREATE POLICY "Public read access for subscriptions"
  ON subscriptions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Auth users can insert subscriptions" ON subscriptions;
CREATE POLICY "Auth users can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can update subscriptions" ON subscriptions;
CREATE POLICY "Auth users can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create policies for token_allocations table
DROP POLICY IF EXISTS "Public read access for token_allocations" ON token_allocations;
CREATE POLICY "Public read access for token_allocations"
  ON token_allocations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Auth users can insert token_allocations" ON token_allocations;
CREATE POLICY "Auth users can insert token_allocations"
  ON token_allocations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can update token_allocations" ON token_allocations;
CREATE POLICY "Auth users can update token_allocations"
  ON token_allocations FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create policies for token_designs table
DROP POLICY IF EXISTS "Public read access for token_designs" ON token_designs;
CREATE POLICY "Public read access for token_designs"
  ON token_designs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Auth users can insert token_designs" ON token_designs;
CREATE POLICY "Auth users can insert token_designs"
  ON token_designs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can update token_designs" ON token_designs;
CREATE POLICY "Auth users can update token_designs"
  ON token_designs FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Enable realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE investors;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE token_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE token_designs;
