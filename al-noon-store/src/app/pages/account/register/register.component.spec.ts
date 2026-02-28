import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { LocaleService } from '../../../core/services/locale.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authSpy: { signUp: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authSpy = { signUp: vi.fn().mockReturnValue(of({ user: {}, accessToken: 'tok' })) };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have register form', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
  });

  it('should call auth.signUp on valid submit', () => {
    fixture.detectChanges();
    component.name.set('John Doe');
    component.email.set('new@example.com');
    component.password.set('password123');
    component.submit();
    expect(authSpy.signUp).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'new@example.com',
      password: 'password123',
    });
  });

  it('should set error when signUp fails (existing email)', () => {
    authSpy.signUp.mockReturnValue(throwError(() => ({ message: 'Email already registered' })));
    fixture.detectChanges();
    component.name.set('John');
    component.email.set('existing@example.com');
    component.password.set('password123');
    component.submit();
    expect(component.error()).toContain('already');
  });
});
