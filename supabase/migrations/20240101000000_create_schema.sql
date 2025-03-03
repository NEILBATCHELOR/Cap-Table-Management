-- Create investors table
CREATE TABLE IF NOT EXISTS public.investors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('Individual', 'Institution')),
    kyc_status TEXT NOT NULL DEFAULT 'Pending' CHECK (kyc_status IN ('Verified', 'Expired', 'Pending')),
    wallet TEXT NOT NULL UNIQUE,
    country TEXT,
    investor_id TEXT,
    kyc_expiry_date TIMESTAMP WITH TIME ZONE,
    accreditation_status TEXT CHECK (accreditation_status IN ('Accredited', 'Non-Accredited', 'Pending'))
);

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
    distributed BOOLEAN NOT NULL DEFAULT FALSE
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
    i.wallet,
    s.subscription_id,
    s.fiat_amount,
    s.currency,
    s.confirmed,
    s.allocated,
    s.distributed,
    ta.token_type,
    ta.token_amount
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
CREATE POLICY "Allow authenticated users to read investors" 
    ON public.investors FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert investors" 
    ON public.investors FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update investors" 
    ON public.investors FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Similar policies for other tables
CREATE POLICY "Allow authenticated users to read subscriptions" 
    ON public.subscriptions FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert subscriptions" 
    ON public.subscriptions FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update subscriptions" 
    ON public.subscriptions FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read token_allocations" 
    ON public.token_allocations FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert token_allocations" 
    ON public.token_allocations FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update token_allocations" 
    ON public.token_allocations FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read token_designs" 
    ON public.token_designs FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert token_designs" 
    ON public.token_designs FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update token_designs" 
    ON public.token_designs FOR UPDATE 
    USING (auth.role() = 'authenticated');
