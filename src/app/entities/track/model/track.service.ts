import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { TrackApiService } from '../../../shared';
import { BulkDeleteResponse, PaginatedTracksResponse, Track, TrackCreate, TrackUpdate } from './track';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TrackService {
  // Cache of tracks to support optimistic updates
  private tracksCache = new BehaviorSubject<Track[]>([]);

  private trackApi = inject(TrackApiService);

  public getTracks(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    genre?: string;
    artist?: string;
  }): Observable<PaginatedTracksResponse> {
    return this.trackApi.getAll(params).pipe(
      tap(response => {
        // Update our cache when we get new data
        this.tracksCache.next(response.data);
      })
    );
  }

  public getTrack(slug: string): Observable<Track> {
    return this.trackApi.getBySlug(slug);
  }

  public createTrack(data: TrackCreate): Observable<Track> {
    // Generate a temporary ID
    const tempId = 'temp-' + new Date().getTime();

    // Create an optimistic track object
    const optimisticTrack: Track = {
      id: tempId,
      title: data.title,
      artist: data.artist,
      album: data.album || undefined,
      genres: data.genres,
      slug: this.generateSlug(data.title, tempId),
      coverImage: data.coverImage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to our cache immediately for optimistic update
    const currentTracks = this.tracksCache.getValue();
    this.tracksCache.next([optimisticTrack, ...currentTracks]);

    // Perform the actual API call
    return this.trackApi.create(data).pipe(
      tap(createdTrack => {
        // Update the cache with the real track once created
        const updatedTracks = this.tracksCache.getValue().map(t =>
          t.id === tempId ? createdTrack : t
        );
        this.tracksCache.next(updatedTracks);
      }),
      catchError(error => {
        // If there's an error, revert the optimistic update
        const revertedTracks = this.tracksCache.getValue().filter(t => t.id !== tempId);
        this.tracksCache.next(revertedTracks);
        return throwError(() => error);
      })
    );
  }

  public updateTrack(id: string, data: TrackUpdate): Observable<Track> {
    // Find the track in our cache
    const currentTracks = this.tracksCache.getValue();
    const trackToUpdate = currentTracks.find(t => t.id === id);

    if (!trackToUpdate) {
      return this.trackApi.update(id, data);
    }

    // Create optimistic updated track
    const optimisticTrack: Track = {
      ...trackToUpdate,
      ...data,
      updatedAt: new Date().toISOString()
    };

    // Update cache with optimistic data
    const updatedTracks = currentTracks.map(t =>
      t.id === id ? optimisticTrack : t
    );
    this.tracksCache.next(updatedTracks);

    // Perform the actual API call
    return this.trackApi.update(id, data).pipe(
      tap(updatedTrack => {
        // Update with the real data from the server
        const serverUpdatedTracks = this.tracksCache.getValue().map(t =>
          t.id === id ? updatedTrack : t
        );
        this.tracksCache.next(serverUpdatedTracks);
      }),
      catchError(error => {
        // Revert to original track data on error
        this.tracksCache.next(currentTracks);
        return throwError(() => error);
      })
    );
  }

  public deleteTrack(id: string): Observable<void> {
    // Store current state for potential rollback
    const currentTracks = this.tracksCache.getValue();

    // Apply optimistic update
    const updatedTracks = currentTracks.filter(t => t.id !== id);
    this.tracksCache.next(updatedTracks);

    // Perform the actual API call
    return this.trackApi.delete(id).pipe(
      catchError(error => {
        // Revert to original data on error
        this.tracksCache.next(currentTracks);
        return throwError(() => error);
      })
    );
  }

  public deleteTracks(ids: string[]): Observable<BulkDeleteResponse> {
    // Store current state for potential rollback
    const currentTracks = this.tracksCache.getValue();

    // Apply optimistic update
    const updatedTracks = currentTracks.filter(t => !ids.includes(t.id));
    this.tracksCache.next(updatedTracks);

    // Perform the actual API call
    return this.trackApi.deleteMany(ids).pipe(
      tap(response => {
        // If some deletions failed, update our cache with accurate data
        if (response.failed.length > 0) {
          // Get the list of tracks that were successfully deleted
          const successfullyDeletedIds = response.success;

          // Filter the current tracks to remove only the successfully deleted ones
          const accurateTracks = currentTracks.filter(t => !successfullyDeletedIds.includes(t.id));
          this.tracksCache.next(accurateTracks);
        }
      }),
      catchError(error => {
        // Revert to original data on error
        this.tracksCache.next(currentTracks);
        return throwError(() => error);
      })
    );
  }

  public uploadFile(id: string, file: File): Observable<Track> {
    // Find the track in our cache
    const currentTracks = this.tracksCache.getValue();
    const trackToUpdate = currentTracks.find(t => t.id === id);

    if (!trackToUpdate) {
      return this.trackApi.uploadFile(id, file);
    }

    // Create a fake file path for optimistic update
    const optimisticFileName = file.name;

    // Create optimistic updated track with a temporary audio file path
    const optimisticTrack: Track = {
      ...trackToUpdate,
      audioFile: optimisticFileName, // Just show the file name for now
      updatedAt: new Date().toISOString()
    };

    // Update cache with optimistic data
    const updatedTracks = currentTracks.map(t =>
      t.id === id ? optimisticTrack : t
    );
    this.tracksCache.next(updatedTracks);

    // Perform the actual upload
    return this.trackApi.uploadFile(id, file).pipe(
      tap(updatedTrack => {
        // Update with the real data from the server
        const serverUpdatedTracks = this.tracksCache.getValue().map(t =>
          t.id === id ? updatedTrack : t
        );
        this.tracksCache.next(serverUpdatedTracks);
      }),
      catchError(error => {
        // Revert to original track data on error
        this.tracksCache.next(currentTracks);
        return throwError(() => error);
      })
    );
  }

  public deleteFile(id: string): Observable<Track> {
    // Find the track in our cache
    const currentTracks = this.tracksCache.getValue();
    const trackToUpdate = currentTracks.find(t => t.id === id);

    if (!trackToUpdate) {
      return this.trackApi.deleteFile(id);
    }

    // Create optimistic updated track with audio file removed
    const optimisticTrack: Track = {
      ...trackToUpdate,
      audioFile: undefined,
      updatedAt: new Date().toISOString()
    };

    // Update cache with optimistic data
    const updatedTracks = currentTracks.map(t =>
      t.id === id ? optimisticTrack : t
    );
    this.tracksCache.next(updatedTracks);

    // Perform the actual API call
    return this.trackApi.deleteFile(id).pipe(
      tap(updatedTrack => {
        // Update with the real data from the server
        const serverUpdatedTracks = this.tracksCache.getValue().map(t =>
          t.id === id ? updatedTrack : t
        );
        this.tracksCache.next(serverUpdatedTracks);
      }),
      catchError(error => {
        // Revert to original track data on error
        this.tracksCache.next(currentTracks);
        return throwError(() => error);
      })
    );
  }

  // Helper method to expose the tracks cache as an observable
  public getTracksCache(): Observable<Track[]> {
    return this.tracksCache.asObservable();
  }

  // Helper method to generate a temporary slug
  private generateSlug(title: string, id: string): string {
    return title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-') +
      '-' + id.substring(0, 8);
  }
}
