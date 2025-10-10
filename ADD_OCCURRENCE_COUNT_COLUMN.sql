-- Add occurrence_count column to track how many times a recurring expense has been created
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS occurrence_count INTEGER DEFAULT 0;

COMMENT ON COLUMN expenses.occurrence_count IS 'Number of times this recurring expense has been processed and created';

-- Set default to 0 for existing recurring expenses
UPDATE expenses 
SET occurrence_count = 0 
WHERE expense_type = 'recurring' AND occurrence_count IS NULL;
