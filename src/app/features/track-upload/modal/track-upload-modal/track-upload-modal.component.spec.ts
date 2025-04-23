import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackUploadModalComponent } from './track-upload-modal.component';

describe('TrackUploadModalComponent', () => {
  let component: TrackUploadModalComponent;
  let fixture: ComponentFixture<TrackUploadModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackUploadModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackUploadModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
