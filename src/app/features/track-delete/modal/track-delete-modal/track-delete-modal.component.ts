import {ChangeDetectionStrategy, Component, DestroyRef, inject, Inject} from '@angular/core';
import {Track, TrackService} from '../../../../entities';
import {finalize} from 'rxjs/operators';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {TestIdDirective, ToastService} from '../../../../shared';
import {MatButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {NgIf} from '@angular/common';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

interface DialogData {
  track?: Track;
  bulk?: boolean;
  count?: number;
}

@Component({
  selector: 'app-track-delete-modal',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    TestIdDirective,
    MatDialogActions,
    MatButton,
    MatProgressSpinner,
    NgIf
  ],
  templateUrl: './track-delete-modal.component.html',
  styleUrl: './track-delete-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackDeleteModalComponent {
  public deleting = false;

  private trackService = inject(TrackService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<TrackDeleteModalComponent>);
  public data= inject(MAT_DIALOG_DATA);

  public onConfirm(): void {
    this.deleting = true;

    if (this.data.bulk) {
      this.dialogRef.close(true);
      return;
    }

    if (!this.data.track) {
      this.dialogRef.close(false);
      return;
    }

    this.trackService.deleteTrack(this.data.track.id)
      .pipe(finalize(() => {
        this.deleting = false;
      }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.toast.success(`Track "${this.data.track?.title}" deleted successfully`);
          this.dialogRef.close(true);
        },
        error: (error: any) => {
          console.error('Failed to delete track', error);
          this.toast.error('Failed to delete track. Please try again.');
          this.dialogRef.close(false);
        }
      });
  }

  public onCancel(): void {
    this.dialogRef.close(false);
  }

  public get title(): string {
    if (this.data.bulk) {
      return 'Delete Tracks';
    }
    return 'Delete Track';
  }

  public get message(): string {
    if (this.data.bulk) {
      return `Are you sure you want to delete ${this.data.count} selected tracks? This action cannot be undone.`;
    }
    return `Are you sure you want to delete "${this.data.track?.title}"? This action cannot be undone.`;
  }
}
