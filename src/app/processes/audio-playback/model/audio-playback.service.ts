import {inject, Injectable} from '@angular/core';
import {Track} from '../../../entities';
import {BehaviorSubject} from 'rxjs';
import {ApiConfigService} from '../../../shared';

export interface AudioState {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

@Injectable({
  providedIn: 'root'
})
export class AudioPlaybackService {
  private audioElement: HTMLAudioElement | null = null;
  private audioStateSubject = new BehaviorSubject<AudioState>({
    track: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
  });
  private apiConfig = inject(ApiConfigService);

  public audioState$ = this.audioStateSubject.asObservable();

  constructor() {
    this.initAudio();
  }

  private initAudio(): void {
    this.audioElement = new Audio();

    this.audioElement.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
    this.audioElement.addEventListener('ended', this.onEnded.bind(this));
    this.audioElement.addEventListener('loadedmetadata', this.onLoaded.bind(this));
    this.audioElement.addEventListener('error', this.onError.bind(this));

    const savedVolume = localStorage.getItem('audioVolume');
    if (savedVolume) {
      const volume = parseFloat(savedVolume);
      this.audioElement.volume = volume;
      this.updateState({ volume });
    }
  }

  public playTrack(track: Track): void {
    if (!track.audioFile) {
      console.error('Track has no audio file');
      return;
    }

    const currentState = this.audioStateSubject.value;

    if (currentState.track?.id === track.id) {
      this.togglePlayPause();
      return;
    }

    if (this.audioElement) {
      this.audioElement.pause();
    }

    this.updateState({
      track,
      isPlaying: false,
      currentTime: 0,
      duration: 0
    });

    if (this.audioElement) {
      this.audioElement.src = track.audioFile;
      this.audioElement.load();
      this.play();
    }
  }

  public togglePlayPause(): void {
    if (!this.audioElement || !this.audioStateSubject.value.track) {
      return;
    }

    if (this.audioStateSubject.value.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public play(): void {
    if (!this.audioElement) return;

    this.audioElement.play().then(() => {
      this.updateState({ isPlaying: true });
    }).catch(error => {
      console.error('Error playing audio:', error);
      this.updateState({ isPlaying: false });
    });
  }

  public pause(): void {
    if (!this.audioElement) return;

    this.audioElement.pause();
    this.updateState({ isPlaying: false });
  }

  public stop(): void {
    if (!this.audioElement) return;

    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.updateState({
      isPlaying: false,
      currentTime: 0
    });
  }

  public seek(time: number): void {
    if (!this.audioElement) return;

    this.audioElement.currentTime = time;
    this.updateState({ currentTime: time });
  }

  public setVolume(volume: number): void {
    if (!this.audioElement) return;

    volume = Math.max(0, Math.min(1, volume));

    this.audioElement.volume = volume;
    this.updateState({ volume });

    localStorage.setItem('audioVolume', volume.toString());
  }

  public getCurrentTrack(): Track | null {
    return this.audioStateSubject.value.track;
  }

  public isCurrentTrack(trackId: string): boolean {
    return this.audioStateSubject.value.track?.id === trackId;
  }

  private onTimeUpdate(): void {
    if (!this.audioElement) return;

    this.updateState({
      currentTime: this.audioElement.currentTime
    });
  }

  private onEnded(): void {
    this.updateState({
      isPlaying: false,
      currentTime: 0
    });
  }

  private onLoaded(): void {
    if (!this.audioElement) return;

    this.updateState({
      duration: this.audioElement.duration
    });
  }

  private onError(event: ErrorEvent): void {
    console.error('Audio error:', event);
    this.updateState({
      isPlaying: false
    });
  }

  private updateState(partialState: Partial<AudioState>): void {
    this.audioStateSubject.next({
      ...this.audioStateSubject.value,
      ...partialState
    });
  }
}
