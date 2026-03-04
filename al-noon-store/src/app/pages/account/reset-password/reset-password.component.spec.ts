import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError, Observable } from 'rxjs';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { LocalizedPathService } from '../../../core/services/localized-path.service';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authSpy: { resetPassword: ReturnType<typeof vi.fn>; isLoggedIn: ReturnType<typeof vi.fn> };
  let routerNavigateSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    routerNavigateSpy = vi.fn();
    authSpy = {
      resetPassword: vi.fn().mockReturnValue(of({ success: true })),
      isLoggedIn: vi.fn().mockReturnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: { navigate: routerNavigateSpy } },
        { provide: AuthService, useValue: authSpy },
        { provide: LocalizedPathService, useValue: { path: vi.fn((...s: string[]) => ['/en', ...s]) } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: { token: 'valid-token' } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show invalid token message when token is missing', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: AuthService, useValue: authSpy },
        { provide: LocalizedPathService, useValue: { path: vi.fn((...s: string[]) => ['/en', ...s]) } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } },
      ],
    }).compileComponents();
    const noTokenFixture = TestBed.createComponent(ResetPasswordComponent);
    noTokenFixture.detectChanges();
    expect(noTokenFixture.nativeElement.querySelector('.error-msg')).toBeTruthy();
    expect(noTokenFixture.nativeElement.querySelector('form')).toBeFalsy();
  });

  it('should show form when token is present', () => {
    fixture.detectChanges();
    expect(component.token()).toBe('valid-token');
    expect(fixture.nativeElement.querySelector('form.auth-form')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('input[type="password"]').length).toBe(2);
  });

  it('should call auth.resetPassword with token and passwords on valid submit', () => {
    fixture.detectChanges();
    component.password.set('newpass123');
    component.confirmPassword.set('newpass123');
    component.submit();
    expect(authSpy.resetPassword).toHaveBeenCalledWith({
      token: 'valid-token',
      password: 'newpass123',
      confirmPassword: 'newpass123',
    });
  });

  it('should set success on successful reset', () => {
    fixture.detectChanges();
    component.password.set('newpass123');
    component.confirmPassword.set('newpass123');
    component.submit();
    expect(component.success()).toBe(true);
    expect(component.submitting()).toBe(false);
  });

  it('should navigate to account when reset succeeds and user is logged in', () => {
    authSpy.isLoggedIn.mockReturnValue(true);
    fixture.detectChanges();
    component.password.set('newpass123');
    component.confirmPassword.set('newpass123');
    component.submit();
    expect(component.success()).toBe(true);
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/en', 'account']);
  });

  it('should set error when resetPassword fails', () => {
    authSpy.resetPassword.mockReturnValue(
      throwError(() => ({ message: 'Token expired' }))
    );
    fixture.detectChanges();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { errors: { resetPasswordFailed: 'Reset failed' } }, true);
    component.password.set('newpass123');
    component.confirmPassword.set('newpass123');
    component.submit();
    expect(component.error()).toBe('Token expired');
    expect(component.submitting()).toBe(false);
  });

  it('should not call auth.resetPassword when password too short', () => {
    fixture.detectChanges();
    component.password.set('12345');
    component.confirmPassword.set('12345');
    component.submit();
    expect(authSpy.resetPassword).not.toHaveBeenCalled();
  });

  it('should not call auth.resetPassword when password and confirm do not match', () => {
    fixture.detectChanges();
    component.password.set('newpass123');
    component.confirmPassword.set('otherpass123');
    component.submit();
    expect(authSpy.resetPassword).not.toHaveBeenCalled();
  });

  it('should not call auth.resetPassword twice when submit is called twice (submitting guard)', () => {
    const pending = new Observable<{ success: boolean }>((sub) => {
      // never complete
    });
    authSpy.resetPassword.mockReturnValue(pending);
    fixture.detectChanges();
    component.password.set('newpass123');
    component.confirmPassword.set('newpass123');
    component.submit();
    component.submit();
    expect(authSpy.resetPassword).toHaveBeenCalledTimes(1);
  });
});
