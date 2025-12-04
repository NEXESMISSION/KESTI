/**
 * Business Logic Validation
 * Prevents common security issues in business operations
 */

/**
 * Prevent duplicate submissions (double-clicking, etc.)
 */
export class DuplicateSubmissionPreventer {
  private submissions = new Map<string, number>()
  private readonly cooldown: number

  constructor(cooldownMs: number = 2000) {
    this.cooldown = cooldownMs
  }

  /**
   * Check if submission is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const lastSubmission = this.submissions.get(identifier)

    if (lastSubmission && now - lastSubmission < this.cooldown) {
      return false // Too soon, reject
    }

    this.submissions.set(identifier, now)
    return true
  }

  /**
   * Clear a submission record
   */
  clear(identifier: string): void {
    this.submissions.delete(identifier)
  }

  /**
   * Clean up old entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.submissions.entries())
    for (const [key, timestamp] of entries) {
      if (now - timestamp > this.cooldown * 2) {
        this.submissions.delete(key)
      }
    }
  }
}

/**
 * Price validation to prevent manipulation
 */
export function validatePrice(price: number, options: {
  minPrice?: number
  maxPrice?: number
  allowZero?: boolean
} = {}): { valid: boolean; error?: string } {
  const { minPrice = 0, maxPrice = 1000000, allowZero = false } = options

  // Check if number
  if (typeof price !== 'number' || isNaN(price)) {
    return { valid: false, error: 'Price must be a valid number' }
  }

  // Check if zero is allowed
  if (price === 0 && !allowZero) {
    return { valid: false, error: 'Price cannot be zero' }
  }

  // Check if negative
  if (price < 0) {
    return { valid: false, error: 'Price cannot be negative' }
  }

  // Check min/max bounds
  if (price < minPrice) {
    return { valid: false, error: `Price cannot be less than ${minPrice}` }
  }

  if (price > maxPrice) {
    return { valid: false, error: `Price cannot exceed ${maxPrice}` }
  }

  // Check for unrealistic decimal places (more than 2)
  const decimalPlaces = (price.toString().split('.')[1] || '').length
  if (decimalPlaces > 2) {
    return { valid: false, error: 'Price can have maximum 2 decimal places' }
  }

  return { valid: true }
}

/**
 * Quantity validation
 */
export function validateQuantity(quantity: number, options: {
  minQuantity?: number
  maxQuantity?: number
  allowDecimals?: boolean
} = {}): { valid: boolean; error?: string } {
  const { minQuantity = 0, maxQuantity = 10000, allowDecimals = false } = options

  // Check if number
  if (typeof quantity !== 'number' || isNaN(quantity)) {
    return { valid: false, error: 'Quantity must be a valid number' }
  }

  // Check if negative
  if (quantity < 0) {
    return { valid: false, error: 'Quantity cannot be negative' }
  }

  // Check if zero
  if (quantity === 0) {
    return { valid: false, error: 'Quantity must be greater than zero' }
  }

  // Check decimals
  if (!allowDecimals && quantity % 1 !== 0) {
    return { valid: false, error: 'Quantity must be a whole number' }
  }

  // Check min/max bounds
  if (quantity < minQuantity) {
    return { valid: false, error: `Quantity cannot be less than ${minQuantity}` }
  }

  if (quantity > maxQuantity) {
    return { valid: false, error: `Quantity cannot exceed ${maxQuantity}` }
  }

  return { valid: true }
}

/**
 * Validate discount percentage
 */
export function validateDiscount(discount: number): { valid: boolean; error?: string } {
  if (typeof discount !== 'number' || isNaN(discount)) {
    return { valid: false, error: 'Discount must be a valid number' }
  }

  if (discount < 0) {
    return { valid: false, error: 'Discount cannot be negative' }
  }

  if (discount > 100) {
    return { valid: false, error: 'Discount cannot exceed 100%' }
  }

  return { valid: true }
}

/**
 * Validate transaction total
 */
export function validateTransactionTotal(
  items: Array<{ price: number; quantity: number }>,
  expectedTotal: number
): { valid: boolean; error?: string; calculatedTotal?: number } {
  // Calculate total from items
  let calculatedTotal = 0
  
  for (const item of items) {
    const priceValidation = validatePrice(item.price)
    if (!priceValidation.valid) {
      return { valid: false, error: `Invalid item price: ${priceValidation.error}` }
    }

    const quantityValidation = validateQuantity(item.quantity, { allowDecimals: true })
    if (!quantityValidation.valid) {
      return { valid: false, error: `Invalid item quantity: ${quantityValidation.error}` }
    }

    calculatedTotal += item.price * item.quantity
  }

  // Round to 2 decimal places
  calculatedTotal = Math.round(calculatedTotal * 100) / 100

  // Check if matches expected total (with small tolerance for rounding)
  const tolerance = 0.01
  if (Math.abs(calculatedTotal - expectedTotal) > tolerance) {
    return {
      valid: false,
      error: `Transaction total mismatch. Expected: ${expectedTotal}, Calculated: ${calculatedTotal}`,
      calculatedTotal
    }
  }

  return { valid: true, calculatedTotal }
}

/**
 * Prevent rapid repeated actions (automation detection)
 */
export class ActionRateLimiter {
  private actions = new Map<string, number[]>()

  /**
   * Check if action is allowed
   * @param identifier - Unique identifier (userId + action type)
   * @param maxActions - Maximum actions allowed
   * @param windowMs - Time window in milliseconds
   */
  isAllowed(identifier: string, maxActions: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now()
    const timestamps = this.actions.get(identifier) || []

    // Remove old timestamps outside the window
    const recentTimestamps = timestamps.filter(ts => now - ts < windowMs)

    if (recentTimestamps.length >= maxActions) {
      return false // Rate limit exceeded
    }

    recentTimestamps.push(now)
    this.actions.set(identifier, recentTimestamps)

    return true
  }

  /**
   * Clean up old entries
   */
  cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.actions.entries())
    for (const [key, timestamps] of entries) {
      const recent = timestamps.filter((ts: number) => now - ts < 300000) // Keep last 5 minutes
      if (recent.length === 0) {
        this.actions.delete(key)
      } else {
        this.actions.set(key, recent)
      }
    }
  }
}

/**
 * Validate redirect URLs to prevent open redirect attacks
 */
export function validateRedirectUrl(url: string, allowedDomains: string[]): boolean {
  try {
    // Only allow relative URLs or URLs from allowed domains
    if (url.startsWith('/')) {
      return true // Relative URL is safe
    }

    const urlObj = new URL(url)
    
    // Check if domain is in allowed list
    return allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false // Invalid URL
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' }
  }

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email is too long' }
  }

  return { valid: true }
}

/**
 * Validate phone number (basic)
 */
export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  
  // Check if it's all digits (with optional + at start)
  const phoneRegex = /^\+?\d{8,15}$/
  
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: 'Invalid phone number format' }
  }

  return { valid: true }
}

/**
 * Sanitize filename for uploads
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .substring(0, 255) // Limit length
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(
  filename: string,
  allowedExtensions: string[]
): { allowed: boolean; error?: string } {
  const extension = filename.split('.').pop()?.toLowerCase()
  
  if (!extension) {
    return { allowed: false, error: 'File has no extension' }
  }

  if (!allowedExtensions.includes(extension)) {
    return {
      allowed: false,
      error: `File type .${extension} is not allowed. Allowed types: ${allowedExtensions.join(', ')}`
    }
  }

  return { allowed: true }
}

/**
 * Validate file size
 */
export function validateFileSize(
  sizeBytes: number,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  
  if (sizeBytes > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`
    }
  }

  return { valid: true }
}

// Export singleton instances
export const duplicateSubmissionPreventer = new DuplicateSubmissionPreventer()
export const actionRateLimiter = new ActionRateLimiter()

// Cleanup old entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    duplicateSubmissionPreventer.cleanup()
    actionRateLimiter.cleanup()
  }, 300000)
}
