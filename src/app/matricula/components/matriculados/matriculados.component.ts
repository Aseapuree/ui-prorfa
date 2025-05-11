import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';


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
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './matriculados.component.html',
  styleUrls: ['./matriculados.component.scss']
})
export class MatriculadosComponent implements OnInit {
  filterForm!: FormGroup;
  showFilters: boolean = false;
  loading = false;
  matriculados: Matriculado[] = [];
  quickSearch: string = '';
  filterFecha: string = '';
  filterOptions = {
    grado: false,
    seccion: false,
    fecha: false,
    nombre: false,
    apellidoPaterno: false,
    apellidoMaterno: false
  };

  pdfMake: any;
  private baseUrl = 'http://localhost:8080/v1/matriculas';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  async ngOnInit() {
    this.filterForm = this.fb.group({
      grado: [''],
      seccion: [''],
      fechaEspecifica: [''],
      nombre: [''],
      apellidoPaterno: [''],
      apellidoMaterno: ['']
    });
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    this.pdfMake = pdfMakeModule.default;
    this.pdfMake.vfs = pdfFontsModule.default.vfs;
    this.matriculados = [{alumnoid:"12",apellidoMaterno:"FG",apellidoPaterno:"GH",grado:4,idusuario:"456",matriculaid:"45",nivel:"P",seccion:"B",fechaCreacion:"45",nombre:"JH"},
      {alumnoid:"12",apellidoMaterno:"FG",apellidoPaterno:"GH",grado:4,idusuario:"456",matriculaid:"45",nivel:"P",seccion:"B",fechaCreacion:"45",nombre:"JH"},
      {alumnoid:"12",apellidoMaterno:"FG",apellidoPaterno:"GH",grado:4,idusuario:"456",matriculaid:"45",nivel:"P",seccion:"B",fechaCreacion:"45",nombre:"JH"}
    ];
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  private isValidDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  onSearch(): void {
    this.loading = true;
    this.filterForm.reset();

    if (!this.showFilters) {
      if (this.quickSearch) {
        if (!isNaN(Number(this.quickSearch))) {
          this.filterForm.patchValue({ grado: this.quickSearch });
        } else if (this.isValidDate(this.quickSearch)) {
          this.filterForm.patchValue({ fechaEspecifica: this.quickSearch });
        } else {
          this.filterForm.patchValue({ nombre: this.quickSearch });
        }
      }
    } else {
      const update: any = {};
      if (this.filterOptions.grado && !isNaN(Number(this.quickSearch))) {
        update.grado = this.quickSearch;
      }
      if (this.filterOptions.seccion) {
        update.seccion = this.quickSearch;
      }
      if (this.filterOptions.fecha && this.filterFecha) {
        update.fechaEspecifica = this.filterFecha;
      }
      if (this.filterOptions.nombre) {
        update.nombre = this.quickSearch;
      }
      if (this.filterOptions.apellidoPaterno) {
        update.apellidoPaterno = this.quickSearch;
      }
      if (this.filterOptions.apellidoMaterno) {
        update.apellidoMaterno = this.quickSearch;
      }
      this.filterForm.patchValue(update);
    }

    let params = new HttpParams();
    const formValues = this.filterForm.value;
    if (formValues.grado) {
      params = params.set('grado', formValues.grado);
    }
    if (formValues.seccion) {
      params = params.set('seccion', formValues.seccion);
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
