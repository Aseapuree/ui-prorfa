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

type TipoActividad = 'introducciones' | 'materiales' | 'actividades';

@Component({
  selector: 'app-campus-actividades',
  standalone: true,
  imports: [RouterModule, HttpClientModule, CommonModule, CardActividadesComponent, SafeUrlPipe],
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
  idProfesorCurso: string = ''; // Este valor se establece en ngOnInit
  actividadSeleccionada: TipoActividad = 'introducciones';
  contenidoActual: { tipo: 'pdf' | 'video'; url: string } | null = null;
  errorLoadingFile: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private sesionService: SesionService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.idSesion = params.get('idSesion') || '';
      // Intentar obtener idProfesorCurso desde el estado de navegación (si se pasó)
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
        this.mostrarContenidoInicial();
      },
      error: (err) => {
        console.error('Error al obtener actividades:', err);
      },
    });
  }

  seleccionarActividad(tipo: TipoActividad): void {
    this.actividadSeleccionada = tipo;
    this.errorLoadingFile = false;
    this.mostrarContenidoInicial();
  }

  mostrarContenidoInicial(): void {
    let actividadesArray: any[] = [];
    if (this.actividadSeleccionada === 'introducciones') {
      actividadesArray = this.actividadesSesion.data.introducciones;
    } else if (this.actividadSeleccionada === 'materiales') {
      actividadesArray = this.actividadesSesion.data.materiales;
    } else if (this.actividadSeleccionada === 'actividades') {
      actividadesArray = this.actividadesSesion.data.actividades;
    }

    if (actividadesArray.length > 0) {
      const actividad = actividadesArray[0];
      const esVideo = this.esVideo(actividad.actividadUrl);
      this.contenidoActual = { tipo: esVideo ? 'video' : 'pdf', url: actividad.actividadUrl };
    } else {
      this.contenidoActual = null;
    }
  }

  esVideo(url: string): boolean {
    const videoExtensions = ['.mp4', '.webm', '.avi', '.mov'];
    const videoDomains = ['youtube.com', 'vimeo.com'];
    return videoExtensions.some((ext) => url.includes(ext)) || videoDomains.some((domain) => url.includes(domain));
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
      }
    });
  }

  retroceder(): void {
    console.log('Retrocediendo a sesiones con idProfesorCurso:', this.idProfesorCurso);
    if (this.idProfesorCurso) {
      this.router.navigate(['/sesiones', this.idProfesorCurso]);
    } else {
      console.error('idProfesorCurso no está definido');
      this.router.navigate(['campus']); // Ruta por defecto si no hay idProfesorCurso
    }
  }

  handleFileError(): void {
    this.errorLoadingFile = true;
  }
}