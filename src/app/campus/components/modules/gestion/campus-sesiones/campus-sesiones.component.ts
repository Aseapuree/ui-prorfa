import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxPaginationModule } from 'ngx-pagination';
import { CardWeekComponent } from '../../../shared/card-week/card-week.component';
import { SesionService } from '../../../../services/sesion.service';
import { Sesion } from '../../../../interface/sesion';
import { lastValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ModalSesionService } from '../../modals/modal-sesion/modal-sesion.service';
import { ModalSesionComponent } from '../../modals/modal-sesion/modal-sesion.component';
import { DialogoConfirmacionComponent } from '../../modals/dialogo-confirmacion/dialogo-confirmacion.component';
import { NotificationComponent } from '../../../shared/notificaciones/notification.component';
import { NotificationService } from '../../../shared/notificaciones/notification.service';
import { UserData, ValidateService } from '../../../../../core/services/validateAuth.service'
import { AlumnoCursoService } from '../../../../services/alumno-curso.service';
import { ProfesorCursoService } from '../../../../services/profesor-curso.service';
import { BreadcrumbComponent } from '../../../shared/breadcrumb/breadcrumb.component';
import { GeneralLoadingSpinnerComponent } from '../../../../../general/components/spinner/spinner.component';
import { PaginationComponent } from '../../../../../general/components/pagination/pagination.component';

interface BreadcrumbItem {
  label: string;
  url: string;
  isActive?: boolean;
  queryParams?: { [key: string]: any }; // Agregar queryParams como opcional
}
@Component({
  selector: 'app-campus-sesiones',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule, FontAwesomeModule, RouterModule, CardWeekComponent, HttpClientModule, NotificationComponent,PaginationComponent,BreadcrumbComponent,GeneralLoadingSpinnerComponent],
  providers: [SesionService, AlumnoCursoService,ProfesorCursoService],
  templateUrl: './campus-sesiones.component.html',
  styleUrls: ['./campus-sesiones.component.scss']
})
export class CampusSesionesComponent {
  public page: number = 1;
  public itemsPerPage: number = 4; // Fixed as per original template
  public totalPages: number = 1; // Initialize totalPages
  sesiones: Sesion[] = [];
  private sesionesMap: Map<string, Sesion> = new Map(); // FIX: Agregado para quick lookup por idSesion
  idProfesorCurso: string | null = null;
  idCurso: string | null = null;
  rolUsuario: string | null = null;
  cursoNombre: string = 'Curso';
  cursoAbreviatura: string = '';
  grado: string = '';
  seccion: string = '';
  nivel: string = '';
  breadcrumbItems: BreadcrumbItem[] = [];
  isLoading: boolean = false;
  private loadingTasks: number = 0;

  constructor(
    private sesionService: SesionService,
    private alumnoCursoService: AlumnoCursoService,
    private profesorCursoService: ProfesorCursoService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private validateService: ValidateService,
    private notificationService: NotificationService
  ) {}

  private updateLoadingState(): void {
    this.isLoading = this.loadingTasks > 0;
  }

  private startLoadingTask(): void {
    this.loadingTasks++;
    this.updateLoadingState();
  }

  private completeLoadingTask(): void {
    this.loadingTasks--;
    if (this.loadingTasks < 0) this.loadingTasks = 0;
    this.updateLoadingState();
  }

  async ngOnInit(): Promise<void> {
    this.startLoadingTask();
    try {
      const userData: UserData = await lastValueFrom(this.validateService.getUserData());
      this.rolUsuario = userData?.data?.rol || null;
      console.log('Rol del usuario:', this.rolUsuario);

      this.idCurso = localStorage.getItem('idCurso');
      this.grado = localStorage.getItem('grado') || '';
      this.seccion = localStorage.getItem('seccion') || 'Sin sección';
      this.nivel = localStorage.getItem('nivel') || '';
      const usuarioId = localStorage.getItem('usuarioId');
      console.log('Datos de localStorage:', {
        idCurso: this.idCurso,
        grado: this.grado,
        seccion: this.seccion,
        nivel: this.nivel,
        usuarioId,
      });

      this.route.paramMap.subscribe(async (params) => {
        this.idProfesorCurso = params.get('idProfesorCurso');
        this.idCurso = params.get('idCurso');
        console.log('Parámetros de la ruta:', {
          idProfesorCurso: this.idProfesorCurso,
          idCurso: this.idCurso,
        });

        if (this.rolUsuario === 'Profesor' && this.idProfesorCurso) {
          if (!usuarioId) {
            console.error('No se encontró usuarioId en localStorage');
            this.notificationService.showNotification(
              'Error: No se encontró el ID del usuario',
              'error'
            );
            this.router.navigate(['campus']);
            this.completeLoadingTask();
            return;
          }
          this.startLoadingTask();
          try {
            const cursos = await lastValueFrom(
              this.profesorCursoService.obtenerCursosPorProfesor(usuarioId)
            );
            console.log('Cursos del profesor:', cursos);
            const curso = cursos.find((c) => c.idProfesorCurso === this.idProfesorCurso);
            console.log('Curso encontrado:', curso);
            if (curso && curso.curso) {
              this.cursoNombre = curso.curso.nombre || 'Curso';
              this.cursoAbreviatura = curso.curso.abreviatura || '';
            } else {
              console.warn('No se encontró el curso para idProfesorCurso:', this.idProfesorCurso);
              this.notificationService.showNotification(
                'No se pudo obtener el nombre del curso',
                'error'
              );
              this.cursoNombre = 'Curso';
              this.cursoAbreviatura = '';
            }
          } catch (error) {
            console.error('Error al obtener cursos del profesor:', error);
            this.notificationService.showNotification(
              'Error al cargar los datos del curso',
              'error'
            );
            this.cursoNombre = 'Curso';
            this.cursoAbreviatura = '';
          } finally {
            this.completeLoadingTask();
          }
        } else if (this.rolUsuario === 'Alumno' && this.idCurso) {
          this.startLoadingTask();
          try {
            const cursos = await lastValueFrom(
              this.alumnoCursoService.obtenerCursosPorAlumno(localStorage.getItem('idAuth')!)
            );
            console.log('Cursos del alumno:', cursos);
            const curso = cursos.find((c) => c.idCurso === this.idCurso);
            this.cursoNombre = curso?.nombreCurso || 'Curso';
            this.cursoAbreviatura = curso?.abreviatura || '';
          } catch (error) {
            console.error('Error al obtener cursos del alumno:', error);
            this.notificationService.showNotification(
              'Error al cargar los datos del curso',
              'error'
            );
            this.cursoNombre = 'Curso';
            this.cursoAbreviatura = '';
          } finally {
            this.completeLoadingTask();
          }
        } else {
          this.notificationService.showNotification('No se proporcionó un ID válido', 'error');
          this.router.navigate(['campus']);
          this.completeLoadingTask();
          return;
        }

        this.buildBreadcrumb();
        if (this.rolUsuario === 'Profesor' && this.idProfesorCurso) {
          console.log('Cargando sesiones para profesor con ID:', this.idProfesorCurso);
          await this.obtenerSesionesPorProfesor(this.idProfesorCurso);
        } else if (this.rolUsuario === 'Alumno' && this.idCurso) {
          console.log('Cargando sesiones para alumno con idCurso:', this.idCurso);
          await this.obtenerSesionesPorAlumno(this.idCurso);
        }
      });
    } catch (error) {
      console.error('Error al inicializar el componente:', error);
      this.notificationService.showNotification('Error al cargar los datos', 'error');
    } finally {
      this.completeLoadingTask();
    }
  }

  private buildBreadcrumb(): void {
    if (this.rolUsuario === 'Alumno') {
      this.breadcrumbItems = [
        { label: 'Campus', url: '/campus' },
        { label: `sesiones de ${this.cursoAbreviatura || this.cursoNombre}`, url: '', isActive: true },
      ];
    } else {
      this.breadcrumbItems = [
        { label: 'Campus', url: '/campus' },
        {
          label: `${this.grado}`,
          url: `/campus/grados/${this.nivel}`,
          queryParams: { fromBreadcrumb: true },
        },
        { label: `Sesiones de ${this.cursoAbreviatura || this.cursoNombre}`, url: '', isActive: true },
      ];
    }
  }

  async obtenerSesionesPorProfesor(idProfesorCurso: string): Promise<void> {
    this.startLoadingTask();
    try {
      this.sesiones = await lastValueFrom(
        this.sesionService.obtenerSesionesPorCurso(idProfesorCurso)
      );
      if (this.sesiones.length === 0) {
        this.notificationService.showNotification(
          'No hay sesiones disponibles para este curso',
          'info'
        );
      }
      // FIX: Poblar map para recuperar sesión por ID
      this.sesionesMap.clear();
      this.sesiones.forEach(s => this.sesionesMap.set(s.idSesion!, s));
      this.updateTotalPages(); // Update totalPages after fetching sessions
    } catch (error) {
      console.error('Error al obtener sesiones:', error);
      this.notificationService.showNotification('Error al obtener sesiones', 'error');
      this.sesiones = [];
      this.updateTotalPages();
    } finally {
      this.completeLoadingTask();
    }
  }

  async obtenerSesionesPorAlumno(idCurso: string): Promise<void> {
    this.startLoadingTask();
    try {
      const idAuth = localStorage.getItem('idAuth');
      if (!idAuth) {
        throw new Error('No se encontró el ID del usuario autenticado');
      }
      const cursos = await lastValueFrom(
        this.alumnoCursoService.obtenerCursosPorAlumno(idAuth)
      );
      const curso = cursos.find((c) => c.idCurso === idCurso);
      if (curso && curso.sesiones) {
        this.sesiones = curso.sesiones;
        if (this.sesiones.length === 0) {
          this.notificationService.showNotification(
            'No hay sesiones disponibles para este curso',
            'info'
          );
        }
        // FIX: Poblar map para recuperar sesión por ID
        this.sesionesMap.clear();
        this.sesiones.forEach(s => this.sesionesMap.set(s.idSesion!, s));
        this.updateTotalPages(); // Update totalPages after fetching sessions
      } else {
        throw new Error('Curso no encontrado');
      }
    } catch (error) {
      console.error('Error al obtener sesiones para alumno:', error);
      this.notificationService.showNotification('Error al obtener sesiones', 'error');
      this.sesiones = [];
      this.updateTotalPages();
    } finally {
      this.completeLoadingTask();
    }
  }

  openAddModal(): void {
    if (this.rolUsuario !== 'Profesor') return;
    const dialogRef = this.dialog.open(ModalSesionComponent, {
      width: '600px',
      data: {
        isEditing: false,
        idProfesorCurso: this.idProfesorCurso,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.obtenerSesionesPorProfesor(this.idProfesorCurso!);
        this.notificationService.showNotification('Sesión agregada con éxito', 'success');
      }
    });
  }

  openEditModal(sesion: Sesion): void {
    if (this.rolUsuario !== 'Profesor') return;
    const dialogRef = this.dialog.open(ModalSesionComponent, {
      width: '600px',
      data: {
        isEditing: true,
        sesion: sesion,
        idProfesorCurso: this.idProfesorCurso,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.obtenerSesionesPorProfesor(this.idProfesorCurso!);
        this.notificationService.showNotification('Sesión editada con éxito', 'success');
      }
    });
  }

  eliminarSesion(idSesion: string): void {
    if (this.rolUsuario !== 'Profesor') return;
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '1px',
      height: '1px',
      data: { message: '¿Estás seguro de que quieres eliminar esta sesión?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.sesionService.eliminarSesion(idSesion).subscribe({
          next: () => {
            this.obtenerSesionesPorProfesor(this.idProfesorCurso!);
            this.notificationService.showNotification('Sesión eliminada con éxito', 'success');
          },
          error: (err) => {
            this.notificationService.showNotification('Error al eliminar sesión', 'error');
            console.error('Error al eliminar una sesión:', err);
          },
        });
      }
    });
  }

    irAActividades(idSesion: string): void {
    if (this.rolUsuario === 'Profesor' && this.idProfesorCurso) {
      localStorage.setItem('idProfesorCurso', this.idProfesorCurso);
    }
    // Recupera sesión del map
    const sesion = this.sesionesMap.get(idSesion);
    if (!sesion) {
      console.error('Sesión no encontrada para id:', idSesion);
      return;
    }

    // FIX: Guarda fecha en localStorage con key única por sesión
    localStorage.setItem(`fechaSesion_${idSesion}`, sesion.fechaAsignada || '');

    this.router.navigate(['/card-actividades', idSesion], {
      state: {
        idProfesorCurso: this.idProfesorCurso || null,
        idCurso: this.idCurso || null,
        fechaAsignada: sesion.fechaAsignada  // State como primary, LS como backup
      },
    });
  }

  // Calculate total pages based on sesiones and itemsPerPage
  updateTotalPages(): void {
    this.totalPages = Math.ceil(this.sesiones.length / this.itemsPerPage);
    if (this.page > this.totalPages && this.totalPages > 0) {
      this.page = 1;
    }
    console.log(
      `Total páginas actualizadas: ${this.totalPages}, página actual: ${this.page}`
    );
  }

  // Handle page change events from app-pagination
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      console.log(`Cambiando a página: ${page}`);
      this.page = page;
    }
  }
}