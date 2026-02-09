import { Component, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LocaleService } from '../../../core/services/locale.service';
import { emailError, minLengthError, passwordError } from '../../../shared/utils/form-validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly locale = inject(LocaleService);

  name = signal('');
  email = signal('');
  password = signal('');
  error = signal<string | null>(null);

  nameError = computed(() => minLengthError(this.name(), 2, 'Name'));
  emailError = computed(() => emailError(this.email()));
  passwordError = computed(() => passwordError(this.password()));
  valid = computed(
    () => !this.nameError() && !this.emailError() && !this.passwordError()
  );

  submit(): void {
    this.error.set(null);
    if (!this.valid()) return;
    this.auth
      .signUp({
        name: this.name().trim(),
        email: this.email().trim(),
        password: this.password(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/account', 'orders']),
        error: (err) => this.error.set(err?.message ?? 'Registration failed'),
      });
  }
}
