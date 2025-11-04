/**
 * Validation Utility Functions
 * Common validation helpers for the application
 */

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export const isStrongPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate phone number (US format)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate URL format
 */
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Sanitize string input (remove HTML tags)
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
};

/**
 * Validate required fields
 */
export const validateRequiredFields = (data, requiredFields) => {
  const errors = [];

  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate object schema
 */
export const validateSchema = (data, schema) => {
  const errors = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];

    // Check required
    if (rules.required && !value) {
      errors.push(`${key} is required`);
      continue;
    }

    // Skip if not required and not provided
    if (!rules.required && !value) {
      continue;
    }

    // Check type
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${key} must be of type ${rules.type}`);
    }

    // Check min length
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${key} must be at least ${rules.minLength} characters`);
    }

    // Check max length
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${key} must not exceed ${rules.maxLength} characters`);
    }

    // Check min value
    if (rules.min && value < rules.min) {
      errors.push(`${key} must be at least ${rules.min}`);
    }

    // Check max value
    if (rules.max && value > rules.max) {
      errors.push(`${key} must not exceed ${rules.max}`);
    }

    // Custom validation
    if (rules.validate && !rules.validate(value)) {
      errors.push(`${key} is invalid`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  isValidEmail,
  isStrongPassword,
  isValidPhone,
  isValidURL,
  sanitizeString,
  validateRequiredFields,
  validateSchema
};
