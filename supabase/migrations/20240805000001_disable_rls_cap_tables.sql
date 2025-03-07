-- Disable RLS for cap_tables table
ALTER TABLE cap_tables DISABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON cap_tables;
CREATE POLICY "Allow all operations for authenticated users"
  ON cap_tables
  FOR ALL
  USING (true);

-- Make sure realtime is enabled
ALTER PUBLICATION supabase_realtime ADD TABLE cap_tables;
