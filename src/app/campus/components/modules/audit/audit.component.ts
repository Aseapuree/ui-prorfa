import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuditService } from '../../../services/audit.service';
import { NotificationService } from '../../shared/notificaciones/notification.service';
import { PaginationComponent } from '../../../../general/components/pagination/pagination.component';
import { GeneralLoadingSpinnerComponent } from '../../../../general/components/spinner/spinner.component';
import { TooltipComponent } from '../../../../general/components/tooltip/tooltip.component';
import { UsuarioService } from '../../../services/usuario.service';
import { Usuario } from '../../../interface/usuario';
import {
  ColumnConfig,
  TableComponent,
} from '../../../../general/components/table/table.component';
import { AuditProrfa } from '../../../interface/audit';
import { DTOResponse } from '../../../interface/DTOResponse';
import { DATE_REGEX, DATE_VALIDATION_MESSAGES, SEARCH_INTERMEDIATE_REGEX, SEARCH_REGEX, SEARCH_VALIDATION_MESSAGES } from '../../../../general/components/const/const';
import { HttpClientModule } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { NgxPaginationModule } from 'ngx-pagination';
import { NotificationComponent } from '../../shared/notificaciones/notification.component';
import { RolesService } from '../../../services/roles.service';
import { Role } from '../../../interface/role';

interface AuditFilters {
  userName: string;
  rolName: string;
  ipAddress: string;
  bandeja: string;
  userAgent: string;
  fechaInicio: string;
  fechaFin: string;
  [key: string]: string | undefined;
}

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    RouterModule,
    HttpClientModule,
    CommonModule,
    NgxPaginationModule,
    FontAwesomeModule,
    FormsModule,
    NotificationComponent,
    PaginationComponent,
    GeneralLoadingSpinnerComponent,
    TooltipComponent,
    TableComponent,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
  ],
  providers: [AuditService, UsuarioService, RolesService],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.scss'
})
export class AuditComponent implements OnInit {
  public page: number = 1;
  public itemsPerPage: number = 6;
  public pageSizeOptions: number[] = [];
  totalPages: number = 1;
  auditorias: any[] = [];
  totalAuditorias: number = 0;
  sortBy: string = 'fechaCreacion';
  sortDir: string = 'asc';
  isLoading: boolean = false;
  appliedFilters: any = null;
  isValidFechaInicio: boolean = true;
  isValidFechaFin: boolean = true;
  currentYear: number = new Date().getFullYear();
  maxDate!: string;

  // Filtros
  filters: AuditFilters = {
    userName: '',
    rolName: '',
    ipAddress: '',
    bandeja: '',
    userAgent: '',
    fechaInicio: '',
    fechaFin: '',
  };

  // Autocomplete Usuario
  searchUserTerm: string = '';
  showUserDropdown: boolean = false;
  userSearchResults: Usuario[] = [];
  selectedUserId: string | null = null;

  // Roles cargados (sin autocomplete)
  roles: Role[] = [];

  tableColumns: ColumnConfig[] = [
    { field: 'userName', header: 'USUARIO', maxWidth: 150, sortable: true, type: 'text' },
    { field: 'rolName', header: 'ROL', maxWidth: 100, sortable: true, type: 'text' },
    { field: 'ipAddress', header: 'IP', maxWidth: 120, sortable: true, type: 'text' },
    { field: 'bandeja', header: 'BANDEJA', maxWidth: 120, sortable: true, type: 'text' },
    { field: 'accion', header: 'ACCIÓN', maxWidth: 120, sortable: true, type: 'text' },
    { field: 'userAgent', header: 'AGENTE', maxWidth: 150, sortable: true, type: 'text' },
    { field: 'fechaCreacion', header: 'FECHA', maxWidth: 120, sortable: true, type: 'date' },
    { 
      field: 'payload', 
      header: 'DATOS (PAYLOAD)', 
      maxWidth: 200, 
      sortable: false, 
      type: 'text',
      transform: (value: any) => value ? JSON.stringify(value, null, 2).substring(0, 50) + '...' : ''
    },
  ];

  constructor(
    private auditService: AuditService,
    private rolesService: RolesService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {
    this.updateMaxDate();
  }

  ngOnInit(): void {
    const savedItemsPerPage = localStorage.getItem('itemsPerPageAudit');
    if (savedItemsPerPage) {
      this.itemsPerPage = parseInt(savedItemsPerPage, 10);
    }
    this.cargarConteoAuditorias();
    this.cargarAuditorias();
    this.loadRoles();
    this.updateMaxDate();
  }

  private updateMaxDate(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.maxDate = today.toISOString().split('T')[0];
    this.currentYear = today.getFullYear();
  }

  private isValidDateFormat(dateStr: string): boolean {
    if (!dateStr || dateStr.length !== 10) return false;
    const date = new Date(dateStr);
    const [year, month, day] = dateStr.split('-').map(Number);
    const isValid = !isNaN(date.getTime()) && year >= 1900 && year <= this.currentYear && month >= 1 && month <= 12 && day >= 1 && day <= new Date(year, month, 0).getDate();
    return isValid;
  }

  onDateChange(value: string, field: 'fechaInicio' | 'fechaFin'): void {
    if (!value) {
      this.filters[field] = '';
      if (field === 'fechaInicio') {
        this.isValidFechaInicio = true;
        this.filters.fechaFin = '';
        this.isValidFechaFin = true;
      } else {
        this.isValidFechaFin = true;
      }
      this.cdr.detectChanges();
      return;
    }

    if (!this.isValidDateFormat(value)) {
      this.notificationService.showNotification(DATE_VALIDATION_MESSAGES.INVALID_FORMAT, 'error');
      this.filters[field] = '';
      this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] = false;
      this.cdr.detectChanges();
      return;
    }

    const year = parseInt(value.split('-')[0], 10);
    if (year > this.currentYear) {
      this.notificationService.showNotification(DATE_VALIDATION_MESSAGES.INVALID_YEAR(this.currentYear), 'error');
      this.filters[field] = '';
      this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] = false;
      this.cdr.detectChanges();
      return;
    }

    if (field === 'fechaFin' && this.filters.fechaInicio && value) {
      const startDate = new Date(this.filters.fechaInicio);
      const endDate = new Date(value);
      if (endDate < startDate) {
        this.notificationService.showNotification(DATE_VALIDATION_MESSAGES.END_BEFORE_START, 'error');
        this.filters.fechaFin = '';
        this.isValidFechaFin = false;
        this.cdr.detectChanges();
        return;
      }
    }

    if (field === 'fechaInicio' && this.filters.fechaFin) {
      const startDate = new Date(value);
      const endDate = new Date(this.filters.fechaFin);
      if (endDate < startDate) {
        this.notificationService.showNotification(DATE_VALIDATION_MESSAGES.END_BEFORE_START, 'error');
        this.filters.fechaFin = '';
        this.isValidFechaFin = false;
        this.cdr.detectChanges();
        return;
      }
    }

    this.filters[field] = value;
    this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] = true;
    this.cdr.detectChanges();
  }

  isFormValid(): boolean {
    const isAnyFilterApplied =
      !!this.filters.userName.trim() ||
      !!this.filters.rolName.trim() ||
      !!this.filters.ipAddress.trim() ||
      !!this.filters.bandeja.trim() ||
      !!this.filters.userAgent.trim() ||
      !!this.filters.fechaInicio ||
      !!this.filters.fechaFin;

    const isValidInputs =
      this.isValidFechaInicio &&
      this.isValidFechaFin &&
      Object.values(this.filters).every(field => !field || this.isKeywordValid(field as string));

    return isAnyFilterApplied && isValidInputs;
  }

  isKeywordValid(value: string): boolean {
    if (!value) return true;
    return SEARCH_REGEX.test(value.trim());
  }

  private lastValidValues: { [key: string]: string } = {};

  onInputChange(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
    let newValue = input.value;

    if (newValue.startsWith(' ')) {
      input.value = this.lastValidValues[field] || '';
      this.filters[field] = this.lastValidValues[field] || '';
      this.notificationService.showNotification(SEARCH_VALIDATION_MESSAGES.NO_LEADING_SPACE, 'info');
      this.cdr.detectChanges();
      return;
    }

    newValue = newValue.replace(/\s+/g, ' ');

    if (newValue === '') {
      this.filters[field] = '';
      this.lastValidValues[field] = '';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    if (!SEARCH_INTERMEDIATE_REGEX.test(newValue)) {
      input.value = this.lastValidValues[field] || '';
      this.filters[field] = this.lastValidValues[field] || '';
      this.notificationService.showNotification(SEARCH_VALIDATION_MESSAGES.INVALID_FORMAT, 'info');
      this.cdr.detectChanges();
      return;
    }

    this.filters[field] = newValue;
    this.lastValidValues[field] = newValue.trim();
    input.value = newValue;
    this.cdr.detectChanges();
  }

  performUserSearch(): void {
    const term = this.searchUserTerm.trim();
    if (term.length < 2) {
      this.userSearchResults = [];
      this.showUserDropdown = false;
      this.notificationService.showNotification('Ingresa al menos 2 caracteres para buscar usuarios.', 'info');
      return;
    }

    this.showUserDropdown = true;
    this.usuarioService.buscarUsuariosPorNombre(term).subscribe({
      next: (results) => {
        this.userSearchResults = results;
        if (this.userSearchResults.length === 0) {
          this.showUserDropdown = false;
          this.notificationService.showNotification('No se encontraron usuarios con ese término.', 'info');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error en búsqueda de usuarios:', err);
        this.userSearchResults = [];
        this.showUserDropdown = false;
        this.notificationService.showNotification('Error al buscar usuarios.', 'error');
      }
    });
  }

  selectUser(user: Usuario): void {
    this.selectedUserId = user.idusuario || null;
    this.filters.userName = `${user.nombre || ''} ${user.apellidopaterno || ''} ${user.apellidomaterno || ''}`.trim();
    this.searchUserTerm = this.filters.userName;
    this.showUserDropdown = false;
    this.userSearchResults = [];
    this.cdr.detectChanges();
  }

  onUserBlur(): void {
    setTimeout(() => {
      this.showUserDropdown = false;
    }, 200);
  }

  loadRoles(): void {
    this.rolesService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
        this.notificationService.showNotification('Error al cargar roles para el filtro', 'error');
      }
    });
  }

  private updatePageSizeOptions(): void {
    const previousItemsPerPage = this.itemsPerPage;
    this.pageSizeOptions = [];
    const increment = 5;
    for (let i = increment; i <= this.totalAuditorias; i += increment) {
      this.pageSizeOptions.push(i);
    }
    if (this.pageSizeOptions.length > 0) {
      if (!this.pageSizeOptions.includes(this.itemsPerPage)) {
        const validOption = this.pageSizeOptions.reduce((prev, curr) => Math.abs(curr - this.itemsPerPage) < Math.abs(prev - this.itemsPerPage) ? curr : prev, this.pageSizeOptions[0]);
        this.itemsPerPage = validOption;
      }
    } else {
      this.pageSizeOptions = [5];
      this.itemsPerPage = 5;
    }
    localStorage.setItem('itemsPerPageAudit', this.itemsPerPage.toString());
  }

  onItemsPerPageChange(newSize: number): void {
    this.itemsPerPage = newSize;
    localStorage.setItem('itemsPerPageAudit', this.itemsPerPage.toString());
    this.page = 1;
    this.cargarAuditorias();
  }

  onSortChange(event: { sortBy: string; sortDir: string }): void {
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
        this.pageSizeOptions = [5];
        this.itemsPerPage = 5;
        localStorage.setItem('itemsPerPageAudit', this.itemsPerPage.toString());
        this.notificationService.showNotification('Error al cargar el conteo de auditorías: ' + err.message, 'error');
      },
    });
  }

  cargarAuditorias(): void {
    this.isLoading = true;
    if (this.appliedFilters) {
      this.auditService.buscarAuditorias(this.appliedFilters, this.page, this.itemsPerPage, this.sortBy, this.sortDir).subscribe({
        next: (response) => {
          this.auditorias = this.transformarDatos(response.content || []);
          this.totalAuditorias = response.totalElements;
          this.totalPages = Math.ceil(this.totalAuditorias / this.itemsPerPage);
          this.updatePageSizeOptions();
          if (this.page > this.totalPages) {
            this.page = 1;
            this.cargarAuditorias();
            return;
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.auditorias = [];
          this.totalPages = 1;
          this.notificationService.showNotification('Error al cargar auditorías: ' + err.message, 'error');
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      this.auditService.obtenerListaAuditorias(this.page, this.itemsPerPage, this.sortBy, this.sortDir).subscribe({
        next: (response) => {
          this.auditorias = this.transformarDatos(response.content || []);
          this.totalAuditorias = response.totalElements;
          this.totalPages = Math.ceil(this.totalAuditorias / this.itemsPerPage);
          this.updatePageSizeOptions();
          if (this.page > this.totalPages) {
            this.page = 1;
            this.cargarAuditorias();
            return;
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.auditorias = [];
          this.totalPages = 1;
          this.notificationService.showNotification('Error al cargar auditorías: ' + err.message, 'error');
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  private transformarDatos(auditorias: AuditProrfa[]): any[] {
    return auditorias.map((audit) => ({
      ...audit,
      payloadStr: audit.payload ? JSON.stringify(audit.payload, null, 2) : '',
    }));
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.page = page;
      this.cargarAuditorias();
    }
  }

  resetFilter(filter: string): void {
    if (filter === 'all') {
      this.filters = {
        userName: '',
        rolName: '',
        ipAddress: '',
        bandeja: '',
        userAgent: '',
        fechaInicio: '',
        fechaFin: '',
      };
      this.searchUserTerm = '';
      this.selectedUserId = null;
      this.appliedFilters = null;
      this.page = 1;
      this.isValidFechaInicio = true;
      this.isValidFechaFin = true;
      this.userSearchResults = [];
      this.showUserDropdown = false;
      this.cargarAuditorias();
    } else {
      this.filters[filter] = '';
    }
    this.cdr.detectChanges();
  }

  buscarAuditorias(): void {
    if (!this.isFormValid()) {
      this.notificationService.showNotification('Por favor, corrige los filtros inválidos antes de buscar.', 'error');
      return;
    }

    this.isLoading = true;

    const filtersToSend: any = {
      userName: this.filters.userName ? this.filters.userName.trim() : undefined,
      rolName: this.filters.rolName ? this.filters.rolName.trim().toLowerCase() : undefined,
      ipAddress: this.filters.ipAddress ? this.filters.ipAddress.trim() : undefined,
      bandeja: this.filters.bandeja ? this.filters.bandeja.trim().toLowerCase() : undefined,
      userAgent: this.filters.userAgent ? this.filters.userAgent.trim() : undefined,
      fechaInicio: this.filters.fechaInicio || undefined,
      fechaFin: this.filters.fechaFin || undefined,
      userId: this.selectedUserId || undefined,
    };

    this.appliedFilters = filtersToSend;

    this.auditService.buscarAuditorias(filtersToSend, this.page, this.itemsPerPage, this.sortBy, this.sortDir).subscribe({
      next: (resultado) => {
        this.auditorias = this.transformarDatos(resultado.content || []);
        this.totalAuditorias = resultado.totalElements;
        this.totalPages = Math.ceil(this.totalAuditorias / this.itemsPerPage);
        if (this.totalAuditorias === 0) {
          this.notificationService.showNotification('No se encontraron auditorías con los filtros aplicados.', 'info');
        }
        this.updatePageSizeOptions();
        if (this.page > this.totalPages && this.totalPages > 0) {
          this.page = 1;
          this.buscarAuditorias();
          return;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.showNotification('Error al buscar auditorías: ' + err.message, 'error');
        this.auditorias = [];
        this.totalAuditorias = 0;
        this.totalPages = 1;
        this.updatePageSizeOptions();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  descargarExcel(): void {
    this.isLoading = true;
    this.auditService.descargarExcel(this.appliedFilters).subscribe({
      next: () => {
        this.notificationService.showNotification('Archivo Excel descargado con éxito', 'success');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.showNotification('Error al descargar el archivo Excel: ' + err.message, 'error');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
