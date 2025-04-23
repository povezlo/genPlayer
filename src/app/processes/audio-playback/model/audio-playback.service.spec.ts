import { TestBed } from '@angular/core/testing';

import { AudioPlaybackService } from './audio-playback.service';

describe('AudioPlaybackService', () => {
  let service: AudioPlaybackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioPlaybackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
