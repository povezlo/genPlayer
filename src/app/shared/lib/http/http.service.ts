import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from '../../config';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService,
  ) {}

  public get<T>(endpoint: string, body?: any, headers?: HttpHeaders): Observable<T> {
    let params: any = {};

    if (body) {
      let httpParams = new HttpParams();
      Object.keys(body).forEach(key => {
        if (body[key] !== undefined && body[key] !== null) {
          httpParams = httpParams.set(key, body[key]);
        }
      });
      params = httpParams;
    }

    return this.http.get<T>(this.apiConfig.getUrl(endpoint), { params, headers });
  }

  public post<T>(endpoint: string, body: any, headers?: HttpHeaders): Observable<T> {
    const options: any = {};

    if (headers) {
      options.headers = headers;
    }

    return this.http.post<T>(this.apiConfig.getUrl(endpoint), body, { params: options });
  }

  public put<T>(endpoint: string, body: any, headers?: HttpHeaders): Observable<T> {
    const options: any = {};

    if (headers) {
      options.headers = headers;
    }

    return this.http.put<T>(this.apiConfig.getUrl(endpoint), body, { params: options });
  }

  public delete<T>(endpoint: string, headers?: HttpHeaders): Observable<T> {
    const options: any = {};

    if (headers) {
      options.headers = headers;
    }

    return this.http.delete<T>(this.apiConfig.getUrl(endpoint), { params: options });
  }
}
