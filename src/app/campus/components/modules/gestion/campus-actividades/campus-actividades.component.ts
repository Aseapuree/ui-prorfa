import { ChangeDetectorRef, Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { NotificationComponent } from '../../../shared/notificaciones/notification.component';
import { NotificationService } from '../../../shared/notificaciones/notification.service';
import { UserData, ValidateService } from '../../../../../services/validateAuth.service';
import { lastValueFrom } from 'rxjs';
import { AlumnoCursoService } from '../../../../services/alumno-curso.service';
import { AsistenciaComponent } from '../../../../../general/components/asistencia/asistencia.component';
import { Actividad } from '../../../../interface/AlumnoCurso';
import { NotasService } from '../../../../services/notas.service';
import { DTONota, AlumnoNotas, ActividadNota, DTONotaResponse } from '../../../../interface/DTONota';
import { FormsModule } from '@angular/forms';
import { GeneralLoadingSpinnerComponent } from '../../../../../general/components/spinner/spinner.component';
import { faExternalLinkAlt, faCheckCircle, faDownload, faPlus, faPencil, faStickyNote, faTrash, faBook } from '@fortawesome/free-solid-svg-icons';
import { faStickyNote as farStickyNote } from '@fortawesome/free-regular-svg-icons';

type TipoActividad = 'introducciones' | 'materiales' | 'actividades' | 'asistencias';

// Nueva interfaz sin esActividadPresencial
interface ActividadWithPresencial extends DTOActividad, Actividad {}

interface Alumno {
  idAlumno: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nota?: number | null | undefined;
  tareaUrl?: string;
  fechaEnvio?: string;
  comentario?: string | null;
  fechaActualizacion?: string;
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
    FormsModule,
    GeneralLoadingSpinnerComponent
  ],
  templateUrl: './campus-actividades.component.html',
  styleUrls: ['./campus-actividades.component.scss']
})
export class CampusActividadesComponent implements OnInit, AfterViewInit {
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
  contenidoActual: { tipo: 'pdf' | 'video' | 'text' | 'docx'; url: string; actividad: ActividadWithPresencial } | null = null;
  errorLoadingFile: boolean = false;
  actividadesOriginales: Actividad[] = [];
  actividadesActuales: ActividadWithPresencial[] = [];
  isAddButtonDisabled: boolean = false;
  fechaAsignada: string | null = null;
  isUploading: boolean = false;
  isLoading: boolean = false;
  loadingMessage: string = 'Cargando actividades...';
  uploadProgress: number = 0;
  tareaSubidaUrl: string | null = null;
  tareaFechaEnvio: string | null = null;
  idAlumno: string | null = null;
  notaActual: number | null = null;
  uploadedFileName: string | null = null;
  isComentarioPanelOpen: boolean = false;
  comentarioActual: string | null = null;
  comentarioCount: number = 0;
  private isViewInitialized: boolean = false;
  isCalificada: boolean = false;
  fechaCalificacion: string | null = null;

  alumnos: Alumno[] = [];

  actividadConNotasAbierta: string | null | undefined = null;
  alumnoConTareaAbierta: string | null = null;

  grado: string | undefined = undefined;
  seccion: string | undefined = undefined;
  nivel: string | undefined = undefined;

  private nombreCompletoUsuario: string | null = null;
  private usuarioId: string | null = null;

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

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
    private cdr: ChangeDetectorRef,
    private library: FaIconLibrary
  ) {
    this.library.addIcons(faExternalLinkAlt, faCheckCircle, faDownload, faPlus, faPencil, faStickyNote, farStickyNote, faTrash, faBook);
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    this.cdr.detectChanges();
  }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    try {
      this.usuarioId = localStorage.getItem('IDUSER');
      if (!this.usuarioId) {
        throw new Error('No se encontró el ID del usuario autenticado en localStorage (IDUSER)');
      }
      console.log('ID del usuario autenticado (IDUSER):', this.usuarioId);

      const userData: UserData = await lastValueFrom(this.validateService.getUserData());
      this.rolUsuario = userData?.data?.rol || null;
      console.log('Datos completos del usuario (userData):', userData);

      if (userData?.data?.nombre && userData?.data?.apellidoPaterno && userData?.data?.apellidoMaterno) {
        this.nombreCompletoUsuario = `${userData.data.nombre} ${userData.data.apellidoPaterno} ${userData.data.apellidoMaterno}`;
      } else {
        this.nombreCompletoUsuario = 'Joiser Monsalve Salazar';
      }
      console.log('Nombre completo del usuario:', this.nombreCompletoUsuario);

      if (this.nombreCompletoUsuario && this.rolUsuario === 'Alumno') {
        this.idAlumno = await lastValueFrom(this.notasService.obtenerIdAlumnoPorNombre(this.nombreCompletoUsuario));
        console.log('idAlumno del usuario autenticado:', this.idAlumno);
      }

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
          if (this.rolUsuario === 'Alumno') {
            await this.validarNotas();
          }
          await this.obtenerDatosSesion();
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
    } finally {
      this.isLoading = false;
    }
  }

  async obtenerDatosSesion(): Promise<void> {
    try {
      const response = await lastValueFrom(this.notasService.listarNotasPorSesion(this.idSesion));
      if (response.code === 200 && response.data && response.data.length > 0) {
        const nota = response.data[0];
        this.grado = nota.grado || undefined;
        this.seccion = nota.seccion || undefined;
        this.nivel = nota.nivel || undefined;
        console.log('Datos de la sesión obtenidos desde notas:', { grado: this.grado, seccion: this.seccion, nivel: this.nivel });
      } else {
        if (this.rolUsuario === 'Profesor') {
          const sesionResponse = await lastValueFrom(this.sesionService.obtenerActividadesPorSesion(this.idSesion));
          if (sesionResponse.data) {
            this.grado = sesionResponse.data.grado || undefined;
            this.seccion = sesionResponse.data.seccion || undefined;
            this.nivel = sesionResponse.data.nivel || undefined;
            console.log('Datos de la sesión obtenidos desde actividades:', { grado: this.grado, seccion: this.seccion, nivel: this.nivel });
          }
        } else if (this.rolUsuario === 'Alumno' && this.idCurso) {
          const idAuth = localStorage.getItem('idAuth');
          if (!idAuth) {
            throw new Error('No se encontró el ID del usuario autenticado (idAuth)');
          }
          const cursos = await lastValueFrom(this.alumnoCursoService.obtenerCursosPorAlumno(idAuth));
          const curso = cursos.find(c => c.idCurso === this.idCurso);
          if (curso) {
            this.grado = curso.grado || undefined;
            this.seccion = curso.seccion || undefined;
            this.nivel = curso.nivel || undefined;
            console.log('Datos del curso obtenidos:', { grado: this.grado, seccion: this.seccion, nivel: this.nivel });
          }
        }
      }
      if (!this.grado) this.grado = '';
      if (!this.seccion) this.seccion = '';
      if (!this.nivel) this.nivel = '';
    } catch (error) {
      console.error('Error al obtener datos de la sesión:', error);
      this.grado = '';
      this.seccion = '';
      this.nivel = '';
    }
  }

  async validarNotas(idActividad?: string): Promise<void> {
    if (!this.idSesion || !this.idAlumno) {
      console.warn('No se puede validar notas: idSesion o idAlumno no están definidos');
      return;
    }

    try {
      const response = await lastValueFrom(this.notasService.listarNotasPorSesion(this.idSesion));
      if (response.code === 200 && response.data) {
        if (idActividad) {
          const nota = response.data.find(
            n => n.idActividad === idActividad && n.idAlumno === this.idAlumno
          );
          if (nota) {
            this.tareaSubidaUrl = nota.notatareaurl;
            this.tareaFechaEnvio = this.formatFechaEnvio(nota.fechaRegistro);
            this.notaActual = nota.nota ?? 0;
            this.uploadedFileName = nota.nombreArchivo || 'Archivo no encontrado';
            this.comentarioActual = nota.comentario;
            this.comentarioCount = nota.comentario ? 1 : 0;
            this.isCalificada = nota.nota !== null && nota.nota >= 0;
            this.fechaCalificacion = this.isCalificada ? this.formatFechaEnvio(nota.fechaActualizacion) : 'Sin fecha de calificación';
            localStorage.setItem(`tareaSubida_${this.idSesion}_${idActividad}`, nota.notatareaurl || '');
            localStorage.setItem(`tareaFechaEnvio_${this.idSesion}_${idActividad}`, this.tareaFechaEnvio);
            localStorage.setItem(`nota_${this.idSesion}_${idActividad}`, this.notaActual.toString());
            console.log('Nombre del archivo recuperado desde el backend:', this.uploadedFileName);
          } else {
            this.tareaSubidaUrl = null;
            this.tareaFechaEnvio = null;
            this.notaActual = null;
            this.uploadedFileName = null;
            this.comentarioActual = null;
            this.comentarioCount = 0;
            this.isComentarioPanelOpen = false;
            localStorage.removeItem(`tareaSubida_${this.idSesion}_${idActividad}`);
            localStorage.removeItem(`tareaFechaEnvio_${this.idSesion}_${idActividad}`);
            localStorage.removeItem(`nota_${this.idSesion}_${idActividad}`);
          }
        } else {
          this.actividadesActuales.forEach(actividad => {
            if (actividad.idActividad) {
              const nota = response.data.find(
                n => n.idActividad === actividad.idActividad && n.idAlumno === this.idAlumno
              );
              if (!nota) {
                localStorage.removeItem(`tareaSubida_${this.idSesion}_${actividad.idActividad}`);
                localStorage.removeItem(`tareaFechaEnvio_${this.idSesion}_${actividad.idActividad}`);
                localStorage.removeItem(`nota_${this.idSesion}_${actividad.idActividad}`);
              }
            }
          });
        }
      } else {
        console.warn('No se encontraron notas para la sesión:', this.idSesion);
        this.actividadesActuales.forEach(actividad => {
          if (actividad.idActividad) {
            localStorage.removeItem(`tareaSubida_${this.idSesion}_${actividad.idActividad}`);
            localStorage.removeItem(`tareaFechaEnvio_${this.idSesion}_${actividad.idActividad}`);
            localStorage.removeItem(`nota_${this.idSesion}_${actividad.idActividad}`);
          }
        });
        this.tareaSubidaUrl = null;
        this.tareaFechaEnvio = null;
        this.notaActual = null;
        this.uploadedFileName = null;
        this.comentarioActual = null;
        this.comentarioCount = 0;
        this.isComentarioPanelOpen = false;
      }
    } catch (error) {
      console.error('Error al validar notas:', error);
      this.notificationService.showNotification('Error al validar las notas', 'error');
    }
    this.cdr.detectChanges();
  }

  toggleComentarioPanel(): void {
    this.isComentarioPanelOpen = !this.isComentarioPanelOpen;
    this.cdr.detectChanges();
  }

  async obtenerActividades(): Promise<void> {
    this.isLoading = true;
    this.loadingMessage = 'Cargando actividades...';
    try {
      if (this.rolUsuario === 'Profesor') {
        const response = await lastValueFrom(
          this.sesionService.obtenerActividadesPorSesion(this.idSesion)
        );
        this.actividadesSesion = response;
        this.grado = response.data.grado || this.grado || undefined;
        this.seccion = response.data.seccion || this.seccion || undefined;
        this.nivel = response.data.nivel || this.nivel || undefined;
        console.log('Datos de la sesión desde obtenerActividades:', { grado: this.grado, seccion: this.seccion, nivel: this.nivel });
  
        this.actividadesSesion.data.actividades.forEach(actividad => {
          if (actividad.fechaInicio) {
            actividad.fechaInicio = this.parseUTCDate(actividad.fechaInicio as string);
            console.log('FechaInicio convertida:', actividad.fechaInicio);
          }
          if (actividad.fechaFin) {
            actividad.fechaFin = this.parseUTCDate(actividad.fechaFin as string);
            console.log('FechaFin convertida:', actividad.fechaFin);
          }
        });
        this.actualizarActividadesActuales();
      } else if (this.rolUsuario === 'Alumno' && this.idCurso) {
        const idAuth = localStorage.getItem('idAuth');
        if (!idAuth) {
          throw new Error('No se encontró el ID del usuario autenticado (idAuth)');
        }
        const cursos = await lastValueFrom(
          this.alumnoCursoService.obtenerCursosPorAlumno(idAuth)
        );
        const curso = cursos.find(c => c.idCurso === this.idCurso);
        if (curso && curso.sesiones) {
          const sesion = curso.sesiones.find(s => s.idSesion === this.idSesion);
          if (sesion && sesion.actividades) {
            this.grado = curso.grado || this.grado || undefined;
            this.seccion = curso.seccion || this.seccion || undefined;
            this.nivel = curso.nivel || this.nivel || undefined;
            console.log('Datos del curso/sesión (alumno):', { grado: this.grado, seccion: this.seccion, nivel: this.nivel });
  
            this.actividadesOriginales = sesion.actividades;
  
            this.actividadesOriginales.forEach(actividad => {
              if (actividad.fechaInicio) {
                actividad.fechaInicio = this.parseUTCDate(actividad.fechaInicio as string);
                console.log('FechaInicio convertida (alumno):', actividad.fechaInicio);
              }
              if (actividad.fechaFin) {
                actividad.fechaFin = this.parseUTCDate(actividad.fechaFin as string);
                console.log('FechaFin convertida (alumno):', actividad.fechaFin);
              }
            });
            this.actividadesActuales = [...this.actividadesOriginales];
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
    } finally {
      this.isLoading = false;
    }
  }

  parseUTCDate(dateString: string): Date {
    const utcDateString = dateString.replace(' ', 'T') + 'Z';
    return new Date(utcDateString);
  }

  async subirTarea(): Promise<void> {
    if (this.rolUsuario !== 'Alumno') {
      this.notificationService.showNotification('Acción no permitida para este rol', 'error');
      return;
    }

    if (!this.contenidoActual || !this.contenidoActual.actividad.idActividad) {
      this.notificationService.showNotification('Por favor, selecciona una actividad válida', 'error');
      return;
    }

    if (!this.isViewInitialized || !this.fileInput || !this.fileInput.nativeElement) {
      console.error('fileInput no está definido o la vista no está inicializada:', {
        isViewInitialized: this.isViewInitialized,
        fileInput: this.fileInput,
        nativeElement: this.fileInput?.nativeElement,
        rolUsuario: this.rolUsuario,
        actividadSeleccionada: this.actividadSeleccionada,
        tareaSubidaUrl: this.tareaSubidaUrl
      });
      this.notificationService.showNotification('Error: No se pudo acceder al selector de archivos. Asegúrate de estar en la sección de actividades y que no hayas enviado una tarea previamente.', 'error');
      return;
    }

    const fileList: FileList | null = this.fileInput.nativeElement.files;
    if (!fileList || fileList.length === 0) {
      this.notificationService.showNotification('Por favor, selecciona un archivo', 'error');
      return;
    }

    const archivo: File = fileList[0];
    console.log('Archivo seleccionado:', archivo.name);
    this.uploadedFileName = archivo.name;

    this.fileInput.nativeElement.value = '';

    const allowedExtensions = ['pdf', 'mp4', 'avi', 'mov'];
    const extension = archivo.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      this.notificationService.showNotification('Solo se permiten archivos PDF, MP4, AVI o MOV', 'error');
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.cdr.detectChanges();

    const progressInterval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 90) {
        this.uploadProgress = 90;
        clearInterval(progressInterval);
      }
      this.cdr.detectChanges();
    }, 500);

    try {
      const urlArchivo = await lastValueFrom(
        this.notasService.subirArchivoDrive(archivo, this.DRIVE_FOLDER_ID)
      );
      console.log('URL del archivo subido:', urlArchivo);

      if (!this.nombreCompletoUsuario) {
        throw new Error('No se encontró el nombre completo del usuario autenticado');
      }
      const idAlumno = await lastValueFrom(
        this.notasService.obtenerIdAlumnoPorNombre(this.nombreCompletoUsuario)
      );
      console.log('idAlumno obtenido:', idAlumno);

      if (!this.usuarioId) {
        throw new Error('No se encontró el ID del usuario autenticado');
      }

      const nota: DTONota = {
        idalumano: idAlumno,
        idactividad: this.contenidoActual.actividad.idActividad,
        idSesion: this.idSesion,
        notatareaurl: urlArchivo,
        nombreArchivo: this.uploadedFileName,
        usuarioCreacion: this.usuarioId
      };

      console.log('Payload enviado a /registrar:', JSON.stringify(nota, null, 2));

      const response = await lastValueFrom(this.notasService.registrarNota(nota));
      console.log('Respuesta del servidor al registrar la nota:', response);

      this.uploadProgress = 100;
      this.cdr.detectChanges();

      await this.validarNotas(this.contenidoActual.actividad.idActividad);

      this.notificationService.showNotification('Tarea enviada con éxito', 'success');
    } catch (error: any) {
      console.error('Error completo:', error);
      const errorMessage = error.message || 'Error al registrar la tarea';
      this.notificationService.showNotification(errorMessage, 'error');
      this.uploadProgress = 0;
    } finally {
      clearInterval(progressInterval);
      this.isUploading = false;
      this.cdr.detectChanges();
    }
  }

  private formatFechaEnvio(fecha: string): string {
    const date = new Date(fecha);

    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
  }

  seleccionarActividad(tipo: TipoActividad): void {
    console.log('Seleccionando actividad:', tipo);
    this.actividadSeleccionada = tipo;
    this.contenidoActual = null;
    this.errorLoadingFile = false;
    this.actividadConNotasAbierta = null;
    this.alumnoConTareaAbierta = null;
    this.tareaSubidaUrl = null;
    this.tareaFechaEnvio = null;
    this.notaActual = null;
    this.uploadedFileName = null;
    this.alumnos = [];
    this.actualizarActividadesActuales();
  }

  async toggleContenido(actividad: ActividadWithPresencial): Promise<void> {
    if (
      this.contenidoActual &&
      this.contenidoActual.actividad.actividadUrl === actividad.actividadUrl
    ) {
      this.contenidoActual = null;
      this.tareaSubidaUrl = null;
      this.tareaFechaEnvio = null;
      this.notaActual = null;
      this.uploadedFileName = null;
      this.comentarioActual = null;
      this.comentarioCount = 0;
      this.isComentarioPanelOpen = false;
    } else {
      if (!actividad.actividadUrl) {
        this.notificationService.showNotification('No se encontró la URL de la actividad', 'error');
        return;
      }
      const tipoArchivo = this.getFileType(actividad.actividadUrl);
      const actividadConPresencial = { ...actividad, presencial: actividad.presencial ?? false } as ActividadWithPresencial; // Usamos presencial directamente
      this.contenidoActual = {
        tipo: tipoArchivo,
        url: actividad.actividadUrl,
        actividad: actividadConPresencial
      };
      this.errorLoadingFile = false;
      if (this.rolUsuario === 'Alumno' && actividad.idActividad) {
        await this.validarNotas(actividad.idActividad);
      }
    }
    this.cdr.detectChanges();
  }

  actualizarActividadesActuales(): void {
    if (this.rolUsuario === 'Profesor') {
      if (this.actividadSeleccionada === 'introducciones') {
        this.actividadesActuales = this.actividadesSesion.data.introducciones as ActividadWithPresencial[];
      } else if (this.actividadSeleccionada === 'materiales') {
        this.actividadesActuales = this.actividadesSesion.data.materiales as ActividadWithPresencial[];
      } else if (this.actividadSeleccionada === 'actividades') {
        this.actividadesActuales = this.actividadesSesion.data.actividades as ActividadWithPresencial[];
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
      this.actividadesActuales = actividadesFiltradas as ActividadWithPresencial[];

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

  esVideo(url: string): boolean {
    const videoExtensions = ['.mp4', '.avi', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  getFileType(url: string): 'pdf' | 'video' | 'text' | 'docx' {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.pdf')) {
      return 'pdf';
    } else if (this.esVideo(lowerUrl)) {
      return 'video';
    } else if (lowerUrl.includes('.txt')) {
      return 'text';
    } else if (lowerUrl.includes('.docx')) {
      return 'docx';
    }
    return 'pdf';
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

  openEditModal(actividad: ActividadWithPresencial, event: Event): void {
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

  openDeleteDialog(actividad: ActividadWithPresencial, event: Event): void {
    if (this.rolUsuario !== 'Profesor' || !actividad.idActividad) return;
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

  eliminarActividad(actividad: ActividadWithPresencial): void {
    if (this.rolUsuario !== 'Profesor' || !actividad.idActividad) return;
    this.sesionService.eliminarActividad(this.idSesion, actividad.idActividad).subscribe({
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

  async toggleNotas(actividad: ActividadWithPresencial, event: Event): Promise<void> {
    event.stopPropagation();
    if (!actividad.idActividad) {
      console.error('idActividad no está definido para esta actividad:', actividad);
      return;
    }
    if (this.actividadConNotasAbierta === actividad.idActividad) {
      this.actividadConNotasAbierta = null;
      this.alumnoConTareaAbierta = null;
      this.alumnos = [];
    } else {
      this.actividadConNotasAbierta = actividad.idActividad;
      this.alumnoConTareaAbierta = null;
      await this.cargarAlumnosConTareas(actividad.idActividad);
    }
    this.cdr.detectChanges();
  }

  async cargarAlumnosConTareas(idActividad: string): Promise<void> {
    try {
      const response = await lastValueFrom(this.notasService.listarNotasPorSesion(this.idSesion));
      if (response.code === 200 && response.data) {
        const alumnosConTareasPromises = response.data
          .filter(nota => nota.idActividad === idActividad && nota.notatareaurl)
          .map(async (nota) => {
            const nombreCompleto = `${nota.nombre} ${nota.apellidos}`;
            const idAlumno = nota.idAlumno;
            let apellidoPaterno = '';
            let apellidoMaterno = '';

            try {
              const alumnoData = await lastValueFrom(
                this.notasService.obtenerDatosAlumnoPorNombre(nombreCompleto)
              );
              apellidoPaterno = alumnoData.apellidoPaterno || '';
              apellidoMaterno = alumnoData.apellidoMaterno || '';
            } catch (error) {
              console.error(`Error al obtener datos del alumno ${nombreCompleto}:`, error);
              const apellidosArray = nota.apellidos.split(' ');
              apellidoPaterno = apellidosArray[0] || '';
              apellidoMaterno = apellidosArray.slice(1).join(' ') || '';
            }

            return {
              idAlumno: idAlumno,
              nombre: nota.nombre || 'Desconocido',
              apellidoPaterno: apellidoPaterno,
              apellidoMaterno: apellidoMaterno,
              nota: nota.nota,
              tareaUrl: nota.notatareaurl,
              fechaEnvio: this.formatFechaEnvio(nota.fechaRegistro),
              fechaActualizacion: nota.fechaActualizacion ? this.formatFechaEnvio(nota.fechaActualizacion) : 'Sin Actualizar',
              comentario: nota.comentario || null
            };
          });

        this.alumnos = await Promise.all(alumnosConTareasPromises);

        if (this.alumnos.length === 0) {
          this.notificationService.showNotification('No hay alumnos que hayan enviado esta tarea', 'info');
        }
      } else {
        this.alumnos = [];
        this.notificationService.showNotification('No se encontraron tareas enviadas para esta actividad', 'info');
      }
    } catch (error) {
      console.error('Error al cargar alumnos con tareas:', error);
      this.notificationService.showNotification('Error al cargar los alumnos', 'error');
      this.alumnos = [];
    }
    this.cdr.detectChanges();
  }

  toggleTarea(alumno: Alumno): void {
    if (this.alumnoConTareaAbierta === alumno.idAlumno) {
      this.alumnoConTareaAbierta = null;
    } else {
      this.alumnoConTareaAbierta = alumno.idAlumno;
      this.tareaSubidaUrl = alumno.tareaUrl || null;
      this.tareaFechaEnvio = alumno.fechaEnvio || null;
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

    const alumnosConNotas = this.alumnos.filter(alumno => alumno.nota !== undefined && alumno.nota !== null && alumno.nota >= 0 && alumno.nota <= 20);
    if (alumnosConNotas.length === 0) {
      this.notificationService.showNotification('Por favor, ingresa al menos una nota válida (0-20)', 'error');
      return;
    }

    console.log('Valores de alumno.comentario antes de construir el payload:', 
      alumnosConNotas.map(alumno => ({ idAlumno: alumno.idAlumno, comentario: alumno.comentario }))
    );

    try {
      if (!this.usuarioId) {
        throw new Error('No se encontró el ID del usuario autenticado');
      }

      const notas: AlumnoNotas[] = alumnosConNotas.map(alumno => ({
        idAlumno: alumno.idAlumno,
        actividades: [
          {
            idActividad: this.actividadConNotasAbierta!,
            nota: alumno.nota!,
            comentario: alumno.comentario || null
          }
        ]
      }));

      const dtoNota: DTONota = {
        idSesion: this.idSesion,
        idCurso: this.idCurso || undefined,
        grado: this.grado,
        seccion: this.seccion,
        nivel: this.nivel,
        usuarioCreacion: this.usuarioId,
        usuarioActualizacion: this.usuarioId,
        notas: notas
      };

      console.log('Payload enviado a /registrar o /editar:', JSON.stringify(dtoNota, null, 2));

      const responseNotas = await lastValueFrom(this.notasService.listarNotasPorSesion(this.idSesion));
      const notasExistentes = responseNotas.data?.filter(nota =>
        nota.idActividad === this.actividadConNotasAbierta &&
        alumnosConNotas.some(alumno => alumno.idAlumno === nota.idAlumno)
      );

      let response;
      if (notasExistentes && notasExistentes.length > 0) {
        console.log('Editando notas existentes...');
        response = await lastValueFrom(this.notasService.editarNota(dtoNota));
      } else {
        console.log('Registrando nuevas notas...');
        response = await lastValueFrom(this.notasService.registrarNota(dtoNota));
      }

      console.log('Respuesta del servidor al guardar las notas:', response);

      this.notificationService.showNotification('Notas guardadas con éxito', 'success');
      this.actividadConNotasAbierta = null;
      this.alumnos = [];
      await this.cargarAlumnosConTareas(this.actividadConNotasAbierta!);
    } catch (error: any) {
      console.error('Error al guardar las notas:', error);
      const errorMessage = error.message || 'Error al guardar las notas';
      this.notificationService.showNotification(errorMessage, 'error');
    }
  }

  async finalizarActividadPresencial(): Promise<void> {
    if (this.rolUsuario !== 'Alumno') {
      this.notificationService.showNotification('Acción no permitida para este rol', 'error');
      return;
    }
  
    if (!this.contenidoActual || !this.contenidoActual.actividad.idActividad || !this.contenidoActual.actividad.presencial) {
      this.notificationService.showNotification('Por favor, selecciona una actividad presencial válida', 'error');
      return;
    }
  
    this.isUploading = true;
    this.cdr.detectChanges();
  
    try {
      if (!this.nombreCompletoUsuario) {
        throw new Error('No se encontró el nombre completo del usuario autenticado');
      }
      const idAlumno = await lastValueFrom(this.notasService.obtenerIdAlumnoPorNombre(this.nombreCompletoUsuario));
      console.log('idAlumno obtenido:', idAlumno);
  
      if (!this.usuarioId) {
        throw new Error('No se encontró el ID del usuario autenticado');
      }
  
      const nota: DTONota = {
        idalumano: idAlumno,
        idactividad: this.contenidoActual.actividad.idActividad,
        idSesion: this.idSesion,
        notatareaurl: 'Tarea presencial',
        nombreArchivo: 'Tarea presencial',
        usuarioCreacion: this.usuarioId
      };
  
      console.log('Payload enviado a /registrar para actividad presencial:', JSON.stringify(nota, null, 2));
  
      const response = await lastValueFrom(this.notasService.registrarNota(nota));
      console.log('Respuesta del servidor al registrar la nota presencial:', response);
  
      await this.validarNotas(this.contenidoActual.actividad.idActividad);
      this.notificationService.showNotification('Tarea registrada con éxito', 'success');
    } catch (error: any) {
      console.error('Error completo:', error);
      const errorMessage = error.message || 'Error al registrar la tarea presencial';
      this.notificationService.showNotification(errorMessage, 'error');
    } finally {
      this.isUploading = false;
      this.cdr.detectChanges();
    }
  }
}

const normalizeString = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();