import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { ContactComponent } from './contact.component';
import { ContactService } from '../../core/services/contact.service';
import { LocaleService } from '../../core/services/locale.service';
import { SeoService } from '../../core/services/seo.service';

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;
  let contactMock: { send: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    contactMock = { send: vi.fn().mockReturnValue(of({ success: true })) };
    await TestBed.configureTestingModule({
      imports: [ContactComponent, TranslateModule.forRoot()],
      providers: [
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
        { provide: SeoService, useValue: { setPage: () => {} } },
        { provide: ContactService, useValue: contactMock },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ContactComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have contact form', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
  });

  it('should submit successfully and clear form', async () => {
    fixture.detectChanges();
    fixture.componentInstance.name.set('John');
    fixture.componentInstance.email.set('john@test.com');
    fixture.componentInstance.comment.set('Hello');

    fixture.componentInstance.submit();
    expect(contactMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'John', email: 'john@test.com', comment: 'Hello' })
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(fixture.componentInstance.message()).toBe('success');
    expect(fixture.componentInstance.name()).toBe('');
  });

  it('should set message error on submit failure', async () => {
    contactMock.send.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    fixture.componentInstance.name.set('John');
    fixture.componentInstance.email.set('john@test.com');
    fixture.componentInstance.comment.set('Hi');

    fixture.componentInstance.submit();
    await new Promise((r) => setTimeout(r, 20));
    expect(fixture.componentInstance.message()).toBe('error');
  });

  it('should not submit when invalid', () => {
    fixture.detectChanges();
    fixture.componentInstance.name.set('J');
    fixture.componentInstance.email.set('bad');
    fixture.componentInstance.comment.set('Hi');
    fixture.componentInstance.submit();

    expect(contactMock.send).not.toHaveBeenCalled();
  });
});
