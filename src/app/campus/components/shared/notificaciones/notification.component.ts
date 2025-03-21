import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, AppNotification } from './notification.service'; 

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="notification" class="fixed top-4 right-4 z-50 flex items-center p-4 border-t-4 rounded-lg" [ngClass]="notificationClasses" role="alert">
      <svg class="shrink-0 w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
      </svg>
      <div class="ms-3 text-sm font-medium">
        {{ notification.message }}
      </div>
      <button
        type="button"
        class="ms-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8"
        [ngClass]="buttonClasses"
        (click)="closeNotification()"
        aria-label="Close"
      >
        <span class="sr-only">Dismiss</span>
        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
        </svg>
      </button>
    </div>
  `,
})
export class NotificationComponent {
  notification: AppNotification | null = null;

  constructor(private notificationService: NotificationService) {
    this.notificationService.notification$.subscribe((notification) => {
      this.notification = notification;
    });
  }

  get notificationClasses() {
    return {
      'text-green-800 border-green-300 bg-green-50 dark:text-green-400 dark:bg-gray-800 dark:border-green-800': this.notification?.type === 'success',
      'text-red-800 border-red-300 bg-red-50 dark:text-red-400 dark:bg-gray-800 dark:border-red-800': this.notification?.type === 'error',
      'text-blue-800 border-blue-300 bg-blue-50 dark:text-blue-400 dark:bg-gray-800 dark:border-blue-800': this.notification?.type === 'info',
    };
  }

  get buttonClasses() {
    return {
      'bg-green-50 text-green-500 hover:bg-green-200 dark:bg-gray-800 dark:text-green-400 dark:hover:bg-gray-700': this.notification?.type === 'success',
      'bg-red-50 text-red-500 hover:bg-red-200 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700': this.notification?.type === 'error',
      'bg-blue-50 text-blue-500 hover:bg-blue-200 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700': this.notification?.type === 'info',
    };
  }

  closeNotification() {
    this.notification = null;
  }
}