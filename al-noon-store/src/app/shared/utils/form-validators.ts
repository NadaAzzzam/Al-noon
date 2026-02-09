/** Simple validators for signal-based forms. Return error message or null if valid. */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailError(value: string): string | null {
  if (!value?.trim()) return 'Required';
  if (!EMAIL_REGEX.test(value.trim())) return 'Invalid email';
  return null;
}

export function passwordError(value: string, minLength = 6): string | null {
  if (!value) return 'Required';
  if (value.length < minLength) return `Min ${minLength} characters`;
  return null;
}

export function requiredError(value: string, fieldName = 'Field'): string | null {
  if (!value?.trim()) return `${fieldName} is required`;
  return null;
}

export function minLengthError(value: string, min: number, fieldName = 'Field'): string | null {
  if (!value?.trim()) return `${fieldName} is required`;
  if (value.trim().length < min) return `Min ${min} characters`;
  return null;
}
