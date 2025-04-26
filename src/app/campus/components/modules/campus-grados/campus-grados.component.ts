import { Component, OnInit } from '@angular/core';
import { CardComponent } from '../../shared/card/card.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProfesorCurso } from '../../../interface/ProfesorCurso';
import { lastValueFrom } from 'rxjs';
import { ProfesorCursoService } from '../../../services/profesor-curso.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-campus-grados',
  standalone: true,
  imports: [RouterModule, CardComponent, NgxPaginationModule, CommonModule],
  templateUrl: './campus-grados.component.html',
  styleUrl: './campus-grados.component.scss',
})
export class CampusGradosComponent implements OnInit{
  nivel: string = '';
  grados: string[] = [];
  selectedGrado: string | null = null;
  profesorcursos: ProfesorCurso[] = [];
  filteredCursos: ProfesorCurso[] = [];
  page: number = 1;
  isDataLoaded: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private profesorCursoService: ProfesorCursoService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.nivel = this.route.snapshot.paramMap.get('nivel') || '';
    this.grados = this.nivel === 'Primaria' ? ['1°', '2°', '3°', '4°', '5°', '6°'] : ['1°', '2°', '3°', '4°', '5°'];
  
    const usuarioId = localStorage.getItem('usuarioId');
    if (usuarioId) {
      try {
        const rawCursos = await lastValueFrom(
          this.profesorCursoService.obtenerCursosPorProfesor(usuarioId)
        );
        console.log('Respuesta cruda del backend:', rawCursos);
  
        // Ajustar el mapeo según la estructura real del backend
        this.profesorcursos = rawCursos.map((item: any) => {
          const cursoData = item.curso || item; // Ajustar según la estructura real
          return {
            idProfesorCurso: item.idProfesorCurso || cursoData.idProfesorCurso || '',
            usuario: item.usuario || cursoData.usuario || {},
            curso: {
              idCurso: cursoData.idCurso || '',
              nombre: cursoData.nombre || 'Curso sin nombre'
            },
            grado: cursoData.grado || item.grado || '',
            seccion: cursoData.seccion || item.seccion || 'Sin sección',
            nivel: cursoData.nivel || item.nivel || this.nivel,
            fechaAsignacion: cursoData.fechaAsignacion || item.fechaAsignacion
              ? new Date(cursoData.fechaAsignacion || item.fechaAsignacion)
              : undefined
          };
        });
        console.log('Cursos mapeados:', this.profesorcursos);
  
        this.isDataLoaded = true;
  
        // Aplicar el filtro si hay un grado seleccionado
        if (this.selectedGrado) {
          this.selectGrado(this.selectedGrado);
        }
      } catch (error) {
        console.error('Error al obtener los cursos:', error);
        this.isDataLoaded = true;
      }
    } else {
      console.error('No se encontró usuarioId en localStorage');
      this.isDataLoaded = true;
    }
  }

  selectGrado(grado: string): void {
    if (this.selectedGrado === grado) {
      this.selectedGrado = null;
      this.filteredCursos = [];
    } else {
      this.selectedGrado = grado;
  
      if (!this.isDataLoaded) {
        console.log('Esperando a que los datos se carguen antes de filtrar');
        return;
      }
  
      const gradoBackend = grado.replace('°', '');
      console.log('Grado seleccionado (backend):', gradoBackend);
  
      if (!this.profesorcursos || this.profesorcursos.length === 0) {
        console.warn('No hay cursos disponibles para filtrar');
        this.filteredCursos = [];
        return;
      }
  
      this.filteredCursos = this.profesorcursos.filter(curso => {
        const matchesGrado = curso.grado === gradoBackend;
        const hasIdCurso = !!curso.curso?.idCurso;
        const hasIdProfesorCurso = !!curso.idProfesorCurso;
        console.log(`Curso: ${curso.curso?.nombre}, Grado: ${curso.grado}, Matches: ${matchesGrado}, Has idCurso: ${hasIdCurso}, Has idProfesorCurso: ${hasIdProfesorCurso}`);
        return matchesGrado && hasIdCurso && hasIdProfesorCurso;
      });
  
      console.log('Cursos filtrados:', this.filteredCursos);
    }
    this.page = 1;
  }

  seleccionarCurso(curso: ProfesorCurso): void {
    const grado = curso.grado ?? '';
    const seccion = curso.seccion ?? 'Sin sección';
    const nivel = curso.nivel ?? this.nivel;
    const idCurso = curso.curso?.idCurso ?? '';
    const idProfesorCurso = curso.idProfesorCurso ?? '';
  
    console.log('Datos del curso seleccionado:', { idCurso, idProfesorCurso, grado, seccion, nivel });
  
    if (idCurso && idProfesorCurso && grado && seccion && nivel) {
      localStorage.setItem('grado', grado);
      localStorage.setItem('seccion', seccion);
      localStorage.setItem('nivel', nivel);
      localStorage.setItem('idCurso', idCurso);
      localStorage.setItem('idProfesorCurso', idProfesorCurso);
  
      console.log('Datos guardados en localStorage:', {
        grado,
        seccion,
        nivel,
        idCurso,
        idProfesorCurso
      });
  
      this.router.navigate(['/sesiones/profesor', idProfesorCurso]);
    } else {
      console.error('Datos esenciales incompletos para el curso:', {
        idCurso,
        idProfesorCurso,
        grado,
        seccion,
        nivel
      });
    }
  }
}
