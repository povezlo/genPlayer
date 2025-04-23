import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TrackApiService } from '../../../shared';
import {BulkDeleteResponse, PaginatedTracksResponse, Track, TrackCreate, TrackUpdate} from './track';

@Injectable({
  providedIn: 'root'
})
export class TrackService {
  constructor(private trackApi: TrackApiService) {}

  public getTracks(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    genre?: string;
    artist?: string;
  }): Observable<PaginatedTracksResponse> {
    return this.trackApi.getAll(params);
  }

  public getTrack(slug: string): Observable<Track> {
    return this.trackApi.getBySlug(slug);
  }

  public createTrack(data: TrackCreate): Observable<Track> {
    return this.trackApi.create(data);
  }

  public updateTrack(id: string, data: TrackUpdate): Observable<Track> {
    return this.trackApi.update(id, data);
  }

  public deleteTrack(id: string): Observable<void> {
    return this.trackApi.delete(id);
  }

  public deleteTracks(ids: string[]): Observable<BulkDeleteResponse> {
    return this.trackApi.deleteMany(ids);
  }

  public uploadFile(id: string, file: File): Observable<Track> {
    return this.trackApi.uploadFile(id, file);
  }

  public deleteFile(id: string): Observable<Track> {
    return this.trackApi.deleteFile(id);
  }
}
