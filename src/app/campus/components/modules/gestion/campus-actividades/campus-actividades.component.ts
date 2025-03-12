import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SesionService } from '../../../../services/sesion.service';
import { DTOActividadesSesion } from '../../../../interface/DTOActividadesSesion';
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
  idProfesorCurso: string = '';
  actividadSeleccionada: TipoActividad = 'introducciones';
  contenidoActual: { tipo: 'pdf' | 'video', url: string } | null = null;

  constructor(
    private route: ActivatedRoute,
    private sesionService: SesionService,
    private dialog: MatDialog // Inyectar MatDialog
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.idProfesorCurso = params.get('idProfesorCurso') || '';
      this.idSesion = params.get('idSesion') || '';
      console.log('idProfesorCurso:', this.idProfesorCurso); // Verificar en consola
      console.log('idSesion:', this.idSesion); // Verificar en consola
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
    this.mostrarContenidoInicial();
  }

  mostrarContenidoInicial(): void {
    if (this.actividadSeleccionada === 'introducciones' && this.actividadesSesion.data.introducciones.length > 0) {
      const introduccion = this.actividadesSesion.data.introducciones[0];
      this.contenidoActual = { tipo: 'pdf', url: introduccion.introduccionUrl };
    } else if (this.actividadSeleccionada === 'materiales' && this.actividadesSesion.data.materiales.length > 0) {
      const material = this.actividadesSesion.data.materiales[0];
      const esVideo = this.esVideo(material.materialUrl);
      this.contenidoActual = { tipo: esVideo ? 'video' : 'pdf', url: material.materialUrl };
    } else if (this.actividadSeleccionada === 'actividades' && this.actividadesSesion.data.actividades.length > 0) {
      const actividad = this.actividadesSesion.data.actividades[0];
      this.contenidoActual = { tipo: 'pdf', url: actividad.actividadUrl };
    } else {
      this.contenidoActual = null;
    }
  }

  esVideo(url: string): boolean {
    const videoExtensions = ['.mp4', '.webm', '.avi', '.mov'];
    const videoDomains = ['youtube.com', 'vimeo.com'];
    return videoExtensions.some(ext => url.includes(ext)) || videoDomains.some(domain => url.includes(domain));
  }

  openAddModal(tipo: 'introducciones' | 'materiales' | 'actividades'): void {
    const dialogRef = this.dialog.open(ModalActividadComponent, {
      width: '500px',
      data: {
        tipo: tipo, // Pasar el tipo de contenido
        sesionId: this.idSesion, // Pasar el ID de la sesión
      },
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.obtenerActividades(); // Recargar las actividades después de agregar contenido
      }
    });
  }

  

  errorLoadingFile: boolean = false;

handleFileError(): void {
  this.errorLoadingFile = true;
}
}