import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, DestroyRef, ElementRef,
  EventEmitter, HostListener, inject,
  Input,
  OnDestroy,
  OnInit,
  Output, ViewChild
} from '@angular/core';
import {Track} from '../../model';
import {AudioPlaybackService, AudioState} from '../../../../processes';
import WaveSurfer from 'wavesurfer.js';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ApiConfigService, TestIdDirective} from '../../../../shared';
import {NgIf} from '@angular/common';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-track-player',
  standalone: true,
  imports: [
    TestIdDirective,
    NgIf,
    MatIconButton,
    MatIcon,
    MatProgressSpinner
  ],
  templateUrl: './track-player.component.html',
  styleUrl: './track-player.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() public track!: Track;
  @Output() public close = new EventEmitter<void>();

  @ViewChild('waveformRef') waveformRef!: ElementRef;

  public audioState!: AudioState;
  public wavesurfer: WaveSurfer | null = null;
  public waveformReady = false;
  public dragging = false;
  private lastVolume: number = 0;
  private initializationInProgress = false;
  private componentDestroyed = false;
  private pendingPlayback = false;

  private destroyRef = inject(DestroyRef);
  private apiConfig = inject(ApiConfigService);
  private audioService = inject(AudioPlaybackService);
  private cdr = inject(ChangeDetectorRef);

  @HostListener('window:beforeunload')
  public beforeUnload(): void {
    if (this.audioState.isPlaying) {
      this.audioService.stop();
    }
  }

  public ngOnInit(): void {
    this.audioState = {
      track: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      error: null
    };

    this.audioService.audioState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        if (!this.audioState.track || state.track?.id === this.track.id) {
          const wasPlaying = this.audioState.isPlaying;
          this.audioState = state;

          // If playback started but waveform isn't ready yet, pause the audio and set the flag
          if (state.isPlaying && !this.waveformReady && state.track?.id === this.track.id) {
            console.log('Audio started playing but waveform is not ready yet, pausing temporarily');
            this.audioService.pause();
            this.pendingPlayback = true;
          }

          if (this.wavesurfer && this.waveformReady && !this.dragging) {
            if (state.track?.id === this.track.id && state.duration > 0) {
              try {
                const position = state.currentTime / Math.max(state.duration, 0.1);
                if (position >= 0 && position <= 1) {
                  this.wavesurfer.seekTo(position);
                }
              } catch (error) {
                console.error('Error seeking wavesurfer:', error);
              }
            }
          }

          this.cdr.markForCheck();
        }
      });
  }

  public ngAfterViewInit(): void {
    setTimeout(async () => {
      await this.initWaveSurfer();
    });
  }

  public ngOnDestroy(): void {
    this.componentDestroyed = true;
    this.destroyWaveSurfer();

    if (this.audioState?.isPlaying && this.audioState?.track?.id === this.track.id) {
      this.audioService.stop();
    }
  }

  private destroyWaveSurfer(): void {
    if (this.wavesurfer) {
      try {
        this.wavesurfer.pause();
        this.wavesurfer.destroy();
      } catch (error) {
        console.error('Error destroying WaveSurfer instance:', error);
      }
      this.wavesurfer = null;
      this.waveformReady = false;
    }

    if (this.waveformRef?.nativeElement) {
      const container = this.waveformRef.nativeElement;
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
  }

  private async initWaveSurfer(): Promise<void> {
    if (this.componentDestroyed) {
      console.log('WaveSurfer already initialized, skipping');
      return;
    }

    if (this.initializationInProgress) {
      console.log('Initialization of WaveSurfer is already in progress, skip it');
      return;
    }

    this.initializationInProgress = true;

    if (!this.track.audioFile) {
      console.error('Track has no audio file, cannot initialize wavesurfer');
      return;
    }

    if (!this.waveformRef?.nativeElement) {
      this.initializationInProgress = false;
      console.error('Waveform element reference is not available');
      return;
    }

    this.destroyWaveSurfer();

    const audioFileUrl = this.getFullAudioUrl(this.track.audioFile);
    console.log('WaveSurfer loading from URL:', audioFileUrl);

    try {
      const container = this.waveformRef.nativeElement;
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      this.wavesurfer = WaveSurfer.create({
        container: this.waveformRef.nativeElement,
        height: 80,
        waveColor: '#9e9e9e',
        progressColor: '#1976d2',
        cursorColor: '#f44336',
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: true,
        fillParent: true,
        backend: 'WebAudio',
        hideScrollbar: true,
        interact: false,
      });

      this.wavesurfer.on('ready', () => {
        console.log('WaveSurfer is ready');
        this.waveformReady = true;

        // Set initial position if already playing
        if (this.audioState?.currentTime > 0 && this.audioState?.duration > 0) {
          const position = this.audioState.currentTime / this.audioState.duration;
          this.wavesurfer?.seekTo(position);
        }

        this.initializationInProgress = false;
        if (this.pendingPlayback) {
          console.log('Waveform is ready, resuming pending playback');
          this.pendingPlayback = false;
          setTimeout(() => {
            this.audioService.play();
          }, 100);
        }

        this.cdr.markForCheck();
      });

      this.wavesurfer.on('error', error => {
        console.error('WaveSurfer error:', error);
        this.waveformReady = false;
        this.initializationInProgress = false;
        this.cdr.markForCheck();
      });

      this.wavesurfer.on('interaction', () => {
        this.dragging = true;
      });

      (this.wavesurfer as any).on('seek', (position: number) => {
        console.log('WaveSurfer seek event:', position);
        if (this.audioState.track?.id === this.track.id) {
          const seekTime = position * this.audioState.duration;
          this.audioService.seek(seekTime);
        }

        setTimeout(() => {
          this.dragging = false;
        }, 100);
      });

      await this.wavesurfer.load(audioFileUrl);

      setTimeout(() => {
        if (!this.waveformReady && !this.componentDestroyed) {
          console.warn('WaveSurfer download timeout - possibly problems with downloading the audio file');
          this.initializationInProgress = false;
        }
      }, 10000);
    } catch (error) {
      console.error('Error creating WaveSurfer:', error);
      this.waveformReady = false;
      this.initializationInProgress = false;
      this.pendingPlayback = false;
      this.cdr.markForCheck();
    }
  }

  public togglePlayPause(): void {
    if (!this.waveformReady) {
      console.log('Waveform not ready yet, setting pending playback');
      this.pendingPlayback = true;
      this.cdr.markForCheck();
      return;
    }

    if (this.audioState.track?.id !== this.track.id) {
      this.audioService.playTrack(this.track);
    } else {
      this.audioService.togglePlayPause();
    }
  }

  public onClosePlayer(): void {
    this.audioService.stop();
    this.destroyWaveSurfer();
    this.close.emit();
  }

  public formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  public toggleMute(): void {
    if (this.audioState.volume > 0) {
      this.lastVolume = this.audioState.volume;
      this.audioService.setVolume(0);
    } else {
      const volumeToRestore = this.lastVolume || 0.7;
      this.audioService.setVolume(volumeToRestore);
    }
  }

  public onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const volume = parseFloat(input.value);
    this.audioService.setVolume(volume);

    if (volume > 0) {
      this.lastVolume = volume;
    }
  }

  public onTimelineClick(event: MouseEvent): void {
    if (!this.audioState.duration) return;

    const timeline = event.currentTarget as HTMLElement;
    const rect = timeline.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const seekTime = ratio * this.audioState.duration;

    this.audioService.seek(seekTime);
  }

  public get isPlaying(): boolean {
    return this.audioState?.isPlaying && this.audioState?.track?.id === this.track.id;
  }

  public get progressPercent(): number {
    if (!this.audioState?.duration) return 0;
    return (this.audioState.currentTime / this.audioState.duration) * 100;
  }

  private getFullAudioUrl(audioFilePath: string): string {
    if (audioFilePath.startsWith('http://') || audioFilePath.startsWith('https://')) {
      return audioFilePath;
    }
    return this.apiConfig.getUrl(`files/${audioFilePath}`);
  }
}
