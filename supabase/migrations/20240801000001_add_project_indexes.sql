-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS cap_tables_project_id_idx ON cap_tables (project_id);

-- Add cascade delete for cap tables when a project is deleted
ALTER TABLE cap_tables DROP CONSTRAINT IF EXISTS cap_tables_project_id_fkey;
ALTER TABLE cap_tables ADD CONSTRAINT cap_tables_project_id_fkey
  FOREIGN KEY (project_id)
  REFERENCES projects(id)
  ON DELETE CASCADE;

-- Enable realtime for projects table
alter publication supabase_realtime add table projects;
