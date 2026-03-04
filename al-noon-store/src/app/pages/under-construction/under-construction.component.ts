import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { StoreService } from '../../core/services/store.service';
import { LocaleService } from '../../core/services/locale.service';
import { ApiService } from '../../core/services/api.service';
import { LocalizedPipe } from '../../shared/pipe/localized.pipe';

@Component({
  selector: 'app-under-construction',
  standalone: true,
  imports: [TranslateModule, LocalizedPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './under-construction.component.html',
  styleUrl: './under-construction.component.scss',
})
export class UnderConstructionComponent {
  private readonly store = inject(StoreService);
  private readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);

  readonly settings = this.store.settings;
  readonly logoUrl = computed(() => this.api.imageUrl(this.settings()?.logo));
  readonly storeName = computed(() => this.settings()?.storeName);
  readonly message = computed(() => this.settings()?.underConstructionMessage);
}
