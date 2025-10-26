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
 @Input() title: string = 'Detalles'; // Título configurable
  @Input() data: any; // Datos a mostrar (cualquier tipo)
  @Input() contentType: 'text' | 'json' | 'html' = 'text'; // Tipo de contenido
  @Input() maxWidth: string = 'lg'; // Tamaño del modal: sm, md, lg, xl
  @Input() customClass: string = ''; // Clases CSS adicionales
  @Input() buttons: ModalButton[] = []; // Botones personalizados
  @Input() showCloseButton: boolean = true; // Mostrar botón de cerrar
  @Output() close = new EventEmitter<void>(); // Evento de cierre

  // Definir titleId para accesibilidad
  titleId: string = 'modal-title-' + Math.random().toString(36).substring(2, 10); // ID único para el título

  // Mapa de tamaños del modal
  private sizeClasses: { [key: string]: string } = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  // Obtener la clase de tamaño basada en maxWidth
  get modalSizeClass(): string {
    return this.sizeClasses[this.maxWidth] || this.sizeClasses['lg'];
  }

  // Procesar los datos según el tipo de contenido
  get formattedData(): string {
    if (!this.data) return '';
    switch (this.contentType) {
      case 'json':
        try {
          return JSON.stringify(this.data, null, 2);
        } catch (e) {
          return 'Error al formatear JSON';
        }
      case 'html':
        return this.data; // Se asume que el HTML es seguro
      case 'text':
      default:
        return String(this.data);
    }
  }

  // Manejar el cierre del modal
  onClose(): void {
    this.close.emit();
  }

  // Cerrar el modal al presionar Escape
  @HostListener('document:keydown.escape', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    event.preventDefault();
    this.onClose();
  }
}
