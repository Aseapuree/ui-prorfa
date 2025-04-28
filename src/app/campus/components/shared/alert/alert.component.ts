import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message" class="flex items-center p-4 mb-4 text-sm rounded-lg" [ngClass]="alertClasses" role="alert">
      <svg class="shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path *ngIf="type === 'error' || type === 'warning'" d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
        <path *ngIf="type === 'success'" d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM13.5 7.5l-4 4-2-2 1.5-1.5 1 1 2.5-2.5 1.5 1.5Z"/>
      </svg>
      <span class="sr-only">Info</span>
      <div>
        <span class="font-medium">
          {{ type === 'error' ? 'Error!' : type === 'warning' ? 'Advertencia!' : 'Éxito!' }}
        </span> {{ message }}
      </div>
    </div>
  `,
})
export class AlertComponent {
  @Input() message: string | null = null;
  @Input() type: 'error' | 'warning' | 'success' = 'error';

  get alertClasses() {
    return {
      'text-red-800 border border-red-300 bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800': this.type === 'error',
      'text-yellow-800 border border-yellow-300 bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800': this.type === 'warning',
      'text-green-800 border border-green-300 bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-800': this.type === 'success'
    };
  }
}