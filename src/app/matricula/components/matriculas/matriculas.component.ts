import { GeneralLoadingSpinnerComponent } from './../../../general/components/spinner/spinner.component';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatriculaService } from './../../services/matricula.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGraduationCap, faChair, faSortNumericDown, faCheck } from '@fortawesome/free-solid-svg-icons';

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
    GeneralLoadingSpinnerComponent, // spinner
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

  // mensaje spinner
  loadingMessage: string = 'Cargando vacantes...';

  constructor(
    private matriculaService: MatriculaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUrl = this.router.url;
    const level = currentUrl.split('/').pop();
    if (level) {
      this.selectedNivel = level.toLowerCase();
    }
    this.cargarVacantes();
  }

  cargarVacantes(): void {
    this.cargando = true; // Mostrar spinner al iniciar la carga
    this.loadingMessage = 'Cargando vacantes...'; // Establecer mensaje de carga
    this.matriculaService.vacantesPorNivel(this.selectedNivel).subscribe({
      next: (vacantes) => {
        let grados: number[] = [];
        if (this.selectedNivel === 'primaria') {
          grados = [1, 2, 3, 4, 5, 6];
        } else if (this.selectedNivel === 'secundaria') {
          grados = [1, 2, 3, 4, 5];
        }
        this.niveles = [
          {
            nombre: this.selectedNivel.charAt(0).toUpperCase() + this.selectedNivel.slice(1),
            grados,
            vacantes: vacantes ? { ...vacantes } : {}
          }
        ];
        this.cargando = false; // Ocultar spinner al finalizar
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
