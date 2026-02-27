import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new ToastService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no toasts', () => {
    expect(service.toasts()).toHaveLength(0);
    expect(service.hasToasts()).toBe(false);
  });

  it('should show toast', () => {
    service.show('Hello', 'info');
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].message).toBe('Hello');
    expect(service.toasts()[0].type).toBe('info');
    expect(service.hasToasts()).toBe(true);
  });

  it('should show success toast by default type', () => {
    service.show('Done', 'success');
    expect(service.toasts()[0].type).toBe('success');
  });

  it('should dismiss toast', () => {
    service.show('Hello');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts()).toHaveLength(0);
  });

  it('should auto-dismiss after duration', () => {
    service.show('Hello', 'info', 1000);
    expect(service.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(service.toasts()).toHaveLength(0);
  });
});
