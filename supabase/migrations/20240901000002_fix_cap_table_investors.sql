-- Fix the cap_table_investors table to use the correct foreign key reference

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE IF EXISTS cap_table_investors
DROP CONSTRAINT IF EXISTS cap_table_investors_investor_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE cap_table_investors
ADD CONSTRAINT cap_table_investors_investor_id_fkey
FOREIGN KEY (investor_id)
REFERENCES investors(investor_id);

-- Make sure the investor_id column is not null
ALTER TABLE cap_table_investors
ALTER COLUMN investor_id SET NOT NULL;
