import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GeneralLoadingSpinnerComponent } from '../../../general/components/spinner/spinner.component';
import { NotasService } from '../../../campus/services/notas.service';
import { catchError, map, throwError } from 'rxjs';
import { PaginationComponent } from '../../../general/components/pagination/pagination.component';

@Component({
  selector: 'app-lista-alumnos',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, GeneralLoadingSpinnerComponent, PaginationComponent],
  templateUrl: './lista-alumnos.component.html',
  styleUrl: './lista-alumnos.component.scss'
})
export class ListaAlumnosComponent implements OnInit {
  alumnos: LocalAlumno[] = [];
  isLoading: boolean = false;
  isDataLoaded: boolean = false;
  loadingMessage: string = 'Cargando lista de alumnos...';
  grado: string = '';
  seccion: string = '';
  nivel: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private notasService: NotasService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.grado = params['grado'] || localStorage.getItem('grado') || '5°';
      this.seccion = params['seccion'] || localStorage.getItem('seccion') || 'B';
      this.nivel = params['nivel'] || localStorage.getItem('nivel') || 'Secundaria';
      this.loadAlumnos();
    });
  }

  loadAlumnos(): void {
    this.isLoading = true;
    // Placeholder: Llamada al servicio para obtener alumnos por grado y sección
    // Ejemplo: this.notasService.listarAlumnosPorGradoSeccion(this.grado, this.seccion).subscribe(...)
    // Simulación de datos por ahora
    this.alumnos = [
      { id: '1', nombre: 'Juan Pérez', grado: this.grado, seccion: this.seccion },
      { id: '2', nombre: 'María Gómez', grado: this.grado, seccion: this.seccion },
      { id: '3', nombre: 'Carlos López', grado: this.grado, seccion: this.seccion }
    ];
    this.isLoading = false;
    this.isDataLoaded = true;
  }

  verBoleta(idAlumno: string, nombreAlumno: string): void {
    this.router.navigate(['/notas-bimestrales'], {
      queryParams: { idAlumno, alumno: nombreAlumno, nivel: this.nivel, grado: this.grado, seccion: this.seccion }
    });
  }

  regresar(): void {
    this.router.navigate(['/campus-vista'], { queryParams: { grado: this.grado, seccion: this.seccion, nivel: this.nivel } });
  }
}

interface LocalAlumno {
  id: string;
  nombre: string;
  grado: string;
  seccion: string;
}