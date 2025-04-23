import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, DestroyRef, ElementRef,
  EventEmitter, inject,
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

  private destroyRef = inject(DestroyRef);
  private apiConfig = inject(ApiConfigService);

  constructor(
    private audioService: AudioPlaybackService,
    private cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.audioService.audioState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        this.audioState = state;
        this.cdr.markForCheck();

        if (this.wavesurfer && this.waveformReady && !this.dragging) {
          if (state.track?.id === this.track.id) {
            this.wavesurfer.seekTo(state.currentTime / Math.max(state.duration, 1));
          }
        }
      });
  }

  public async ngAfterViewInit(): Promise<void> {
    await this.initWaveSurfer();
  }

  public ngOnDestroy(): void {
    if (this.wavesurfer) {
      this.wavesurfer.destroy();
    }
  }

  private async initWaveSurfer(): Promise<void> {
    if (!this.track.audioFile) return;

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
      minPxPerSec: 50,
      fillParent: true,
      backend: 'WebAudio',
      autoplay: true,
    });

    const audioFileUrl = this.getFullAudioUrl(this.track.audioFile);

    console.log('Loading audio file from:', audioFileUrl);
    await this.wavesurfer.load(audioFileUrl);

    this.wavesurfer.on('ready', () => {
      this.waveformReady = true;
      this.cdr.markForCheck();
    });

    this.wavesurfer.on('interaction', () => {
      this.dragging = true;
    });

    this.wavesurfer.on('seeking', (position: number) => {
      if (this.audioState.track?.id === this.track.id) {
        const seekTime = position * this.audioState.duration;
        this.audioService.seek(seekTime);
      }

      setTimeout(() => {
        this.dragging = false;
      }, 100);
    });
  }

  public togglePlayPause(): void {
    if (this.audioState.track?.id !== this.track.id) {
      this.audioService.playTrack(this.track);
    } else {
      this.audioService.togglePlayPause();
    }
  }

  public onClosePlayer(): void {
    if (this.audioState.track?.id === this.track.id) {
      this.audioService.stop();
    }
    this.close.emit();
  }

  public formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  public onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const volume = parseFloat(input.value);
    this.audioService.setVolume(volume);
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
    return this.audioState.isPlaying && this.audioState.track?.id === this.track.id;
  }

  public get progressPercent(): number {
    if (!this.audioState.duration) return 0;
    return (this.audioState.currentTime / this.audioState.duration) * 100;
  }

  private getFullAudioUrl(audioFilePath: string): string {
    if (audioFilePath.startsWith('http://') || audioFilePath.startsWith('https://')) {
      return audioFilePath;
    }
    return this.apiConfig.getUrl(`files/${audioFilePath}`);
  }
}
