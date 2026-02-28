/**
 * Extracts a user-facing error message from various backend response shapes:
 * - err.error.message, err.error.data.message, err.error.errors[0]
 * - err.error as string, err.message
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err == null) return fallback;
  if (typeof err === 'string') return err;
  const obj = err as Record<string, unknown>;
  const body = obj?.['error'];
  if (typeof body === 'string') return body;
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (typeof b['message'] === 'string') return b['message'] as string;
    const data = b['data'];
    if (data && typeof data === 'object' && typeof (data as Record<string, unknown>)['message'] === 'string') {
      return (data as Record<string, unknown>)['message'] as string;
    }
    const errors = b['errors'];
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object' && typeof (first as Record<string, unknown>)['message'] === 'string') {
        return (first as Record<string, unknown>)['message'] as string;
      }
    }
  }
  if (typeof obj['message'] === 'string') return obj['message'] as string;
  return fallback;
}
