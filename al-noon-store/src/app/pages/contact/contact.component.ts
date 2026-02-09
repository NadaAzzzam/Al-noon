import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ContactService } from '../../core/services/contact.service';
import { LocaleService } from '../../core/services/locale.service';
import { SeoService } from '../../core/services/seo.service';
import { emailError, minLengthError, requiredError } from '../../shared/utils/form-validators';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  private readonly contactService = inject(ContactService);
  private readonly seo = inject(SeoService);
  readonly locale = inject(LocaleService);

  constructor() {
    this.seo.setPage({ title: 'Contact Us', description: 'Get in touch with Al-Noon. We would love to hear from you.' });
  }

  name = signal('');
  email = signal('');
  phone = signal('');
  comment = signal('');
  message = signal<'idle' | 'success' | 'error'>('idle');
  submitting = signal(false);

  nameError = computed(() => minLengthError(this.name(), 2, 'Name'));
  emailError = computed(() => emailError(this.email()));
  commentError = computed(() => requiredError(this.comment(), 'Message'));
  valid = computed(
    () => !this.nameError() && !this.emailError() && !this.commentError()
  );
  submitDisabled = computed(() => !this.valid() || this.submitting());

  submit(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.message.set('idle');
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
