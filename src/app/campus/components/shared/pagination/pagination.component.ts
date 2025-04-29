import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  @Input() currentPage: number = 1; // Página actual
  @Input() itemsPerPage: number = 4; // Elementos por página
  @Input() totalItems: number = 0; // Total de elementos
  @Input() showPagination: boolean = true; // Mostrar u ocultar la paginación
  @Output() pageChange = new EventEmitter<number>(); // Evento cuando cambia la página

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }
}
