import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { DTOActividadesSesion } from '../../../../interface/DTOActividad';
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
    idProfesorCurso: string = '';
    actividadSeleccionada: TipoActividad = 'introducciones';
    contenidoActual: { tipo: 'pdf' | 'video'; url: string } | null = null;
    errorLoadingFile: boolean = false;
  
    constructor(
      private route: ActivatedRoute,
      private sesionService: SesionService,
      private router: Router
    ) {}
  
    ngOnInit(): void {
      this.route.paramMap.subscribe((params) => {
        this.idProfesorCurso = params.get('idProfesorCurso') || '';
        this.idSesion = params.get('idSesion') || '';
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
      this.errorLoadingFile = false; // Reiniciar el estado de error al cambiar de pestaña
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
  
    retroceder(): void {
      this.router.navigate(['/sesiones', this.idProfesorCurso]); // Ajusta la ruta según tu aplicación
    }
  
    handleFileError(): void {
      this.errorLoadingFile = true;
    }
  
}
