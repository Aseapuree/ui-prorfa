import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { MatriculaService } from './../../services/matricula.service';

interface NivelVacantes {
  nombre: string;
  grados: number[];
  vacantes: { [grado: number]: { [seccion: string]: number } };
}

@Component({
  selector: 'app-matriculas',
  templateUrl: './matriculas.component.html',
  styleUrls: ['./matriculas.component.scss']
})
export class MatriculasComponent implements OnInit {
  niveles: NivelVacantes[] = [];
  cargando: boolean = true;

  constructor(
    private matriculaService: MatriculaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarVacantes();
  }

  cargarVacantes(): void {
    forkJoin({
      primaria: this.matriculaService.vacantesPorNivel('primaria'),
      secundaria: this.matriculaService.vacantesPorNivel('secundaria')
    }).subscribe({
      next: ({ primaria, secundaria }) => {
        this.niveles = [
          {
            nombre: 'Primaria',
            grados: [1, 2, 3, 4, 5, 6],
            vacantes: primaria ? { ...primaria } : {}
          },
          {
            nombre: 'Secundaria',
            grados: [1, 2, 3, 4, 5],
            vacantes: secundaria ? { ...secundaria } : {}
          }
        ];
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar vacantes:', error);
        this.cargando = false;
      }
    });
  }

  hayVacantes(secciones: { [seccion: string]: number } = {}): boolean {
    return Object.values(secciones).some(v => v > 0);
  }

  matricular(nivel: string, grado: number): void {
    this.router.navigate(['/registrarmatricula'], { queryParams: { nivel: nivel.toLowerCase(), grado } });
  }
}
