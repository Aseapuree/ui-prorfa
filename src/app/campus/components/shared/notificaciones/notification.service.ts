import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppNotification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<AppNotification | null>(null);
  notification$ = this.notificationSubject.asObservable();

  showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.notificationSubject.next({ message, type });
    setTimeout(() => this.notificationSubject.next(null), 5000); // Desaparece después de 3 segundos
  }
}