import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipComponent } from '../tooltip/tooltip.component';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { SafeHtmlPipe } from '../../../campus/components/modules/gestion/campus-cursos/safe-html.pipe';
import { FormsModule } from '@angular/forms';

export interface ColumnConfig {
  field: string;
  header: string;
  maxWidth: number;
  sortable?: boolean;
  type?: 'text' | 'date';
  transform?: (value: any) => string;
  preview?: boolean; // Nueva propiedad: true para activar truncado + icono de vista en hover
}

export interface ActionConfig {
  name: string;
  icon: IconProp;
  tooltip: string;
  action: (item: any) => void;
  hoverColor?: string;
  visible?: (item: any) => boolean; // CAMBIO: Añadida la propiedad 'visible' para controlar la visibilidad de acciones
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    TooltipComponent,
    SafeHtmlPipe,
    FormsModule,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class TableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: ColumnConfig[] = [];
  @Input() enableActions: boolean = true;
  @Input() actions: ActionConfig[] = [];
  @Input() sortBy: string = '';
  @Input() sortDir: string = 'asc';
  @Input() itemsPerPage: number = 5;
  @Input() totalItems: number = 0;
  @Output() sortChange = new EventEmitter<{
    sortBy: string;
    sortDir: string;
  }>();
  @Output() previewClick = new EventEmitter<{ item: any; field: string }>();
  @Output() itemsPerPageChange = new EventEmitter<number>();


  private _currentPage: number = 1;
  @Input() set currentPage(value: number) {
    this._currentPage = value || 1;
  }
  get currentPage(): number {
    return this._currentPage;
  }

  pageSizeOptions: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalItems'] || changes['data']) {
      this.updatePageSizeOptions();
    }
  }

  private updatePageSizeOptions(): void {
  const total = this.totalItems || this.data.length;
  const fixedOptions = [5, 10, 15, 20, 25, 30];

  // Siempre incluye el 5 aunque haya menos datos
  this.pageSizeOptions = [5];
  this.pageSizeOptions.push(...fixedOptions.filter(opt => opt > 5 && opt <= total));

  if (this.pageSizeOptions.length === 1 && total >= 10) {
    this.pageSizeOptions.push(10);
  }

  // Si el valor actual es mayor al permitido, lo ajusta al máximo disponible
  const maxAllowed = Math.max(...this.pageSizeOptions);
  if (this.itemsPerPage > maxAllowed) {
    this.itemsPerPage = maxAllowed;
    this.itemsPerPageChange.emit(this.itemsPerPage);
  }
}

  onItemsPerPageChange(newSize: number): void {
    this.itemsPerPageChange.emit(newSize);
  }

  onPreviewClick(item: any, field: string): void {
    this.previewClick.emit({ item, field });
  }

  truncateText(value: any): string {
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return value || '';
  }

  // Código existente
  showCompetenciasModal(item: any): void {
    // Emite un evento al componente padre para manejar la apertura del modal
    this.competenciasClick.emit(item);
  }

  @Output() competenciasClick = new EventEmitter<any>();

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
