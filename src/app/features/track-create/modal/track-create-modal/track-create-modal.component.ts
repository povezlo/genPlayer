import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { NgForOf, NgIf } from '@angular/common';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import {MatChip, MatChipInputEvent, MatChipRemove, MatChipSet} from '@angular/material/chips';
import { MatProgressSpinner} from '@angular/material/progress-spinner';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TestIdDirective, ToastService } from '../../../../shared';
import { GenreService, TrackService } from '../../../../entities';

@Component({
  selector: 'app-track-create-modal',
  standalone: true,
  imports: [
    MatDialogTitle,
    NgIf,
    MatProgressSpinner,
    TestIdDirective,
    ReactiveFormsModule,
    MatDialogContent,
    MatFormField,
    MatInput,
    MatSelect,
    MatOption,
    MatChipSet,
    MatChip,
    MatChipRemove,
    NgForOf,
    MatIcon,
    MatError,
    MatDialogActions,
    MatButton,
    MatLabel,
  ],
  templateUrl: './track-create-modal.component.html',
  styleUrls: ['./track-create-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackCreateModalComponent implements OnInit {
  public form!: FormGroup;
  public genres: string[] = [];
  public loading = false;
  public submitting = false;
  public readonly separatorKeysCodes = [ENTER, COMMA] as const;

  private fb = inject(FormBuilder);
  private trackService = inject(TrackService);
  private genreService = inject(GenreService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private toast = inject(ToastService);

  constructor(private dialogRef: MatDialogRef<TrackCreateModalComponent>) {}

  public ngOnInit(): void {
    this.initForm();
    this.loadGenres();
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required]],
      artist: ['', [Validators.required]],
      album: [''],
      genres: [[], [Validators.required, Validators.minLength(1)]],
      coverImage: ['', [
        Validators.pattern('^(https?://)?([\\w-]+\\.)+[\\w-]+(/[\\w-./?%&=]*)?$')
      ]]
    });
  }

  private loadGenres(): void {
    this.loading = true;
    this.genreService.getGenres()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
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
    console.log('removeGenre', genre);
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

    this.trackService.createTrack(this.form.value)
      .pipe(
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (track) => {
          this.dialogRef.close(track);
          this.toast.success('The track has been successfully created');
        },
        error: (error) => {
          console.error('Failed to create track', error);
          this.toast.error('Failed to load genres');
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
