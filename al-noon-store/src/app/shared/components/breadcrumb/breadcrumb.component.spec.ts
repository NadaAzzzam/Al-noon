import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BreadcrumbComponent } from './breadcrumb.component';

describe('BreadcrumbComponent', () => {
  let fixture: ComponentFixture<BreadcrumbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BreadcrumbComponent);
  });

  it('should create', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render breadcrumb items with links when url is provided', () => {
    fixture.componentRef.setInput('items', [
      { label: 'Home', url: '/' },
      { label: 'Catalog', url: '/catalog' },
      { label: 'Product' },
    ]);
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links.length).toBe(2);
    expect(links[0].textContent?.trim()).toBe('Home');
    expect(links[1].textContent?.trim()).toBe('Catalog');
    const spans = fixture.nativeElement.querySelectorAll('span[aria-current]');
    expect(spans.length).toBe(1);
    expect(spans[0].textContent?.trim()).toBe('Product');
  });

  it('should set aria-current on last item', () => {
    fixture.componentRef.setInput('items', [{ label: 'Only' }]);
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span[aria-current="page"]');
    expect(span).toBeTruthy();
    expect(span?.textContent?.trim()).toBe('Only');
  });
});
