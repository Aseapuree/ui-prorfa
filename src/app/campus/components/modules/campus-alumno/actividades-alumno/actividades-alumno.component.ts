import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DTOActividadesSesion } from '../../../../interface/DTOActividadesSesion';
import { SesionService } from '../../../../services/sesion.service';
import { CardActividadesComponent } from '../../../shared/card-actividades/card-actividades.component';
import { SafeUrlPipe } from './safe-url.pipe';

type TipoActividad = 'introducciones' | 'materiales' | 'actividades';

@Component({
  selector: 'app-actividades-alumno',
  standalone: true,
  imports: [RouterModule, HttpClientModule, CommonModule, CardActividadesComponent, SafeUrlPipe],
  templateUrl: './actividades-alumno.component.html',
  styleUrl: './actividades-alumno.component.scss'
})
export class ActividadesAlumnoComponent implements OnInit{
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
  actividadSeleccionada: TipoActividad = 'introducciones'; // Inicializar con 'introducciones'
  contenidoActual: { tipo: 'pdf' | 'video', url: string } | null = null; // Para almacenar el contenido actual

  constructor(
    private route: ActivatedRoute,
    private sesionService: SesionService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.idSesion = params.get('idSesion') || '';
      if (this.idSesion) {
        this.obtenerActividades();
      }
    });
  }

  obtenerActividades(): void {
    this.sesionService.obtenerActividadesPorSesion(this.idSesion).subscribe({
      next: (data) => {
        console.log('Respuesta del servicio:', data);
        this.actividadesSesion = data;
        this.mostrarContenidoInicial(); // Mostrar el contenido inicial (introducción)
      },
      error: (err) => {
        console.error('Error al obtener actividades:', err);
      },
    });
  }

  seleccionarActividad(tipo: TipoActividad): void {
    this.actividadSeleccionada = tipo;
    this.mostrarContenidoInicial(); // Mostrar el contenido correspondiente
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
    // Verifica si la URL es un video (por extensión o dominio)
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.youtube.com') || url.includes('.vimeo.com');
  }
  
}
