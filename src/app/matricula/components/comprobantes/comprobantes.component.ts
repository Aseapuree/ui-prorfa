import { ComprobanteService } from './../../services/comprobante.service';
import { NotificationService } from './../../../campus/components/shared/notificaciones/notification.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Comprobante } from '../../interfaces/DTOComprobante';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NotificationComponent } from "../../../campus/components/shared/notificaciones/notification.component";

import {
  faArrowLeft,
  faCalendarAlt,
  faCheckCircle,
  faCircleInfo,
  faDownload,
  faFilePdf,
  faGraduationCap,
  faHashtag,
  faIdCard,
  faLink,
  faMoneyBillWave,
  faReceipt,
  faSpinner,
  faTimesCircle,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';

import { GeneralLoadingSpinnerComponent } from '../../../general/components/spinner/spinner.component';


const TIPO_DOCUMENTO_NOMBRES_MAP: { [key: string]: string } = {
  'df61cd5c-5609-45d7-a2ad-1d285cabc958': 'Matrícula',
  'b5dc4013-5d65-4969-8342-906ae82ee70c': 'Pago',
};


@Component({
  selector: 'app-comprobante',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    GeneralLoadingSpinnerComponent,
    NotificationComponent
  ],
  templateUrl: './comprobantes.component.html',
  styleUrls: ['./comprobantes.component.scss']
})
export class ComprobanteComponent implements OnInit {

  comprobante: Comprobante | null = null;
  isLoading = true;

  isMatriculaLoading = false;
  isPagoLoading = false;

  isGeneratingPdf = false;
  isNavigating = false;

  error: string | null = null;
  idMatricula: string | null = null;

  private createdPdfUrls: string[] = [];
  nivel: string | null = null;


  faFilePdf = faFilePdf;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faMoneyBillWave = faMoneyBillWave;
  faGraduationCap = faGraduationCap;
  faIdCard = faIdCard;
  faLink = faLink;
  faReceipt = faReceipt;
  faCircleInfo = faCircleInfo;
  faTriangleExclamation = faTriangleExclamation;
  faCalendarAlt = faCalendarAlt;
  faSpinner = faSpinner;
  faDownload = faDownload;
  faArrowLeft = faArrowLeft;
  faHashtag = faHashtag;

  private readonly TIPO_COMPROBANTE_MATRICULA_UUID = 'df61cd5c-5609-45d7-a2ad-1d285cabc958';
  private readonly TIPO_COMPROBANTE_PAGO_UUID = 'b5dc4013-5d65-4969-8342-906ae82ee70c';


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ComprobanteService: ComprobanteService,
    private NotificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.idMatricula = params['idMatricula'];
      this.nivel = params['nivel'] || null;
      /**INICIO */
      const refresh = params['refresh']; // Nuevo parámetro
      /*FIN*/
      if (this.idMatricula) {
        //this.loadComprobanteDetails(this.idMatricula);
        this.loadComprobanteDetails(this.idMatricula, !!refresh); // Forzar recarga si hay `refresh`
      } else {
        this.error = 'No se proporcionó un ID de matrícula.';
        this.isLoading = false;
      }
    });
  }

  //loadComprobanteDetails(idMatricula: string): void {
  /** INICIO */
  loadComprobanteDetails(idMatricula: string, forceRefresh: boolean = false): void {
  if (!forceRefresh && this.comprobante) return; // Omitir si no se fuerza recarga
  /*FIN */
    this.isLoading = true;
    this.error = null;
    this.ComprobanteService.obtenerComprobantePorIdMatricula(idMatricula).subscribe({
      next: (comprobante) => {
        this.comprobante = comprobante;
        this.isLoading = false;
        if (!comprobante) {
            this.error = 'No se encontró un comprobante asociado a esta matrícula.';
        } else {
        }
      },
      error: (err) => {
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
        this.NotificationService.showNotification('No se pudo generar el PDF: ID de matrícula no disponible.', 'error');
        return;
    }

    this.isGeneratingPdf = true;

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



    this.ComprobanteService.generarPdfDirecto(this.idMatricula, tipoComprobanteUuid, montoTotal).subscribe({
      next: (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);
        this.createdPdfUrls.push(blobUrl);

        const newTab = window.open(blobUrl, '_blank');

        if (newTab) {
           setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } else {
             this.NotificationService.showNotification('Error: El navegador bloqueó la apertura del PDF.', 'error');
        }

        if (tipo === 'matricula') {
          this.isMatriculaLoading = false;
        } else {
          this.isPagoLoading = false;
        }
        this.isGeneratingPdf = false;
      },
      error: (err) => {
        console.error(`ComprobanteComponent: Error ${tipo} PDF:`, err);
        if (err && err.error && err.error.message) {
            this.error = `Error al generar el comprobante de ${tipo}: ` + err.error.message;
            this.NotificationService.showNotification(`Error al generar el comprobante de ${tipo}: ${err.error.message}`, 'error');
        } else {
            this.error = `Error al generar el comprobante de ${tipo}: ` + (err.message || 'Error desconocido');
            this.NotificationService.showNotification(`Error al generar el comprobante de ${tipo}: ${err.message || 'Error desconocido'}`, 'error');
        }

        if (tipo === 'matricula') {
          this.isMatriculaLoading = false;
        } else {
          this.isPagoLoading = false;
        }
        this.isGeneratingPdf = false;
      }
    });
  }

  finalizar(): void {
    this.isNavigating = true;

    setTimeout(() => {
      this.createdPdfUrls.forEach(url => URL.revokeObjectURL(url));
      this.createdPdfUrls = [];

      if (this.nivel) {
        const targetRoute = `/matriculas/${this.nivel.toLowerCase()}`;
        this.router.navigate([targetRoute]);
      } else {
        this.NotificationService.showNotification('No se pudo determinar el nivel para navegar.', 'error');
        this.router.navigate(['/matriculas/listar']);
      }
      this.isNavigating = false;
    },1000);
  }

  getSpinnerMessage(): string {
    if (this.isLoading) {
      return 'Cargando detalles del comprobante...';
    } else if (this.isGeneratingPdf) {
      return 'Generando comprobante...';
    } else if (this.isNavigating) {
      return 'Regresando a vacantes...';
    }
    return 'Cargando...';
  }

  getNombreTipoDocumento(idTipoDoc?: string | null): string {
      if (!idTipoDoc) return 'N/A';
      return TIPO_DOCUMENTO_NOMBRES_MAP[idTipoDoc] || 'Desconocido';
  }

}
