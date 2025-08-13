import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GeneralLoadingSpinnerComponent } from '../../../general/components/spinner/spinner.component'; 
import { NotasService } from '../../../campus/services/notas.service';
import { catchError, map, throwError } from 'rxjs';
import { PaginationComponent } from '../../../general/components/pagination/pagination.component';

@Component({
  selector: 'app-notas-bimestrales',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, GeneralLoadingSpinnerComponent, PaginationComponent],
  templateUrl: './notas-bimestrales.component.html',
  styleUrl: './notas-bimestrales.component.scss'
})
export class NotasBimestralesComponent implements OnInit {
  cursosNotas: LocalCursoNotas[] = [];
  expandedRows: Set<string> = new Set();
  isLoading: boolean = false;
  isDataLoaded: boolean = false;
  loadingMessage: string = 'Cargando boleta bimestral...';
  alumnoNombre: string = '';
  nivel: string = '';
  filterBimestre: string = '';
  filterNotaType: string = '';
  availableBimestres: string[] = ['Bimestre 1', 'Bimestre 2', 'Bimestre 3', 'Bimestre 4'];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private notasService: NotasService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.alumnoNombre = params['alumno'] || 'Alumno Ejemplo'; // Obtener del idAlumno o perfil
      this.nivel = params['nivel'] || localStorage.getItem('nivel') || 'Secundaria';
      this.loadNotasBimestrales();
    });
  }

  loadNotasBimestrales(): void {
    this.isLoading = true;
    // Placeholder: Aquí deberías llamar a un método del servicio para obtener las notas bimestrales por alumno
    // Ejemplo: this.notasService.listarNotasBimestralesPorAlumno(idAlumno).subscribe(...)
    // Por ahora, simulamos datos
    this.cursosNotas = [
      {
        curso: 'Matemáticas',
        bimestres: [
          { bimestre: 'Bimestre 1', promedio: 14.0, comentario: 'Buen desempeño' },
          { bimestre: 'Bimestre 2', promedio: 15.5, comentario: 'Mejorando' },
          { bimestre: 'Bimestre 3', promedio: 16.0, comentario: 'Excelente' },
          { bimestre: 'Bimestre 4', promedio: 15.0, comentario: 'Consistente' }
        ],
        promedioGeneral: 15.1
      },
      {
        curso: 'Lenguaje',
        bimestres: [
          { bimestre: 'Bimestre 1', promedio: 12.5, comentario: 'Área a mejorar' },
          { bimestre: 'Bimestre 2', promedio: 13.0, comentario: 'Progreso notable' },
          { bimestre: 'Bimestre 3', promedio: 14.0, comentario: 'Bueno' },
          { bimestre: 'Bimestre 4', promedio: 13.5, comentario: 'Estable' }
        ],
        promedioGeneral: 13.25
      }
    ];
    this.isLoading = false;
    this.isDataLoaded = true;
  }

  toggleRow(cursoKey: string): void {
    if (this.expandedRows.has(cursoKey)) {
      this.expandedRows.delete(cursoKey);
    } else {
      this.expandedRows.add(cursoKey);
    }
  }

  aplicarFiltros(): void {
    // Placeholder: Filtrar cursosNotas según filterBimestre y filterNotaType
    this.loadNotasBimestrales(); // Recargar datos filtrados (ajustar según servicio real)
  }

  regresar(): void {
    this.router.navigate(['/campus-vista'], { queryParams: { nivel: this.nivel } });
  }

  imprimirBoleta(): void {
    console.log('Funcionalidad de impresión de boleta aún no implementada.');
  }
}

interface LocalCursoNotas {
  curso: string;
  bimestres: { bimestre: string; promedio: number; comentario: string }[];
  promedioGeneral: number;
}