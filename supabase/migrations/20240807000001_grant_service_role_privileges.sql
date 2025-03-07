-- Grant all privileges to the service role for all tables

-- Grant privileges on all tables in the public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Explicitly grant privileges on cap_tables table
GRANT ALL PRIVILEGES ON TABLE cap_tables TO service_role;

-- Explicitly grant privileges on projects table
GRANT ALL PRIVILEGES ON TABLE projects TO service_role;

-- Explicitly grant privileges on investors table
GRANT ALL PRIVILEGES ON TABLE investors TO service_role;

-- Explicitly grant privileges on subscriptions table
GRANT ALL PRIVILEGES ON TABLE subscriptions TO service_role;

-- Explicitly grant privileges on token_allocations table
GRANT ALL PRIVILEGES ON TABLE token_allocations TO service_role;

-- Explicitly grant privileges on token_designs table
GRANT ALL PRIVILEGES ON TABLE token_designs TO service_role;

-- Explicitly grant privileges on cap_table_investors table
GRANT ALL PRIVILEGES ON TABLE cap_table_investors TO service_role;
