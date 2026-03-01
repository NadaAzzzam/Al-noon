import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { GlobalErrorHandler } from './global-error.handler';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('when platform is browser', () => {
    beforeEach(() => {
      consoleSpy.mockClear();
      TestBed.configureTestingModule({
        providers: [
          GlobalErrorHandler,
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      handler = TestBed.inject(GlobalErrorHandler);
    });

    it('should log error to console', () => {
      const err = new Error('browser error');
      handler.handleError(err);
      expect(consoleSpy).toHaveBeenCalledWith('Unhandled error:', err);
    });

    it('should handle string errors', () => {
      handler.handleError('string error');
      expect(consoleSpy).toHaveBeenCalledWith('Unhandled error:', 'string error');
    });

    it('should handle null', () => {
      handler.handleError(null);
      expect(consoleSpy).toHaveBeenCalledWith('Unhandled error:', null);
    });
  });

  describe('when platform is server', () => {
    beforeEach(() => {
      consoleSpy.mockClear();
      TestBed.configureTestingModule({
        providers: [
          GlobalErrorHandler,
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      handler = TestBed.inject(GlobalErrorHandler);
    });

    it('should not log Unhandled error in server', () => {
      handler.handleError(new Error('server error'));
      const calls = consoleSpy.mock.calls.filter((c: unknown[]) => c[0] === 'Unhandled error:');
      expect(calls).toHaveLength(0);
    });
  });
});
