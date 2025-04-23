import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit} from '@angular/core';
import {GenreService, Track, TrackService} from '../../../../entities';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {TestIdDirective, ToastService} from '../../../../shared';
import {finalize} from 'rxjs/operators';
import {MatChip, MatChipInputEvent, MatChipSet} from '@angular/material/chips';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {NgForOf, NgIf} from '@angular/common';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';


interface DialogData {
  track: Track;
}

@Component({
  selector: 'app-track-edit-modal',
  standalone: true,
  imports: [
    MatDialogTitle,
    TestIdDirective,
    MatProgressSpinner,
    NgIf,
    ReactiveFormsModule,
    MatDialogContent,
    MatFormField,
    MatInput,
    MatSelect,
    MatOption,
    NgForOf,
    MatChipSet,
    MatChip,
    MatIcon,
    MatError,
    MatDialogActions,
    MatButton,
    MatLabel,
  ],
  templateUrl: './track-edit-modal.component.html',
  styleUrl: './track-edit-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackEditModalComponent implements OnInit {
  public form!: FormGroup;
  public genres: string[] = [];
  public loading = false;
  public submitting = false;
  public readonly separatorKeysCodes = [ENTER, COMMA] as const;

  constructor(
    private fb: FormBuilder,
    private trackService: TrackService,
    private genreService: GenreService,
    private dialogRef: MatDialogRef<TrackEditModalComponent>,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  public ngOnInit(): void {
    this.initForm();
    this.loadGenres();
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: [this.data.track.title, [Validators.required]],
      artist: [this.data.track.artist, [Validators.required]],
      album: [this.data.track.album || ''],
      genres: [this.data.track.genres, [Validators.required, Validators.minLength(1)]],
      coverImage: [this.data.track.coverImage || '', [
        Validators.pattern('^(https?://)?([\\w-]+\\.)+[\\w-]+(/[\\w-./?%&=]*)?$')
      ]]
    });
  }

  private loadGenres(): void {
    this.loading = true;
    this.genreService.getGenres()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (genres) => {
          this.genres = genres;
        },
        error: (error) => {
          console.error('Failed to load genres', error);
          this.toast.error('Failed to load genres');
        }
      });
  }

  public addGenre(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    const currentGenres = this.form.get('genres')?.value as string[] || [];

    if (value && !currentGenres.includes(value) && this.genres.includes(value)) {
      this.form.get('genres')?.setValue([...currentGenres, value]);
    }

    event.chipInput!.clear();
  }

  public removeGenre(genre: string): void {
    const currentGenres = this.form.get('genres')?.value as string[] || [];
    const updatedGenres = currentGenres.filter(g => g !== genre);
    this.form.get('genres')?.setValue(updatedGenres);
  }

  public selectGenre(genre: string): void {
    const currentGenres = this.form.get('genres')?.value as string[] || [];

    if (!currentGenres.includes(genre)) {
      this.form.get('genres')?.setValue([...currentGenres, genre]);
    }
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    this.trackService.updateTrack(this.data.track.id, this.form.value)
      .pipe(finalize(() => {
        this.submitting = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (track) => {
          this.toast.success(`Track "${track.title}" updated successfully`);
          this.dialogRef.close(track);
        },
        error: (error) => {
          console.error('Failed to update track', error);
          this.toast.error('Failed to update track. Please try again.');
        }
      });
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public get titleControl() { return this.form.get('title'); }
  public get artistControl() { return this.form.get('artist'); }
  public get albumControl() { return this.form.get('album'); }
  public get genresControl() { return this.form.get('genres'); }
  public get coverImageControl() { return this.form.get('coverImage'); }
}
