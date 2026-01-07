import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatriculaService } from '../../Services/dtomatricula.service';
import { DTOAsistenciaService } from '../../Services/dtoasistencia.service';
import { AlertComponent } from '../../../campus/components/shared/alert/alert.component';
import { DTOAsistencia, AlumnoAsistencia, AsistenciaResponse } from '../../Interface/DTOAsistencia';
import { Router } from '@angular/router';  // FIX: Import para recuperar state

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
  @Input() fechaAsignada: string | null = null; // Nueva propiedad para la fecha de la sesión

  bloqueado = true;
  fechaSesion: Date | null = null; // Reemplaza fechaActual
  alumnos: Alumno[] = [];
  alertMessage: string | null = null;
  alertType: 'error' | 'success' = 'error';
  asistenciasPrevias: AsistenciaResponse[] = [];
  ultimaActualizacion: Date | null = null; // Nueva propiedad para la fecha de última actualización

  constructor(
    private matriculaService: MatriculaService,
    private asistenciaService: DTOAsistenciaService,
    private router: Router  // FIX: Inyectar para recuperar state
  ) {}

  ngOnInit(): void {
    console.log('Asistencia - idSesion:', this.idSesion);
    console.log('Asistencia - idProfesorCurso:', this.idProfesorCurso);
    console.log('Asistencia - idAlumnoCurso:', this.idAlumnoCurso);
    console.log('Asistencia - idCurso:', this.idCurso);
    console.log('Asistencia - rolUsuario:', this.rolUsuario);
    console.log('Asistencia - fechaAsignada:', this.fechaAsignada);

    // FIX: Recuperar fecha del router state (prioridad alta) o Input
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as any;
    let fechaFromState = state?.fechaAsignada || this.fechaAsignada;  // State > Input

    // FIX: Fallback a localStorage si aún null (key por idSesion)
    if (!fechaFromState && this.idSesion) {
      fechaFromState = localStorage.getItem(`fechaSesion_${this.idSesion}`) || null;
      console.log('Asistencia - fechaAsignada from LS fallback:', fechaFromState);
    }

    console.log('Asistencia - fechaAsignada final (state/Input/LS):', fechaFromState);

    // FIX: Usar fechaFromState en el if (reemplaza this.fechaAsignada)
    if (fechaFromState) {
      this.fechaAsignada = fechaFromState;  // Actualiza para consistencia
      this.fechaSesion = new Date(fechaFromState);
    } else {
      console.warn('No se proporcionó fechaAsignada, usando fecha actual como fallback');
      this.fechaSesion = new Date();
      this.alertMessage = 'Advertencia: No se proporcionó la fecha de la sesión. Se usará la fecha actual.';
      setTimeout(() => (this.alertMessage = null), 5000);
    }

    console.log('Contenido de localStorage:', Object.fromEntries(Object.entries(localStorage)));

    this.cargarAlumnos();
  }

  async cargarAlumnos(): Promise<void> {
  try {
    let grado = localStorage.getItem('grado');
    let seccion = localStorage.getItem('seccion');
    let nivel = localStorage.getItem('nivel');

    console.log('Valores raw desde localStorage:', { grado, seccion, nivel });

    // FIX: Limpia 'grado' removiendo "°" o "mo" para enviar solo número (ej., "5°" → "5")
    if (grado) {
      let cleanGrado = grado.replace(/[°mo]/g, '').trim();  // Remueve símbolos, deja solo dígitos
      if (cleanGrado === '') {
        throw new Error('Grado inválido en localStorage: ' + grado);
      }
      grado = cleanGrado;  // Ahora 'grado' es "5" (string, pero backend lo convierte a int)
    }

    // Encoding para otros params (seccion/nivel, si tienen chars especiales)
    if (seccion) seccion = encodeURIComponent(seccion);
    if (nivel) nivel = encodeURIComponent(nivel);

    console.log('Valores limpios/encoded para API:', { grado, seccion, nivel });

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
  } catch (error: unknown) {
    // Type guard para narrowing
    if (error && typeof error === 'object' && 'status' in error && (error as any).status === 500) {
      console.error('Posible issue de encoding en backend. Verifica logs de Spring Boot.');
    }
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
      console.log('Respuesta completa de listarAsistenciasPorSesion:', response);
  
      if (response && response.code === 200 && response.data && response.data.length > 0) {
        this.asistenciasPrevias = response.data;
        console.log('Asistencias previas sin filtrar:', this.asistenciasPrevias);
  
        // Depurar las fechas antes de parsear
        console.log('Fechas de asistencias previas:', this.asistenciasPrevias.map(a => a.fecha));
  
        // Calcular la fecha de última actualización usando TODAS las asistencias
        const fechas = this.asistenciasPrevias.map(asistencia => {
          const fecha = new Date(asistencia.fecha);
          if (isNaN(fecha.getTime())) {
            console.error(`Fecha inválida encontrada en asistencia: ${asistencia.fecha}`);
            return 0; // Si la fecha es inválida, usar 0 para no romper el cálculo
          }
          return fecha.getTime();
        }).filter(time => time !== 0); // Filtrar fechas inválidas
  
        if (fechas.length > 0) {
          const fechaMasReciente = Math.max(...fechas);
          this.ultimaActualizacion = new Date(fechaMasReciente);
          console.log('Última actualización calculada (sin filtro):', this.ultimaActualizacion);
        } else {
          console.warn('No se encontraron fechas válidas para calcular ultimaActualizacion');
          this.ultimaActualizacion = null;
        }
  
        // Filtrar asistencias por la fecha de la sesión (solo año, mes, día) para los checkboxes
        const fechaSesionStr = this.fechaSesion
          ? `${this.fechaSesion.getFullYear()}-${(this.fechaSesion.getMonth() + 1).toString().padStart(2, '0')}-${this.fechaSesion.getDate().toString().padStart(2, '0')}`
          : null;
  
        console.log('Fecha de sesión para filtrar:', fechaSesionStr);
  
        const asistenciasFiltradas = fechaSesionStr
          ? this.asistenciasPrevias.filter(asistencia => {
              const fechaAsistencia = new Date(asistencia.fecha);
              const fechaAsistenciaStr = `${fechaAsistencia.getFullYear()}-${(fechaAsistencia.getMonth() + 1).toString().padStart(2, '0')}-${fechaAsistencia.getDate().toString().padStart(2, '0')}`;
              console.log(`Comparando fecha de asistencia ${fechaAsistenciaStr} con fecha de sesión ${fechaSesionStr}`);
              return fechaAsistenciaStr === fechaSesionStr;
            })
          : this.asistenciasPrevias;  
  
        console.log('Asistencias filtradas por fecha:', asistenciasFiltradas);
  
        // Usar las asistencias filtradas solo para los checkboxes, sin sobrescribir this.asistenciasPrevias
        let asistenciasParaCheckboxes = asistenciasFiltradas;
        if (asistenciasFiltradas.length === 0) {
          console.warn('No se encontraron asistencias para la fecha de la sesión. Usando todas las asistencias disponibles para los checkboxes.');
          asistenciasParaCheckboxes = this.asistenciasPrevias; // Usar todas las asistencias disponibles
        }
  
        const asistenciasPorAlumno = new Map<string, AsistenciaResponse[]>();
        asistenciasParaCheckboxes.forEach((asistencia: AsistenciaResponse) => {
          console.log(`Procesando asistencia para idAlumno: ${asistencia.idAlumno}, asistio: ${asistencia.asistio}, fecha: ${asistencia.fecha}`);
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
        this.ultimaActualizacion = null; // Si no hay asistencias, no hay fecha de última actualización
      }
    } catch (error) {
      console.error('Error al cargar las asistencias previas:', error);
      this.asistenciasPrevias = [];
      this.ultimaActualizacion = null;
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
    let grado = localStorage.getItem('grado');
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

    // FIX: Limpia 'grado' removiendo "°" o "mo" para enviar solo número (ej., "5°" → "5")
    let cleanGrado = grado.replace(/[°mo]/g, '').trim();
    if (cleanGrado === '') {
      throw new Error('Grado inválido en localStorage: ' + grado);
    }
    grado = cleanGrado;  // Ahora 'grado' es "5" (limpio para backend)

    console.log('Grado limpio para backend:', grado);  // Log para debug

    // Log del estado de los alumnos antes de mapear
    console.log('Estado de los alumnos antes de enviar:', this.alumnos);

    const listaAlumnos: AlumnoAsistencia[] = this.alumnos
      .filter(alumno => alumno.asistencia !== undefined)
      .map(alumno => ({
        alumnoId: alumno.idalumno,
        asistio: alumno.asistencia ? true : false,
        idAsistencia: alumno.idAsistencia
      }));

    // Log detallado de listaAlumnos
    console.log('Lista de alumnos a enviar:', listaAlumnos);

    // Usar la fecha de la sesión (fechaAsignada), con fallback a la fecha actual
    let fechaFormatted: string;
    if (!this.fechaAsignada) {
      console.warn('fechaAsignada no está disponible, usando la fecha actual como fallback');
      const fechaActual = new Date();
      fechaFormatted = `${fechaActual.getFullYear()}-${(fechaActual.getMonth() + 1).toString().padStart(2, '0')}-${fechaActual.getDate().toString().padStart(2, '0')} ${fechaActual.getHours().toString().padStart(2, '0')}:${fechaActual.getMinutes().toString().padStart(2, '0')}:${fechaActual.getSeconds().toString().padStart(2, '0')}.000`;
      this.alertMessage = 'Advertencia: No se proporcionó la fecha de la sesión. Se usará la fecha actual.';
      this.alertType = 'error'; // Cambiado a 'error' para mayor visibilidad
      setTimeout(() => (this.alertMessage = null), 5000);
    } else {
      const fecha = new Date(this.fechaAsignada);
      fechaFormatted = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')} ${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}:${fecha.getSeconds().toString().padStart(2, '0')}.000`;
    }

    const asistencia: DTOAsistencia = {
      idSesion: this.idSesion,
      grado,  // FIX: Usa el grado limpio
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
      console.log('Editando asistencia existente...');
      response = await this.asistenciaService.editarAsistencia(asistencia).toPromise();
      console.log('Respuesta de edición:', response);
    } else {
      console.log('Registrando nueva asistencia...');
      response = await this.asistenciaService.registrarAsistencia(asistencia).toPromise();
      console.log('Respuesta de registro:', response);
    }

    if (response && response.code !== 200) {
      throw new Error(`Error al ${this.asistenciasPrevias.length > 0 ? 'editar' : 'registrar'} asistencia: ${response.message}`);
    }

    // Mostrar un mensaje más detallado si hay problemas en la respuesta
    if (response && response.data && Array.isArray(response.data) && response.data.length > 0 && response.data[0].includes('No se encontró asistencia')) {
      this.alertMessage = 'No se encontraron asistencias para editar en esta fecha. Intentando registrar como nuevas...';
      setTimeout(() => (this.alertMessage = null), 5000);

      // Forzar registro como nuevas asistencias
      response = await this.asistenciaService.registrarAsistencia(asistencia).toPromise();
      console.log('Respuesta de registro (forzado):', response);

      if (response && response.code !== 200) {
        throw new Error(`Error al registrar asistencia: ${response.message}`);
      }
    }

    this.alertMessage = 'Asistencia guardada con éxito';
    this.alertType = 'success';
    setTimeout(() => (this.alertMessage = null), 3000);

    // Recargar asistencias para reflejar los cambios
    console.log('Recargando asistencias después de guardar...');
    await this.cargarAsistenciasPrevias();
    console.log('Estado de ultimaActualizacion después de recargar:', this.ultimaActualizacion);
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