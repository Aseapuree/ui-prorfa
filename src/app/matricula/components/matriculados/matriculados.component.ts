import { NotificationComponent } from './../../../campus/components/shared/notificaciones/notification.component';
import { NotificationService } from './../../../campus/components/shared/notificaciones/notification.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableComponent, ColumnConfig } from './../../../general/components/table/table.component';
import { MatriculaService } from './../../services/matricula.service';
import { Matricula } from './../../interfaces/DTOMatricula';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faDollarSign, faFileAlt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { GeneralLoadingSpinnerComponent } from './../../../general/components/spinner/spinner.component';
import { Alumno } from './../../interfaces/DTOAlumno';
import { ComprobanteService } from './../../services/comprobante.service';
import { ApoderadoService } from './../../services/apoderado.service';
import { AlumnoService } from './../../services/alumno.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Comprobante } from '../../interfaces/DTOComprobante';
import { Apoderado } from '../../interfaces/DTOApoderado';
import { PaginationComponent } from './../../../general/components/pagination/pagination.component';
import { FormsModule } from '@angular/forms';
import { TooltipComponent } from './../../../general/components/tooltip/tooltip.component';

export interface ActionConfig {
  name: string;
  icon: any;
  tooltip: string;
  action: (item: any) => void;
  hoverColor?: string;
  visible?: (item: any) => boolean;
}

export interface MatriculadoDisplay extends Matricula {
  nombre?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  alumno?: Alumno;
  codigomatricula?: string | null;
  codigopago?: string | null;
  fechaCreacionComprobante?: string | null;
  numeroDocumentoApoderado?: string | null;
  numeroDocumentoAlumno?: string | null;
}

@Component({
  selector: 'app-matriculados',
  standalone: true,
  imports: [
    CommonModule,
    TableComponent,
    FontAwesomeModule,
    GeneralLoadingSpinnerComponent,
    PaginationComponent,
    FormsModule,
    NotificationComponent,
    TooltipComponent
  ],
  templateUrl: './matriculados.component.html',
  styleUrls: ['./matriculados.component.scss']
})
export class MatriculadosComponent implements OnInit {
  loading = false;
  matriculados: MatriculadoDisplay[] = [];
  allMatriculados: MatriculadoDisplay[] = [];
  columns: ColumnConfig[] = [];
  actions: ActionConfig[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  pageSize: number = 10;
  maxPaginationSize: number = 7;

  filters = {
    codigomatricula: '',
    codigopago: '',
    grado: '',
    seccion: '',
    nivel: '',
    fechaCreacionComprobante: ''
  };

  constructor(
    private router: Router,
    private matriculaService: MatriculaService,
    private comprobanteService: ComprobanteService,
    private apoderadoService: ApoderadoService,
    private alumnoService: AlumnoService,
    private library: FaIconLibrary,
    private notificationService: NotificationService
  ) {
    this.library.addIcons(faArrowRight, faDollarSign, faFileAlt, faExclamationTriangle);
  }

  async ngOnInit() {
    this.columns = [
      { field: 'codigomatricula', header: 'CODIGO MATRICULA', maxWidth: 150, sortable: true },
      { field: 'codigopago', header: 'CODIGO PAGO', maxWidth: 150, sortable: true },
      { field: 'grado', header: 'GRADO', maxWidth: 100, sortable: true },
      { field: 'seccion', header: 'SECCION', maxWidth: 100, sortable: true },
      { field: 'nivel', header: 'NIVEL', maxWidth: 100, sortable: true },
      { field: 'numeroDocumentoApoderado', header: 'DOCUMENTO APODERADO', maxWidth: 110, sortable: true },
      { field: 'numeroDocumentoAlumno', header: 'DOCUMENTO ALUMNO', maxWidth: 110, sortable: true },
      { field: 'estadoMatricula', header: 'ESTADO', maxWidth: 150, sortable: true },
      { field: 'fechaCreacionComprobante', header: 'FECHA CREACION', maxWidth: 150, sortable: true, type: 'date' },
    ];

    this.actions = [
      {
        name: 'continue',
        icon: ['fas', 'arrow-right'],
        tooltip: 'CONTINUAR',
        action: (item: MatriculadoDisplay) => this.continueMatricula(item),
        hoverColor: 'green',
        visible: (item: MatriculadoDisplay) => item.estadoMatricula === 'EN PROCESO'
      },
      {
        name: 'print-payment',
        icon: ['fas', 'dollar-sign'],
        tooltip: 'COMPROBANTE DE PAGO',
        action: (item: MatriculadoDisplay) => this.imprimirComprobantePago(item),
        hoverColor: 'blue',
        visible: (item: MatriculadoDisplay) => item.estadoMatricula === 'COMPLETADA'
      },
      {
        name: 'print-enrollment',
        icon: ['fas', 'file-alt'],
        tooltip: 'COMPROBANTE DE MATRICULA',
        action: (item: MatriculadoDisplay) => this.imprimirComprobanteMatricula(item),
        hoverColor: 'purple',
        visible: (item: MatriculadoDisplay) => item.estadoMatricula === 'COMPLETADA'
      }
    ];

    this.loadMatriculas();
  }

  loadMatriculas(): void {
     this.loading = true;
     this.matriculaService.obtenerMatriculas()
       .pipe(
         switchMap(matriculas => {
           if (matriculas.length === 0) {
             return of([]);
           }
           const observables = matriculas.map(matricula => {
             const apoderado$ = matricula.idapoderado ? this.apoderadoService.obtenerApoderado(matricula.idapoderado).pipe(
               catchError(() => of(null))
             ) : of(null);
             const alumno$ = matricula.idalumno ? this.alumnoService.obtenerAlumno(matricula.idalumno).pipe(
               catchError(() => of(null))
             ) : of(null);
             const comprobante$ = matricula.idmatricula ? this.comprobanteService.obtenerComprobantePorIdMatricula(matricula.idmatricula).pipe(
               catchError(() => of(null))
             ) : of(null);

             return forkJoin([of(matricula), apoderado$, alumno$, comprobante$]);
           });
           return forkJoin(observables);
         }),
         map(results => {
           return results.map(([matricula, apoderado, alumno, comprobante]) => ({
             ...matricula,
             nombre: alumno?.nombre || null,
             apellidoPaterno: alumno?.apellidoPaterno || null,
             apellidoMaterno: alumno?.apellidoMaterno || null,
             estadoMatricula: matricula.estadoMatricula || null,
             codigomatricula: comprobante?.codigomatricula || null,
             codigopago: comprobante?.codigopago || null,
             fechaCreacionComprobante: comprobante?.fechaCreacion || null,
             numeroDocumentoApoderado: apoderado?.numeroDocumento || null,
             numeroDocumentoAlumno: alumno?.numeroDocumento || null,
           }));
         })
       )
       .subscribe({
         next: data => {
           this.allMatriculados = data;
           this.applyFiltersAndPagination();
           this.loading = false;
         },
         error: err => {
           this.notificationService.showNotification('Error al cargar matrículas: ' + err.message, 'error');
           this.loading = false;
         }
       });
   }

  applyFiltersAndPagination(): void {
    let filteredMatriculados = this.allMatriculados.filter(matricula => {
      let isMatch = true;

      if (this.filters.codigomatricula && !matricula.codigomatricula?.includes(this.filters.codigomatricula)) {
        isMatch = false;
      }
      if (this.filters.codigopago && !matricula.codigopago?.includes(this.filters.codigopago)) {
        isMatch = false;
      }
      if (this.filters.grado && matricula.grado?.toString() !== this.filters.grado) {
        isMatch = false;
      }
      if (this.filters.seccion && matricula.seccion?.toLowerCase() !== this.filters.seccion.toLowerCase()) {
        isMatch = false;
      }
      if (this.filters.nivel && matricula.nivel?.toLowerCase() !== this.filters.nivel.toLowerCase()) {
        isMatch = false;
      }
      if (this.filters.fechaCreacionComprobante && matricula.fechaCreacionComprobante) {
        const matriculaDate = new Date(matricula.fechaCreacionComprobante).toISOString().split('T')[0];
        if (matriculaDate !== this.filters.fechaCreacionComprobante) {
          isMatch = false;
        }
      } else if (this.filters.fechaCreacionComprobante && !matricula.fechaCreacionComprobante) {
         isMatch = false;
      }

      return isMatch;
    });

    this.totalPages = Math.ceil(filteredMatriculados.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
        this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.matriculados = filteredMatriculados.slice(startIndex, endIndex);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.applyFiltersAndPagination();
  }

  continueMatricula(matricula: MatriculadoDisplay): void {
    if (matricula.estadoMatricula === 'EN PROCESO') {
      this.router.navigate(['/registrar-matricula'], {
        queryParams: { idMatricula: matricula.idmatricula }
      });
    } else {
      this.notificationService.showNotification(`Solo se puede continuar una matrícula que esté en estado "EN PROCESO". Estado actual: ${matricula.estadoMatricula}`, 'info');
    }
  }

  imprimirComprobantePago(matricula: MatriculadoDisplay): void {
    if (matricula.estadoMatricula === 'COMPLETADA' && matricula.idmatricula) {
      this.loading = true;
      this.comprobanteService.generarPdfDirecto(matricula.idmatricula, 'PAGO')
        .subscribe({
          next: blob => {
            const url = window.URL.createObjectURL(blob);
            window.open(url);
            this.loading = false;
          },
          error: err => {
            this.notificationService.showNotification('Error al generar comprobante de pago: ' + err.message, 'error');
            this.loading = false;
          }
        });
    } else if (!matricula.idmatricula) {
      this.notificationService.showNotification('No se pudo obtener el ID de la matrícula para generar el comprobante de pago.', 'error');
    }
  }

  imprimirComprobanteMatricula(matricula: MatriculadoDisplay): void {
    if (matricula.estadoMatricula === 'COMPLETADA' && matricula.idmatricula) {
      this.loading = true;
      this.comprobanteService.generarPdfDirecto(matricula.idmatricula, 'MATRICULA')
        .subscribe({
          next: blob => {
            const url = window.URL.createObjectURL(blob);
            window.open(url);
            this.loading = false;
          },
          error: err => {
             this.notificationService.showNotification('Error al generar comprobante de matrícula: ' + err.message, 'error');
            this.loading = false;
          }
        });
    } else if (!matricula.idmatricula) {
       this.notificationService.showNotification('No se pudo obtener el ID de la matrícula para generar el comprobante de matrícula.', 'error');
    }
  }

  resetFilter(): void {
    this.filters = {
      codigomatricula: '',
      codigopago: '',
      grado: '',
      seccion: '',
      nivel: '',
      fechaCreacionComprobante: ''
    };
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }
}
