import {ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Inject} from '@angular/core';
import {Track, TrackService} from '../../../../entities';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {TestIdDirective, ToastService} from '../../../../shared';
import {finalize} from 'rxjs/operators';
import {NgIf} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

interface DialogData {
  track: Track;
}

@Component({
  selector: 'app-track-upload-modal',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    NgIf,
    MatIcon,
    MatButton,
    TestIdDirective,
    MatDialogActions,
    MatProgressSpinner
  ],
  templateUrl: './track-upload-modal.component.html',
  styleUrl: './track-upload-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackUploadModalComponent {
  public uploading = false;
  public file: File | null = null;
  public error: string | null = null;
  public hasExistingFile = false;
  public uploadProgress = 0;

  constructor(
    private trackService: TrackService,
    private dialogRef: MatDialogRef<TrackUploadModalComponent>,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.hasExistingFile = !!this.data.track.audioFile;
  }
  private destroyRef = inject(DestroyRef);

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.file = null;
      return;
    }

    const file = input.files[0];

    // Проверяем тип файла
    if (!this.isAudioFile(file)) {
      this.error = 'Invalid file type. Please upload an audio file (MP3, WAV, OGG).';
      this.file = null;
      this.cdr.markForCheck();
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      this.error = 'File size exceeds 20MB. Please upload a smaller file.';
      this.file = null;
      this.cdr.markForCheck();
      return;
    }

    this.file = file;
    this.error = null;
    this.cdr.markForCheck();
  }

  public uploadFile(): void {
    if (!this.file) {
      this.error = 'Please select a file to upload.';
      return;
    }

    this.uploading = true;
    this.error = null;

    this.trackService.uploadFile(this.data.track.id, this.file)
      .pipe(finalize(() => {
        this.uploading = false;
          this.uploadProgress = 100; // Complete the progress bar
          this.cdr.markForCheck();

          // Reset progress after a short delay
          setTimeout(() => {
            this.uploadProgress = 0;
            this.cdr.markForCheck();
          }, 1000);
      }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (track) => {
          this.toast.success('File uploaded successfully');
          this.dialogRef.close(track);
        },
        error: (error) => {
          console.error('Failed to upload file', error);
          this.error = 'Failed to upload file. Please try again.';
          this.toast.error('Failed to upload file');
        }
      });
  }

  public deleteFile(): void {
    this.uploading = true;

    this.trackService.deleteFile(this.data.track.id)
      .pipe(finalize(() => {
          this.uploading = false;
          this.cdr.markForCheck();
      }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (track) => {
          this.toast.success('File deleted successfully');
          this.dialogRef.close(track);
        },
        error: (error) => {
          console.error('Failed to delete file', error);
          this.error = 'Failed to delete file. Please try again.';
          this.toast.error('Failed to delete file');
        }
      });
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public getFilename(): string {
    if (this.file) {
      return this.file.name;
    }

    if (this.data.track.audioFile) {
      const parts = this.data.track.audioFile.split('/');
      return parts[parts.length - 1];
    }

    return '';
  }

  private isAudioFile(file: File): boolean {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav'];
    return validTypes.includes(file.type);
  }

  private simulateProgress(): void {
    this.uploadProgress = 0;
    const interval = setInterval(() => {
      if (this.uploadProgress >= 90) {
        clearInterval(interval);
      } else {
        // Increment faster at first, then slow down
        const increment = this.uploadProgress < 30 ? 10 :
          this.uploadProgress < 60 ? 5 : 2;
        this.uploadProgress += increment;
        this.cdr.markForCheck();
      }
    }, 300);
  }
}
