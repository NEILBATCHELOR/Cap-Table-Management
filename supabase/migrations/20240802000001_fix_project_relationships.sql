-- Fix project relationships and add cascade delete

-- Make sure the projects table has proper timestamps
ALTER TABLE projects ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE projects ALTER COLUMN updated_at SET DEFAULT NOW();

-- Make sure the cap_tables table has proper timestamps and relationships
ALTER TABLE cap_tables ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE cap_tables ALTER COLUMN updated_at SET DEFAULT NOW();

-- Drop existing constraint if it exists
ALTER TABLE cap_tables DROP CONSTRAINT IF EXISTS cap_tables_project_id_fkey;

-- Add cascade delete constraint
ALTER TABLE cap_tables ADD CONSTRAINT cap_tables_project_id_fkey
  FOREIGN KEY (project_id)
  REFERENCES projects(id)
  ON DELETE CASCADE;

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE cap_tables;
