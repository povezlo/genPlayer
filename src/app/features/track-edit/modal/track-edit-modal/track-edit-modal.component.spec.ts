import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackEditModalComponent } from './track-edit-modal.component';

describe('TrackEditModalComponent', () => {
  let component: TrackEditModalComponent;
  let fixture: ComponentFixture<TrackEditModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackEditModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackEditModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
