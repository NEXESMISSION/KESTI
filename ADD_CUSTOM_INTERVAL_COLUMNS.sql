-- Add custom interval columns to expenses table for custom recurring frequencies
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS custom_interval_amount INTEGER,
ADD COLUMN IF NOT EXISTS custom_interval_unit TEXT CHECK (custom_interval_unit IN ('minutes', 'hours', 'days', 'weeks', 'months', 'years'));

-- Add comments to explain the new columns
COMMENT ON COLUMN expenses.custom_interval_amount IS 'Number of interval units (e.g., 2 for "every 2 days")';
COMMENT ON COLUMN expenses.custom_interval_unit IS 'Unit of time interval: minutes, hours, days, weeks, months, or years';

-- Optional: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_custom_interval ON expenses(custom_interval_amount, custom_interval_unit) 
WHERE recurring_frequency = 'custom';
