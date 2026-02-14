import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ContactService } from '../../core/services/contact.service';
import { LocaleService } from '../../core/services/locale.service';
import { SeoService } from '../../core/services/seo.service';
import {
  emailErrorKey,
  minLengthErrorKey,
  requiredErrorKey,
  phoneErrorKey,
} from '../../shared/utils/form-validators';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  private readonly contactService = inject(ContactService);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  readonly locale = inject(LocaleService);

  constructor() {
    this.seo.setPage({
      title: this.translate.instant('contact.pageTitle'),
      description: this.translate.instant('contact.pageDescription'),
    });
  }

  name = signal('');
  email = signal('');
  phone = signal('');
  comment = signal('');
  message = signal<'idle' | 'success' | 'error'>('idle');
  submitting = signal(false);
  /** Set on first submit attempt so validation messages show only after user clicks submit */
  submitted = signal(false);

  nameError = computed(() => {
    if (!this.submitted()) return null;
    const key = minLengthErrorKey(this.name(), 2);
    return key ? this.translate.instant(key, { min: 2 }) : null;
  });
  emailError = computed(() => {
    if (!this.submitted()) return null;
    const key = emailErrorKey(this.email());
    return key ? this.translate.instant(key) : null;
  });
  phoneErrorMsg = computed(() => {
    if (!this.submitted()) return null;
    const key = phoneErrorKey(this.phone());
    return key ? this.translate.instant(key) : null;
  });
  commentError = computed(() => {
    if (!this.submitted()) return null;
    const r = requiredErrorKey(this.comment(), 'contact.message');
    return r ? this.translate.instant(r.key, { field: this.translate.instant(r.fieldKey) }) : null;
  });
  valid = computed(
    () =>
      !minLengthErrorKey(this.name(), 2) &&
      !emailErrorKey(this.email()) &&
      !phoneErrorKey(this.phone()) &&
      !requiredErrorKey(this.comment(), 'contact.message')
  );
  submitDisabled = computed(() => this.submitting());

  submit(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.message.set('idle');
    this.submitted.set(true);
    if (!this.valid() || this.submitting()) return;
    this.submitting.set(true);
    this.contactService
      .send({
        name: this.name().trim(),
        email: this.email().trim(),
        phone: this.phone().trim() || undefined,
        comment: this.comment().trim(),
      })
      .subscribe({
        next: () => {
          this.message.set('success');
          this.name.set('');
          this.email.set('');
          this.phone.set('');
          this.comment.set('');
          this.submitting.set(false);
        },
        error: () => {
          this.message.set('error');
          this.submitting.set(false);
        },
      });
  }
}
