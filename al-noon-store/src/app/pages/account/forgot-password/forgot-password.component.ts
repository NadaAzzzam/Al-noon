import { Component, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LocalizedPathService } from '../../../core/services/localized-path.service';
import { emailErrorKey } from '../../../shared/utils/form-validators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly pathService = inject(LocalizedPathService);
  private readonly translate = inject(TranslateService);

  email = signal('');
  error = signal<string | null>(null);
  success = signal(false);
  submitting = signal(false);
  submitted = signal(false);

  emailError = computed(() => {
    if (!this.submitted()) return null;
    const key = emailErrorKey(this.email());
    return key ? this.translate.instant(key) : null;
  });
  valid = computed(() => !emailErrorKey(this.email()));

  submit(): void {
    this.error.set(null);
    this.submitted.set(true);
    if (!this.valid() || this.submitting()) return;
    this.submitting.set(true);
    this.auth
      .forgotPassword(this.email().trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.success.set(true);
          this.submitting.set(false);
        },
        error: (err) => {
          this.error.set(err?.message ?? this.translate.instant('errors.forgotPasswordFailed'));
          this.submitting.set(false);
        },
      });
  }
}
