import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  @Input() page: number = 1;
  @Input() totalPages: number = 1;
  @Output() pageChange = new EventEmitter<number>();

  get pagesToShow(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 3; // Mostrar solo 3 páginas

    if (this.totalPages <= 4) {
      // Si hay 4 o menos páginas, mostrar todas
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para más de 4 páginas
      if (this.page <= 2) {
        // Si estamos en las primeras páginas (1 o 2)
        pages.push(1, 2, 3);
      } else if (this.page >= this.totalPages - 1) {
        // Si estamos en las últimas páginas
        pages.push(this.totalPages - 2, this.totalPages - 1, this.totalPages);
      } else {
        // Si estamos en una página intermedia
        pages.push(this.page - 1, this.page, this.page + 1);
      }
    }

    return pages;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.page) {
      this.pageChange.emit(page);
    }
  }

  shouldShowEllipsisBefore(): boolean {
    // Mostrar puntos suspensivos antes si la primera página visible es mayor a 2
    return this.totalPages > 4 && this.pagesToShow[0] > 2;
  }

  shouldShowEllipsisAfter(): boolean {
    // Mostrar puntos suspensivos después si la última página visible es menor que totalPages - 1
    return this.totalPages > 4 && this.pagesToShow[this.pagesToShow.length - 1] < this.totalPages - 1;
  }
}
