-- Create cap_tables table
CREATE TABLE IF NOT EXISTS cap_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cap_table_investors junction table
CREATE TABLE IF NOT EXISTS cap_table_investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cap_table_id UUID REFERENCES cap_tables(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES investors(investor_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cap_table_id, investor_id)
);

-- Add RLS policies
ALTER TABLE cap_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_table_investors ENABLE ROW LEVEL SECURITY;

-- Create policies for cap_tables
DROP POLICY IF EXISTS "Users can view their own cap tables" ON cap_tables;
CREATE POLICY "Users can view their own cap tables"
  ON cap_tables FOR SELECT
  USING (auth.uid() = project_id);

DROP POLICY IF EXISTS "Users can insert their own cap tables" ON cap_tables;
CREATE POLICY "Users can insert their own cap tables"
  ON cap_tables FOR INSERT
  WITH CHECK (auth.uid() = project_id);

DROP POLICY IF EXISTS "Users can update their own cap tables" ON cap_tables;
CREATE POLICY "Users can update their own cap tables"
  ON cap_tables FOR UPDATE
  USING (auth.uid() = project_id);

DROP POLICY IF EXISTS "Users can delete their own cap tables" ON cap_tables;
CREATE POLICY "Users can delete their own cap tables"
  ON cap_tables FOR DELETE
  USING (auth.uid() = project_id);

-- Create policies for cap_table_investors
DROP POLICY IF EXISTS "Users can view their own cap table investors" ON cap_table_investors;
CREATE POLICY "Users can view their own cap table investors"
  ON cap_table_investors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cap_tables
      WHERE cap_tables.id = cap_table_investors.cap_table_id
      AND cap_tables.project_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own cap table investors" ON cap_table_investors;
CREATE POLICY "Users can insert their own cap table investors"
  ON cap_table_investors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cap_tables
      WHERE cap_tables.id = cap_table_investors.cap_table_id
      AND cap_tables.project_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own cap table investors" ON cap_table_investors;
CREATE POLICY "Users can delete their own cap table investors"
  ON cap_table_investors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cap_tables
      WHERE cap_tables.id = cap_table_investors.cap_table_id
      AND cap_tables.project_id = auth.uid()
    )
  );

-- Add realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE cap_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE cap_table_investors;
