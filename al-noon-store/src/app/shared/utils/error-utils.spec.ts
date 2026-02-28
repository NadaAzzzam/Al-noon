import { describe, it, expect } from 'vitest';
import { extractErrorMessage } from './error-utils';

describe('extractErrorMessage', () => {
  const fallback = 'Something went wrong';

  it('returns fallback for null/undefined', () => {
    expect(extractErrorMessage(null, fallback)).toBe(fallback);
    expect(extractErrorMessage(undefined, fallback)).toBe(fallback);
  });

  it('returns string error as-is', () => {
    expect(extractErrorMessage('Custom error', fallback)).toBe('Custom error');
  });

  it('extracts err.error.message', () => {
    expect(extractErrorMessage({ error: { message: 'Backend says no' } }, fallback)).toBe('Backend says no');
  });

  it('extracts err.error when string', () => {
    expect(extractErrorMessage({ error: 'API error string' }, fallback)).toBe('API error string');
  });

  it('extracts err.error.data.message', () => {
    expect(
      extractErrorMessage({ error: { data: { message: 'Nested message' } } }, fallback)
    ).toBe('Nested message');
  });

  it('extracts err.error.errors[0] when string', () => {
    expect(
      extractErrorMessage({ error: { errors: ['First error'] } }, fallback)
    ).toBe('First error');
  });

  it('extracts err.error.errors[0].message when object', () => {
    expect(
      extractErrorMessage({ error: { errors: [{ message: 'Validation failed' }] } }, fallback)
    ).toBe('Validation failed');
  });

  it('extracts err.message as fallback', () => {
    expect(extractErrorMessage({ message: 'Top-level message' }, fallback)).toBe('Top-level message');
  });

  it('returns fallback when no message found', () => {
    expect(extractErrorMessage({ foo: 'bar' }, fallback)).toBe(fallback);
    expect(extractErrorMessage({ error: {} }, fallback)).toBe(fallback);
    expect(extractErrorMessage({ error: { errors: [] } }, fallback)).toBe(fallback);
  });
});
