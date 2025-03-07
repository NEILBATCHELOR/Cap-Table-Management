-- Fix cap table creation issues

-- Make sure the cap_tables table has proper timestamps and relationships
ALTER TABLE cap_tables ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE cap_tables ALTER COLUMN updated_at SET DEFAULT NOW();

-- Add NOT NULL constraint to project_id if it doesn't exist
ALTER TABLE cap_tables ALTER COLUMN project_id SET NOT NULL;

-- Make sure the cap_tables table has proper indexes
CREATE INDEX IF NOT EXISTS cap_tables_project_id_idx ON cap_tables (project_id);

-- Enable realtime for cap_tables if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE cap_tables;
