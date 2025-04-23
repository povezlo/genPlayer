import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../lib';

@Injectable({
  providedIn: 'root'
})
export class GenreApiService {
  private api = inject(ApiService);

  public getAll(): Observable<string[]> {
    return this.api.get<string[]>('genres');
  }
}
