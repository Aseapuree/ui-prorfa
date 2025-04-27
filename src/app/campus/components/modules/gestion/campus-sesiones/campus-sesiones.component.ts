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
import { UserData, ValidateService } from '../../../../../services/validateAuth.service';
import { AlumnoCursoService } from '../../../../services/alumno-curso.service';
import { ProfesorCursoService } from '../../../../services/profesor-curso.service';

@Component({
  selector: 'app-campus-sesiones',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule, FontAwesomeModule, RouterModule, CardWeekComponent, HttpClientModule, NotificationComponent],
  providers: [SesionService, AlumnoCursoService,ProfesorCursoService],
  templateUrl: './campus-sesiones.component.html',
  styleUrls: ['./campus-sesiones.component.scss']
})
export class CampusSesionesComponent {
  public page: number = 1;
  sesiones: Sesion[] = [];
  idProfesorCurso: string | null = null;
  idCurso: string | null = null;
  rolUsuario: string | null = null;
  cursoNombre: string = 'Curso';
  grado: string = '';
  seccion: string = '';

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

  async ngOnInit(): Promise<void> {
    try {
      const userData: UserData = await lastValueFrom(this.validateService.getUserData());
      this.rolUsuario = userData?.data?.rol || null;
      console.log('Rol del usuario:', this.rolUsuario);

      // Recuperar datos del localStorage
      this.idCurso = localStorage.getItem('idCurso');
      this.grado = localStorage.getItem('grado') || '';
      this.seccion = localStorage.getItem('seccion') || 'Sin sección';
      const usuarioId = localStorage.getItem('usuarioId');
      console.log('Datos de localStorage:', { idCurso: this.idCurso, grado: this.grado, seccion: this.seccion, usuarioId });

      // Obtener idProfesorCurso de los parámetros de la ruta
      this.route.paramMap.subscribe(async params => {
        this.idProfesorCurso = params.get('idProfesorCurso');
        this.idCurso = params.get('idCurso');
        console.log('Parámetros de la ruta:', { idProfesorCurso: this.idProfesorCurso, idCurso: this.idCurso });

        // Obtener el nombre del curso
        if (this.rolUsuario === 'Profesor' && this.idProfesorCurso) {
          if (!usuarioId) {
            console.error('No se encontró usuarioId en localStorage');
            this.notificationService.showNotification('Error: No se encontró el ID del usuario', 'error');
            this.router.navigate(['campus']);
            return;
          }
          try {
            const cursos = await lastValueFrom(
              this.profesorCursoService.obtenerCursosPorProfesor(usuarioId)
            );
            console.log('Cursos del profesor:', cursos);
            const curso = cursos.find(c => c.idProfesorCurso === this.idProfesorCurso);
            console.log('Curso encontrado:', curso);
            if (curso && curso.curso && curso.curso.nombre) {
              this.cursoNombre = curso.curso.nombre;
            } else {
              console.warn('No se encontró el curso o el nombre del curso para idProfesorCurso:', this.idProfesorCurso);
              this.notificationService.showNotification('No se pudo obtener el nombre del curso', 'error');
              this.cursoNombre = 'Curso';
            }
          } catch (error) {
            console.error('Error al obtener cursos del profesor:', error);
            this.notificationService.showNotification('Error al cargar los datos del curso', 'error');
            this.cursoNombre = 'Curso';
          }
        } else if (this.rolUsuario === 'Alumno' && this.idCurso) {
          try {
            const cursos = await lastValueFrom(
              this.alumnoCursoService.obtenerCursosPorAlumno(localStorage.getItem('idAuth')!)
            );
            console.log('Cursos del alumno:', cursos);
            const curso = cursos.find(c => c.idCurso === this.idCurso);
            this.cursoNombre = curso?.nombreCurso || 'Curso';
          } catch (error) {
            console.error('Error al obtener cursos del alumno:', error);
            this.notificationService.showNotification('Error al cargar los datos del curso', 'error');
            this.cursoNombre = 'Curso';
          }
        } else {
          this.notificationService.showNotification('No se proporcionó un ID válido', 'error');
          this.router.navigate(['campus']);
          return;
        }

        // Cargar sesiones
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
    }
  }

  async obtenerSesionesPorProfesor(idProfesorCurso: string): Promise<void> {
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
    } catch (error) {
      console.error('Error al obtener sesiones:', error);
      this.notificationService.showNotification('Error al obtener sesiones', 'error');
    }
  }

  async obtenerSesionesPorAlumno(idCurso: string): Promise<void> {
    try {
      const idAuth = localStorage.getItem('idAuth');
      if (!idAuth) {
        throw new Error('No se encontró el ID del usuario autenticado');
      }
      const cursos = await lastValueFrom(
        this.alumnoCursoService.obtenerCursosPorAlumno(idAuth)
      );
      const curso = cursos.find(c => c.idCurso === idCurso);
      if (curso && curso.sesiones) {
        this.sesiones = curso.sesiones;
        if (this.sesiones.length === 0) {
          this.notificationService.showNotification(
            'No hay sesiones disponibles para este curso',
            'info'
          );
        }
      } else {
        throw new Error('Curso no encontrado');
      }
    } catch (error) {
      console.error('Error al obtener sesiones para alumno:', error);
      this.notificationService.showNotification('Error al obtener sesiones', 'error');
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

    dialogRef.afterClosed().subscribe(result => {
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

    dialogRef.afterClosed().subscribe(result => {
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

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sesionService.eliminarSesion(idSesion).subscribe({
          next: () => {
            this.obtenerSesionesPorProfesor(this.idProfesorCurso!);
            this.notificationService.showNotification('Sesión eliminada con éxito', 'success');
          },
          error: err => {
            this.notificationService.showNotification('Error al eliminar sesión', 'error');
            console.error('Error al eliminar una sesión:', err);
          },
        });
      }
    });
  }

  irAActividades(idSesion: string): void {
  // Almacenar idProfesorCurso en localStorage para el rol Profesor
  if (this.rolUsuario === 'Profesor' && this.idProfesorCurso) {
    localStorage.setItem('idProfesorCurso', this.idProfesorCurso);
  }
  this.router.navigate(['/card-actividades', idSesion], {
    state: {
      idProfesorCurso: this.idProfesorCurso || null,
      idCurso: this.idCurso || null
    }
  });
}
}