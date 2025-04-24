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
      // Сначала проверим, воспроизводится ли этот трек сейчас
      const isThisTrackCurrentlyPlaying = this.isCurrentlyPlaying;

      if (isThisTrackCurrentlyPlaying) {
        // Если трек уже воспроизводится, ставим на паузу
        this.audioService.pause();
      } else {
        // Если воспроизводится другой трек или ничего не воспроизводится,
        // запускаем выбранный трек принудительно
        this.audioService.playTrack(this.track);
        // Эмитим событие play для родительского компонента,
        // чтобы он знал, что нужно отобразить плеер для этого трека
        this.play.emit(this.track);
      }
    }
  }
}
