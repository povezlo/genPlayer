import { Routes } from '@angular/router';
import {NotFoundPageComponent, TracksPageComponent} from './pages';

export const routes: Routes = [
  { path: '', redirectTo: 'tracks', pathMatch: 'full' },
  { path: 'tracks', component: TracksPageComponent },
  { path: '**', component: NotFoundPageComponent }
];
