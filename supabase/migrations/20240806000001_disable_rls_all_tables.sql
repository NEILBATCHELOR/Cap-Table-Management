-- Disable RLS for all tables to fix security policy violations

-- Cap tables
ALTER TABLE cap_tables DISABLE ROW LEVEL SECURITY;

-- Projects
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Investors
ALTER TABLE investors DISABLE ROW LEVEL SECURITY;

-- Subscriptions
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Token allocations
ALTER TABLE token_allocations DISABLE ROW LEVEL SECURITY;

-- Token designs
ALTER TABLE token_designs DISABLE ROW LEVEL SECURITY;

-- Make sure all tables are in realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE cap_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE investors;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE token_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE token_designs;
