import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { LocalizedPathService } from '../../../core/services/localized-path.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly pathService = inject(LocalizedPathService);

  readonly user = this.auth.user;
  loading = signal(true);

  ngOnInit(): void {
    this.auth
      .getStoreProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false),
      });
  }

  signOut(): void {
    this.auth.signOut().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.router.navigate(this.pathService.path('account', 'login'));
    });
  }
}
