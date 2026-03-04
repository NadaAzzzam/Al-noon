import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError, Observable } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { LocalizedPathService } from '../../../core/services/localized-path.service';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authSpy: { forgotPassword: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authSpy = { forgotPassword: vi.fn().mockReturnValue(of({ success: true })) };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
        { provide: LocalizedPathService, useValue: { path: vi.fn((...s: string[]) => ['/en', ...s]) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have forgot-password form and email input', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form.auth-form')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('input[type="email"]')).toBeTruthy();
  });

  it('should call auth.forgotPassword with trimmed email on valid submit', () => {
    fixture.detectChanges();
    component.email.set('  user@example.com  ');
    component.submit();
    expect(authSpy.forgotPassword).toHaveBeenCalledWith('user@example.com');
  });

  it('should set success to true on successful forgotPassword', () => {
    fixture.detectChanges();
    component.email.set('user@example.com');
    component.submit();
    expect(component.success()).toBe(true);
    expect(component.submitting()).toBe(false);
  });

  it('should set error when forgotPassword fails', () => {
    authSpy.forgotPassword.mockReturnValue(
      throwError(() => ({ message: 'Email not found' }))
    );
    fixture.detectChanges();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { errors: { forgotPasswordFailed: 'Request failed' } }, true);
    component.email.set('unknown@example.com');
    component.submit();
    expect(component.error()).toBe('Email not found');
    expect(component.submitting()).toBe(false);
  });

  it('should use translated error when API error has no message', () => {
    authSpy.forgotPassword.mockReturnValue(throwError(() => ({})));
    fixture.detectChanges();
    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('en');
    translate.use('en');
    translate.setTranslation('en', { errors: { forgotPasswordFailed: 'Request failed' } }, true);
    component.email.set('user@example.com');
    component.submit();
    expect(component.error()).toBe('Request failed');
  });

  it('should not call auth.forgotPassword when email is invalid after submit', () => {
    fixture.detectChanges();
    component.email.set('invalid-email');
    component.submit();
    expect(authSpy.forgotPassword).not.toHaveBeenCalled();
  });

  it('should not call auth.forgotPassword twice when submit is called twice (submitting guard)', () => {
    let complete: () => void;
    const pending = new Observable<{ success: boolean }>((sub) => {
      complete = () => {
        sub.next({ success: true });
        sub.complete();
      };
    });
    authSpy.forgotPassword.mockReturnValue(pending);
    fixture.detectChanges();
    component.email.set('user@example.com');
    component.submit();
    component.submit();
    expect(authSpy.forgotPassword).toHaveBeenCalledTimes(1);
  });
});
