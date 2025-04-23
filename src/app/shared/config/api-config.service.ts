import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {
  private readonly baseUrl = environment.apiUrl;

  public getUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }
}
