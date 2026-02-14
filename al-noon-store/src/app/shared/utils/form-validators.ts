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

/** Return i18n key for email validation (for use with TranslateService). */
export function emailErrorKey(value: string): string | null {
  if (!value?.trim()) return 'errors.required';
  if (!EMAIL_REGEX.test(value.trim())) return 'errors.invalidEmail';
  return null;
}

/** Return i18n key + fieldKey for required validation (for use with TranslateService). */
export function requiredErrorKey(value: string, fieldKey: string): { key: string; fieldKey: string } | null {
  if (!value?.trim()) return { key: 'errors.fieldRequired', fieldKey };
  return null;
}

/** Return i18n key for password validation (for use with TranslateService). */
export function passwordErrorKey(value: string, minLength = 6): string | null {
  if (!value) return 'errors.required';
  if (value.length < minLength) return 'errors.minChars';
  return null;
}

/** Return i18n key for minLength validation (for use with TranslateService). Params: min. */
export function minLengthErrorKey(value: string, min: number, _fieldKey?: string): string | null {
  if (!value?.trim()) return 'errors.required';
  if (value.trim().length < min) return 'errors.minChars';
  return null;
}

/** Optional phone: when value is provided, validate format (digits, 10–15 chars). Return error message or null. */
export function phoneError(value: string): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return 'Invalid phone (10–15 digits)';
  return null;
}

/** Return i18n key for optional phone validation. */
export function phoneErrorKey(value: string): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return 'errors.invalidPhone';
  return null;
}
