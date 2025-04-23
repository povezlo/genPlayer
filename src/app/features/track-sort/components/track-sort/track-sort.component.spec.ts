import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackSortComponent } from './track-sort.component';

describe('TrackSortComponent', () => {
  let component: TrackSortComponent;
  let fixture: ComponentFixture<TrackSortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackSortComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackSortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
