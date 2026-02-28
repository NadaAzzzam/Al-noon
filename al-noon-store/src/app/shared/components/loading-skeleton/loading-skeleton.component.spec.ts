import { describe, it, expect } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSkeletonComponent } from './loading-skeleton.component';

describe('LoadingSkeletonComponent', () => {
  let component: LoadingSkeletonComponent;
  let fixture: ComponentFixture<LoadingSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSkeletonComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(LoadingSkeletonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render default 4 card skeletons', () => {
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.skeleton-card');
    expect(cards.length).toBe(4);
  });

  it('should render text skeletons when type is text', () => {
    fixture.componentRef.setInput('type', 'text');
    fixture.componentRef.setInput('count', 3);
    fixture.detectChanges();
    const texts = fixture.nativeElement.querySelectorAll('.skeleton-text');
    expect(texts.length).toBeGreaterThanOrEqual(3);
  });
});
