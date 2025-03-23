import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SesionService } from '../../../../services/sesion.service';
import { DTOActividad, DTOActividadesSesion } from '../../../../interface/DTOActividad';
import { MatDialog } from '@angular/material/dialog'; // Importar MatDialog
import { ModalActividadComponent } from '../../modals/modal-actividad/modal-actividad.component';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CardActividadesComponent } from '../../../shared/card-actividades/card-actividades.component';
import { SafeUrlPipe } from './safe-url.pipe';
import { DialogoConfirmacionComponent } from '../../modals/dialogo-confirmacion/dialogo-confirmacion.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NotificationComponent } from '../../../shared/notificaciones/notification.component';
import { NotificationService } from '../../../shared/notificaciones/notification.service';

type TipoActividad = 'introducciones' | 'materiales' | 'actividades';

@Component({
  selector: 'app-campus-actividades',
  standalone: true,
  imports: [RouterModule, HttpClientModule, CommonModule, CardActividadesComponent, SafeUrlPipe, FontAwesomeModule,NotificationComponent,],
  templateUrl: './campus-actividades.component.html',
  styleUrl: './campus-actividades.component.scss'
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
  idProfesorCurso: string = '';
  actividadSeleccionada: TipoActividad = 'introducciones';
  contenidoActual: { tipo: 'pdf' | 'video'; url: string; actividad: DTOActividad } | null = null;
  errorLoadingFile: boolean = false;
  actividadesActuales: DTOActividad[] = [];
  isAddButtonDisabled: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private sesionService: SesionService,
    private dialog: MatDialog,
    private router: Router,
    private notificationService: NotificationService // Inyectar el servicio
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.idSesion = params.get('idSesion') || '';
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras.state?.['idProfesorCurso']) {
        this.idProfesorCurso = navigation.extras.state['idProfesorCurso'];
      }
      console.log('idProfesorCurso:', this.idProfesorCurso);
      console.log('idSesion:', this.idSesion);
      if (this.idSesion) {
        this.obtenerActividades();
      }
    });
  }

  obtenerActividades(): void {
    this.sesionService.obtenerActividadesPorSesion(this.idSesion).subscribe({
      next: (data) => {
        this.actividadesSesion = data;
        this.actualizarActividadesActuales();
      },
      error: (err) => {
        console.error('Error al obtener actividades:', err);
      },
    });
  }

  seleccionarActividad(tipo: TipoActividad): void {
    this.actividadSeleccionada = tipo;
    this.contenidoActual = null;
    this.errorLoadingFile = false;
    this.actualizarActividadesActuales();
  }

  actualizarActividadesActuales(): void {
    if (this.actividadSeleccionada === 'introducciones') {
      this.actividadesActuales = this.actividadesSesion.data.introducciones;
    } else if (this.actividadSeleccionada === 'materiales') {
      this.actividadesActuales = this.actividadesSesion.data.materiales;
    } else if (this.actividadSeleccionada === 'actividades') {
      this.actividadesActuales = this.actividadesSesion.data.actividades;
    }
  }

  toggleContenido(actividad: DTOActividad): void {
    if (
      this.contenidoActual &&
      this.contenidoActual.actividad.actividadUrl === actividad.actividadUrl
    ) {
      this.contenidoActual = null; // Ocultar si ya está visible
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
      videoExtensions.some((ext) => url.toLowerCase().includes(ext)) ||
      videoDomains.some((domain) => url.toLowerCase().includes(domain))
    );
  }

  openAddModal(tipo: TipoActividad): void {
    const dialogRef = this.dialog.open(ModalActividadComponent, {
      width: '500px',
      data: {
        tipo: tipo,
        sesionId: this.idSesion,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.obtenerActividades();
        this.notificationService.showNotification('Actividad agregada con éxito', 'success');
      }
    });
  }

  openEditModal(actividad: DTOActividad, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ModalActividadComponent, {
      width: '500px',
      data: {
        tipo: this.actividadSeleccionada,
        sesionId: this.idSesion,
        actividad: actividad,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.obtenerActividades();
        this.notificationService.showNotification('Actividad editada con éxito', 'success');
      }
    });
  }

  openDeleteDialog(actividad: DTOActividad, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '1px',
      height: '1px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.eliminarActividad(actividad);
      }
    });
  }

  eliminarActividad(actividad: DTOActividad): void {
    this.sesionService.eliminarActividad(this.idSesion, actividad.idActividad!).subscribe({
      next: () => {
        this.obtenerActividades();
        if (this.contenidoActual && this.contenidoActual.actividad.actividadUrl === actividad.actividadUrl) {
          this.contenidoActual = null;
        }
        this.notificationService.showNotification('Actividad eliminada con éxito', 'error'); // Rojo para eliminación
      },
      error: (err) => {
        console.error('Error al eliminar actividad:', err);
        this.notificationService.showNotification('Error al eliminar actividad', 'error');
      },
    });
  }

  retroceder(): void {
    console.log('Retrocediendo a sesiones con idProfesorCurso:', this.idProfesorCurso);
    if (this.idProfesorCurso) {
      this.router.navigate(['/sesiones', this.idProfesorCurso]);
    } else {
      console.error('idProfesorCurso no está definido');
      this.router.navigate(['campus']);
    }
  }

  handleFileError(): void {
    this.errorLoadingFile = true;
  }
}
