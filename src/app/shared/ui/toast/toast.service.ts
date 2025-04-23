import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  public success(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  public error(message: string, duration: number = 5000): void {
    this.show(message, 'error', duration);
  }

  public info(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }

  public warning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', duration);
  }

  private show(message: string, type: 'success' | 'error' | 'info' | 'warning', duration: number): void {
    const panelClass = `${type}-snackbar`;

    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: [panelClass],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
