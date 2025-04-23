import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../lib';
import { BulkDeleteResponse, PaginatedTracksResponse, Track, TrackCreate, TrackUpdate } from '../../entities';

@Injectable({
  providedIn: 'root'
})
export class TrackApiService {
  constructor(
    private api: ApiService
  ) {}

  public getAll(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    genre?: string;
    artist?: string;
  }): Observable<PaginatedTracksResponse> {
    return this.api.get<PaginatedTracksResponse>('tracks', params);
  }

  public getBySlug(slug: string): Observable<Track> {
    return this.api.get<Track>(`tracks/${slug}`);
  }

  public create(data: TrackCreate): Observable<Track> {
    return this.api.post<Track>('tracks', data);
  }

  public update(id: string, data: TrackUpdate): Observable<Track> {
    return this.api.put<Track>(`tracks/${id}`, data);
  }

  public delete(id: string): Observable<void> {
    return this.api.delete<void>(`tracks/${id}`);
  }

  public deleteMany(ids: string[]): Observable<BulkDeleteResponse> {
    return this.api.post<BulkDeleteResponse>('tracks/delete', { ids });
  }

  public uploadFile(id: string, file: File): Observable<Track> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<Track>(`tracks/${id}/upload`, formData);
  }

  public deleteFile(id: string): Observable<Track> {
    return this.api.delete<Track>(`tracks/${id}/file`);
  }
}
