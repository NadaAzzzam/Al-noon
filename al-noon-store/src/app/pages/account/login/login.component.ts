import { Component, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LocaleService } from '../../../core/services/locale.service';
import { emailErrorKey, passwordErrorKey } from '../../../shared/utils/form-validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly locale = inject(LocaleService);
  private readonly translate = inject(TranslateService);

  email = signal('');
  password = signal('');
  error = signal<string | null>(null);

  emailError = computed(() => {
    const key = emailErrorKey(this.email());
    return key ? this.translate.instant(key) : null;
  });
  passwordError = computed(() => {
    const key = passwordErrorKey(this.password());
    if (!key) return null;
    return key === 'errors.minChars' ? this.translate.instant(key, { min: 6 }) : this.translate.instant(key);
  });
  valid = computed(() => !emailErrorKey(this.email()) && !passwordErrorKey(this.password()));

  returnUrl = computed(() => this.route.snapshot.queryParams['returnUrl'] ?? '/account/orders');

  submit(): void {
    this.error.set(null);
    if (!this.valid()) return;
    this.auth.signIn({ email: this.email().trim(), password: this.password() }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl()),
      error: (err) => this.error.set(err?.message ?? this.translate.instant('errors.loginFailed')),
    });
  }
}
