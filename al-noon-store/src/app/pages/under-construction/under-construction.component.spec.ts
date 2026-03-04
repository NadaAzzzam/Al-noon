import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { UnderConstructionComponent } from './under-construction.component';
import { StoreService } from '../../core/services/store.service';
import { LocaleService } from '../../core/services/locale.service';
import { ApiService } from '../../core/services/api.service';
import { FaviconService } from '../../core/services/favicon.service';
import type { Settings } from '../../core/types/api.types';

describe('UnderConstructionComponent', () => {
  let fixture: ComponentFixture<UnderConstructionComponent>;
  let component: UnderConstructionComponent;
  let faviconMock: { setFavicon: ReturnType<typeof vi.fn> };

  const settingsSignal = signal<Settings | null>({
    storeName: { en: 'Test Store', ar: 'متجر' },
    logo: '/uploads/logos/logo.png',
    underConstructionMode: true,
    underConstructionMessage: { en: 'Improving things!', ar: 'نعمل على التحسينات!' },
  });

  const apiService = {
    imageUrl: (path: string | undefined | null) => {
      if (!path) return '';
      if (path.startsWith('http')) return path;
      return `http://localhost:4000${path.startsWith('/') ? path : '/' + path}`;
    },
  };

  beforeEach(async () => {
    faviconMock = { setFavicon: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [UnderConstructionComponent, TranslateModule.forRoot()],
      providers: [
        { provide: StoreService, useValue: { settings: settingsSignal.asReadonly() } },
        { provide: LocaleService, useValue: { getLocale: () => 'en', lang: signal('en') } },
        { provide: ApiService, useValue: apiService },
        { provide: FaviconService, useValue: faviconMock },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UnderConstructionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render the under-construction page container', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.uc-page')).toBeTruthy();
  });

  it('should display the title', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.uc-title')).toBeTruthy();
  });

  it('should display the logo with resolved URL', () => {
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.uc-logo') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('http://localhost:4000/uploads/logos/logo.png');
  });

  it('should display the custom message', () => {
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector('.uc-message') as HTMLElement;
    expect(msg).toBeTruthy();
    expect(msg.textContent).toContain('Improving things!');
  });

  it('should render the progress bar', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.uc-progress-bar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.uc-progress-fill')).toBeTruthy();
  });

  it('should resolve logo via ApiService.imageUrl', () => {
    expect(component.logoUrl()).toBe('http://localhost:4000/uploads/logos/logo.png');
    expect(component.message()).toEqual({ en: 'Improving things!', ar: 'نعمل على التحسينات!' });
  });

  it('should set favicon from settings logo on init', () => {
    fixture.detectChanges();
    expect(faviconMock.setFavicon).toHaveBeenCalledWith('/uploads/logos/logo.png');
  });
});
