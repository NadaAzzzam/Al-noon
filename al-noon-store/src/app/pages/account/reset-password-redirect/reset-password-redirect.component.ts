import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LocaleService } from '../../../core/services/locale.service';

/**
 * Redirects legacy/wrong reset-password links to the correct localized path.
 * Email links may use /reset-password?token=... or //reset-password?token=...;
 * we redirect to /:lang/account/reset-password?token=... and preserve query params.
 */
@Component({
  selector: 'app-reset-password-redirect',
  standalone: true,
  template: `<p>Redirecting…</p>`,
})
export class ResetPasswordRedirectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly locale = inject(LocaleService);

  ngOnInit(): void {
    const lang = this.locale.getLocale();
    const queryParams = { ...this.route.snapshot.queryParams };
    this.router.navigate([lang, 'account', 'reset-password'], {
      queryParams,
      queryParamsHandling: '',
      replaceUrl: true,
    });
  }
}
