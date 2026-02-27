import { describe, it, expect } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating.component';

describe('StarRatingComponent', () => {
  let component: StarRatingComponent;
  let fixture: ComponentFixture<StarRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRatingComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render 5 stars', () => {
    fixture.detectChanges();
    const stars = fixture.nativeElement.querySelectorAll('.star');
    expect(stars.length).toBe(5);
  });

  it('should show filled stars for rating 3', () => {
    fixture.componentRef.setInput('rating', 3);
    fixture.detectChanges();
    const filled = fixture.nativeElement.querySelectorAll('.star.filled');
    expect(filled.length).toBe(3);
  });

  it('should show rating count when showCount is true', () => {
    fixture.componentRef.setInput('rating', 4);
    fixture.componentRef.setInput('showCount', true);
    fixture.componentRef.setInput('count', 10);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('10');
  });
});
