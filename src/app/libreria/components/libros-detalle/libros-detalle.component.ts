import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-libros-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './libros-detalle.component.html',
  styleUrl: './libros-detalle.component.scss'
})
export class LibrosDetalleComponent {
  @Input() book!: any;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}
