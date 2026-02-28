import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { PageComponent } from './page.component';
import { StoreService } from '../../core/services/store.service';
import { LocaleService } from '../../core/services/locale.service';
import { SeoService } from '../../core/services/seo.service';

describe('PageComponent', () => {
  let fixture: ComponentFixture<PageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(new Map([['slug', 'privacy']])) } },
        { provide: StoreService, useValue: { getPage: () => of({ slug: 'privacy', title: { en: 'Privacy' }, content: { en: 'Content' } }) } },
        { provide: LocaleService, useValue: { getLocale: () => 'en', lang: signal('en') } },
        { provide: SeoService, useValue: { setPage: () => {} } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PageComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
