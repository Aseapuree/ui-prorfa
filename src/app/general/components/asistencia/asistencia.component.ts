import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatriculaService } from '../../Services/dtomatricula.service';
import { DTOAsistenciaService } from '../../Services/dtoasistencia.service';
import { AlertComponent } from '../../../campus/components/shared/alert/alert.component';
import { DTOAsistencia, AlumnoAsistencia, AsistenciaResponse } from '../../Interface/DTOAsistencia';

interface Alumno {
  idalumno: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  asistencia?: boolean;
  idAsistencia?: string;
}

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertComponent],
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.scss']
})
export class AsistenciaComponent implements OnInit {
  @Input() idSesion: string = '';
  @Input() idProfesorCurso: string | null = null;
  @Input() idAlumnoCurso: string | null = null;
  @Input() idCurso: string | null = null;
  @Input() rolUsuario: string | null = null;

  bloqueado = true;
  fechaActual: Date = new Date();
  alumnos: Alumno[] = [];
  alertMessage: string | null = null;
  alertType: 'error' | 'success' = 'error';
  asistenciasPrevias: AsistenciaResponse[] = [];

  constructor(
    private matriculaService: MatriculaService,
    private asistenciaService: DTOAsistenciaService
  ) {}

  ngOnInit(): void {
    console.log('Asistencia - idSesion:', this.idSesion);
    console.log('Asistencia - idProfesorCurso:', this.idProfesorCurso);
    console.log('Asistencia - idAlumnoCurso:', this.idAlumnoCurso);
    console.log('Asistencia - idCurso:', this.idCurso);
    console.log('Asistencia - rolUsuario:', this.rolUsuario);

    console.log('Contenido de localStorage:', Object.fromEntries(Object.entries(localStorage)));

    this.cargarAlumnos();
  }

  async cargarAlumnos(): Promise<void> {
    try {
      const grado = localStorage.getItem('grado');
      const seccion = localStorage.getItem('seccion');
      const nivel = localStorage.getItem('nivel');

      console.log('Valores desde localStorage:', { grado, seccion, nivel });

      if (grado && seccion && nivel) {
        const response = await this.matriculaService.getAlumnosPorGradoSeccionYNivel(grado, seccion, nivel).toPromise();
        console.log('Respuesta de la API (alumnos):', response);

        if (response && response.code === 200 && response.data) {
          this.alumnos = response.data.map((alumno: Alumno) => ({
            ...alumno,
            asistencia: false,
            idAsistencia: undefined
          }));
          console.log('Alumnos cargados:', this.alumnos);
          await this.cargarAsistenciasPrevias();
        } else {
          console.error('No se encontraron alumnos:', response);
          this.alumnos = [];
        }
      } else {
        console.error('Faltan datos en localStorage:', { grado, seccion, nivel });
        this.alumnos = [];
      }
    } catch (error) {
      console.error('Error al cargar los alumnos:', error);
      this.alumnos = [];
    }
  }

  async cargarAsistenciasPrevias(): Promise<void> {
    if (!this.idSesion) {
      console.error('No se proporcionó idSesion');
      return;
    }

    try {
      console.log('Cargando asistencias previas para idSesion:', this.idSesion);
      const response = await this.asistenciaService.listarAsistenciasPorSesion(this.idSesion).toPromise();
      console.log('Respuesta de listarAsistenciasPorSesion:', response);

      if (response && response.code === 200 && response.data && response.data.length > 0) {
        this.asistenciasPrevias = response.data;

        const asistenciasPorAlumno = new Map<string, AsistenciaResponse[]>();
        response.data.forEach((asistencia: AsistenciaResponse) => {
          if (!asistenciasPorAlumno.has(asistencia.idAlumno)) {
            asistenciasPorAlumno.set(asistencia.idAlumno, []);
          }
          asistenciasPorAlumno.get(asistencia.idAlumno)!.push(asistencia);
        });

        asistenciasPorAlumno.forEach((asistencias: AsistenciaResponse[], idAlumno: string) => {
          asistencias.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
          const asistenciaMasReciente = asistencias[0];

          const alumno = this.alumnos.find(a => a.idalumno === idAlumno);
          if (alumno) {
            alumno.asistencia = asistenciaMasReciente.asistio;
            alumno.idAsistencia = asistenciaMasReciente.idAsistencia;
            console.log(`Actualizada asistencia para ${alumno.nombre} ${alumno.apellidoPaterno}: ${alumno.asistencia}, idAsistencia: ${alumno.idAsistencia}`);
          } else {
            console.warn(`No se encontró alumno con id: ${idAlumno}`);
          }
        });

        console.log('Alumnos después de cargar asistencias:', this.alumnos);
      } else {
        console.warn('No se encontraron asistencias previas o respuesta inválida:', response);
        this.asistenciasPrevias = [];
      }
    } catch (error) {
      console.error('Error al cargar las asistencias previas:', error);
      this.asistenciasPrevias = [];
    }
  }

  async guardarAsistencia(): Promise<void> {
    if (!this.idSesion) {
      this.alertMessage = 'No se proporcionó el ID de la sesión';
      this.alertType = 'error';
      setTimeout(() => (this.alertMessage = null), 3000);
      return;
    }

    try {
      const grado = localStorage.getItem('grado');
      const seccion = localStorage.getItem('seccion');
      const nivel = localStorage.getItem('nivel');
      let idCurso = this.idCurso || localStorage.getItem('idCurso');

      console.log('Valores para asistencia:', { idSesion: this.idSesion, grado, seccion, nivel, idCurso });

      if (!grado || !seccion || !nivel) {
        throw new Error('Faltan datos de grado, sección o nivel en localStorage');
      }
      if (!idCurso) {
        throw new Error('No se encontró idCurso en los inputs ni en localStorage. Por favor, verifica la configuración del curso.');
      }

      const listaAlumnos: AlumnoAsistencia[] = this.alumnos
        .filter(alumno => alumno.asistencia !== undefined)
        .map(alumno => ({
          alumnoId: alumno.idalumno,
          asistio: alumno.asistencia ? true : false,
          idAsistencia: alumno.idAsistencia
        }));

      // Usar la fecha de las asistencias previas si existen, o una nueva fecha si es un registro nuevo
      let fechaFormatted: string;
      if (this.asistenciasPrevias.length > 0) {
        // Tomar la fecha de la primera asistencia previa (todas deberían tener la misma fecha para la misma sesión)
        fechaFormatted = this.asistenciasPrevias[0].fecha.replace('T', ' ') + '.000';
      } else {
        const fecha = new Date();
        fechaFormatted = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')} ${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}:${fecha.getSeconds().toString().padStart(2, '0')}.000`;
      }

      const asistencia: DTOAsistencia = {
        idSesion: this.idSesion,
        grado,
        seccion,
        nivel,
        idCurso,
        fechaAsistencia: fechaFormatted,
        listaAlumnos
      };

      console.log('Asistencia a enviar:', asistencia);
      console.log('fechaAsistencia enviada:', asistencia.fechaAsistencia);

      let response;
      if (this.asistenciasPrevias.length > 0) {
        response = await this.asistenciaService.editarAsistencia(asistencia).toPromise();
        console.log('Respuesta de edición:', response);
      } else {
        response = await this.asistenciaService.registrarAsistencia(asistencia).toPromise();
        console.log('Respuesta de registro:', response);
      }

      if (response && response.code !== 200) {
        throw new Error(`Error al ${this.asistenciasPrevias.length > 0 ? 'editar' : 'registrar'} asistencia: ${response.message}`);
      }

      this.alertMessage = 'Asistencia guardada con éxito';
      this.alertType = 'success';
      setTimeout(() => (this.alertMessage = null), 3000);

      // Recargar asistencias para reflejar los cambios
      await this.cargarAsistenciasPrevias();
    } catch (error: any) {
      console.error('Error al guardar asistencias:', error);
      this.alertMessage = error.message || `Ocurrió un error inesperado: ${error.statusText || 'Unknown Error'}`;
      this.alertType = 'error';
      setTimeout(() => (this.alertMessage = null), 3000);
    }
  }

  toggleBloqueo(): void {
    this.bloqueado = !this.bloqueado;
  }
}