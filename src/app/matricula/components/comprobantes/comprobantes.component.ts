import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ComprobanteService } from './../../services/comprobante.service';

interface ComprobanteState {
  dtoComprobante?: any;
}

@Component({
  selector: 'app-comprobante',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comprobantes.component.html',
  styleUrls: ['./comprobantes.component.scss']
})
export class ComprobanteComponent implements OnInit {
  pdfMake: any;
  comprobante: any;

  colegioInfo = {
    nombre: 'Colegio Nacional Juan Apóstol 11578',
    direccion: 'Calle Principal 123, Chiclayo, Lambayeque',
    telefono: '01-987654321',
    email: 'contacto@colegiojuanapostol.edu.pe',
    ruc: '20123456789'
  };

  constructor(
    private ComprobanteService: ComprobanteService,
    private router: Router
  ) {}

  async ngOnInit() {
    // Cargar pdfMake dinámicamente
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    this.pdfMake = pdfMakeModule.default;
    this.pdfMake.vfs = pdfFontsModule.default.vfs;


    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as ComprobanteState;
    if (state?.dtoComprobante) {
      this.comprobante = state.dtoComprobante;
    } else {
      this.ComprobanteService.obtenerComprobantes().subscribe({
        next: (data) => {
          this.comprobante = data?.length ? data[data.length - 1] : null;
        },
        error: (err) => console.error('Error al obtener comprobantes:', err)
      });
    }
  }

  generarComprobantePago() {
    if (!this.pdfMake || !this.comprobante) return;

    const docDefinition = {
      content: [
        { text: this.colegioInfo.nombre, style: 'header' },
        { text: this.colegioInfo.direccion, style: 'subheader' },
        { text: `Teléfono: ${this.colegioInfo.telefono} | Email: ${this.colegioInfo.email}`, style: 'subheader' },
        { text: `RUC: ${this.colegioInfo.ruc}`, style: 'subheader' },
        { text: 'COMPROBANTE DE PAGO', style: 'titulo' },
        { text: `Fecha de Emisión: ${this.formatearFecha(this.comprobante.fechaCreacion)}`, style: 'subtitulo' },

        { text: 'DATOS DEL APODERADO', style: 'seccion' },
        { text: `Nombre: ${this.comprobante.apoderadoNombre || 'N/A'}`, style: 'contenido' },
        { text: `DNI: ${this.comprobante.apoderadoDocumento || 'N/A'}`, style: 'contenido' },
        { text: `Contacto: ${this.comprobante.apoderadoTelefono || 'N/A'}`, style: 'contenido' },

        { text: 'DETALLES DE PAGO', style: 'seccion' },
        {
          ul: [
            `Matrícula 2025: S/ ${this.comprobante.montoMatricula || 'N/A'}`,
            `Otros conceptos: S/ ${this.comprobante.montoOtros || 'N/A'}`,
            { text: `TOTAL PAGADO: S/ ${this.comprobante.totalPago || 'N/A'}`, bold: true }
          ],
          style: 'contenido'
        },
        { text: `Forma de Pago: ${this.comprobante.metodoPago || 'Efectivo'}`, style: 'contenido' },

        { text: 'Nota Legal:', style: 'nota' },
        { text: 'Este comprobante debe ser conservado...', style: 'nota' },

        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }] },
        { text: 'Firma Digital/Sello del Colegio', style: 'firma' },
        { text: 'Gracias por confiar en nuestra institución...', style: 'agradecimiento' }
      ],
      styles: this.estilosPDF()
    };

    this.pdfMake.createPdf(docDefinition).open();
  }

  generarComprobanteMatricula() {
    if (!this.pdfMake || !this.comprobante) return;

    const docDefinition = {
      content: [
        { text: this.colegioInfo.nombre, style: 'header' },
        { text: this.colegioInfo.direccion, style: 'subheader' },
        { text: `Teléfono: ${this.colegioInfo.telefono} | Email: ${this.colegioInfo.email}`, style: 'subheader' },
        { text: 'COMPROBANTE DE MATRÍCULA', style: 'titulo' },
        { text: `Fecha de Emisión: ${this.formatearFecha(this.comprobante.fechaCreacion)}`, style: 'subtitulo' },

        { text: 'DATOS DEL ESTUDIANTE', style: 'seccion' },
        { text: `Nombre: ${this.comprobante.alumnoNombre || 'N/A'}`, style: 'contenido' },
        { text: `DNI: ${this.comprobante.alumnoDocumento || 'N/A'}`, style: 'contenido' },
        { text: `Fecha Nacimiento: ${this.formatearFecha(this.comprobante.alumnoFechaNacimiento)}`, style: 'contenido' },
        { text: `Grado: ${this.comprobante.grado || 'N/A'} - Sección: ${this.comprobante.seccion || 'N/A'}`, style: 'contenido' },
        { text: `Código Estudiante: STU-2025-${this.comprobante.codigoAlumno || '000000'}`, style: 'contenido' },

        { text: 'DATOS DEL APODERADO', style: 'seccion' },
        { text: `Nombre: ${this.comprobante.apoderadoNombre || 'N/A'}`, style: 'contenido' },
        { text: `DNI: ${this.comprobante.apoderadoDocumento || 'N/A'}`, style: 'contenido' },
        { text: `Contacto: ${this.comprobante.apoderadoTelefono || 'N/A'}`, style: 'contenido' },

        { text: 'ESTADO DE MATRÍCULA', style: 'seccion' },
        { text: 'Confirmado - Documentos validados', style: 'contenido' },
        { text: `Código de Matrícula: ${this.comprobante.codigoMatricula || 'MTRC-00000'}`, style: 'contenido' },

        { text: 'OBSERVACIONES', style: 'seccion' },
        { text: this.comprobante.observaciones || 'Documentación completa...', style: 'contenido' },

        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }] },
        { text: 'Firma Digital/Sello del Colegio', style: 'firma' },
        { text: 'Este comprobante es oficial y confirma...', style: 'nota' }
      ],
      styles: this.estilosPDF()
    };

    this.pdfMake.createPdf(docDefinition).open();
  }

  private estilosPDF() {
    return {
      header: { fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 5] },
      subheader: { fontSize: 9, alignment: 'center', margin: [0, 0, 0, 3] },
      titulo: { fontSize: 16, bold: true, alignment: 'center', margin: [0, 10, 0, 10] },
      subtitulo: { fontSize: 10, alignment: 'center', margin: [0, 0, 0, 10] },
      seccion: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
      contenido: { fontSize: 10, margin: [0, 0, 0, 3] },
      nota: { fontSize: 8, alignment: 'center', margin: [0, 10, 0, 3] },
      firma: { fontSize: 9, bold: true, alignment: 'center', margin: [0, 10, 0, 3] },
      agradecimiento: { fontSize: 9, alignment: 'center', color: '#555' }
    };
  }

  private formatearFecha(fechaStr: string): string {
    if (!fechaStr) return 'N/A';
    const dateObj = new Date(fechaStr);
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    return dateObj.toLocaleDateString('es-PE');
  }
}
