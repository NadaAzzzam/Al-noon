import { Component, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LocaleService } from '../../../core/services/locale.service';
import { emailError, passwordError } from '../../../shared/utils/form-validators';

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

  email = signal('');
  password = signal('');
  error = signal<string | null>(null);

  emailError = computed(() => emailError(this.email()));
  passwordError = computed(() => passwordError(this.password()));
  valid = computed(() => !this.emailError() && !this.passwordError());

  returnUrl = computed(() => this.route.snapshot.queryParams['returnUrl'] ?? '/account/orders');

  submit(): void {
    this.error.set(null);
    if (!this.valid()) return;
    this.auth.signIn({ email: this.email().trim(), password: this.password() }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl()),
      error: (err) => this.error.set(err?.message ?? 'Login failed'),
    });
  }
}
