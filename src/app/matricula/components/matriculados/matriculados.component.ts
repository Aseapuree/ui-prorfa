import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';

// Modelo para matriculados
export interface Matriculado {
  matriculaid: string;
  idusuario: string;
  alumnoid: string;
  grado: number;
  seccion: string;
  nivel: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaCreacion?: string;
}

@Component({
  selector: 'app-matriculados',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './matriculados.component.html',
  styleUrls: ['./matriculados.component.scss']
})
export class MatriculadosComponent implements OnInit {
  filterForm!: FormGroup;
  loading = false;
  matriculados: Matriculado[] = [];


  private baseUrl = 'http://localhost:8080/v1/matriculas';

  pdfMake: any;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  async ngOnInit() {
    this.filterForm = this.fb.group({
      grado: [''],
      seccion: [''],
      fechaInicio: [''],
      fechaFin: [''],
      fechaEspecifica: [''],
      nombre: [''],
      apellidoPaterno: [''],
      apellidoMaterno: ['']
    });
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    this.pdfMake = pdfMakeModule.default;
    this.pdfMake.vfs = pdfFontsModule.default.vfs;
    this.matriculados = [];
  }

  onSearch(): void {
    this.loading = true;
    let params = new HttpParams();
    const formValues = this.filterForm.value;
    if (formValues.grado) {
      params = params.set('grado', formValues.grado);
    }
    if (formValues.seccion) {
      params = params.set('seccion', formValues.seccion);
    }
    if (formValues.fechaInicio) {
      params = params.set('fechaInicio', formValues.fechaInicio);
    }
    if (formValues.fechaFin) {
      params = params.set('fechaFin', formValues.fechaFin);
    }
    if (formValues.fechaEspecifica) {
      params = params.set('fecha', formValues.fechaEspecifica);
    }
    if (formValues.nombre) {
      params = params.set('nombre', formValues.nombre);
    }
    if (formValues.apellidoPaterno) {
      params = params.set('apellidoPaterno', formValues.apellidoPaterno);
    }
    if (formValues.apellidoMaterno) {
      params = params.set('apellidoMaterno', formValues.apellidoMaterno);
    }

    this.http.get<Matriculado[]>(`${this.baseUrl}/listar`, { params, withCredentials: true })
      .subscribe({
        next: data => {
          this.matriculados = data;
          this.loading = false;
        },
        error: err => {
          console.error('Error al cargar matrículas:', err);
          this.loading = false;
        }
      });
  }

  imprimirRegistro(registro: Matriculado): void {
    if (!this.pdfMake) return;

    const docDefinition = {
      content: [
        { text: 'Reporte de Matrícula', style: 'header' },
        { text: `Grado: ${registro.grado} - Sección: ${registro.seccion}`, style: 'subheader' },
        { text: `Nivel: ${registro.nivel}`, style: 'subheader' },
        { text: 'Alumno:', style: 'seccion' },
        { text: `Nombre: ${registro.nombre} ${registro.apellidoPaterno} ${registro.apellidoMaterno}`, style: 'contenido' },
        { text: `ID de Matrícula: ${registro.matriculaid}`, style: 'contenido' },
        { text: `Fecha Creación: ${registro.fechaCreacion || 'N/A'}`, style: 'contenido' },
        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }] },
        { text: 'Firma Digital/Sello del Colegio', style: 'firma' }
      ],
      styles: this.getPDFStyles()
    };

    this.pdfMake.createPdf(docDefinition).open();
  }

  private getPDFStyles() {
    return {
      header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
      subheader: { fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5] },
      seccion: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      contenido: { fontSize: 11, margin: [0, 0, 0, 3] },
      firma: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 20, 0, 0] }
    };
  }
}
