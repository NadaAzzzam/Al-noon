import { Component, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LocalizedPathService } from '../../../core/services/localized-path.service';
import { passwordErrorKey } from '../../../shared/utils/form-validators';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly pathService = inject(LocalizedPathService);
  private readonly translate = inject(TranslateService);

  token = signal<string | null>(null);
  password = signal('');
  confirmPassword = signal('');
  error = signal<string | null>(null);
  success = signal(false);
  submitting = signal(false);
  submitted = signal(false);

  constructor() {
    const t = this.route.snapshot.queryParams['token'];
    this.token.set(typeof t === 'string' && t.trim() ? t.trim() : null);
  }

  passwordError = computed(() => {
    if (!this.submitted()) return null;
    const key = passwordErrorKey(this.password(), 6);
    if (!key) return null;
    return key === 'errors.minChars' ? this.translate.instant(key, { min: 6 }) : this.translate.instant(key);
  });
  confirmError = computed(() => {
    if (!this.submitted()) return null;
    const pw = this.password();
    const cp = this.confirmPassword();
    if (!pw || !cp) return this.translate.instant('errors.required');
    if (pw !== cp) return this.translate.instant('auth.passwordMismatch');
    return null;
  });
  valid = computed(
    () => !passwordErrorKey(this.password(), 6) && this.password() === this.confirmPassword() && this.confirmPassword().length > 0
  );

  submit(): void {
    this.error.set(null);
    this.submitted.set(true);
    if (!this.valid() || this.submitting() || !this.token()) return;
    this.submitting.set(true);
    this.auth
      .resetPassword({
        token: this.token()!,
        password: this.password(),
        confirmPassword: this.confirmPassword(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.success.set(true);
          this.submitting.set(false);
          if (this.auth.isLoggedIn()) {
            this.router.navigate(this.pathService.path('account'));
          }
        },
        error: (err) => {
          this.error.set(err?.message ?? this.translate.instant('errors.resetPasswordFailed'));
          this.submitting.set(false);
        },
      });
  }
}
