import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../../core/services/toast.service';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [ToastService],
    }).compileComponents();
    fixture = TestBed.createComponent(ToastComponent);
    toastService = TestBed.inject(ToastService);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not render when no toasts', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.toast-container')).toBeNull();
  });

  it('should render toasts when ToastService has toasts', () => {
    toastService.show('Test message', 'success');
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('.toast-container');
    expect(container).toBeTruthy();
    expect(container?.textContent).toContain('Test message');
    expect(container?.querySelector('.toast-success')).toBeTruthy();
  });

  it('should dismiss toast when close button is clicked', () => {
    toastService.show('Dismiss me', 'info');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.toast-container')).toBeTruthy();
    const closeBtn = fixture.nativeElement.querySelector('.toast-close');
    closeBtn?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(toastService.hasToasts()).toBe(false);
  });
});
