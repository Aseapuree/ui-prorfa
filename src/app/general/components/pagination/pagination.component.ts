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
  @Input() maxSize: number = 7;
  @Output() pageChange = new EventEmitter<number>();

  get pagesToShow(): number[] {
    const pages: number[] = [];
    const half = Math.floor(this.maxSize / 2);
    let start = Math.max(1, this.page - half);
    let end = Math.min(this.totalPages, start + this.maxSize - 1);

    if (end - start + 1 < this.maxSize) {
      start = Math.max(1, end - this.maxSize + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.page) {
      this.pageChange.emit(page);
    }
  }

  shouldShowEllipsisBefore(): boolean {
    return this.pagesToShow[0] > 1;
  }

  shouldShowEllipsisAfter(): boolean {
    return this.pagesToShow[this.pagesToShow.length - 1] < this.totalPages;
  }
}
