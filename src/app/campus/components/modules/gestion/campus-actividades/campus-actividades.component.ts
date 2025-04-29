import { ChangeDetectorRef, Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
import { Actividad } from '../../../../interface/AlumnoCurso';
import { NotasService } from '../../../../services/notas.service';
import { DTONota, AlumnoNotas, ActividadNota } from '../../../../interface/DTONota';
import { FormsModule } from '@angular/forms';

type TipoActividad = 'introducciones' | 'materiales' | 'actividades' | 'asistencias';

interface Alumno {
  idAlumno: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nota?: number;
  comentario?: string;
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
    AsistenciaComponent,
    FormsModule
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
      actividades: []
    }
  };
  idSesion: string = '';
  idProfesorCurso: string | null = null;
  idCurso: string | null = null;
  rolUsuario: string | null = null;
  actividadSeleccionada: TipoActividad = 'introducciones';
  contenidoActual: { tipo: 'pdf' | 'video'; url: string; actividad: DTOActividad | Actividad } | null = null;
  errorLoadingFile: boolean = false;
  actividadesOriginales: Actividad[] = [];
  actividadesActuales: (DTOActividad | Actividad)[] = [];
  isAddButtonDisabled: boolean = false;
  fechaAsignada: string | null = null;
  isUploading: boolean = false;

  // Lista de alumnos (con campos para nota y comentario)
  alumnos: Alumno[] = [
    { idAlumno: '1', nombre: 'Luisa', apellidoPaterno: 'Lopez', apellidoMaterno: 'Diaz', nota: undefined, comentario: '' },
    { idAlumno: '2', nombre: 'Joiser', apellidoPaterno: 'Monsalve', apellidoMaterno: 'Salazar', nota: undefined, comentario: '' },
    { idAlumno: '3', nombre: 'Juana', apellidoPaterno: 'Uriarte', apellidoMaterno: 'Coronel', nota: undefined, comentario: '' },
    { idAlumno: '4', nombre: 'Daniel', apellidoPaterno: 'Quisp', apellidoMaterno: 'Florez', nota: undefined, comentario: '' }
  ];

  actividadConNotasAbierta: string | null | undefined = null;
  alumnoConTareaAbierta: string | null = null;

  // Nueva propiedad para almacenar el nombre completo del usuario autenticado
  private nombreCompletoUsuario: string | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly DRIVE_FOLDER_ID = '1NCETkDrcpY4fAPeay_5kd17OjEJCnqwM';

  constructor(
    private route: ActivatedRoute,
    private sesionService: SesionService,
    private alumnoCursoService: AlumnoCursoService,
    private dialog: MatDialog,
    private router: Router,
    private notificationService: NotificationService,
    private validateService: ValidateService,
    private notasService: NotasService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const userData: UserData = await lastValueFrom(this.validateService.getUserData());
      this.rolUsuario = userData?.data?.rol || null;
      console.log('Datos completos del usuario (userData):', userData);

      // Intentar obtener el nombre completo del usuario autenticado
      if (userData?.data?.nombre && userData?.data?.apellidoPaterno && userData?.data?.apellidoMaterno) {
        this.nombreCompletoUsuario = `${userData.data.nombre} ${userData.data.apellidoPaterno} ${userData.data.apellidoMaterno}`;
      } else {
        // Si no está disponible en userData, usar un valor temporal
        this.nombreCompletoUsuario = 'Joiser Monsalve Salazar';
      }
      console.log('Nombre completo del usuario:', this.nombreCompletoUsuario);

      this.route.paramMap.subscribe(async params => {
        this.idSesion = params.get('idSesion') || '';
        const navigation = this.router.getCurrentNavigation();
        if (navigation?.extras.state) {
          this.idProfesorCurso = navigation.extras.state['idProfesorCurso'] || null;
          this.idCurso = navigation.extras.state['idCurso'] || null;
        } else {
          this.idProfesorCurso = localStorage.getItem('idProfesorCurso') || null;
          this.idCurso = localStorage.getItem('idCurso') || null;
        }
        console.log('Datos de navegación:', {
          idSesion: this.idSesion,
          idProfesorCurso: this.idProfesorCurso,
          idCurso: this.idCurso,
          rolUsuario: this.rolUsuario
        });

        if (this.idSesion) {
          await this.obtenerActividades();
        } else {
          console.error('No se proporcionó idSesion');
          this.notificationService.showNotification('Error: No se proporcionó ID de sesión', 'error');
          this.router.navigate(['campus']);
        }
      });
    } catch (error) {
      console.error('Error al obtener el rol del usuario:', error);
      this.notificationService.showNotification('Error al cargar los datos', 'error');
      this.router.navigate(['campus']);
    }
  }

  async obtenerActividades(): Promise<void> {
    try {
      if (this.rolUsuario === 'Profesor') {
        const response = await lastValueFrom(
          this.sesionService.obtenerActividadesPorSesion(this.idSesion)
        );
        this.actividadesSesion = response;
        this.actualizarActividadesActuales();
      } else if (this.rolUsuario === 'Alumno' && this.idCurso) {
        const idAuth = localStorage.getItem('idAuth');
        if (!idAuth) {
          throw new Error('No se encontró el ID del usuario autenticado');
        }
        const cursos = await lastValueFrom(
          this.alumnoCursoService.obtenerCursosPorAlumno(idAuth)
        );
        console.log('Cursos obtenidos para alumno:', cursos);
        const curso = cursos.find(c => c.idCurso === this.idCurso);
        if (curso && curso.sesiones) {
          const sesion = curso.sesiones.find(s => s.idSesion === this.idSesion);
          console.log('Sesión encontrada:', sesion);
          if (sesion && sesion.actividades) {
            console.log('Actividades de la sesión:', sesion.actividades);
            this.actividadesOriginales = [...sesion.actividades];
            this.actividadesActuales = [...sesion.actividades];
            console.log('this.actividadesOriginales después de asignar:', this.actividadesOriginales);
            this.actualizarActividadesActuales();
          } else {
            throw new Error('Sesión no encontrada');
          }
        } else {
          throw new Error('Curso no encontrado');
        }
      }
    } catch (error) {
      console.error('Error al obtener actividades:', error);
      this.notificationService.showNotification('Error al obtener actividades', 'error');
    }
  }

  async subirTarea(): Promise<void> {
    if (this.rolUsuario !== 'Alumno') {
      this.notificationService.showNotification('Acción no permitida para este rol', 'error');
      return;
    }

    if (!this.contenidoActual || !this.contenidoActual.actividad.idActividad) {
      this.notificationService.showNotification('Por favor, selecciona una actividad primero', 'error');
      return;
    }

    const fileList: FileList | null = this.fileInput.nativeElement.files;
    if (!fileList || fileList.length === 0) {
      this.notificationService.showNotification('Por favor, selecciona un archivo', 'error');
      return;
    }

    const archivo: File = fileList[0];
    console.log('Archivo seleccionado:', archivo.name);

    const allowedExtensions = ['pdf', 'mp4', 'avi', 'mov'];
    const extension = archivo.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      this.notificationService.showNotification('Solo se permiten archivos PDF, MP4, AVI o MOV', 'error');
      return;
    }

    this.isUploading = true;
    this.cdr.detectChanges();

    try {
      const urlArchivo = await lastValueFrom(
        this.notasService.subirArchivoDrive(archivo, this.DRIVE_FOLDER_ID)
      );
      console.log('URL del archivo subido:', urlArchivo);

      // Obtener el idAlumno usando el nombre completo del usuario
      if (!this.nombreCompletoUsuario) {
        throw new Error('No se encontró el nombre completo del usuario autenticado');
      }
      const idAlumno = await lastValueFrom(
        this.notasService.obtenerIdAlumnoPorNombre(this.nombreCompletoUsuario)
      );
      console.log('idAlumno obtenido:', idAlumno);

      const nota: DTONota = {
        idalumano: idAlumno, // Usar el idAlumno correcto
        idactividad: this.contenidoActual.actividad.idActividad,
        idSesion: this.idSesion,
        notatareaurl: urlArchivo
      };

      const response = await lastValueFrom(this.notasService.registrarNota(nota));
      console.log('Respuesta del servidor al registrar la nota:', response);

      this.notificationService.showNotification('Tarea registrada con éxito', 'success');
      this.fileInput.nativeElement.value = '';
    } catch (error: any) {
      console.error('Error completo:', error);
      const errorMessage = error.message || 'Error al registrar la tarea';
      this.notificationService.showNotification(errorMessage, 'error');
    } finally {
      this.isUploading = false;
      this.cdr.detectChanges();
    }
  }

  // ... resto del código sin cambios ...

  seleccionarActividad(tipo: TipoActividad): void {
    console.log('Seleccionando actividad:', tipo);
    this.actividadSeleccionada = tipo;
    this.contenidoActual = null;
    this.errorLoadingFile = false;
    this.actividadConNotasAbierta = null;
    this.alumnoConTareaAbierta = null;
    this.actualizarActividadesActuales();
  }

  actualizarActividadesActuales(): void {
    if (this.rolUsuario === 'Profesor') {
      if (this.actividadSeleccionada === 'introducciones') {
        this.actividadesActuales = this.actividadesSesion.data.introducciones;
      } else if (this.actividadSeleccionada === 'materiales') {
        this.actividadesActuales = this.actividadesSesion.data.materiales;
      } else if (this.actividadSeleccionada === 'actividades') {
        this.actividadesActuales = this.actividadesSesion.data.actividades;
      } else if (this.actividadSeleccionada === 'asistencias') {
        this.actividadesActuales = [];
      }
    } else if (this.rolUsuario === 'Alumno') {
      console.log('Actividades originales antes del filtrado:', this.actividadesOriginales);

      let tipoEsperado: string;
      switch (this.actividadSeleccionada) {
        case 'introducciones':
          tipoEsperado = 'introduccion';
          break;
        case 'actividades':
          tipoEsperado = 'actividad';
          break;
        case 'materiales':
          tipoEsperado = 'material';
          break;
        default:
          tipoEsperado = '';
          break;
      }

      if (!tipoEsperado) {
        console.warn('Tipo esperado no definido para actividadSeleccionada:', this.actividadSeleccionada);
        this.actividadesActuales = [];
        return;
      }

      const tipoEsperadoNormalized = normalizeString(tipoEsperado);
      console.log('Filtrando actividades para tipo:', tipoEsperadoNormalized);

      const actividadesFiltradas = this.actividadesOriginales.filter(a => {
        const actividad = a as Actividad;
        if (!actividad.actividadTipo) {
          console.warn('Actividad sin actividadTipo:', actividad);
          return false;
        }
        const actividadTipoNormalized = normalizeString(actividad.actividadTipo);
        console.log('Comparando actividadTipo:', actividadTipoNormalized, 'con tipoEsperado:', tipoEsperadoNormalized);
        const coincide = actividadTipoNormalized === tipoEsperadoNormalized;
        console.log('Resultado de la comparación:', coincide, 'para actividad:', actividad);
        return coincide;
      });

      console.log('Actividades filtradas (antes de asignar):', actividadesFiltradas);
      this.actividadesActuales = actividadesFiltradas;

      console.log('Actividades filtradas (después de asignar):', this.actividadesActuales);
      if (this.actividadesActuales.length === 0) {
        this.notificationService.showNotification(
          `No hay ${this.actividadSeleccionada} disponibles para esta sesión`,
          'info'
        );
      }
    }
    this.cdr.detectChanges();
  }

  toggleContenido(actividad: DTOActividad | Actividad): void {
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
        actividad: actividad
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

  getFileNameFromUrl(url: string): string {
    const parts = url.split('/');
    const fileId = parts[parts.length - 2];
    return fileId || 'Archivo desconocido';
  }

  openAddModal(tipo: TipoActividad): void {
    if (this.rolUsuario !== 'Profesor' || tipo === 'asistencias') return;
    const dialogRef = this.dialog.open(ModalActividadComponent, {
      width: '500px',
      data: {
        tipo: tipo,
        sesionId: this.idSesion
      }
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
        actividad: actividad
      }
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
      height: '1px'
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
        this.notificationService.showNotification('Actividad eliminada con éxito', 'success');
      },
      error: err => {
        console.error('Error al eliminar actividad:', err);
        this.notificationService.showNotification('Error al eliminar actividad', 'error');
      }
    });
  }

  retroceder(): void {
    console.log('Ejecutando retroceder:', {
      rolUsuario: this.rolUsuario,
      idProfesorCurso: this.idProfesorCurso,
      idCurso: this.idCurso
    });
    if (this.rolUsuario === 'Profesor' && this.idProfesorCurso) {
      console.log('Navegando a sesiones/profesor con idProfesorCurso:', this.idProfesorCurso);
      this.router.navigate(['/sesiones/profesor', this.idProfesorCurso]);
    } else if (this.rolUsuario === 'Alumno' && this.idCurso) {
      console.log('Navegando a sesiones/alumno con idCurso:', this.idCurso);
      this.router.navigate(['/sesiones/alumno', this.idCurso]);
    } else {
      console.warn('No se pudo determinar la ruta de navegación, redirigiendo a campus');
      this.notificationService.showNotification('Error: No se pudo determinar la ruta de regreso', 'error');
      this.router.navigate(['campus']);
    }
  }

  handleFileError(): void {
    this.errorLoadingFile = true;
  }

  toggleNotas(actividad: DTOActividad, event: Event): void {
    event.stopPropagation();
    if (!actividad.idActividad) {
      console.error('idActividad no está definido para esta actividad:', actividad);
      return;
    }
    if (this.actividadConNotasAbierta === actividad.idActividad) {
      this.actividadConNotasAbierta = null;
      this.alumnoConTareaAbierta = null;
    } else {
      this.actividadConNotasAbierta = actividad.idActividad;
      this.alumnoConTareaAbierta = null;
    }
  }

  toggleTarea(alumno: Alumno): void {
    if (this.alumnoConTareaAbierta === alumno.idAlumno) {
      this.alumnoConTareaAbierta = null;
    } else {
      this.alumnoConTareaAbierta = alumno.idAlumno;
    }
  }

  async guardarNotas(): Promise<void> {
    if (this.rolUsuario !== 'Profesor') {
      this.notificationService.showNotification('Acción no permitida para este rol', 'error');
      return;
    }

    if (!this.actividadConNotasAbierta) {
      this.notificationService.showNotification('No hay una actividad seleccionada para asignar notas', 'error');
      return;
    }

    const alumnosConNotas = this.alumnos.filter(alumno => alumno.nota !== undefined && alumno.nota >= 0 && alumno.nota <= 20);
    if (alumnosConNotas.length === 0) {
      this.notificationService.showNotification('Por favor, ingresa al menos una nota válida (0-20)', 'error');
      return;
    }

    try {
      const idAuth = localStorage.getItem('idAuth');
      if (!idAuth) {
        throw new Error('No se encontró el ID del usuario autenticado');
      }

      const notas: AlumnoNotas[] = alumnosConNotas.map(alumno => ({
        idAlumno: alumno.idAlumno,
        actividades: [
          {
            idActividad: this.actividadConNotasAbierta!,
            nota: alumno.nota!
          }
        ]
      }));

      const dtoNota: DTONota = {
        idSesion: this.idSesion,
        idCurso: this.idCurso || undefined,
        grado: '1',
        seccion: 'A',
        nivel: 'Primaria',
        usuarioCreacion: idAuth,
        notas: notas
      };

      const response = await lastValueFrom(this.notasService.registrarNota(dtoNota));
      console.log('Respuesta del servidor al registrar las notas:', response);

      this.notificationService.showNotification('Notas registradas con éxito', 'success');
      this.actividadConNotasAbierta = null;
      this.alumnos.forEach(alumno => {
        alumno.nota = undefined;
        alumno.comentario = '';
      });
    } catch (error: any) {
      console.error('Error al registrar las notas:', error);
      const errorMessage = error.message || 'Error al registrar las notas';
      this.notificationService.showNotification(errorMessage, 'error');
    }
  }
}

const normalizeString = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();