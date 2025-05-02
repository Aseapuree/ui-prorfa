import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ComprobanteService } from '../../services/comprobante.service';
import { Comprobante } from '../../interfaces/DTOComprobante';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFilePdf, faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-comprobante',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './comprobantes.component.html',
  styleUrls: ['./comprobantes.component.scss']
})
export class ComprobanteComponent implements OnInit {

  comprobante: Comprobante | null = null;
  isLoading = true;
  isMatriculaLoading = false;
  isPagoLoading = false;
  error: string | null = null;
  idMatricula: string | null = null;

  faFilePdf = faFilePdf;
  faSpinner = faSpinner;

  private readonly TIPO_COMPROBANTE_MATRICULA_UUID = 'df61cd5c-5609-45d7-a2ad-1d285cabc958';
  private readonly TIPO_COMPROBANTE_PAGO_UUID = 'b5dc4013-5d65-4969-8342-906ae82ee70c';


  constructor(
    private route: ActivatedRoute,
    private comprobanteService: ComprobanteService,
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.idMatricula = params['idMatricula'];
      console.log('ComprobanteComponent: Received idMatricula from route:', this.idMatricula);

      if (this.idMatricula) {
        this.loadComprobanteDetails(this.idMatricula);
      } else {
        this.error = 'No se proporcionó un ID de matrícula.';
        this.isLoading = false;
      }
    });
  }

  loadComprobanteDetails(idMatricula: string): void {
    this.isLoading = true;
    this.error = null;
    this.comprobanteService.obtenerComprobantePorIdMatricula(idMatricula).subscribe({
      next: (comprobante) => {
        console.log('ComprobanteComponent: Comprobante details loaded:', comprobante);
        this.comprobante = comprobante;
        this.isLoading = false;
        if (!comprobante) {
             this.error = 'No se encontró un comprobante asociado a esta matrícula.';
        } else {
        }
      },
      error: (err) => {
        console.error('ComprobanteComponent: Error loading comprobante details:', err);
        if (err && err.error && err.error.message) {
             this.error = 'Error al cargar los detalles del comprobante: ' + err.error.message;
        } else {
             this.error = 'Error al cargar los detalles del comprobante: ' + (err.message || 'Error desconocido');
        }
        this.isLoading = false;
        this.comprobante = null;
      }
    });
  }

  openPdf(tipo: 'matricula' | 'pago'): void {
    if (!this.idMatricula) {
        console.warn('ComprobanteComponent: idMatricula no disponible para abrir PDF.');
        return;
    }

    let tipoComprobanteUuid: string;
    let filename: string;
    let montoTotal: number | undefined;

    if (tipo === 'matricula') {
      this.isMatriculaLoading = true;
      tipoComprobanteUuid = this.TIPO_COMPROBANTE_MATRICULA_UUID;
      filename = 'comprobante_matricula.pdf';
      montoTotal = this.comprobante?.montototal ? parseFloat(this.comprobante.montototal) : undefined;

    } else {
      this.isPagoLoading = true;
      tipoComprobanteUuid = this.TIPO_COMPROBANTE_PAGO_UUID;
      filename = 'comprobante_pago.pdf';
       montoTotal = this.comprobante?.montototal ? parseFloat(this.comprobante.montototal) : undefined;
    }

    console.log(`ComprobanteComponent: Requesting ${tipo} PDF for matricula ID: ${this.idMatricula} with type UUID: ${tipoComprobanteUuid}`);

    this.comprobanteService.generarPdfDirecto(this.idMatricula, tipoComprobanteUuid, montoTotal).subscribe({
      next: (blob: Blob) => {
        console.log(`ComprobanteComponent: Received ${tipo} PDF Blob of size:`, blob.size);
        const blobUrl = URL.createObjectURL(blob);

        const newTab = window.open(blobUrl, '_blank');

        if (newTab) {
           newTab.onload = () => {
             setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
           };
           setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        } else {
            console.warn('ComprobanteComponent: Pop-up blocked. Could not open PDF in new tab.');
        }


        if (tipo === 'matricula') {
          this.isMatriculaLoading = false;
        } else {
          this.isPagoLoading = false;
        }
      },
      error: (err) => {
        console.error(`ComprobanteComponent: Error generating/fetching ${tipo} PDF:`, err);
        if (err && err.error && err.error.message) {
             this.error = `Error al generar el comprobante de ${tipo}: ` + err.error.message;
        } else {
             this.error = `Error al generar el comprobante de ${tipo}: ` + (err.message || 'Error desconocido');
        }

        if (tipo === 'matricula') {
          this.isMatriculaLoading = false;
        } else {
          this.isPagoLoading = false;
        }
      }
    });
  }
}
