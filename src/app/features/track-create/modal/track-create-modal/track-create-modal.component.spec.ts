import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackCreateModalComponent } from './track-create-modal.component';

describe('TrackCreateModalComponent', () => {
  let component: TrackCreateModalComponent;
  let fixture: ComponentFixture<TrackCreateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackCreateModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackCreateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
