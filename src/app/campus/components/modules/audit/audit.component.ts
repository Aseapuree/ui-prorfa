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
import {
  DATE_REGEX,
  DATE_VALIDATION_MESSAGES,
  SEARCH_INTERMEDIATE_REGEX,
  SEARCH_REGEX,
  SEARCH_VALIDATION_MESSAGES,
} from '../../../../general/components/const/const';
import { HttpClientModule } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { NgxPaginationModule } from 'ngx-pagination';
import { NotificationComponent } from '../../shared/notificaciones/notification.component';
import { RolesService } from '../../../services/roles.service';
import { Role } from '../../../interface/role';
import { AuditmodalComponent } from '../modals/auditmodal/auditmodal.component';
import { PreviewContentComponent } from '../modals/preview-content/preview-content.component';

interface AuditFilters {
  userName: string;
  rolName: string;
  ipAddress: string;
  bandeja: string;
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
    TableComponent,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    AuditmodalComponent,
    PreviewContentComponent,
  ],
  providers: [AuditService, UsuarioService, RolesService],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.scss',
})
export class AuditComponent implements OnInit {
  public page: number = 1;
  public itemsPerPage: number = 5;
  totalPages: number = 1;

  // Datos originales desde el backend
  auditorias: AuditProrfa[] = [];

  // Datos ya ordenados
  auditoriasOrdenadas: AuditProrfa[] = [];

  totalAuditorias: number = 0;

  // Estado del ordenamiento actual
  sortBy: string = 'fechaCreacion';
  sortDir: string = 'desc';

  isLoading: boolean = false;
  loadingMessage: string = 'Cargando...';
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
    fechaInicio: '',
    fechaFin: '',
  };

  // Autocomplete Usuario
  searchUserTerm: string = '';
  showUserDropdown: boolean = false;
  userSearchResults: Usuario[] = [];
  selectedUserId: string | null = null;
  private isSearchingUser: boolean = false;

  modal = {
  open: false,
  type: 'preview' as 'preview',
  title: '',
  data: null as any,
  size: 'max-w-2xl',
};

onPreviewClick(event: { item: AuditProrfa; field: string }): void {
  const item = event.item;
  const field = event.field;

  let title = '';
  let data: any = null;
  let size = 'max-w-2xl';

  if (field === 'userAgent') {
    title = 'User Agent completo';
    data = {
      field: 'text',
      content: item.userAgent || 'No disponible',
    };
  }

  if (field === 'payload') {
    title = 'Payload completo (JSON)';
    data = {
      field: 'json',
      content: item.payload ? JSON.stringify(item.payload, null, 2) : 'Sin datos',
    };
    size = 'max-w-4xl';
  }

  this.modal = {
    open: true,
    type: 'preview',
    title,
    data,
    size,
  };
}

closeModal() {
  this.modal = {
    open: false,
    type: 'preview',
    title: '',
    data: null,
    size: 'max-w-2xl',
  };
}

  // Roles cargados (sin autocomplete)
  roles: Role[] = [];

  tableColumns: ColumnConfig[] = [
    {
      field: 'userName',
      header: 'USUARIO',
      maxWidth: 150,
      sortable: true,
      type: 'text',
    },
    {
      field: 'rolName',
      header: 'ROL',
      maxWidth: 100,
      sortable: true,
      type: 'text',
    },
    {
      field: 'ipAddress',
      header: 'IP',
      maxWidth: 120,
      sortable: true,
      type: 'text',
    },
    {
      field: 'bandeja',
      header: 'BANDEJA',
      maxWidth: 120,
      sortable: true,
      type: 'text',
    },
    {
      field: 'accion',
      header: 'ACCIÓN',
      maxWidth: 120,
      sortable: true,
      type: 'text',
    },
    {
      field: 'userAgent',
      header: 'AGENTE',
      maxWidth: 150,
      sortable: true,
      type: 'text',
      preview: true,
      transform: (value: string) =>
        value
          ? value.length > 50
            ? value.substring(0, 50) + '...'
            : value
          : '',
    },
    {
      field: 'fechaCreacion',
      header: 'FECHA',
      maxWidth: 120,
      sortable: true,
      type: 'date',
    },
    {
      field: 'payload',
      header: 'DATOS (PAYLOAD)',
      maxWidth: 200,
      sortable: false,
      type: 'text',
      preview: true,
      transform: (value: any) =>
        value ? JSON.stringify(value, null, 2).substring(0, 50) + '...' : '',
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
    const isValid =
      !isNaN(date.getTime()) &&
      year >= 1900 &&
      year <= this.currentYear &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= new Date(year, month, 0).getDate();
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
      this.notificationService.showNotification(
        DATE_VALIDATION_MESSAGES.INVALID_FORMAT,
        'error'
      );
      this.filters[field] = '';
      this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] =
        false;
      this.cdr.detectChanges();
      return;
    }

    const year = parseInt(value.split('-')[0], 10);
    if (year > this.currentYear) {
      this.notificationService.showNotification(
        DATE_VALIDATION_MESSAGES.INVALID_YEAR(this.currentYear),
        'error'
      );
      this.filters[field] = '';
      this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] =
        false;
      this.cdr.detectChanges();
      return;
    }

    if (field === 'fechaFin' && this.filters.fechaInicio && value) {
      const startDate = new Date(this.filters.fechaInicio);
      const endDate = new Date(value);
      if (endDate < startDate) {
        this.notificationService.showNotification(
          DATE_VALIDATION_MESSAGES.END_BEFORE_START,
          'error'
        );
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
        this.notificationService.showNotification(
          DATE_VALIDATION_MESSAGES.END_BEFORE_START,
          'error'
        );
        this.filters.fechaFin = '';
        this.isValidFechaFin = false;
        this.cdr.detectChanges();
        return;
      }
    }

    this.filters[field] = value;
    this[field === 'fechaInicio' ? 'isValidFechaInicio' : 'isValidFechaFin'] =
      true;
    this.cdr.detectChanges();
  }

  isFormValid(): boolean {
    const isAnyFilterApplied =
      !!this.filters.userName.trim() ||
      !!this.filters.rolName.trim() ||
      !!this.filters.ipAddress.trim() ||
      !!this.filters.bandeja.trim() ||
      !!this.filters.fechaInicio ||
      !!this.filters.fechaFin;

    const isValidDates = this.isValidFechaInicio && this.isValidFechaFin;

    const textFields = ['userName', 'rolName', 'bandeja'];
    const isValidTextInputs = textFields.every((field) => {
      const value = this.filters[field];
      return !value || this.isKeywordValid(value as string);
    });

    const isValidIp = !this.filters.ipAddress || this.isIpValid(this.filters.ipAddress);

    const isValidInputs = isValidDates && isValidTextInputs && isValidIp;

    return isAnyFilterApplied && isValidInputs;
  }

  isKeywordValid(value: string): boolean {
    if (!value) return true;
    return SEARCH_REGEX.test(value.trim());
  }

  private isIpValid(value: string): boolean {
    if (!value) return true;
    const ipRegex = /^(\d{1,3}\.){0,3}\d{0,3}(\.)?$/;
    const noConsecutiveDots = !/\.\./.test(value);
    const noLeadingDot = !value.startsWith('.');
    return ipRegex.test(value) && noConsecutiveDots && noLeadingDot;
  }

  private lastValidValues: { [key: string]: string } = {};

  onInputChange(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
    let newValue = input.value;

    if (newValue.startsWith(' ')) {
      input.value = this.lastValidValues[field] || '';
      this.filters[field] = this.lastValidValues[field] || '';
      this.notificationService.showNotification(
        SEARCH_VALIDATION_MESSAGES.NO_LEADING_SPACE,
        'info'
      );
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
      this.notificationService.showNotification(
        SEARCH_VALIDATION_MESSAGES.INVALID_FORMAT,
        'info'
      );
      this.cdr.detectChanges();
      return;
    }

    this.filters[field] = newValue;
    this.lastValidValues[field] = newValue.trim();
    input.value = newValue;
    this.cdr.detectChanges();
  }

  onIpInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let newValue = input.value;

    newValue = newValue.replace(/[^0-9.]/g, '');
    newValue = newValue.replace(/\.{2,}/g, '.');
    if (newValue.startsWith('.')) {
      newValue = newValue.substring(1);
    }

    const sections = newValue.split('.');
    if (sections.length > 4) {
      newValue = sections.slice(0, 4).join('.');
      this.notificationService.showNotification(
        'Máximo 4 secciones en IP (x.x.x.x)',
        'info'
      );
    }

    input.value = newValue;
    this.filters.ipAddress = newValue;
    this.cdr.detectChanges();
  }

  performUserSearch(): void {
    const term = this.searchUserTerm.trim();
    if (term.length < 2) {
      this.userSearchResults = [];
      this.showUserDropdown = false;
      this.notificationService.showNotification(
        'Ingresa al menos 2 caracteres para buscar usuarios.',
        'info'
      );
      return;
    }

    this.isSearchingUser = true;
    this.showUserDropdown = true;
    this.usuarioService.buscarUsuariosPorNombre(term).subscribe({
      next: (results) => {
        this.userSearchResults = results;
        if (this.userSearchResults.length === 0) {
          this.showUserDropdown = false;
        }
        this.isSearchingUser = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error en búsqueda de usuarios:', err);
        this.userSearchResults = [];
        this.showUserDropdown = false;
        this.isSearchingUser = false;
        this.notificationService.showNotification(
          'Error al buscar usuarios.',
          'error'
        );
        this.cdr.detectChanges();
      },
    });
  }

  selectUser(user: Usuario): void {
    this.selectedUserId = user.idusuario || null;
    this.filters.userName = `${user.nombre || ''} ${
      user.apellidopaterno || ''
    } ${user.apellidomaterno || ''}`.trim();
    this.searchUserTerm = this.filters.userName;
    this.showUserDropdown = false;
    this.userSearchResults = [];
    this.cdr.detectChanges();
  }

  onUserBlur(): void {
    setTimeout(() => {
      if (!this.isSearchingUser) {
        this.showUserDropdown = false;
      }
    }, 200);
  }

  loadRoles(): void {
    this.rolesService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
        this.notificationService.showNotification(
          'Error al cargar roles para el filtro',
          'error'
        );
      },
    });
  }

  

  onItemsPerPageChange(newSize: number): void {
  const validatedSize = Math.min(newSize, 30);
  this.itemsPerPage = newSize;
  localStorage.setItem('itemsPerPageAudit', newSize.toString());
  this.page = 1;
  this.cargarAuditorias();
}

  onSortChange(event: { sortBy: string; sortDir: string }): void {
    this.sortBy = event.sortBy;
    this.sortDir = event.sortDir;
    this.actualizarOrdenamientoLocal(); // Solo ordena localmente
  }

  cargarConteoAuditorias(): void {
    this.auditService.obtenerConteoAuditorias().subscribe({
      next: (count) => {
        this.totalAuditorias = count;
        this.totalPages = Math.ceil(this.totalAuditorias / this.itemsPerPage);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.totalAuditorias = 0;
        this.itemsPerPage = 5;
        localStorage.setItem('itemsPerPageAudit', this.itemsPerPage.toString());
        this.notificationService.showNotification(
          'Error al cargar el conteo de auditorías: ' + err.message,
          'error'
        );
        console.error('Error al cargar conteo:', err);
      },
    });
  }

  private actualizarOrdenamientoLocal(): void {
    if (!this.auditorias || this.auditorias.length === 0) {
      this.auditoriasOrdenadas = [];
      return;
    }

    const sorted = [...this.auditorias].sort((a, b) => {
      let valA = this.getNestedValue(a, this.sortBy);
      let valB = this.getNestedValue(b, this.sortBy);

      if (valA == null) valA = '';
      if (valB == null) valB = '';

      if (this.sortBy === 'fechaCreacion') {
        valA = new Date(valA as string).getTime();
        valB = new Date(valB as string).getTime();
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return this.sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    this.auditoriasOrdenadas = sorted;
    this.cdr.detectChanges();
  }

  

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => (o ? o[p] : null), obj);
  }

  cargarAuditorias(): void {
    this.isLoading = true;
    this.loadingMessage = 'Cargando auditorías...';

    const request = this.appliedFilters
      ? this.auditService.buscarAuditorias(this.appliedFilters, this.page, this.itemsPerPage)
      : this.auditService.obtenerListaAuditorias(this.page, this.itemsPerPage);

    request.subscribe({
      next: (response: any) => {
        this.auditorias = this.transformarDatos(response.content || []);
        this.actualizarOrdenamientoLocal(); // Aplica el orden actual
        this.totalAuditorias = response.totalElements;
        this.totalPages = Math.ceil(this.totalAuditorias / this.itemsPerPage);

        if (this.page > this.totalPages && this.totalPages > 0) {
          this.page = 1;
          this.cargarAuditorias();
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.auditorias = [];
        this.auditoriasOrdenadas = [];
        this.totalAuditorias = 0;
        this.isLoading = false;
        this.notificationService.showNotification('Error al cargar auditorías', 'error');
        this.cdr.detectChanges();
      },
    });
  }

  private transformarDatos(auditorias: AuditProrfa[]): any[] {
    return auditorias.map((audit) => ({
      ...audit,
      payloadStr: audit.payload ? JSON.stringify(audit.payload, null, 2) : '',
    }));
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      console.log(`onPageChange: Cambiando a página ${page}`);
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
        fechaInicio: '',
        fechaFin: '',
      };
      this.appliedFilters = null;
      this.searchUserTerm = '';
      this.selectedUserId = null;
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
      this.notificationService.showNotification(
        'Por favor, corrige los filtros inválidos antes de buscar.',
        'error'
      );
      return;
    }

    console.log('Iniciando buscarAuditorias con filtros:', this.filters);

    // Activar el spinner
    this.loadingMessage = 'Buscando auditorías...';
    this.isLoading = true;

    // Preparar los filtros para enviar al backend
    const filters: {
      userName?: string;
      rolName?: string;
      ipAddress?: string;
      bandeja?: string;
      fechaInicio?: string;
      fechaFin?: string;
      userId?: string;
    } = {
      userName: this.filters.userName
        ? this.filters.userName.trim()
        : undefined,
      rolName: this.filters.rolName ? this.filters.rolName.toLowerCase() : undefined,
      ipAddress: this.filters.ipAddress ? this.filters.ipAddress.trim() : undefined,
      bandeja: this.filters.bandeja ? this.filters.bandeja.toLowerCase() : undefined,
      fechaInicio: this.filters.fechaInicio || undefined,
      fechaFin: this.filters.fechaFin || undefined,
      userId: this.selectedUserId || undefined,
    };

    console.log('Filtros aplicados:', filters);
    this.appliedFilters = filters;

    // Realizar la solicitud al backend
    this.auditService
      .buscarAuditorias(
        filters,
        this.page,
        this.itemsPerPage
      )
      .subscribe({
        next: (resultado) => {
          console.log('Resultados recibidos:', resultado);
          this.auditorias = this.transformarDatos(resultado.content || []);
          this.totalAuditorias = resultado.totalElements;
          this.totalPages = Math.ceil(
            this.totalAuditorias / this.itemsPerPage
          );

          if (this.totalAuditorias === 0) {
            this.notificationService.showNotification(
              'No se encontraron auditorías con los filtros aplicados.',
              'info'
            );
          }

          
          if (this.page > this.totalPages && this.totalPages > 0) {
            this.page = 1;
            this.buscarAuditorias();
            return;
          }

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error en la búsqueda:', err);
          this.notificationService.showNotification(
            'Error al buscar auditorías. Verifique los filtros o contacte al administrador.',
            'error'
          );
          this.auditorias = [];
          this.totalAuditorias = 0;
          this.totalPages = 1;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        complete: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  descargarExcel(): void {
    this.loadingMessage = 'Exportando datos...';
    this.isLoading = true;
    console.log('Descargando Excel con filtros:', this.appliedFilters);

    this.auditService.descargarExcel(this.appliedFilters).subscribe({
      next: () => {
        this.notificationService.showNotification(
          'Archivo Excel descargado con éxito',
          'success'
        );
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.showNotification(
          'Error al descargar el archivo Excel: ' + err.message,
          'error'
        );
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
