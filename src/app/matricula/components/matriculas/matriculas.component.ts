import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatriculaService } from './../../services/matricula.service';
import { EntidadService } from '../../services/entidad.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGraduationCap, faChair, faSortNumericDown, faCheck } from '@fortawesome/free-solid-svg-icons';
import { GeneralLoadingSpinnerComponent } from '../../../general/components/spinner/spinner.component';
import { NotificationComponent } from "../../../campus/components/shared/notificaciones/notification.component";
import { NotificationService } from '../../../campus/components/shared/notificaciones/notification.service';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Entidad, DatosNGS, Nivel, Grado, SeccionVacantes } from '../../interfaces/DTOEntidad';

interface NivelVacantes {
  nombre: string;
  grados: number[];
  vacantes: { [grado: number]: { [seccion: string]: number } };
}

@Component({
  selector: 'app-matriculas',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    GeneralLoadingSpinnerComponent,
    NotificationComponent
  ],
  templateUrl: './matriculas.component.html',
  styleUrls: ['./matriculas.component.scss']
})
export class MatriculasComponent implements OnInit {
  niveles: NivelVacantes[] = [];
  cargando: boolean = true;
  selectedNivel: string = '';
  faGraduationCap = faGraduationCap;
  faChair = faChair;
  faSortNumericDown = faSortNumericDown;
  faCheck = faCheck;

  loadingMessage: string = 'Cargando vacantes...';
  constructor(
    private matriculaService: MatriculaService,
    private entidadService: EntidadService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const currentUrl = this.router.url;
    const level = currentUrl.split('/').pop();
    if (level) {
      this.selectedNivel = level.toLowerCase();
    }
    const idUsuario = localStorage.getItem('IDUSER');
    if (idUsuario) {
      this.cargarVacantes();
    } else {
      this.notificationService.showNotification('Error: No se pudo identificar al usuario.', 'error');
    }
  }

  cargarVacantes(): void {
    this.cargando = true;
    this.loadingMessage = 'Cargando vacantes...';
    this.entidadService.obtenerEntidadPorUsuario(localStorage.getItem('IDUSER') ?? '').pipe(
      map((entidad: Entidad) => {
        const datosngs = entidad.datosngs;
        if (!datosngs || !datosngs.niveles) {
          throw new Error('No se encontró la Entidad.');
        }

        const nivelSeleccionado = datosngs.niveles.find(n => n.nombre.toLowerCase() === this.selectedNivel);
        if (!nivelSeleccionado) {
          throw new Error(`Nivel "${this.selectedNivel}" no encontrado.`);
        }

        let grados: number[] = [];
        const vacantesPorGrado: { [grado: number]: { [seccion: string]: number } } = {};
        if (nivelSeleccionado.grados) {
          nivelSeleccionado.grados.forEach((grado: Grado) => {
            const gradoNum = parseInt(grado.nombre, 10);
            grados.push(gradoNum);
            vacantesPorGrado[gradoNum] = {};
            if (grado.secciones) {
              grado.secciones.forEach((seccion: SeccionVacantes) => {
                vacantesPorGrado[gradoNum][seccion.nombre] = seccion.vacantes || 0;
              });
            }
          });
        }

        return {
          nombre: nivelSeleccionado.nombre,
          grados,
          vacantes: vacantesPorGrado
        };
      }),
      catchError(error => {
        console.error('Error al cargar vacantes:', error);
        return of(null);
      })
    ).subscribe({
      next: (nivelData) => {
        if (nivelData) {
          this.niveles = [nivelData];
        } else {
          this.niveles = [];
          this.loadingMessage = 'Error al cargar datos.';
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar vacantes:', error);
        this.loadingMessage = 'Error al cargar datos.';
        this.cargando = false;
      }
    });
  }

  hayVacantes(secciones: { [seccion: string]: number } = {}): boolean {
    return Object.values(secciones).some(v => v > 0);
  }

  getSecciones(vacantes: { [seccion: string]: number } = {}): string[] {
    return Object.keys(vacantes);
  }

  matricular(nivel: string, grado: number): void {
    this.router.navigate(['/registrarmatricula'], { queryParams: { nivel: nivel.toLowerCase(), grado } });
  }
}
