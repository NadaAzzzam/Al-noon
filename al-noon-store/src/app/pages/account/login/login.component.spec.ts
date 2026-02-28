import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { LocaleService } from '../../../core/services/locale.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authSpy: { signIn: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authSpy = { signIn: vi.fn().mockReturnValue(of({ user: {}, accessToken: 'tok' })) };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have login form', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
  });

  it('should call auth.signIn on valid submit', () => {
    fixture.detectChanges();
    component.email.set('test@example.com');
    component.password.set('password123');
    component.submit();
    expect(authSpy.signIn).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
  });

  it('should set error when login fails (wrong password)', () => {
    authSpy.signIn.mockReturnValue(throwError(() => ({ message: 'Invalid credentials' })));
    fixture.detectChanges();
    component.email.set('test@example.com');
    component.password.set('wrongpassword');
    component.submit();
    expect(component.error()).toContain('Invalid');
  });
});
