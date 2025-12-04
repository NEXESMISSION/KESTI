/**
 * Security Logging System
 * Logs important security events for monitoring and auditing
 */

import { supabase } from './supabase'

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_DELETED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_UNSUSPENDED'
  | 'DEVICE_REGISTERED'
  | 'DEVICE_REVOKED'
  | 'UNAUTHORIZED_ACCESS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'DATA_EXPORT'
  | 'DATA_DELETION'
  | 'PERMISSION_CHANGE'
  | 'API_ERROR'

export interface SecurityLogEntry {
  event_type: SecurityEventType
  user_id?: string
  ip_address?: string
  user_agent?: string
  details?: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
}

/**
 * Log a security event
 */
export async function logSecurityEvent(
  eventType: SecurityEventType,
  options: {
    userId?: string
    ipAddress?: string
    userAgent?: string
    details?: Record<string, any>
    severity?: SecurityLogEntry['severity']
  } = {}
): Promise<void> {
  const severity = options.severity || determineSeverity(eventType)
  
  const logEntry: SecurityLogEntry = {
    event_type: eventType,
    user_id: options.userId,
    ip_address: options.ipAddress,
    user_agent: options.userAgent,
    details: options.details,
    severity,
    timestamp: new Date().toISOString()
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 Security Event:', logEntry)
  }

  // In production, you would send to:
  // 1. Database table (security_logs)
  // 2. External logging service (LogRocket, Sentry, etc.)
  // 3. SIEM system
  
  // Example: Save to Supabase (create table first)
  try {
    // Uncomment when security_logs table is created
    /*
    await supabase
      .from('security_logs')
      .insert(logEntry)
    */
    
    // For now, just log to console
    if (severity === 'high' || severity === 'critical') {
      console.error('⚠️ CRITICAL SECURITY EVENT:', logEntry)
    }
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

/**
 * Determine severity based on event type
 */
function determineSeverity(eventType: SecurityEventType): SecurityLogEntry['severity'] {
  const severityMap: Record<SecurityEventType, SecurityLogEntry['severity']> = {
    LOGIN_SUCCESS: 'low',
    LOGIN_FAILED: 'medium',
    LOGOUT: 'low',
    PASSWORD_CHANGE: 'medium',
    ACCOUNT_CREATED: 'low',
    ACCOUNT_DELETED: 'high',
    ACCOUNT_SUSPENDED: 'high',
    ACCOUNT_UNSUSPENDED: 'medium',
    DEVICE_REGISTERED: 'low',
    DEVICE_REVOKED: 'medium',
    UNAUTHORIZED_ACCESS: 'critical',
    RATE_LIMIT_EXCEEDED: 'medium',
    SUSPICIOUS_ACTIVITY: 'high',
    DATA_EXPORT: 'medium',
    DATA_DELETION: 'high',
    PERMISSION_CHANGE: 'high',
    API_ERROR: 'low'
  }
  
  return severityMap[eventType] || 'medium'
}

/**
 * Log failed login attempts (for brute force detection)
 */
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: number }>()

export function trackFailedLogin(identifier: string): {
  attempts: number
  blocked: boolean
} {
  const now = Date.now()
  const record = failedLoginAttempts.get(identifier)
  
  if (!record || now - record.lastAttempt > 300000) { // 5 minutes
    failedLoginAttempts.set(identifier, { count: 1, lastAttempt: now })
    return { attempts: 1, blocked: false }
  }
  
  record.count++
  record.lastAttempt = now
  
  // Block after 5 failed attempts in 5 minutes
  if (record.count >= 5) {
    logSecurityEvent('SUSPICIOUS_ACTIVITY', {
      details: { 
        reason: 'Multiple failed login attempts',
        identifier,
        attempts: record.count
      },
      severity: 'high'
    })
    return { attempts: record.count, blocked: true }
  }
  
  return { attempts: record.count, blocked: false }
}

/**
 * Clear failed login attempts (on successful login)
 */
export function clearFailedLoginAttempts(identifier: string): void {
  failedLoginAttempts.delete(identifier)
}

/**
 * Detect suspicious patterns
 */
export function detectSuspiciousActivity(
  userId: string,
  activity: {
    type: string
    frequency: number
    timeWindow: number
  }
): boolean {
  // Example: Detect rapid repeated actions
  if (activity.frequency > 100 && activity.timeWindow < 60000) {
    logSecurityEvent('SUSPICIOUS_ACTIVITY', {
      userId,
      details: {
        reason: 'Abnormally high activity rate',
        type: activity.type,
        frequency: activity.frequency,
        timeWindow: activity.timeWindow
      },
      severity: 'high'
    })
    return true
  }
  
  return false
}

/**
 * Get security logs for a user (admin only)
 */
export async function getUserSecurityLogs(userId: string, limit: number = 50) {
  // This would query the security_logs table
  // For now, return empty array
  return []
}

/**
 * Create the security_logs table SQL
 * Run this in Supabase SQL editor:
 */
export const SECURITY_LOGS_TABLE_SQL = `
-- Create security_logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_timestamp ON security_logs(timestamp DESC);
CREATE INDEX idx_security_logs_severity ON security_logs(severity);

-- Enable RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can view all logs
CREATE POLICY "Super admins can view security logs"
  ON security_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Policy: Users can view their own logs
CREATE POLICY "Users can view their own security logs"
  ON security_logs FOR SELECT
  USING (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE security_logs IS 'Security event logging for audit and monitoring';
`
