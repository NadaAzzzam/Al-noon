import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackToTopComponent } from './back-to-top.component';

describe('BackToTopComponent', () => {
  let fixture: ComponentFixture<BackToTopComponent>;
  let scrollToSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    scrollToSpy = vi.fn();
    const win = window as Window & { scrollTo?: (options?: ScrollToOptions) => void };
    win.scrollTo = scrollToSpy as (options?: ScrollToOptions) => void;
    await TestBed.configureTestingModule({
      imports: [BackToTopComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(BackToTopComponent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not show button when visible is false', () => {
    fixture.componentInstance.visible.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.back-to-top')).toBeNull();
  });

  it('should show button when visible is true', () => {
    fixture.componentInstance.visible.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.back-to-top')).toBeTruthy();
  });

  it('should call scrollTo when button is clicked', () => {
    fixture.componentInstance.visible.set(true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.back-to-top');
    btn?.dispatchEvent(new Event('click'));
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
