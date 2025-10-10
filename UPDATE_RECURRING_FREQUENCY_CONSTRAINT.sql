-- Update recurring_frequency constraint to include 'custom' option
-- Run this SQL in your Supabase SQL Editor

-- First, drop the existing constraint
ALTER TABLE expenses 
DROP CONSTRAINT IF EXISTS expenses_recurring_frequency_check;

-- Add the new constraint with 'custom' included
ALTER TABLE expenses 
ADD CONSTRAINT expenses_recurring_frequency_check 
CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly', 'custom'));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'expenses'::regclass 
AND conname = 'expenses_recurring_frequency_check';
