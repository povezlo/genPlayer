import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { MatCard, MatCardActions, MatCardContent, MatCardImage } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';

import { Track } from '../../model';
import { TestIdDirective } from '../../../../shared';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {AudioPlaybackService} from '../../../../processes';

@Component({
  selector: 'app-track-card',
  standalone: true,
  imports: [
    TestIdDirective,
    NgIf,
    NgForOf,
    MatCheckbox,
    MatCard,
    MatIcon,
    MatCardContent,
    MatChipSet,
    MatChip,
    MatCardActions,
    MatIconButton,
    MatMiniFabButton,
    MatCardImage,
  ],
  templateUrl: './track-card.component.html',
  styleUrl: './track-card.component.scss',
})
export class TrackCardComponent implements OnInit {
  @Input() public track!: Track;
  @Input() public selected = false;
  @Input() public selectMode = false;

  @Output() public edit = new EventEmitter<Track>();
  @Output() public delete = new EventEmitter<Track>();
  @Output() public upload = new EventEmitter<Track>();
  @Output() public select = new EventEmitter<{ track: Track, selected: boolean }>();
  @Output() public play = new EventEmitter<Track>();

  public isCurrentlyPlaying = false;

  private destroyRef = inject(DestroyRef);
  private audioService = inject(AudioPlaybackService);
  private cdr = inject(ChangeDetectorRef);

  public ngOnInit(): void {
    this.audioService.audioState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        const isCurrentTrack = state.track?.id === this.track.id;
        this.isCurrentlyPlaying = isCurrentTrack && state.isPlaying;
        this.cdr.markForCheck();
      });
  }

  public onEdit(): void {
    this.edit.emit(this.track);
  }

  public onDelete(): void {
    this.delete.emit(this.track);
  }

  public onUpload(): void {
    this.upload.emit(this.track);
  }

  public onSelect(event: MatCheckboxChange): void {
    this.select.emit({ track: this.track, selected: event.checked });
  }

  public onPlay(): void {
    if (this.track.audioFile) {
      // Check if this track is currently playing
      const isThisTrackCurrentlyPlaying = this.isCurrentlyPlaying;

      // Check if this track is already loaded in the audio service but paused
      const isThisTrackLoadedButPaused = this.audioService.isCurrentTrack(this.track.id) && !this.audioService.isPlaying();

      if (isThisTrackCurrentlyPlaying) {
        // If the track is currently playing, pause it
        this.audioService.pause();
      } else if (isThisTrackLoadedButPaused) {
        // If this track is already loaded but paused, just toggle play/pause without restarting
        this.audioService.togglePlayPause();
        // Still need to emit the play event in case the player UI needs to be shown
        this.play.emit(this.track);
      } else {
        // If it's a different track or nothing is loaded, start playing this track from the beginning
        this.audioService.playTrack(this.track);
        // Emit play event so parent component can show the player
        this.play.emit(this.track);
      }
    }
  }
}
