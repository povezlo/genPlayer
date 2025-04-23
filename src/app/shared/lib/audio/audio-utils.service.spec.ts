import { TestBed } from '@angular/core/testing';

import { AudioUtilsService } from './audio-utils.service';

describe('AudioUtilsService', () => {
  let service: AudioUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
