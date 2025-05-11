import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { GeneralLoadingSpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-campus-vista',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, GeneralLoadingSpinnerComponent],
  templateUrl: './campus-vista.component.html',
  styleUrls: ['./campus-vista.component.scss']
})
export class CampusVistaComponent implements OnInit {
  grado: string = '';
  seccion: string = '';
  nivel: string = '';
  nombreCurso: string = '';
  idprofesorCurso: string = '';
  idProfesor: string = ''; // Nuevo campo para idProfesor
  isLoading: boolean = false;
  isDataLoaded: boolean = false;
  loadingMessage: string = 'Cargando secciones y notas...';

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.isLoading = true;
      this.grado = params['grado'] || localStorage.getItem('grado') || '';
      this.seccion = params['seccion'] || localStorage.getItem('seccion') || '';
      this.nivel = params['nivel'] || localStorage.getItem('nivel') || '';
      this.nombreCurso = params['nombreCurso'] || localStorage.getItem('nombreCurso') || '';
      this.idprofesorCurso = params['idProfesorCurso'] || localStorage.getItem('idProfesorCurso') || '';
      this.idProfesor = localStorage.getItem('idProfesor') || ''; // Obtener idProfesor
      // Guardar todos los datos en localStorage
      localStorage.setItem('grado', this.grado);
      localStorage.setItem('seccion', this.seccion);
      localStorage.setItem('nivel', this.nivel);
      localStorage.setItem('nombreCurso', this.nombreCurso);
      localStorage.setItem('idProfesorCurso', this.idprofesorCurso); // Guardar idProfesorCurso
      localStorage.setItem('idProfesor', this.idProfesor); // Guardar idProfesor
      this.isLoading = false;
      this.isDataLoaded = true;
    });
  }

  navegarANotas(): void {
    this.router.navigate(['/notas'], {
      queryParams: { grado: this.grado, seccion: this.seccion, nivel: this.nivel }
    });
  }

  navegarASesiones(): void {
    const idProfesorCurso = localStorage.getItem('idProfesorCurso');
    if (idProfesorCurso) {
      this.router.navigate(['/sesiones/profesor', idProfesorCurso]);
    } else {
      console.error('No se encontró idProfesorCurso en localStorage');
    }
  }

  navigateToGrados(nivel: string): void {
    this.router.navigate(['/campus/grados', nivel]);
  }
}