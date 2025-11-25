import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

export interface ModalButton {
  label: string;
  styleClass?: string;
  action: () => void;
  disabled?: boolean;
}

@Component({
  selector: 'app-auditmodal',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './auditmodal.component.html',
  styleUrl: './auditmodal.component.scss',
})
export class AuditmodalComponent {
  @Input() title: string = 'Modal';
  @Input() modalSizeClass: string = 'max-w-lg';
  @Input() customClass: string = '';
  @Input() buttons: ModalButton[] = [];
  @Input() showCloseButton: boolean = false;  // ← Ahora por defecto NO aparece

  // NUEVOS INPUTS AÑADIDOS
  @Input() data: any;                     // Dato a mostrar
  @Input() contentType: 'json' | 'text' = 'text'; // Tipo de contenido
  @Input() maxWidth: string = 'md';       // sm, md, lg, xl, 2xl

  @Output() close = new EventEmitter<void>();

  titleId: string = 'modal-title-' + Math.random().toString(36).substring(2, 10);

  onClose(): void {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
onEscape() {
  this.onClose();
}
}
