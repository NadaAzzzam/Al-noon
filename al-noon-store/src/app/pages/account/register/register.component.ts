import { Component, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LocaleService } from '../../../core/services/locale.service';
import { LocalizedPathService } from '../../../core/services/localized-path.service';
import { emailErrorKey, minLengthErrorKey, passwordErrorKey } from '../../../shared/utils/form-validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly locale = inject(LocaleService);
  readonly pathService = inject(LocalizedPathService);
  private readonly translate = inject(TranslateService);

  name = signal('');
  email = signal('');
  password = signal('');
  error = signal<string | null>(null);
  /** Set on first submit so validation messages show only after user clicks submit */
  submitted = signal(false);

  nameError = computed(() => {
    if (!this.submitted()) return null;
    const key = minLengthErrorKey(this.name(), 2);
    return key ? (key === 'errors.minChars' ? this.translate.instant(key, { min: 2 }) : this.translate.instant(key)) : null;
  });
  emailError = computed(() => {
    if (!this.submitted()) return null;
    const key = emailErrorKey(this.email());
    return key ? this.translate.instant(key) : null;
  });
  passwordError = computed(() => {
    if (!this.submitted()) return null;
    const key = passwordErrorKey(this.password());
    if (!key) return null;
    return key === 'errors.minChars' ? this.translate.instant(key, { min: 6 }) : this.translate.instant(key);
  });
  valid = computed(
    () => !minLengthErrorKey(this.name(), 2) && !emailErrorKey(this.email()) && !passwordErrorKey(this.password())
  );

  submit(): void {
    this.error.set(null);
    this.submitted.set(true);
    if (!this.valid()) return;
    this.auth
      .signUp({
        name: this.name().trim(),
        email: this.email().trim(),
        password: this.password(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(this.pathService.path('account', 'orders')),
        error: (err) => this.error.set(err?.message ?? this.translate.instant('errors.registrationFailed')),
      });
  }
}
