import {ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit} from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { debounceTime, distinctUntilChanged, finalize, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { GenreService, Track, TrackCardComponent, TrackPlayerComponent, TrackService } from '../../entities';
import {
  TrackCreateModalComponent,
  TrackDeleteModalComponent,
  TrackEditModalComponent,
  TrackUploadModalComponent
} from '../../features';
import { TestIdDirective } from '../../shared';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {AudioPlaybackService} from '../../processes';

@Component({
  selector: 'app-track-list-widget',
  standalone: true,
  imports: [
    TrackCardComponent,
    TrackPlayerComponent,
    TestIdDirective,
    NgIf,
    NgForOf,
    MatIcon,
    MatFormField,
    MatInput,
    MatSelect,
    MatOption,
    MatLabel,
    MatIconButton,
    MatButton,
    MatProgressSpinner,
    MatPaginator,
  ],
  templateUrl: './track-list-widget.component.html',
  styleUrl: './track-list-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackListWidgetComponent implements OnInit {
  public tracks: Track[] = [];
  public genres: string[] = [];
  public artists: string[] = [];
  public loading = false;
  public pagination = {
    page: 0,
    limit: 10,
    total: 0,
    totalPages: 0
  };

  public searchText = '';
  public searchSubject = new Subject<string>();
  public sortField = 'createdAt';
  public sortOrder: 'asc' | 'desc' = 'desc';
  public selectedGenre = '';
  public selectedArtist = '';

  public selectMode = false;
  public selectedTracks = new Set<string>();

  public currentPlayingTrack: Track | null = null;

  private trackService = inject(TrackService);
  private genreService = inject(GenreService);
  private audioService = inject(AudioPlaybackService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  public ngOnInit(): void {
    this.setupSearchDebounce();
    this.fetchTracks();
    this.loadGenres();
    this.loadArtists();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(value => {
      this.searchText = value;
      this.pagination.page = 0;
      this.fetchTracks();
    });
  }

  private loadGenres(): void {
    this.genreService.getGenres().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (genres) => {
        this.genres = genres;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load genres', error);
        this.showSnackBar('Failed to load genres');
      }
    });
  }

  private loadArtists(): void {
    this.trackService.getTracks({ limit: 100 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const uniqueArtists = new Set<string>();
        response.data.forEach(track => uniqueArtists.add(track.artist));
        this.artists = Array.from(uniqueArtists).sort();
        this.cdr.markForCheck();
      }
    });
  }

  public fetchTracks(): void {
    this.loading = true;

    this.trackService.getTracks({
      page: this.pagination.page + 1,
      limit: this.pagination.limit,
      sort: this.sortField,
      order: this.sortOrder,
      search: this.searchText || undefined,
      genre: this.selectedGenre || undefined,
      artist: this.selectedArtist || undefined
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        this.tracks = response.data;
        this.pagination.total = response.meta.total;
        this.pagination.totalPages = response.meta.totalPages;
      },
      error: (error) => {
        console.error('Failed to fetch tracks', error);
        this.showSnackBar('Failed to fetch tracks');
      }
    });
  }

  public onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  public onSortChange(event: any): void {
    this.sortField = event.value;
    this.fetchTracks();
  }

  public onOrderChange(order: 'asc' | 'desc'): void {
    this.sortOrder = order;
    this.fetchTracks();
  }

  public onGenreChange(event: any): void {
    this.selectedGenre = event.value;
    this.fetchTracks();
  }

  public onArtistChange(event: any): void {
    this.selectedArtist = event.value;
    this.fetchTracks();
  }

  public onPageChange(event: PageEvent): void {
    this.pagination.page = event.pageIndex;
    this.pagination.limit = event.pageSize;
    this.fetchTracks();
  }

  public openCreateModal(): void {
    const dialogRef = this.dialog.open(TrackCreateModalComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.fetchTracks();
        this.showSnackBar('Track created successfully');
      }
    });
  }

  public openEditModal(track: Track): void {
    const dialogRef = this.dialog.open(TrackEditModalComponent, {
      width: '500px',
      disableClose: true,
      data: { track }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.fetchTracks();
        this.showSnackBar('Track updated successfully');
      }
    });
  }

  public openDeleteModal(track: Track): void {
    const dialogRef = this.dialog.open(TrackDeleteModalComponent, {
      width: '400px',
      data: { track }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.fetchTracks();
        this.showSnackBar('Track deleted successfully');
      }
    });
  }

  public openUploadModal(track: Track): void {
    const dialogRef = this.dialog.open(TrackUploadModalComponent, {
      width: '500px',
      data: { track }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.fetchTracks();
        this.showSnackBar('File uploaded successfully');
      }
    });
  }

  public toggleSelectMode(): void {
    this.selectMode = !this.selectMode;
    if (!this.selectMode) {
      this.selectedTracks.clear();
    }
  }

  public onTrackSelect(event: { track: Track, selected: boolean }): void {
    if (event.selected) {
      this.selectedTracks.add(event.track.id);
    } else {
      this.selectedTracks.delete(event.track.id);
    }
  }

  public selectAll(): void {
    if (this.selectedTracks.size === this.tracks.length) {
      this.selectedTracks.clear();
    } else {
      this.tracks.forEach(track => this.selectedTracks.add(track.id));
    }
    this.cdr.markForCheck();
  }

  public deleteBulk(): void {
    if (this.selectedTracks.size === 0) return;

    const dialogRef = this.dialog.open(TrackDeleteModalComponent, {
      width: '400px',
      data: {
        bulk: true,
        count: this.selectedTracks.size
      }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.loading = true;
        this.trackService.deleteTracks(Array.from(this.selectedTracks))
          .pipe(
            finalize(() => {
              this.loading = false;
              this.cdr.markForCheck();
            }),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe({
            next: (response) => {
              this.selectedTracks.clear();
              this.fetchTracks();
              this.showSnackBar(`Successfully deleted ${response.success.length} tracks`);
              if (response.failed.length > 0) {
                this.showSnackBar(`Failed to delete ${response.failed.length} tracks`, 'error');
              }
            },
            error: (error) => {
              console.error('Failed to delete tracks', error);
              this.showSnackBar('Failed to delete tracks', 'error');
            }
          });
      }
    });
  }

  public onTrackPlay(track: Track): void {
    this.currentPlayingTrack = track;
    this.cdr.markForCheck();
  }

  public onStopPlayback(): void {
    console.log('Stopping playback and closing player');

    // Полностью сбрасываем аудиоплеер
    this.audioService.reset();

    // Убираем ссылку на текущий трек, чтобы скрыть плеер
    this.currentPlayingTrack = null;
    this.cdr.markForCheck();
  }

  private showSnackBar(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'error' ? ['error-snackbar'] : ['success-snackbar']
    });
  }
}
