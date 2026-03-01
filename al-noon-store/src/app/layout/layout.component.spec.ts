import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { LayoutComponent } from './layout.component';
import { StoreService } from '../core/services/store.service';
import { LocaleService } from '../core/services/locale.service';
import { SeoService } from '../core/services/seo.service';

describe('LayoutComponent', () => {
  let fixture: ComponentFixture<LayoutComponent>;
  let storeMock: { settings: ReturnType<typeof vi.fn>; getStore: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    storeMock = {
      settings: vi.fn().mockReturnValue({ announcementBar: undefined }),
      getStore: vi.fn().mockReturnValue(of(null)),
    };

    await TestBed.configureTestingModule({
      imports: [LayoutComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: StoreService, useValue: storeMock },
        { provide: LocaleService, useValue: { getLocale: () => 'en', lang: () => 'en' } },
        { provide: SeoService, useValue: { setSeoSettings: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render header, main, footer and back-to-top', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('main')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-footer')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-back-to-top')).toBeTruthy();
  });

  it('should show announcement bar when enabled in settings', () => {
    storeMock.settings.mockReturnValue({
      announcementBar: { enabled: true, text: { en: 'Sale!', ar: 'تخفيض' }, backgroundColor: '#1a1a2e' },
    });
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('.announcement-bar');
    expect(bar).toBeTruthy();
    expect(bar?.textContent).toContain('Sale!');
  });

  it('should not show announcement bar when disabled', () => {
    storeMock.settings.mockReturnValue({
      announcementBar: { enabled: false, text: { en: 'Hidden' } },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.announcement-bar')).toBeNull();
  });
});
