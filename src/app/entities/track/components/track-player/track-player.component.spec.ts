import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackPlayerComponent } from './track-player.component';

describe('TrackPlayerComponent', () => {
  let component: TrackPlayerComponent;
  let fixture: ComponentFixture<TrackPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackPlayerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
