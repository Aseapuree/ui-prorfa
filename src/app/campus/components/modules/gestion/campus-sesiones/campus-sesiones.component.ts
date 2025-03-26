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
  imports: [CommonModule, NgxPaginationModule, FontAwesomeModule,RouterModule,CardWeekComponent,HttpClientModule,NotificationComponent],
  providers: [SesionService,AlumnoCursoService],
  templateUrl: './campus-sesiones.component.html',
  styleUrl: './campus-sesiones.component.scss'
})
export class CampusSesionesComponent {
  public page: number=1;
  sesiones: Sesion[] = [];
  idProfesorCurso: string | null = null; // Puede ser null si es alumno
  idAlumnoCurso: string | null = null;   // Nuevo para alumnos
  rolUsuario: string | null = null;      // Variable para el rol del usuario

  constructor(
    private sesionService: SesionService,
    private alumnoCursoService: AlumnoCursoService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private validateService: ValidateService, // Inyectar ValidateService
    private notificationService: NotificationService
  ) {}

  private readonly _sesionSVC = inject(SesionService);

  async ngOnInit(): Promise<void> {
    try {
      // Obtener el rol del usuario autenticado
      const userData: UserData = await lastValueFrom(this.validateService.getUserData());
      this.rolUsuario = userData?.data?.rol || null;
      console.log('Rol del usuario:', this.rolUsuario);

      // Obtener parámetros de la ruta
      this.route.paramMap.subscribe(async (params) => {
        this.idProfesorCurso = params.get('idProfesorCurso');
        this.idAlumnoCurso = params.get('idAlumnoCurso');

        let idCurso: string | null = null;

        if (this.idProfesorCurso) {
          // Para profesores, asumimos que idProfesorCurso ya es suficiente
          idCurso = this.idProfesorCurso;
          console.log('Cargando sesiones para profesor con ID:', this.idProfesorCurso);
          this.obtenerSesionesPorProfesor(this.idProfesorCurso);
        } else if (this.idAlumnoCurso) {
          // Para alumnos, obtenemos el idCurso desde idAlumnoCurso
          idCurso = await lastValueFrom(this.alumnoCursoService.obtenerCursoIdPorAlumnoCurso(this.idAlumnoCurso));
          console.log('Cargando sesiones para alumno con ID Curso:', idCurso);
          this.obtenerSesionesPorCurso(idCurso);
        } else {
          this.notificationService.showNotification('No se proporcionó un ID de curso válido', 'error');
        }
      });
    } catch (error) {
      console.error('Error al inicializar el componente:', error);
      this.notificationService.showNotification('Error al cargar los datos', 'error');
    }
  }

  // Método para profesores (usando el endpoint existente)
  obtenerSesionesPorProfesor(idProfesorCurso: string): void {
    this.sesionService.obtenerSesionesPorCurso(idProfesorCurso).subscribe({
      next: (data) => {
        this.sesiones = data;
        if (this.sesiones.length === 0) {
          this.notificationService.showNotification('No hay sesiones disponibles para este curso', 'error');
        }
      },
      error: (err) => {
        this.notificationService.showNotification('Error al obtener sesiones', 'error');
        console.error('Error al obtener sesiones:', err);
      },
    });
  }

  // Método para alumnos (usando el nuevo endpoint por idCurso)
  obtenerSesionesPorCurso(idCurso: string): void {
    this.sesionService.obtenerSesionesPorCursoId(idCurso).subscribe({
      next: (data) => {
        this.sesiones = data;
        if (this.sesiones.length === 0) {
          this.notificationService.showNotification('No hay sesiones disponibles para este curso', 'error');
        }
      },
      error: (err) => {
        this.notificationService.showNotification('Error al obtener sesiones', 'error');
        console.error('Error al obtener sesiones:', err);
      },
    });
  }

  openAddModal(): void {
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
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '1px',
      height: '1px',
      data: { message: '¿Estás seguro de que quieres eliminar esta sesión?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this._sesionSVC.eliminarSesion(idSesion).subscribe({
          next: () => {
            this.obtenerSesionesPorProfesor(this.idProfesorCurso!);
            this.notificationService.showNotification('Sesión eliminada con éxito', 'error');
          },
          error: (err) => {
            this.notificationService.showNotification('Error al eliminar sesión', 'error');
            console.error('Error al eliminar una sesión:', err);
          },
        });
      }
    });
  }

  // Método para navegar a las actividades de una sesión
  irAActividades(idSesion: string): void {
    this.router.navigate(['/card-actividades', idSesion], {
      state: { 
        idProfesorCurso: this.idProfesorCurso || null,
        idAlumnoCurso: this.idAlumnoCurso || null 
      }
    });
  }
}