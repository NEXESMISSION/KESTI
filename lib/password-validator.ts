/**
 * Password Validation & Security Utilities
 * Enforces strong password policies
 */

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong' | 'very-strong'
  score: number
}

/**
 * Comprehensive password validation
 * Enforces strong password policies
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  let score = 0

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  } else {
    score += 1
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    score += 1
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    score += 1
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  } else {
    score += 1
  }

  // Check for special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)')
  } else {
    score += 1
  }

  // Check maximum length (prevent DoS)
  if (password.length > 72) {
    errors.push('Password is too long (maximum 72 characters)')
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'letmein', 'welcome', 'monkey', '1234567890', 'admin'
  ]
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common. Please choose a more unique password')
    score = Math.max(0, score - 2)
  }

  // Check for sequential characters
  if (/(\d)\1{2,}/.test(password) || /([a-zA-Z])\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters')
    score = Math.max(0, score - 1)
  }

  // Bonus points for length
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Determine strength
  let strength: PasswordValidationResult['strength']
  if (score <= 2) strength = 'weak'
  else if (score <= 3) strength = 'medium'
  else if (score <= 5) strength = 'strong'
  else strength = 'very-strong'

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  }
}

/**
 * Simple password strength checker for client-side feedback
 */
export function getPasswordStrength(password: string): {
  strength: string
  color: string
  percentage: number
} {
  const result = validatePassword(password)
  
  const colorMap = {
    'weak': '#ef4444',
    'medium': '#f97316',
    'strong': '#10b981',
    'very-strong': '#059669'
  }

  const percentageMap = {
    'weak': 25,
    'medium': 50,
    'strong': 75,
    'very-strong': 100
  }

  return {
    strength: result.strength,
    color: colorMap[result.strength],
    percentage: percentageMap[result.strength]
  }
}

/**
 * Check if password has been compromised (basic check)
 * In production, integrate with Have I Been Pwned API
 */
export function checkPasswordCompromised(password: string): boolean {
  // Basic blacklist - in production, use HIBP API
  const blacklist = [
    'password', 'password123', '12345678', 'qwerty123', 'abc123',
    'letmein', 'welcome123', 'admin123', 'password1', '123456789'
  ]
  return blacklist.includes(password.toLowerCase())
}

/**
 * Generate a strong random password
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = uppercase + lowercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
