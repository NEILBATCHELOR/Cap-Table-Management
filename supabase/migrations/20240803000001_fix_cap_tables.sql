-- Fix cap tables relationships and add missing columns

-- Make sure the cap_tables table has proper timestamps and relationships
ALTER TABLE cap_tables ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE cap_tables ALTER COLUMN updated_at SET DEFAULT NOW();

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS cap_tables_project_id_idx ON cap_tables (project_id);

-- Enable realtime for cap_tables
ALTER PUBLICATION supabase_realtime ADD TABLE cap_tables;

-- Create cap_table_investors table if it doesn't exist
CREATE TABLE IF NOT EXISTS cap_table_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cap_table_id UUID NOT NULL REFERENCES cap_tables(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cap_table_id, investor_id)
);

-- Enable realtime for cap_table_investors
ALTER PUBLICATION supabase_realtime ADD TABLE cap_table_investors;
