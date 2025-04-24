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

@Component({
  selector: 'app-campus-sesiones',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule, FontAwesomeModule, RouterModule, CardWeekComponent, HttpClientModule, NotificationComponent],
  providers: [SesionService, AlumnoCursoService],
  templateUrl: './campus-sesiones.component.html',
  styleUrls: ['./campus-sesiones.component.scss']
})
export class CampusSesionesComponent {
  public page: number = 1;
  sesiones: Sesion[] = [];
  idProfesorCurso: string | null = null;
  idAlumnoCurso: string | null = null;
  rolUsuario: string | null = null;

  constructor(
    private sesionService: SesionService,
    private alumnoCursoService: AlumnoCursoService,
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

      this.route.paramMap.subscribe(async (params) => {
        this.idProfesorCurso = params.get('idProfesorCurso');
        this.idAlumnoCurso = params.get('idAlumnoCurso');

        if (this.rolUsuario === 'Profesor' && this.idProfesorCurso) {
          console.log('Cargando sesiones para profesor con ID:', this.idProfesorCurso);
          await this.obtenerSesionesPorProfesor(this.idProfesorCurso);
          localStorage.setItem('idProfesorCurso', this.idProfesorCurso);
        } else if (this.rolUsuario === 'Alumno' && this.idAlumnoCurso) {
          console.log('Cargando sesiones para alumno con idAlumnoCurso:', this.idAlumnoCurso);
          await this.obtenerSesionesPorAlumno(this.idAlumnoCurso);
        } else {
          this.notificationService.showNotification('No se proporcionó un ID válido', 'error');
          this.router.navigate(['campus']);
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
          'error'
        );
      }
    } catch (error) {
      console.error('Error al obtener sesiones:', error);
      this.notificationService.showNotification('Error al obtener sesiones', 'error');
    }
  }

  async obtenerSesionesPorAlumno(idAlumnoCurso: string): Promise<void> {
    try {
      const usuarioId = localStorage.getItem('usuarioId');
      if (!usuarioId) {
        throw new Error('No se encontró el ID del usuario');
      }
      const cursos = await lastValueFrom(
        this.alumnoCursoService.obtenerCursosPorAlumno(usuarioId)
      );
      const curso = cursos.find(c => c.idAlumnoCurso === idAlumnoCurso);
      if (curso && curso.sesiones) {
        this.sesiones = curso.sesiones;
        if (this.sesiones.length === 0) {
          this.notificationService.showNotification(
            'No hay sesiones disponibles para este curso',
            'error'
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
            this.notificationService.showNotification('Sesión eliminada con éxito', 'error');
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
    const sesion = this.sesiones.find(s => s.idSesion === idSesion);
    if (sesion) {
      this.router.navigate(['/card-actividades', idSesion], {
        state: {
          idProfesorCurso: this.idProfesorCurso || null,
          idAlumnoCurso: this.idAlumnoCurso || null,
          sesion: sesion
        }
      });
    } else {
      console.error('Sesión no encontrada para idSesion:', idSesion);
      this.notificationService.showNotification('Sesión no encontrada', 'error');
    }
  }
}