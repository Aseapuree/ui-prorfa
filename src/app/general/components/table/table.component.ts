import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipComponent } from '../tooltip/tooltip.component';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

export interface ColumnConfig {
  field: string;
  header: string;
  maxWidth: number;
  sortable?: boolean;
  type?: 'text' | 'date';
  transform?: (value: any) => string; // Nueva propiedad para transformar el valor
}

export interface ActionConfig {
  name: string;
  icon: IconProp;
  tooltip: string;
  action: (item: any) => void;
  hoverColor?: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, TooltipComponent],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent {
  @Input() data: any[] = [];
  @Input() columns: ColumnConfig[] = [];
  @Input() enableActions: boolean = true;
  @Input() actions: ActionConfig[] = [];
  @Input() sortBy: string = '';
  @Input() sortDir: string = 'asc';
  @Output() sortChange = new EventEmitter<{ sortBy: string, sortDir: string }>();

  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDir = 'asc';
    }
    this.sortChange.emit({ sortBy: this.sortBy, sortDir: this.sortDir });
  }
}

