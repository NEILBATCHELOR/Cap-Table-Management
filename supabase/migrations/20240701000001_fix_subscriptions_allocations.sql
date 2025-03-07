-- Create token_designs table
CREATE TABLE IF NOT EXISTS public.token_designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ERC-20', 'ERC-721', 'ERC-1155', 'ERC-1400', 'ERC-3525')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'minted')),
    total_supply NUMERIC NOT NULL,
    contract_address TEXT,
    deployment_date TIMESTAMP WITH TIME ZONE
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
    subscription_id TEXT NOT NULL UNIQUE,
    fiat_amount NUMERIC NOT NULL CHECK (fiat_amount > 0),
    currency TEXT NOT NULL CHECK (currency IN ('USD', 'EUR', 'GBP')),
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    allocated BOOLEAN NOT NULL DEFAULT FALSE,
    distributed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    subscription_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token_allocations table
CREATE TABLE IF NOT EXISTS public.token_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    token_type TEXT NOT NULL CHECK (token_type IN ('ERC-20', 'ERC-721', 'ERC-1155', 'ERC-1400', 'ERC-3525')),
    token_amount NUMERIC NOT NULL CHECK (token_amount > 0),
    distributed BOOLEAN NOT NULL DEFAULT FALSE,
    distribution_date TIMESTAMP WITH TIME ZONE,
    distribution_tx_hash TEXT
);

-- Create a view that joins investors with their subscriptions and allocations
CREATE OR REPLACE VIEW public.investor_subscriptions_view AS
SELECT 
    i.id AS investor_id,
    i.name AS investor_name,
    i.email AS investor_email,
    i.type AS investor_type,
    i.kyc_status,
    i.wallet_address,
    s.id AS subscription_id,
    s.subscription_id AS subscription_reference,
    s.fiat_amount,
    s.currency,
    s.confirmed,
    s.allocated,
    s.distributed,
    s.notes,
    s.subscription_date,
    ta.id AS token_allocation_id,
    ta.token_type,
    ta.token_amount,
    ta.distributed AS tokens_distributed,
    ta.distribution_date,
    ta.distribution_tx_hash
FROM 
    public.investors i
LEFT JOIN 
    public.subscriptions s ON i.id = s.investor_id
LEFT JOIN 
    public.token_allocations ta ON s.id = ta.subscription_id;

-- Enable Row Level Security
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_designs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to read investors" ON public.investors;
CREATE POLICY "Allow authenticated users to read investors" 
    ON public.investors FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert investors" ON public.investors;
CREATE POLICY "Allow authenticated users to insert investors" 
    ON public.investors FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update investors" ON public.investors;
CREATE POLICY "Allow authenticated users to update investors" 
    ON public.investors FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Similar policies for other tables
DROP POLICY IF EXISTS "Allow authenticated users to read subscriptions" ON public.subscriptions;
CREATE POLICY "Allow authenticated users to read subscriptions" 
    ON public.subscriptions FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert subscriptions" ON public.subscriptions;
CREATE POLICY "Allow authenticated users to insert subscriptions" 
    ON public.subscriptions FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update subscriptions" ON public.subscriptions;
CREATE POLICY "Allow authenticated users to update subscriptions" 
    ON public.subscriptions FOR UPDATE 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to read token_allocations" ON public.token_allocations;
CREATE POLICY "Allow authenticated users to read token_allocations" 
    ON public.token_allocations FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert token_allocations" ON public.token_allocations;
CREATE POLICY "Allow authenticated users to insert token_allocations" 
    ON public.token_allocations FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update token_allocations" ON public.token_allocations;
CREATE POLICY "Allow authenticated users to update token_allocations" 
    ON public.token_allocations FOR UPDATE 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to read token_designs" ON public.token_designs;
CREATE POLICY "Allow authenticated users to read token_designs" 
    ON public.token_designs FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert token_designs" ON public.token_designs;
CREATE POLICY "Allow authenticated users to insert token_designs" 
    ON public.token_designs FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update token_designs" ON public.token_designs;
CREATE POLICY "Allow authenticated users to update token_designs" 
    ON public.token_designs FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Enable realtime subscriptions
alter publication supabase_realtime add table investors;
alter publication supabase_realtime add table subscriptions;
alter publication supabase_realtime add table token_allocations;
alter publication supabase_realtime add table token_designs;