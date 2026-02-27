import { describe, it, expect } from 'vitest';
import {
  emailError,
  passwordError,
  requiredError,
  minLengthError,
  emailErrorKey,
  requiredErrorKey,
  passwordErrorKey,
  minLengthErrorKey,
  phoneError,
  phoneErrorKey,
} from './form-validators';

describe('form-validators', () => {
  describe('emailError', () => {
    it('returns "Required" for empty or whitespace-only value', () => {
      expect(emailError('')).toBe('Required');
      expect(emailError('   ')).toBe('Required');
    });

    it('returns "Invalid email" for invalid email formats', () => {
      expect(emailError('invalid')).toBe('Invalid email');
      expect(emailError('invalid@')).toBe('Invalid email');
      expect(emailError('@domain.com')).toBe('Invalid email');
      expect(emailError('test@.com')).toBe('Invalid email');
    });

    it('returns null for valid email', () => {
      expect(emailError('user@example.com')).toBeNull();
      expect(emailError('user.name@domain.co')).toBeNull();
    });
  });

  describe('passwordError', () => {
    it('returns "Required" for empty value', () => {
      expect(passwordError('')).toBe('Required');
    });

    it('returns error when shorter than min length', () => {
      expect(passwordError('12345', 6)).toBe('Min 6 characters');
      expect(passwordError('ab', 8)).toBe('Min 8 characters');
    });

    it('returns null for valid password', () => {
      expect(passwordError('123456', 6)).toBeNull();
      expect(passwordError('password123', 6)).toBeNull();
    });
  });

  describe('requiredError', () => {
    it('returns error for empty or whitespace', () => {
      expect(requiredError('')).toBe('Field is required');
      expect(requiredError('   ')).toBe('Field is required');
    });

    it('returns null for non-empty value', () => {
      expect(requiredError('value')).toBeNull();
    });

    it('uses custom field name', () => {
      expect(requiredError('', 'Name')).toBe('Name is required');
    });
  });

  describe('minLengthError', () => {
    it('returns required error for empty value', () => {
      expect(minLengthError('', 5)).toBe('Field is required');
    });

    it('returns min length error when too short', () => {
      expect(minLengthError('abc', 5)).toBe('Min 5 characters');
    });

    it('returns null when meets min length', () => {
      expect(minLengthError('hello', 5)).toBeNull();
    });
  });

  describe('emailErrorKey', () => {
    it('returns i18n keys for validation', () => {
      expect(emailErrorKey('')).toBe('errors.required');
      expect(emailErrorKey('invalid')).toBe('errors.invalidEmail');
      expect(emailErrorKey('valid@email.com')).toBeNull();
    });
  });

  describe('requiredErrorKey', () => {
    it('returns key and fieldKey for empty value', () => {
      expect(requiredErrorKey('', 'name')).toEqual({ key: 'errors.fieldRequired', fieldKey: 'name' });
    });

    it('returns null for non-empty value', () => {
      expect(requiredErrorKey('value', 'name')).toBeNull();
    });
  });

  describe('passwordErrorKey', () => {
    it('returns i18n keys for validation', () => {
      expect(passwordErrorKey('')).toBe('errors.required');
      expect(passwordErrorKey('123', 6)).toBe('errors.minChars');
      expect(passwordErrorKey('123456', 6)).toBeNull();
    });
  });

  describe('minLengthErrorKey', () => {
    it('returns i18n keys for validation', () => {
      expect(minLengthErrorKey('', 5)).toBe('errors.required');
      expect(minLengthErrorKey('ab', 5)).toBe('errors.minChars');
      expect(minLengthErrorKey('hello', 5)).toBeNull();
    });
  });

  describe('phoneError', () => {
    it('returns null for empty value (optional)', () => {
      expect(phoneError('')).toBeNull();
      expect(phoneError('   ')).toBeNull();
    });

    it('returns error for invalid phone (too short or too long)', () => {
      expect(phoneError('123')).toBe('Invalid phone (10–15 digits)');
      expect(phoneError('1234567890123456')).toBe('Invalid phone (10–15 digits)');
    });

    it('returns null for valid phone', () => {
      expect(phoneError('1234567890')).toBeNull();
      expect(phoneError('+1 234 567 8901')).toBeNull();
    });
  });

  describe('phoneErrorKey', () => {
    it('returns i18n key for invalid phone', () => {
      expect(phoneErrorKey('123')).toBe('errors.invalidPhone');
    });

    it('returns null for valid or empty phone', () => {
      expect(phoneErrorKey('')).toBeNull();
      expect(phoneErrorKey('1234567890')).toBeNull();
    });
  });
});
