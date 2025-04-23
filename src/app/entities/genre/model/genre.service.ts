import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { GenreApiService } from '../../../shared';

@Injectable({
  providedIn: 'root'
})
export class GenreService {
  private genres$: Observable<string[]> | null = null;

  private genreApi = inject(GenreApiService);

  public getGenres(): Observable<string[]> {
    if (!this.genres$) {
      this.genres$ = this.genreApi.getAll().pipe(
        shareReplay(1),
        catchError(error => {
          console.error('Error loading genres:', error);
          return of([]);
        })
      );
    }

    return this.genres$;
  }

  public clearCache(): void {
    this.genres$ = null;
  }
}
