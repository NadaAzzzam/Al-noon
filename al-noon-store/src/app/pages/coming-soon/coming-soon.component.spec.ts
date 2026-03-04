import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { ComingSoonComponent } from './coming-soon.component';
import { StoreService } from '../../core/services/store.service';
import { LocaleService } from '../../core/services/locale.service';
import { ApiService } from '../../core/services/api.service';
import { FaviconService } from '../../core/services/favicon.service';
import type { Settings } from '../../core/types/api.types';

describe('ComingSoonComponent', () => {
  let fixture: ComponentFixture<ComingSoonComponent>;
  let component: ComingSoonComponent;
  let faviconMock: { setFavicon: ReturnType<typeof vi.fn> };

  const settingsSignal = signal<Settings | null>({
    storeName: { en: 'Test Store', ar: 'متجر' },
    logo: '/uploads/logos/logo.png',
    comingSoonMode: true,
    comingSoonMessage: { en: 'Launching soon!', ar: 'قريبًا!' },
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
      imports: [ComingSoonComponent, TranslateModule.forRoot()],
      providers: [
        { provide: StoreService, useValue: { settings: settingsSignal.asReadonly() } },
        { provide: LocaleService, useValue: { getLocale: () => 'en', lang: signal('en') } },
        { provide: ApiService, useValue: apiService },
        { provide: FaviconService, useValue: faviconMock },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ComingSoonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render the coming-soon page container', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.coming-soon-page')).toBeTruthy();
  });

  it('should display the title', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.cs-title')).toBeTruthy();
  });

  it('should display the logo with resolved URL', () => {
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.cs-logo') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('http://localhost:4000/uploads/logos/logo.png');
  });

  it('should display the custom message', () => {
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector('.cs-message') as HTMLElement;
    expect(msg).toBeTruthy();
    expect(msg.textContent).toContain('Launching soon!');
  });

  it('should resolve logo via ApiService.imageUrl', () => {
    expect(component.logoUrl()).toBe('http://localhost:4000/uploads/logos/logo.png');
    expect(component.message()).toEqual({ en: 'Launching soon!', ar: 'قريبًا!' });
  });

  it('should set favicon from settings logo on init', () => {
    fixture.detectChanges();
    expect(faviconMock.setFavicon).toHaveBeenCalledWith('/uploads/logos/logo.png');
  });
});
