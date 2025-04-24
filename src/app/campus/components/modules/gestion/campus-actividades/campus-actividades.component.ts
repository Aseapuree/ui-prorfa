import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SesionService } from '../../../../services/sesion.service';
import { DTOActividad, DTOActividadesSesion } from '../../../../interface/DTOActividad';
import { MatDialog } from '@angular/material/dialog';
import { ModalActividadComponent } from '../../modals/modal-actividad/modal-actividad.component';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CardActividadesComponent } from '../../../shared/card-actividades/card-actividades.component';
import { SafeUrlPipe } from './safe-url.pipe';
import { DialogoConfirmacionComponent } from '../../modals/dialogo-confirmacion/dialogo-confirmacion.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NotificationComponent } from '../../../shared/notificaciones/notification.component';
import { NotificationService } from '../../../shared/notificaciones/notification.service';
import { UserData, ValidateService } from '../../../../../services/validateAuth.service';
import { lastValueFrom } from 'rxjs';
import { AlumnoCursoService } from '../../../../services/alumno-curso.service';
import { AsistenciaComponent } from '../../../../../general/components/asistencia/asistencia.component';
import { Sesion } from '../../../../interface/sesion';

type TipoActividad = 'introducciones' | 'materiales' | 'actividades' | 'asistencias';

// Interfaz para los alumnos estáticos
interface Alumno {
  idAlumno: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

@Component({
  selector: 'app-campus-actividades',
  standalone: true,
  imports: [
    RouterModule,
    HttpClientModule,
    CommonModule,
    CardActividadesComponent,
    SafeUrlPipe,
    FontAwesomeModule,
    NotificationComponent,
    AsistenciaComponent
  ],
  templateUrl: './campus-actividades.component.html',
  styleUrls: ['./campus-actividades.component.scss']
})
export class CampusActividadesComponent implements OnInit {
  actividadesSesion: DTOActividadesSesion = {
    status: 0,
    message: '',
    data: {
      introducciones: [],
      materiales: [],
      actividades: [],
    },
  };
  idSesion: string = '';
  idProfesorCurso: string | null = null;
  idAlumnoCurso: string | null = null;
  idCurso: string | null = null;
  rolUsuario: string | null = null;
  actividadSeleccionada: TipoActividad = 'introducciones';
  contenidoActual: { tipo: 'pdf' | 'video'; url: string; actividad: DTOActividad } | null = null;
  errorLoadingFile: boolean = false;
  actividadesActuales: DTOActividad[] = [];
  isAddButtonDisabled: boolean = false;
  fechaAsignada: string | null = null; // Propiedad para almacenar fechaAsignada

  // Lista estática de alumnos
  alumnos: Alumno[] = [
    { idAlumno: '1', nombre: 'Luisa', apellidoPaterno: 'Lopez', apellidoMaterno: 'Diaz' },
    { idAlumno: '2', nombre: 'Joiser', apellidoPaterno: 'Monsalve', apellidoMaterno: 'Salazar' },
    { idAlumno: '3', nombre: 'Juana', apellidoPaterno: 'Uriarte', apellidoMaterno: 'Coronel' },
    { idAlumno: '4', nombre: 'Daniel', apellidoPaterno: 'Quisp', apellidoMaterno: 'Florez' }
  ];

  // Variable para controlar qué actividad tiene el panel de notas abierto
  actividadConNotasAbierta: string | null | undefined = null;

  constructor(
    private route: ActivatedRoute,
    private sesionService: SesionService,
    private alumnoCursoService: AlumnoCursoService,
    private dialog: MatDialog,
    private router: Router,
    private notificationService: NotificationService,
    private validateService: ValidateService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const userData: UserData = await lastValueFrom(this.validateService.getUserData());
      this.rolUsuario = userData?.data?.rol || null;
      console.log('Rol del usuario:', this.rolUsuario);

      this.route.paramMap.subscribe(async params => {
        this.idSesion = params.get('idSesion') || '';
        const navigation = this.router.getCurrentNavigation();
        let sesion: Sesion | null = null;

        // Intentar obtener la sesión desde el state
        if (navigation?.extras.state) {
          this.idProfesorCurso = navigation.extras.state['idProfesorCurso'] || null;
          this.idAlumnoCurso = navigation.extras.state['idAlumnoCurso'] || null;
          this.idCurso = navigation.extras.state['idCurso'] || localStorage.getItem('idCurso') || null;
          sesion = navigation.extras.state['sesion'] || null;
          if (sesion) {
            this.fechaAsignada = sesion.fechaAsignada || sesion.fechaAsignacion || null;
            console.log('fechaAsignada obtenida desde state:', this.fechaAsignada);
          }
        } else {
          this.idCurso = localStorage.getItem('idCurso') || null;
          this.idProfesorCurso = localStorage.getItem('idProfesorCurso') || null;
          this.idAlumnoCurso = localStorage.getItem('idAlumnoCurso') || null;
        }

        console.log('Navigation state:', navigation?.extras.state);
        console.log('idProfesorCurso:', this.idProfesorCurso);
        console.log('idAlumnoCurso:', this.idAlumnoCurso);
        console.log('idCurso:', this.idCurso);
        console.log('idSesion:', this.idSesion);

        // Si no se obtuvo fechaAsignada desde el state, hacer una solicitud para obtenerla
        if (!this.fechaAsignada && this.idSesion) {
          await this.obtenerFechaAsignada();
        }

        if (this.idSesion) {
          await this.obtenerActividades();
        } else {
          this.notificationService.showNotification('No se proporcionó un ID de sesión válido', 'error');
          this.router.navigate(['campus']);
        }
      });
    } catch (error) {
      console.error('Error al obtener el rol del usuario:', error);
      this.notificationService.showNotification('Error al cargar los datos', 'error');
    }
  }

  async obtenerFechaAsignada(): Promise<void> {
    try {
      if (this.rolUsuario === 'Profesor' && this.idProfesorCurso) {
        const sesiones: Sesion[] = await lastValueFrom(this.sesionService.obtenerSesionesPorCurso(this.idProfesorCurso));
        const sesion = sesiones.find(s => s.idSesion === this.idSesion);
        if (sesion) {
          this.fechaAsignada = sesion.fechaAsignada || sesion.fechaAsignacion || null;
          console.log('fechaAsignada obtenida (Profesor):', this.fechaAsignada);
        } else {
          throw new Error('Sesión no encontrada para idSesion: ' + this.idSesion);
        }
      } else if (this.rolUsuario === 'Alumno' && this.idAlumnoCurso) {
        const usuarioId = localStorage.getItem('usuarioId');
        if (!usuarioId) {
          throw new Error('No se encontró el ID del usuario');
        }
        const cursos = await lastValueFrom(this.alumnoCursoService.obtenerCursosPorAlumno(usuarioId));
        const curso = cursos.find(c => c.idAlumnoCurso === this.idAlumnoCurso);
        if (curso && curso.sesiones) {
          const sesion = curso.sesiones.find(s => s.idSesion === this.idSesion);
          if (sesion) {
            this.fechaAsignada = sesion.fechaAsignada || sesion.fechaAsignacion || null;
            console.log('fechaAsignada obtenida (Alumno):', this.fechaAsignada);
          } else {
            throw new Error('Sesión no encontrada para idSesion: ' + this.idSesion);
          }
        } else {
          throw new Error('Curso no encontrado para idAlumnoCurso: ' + this.idAlumnoCurso);
        }
      } else {
        throw new Error('No se pudo determinar el rol del usuario o faltan datos (idProfesorCurso/idAlumnoCurso)');
      }
    } catch (error) {
      console.error('Error al obtener datos de la sesión:', error);
      this.notificationService.showNotification('Error al obtener datos de la sesión', 'error');
      this.fechaAsignada = null; // Fallback en caso de error
    }
  }

  async obtenerActividades(): Promise<void> {
    try {
      if (this.rolUsuario === 'Profesor') {
        const response = await lastValueFrom(
          this.sesionService.obtenerActividadesPorSesion(this.idSesion)
        );
        this.actividadesSesion = response;
      } else if (this.rolUsuario === 'Alumno' && this.idAlumnoCurso) {
        const usuarioId = localStorage.getItem('usuarioId');
        if (!usuarioId) {
          throw new Error('No se encontró el ID del usuario');
        }
        const cursos = await lastValueFrom(
          this.alumnoCursoService.obtenerCursosPorAlumno(usuarioId)
        );
        const curso = cursos.find(c => c.idAlumnoCurso === this.idAlumnoCurso);
        if (curso && curso.sesiones) {
          const sesion = curso.sesiones.find(s => s.idSesion === this.idSesion);
          if (sesion && sesion.actividades) {
            this.actividadesSesion.data = {
              introducciones: sesion.actividades.filter(
                a => a.infoMaestra?.descripcion === 'Introducción'
              ),
              materiales: sesion.actividades.filter(
                a => a.infoMaestra?.descripcion === 'Material'
              ),
              actividades: sesion.actividades.filter(
                a => a.infoMaestra?.descripcion === 'Actividad'
              ),
            };
          } else {
            throw new Error('Sesión no encontrada');
          }
        } else {
          throw new Error('Curso no encontrado');
        }
      }
      this.actualizarActividadesActuales();
    } catch (error) {
      console.error('Error al obtener actividades:', error);
      this.notificationService.showNotification('Error al obtener actividades', 'error');
    }
  }

  seleccionarActividad(tipo: TipoActividad): void {
    console.log('Seleccionando actividad:', tipo);
    this.actividadSeleccionada = tipo;
    this.contenidoActual = null;
    this.errorLoadingFile = false;
    this.actividadConNotasAbierta = null; // Cerrar el panel de notas al cambiar de actividad
    this.actualizarActividadesActuales();
  }

  actualizarActividadesActuales(): void {
    if (this.actividadSeleccionada === 'introducciones') {
      this.actividadesActuales = this.actividadesSesion.data.introducciones;
    } else if (this.actividadSeleccionada === 'materiales') {
      this.actividadesActuales = this.actividadesSesion.data.materiales;
    } else if (this.actividadSeleccionada === 'actividades') {
      this.actividadesActuales = this.actividadesSesion.data.actividades;
    } else if (this.actividadSeleccionada === 'asistencias') {
      this.actividadesActuales = [];
    }
    this.isAddButtonDisabled = this.actividadesActuales.length === 0 && this.rolUsuario === 'Profesor';
  }

  toggleContenido(actividad: DTOActividad): void {
    if (
      this.contenidoActual &&
      this.contenidoActual.actividad.actividadUrl === actividad.actividadUrl
    ) {
      this.contenidoActual = null;
    } else {
      const esVideo = this.esVideo(actividad.actividadUrl!);
      this.contenidoActual = {
        tipo: esVideo ? 'video' : 'pdf',
        url: actividad.actividadUrl!,
        actividad: actividad,
      };
      this.errorLoadingFile = false;
    }
  }

  esVideo(url: string): boolean {
    const videoExtensions = ['.mp4', '.webm', '.avi', '.mov'];
    const videoDomains = ['youtube.com', 'vimeo.com'];
    return (
      videoExtensions.some(ext => url.toLowerCase().includes(ext)) ||
      videoDomains.some(domain => url.toLowerCase().includes(domain))
    );
  }

  openAddModal(tipo: TipoActividad): void {
    if (this.rolUsuario !== 'Profesor' || tipo === 'asistencias') return;
    const dialogRef = this.dialog.open(ModalActividadComponent, {
      width: '500px',
      data: {
        tipo: tipo,
        sesionId: this.idSesion,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.obtenerActividades();
        this.notificationService.showNotification('Actividad agregada con éxito', 'success');
      }
    });
  }

  openEditModal(actividad: DTOActividad, event: Event): void {
    if (this.rolUsuario !== 'Profesor') return;
    event.stopPropagation();
    const dialogRef = this.dialog.open(ModalActividadComponent, {
      width: '500px',
      data: {
        tipo: this.actividadSeleccionada,
        sesionId: this.idSesion,
        actividad: actividad,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.obtenerActividades();
        this.notificationService.showNotification('Actividad editada con éxito', 'success');
      }
    });
  }

  openDeleteDialog(actividad: DTOActividad, event: Event): void {
    if (this.rolUsuario !== 'Profesor') return;
    event.stopPropagation();
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '1px',
      height: '1px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eliminarActividad(actividad);
      }
    });
  }

  eliminarActividad(actividad: DTOActividad): void {
    if (this.rolUsuario !== 'Profesor') return;
    this.sesionService.eliminarActividad(this.idSesion, actividad.idActividad!).subscribe({
      next: () => {
        this.obtenerActividades();
        if (
          this.contenidoActual &&
          this.contenidoActual.actividad.actividadUrl === actividad.actividadUrl
        ) {
          this.contenidoActual = null;
        }
        this.notificationService.showNotification('Actividad eliminada con éxito', 'error');
      },
      error: err => {
        console.error('Error al eliminar actividad:', err);
        this.notificationService.showNotification('Error al eliminar actividad', 'error');
      },
    });
  }

  retroceder(): void {
    console.log(
      'Retrocediendo a sesiones con idProfesorCurso:',
      this.idProfesorCurso,
      'o idAlumnoCurso:',
      this.idAlumnoCurso
    );
    if (this.rolUsuario === 'Profesor' && this.idProfesorCurso) {
      this.router.navigate(['/sesiones/profesor', this.idProfesorCurso]);
    } else if (this.rolUsuario === 'Alumno' && this.idAlumnoCurso) {
      this.router.navigate(['/sesiones/alumno', this.idAlumnoCurso]);
    } else {
      console.error('No se pudo determinar la ruta de retroceso');
      this.router.navigate(['campus']);
    }
  }

  handleFileError(): void {
    this.errorLoadingFile = true;
  }

  // Método para abrir/cerrar el panel de notas
  toggleNotas(actividad: DTOActividad, event: Event): void {
    event.stopPropagation();
    if (!actividad.idActividad) {
      console.error('idActividad no está definido para esta actividad:', actividad);
      return;
    }
    if (this.actividadConNotasAbierta === actividad.idActividad) {
      this.actividadConNotasAbierta = null; // Cerrar el panel
    } else {
      this.actividadConNotasAbierta = actividad.idActividad; // Abrir el panel
    }
  }
}