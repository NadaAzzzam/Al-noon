import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ContactService } from '../../core/services/contact.service';
import { LocaleService } from '../../core/services/locale.service';
import { emailError, minLengthError, requiredError } from '../../shared/utils/form-validators';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  private readonly contactService = inject(ContactService);
  readonly locale = inject(LocaleService);

  name = signal('');
  email = signal('');
  phone = signal('');
  comment = signal('');
  message = signal<'idle' | 'success' | 'error'>('idle');

  nameError = computed(() => minLengthError(this.name(), 2, 'Name'));
  emailError = computed(() => emailError(this.email()));
  commentError = computed(() => requiredError(this.comment(), 'Message'));
  valid = computed(
    () => !this.nameError() && !this.emailError() && !this.commentError()
  );

  submit(): void {
    this.message.set('idle');
    if (!this.valid()) return;
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
        },
        error: () => this.message.set('error'),
      });
  }
}
