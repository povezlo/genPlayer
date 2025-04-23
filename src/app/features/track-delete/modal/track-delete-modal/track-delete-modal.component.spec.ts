import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackDeleteModalComponent } from './track-delete-modal.component';

describe('TrackDeleteModalComponent', () => {
  let component: TrackDeleteModalComponent;
  let fixture: ComponentFixture<TrackDeleteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackDeleteModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackDeleteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
