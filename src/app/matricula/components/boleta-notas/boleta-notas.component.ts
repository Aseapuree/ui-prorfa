import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { GeneralLoadingSpinnerComponent } from '../../../general/components/spinner/spinner.component';

@Component({
  selector: 'app-boleta-notas',
  standalone: true,
  imports: [CommonModule, RouterModule, GeneralLoadingSpinnerComponent],
  templateUrl: './boleta-notas.component.html',
  styleUrls: ['./boleta-notas.component.scss']
})
export class BoletaNotasComponent implements OnInit {
  idAlumno: string = '';
  nombreAlumno: string = '';
  grado: string = '';
  seccion: string = '';
  nivel: string = '';
  isLoading: boolean = false;

  // Datos estáticos de ejemplo con bimestres
  notas = {
    cursos: [
      { nombre: 'Matemáticas', notasPorCiclo: [85, 90, 88, 92] },
      { nombre: 'Ciencias', notasPorCiclo: [78, 82, 80, 85] },
      { nombre: 'Lenguaje', notasPorCiclo: [90, 88, 92, 95] }
    ],
    ciclos: ['Bimestre I', 'Bimestre II', 'Bimestre III', 'Bimestre IV']
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.idAlumno = params['idAlumno'] || '';
      this.nombreAlumno = params['alumno'] || '';
      this.grado = params['grado'] || 'No especificado';
      this.seccion = params['seccion'] || 'No especificado';
      this.nivel = params['nivel'] || 'Secundaria';
    });
  }

  // Método para regresar a la lista de alumnos
  regresar(): void {
    this.router.navigate(['/lista-alumnos'], {
      queryParams: { usuarioId: localStorage.getItem('usuarioId'), nivel: this.nivel }
    });
  }

  // Método para imprimir la boleta
  imprimir(): void {
    window.print();
  }
}