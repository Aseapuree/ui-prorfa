import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SEARCH_NO_NUMBERS_REGEX, SEARCH_VALIDATION_MESSAGES, SEARCH_NO_NUMBERS_INTERMEDIATE_REGEX } from '../../../../general/components/const/const';
import { GeneralLoadingSpinnerComponent } from '../../../../general/components/spinner/spinner.component';
import { TableComponent, ColumnConfig } from '../../../../general/components/table/table.component';
import { AuditProrfa } from '../../../interface/audit';
import { AuditService } from '../../../services/audit.service';
import { NotificationComponent } from '../../shared/notificaciones/notification.component';
import { NotificationService } from '../../shared/notificaciones/notification.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [RouterModule, TableComponent, GeneralLoadingSpinnerComponent, PaginationComponent, HttpClientModule, CommonModule, FontAwesomeModule, FormsModule, NotificationComponent],
  providers: [AuditService],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.scss'
})
export class AuditComponent implements OnInit {
  public page: number = 1;
  public itemsPerPage: number = 10;
  public pageSizeOptions: number[] = [];
  totalPages: number = 1;
  auditorias: AuditProrfa[] = [];
  keyword: string = '';
  totalAuditorias: number = 0;
  private lastValidKeyword: string = '';
  sortBy: string = 'fechaCreacion';
  sortDir: string = 'desc';
  isLoading: boolean = false;

  // Configuración de columnas para la tabla
  tableColumns: ColumnConfig[] = [
    { field: 'bandeja', header: 'Bandeja', maxWidth: 150, sortable: true, type: 'text' },
    { field: 'accion', header: 'Acción', maxWidth: 200, sortable: true, type: 'text' },
    { 
      field: 'userId', 
      header: 'Usuario ID', 
      maxWidth: 150, 
      sortable: false, 
      type: 'text',
      transform: (value: string) => value ? value.substring(0, 8) + '...' : ''
    },
    { 
      field: 'idRol', 
      header: 'Rol ID', 
      maxWidth: 120, 
      sortable: false, 
      type: 'text',
      transform: (value: string) => value ? value.substring(0, 8) + '...' : ''
    },
    { 
      field: 'fechaCreacion', 
      header: 'Fecha', 
      maxWidth: 150, 
      sortable: true, 
      type: 'date'
    },
    { 
      field: 'ipAddress', 
      header: 'IP', 
      maxWidth: 120, 
      sortable: false, 
      type: 'text'
    },
    { 
      field: 'payload', 
      header: 'Payload', 
      maxWidth: 200, 
      sortable: false, 
      type: 'text',
      transform: (value: any) => {
        if (!value) return '';
        try {
          const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
          return jsonStr.substring(0, 50) + (jsonStr.length > 50 ? '...' : '');
        } catch (e) {
          return 'Error al parsear payload';
        }
      }
    }
  ];

  constructor(
    private auditService: AuditService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedItemsPerPage = localStorage.getItem('itemsPerPageAudit');
      if (savedItemsPerPage) {
        this.itemsPerPage = parseInt(savedItemsPerPage, 10);
      }
    }
    this.cargarConteoAuditorias();
    this.cargarAuditorias();
  }

  private updatePageSizeOptions(): void {
    const previousItemsPerPage = this.itemsPerPage;
    this.pageSizeOptions = [];
    const increment = 10;
    for (let i = increment; i <= this.totalAuditorias; i += increment) {
      this.pageSizeOptions.push(i);
    }

    if (this.pageSizeOptions.length > 0) {
      if (!this.pageSizeOptions.includes(this.itemsPerPage)) {
        const validOption = this.pageSizeOptions
          .filter(option => option <= this.totalAuditorias)
          .reduce((prev, curr) => (Math.abs(curr - this.itemsPerPage) < Math.abs(prev - this.itemsPerPage) ? curr : prev), this.pageSizeOptions[0]);
        this.itemsPerPage = validOption;
        localStorage.setItem('itemsPerPageAudit', this.itemsPerPage.toString());
        console.log(`itemsPerPage cambiado de ${previousItemsPerPage} a ${this.itemsPerPage}`);
      }
    } else {
      this.pageSizeOptions = [10];
      this.itemsPerPage = 10;
      localStorage.setItem('itemsPerPageAudit', this.itemsPerPage.toString());
      console.log(`itemsPerPage establecido a 10 porque no hay auditorías`);
    }
  }

  onItemsPerPageChange(newSize: number): void {
    console.log(`onItemsPerPageChange: Cambiando itemsPerPage a ${newSize}`);
    this.itemsPerPage = newSize;
    localStorage.setItem('itemsPerPageAudit', this.itemsPerPage.toString());
    this.page = 1;
    this.cargarAuditorias();
  }

  isKeywordValid(): boolean {
    if (!this.keyword) return true;
    return SEARCH_NO_NUMBERS_REGEX.test(this.keyword.trim());
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let newValue = input.value;

    if (newValue.startsWith(' ')) {
      input.value = this.lastValidKeyword;
      this.keyword = this.lastValidKeyword;
      this.notificationService.showNotification(
        SEARCH_VALIDATION_MESSAGES.NO_LEADING_SPACE,
        'info'
      );
      this.cdr.detectChanges();
      return;
    }

    newValue = newValue.replace(/\s+/g, ' ');

    if (newValue === '') {
      this.keyword = '';
      this.lastValidKeyword = '';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    if (!SEARCH_NO_NUMBERS_INTERMEDIATE_REGEX.test(newValue)) {
      input.value = this.lastValidKeyword;
      this.keyword = this.lastValidKeyword;
      this.notificationService.showNotification(
        SEARCH_VALIDATION_MESSAGES.NO_NUMBERS_INVALID_FORMAT,
        'info'
      );
      this.cdr.detectChanges();
      return;
    }

    this.keyword = newValue;
    this.lastValidKeyword = newValue.trim();
    input.value = this.keyword;
    this.cdr.detectChanges();
  }

  onSortChange(event: { sortBy: string, sortDir: string }): void {
    this.sortBy = event.sortBy;
    this.sortDir = event.sortDir;
    this.page = 1;
    this.cargarAuditorias();
  }

  cargarConteoAuditorias(): void {
    this.auditService.obtenerConteoAuditorias().subscribe({
      next: (count) => {
        this.totalAuditorias = count;
        this.updatePageSizeOptions();
        this.totalPages = Math.ceil(this.totalAuditorias / this.itemsPerPage);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.totalAuditorias = 0;
        this.pageSizeOptions = [10];
        this.itemsPerPage = 10;
        localStorage.setItem('itemsPerPageAudit', this.itemsPerPage.toString());
        this.notificationService.showNotification('Error al cargar el conteo de auditorías: ' + err.message, 'error');
        console.error('Error al cargar conteo:', err);
      },
    });
  }

  cargarAuditorias(): void {
    this.isLoading = true;

    if (this.keyword.trim()) {
      this.buscarAuditorias();
    } else {
      this.auditService
        .obtenerListaAuditorias(this.page, this.itemsPerPage, this.sortBy, this.sortDir)
        .subscribe({
          next: (response) => {
            this.auditorias = response.content || [];
            this.totalAuditorias = response.totalElements;
            this.totalPages = Math.ceil(this.totalAuditorias / this.itemsPerPage);
            this.updatePageSizeOptions();
            if (this.page > this.totalPages) {
              this.page = 1;
              this.cargarAuditorias();
              return;
            }
            this.cdr.detectChanges();
            this.isLoading = false;
          },
          error: (err) => {
            this.auditorias = [];
            this.totalPages = 1;
            this.notificationService.showNotification('Error al cargar auditorías: ' + err.message, 'error');
            this.cdr.detectChanges();
            this.isLoading = false;
          },
        });
    }
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.page = page;
      this.cargarAuditorias();
    }
  }

  buscarAuditorias(): void {
    if (!this.isKeywordValid()) {
      this.notificationService.showNotification(
        SEARCH_VALIDATION_MESSAGES.NO_NUMBERS_INVALID_FORMAT,
        'info'
      );
      return;
    }

    // Si el keyword está vacío, cargar todos los cursos
    if (!this.keyword.trim()) {
      this.cargarAuditorias();
      return;
    }

    // Activar el spinner
    this.isLoading = true;

    // For simplicity, use keyword as general search; adjust if backend supports specific filters
    const filtros = { palabraClave: this.keyword.trim() };
    this.auditService.buscarAuditorias(filtros.palabraClave, undefined, undefined, undefined, undefined, this.page - 1, this.itemsPerPage, this.sortBy, this.sortDir).subscribe({
      next: (response) => {
        this.auditorias = response.content || [];
        this.totalAuditorias = response.totalElements;
        this.totalPages = Math.ceil(this.totalAuditorias / this.itemsPerPage);
        this.updatePageSizeOptions();
        if (this.page > this.totalPages && this.totalPages > 0) {
          this.page = 1;
          this.buscarAuditorias();
          return;
        }
        // Mostrar notificación si no se encontraron resultados
        if (this.auditorias.length === 0) {
          this.notificationService.showNotification(
            'No se encontraron auditorías con el criterio de búsqueda.',
            'info'
          );
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.auditorias = [];
        this.totalAuditorias = 0;
        this.totalPages = 1;
        this.notificationService.showNotification(
          'Error al buscar auditorías: ' + err.message,
          'error'
        );
        console.error('Error en la búsqueda:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        // Asegurarse de que el spinner se desactive
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
