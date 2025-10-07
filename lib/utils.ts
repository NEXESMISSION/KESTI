/**
 * General utility functions for the Kesti POS application
 */

/**
 * Format a number as currency
 * @param value The value to format
 * @param currency The currency code (default: TND)
 * @param locale The locale (default: en-US)
 */
export function formatCurrency(
  value: number, 
  currency: string = 'TND', 
  locale: string = 'en-US'
): string {
  // TND might not be supported by all browsers, so we'll use a custom format
  return `${value.toFixed(2)} TND`
}

/**
 * Format a date string
 * @param dateString The date string to format
 * @param options Intl.DateTimeFormatOptions
 * @param locale The locale (default: en-US)
 */
export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  },
  locale: string = 'en-US'
): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale, options).format(date)
}

/**
 * Format a date and time string
 * @param dateString The date string to format
 * @param locale The locale (default: en-US)
 */
export function formatDateTime(dateString: string, locale: string = 'en-US'): string {
  return formatDate(
    dateString,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    locale
  )
}

/**
 * Truncate text with ellipsis
 * @param text The text to truncate
 * @param maxLength The maximum length before truncating
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

/**
 * Calculate the days remaining until a date
 * @param endDateString The end date string
 * @returns The number of days remaining (negative if past)
 */
export function getDaysRemaining(endDateString: string | null): number {
  if (!endDateString) return 0
  
  const endDate = new Date(endDateString)
  const now = new Date()
  
  // Reset time parts for accurate day calculation
  endDate.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  
  const diffTime = endDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Calculate subscription status
 * @param endDateString The subscription end date
 * @returns Object with subscription status info
 */
export function getSubscriptionStatus(endDateString: string | null) {
  if (!endDateString) {
    return { 
      text: 'No Subscription', 
      color: 'text-gray-500',
      isActive: false,
      daysLeft: 0
    }
  }
  
  const daysLeft = getDaysRemaining(endDateString)
  
  if (daysLeft < 0) {
    return { 
      text: 'Expired', 
      color: 'text-red-600',
      isActive: false,
      daysLeft: 0
    }
  }
  
  if (daysLeft < 7) {
    return { 
      text: `${daysLeft} days left`, 
      color: 'text-orange-600',
      isActive: true,
      daysLeft
    }
  }
  
  return { 
    text: `${daysLeft} days left`, 
    color: 'text-green-600',
    isActive: true,
    daysLeft
  }
}

/**
 * Generate a random password
 * @param length Password length (default: 10)
 */
export function generatePassword(length: number = 10): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  // Ensure at least one character from each category
  password += charset.substr(Math.floor(Math.random() * 26), 1) // lowercase
  password += charset.substr(26 + Math.floor(Math.random() * 26), 1) // uppercase
  password += charset.substr(52 + Math.floor(Math.random() * 10), 1) // number
  password += charset.substr(62 + Math.floor(Math.random() * 8), 1) // special
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  // Shuffle the password characters
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('')
}

/**
 * Validate email format
 * @param email Email to validate
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * Debounce a function call
 * @param fn Function to debounce
 * @param delay Delay in ms
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T, 
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  
  return function(...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Group array items by a key
 * @param array Array to group
 * @param key Key to group by
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Handles API errors and returns user-friendly messages
 * @param error Error from API call
 * @returns User-friendly error message
 */
export function getErrorMessage(error: any): string {
  // Handle Supabase errors
  if (error?.code) {
    // Common Supabase error codes
    switch (error.code) {
      case 'PGRST116':
        return 'Permission denied. You do not have access to this resource.'
      case '23505':
        return 'This record already exists.'
      case '23503':
        return 'This operation violates database constraints.'
      case '42501':
        return 'Insufficient privileges to perform this action.'
      case 'P0001':
        return error.message || 'Database constraint violated.'
      default:
        return error.message || 'An unknown error occurred.'
    }
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    return error.message
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error
  }
  
  // Default error message
  return 'An unknown error occurred. Please try again later.'
}
