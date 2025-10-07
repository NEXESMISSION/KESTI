/**
 * Utility functions for dealing with PostgreSQL ENUM types in TypeScript
 */

/**
 * Safely converts any value to a string, handling PostgreSQL ENUMs
 * @param value The value to convert
 * @returns string representation of the value
 */
export function enumToString(value: any): string {
  // Handle undefined/null
  if (value === null || value === undefined) {
    return '';
  }
  
  // Handle objects that may have toString() method overridden (like PostgreSQL ENUMs)
  if (typeof value === 'object') {
    return value.toString();
  }
  
  // Handle primitive values
  return String(value);
}

/**
 * Check if a value is equal to a PostgreSQL ENUM value
 * @param value The value to check, could be a PostgreSQL ENUM
 * @param compareValue The string value to compare against
 * @returns boolean indicating if values are equal
 */
export function isEnumValue(value: any, compareValue: string): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  // Convert to string and compare
  return enumToString(value) === compareValue;
}

/**
 * Type guard to check if a value is one of the specified user roles
 * @param value Value to check, possibly a PostgreSQL ENUM
 * @param roles Array of allowed role strings
 * @returns boolean indicating if the value is one of the allowed roles
 */
export function isUserRole(value: any, roles: string[]): boolean {
  const roleStr = enumToString(value);
  return roles.includes(roleStr);
}

/**
 * Safely parse the role from a user profile for displaying or checking
 * @param profile User profile object that may contain a role field
 * @returns string representation of the role or empty string if not found
 */
export function getUserRole(profile: any): string {
  if (!profile || !profile.role) {
    return '';
  }
  
  return enumToString(profile.role);
}
