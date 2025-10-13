import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { GeneralLoadingSpinnerComponent } from '../../../general/components/spinner/spinner.component';
import { NotasService } from '../../../campus/services/notas.service';
import { DTOResponse } from '../../../campus/interface/DTOResponse';
import { DTOAlumnoNotas, DTOSesionNotas, DTONotaResponse } from '../../../campus/interface/DTONota';
import { catchError, of } from 'rxjs';

interface CursoNota {
  nombre: string;
  notasPorCiclo: (number | string)[];
}

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

  notas = {
    cursos: [] as CursoNota[],
    ciclos: ['Bimestre I', 'Bimestre II', 'Bimestre III', 'Bimestre IV']
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notasService: NotasService
  ) {}

  ngOnInit(): void {
  this.idAlumno = localStorage.getItem('idAlumno') || '';
  this.nombreAlumno = localStorage.getItem('nombreAlumno') || '';
  this.grado = localStorage.getItem('grado') || 'No especificado';
  this.seccion = localStorage.getItem('seccion') || 'No especificado';
  this.nivel = localStorage.getItem('nivel') || 'Secundaria';

  if (!this.idAlumno) {
    console.error('No se encontró idAlumno');
    return;
  }

  console.log('Cargando boleta para:', {
    idAlumno: this.idAlumno,
    nombreAlumno: this.nombreAlumno,
    grado: this.grado,
    seccion: this.seccion,
    nivel: this.nivel
  });

  this.loadNotas();
}


  loadNotas(): void {
    this.isLoading = true;

    if (!this.idAlumno) {
      console.error('No se encontró idAlumno');
      this.isLoading = false;
      return;
    }

    this.notasService.obtenerNotasPorAlumno(this.idAlumno).pipe(
      catchError(error => {
        console.error('Error al cargar notas:', error);
        this.isLoading = false;
        return of(null);
      })
    ).subscribe((response: DTOResponse<DTOAlumnoNotas> | null) => {
      if (response && response.code === 200 && response.data) {
        const { alumno, sesiones } = response.data;
        this.nombreAlumno = `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno}`.trim();
        this.grado = alumno.grado;
        this.seccion = alumno.seccion;
        this.nivel = alumno.nivel;

        console.log('Datos crudos de sesiones:', sesiones);

        // Agrupar sesiones por curso
        const sesionesPorCurso = this.groupSesionesByCurso(sesiones);
        //console.log('Sesiones agrupadas por curso:', sesionesPorCurso);

        this.notas.cursos = sesionesPorCurso.map(({ cursoNombre, sesionData }) => {
          //console.log(`Procesando curso: ${cursoNombre}, Sesiones:`, sesionData);
          const notasPorBimestre = this.groupNotasByBimestre(sesionData);
          //console.log(`Notas por bimestre para ${cursoNombre}:`, notasPorBimestre);

          // Obtener la competencia del curso desde la primera sesión (asumiendo que es la misma para todas)
          const competencia = sesionData[0]?.sesion.infoCurso.curso.competencias[0]?.nombre || null;
          //console.log(`Competencia detectada para ${cursoNombre}:`, competencia);

          const promedios = this.notas.ciclos.map(bimestre => this.calcularPromedio(notasPorBimestre[bimestre], competencia));
          //console.log(`Promedios calculados para ${cursoNombre}:`, promedios);
          return { nombre: cursoNombre, notasPorCiclo: promedios };
        });
      } else {
        console.warn('No se encontraron datos de notas');
        this.notas.cursos = [];
      }
      this.isLoading = false;
    });
  }

  groupSesionesByCurso(sesiones: DTOSesionNotas[]): { cursoNombre: string; sesionData: DTOSesionNotas[] }[] {
    const cursoMap = new Map<string, DTOSesionNotas[]>();
    sesiones.forEach(sesion => {
      const cursoNombre = sesion.sesion.infoCurso.curso.nombre;
      if (!cursoMap.has(cursoNombre)) {
        cursoMap.set(cursoNombre, []);
      }
      cursoMap.get(cursoNombre)!.push(sesion);
    });
    return Array.from(cursoMap.entries()).map(([cursoNombre, sesionData]) => ({ cursoNombre, sesionData }));
  }

  groupNotasByBimestre(sesionData: DTOSesionNotas[]): { [key: string]: DTONotaResponse[] } {
    const bimestres: { [key: string]: DTONotaResponse[] } = {
      'Bimestre I': [],
      'Bimestre II': [],
      'Bimestre III': [],
      'Bimestre IV': []
    };

    sesionData.forEach(({ notas }) => {
      notas.forEach((nota: DTONotaResponse) => {
        //console.log('Procesando nota:', nota);
        const fecha = new Date(nota.fechaRegistro || '');
        console.log(`Fecha de la nota: ${nota.fechaRegistro}, Mes: ${fecha.getMonth() + 1}`);
        const month = fecha.getMonth() + 1;
        let bimestreKey: string;
        if (1 <= month && month <= 3) bimestreKey = 'Bimestre I';
        else if (4 <= month && month <= 6) bimestreKey = 'Bimestre II';
        else if (7 <= month && month <= 9) bimestreKey = 'Bimestre III';
        else bimestreKey = 'Bimestre IV';
        bimestres[bimestreKey].push(nota);
      });
    });

    return bimestres;
  }

  calcularPromedio(notasBimestre: DTONotaResponse[], competencia: string | null): number | string {
    if (notasBimestre.length === 0) return '';

    let suma = 0;
    notasBimestre.forEach(nota => {
      const peso = competencia === 'Resuelve problemas utilizando conceptos' ? 1.2 : 1; // Usar la competencia del curso
      const valorNota = nota.nota ?? 0;
      suma += valorNota * peso;
      console.log(`Nota: ${valorNota}, Peso: ${peso}, Suma parcial: ${suma}`);
    });
    //ajustar para redondear al entero más cercano
      const promedio = Math.round(suma / notasBimestre.length);
      console.log(`Promedio final: ${promedio}`);
      return promedio;
  }

  formatNota(nota: number | string): string {
    return typeof nota === 'number' ? nota.toFixed(2) : nota;
  }

  regresar(): void {
    this.router.navigate(['/app-lista-alumnos'], {
      queryParams: { usuarioId: localStorage.getItem('usuarioId'), nivel: this.nivel }
    });
  }

  imprimir(): void {
  if (!this.idAlumno) {
    console.error('No se encontró idAlumno para generar PDF');
    return;
  }

  this.notasService.generarBoletaPdf(this.idAlumno).subscribe(
    (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      
      // Abrir el archivo en una nueva ventana para vista previa
      const ventanaPreview = window.open(url, '_blank');
      if (!ventanaPreview) {
        console.error('No se pudo abrir la ventana de vista previa');
        return;
      }
      // Después de mostrarlo en la ventana, revocar el objeto URL
      ventanaPreview.onload = () => {
        window.URL.revokeObjectURL(url);
      };
      console.log('Vista previa del PDF abierta');
    },
    (error) => {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Intenta de nuevo.');
    }
  );
}

}