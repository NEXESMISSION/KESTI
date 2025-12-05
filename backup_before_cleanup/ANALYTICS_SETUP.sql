-- Analytics and Conversion Tracking System
-- Run this SQL in Supabase SQL Editor

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  browser TEXT,
  os TEXT,
  country TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_utm_source ON analytics_events(utm_source);
CREATE INDEX idx_analytics_utm_campaign ON analytics_events(utm_campaign);
CREATE INDEX idx_analytics_device_type ON analytics_events(device_type);

-- Create composite indexes for common queries
CREATE INDEX idx_analytics_event_date ON analytics_events(event_name, created_at DESC);
CREATE INDEX idx_analytics_utm_tracking ON analytics_events(utm_source, utm_campaign, event_name);

-- Enable RLS (Row Level Security)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can view all analytics
CREATE POLICY "Super admins can view all analytics"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Policy: Anyone can insert analytics (for tracking)
CREATE POLICY "Anyone can insert analytics"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE analytics_events IS 'Tracks user interactions, conversions, and marketing campaign performance';

-- Create conversion funnel view
CREATE OR REPLACE VIEW conversion_funnel AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND page_url LIKE '%index%' THEN session_id END) as landing_page_views,
  COUNT(DISTINCT CASE WHEN event_name = 'signup_attempt' THEN session_id END) as signup_attempts,
  COUNT(DISTINCT CASE WHEN event_name = 'signup_success' THEN session_id END) as signups_completed,
  COUNT(DISTINCT CASE WHEN event_name = 'login_success' THEN user_id END) as active_users
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create UTM performance view
CREATE OR REPLACE VIEW utm_performance AS
SELECT 
  utm_source,
  utm_campaign,
  utm_medium,
  COUNT(DISTINCT session_id) as sessions,
  COUNT(DISTINCT CASE WHEN event_name = 'signup_attempt' THEN session_id END) as signup_attempts,
  COUNT(DISTINCT CASE WHEN event_name = 'signup_success' THEN session_id END) as conversions,
  ROUND(
    (COUNT(DISTINCT CASE WHEN event_name = 'signup_success' THEN session_id END)::NUMERIC / 
     NULLIF(COUNT(DISTINCT session_id), 0) * 100), 
    2
  ) as conversion_rate
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND utm_source IS NOT NULL
GROUP BY utm_source, utm_campaign, utm_medium
ORDER BY conversions DESC;

-- Create daily analytics summary view
CREATE OR REPLACE VIEW daily_analytics AS
SELECT 
  DATE(created_at) as date,
  event_name,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) as unique_users
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at), event_name
ORDER BY date DESC, event_count DESC;

-- Grant access to views for authenticated users
GRANT SELECT ON conversion_funnel TO authenticated;
GRANT SELECT ON utm_performance TO authenticated;
GRANT SELECT ON daily_analytics TO authenticated;

-- Create function to get analytics dashboard data
CREATE OR REPLACE FUNCTION get_analytics_dashboard(days_back INT DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Only super admins can access this
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_sessions', (
      SELECT COUNT(DISTINCT session_id)
      FROM analytics_events
      WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    'total_page_views', (
      SELECT COUNT(*)
      FROM analytics_events
      WHERE event_name = 'page_view'
      AND created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    'signup_attempts', (
      SELECT COUNT(*)
      FROM analytics_events
      WHERE event_name = 'signup_attempt'
      AND created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    'signups_completed', (
      SELECT COUNT(*)
      FROM analytics_events
      WHERE event_name = 'signup_success'
      AND created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    'conversion_rate', (
      SELECT ROUND(
        (COUNT(DISTINCT CASE WHEN event_name = 'signup_success' THEN session_id END)::NUMERIC / 
         NULLIF(COUNT(DISTINCT session_id), 0) * 100),
        2
      )
      FROM analytics_events
      WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    ),
    'top_utm_sources', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT utm_source, COUNT(DISTINCT session_id) as sessions
        FROM analytics_events
        WHERE utm_source IS NOT NULL
        AND created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY utm_source
        ORDER BY sessions DESC
        LIMIT 10
      ) t
    ),
    'device_breakdown', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT device_type, COUNT(DISTINCT session_id) as sessions
        FROM analytics_events
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY device_type
      ) t
    ),
    'daily_trend', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          DATE(created_at) as date,
          COUNT(DISTINCT session_id) as sessions,
          COUNT(DISTINCT CASE WHEN event_name = 'signup_success' THEN session_id END) as conversions
        FROM analytics_events
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT days_back
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Analytics tables and views created successfully!';
  RAISE NOTICE 'You can now track user interactions and conversion metrics.';
  RAISE NOTICE 'Use SELECT * FROM conversion_funnel to see conversion rates.';
  RAISE NOTICE 'Use SELECT * FROM utm_performance to analyze campaign performance.';
END $$;
