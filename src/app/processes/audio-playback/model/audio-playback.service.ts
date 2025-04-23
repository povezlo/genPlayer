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
  error: any,
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
    error: null,
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
      this.updateState({
        error: 'Track has no audio file',
        isPlaying: false
      });
      console.error('Track has no audio file');
      return;
    }

    const currentState = this.audioStateSubject.value;

    // Если это тот же трек, что и сейчас, переключаем воспроизведение/паузу
    if (currentState.track?.id === track.id) {
      this.togglePlayPause();
      return;
    }

    // Если уже есть аудиоэлемент, останавливаем его
    if (this.audioElement) {
      this.audioElement.pause();

      // Важно: нужно очистить все слушатели событий перед установкой нового источника
      this.audioElement.onloadedmetadata = null;
      this.audioElement.ontimeupdate = null;
      this.audioElement.onended = null;
      this.audioElement.onerror = null;
    }

    // Обновляем состояние с новым треком
    this.updateState({
      track,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null
    });

    // Формируем полный URL к аудиофайлу
    const audioFileUrl = this.getFullAudioUrl(track.audioFile);

    console.log('Loading audio from URL:', audioFileUrl);

    // Создаем новый аудиоэлемент для каждого трека
    this.audioElement = new Audio(audioFileUrl);

    // Повторно привязываем обработчики событий
    this.audioElement.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
    this.audioElement.addEventListener('ended', this.onEnded.bind(this));
    this.audioElement.addEventListener('loadedmetadata', this.onLoaded.bind(this));
    this.audioElement.addEventListener('error', this.onError.bind(this));

    // Устанавливаем громкость из текущего состояния
    this.audioElement.volume = this.audioStateSubject.value.volume;

    // Дополнительные проверки для диагностики
    this.audioElement.addEventListener('canplay', () => {
      console.log('Audio can play event fired');
    });

    this.audioElement.addEventListener('loadeddata', () => {
      console.log('Audio loaded data event fired');
    });

    // Проверяем загрузку файла
    this.audioElement.addEventListener('canplaythrough', () => {
      console.log('Audio can play through event fired, starting playback');
      this.play();
    });

    // Начинаем загрузку файла
    this.audioElement.load();
  }

  public togglePlayPause(): void {
    if (!this.audioElement || !this.audioStateSubject.value.track) {
      return;
    }

    // Проверяем, загружен ли аудиофайл
    if (this.audioElement.readyState === 0) {
      console.error('Audio element is not loaded properly');
      this.updateState({
        error: 'Audio source is not loaded properly. Please try again.',
        isPlaying: false
      });
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

    // Проверяем, есть ли источник у аудиоэлемента
    if (!this.audioElement.src) {
      console.error('No audio source set');
      this.updateState({
        error: 'No audio source available',
        isPlaying: false
      });
      return;
    }

    // Сбрасываем состояние ошибки перед началом воспроизведения
    this.updateState({ error: null });

    console.log('Attempting to play audio source:', this.audioElement.src);
    console.log('Audio element ready state:', this.audioElement.readyState);

    const playPromise = this.audioElement.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Audio playback started successfully');
        this.updateState({ isPlaying: true });
      }).catch(error => {
        console.error('Error playing audio:', error);
        this.updateState({
          isPlaying: false,
          error: `Failed to play audio: ${error.message || 'Unknown error'}`
        });
      });
    }
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

  private getFullAudioUrl(audioFilePath: string): string {
    if (audioFilePath.startsWith('http://') || audioFilePath.startsWith('https://')) {
      return audioFilePath;
    }
    return this.apiConfig.getUrl(`files/${audioFilePath}`);
  }
}
