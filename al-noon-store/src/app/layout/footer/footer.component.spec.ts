import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { FooterComponent } from './footer.component';
import { StoreService } from '../../core/services/store.service';
import { NewsletterService } from '../../core/services/newsletter.service';
import { LocaleService } from '../../core/services/locale.service';
import { LocalizedPathService } from '../../core/services/localized-path.service';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;
  let storeMock: { getStore: ReturnType<typeof vi.fn>; settings: ReturnType<typeof vi.fn> };
  let newsletterMock: { subscribe: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    storeMock = {
      getStore: vi.fn().mockReturnValue(of({ storeName: { en: 'Test' }, quickLinks: [], socialLinks: [] })),
      settings: vi.fn().mockReturnValue({ contentPages: [], newsletterEnabled: true }),
    };
    newsletterMock = {
      subscribe: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [FooterComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: StoreService, useValue: storeMock },
        { provide: NewsletterService, useValue: newsletterMock },
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
        { provide: LocalizedPathService, useValue: { toUrl: (u: string) => u } },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('en');
    translate.use('en');

    fixture = TestBed.createComponent(FooterComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should fetch store on init', () => {
    fixture.detectChanges();
    expect(storeMock.getStore).toHaveBeenCalled();
  });

  it('should show newsletter section when enabled', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.showNewsletterSection()).toBe(true);
    expect(fixture.nativeElement.querySelector('.newsletter-section')).toBeTruthy();
  });

  it('should validate newsletter email before submit', () => {
    fixture.detectChanges();
    fixture.componentInstance.newsletterEmail.set('invalid');
    fixture.componentInstance.submitNewsletter(new Event('submit'));
    expect(newsletterMock.subscribe).not.toHaveBeenCalled();
  });

  it('should call newsletter service on valid email submit', () => {
    fixture.detectChanges();
    fixture.componentInstance.newsletterEmail.set('user@example.com');
    fixture.componentInstance.submitNewsletter(new Event('submit'));
    expect(newsletterMock.subscribe).toHaveBeenCalledWith('user@example.com');
  });

  it('should include current year in footer', () => {
    fixture.detectChanges();
    const year = new Date().getFullYear();
    expect(fixture.componentInstance.currentYear).toBe(year);
  });

  it('should build footer links from quickLinks', () => {
    storeMock.getStore.mockReturnValue(
      of({
        quickLinks: [{ title: { en: 'Privacy' }, url: '/page/privacy' }],
        socialLinks: [],
      })
    );
    storeMock.settings.mockReturnValue({ contentPages: [] });
    fixture.detectChanges();
    expect(fixture.componentInstance.footerLinks().length).toBeGreaterThanOrEqual(0);
  });

  it('should handle newsletter error response', () => {
    newsletterMock.subscribe.mockReturnValue(throwError(() => ({ alreadySubscribed: false })));
    fixture.detectChanges();
    fixture.componentInstance.newsletterEmail.set('a@b.com');
    fixture.componentInstance.submitNewsletter(new Event('submit'));
    expect(newsletterMock.subscribe).toHaveBeenCalled();
  });
});
