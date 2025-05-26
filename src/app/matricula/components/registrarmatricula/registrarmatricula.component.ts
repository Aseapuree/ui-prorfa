import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, ReactiveFormsModule, FormControl, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApoderadoService } from './../../services/apoderado.service';
import { AlumnoService } from './../../services/alumno.service';
import { MatriculaService } from './../../services/matricula.service';
import { NotificationService } from './../../../campus/components/shared/notificaciones/notification.service';
import { Matricula, Documento } from '../../interfaces/DTOMatricula';
import { Apoderado } from '../../interfaces/DTOApoderado';
import { Alumno } from '../../interfaces/DTOAlumno';
import { EntidadService } from '../../services/entidad.service';
import { DocumentoEntidad, Necesarios, Adicionales, Intercambio, Discapacidad } from '../../interfaces/DTOEntidad';
import {
  faCalendarAlt, faEnvelope, faHome, faIdCard, faPhone, faSearch, faUser,
  faHashtag, faSignature, faAddressCard, faUsers, faSpinner,
  faComment,
  faClipboardList,
  faVenusMars,
  faToggleOn, faToggleOff, faInfoCircle, faPauseCircle, faPlayCircle, faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { map, catchError, switchMap, startWith, finalize, tap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { GeneralLoadingSpinnerComponent } from '../../../general/components/spinner/spinner.component';
import { NotificationComponent } from "../../../campus/components/shared/notificaciones/notification.component";

function noLeadingSpacesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (typeof control.value === 'string' && control.value.startsWith(' ')) {
      return { noLeadingSpaces: true };
    }
    return null;
  };
}

function emailRegexValidator(): ValidatorFn {
  const regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return regex.test(control.value) ? null : { invalidEmail: true };
  };
}

function documentRegexValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) return null;
    const idtipodoc = control.parent.get('idtipodoc')?.value;
    const value: string = control.value;

    if (!value || !idtipodoc) return null;

    let regex: RegExp;
    const DNI_UUID = '29c2c5c3-2fc9-4410-ab24-52a8111f9c05';
    const CARNET_EXTRANJERIA_UUID = 'fa65a599-60fd-43e1-85e2-7a95f3cf072e';

    if (idtipodoc === DNI_UUID) {
      regex = /^\d{8}$/;
    } else if (idtipodoc === CARNET_EXTRANJERIA_UUID) {
      regex = /^\d{9}$/;
    } else {
      return null;
    }

    const isValid = regex.test(value);
    if (!isValid) {
        return { invalidFormat: true };
    }

    if (isValid && control.hasError('invalidFormat')) {
        const errors = { ...control.errors };
        delete errors['invalidFormat'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }

    return null;
  };
}

function minAgeValidator(minAge: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    try {
      const birthDate = new Date(control.value);
      if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
          return { invalidDate: true };
      }

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();

      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age < minAge ? { minAge: { requiredAge: minAge, actualAge: age } } : null;
    } catch (e) {
      return { invalidDate: true };
    }
  };
}

function soloLetrasValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const regex = /^[A-Za-zÁÉÍÓÚÚÑáéíóúñ\s]+$/;
    if (!regex.test(control.value)) {
        return { soloLetras: true };
    }
    if (regex.test(control.value) && control.hasError('soloLetras')) {
        const errors = { ...control.errors };
        delete errors['soloLetras'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
    return null;
    };
}

@Component({
  selector: 'app-registrar-matricula',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    GeneralLoadingSpinnerComponent,
    NotificationComponent
],
  templateUrl: './registrarmatricula.component.html',
  styleUrls: ['./registrarmatricula.component.scss']
})
export class RegistrarMatriculaComponent implements OnInit {
  formMatricula!: FormGroup;
  nivel!: string;
  grado!: number;
  seccion!: string;
  apoderadoEncontrado: Apoderado | null = null;

  currentView: 'search' | 'apoderado' | 'alumno' | 'documents' = 'search';
  mostrarFormularioApoderado: boolean = false;
  mostrarFormularioAlumno: boolean = false;
  mostrarSeccionDocumentos: boolean = false;

  entidadDocumentos: DocumentoEntidad | null = null;
  allPotentialDocuments: string[] = [];
  necesariosMap: { [key: string]: boolean } = {};
  intercambioMap: { [key: string]: boolean } = {};
  discapacidadMap: { [key: string]: boolean } = {};

  faIdCard = faIdCard;
  faHashtag = faHashtag;
  faUser = faUser;
  faSignature = faSignature;
  faAddressCard = faAddressCard;
  faCalendarAlt = faCalendarAlt;
  faPhone = faPhone;
  faHome = faHome;
  faEnvelope = faEnvelope;
  faUsers = faUsers;
  faSearch = faSearch;
  faSpinner = faSpinner;
  faComment = faComment;
  faClipboardList = faClipboardList;
  faVenusMars = faVenusMars;
  faToggleOn = faToggleOn;
  faToggleOff = faToggleOff;
  faInfoCircle = faInfoCircle;
  faPauseCircle = faPauseCircle;
  faPlayCircle = faPlayCircle;
  faFileAlt = faFileAlt;

  soloNumerosPattern = /^[0-9]+$/;
  direccionPattern = /^[A-Za-z0-9À-ÿ\s.,#-]+$/;
  usuario: { idusuario: string } = { idusuario: localStorage.getItem('IDUSER') ?? '' };

  tiposDocumento = [
    { id: '29c2c5c3-2fc9-4410-ab24-52a8111f9c05', nombre: 'DNI' },
    { id: 'fa65a599-60fd-43e1-85e2-7a95f3cf072e', nombre: 'CARNET EXTRANJERIA' }
  ];
  relacionesEstudiante = [
    { valor: 'madre', nombre: 'MADRE' },
    { valor: 'padre', nombre: 'PADRE' },
    { valor: 'tutor', nombre: 'TUTOR' }
  ];

  generos = [
    { valor: 'masculino', nombre: 'Masculino' },
    { valor: 'femenino', nombre: 'Femenino' }
  ];

  isSubmitting = false;
  isSearching = false;
  isLoading = true;
  loadingMessage: string = 'Cargando formulario...';

  idMatriculaContinuar: string | null = null;
  idApoderadoContinuar: string | null = null;
  idAlumnoContinuar: string | null = null;
  esContinuacion: boolean = false;
  matriculaOriginal: Matricula | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apoderadoService: ApoderadoService,
    private alumnoService: AlumnoService,
    private matriculaService: MatriculaService,
    private entidadService: EntidadService,
    private notificationService: NotificationService,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadingMessage = 'Cargando formulario...';

    this.route.queryParams.subscribe(params => {
      this.nivel = params['nivel'];
      this.grado = +params['grado'];
      this.idMatriculaContinuar = params['idMatricula'] || null;

      if (!this.nivel || !this.grado) {
        this.notificationService.showNotification('Faltan parámetros de nivel o grado.', 'error');
        this.isLoading = false;
        this.loadingMessage = 'Error al cargar parámetros.';
        return;
      }

      const initialObservables: any = {
        entityDocs: this.loadEntityDocuments()
      };

      if (this.idMatriculaContinuar) {
        this.esContinuacion = true;
        this.loadingMessage = 'Cargando datos de matrícula para continuar...';
        initialObservables.datosMatriculaContinuar = this.matriculaService.obtenerMatricula(this.idMatriculaContinuar).pipe(
          switchMap(matricula => {
            if (!matricula || !matricula.idapoderado || !matricula.idalumno) {
              this.notificationService.showNotification('No se pudo cargar la información completa de la matrícula para continuar.', 'error');
              return throwError(() => new Error('Datos de matrícula para continuación incompletos o no encontrados.'));
            }
            this.matriculaOriginal = matricula;
            this.idApoderadoContinuar = matricula.idapoderado;
            this.idAlumnoContinuar = matricula.idalumno;
            return forkJoin({
              matricula: of(matricula),
              apoderado: this.apoderadoService.obtenerApoderado(matricula.idapoderado),
              alumno: this.alumnoService.obtenerAlumno(matricula.idalumno)
            });
          }),
          catchError(err => {
            this.notificationService.showNotification('Error al cargar datos para continuar: ' + (err.message || 'Error desconocido.'), 'error');
            this.esContinuacion = false;
            this.idMatriculaContinuar = null;
            this.matriculaOriginal = null;
            return of(null);
          })
        );
      }

      if (!this.esContinuacion || (this.matriculaOriginal && !this.matriculaOriginal.seccion)) {
         initialObservables.assignedSection = this.matriculaService.asignarSeccion(this.grado).pipe(
            catchError(err => {
                this.notificationService.showNotification('Error al obtener la sección asignada.', 'error');
                return of('ERROR');
            })
        );
      }


      forkJoin(initialObservables).pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdRef.detectChanges();
        })
      ).subscribe({
        next: (results: any) => {
          if (this.esContinuacion && results.datosMatriculaContinuar && results.datosMatriculaContinuar.matricula && results.datosMatriculaContinuar.matricula.seccion) {
            this.seccion = (typeof results.datosMatriculaContinuar.matricula.seccion === 'object' && results.datosMatriculaContinuar.matricula.seccion !== null && 'nombre' in results.datosMatriculaContinuar.matricula.seccion)
                ? (results.datosMatriculaContinuar.matricula.seccion as any).nombre
                : results.datosMatriculaContinuar.matricula.seccion;
            this.notificationService.showNotification(`Continuando con sección asignada: ${this.seccion}`, 'info');
          } else if (results.assignedSection) {
            this.seccion = results.assignedSection;
            if (this.seccion === 'SIN VACANTE') {
              this.notificationService.showNotification('No hay vacantes disponibles para este grado y nivel.', 'error');
              this.loadingMessage = 'Sin vacantes disponibles.';
            } else if (this.seccion === 'ERROR') {
              this.notificationService.showNotification('Error al obtener la sección.', 'error');
              this.loadingMessage = 'Error al obtener sección.';
            } else {
              this.notificationService.showNotification(`Sección asignada: ${this.seccion}`, 'info');
            }
          } else if (!this.seccion) {
             this.notificationService.showNotification('No se pudo determinar la sección.', 'error');
             this.seccion = 'ERROR';
          }

          this.crearFormulario();

          if (this.esContinuacion && results.datosMatriculaContinuar) {
            const { matricula, apoderado, alumno } = results.datosMatriculaContinuar;
            this.poblarFormularioParaContinuacion(matricula, apoderado, alumno);
            this.apoderadoEncontrado = apoderado;
            this.currentView = 'apoderado';
            this.mostrarFormularioApoderado = true;
            this.formMatricula.get('apoderado.idtipodoc')?.disable({ emitEvent: false });
            this.formMatricula.get('apoderado.numeroDocumento')?.disable({ emitEvent: false });
            this.cdRef.detectChanges();
            setTimeout(() => this.focusFirstInvalidControl('apoderado'), 100);
          } else {
            this.currentView = 'search';
          }

          this.setupDocumentNumberFieldState();
          this.setupConditionalTextFields();
          this.setupDocumentFormControls();
        },
        error: (err) => {
          this.notificationService.showNotification('Error general durante la inicialización: ' + (err.message || 'Error desconocido'), 'error');
          this.isLoading = false;
          this.loadingMessage = 'Error de inicialización.';
          this.crearFormulario();
          this.setupDocumentNumberFieldState();
          this.setupConditionalTextFields();
          this.setupDocumentFormControls();
        }
      });
    });
  }

  poblarFormularioParaContinuacion(matricula: Matricula, apoderado: Apoderado, alumno: Alumno): void {
    if (!this.formMatricula) {
        this.crearFormulario();
    }

    const apoderadoFechaNacimiento = apoderado.fechaNacimiento
        ? new Date(apoderado.fechaNacimiento).toISOString().substring(0, 10)
        : '';
    const alumnoFechaNacimiento = alumno.fechaNacimiento
        ? new Date(alumno.fechaNacimiento).toISOString().substring(0, 10)
        : '';

    this.formMatricula.patchValue({
      relacionEstudiante: matricula.relacionEstudiante,
      apoderado: {
        ...apoderado,
        fechaNacimiento: apoderadoFechaNacimiento
      },
      alumno: {
        ...alumno,
        fechaNacimiento: alumnoFechaNacimiento,
        tieneIntercambio: !!alumno.tipoIntercambio,
        tipoIntercambio: alumno.tipoIntercambio || '',
        tieneDiscapacidad: !!alumno.tipoDiscapacidad,
        tipoDiscapacidad: alumno.tipoDiscapacidad || '',
        tieneOtros: !!alumno.tipoOtros,
        tipoOtros: alumno.tipoOtros || ''
      }
    }, { emitEvent: false });


    if (this.allPotentialDocuments.length > 0 && this.documentsPresentedControls.length === this.allPotentialDocuments.length) {
        this.allPotentialDocuments.forEach((docName, index) => {
            const isPresented = matricula.documentos?.some(d => d.documento === docName) || false;
            this.documentsPresentedControls.at(index).patchValue(isPresented, { emitEvent: false });
        });
    } else {
    }

    this.formMatricula.markAsPristine();
    this.formMatricula.markAsUntouched();
    Object.keys(this.formMatricula.controls).forEach(key => {
        const control = this.formMatricula.get(key);
        control?.markAsPristine();
        control?.markAsUntouched();
        if (control instanceof FormGroup || control instanceof FormArray) {
            Object.keys((control as any).controls).forEach(subKey => {
                (control as any).get(subKey)?.markAsPristine();
                (control as any).get(subKey)?.markAsUntouched();
            });
        }
    });

    this.notificationService.showNotification('Datos de matrícula cargados. Por favor, verifique y complete la información.', 'info');
  }


  loadEntityDocuments(): Observable<void> {
      return this.entidadService.obtenerEntidadList().pipe(
          tap(response => {
              if (response && response.length > 0 && response[0].documentos) {
                  this.entidadDocumentos = response[0].documentos;
                  this.allPotentialDocuments = [];
                  this.necesariosMap = {};
                  this.intercambioMap = {};
                  this.discapacidadMap = {};


                  if (this.entidadDocumentos.necesarios) {
                      Object.values(this.entidadDocumentos.necesarios)
                            .filter(doc => doc !== undefined && doc !== null)
                            .forEach(doc => {
                                const docName = doc as string;
                                this.allPotentialDocuments.push(docName);
                                this.necesariosMap[docName] = true;
                            });
                  }

                  if (this.entidadDocumentos.adicionales?.intercambio) {
                       Object.values(this.entidadDocumentos.adicionales.intercambio)
                             .filter(doc => doc !== undefined && doc !== null)
                             .forEach(doc => {
                                 const docName = doc as string;
                                 if (!this.allPotentialDocuments.includes(docName)) {
                                     this.allPotentialDocuments.push(docName);
                                 }
                                 this.intercambioMap[docName] = true;
                             });
                   }

                  if (this.entidadDocumentos.adicionales?.discapacidad) {
                       Object.values(this.entidadDocumentos.adicionales.discapacidad)
                             .filter(doc => doc !== undefined && doc !== null)
                             .forEach(doc => {
                                  const docName = doc as string;
                                  if (!this.allPotentialDocuments.includes(docName)) {
                                      this.allPotentialDocuments.push(docName);
                                  }
                                  this.discapacidadMap[docName] = true;
                             });
                   }
              } else {
                  this.notificationService.showNotification('No se pudieron cargar los requisitos de documentos de la entidad.', 'error');
              }
          }),
          map(() => void 0),
          catchError(err => {
              this.notificationService.showNotification('Error al cargar los requisitos de documentos de la entidad.', 'error');
              this.entidadDocumentos = null;
              this.allPotentialDocuments = [];
              this.necesariosMap = {};
              this.intercambioMap = {};
              this.discapacidadMap = {};
              return of(void 0);
          })
      );
  }


  crearFormulario(): void {
    this.formMatricula = this.fb.group({
      relacionEstudiante: ['', Validators.required],
      apoderado: this.fb.group({
        idapoderado: [null],
        idtipodoc: ['', Validators.required],
        numeroDocumento: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(this.soloNumerosPattern), documentRegexValidator(), noLeadingSpacesValidator()]],
        nombre: ['', [Validators.required, soloLetrasValidator(), noLeadingSpacesValidator()]],
        apellidoPaterno: ['', [Validators.required, soloLetrasValidator(), noLeadingSpacesValidator()]],
        apellidoMaterno: ['', [Validators.required, soloLetrasValidator(), noLeadingSpacesValidator()]],
        nacionalidad: ['', [Validators.required, soloLetrasValidator(), noLeadingSpacesValidator()]],
        genero: ['', Validators.required],
        telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/), noLeadingSpacesValidator()]],
        direccion: ['', [Validators.required, Validators.pattern(this.direccionPattern), noLeadingSpacesValidator()]],
        correo: ['', [Validators.required, emailRegexValidator(), noLeadingSpacesValidator()]],
        fechaNacimiento: ['', [Validators.required, minAgeValidator(18)]]
      }),
      alumno: this.fb.group({
        idalumno: [null],
        nombre: ['', [Validators.required, soloLetrasValidator(), noLeadingSpacesValidator()]],
        apellidoPaterno: ['', [Validators.required, soloLetrasValidator(), noLeadingSpacesValidator()]],
        apellidoMaterno: ['', [Validators.required, soloLetrasValidator(), noLeadingSpacesValidator()]],
        nacionalidad: ['', [Validators.required, soloLetrasValidator(), noLeadingSpacesValidator()]],
        genero: ['', Validators.required],
        idtipodoc: ['', Validators.required],
        numeroDocumento: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(this.soloNumerosPattern), documentRegexValidator(), noLeadingSpacesValidator()]],
        fechaNacimiento: ['', [Validators.required, minAgeValidator(this.getMinAgeForGrade())]],
        direccion: ['', [Validators.required, Validators.pattern(this.direccionPattern), noLeadingSpacesValidator()]],
        tieneIntercambio: [false],
        tipoIntercambio: [{ value: '', disabled: true }, noLeadingSpacesValidator()],
        tieneDiscapacidad: [false],
        tipoDiscapacidad: [{ value: '', disabled: true }, noLeadingSpacesValidator()],
        tieneOtros: [false],
        tipoOtros: [{ value: '', disabled: true }, noLeadingSpacesValidator()]
      }),
      documentsPresented: this.fb.array([])
    });
  }

  setupDocumentFormControls(): void {
      const documentsArray = this.formMatricula.get('documentsPresented') as FormArray;
      while (documentsArray.length !== 0) {
          documentsArray.removeAt(0);
      }
      this.allPotentialDocuments.forEach(() => {
          documentsArray.push(this.fb.control(false));
      });
  }

  get documentsPresentedControls(): FormArray {
      return this.formMatricula.get('documentsPresented') as FormArray;
  }

  shouldShowDocument(documentName: string): boolean {
      if (this.necesariosMap[documentName]) {
          return true;
      }
      if (this.intercambioMap[documentName] && this.formMatricula.get('alumno.tieneIntercambio')?.value) {
          return true;
      }
      if (this.discapacidadMap[documentName] && this.formMatricula.get('alumno.tieneDiscapacidad')?.value) {
          return true;
      }
      return false;
  }


  setupDocumentNumberFieldState(): void {
      const apoderadoTipoDocControl = this.formMatricula.get('apoderado.idtipodoc');
      const apoderadoNumeroDocControl = this.formMatricula.get('apoderado.numeroDocumento');
      const alumnoTipoDocControl = this.formMatricula.get('alumno.idtipodoc');
      const alumnoNumeroDocControl = this.formMatricula.get('alumno.numeroDocumento');

      apoderadoTipoDocControl?.valueChanges.pipe(
          startWith(apoderadoTipoDocControl.value)
      ).subscribe(tipoDocValue => {
          if (this.currentView === 'search' || (!this.esContinuacion && !this.apoderadoEncontrado)) {
              if (tipoDocValue && !this.isSearching) {
                  apoderadoNumeroDocControl?.enable({ emitEvent: false });
              } else {
                  apoderadoNumeroDocControl?.disable({ emitEvent: false });
                  if (!this.isSearching) {
                    apoderadoNumeroDocControl?.reset('', { emitEvent: false });
                  }
              }
          }
          apoderadoNumeroDocControl?.updateValueAndValidity();
      });

      alumnoTipoDocControl?.valueChanges.pipe(
          startWith(alumnoTipoDocControl.value)
      ).subscribe(tipoDocValue => {
          if (tipoDocValue) {
              alumnoNumeroDocControl?.enable({ emitEvent: false });
          } else {
              alumnoNumeroDocControl?.disable({ emitEvent: false });
              alumnoNumeroDocControl?.reset('', { emitEvent: false });
          }
          alumnoNumeroDocControl?.updateValueAndValidity();
      });
  }

  setupConditionalTextFields(): void {
    const fields = ['Intercambio', 'Discapacidad', 'Otros'];
    fields.forEach(field => {
        const tieneControl = this.formMatricula.get(`alumno.tiene${field}`);
        const textControl = this.formMatricula.get(`alumno.tipo${field}`);

        tieneControl?.valueChanges.pipe(startWith(tieneControl.value)).subscribe(isChecked => {
            if (isChecked) {
                textControl?.enable({ emitEvent: false });
                textControl?.setValidators([Validators.required, noLeadingSpacesValidator()]);
            } else {
                textControl?.disable({ emitEvent: false });
                textControl?.reset('', { emitEvent: false });
                textControl?.clearValidators();
                textControl?.setValidators([noLeadingSpacesValidator()]);
            }
            textControl?.updateValueAndValidity({ emitEvent: false });
        });
    });
  }

  getMinAgeForGrade(): number {
    if (this.nivel?.toLowerCase() === 'primaria') {
      return 5 + (this.grado || 1) -1;
    } else if (this.nivel?.toLowerCase() === 'secundaria') {
      return 11 + (this.grado || 1) -1;
    }
    return 5;
  }

  getNumeroDocumentoMaxLength(grupo: 'apoderado' | 'alumno'): number {
    const tipoControl = this.formMatricula.get(`${grupo}.idtipodoc`);
    if (tipoControl) {
      const tipo = tipoControl.value;
      const DNI_UUID = '29c2c5c3-2fc9-4410-ab24-52a8111f9c05';
      const CARNET_EXTRANJERIA_UUID = 'fa65a599-60fd-43e1-85e2-7a95f3cf072e';
      if (tipo === DNI_UUID) return 8;
      if (tipo === CARNET_EXTRANJERIA_UUID) return 9;
    }
    return 20;
  }

  onKeyPressOnlyLetters(event: KeyboardEvent): void {
     if (event.ctrlKey || event.altKey || event.metaKey || ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter', 'Home', 'End'].includes(event.key)) {
         return;
     }
     const allowedRegex = /^[A-Za-zÁÉÍÓÚÚÑáéíóúñ\s]+$/;
     if (!allowedRegex.test(event.key)) {
       event.preventDefault();
     }
  }

  onKeyPressOnlyNumbers(event: KeyboardEvent): void {
     if (event.ctrlKey || event.altKey || event.metaKey || ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter', 'Home', 'End'].includes(event.key)) {
         return;
     }
     const regex = /^[0-9]$/;
     if (!regex.test(event.key)) {
       event.preventDefault();
     }
  }

  onKeyPressNoSpaces(event: KeyboardEvent): void {
    if (event.key === ' ') {
      event.preventDefault();
    }
  }

  onEnterBuscarApoderado(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
        event.preventDefault();
        this.buscarApoderado();
    }
  }

  buscarApoderado(): void {
    if (this.isSearching) return;

    const idtipodocControl = this.formMatricula.get('apoderado.idtipodoc');
    const numeroDocumentoControl = this.formMatricula.get('apoderado.numeroDocumento');

    idtipodocControl?.markAsTouched();
    numeroDocumentoControl?.markAsTouched();
    idtipodocControl?.updateValueAndValidity();
    numeroDocumentoControl?.updateValueAndValidity();

    const idtipodoc = idtipodocControl?.value;
    const numeroDocumento = numeroDocumentoControl?.value;

    if (!idtipodoc || numeroDocumentoControl?.invalid) {
        this.notificationService.showNotification('Seleccione tipo e ingrese un número de documento válido para buscar.', 'error');
        this.focusFirstInvalidControl('apoderado', ['idtipodoc', 'numeroDocumento']);
        return;
    }

    this.isSearching = true;
    this.cdRef.detectChanges();
    this.apoderadoService.buscarPorNumeroDocumento(idtipodoc, numeroDocumento).pipe(
        finalize(() => {
            this.isSearching = false;
            this.cdRef.detectChanges();
        })
    ).subscribe({
      next: (apoderado) => {
        let fechaNacFormateada = '';
        if (apoderado.fechaNacimiento) {
          try {
                const dateObj = new Date(apoderado.fechaNacimiento);
               fechaNacFormateada = !isNaN(dateObj.getTime()) ? dateObj.toISOString().substring(0, 10) : '';
          } catch(e) {
               fechaNacFormateada = '';
          }
        }

        this.apoderadoEncontrado = {...apoderado, fechaNacimiento: fechaNacFormateada};
        this.formMatricula.get('apoderado')?.patchValue({
            ...apoderado,
            fechaNacimiento: fechaNacFormateada,
            idapoderado: apoderado.idapoderado
        });

        this.formMatricula.get('apoderado.idtipodoc')?.disable({ emitEvent: false });
        this.formMatricula.get('apoderado.numeroDocumento')?.disable({ emitEvent: false });

        this.mostrarFormularioApoderado = true;
        this.currentView = 'apoderado';
        this.notificationService.showNotification('Apoderado encontrado. Verifique/complete los datos.', 'success');

        this.formMatricula.get('relacionEstudiante')?.reset('', { emitEvent: false });
        this.formMatricula.get('relacionEstudiante')?.markAsPristine();
        this.formMatricula.get('relacionEstudiante')?.markAsUntouched();

        this.formMatricula.get('apoderado')?.markAsPristine();
        this.formMatricula.get('apoderado')?.markAsUntouched();
        Object.keys((this.formMatricula.get('apoderado') as FormGroup).controls).forEach(key => {
            this.formMatricula.get(['apoderado', key])?.markAsPristine();
            this.formMatricula.get(['apoderado', key])?.markAsUntouched();
        });

        setTimeout(() => this.focusFirstInvalidControl('apoderado'), 50);
      },
      error: (err: HttpErrorResponse) => {
        this.apoderadoEncontrado = null;
        const currentTipoDoc = this.formMatricula.get('apoderado.idtipodoc')?.value;
        const currentNumDoc = this.formMatricula.get('apoderado.numeroDocumento')?.value;

        this.formMatricula.get('apoderado')?.reset({
            idapoderado: null,
            idtipodoc: currentTipoDoc,
            numeroDocumento: currentNumDoc,
            nombre: '', apellidoPaterno: '', apellidoMaterno: '', genero: '', telefono: '',
            direccion: '', correo: '', fechaNacimiento: '', nacionalidad: ''
        }, { emitEvent: false });

         this.formMatricula.get('apoderado.idtipodoc')?.enable({ emitEvent: false });
         this.formMatricula.get('apoderado.numeroDocumento')?.enable({ emitEvent: false });
         this.formMatricula.get('apoderado.numeroDocumento')?.updateValueAndValidity();

        this.formMatricula.get('relacionEstudiante')?.reset('', { emitEvent: false });
        this.formMatricula.get('relacionEstudiante')?.markAsPristine();
        this.formMatricula.get('relacionEstudiante')?.markAsUntouched();

        this.mostrarFormularioApoderado = true;
        this.mostrarFormularioAlumno = false;
        this.mostrarSeccionDocumentos = false;
        this.currentView = 'apoderado';

        if (err.status === 404) {
            this.notificationService.showNotification('Apoderado no registrado. Complete los datos para crearlo.', 'info');
        } else {
            this.notificationService.showNotification('Error al buscar apoderado: ' + (err.error?.message || err.message || 'Intente de nuevo.'), 'error');
        }
        setTimeout(() => this.focusFirstInvalidControl('apoderado'), 50);
      }
    });
  }

  validarApoderado(): void {
    const apoderadoGroup = this.formMatricula.get('apoderado');
    const relacionControl = this.formMatricula.get('relacionEstudiante');

    apoderadoGroup?.markAllAsTouched();
    relacionControl?.markAsTouched();
    apoderadoGroup?.updateValueAndValidity();
    relacionControl?.updateValueAndValidity();

    if (apoderadoGroup?.valid && relacionControl?.valid) {
      this.currentView = 'alumno';
      this.mostrarFormularioApoderado = true;
      this.mostrarFormularioAlumno = true;
      this.mostrarSeccionDocumentos = false;
      this.notificationService.showNotification('Datos del apoderado correctos. Ingrese datos del alumno.', 'info');
      setTimeout(() => document.getElementById('alumno-fieldset')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      setTimeout(() => this.focusFirstInvalidControl('alumno'), 100);
    } else {
      this.mostrarFormularioAlumno = false;
      this.mostrarSeccionDocumentos = false;
      this.notificationService.showNotification('Revise los datos del apoderado.', 'error');
      setTimeout(() => {
         this.focusFirstInvalidControl('apoderado', undefined, 'relacionEstudiante');
      }, 50);
    }
  }

  validarAlumno(): void {
      const alumnoGroup = this.formMatricula.get('alumno');
      alumnoGroup?.markAllAsTouched();
      alumnoGroup?.updateValueAndValidity();

      if (alumnoGroup?.valid) {
          this.currentView = 'documents';
          this.mostrarFormularioApoderado = true;
          this.mostrarFormularioAlumno = true;
          this.mostrarSeccionDocumentos = true;
          this.notificationService.showNotification('Datos del alumno correctos. Seleccione los documentos presentados.', 'info');
          setTimeout(() => document.getElementById('documents-fieldset')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      } else {
          this.mostrarSeccionDocumentos = false;
          this.notificationService.showNotification('Revise los datos del alumno.', 'error');
          setTimeout(() => this.focusFirstInvalidControl('alumno'), 50);
      }
  }

  regresarAApoderado(): void {
    this.currentView = 'apoderado';
    this.mostrarFormularioAlumno = false;
    this.mostrarSeccionDocumentos = false;
    setTimeout(() => document.querySelector('.apoderado-form legend')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  regresarAAlumno(): void {
      this.currentView = 'alumno';
      this.mostrarSeccionDocumentos = false;
      setTimeout(() => document.getElementById('alumno-fieldset')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  regresarABusqueda(): void {
      this.currentView = 'search';
      this.mostrarFormularioApoderado = false;
      this.mostrarFormularioAlumno = false;
      this.mostrarSeccionDocumentos = false;
      this.apoderadoEncontrado = null;
      this.esContinuacion = false;
      this.idMatriculaContinuar = null;
      this.idApoderadoContinuar = null;
      this.idAlumnoContinuar = null;
      this.matriculaOriginal = null;

      this.formMatricula.get('apoderado.idtipodoc')?.reset('', { emitEvent: false });
      this.formMatricula.get('apoderado.numeroDocumento')?.reset('', { emitEvent: false });
      this.formMatricula.get('apoderado.idtipodoc')?.enable({ emitEvent: false });

      this.formMatricula.get('apoderado.idtipodoc')?.setErrors(null);
      this.formMatricula.get('apoderado.numeroDocumento')?.setErrors(null);
      this.formMatricula.get('apoderado.idtipodoc')?.markAsUntouched();
      this.formMatricula.get('apoderado.numeroDocumento')?.markAsUntouched();

      this.formMatricula.get('apoderado')?.patchValue({
          nombre: '', apellidoPaterno: '', apellidoMaterno: '', genero: '', telefono: '',
          direccion: '', correo: '', fechaNacimiento: '', nacionalidad: '', idapoderado: null
      });
      this.formMatricula.get('alumno')?.reset({
          idalumno: null, nombre: '', apellidoPaterno: '', apellidoMaterno: '', nacionalidad: '',
          genero: '', idtipodoc: '', numeroDocumento: '', fechaNacimiento: '', direccion: '',
          tieneIntercambio: false, tipoIntercambio: '', tieneDiscapacidad: false, tipoDiscapacidad: '',
          tieneOtros: false, tipoOtros: ''
      });
      this.formMatricula.get('relacionEstudiante')?.reset('');
      this.documentsPresentedControls.controls.forEach(control => control.reset(false));

      this.formMatricula.markAsPristine();
      this.formMatricula.markAsUntouched();

      setTimeout(() => document.getElementById('apoderado_idtipodoc_search')?.focus(), 50);
  }

  private convertToLocalDateTime(dateString: string | null | undefined): string | null {
      if (!dateString) return null;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return null;
      }
      return `${dateString}T00:00:00`;
  }

  private processMatricula(estadoMatriculaDeseado: 'COMPLETADO' | 'EN PROCESO'): void {
    if (this.isSubmitting) return;

    if (estadoMatriculaDeseado === 'COMPLETADO') {
        this.formMatricula.markAllAsTouched();
        this.formMatricula.updateValueAndValidity();

        if (this.formMatricula.invalid) {
            if (this.formMatricula.get('apoderado')?.invalid || this.formMatricula.get('relacionEstudiante')?.invalid) {
                 this.currentView = 'apoderado';
                 this.mostrarFormularioApoderado = true; this.mostrarFormularioAlumno = false; this.mostrarSeccionDocumentos = false;
                 setTimeout(() => this.focusFirstInvalidControl('apoderado', undefined, 'relacionEstudiante'), 50);
            } else if (this.formMatricula.get('alumno')?.invalid) {
                this.currentView = 'alumno';
                this.mostrarFormularioApoderado = true; this.mostrarFormularioAlumno = true; this.mostrarSeccionDocumentos = false;
                setTimeout(() => this.focusFirstInvalidControl('alumno'), 50);
            } else if (this.formMatricula.get('documentsPresented')?.invalid) {
                 this.currentView = 'documents';
                 this.mostrarFormularioApoderado = true; this.mostrarFormularioAlumno = true; this.mostrarSeccionDocumentos = true;
            }
            this.notificationService.showNotification('Formulario inválido. Revise los campos marcados.', 'error');
            return;
        }
    } else {
         const formData = this.formMatricula.getRawValue();
         const hasApoderadoData = Object.entries(formData.apoderado).some(([key, value]) =>
            key !== 'idapoderado' && value !== null && value !== '' && value !== undefined
         );
         const hasAlumnoData = Object.entries(formData.alumno).some(([key, value]) =>
            key !== 'idalumno' && typeof value !== 'boolean' && value !== null && value !== '' && value !== undefined
         );

         const hasAnyData =
            hasApoderadoData ||
            hasAlumnoData ||
            formData.relacionEstudiante ||
            formData.documentsPresented.some((presented: boolean) => presented) ||
            (formData.alumno.tieneIntercambio && formData.alumno.tipoIntercambio) ||
            (formData.alumno.tieneDiscapacidad && formData.alumno.tipoDiscapacidad) ||
            (formData.alumno.tieneOtros && formData.alumno.tipoOtros);

         if (!hasAnyData && !this.esContinuacion) {
             this.notificationService.showNotification('No hay suficientes datos ingresados para guardar el trámite en proceso.', 'info');
             return;
         }
    }


    if (!this.seccion || this.seccion === 'SIN VACANTE' || this.seccion === 'ERROR') {
        this.notificationService.showNotification(`No se puede ${estadoMatriculaDeseado === 'COMPLETADO' ? 'registrar' : 'pausar'}: sección inválida (${this.seccion}) o sin vacantes.`, 'error');
        return;
    }

    this.isSubmitting = true;
    this.loadingMessage = estadoMatriculaDeseado === 'COMPLETADO' ? 'Registrando matrícula...' : 'Guardando progreso...';
    this.cdRef.detectChanges();

    const formData = this.formMatricula.getRawValue();

    const apoderadoData: Apoderado = {
        ...formData.apoderado,
        fechaNacimiento: this.convertToLocalDateTime(formData.apoderado.fechaNacimiento),
        idapoderado: this.esContinuacion ? this.idApoderadoContinuar : (this.apoderadoEncontrado ? this.apoderadoEncontrado.idapoderado : null)
    };
    if (!apoderadoData.idapoderado) delete apoderadoData.idapoderado;

    const alumnoData: Alumno = {
        ...formData.alumno,
        fechaNacimiento: this.convertToLocalDateTime(formData.alumno.fechaNacimiento),
        idalumno: this.esContinuacion ? this.idAlumnoContinuar : null,
        tipoIntercambio: formData.alumno.tieneIntercambio ? (formData.alumno.tipoIntercambio || null) : null,
        tipoDiscapacidad: formData.alumno.tieneDiscapacidad ? (formData.alumno.tipoDiscapacidad || null) : null,
        tipoOtros: formData.alumno.tieneOtros ? (formData.alumno.tipoOtros || null) : null
    };
    if (!alumnoData.idalumno) delete alumnoData.idalumno;

    const presentedDocumentsList: Documento[] = [];
    formData.documentsPresented.forEach((isChecked: boolean, index: number) => {
        const documentName = this.allPotentialDocuments[index];
        if (isChecked && this.shouldShowDocument(documentName)) {
            presentedDocumentsList.push({ documento: documentName });
        }
    });

    let apoderadoObservable: Observable<Apoderado>;
    const apoderadoFormGroup = this.formMatricula.get('apoderado') as FormGroup;

    if (apoderadoData.idapoderado) {
        if (apoderadoFormGroup.dirty || estadoMatriculaDeseado === 'EN PROCESO') {
            apoderadoObservable = this.apoderadoService.editarApoderado(apoderadoData.idapoderado, apoderadoData).pipe(
                map(resp => (resp && (resp as any).data) ? (resp as any).data : resp)
            );
        } else {
            apoderadoObservable = of(apoderadoData);
        }
    } else {
        if (Object.values(formData.apoderado).some(v => v)) {
             apoderadoObservable = this.apoderadoService.agregarApoderado(apoderadoData).pipe(
                 map(resp => (resp && (resp as any).data) ? (resp as any).data : resp)
             );
        } else {
            apoderadoObservable = of({ idapoderado: undefined } as Apoderado);
        }
    }

    apoderadoObservable.pipe(
        switchMap((apoderadoProcesado: Apoderado) => {
            const idApoderadoFinal = apoderadoProcesado?.idapoderado;
            const alumnoFormGroup = this.formMatricula.get('alumno') as FormGroup;
            let alumnoObservable: Observable<Alumno>;

            if (alumnoData.idalumno) {
                if (alumnoFormGroup.dirty || estadoMatriculaDeseado === 'EN PROCESO') {
                    alumnoObservable = this.alumnoService.editarAlumno(alumnoData.idalumno, alumnoData).pipe(
                         map((resp: any) => (resp && resp.data && resp.data.idalumno) ? resp.data : { ...alumnoData, idalumno: alumnoData.idalumno })
                    );
                } else {
                    alumnoObservable = of(alumnoData);
                }
            } else {
                if (Object.values(formData.alumno).some(v => v && typeof v !== 'boolean')) {
                    alumnoObservable = this.alumnoService.agregarAlumno(alumnoData).pipe(
                        map((resp: any) => {
                            if (resp && resp.code >= 200 && resp.code < 300 && resp.data && resp.data.idalumno) {
                                return resp.data;
                            }
                            throw new Error('Respuesta inesperada al crear alumno.');
                        })
                    );
                } else {
                     alumnoObservable = of({ idalumno: undefined } as Alumno);
                }
            }
            return alumnoObservable.pipe(map(alumnoProcesado => ({ idApoderado: idApoderadoFinal, idAlumno: alumnoProcesado?.idalumno })));
        }),
        switchMap(({ idApoderado, idAlumno }) => {
            if (estadoMatriculaDeseado === 'COMPLETADO' && (!idApoderado || !idAlumno)) {
                throw new Error('Faltan IDs de apoderado o alumno para completar la matrícula.');
            }

            if (estadoMatriculaDeseado === 'EN PROCESO' && !idApoderado && !idAlumno && !this.esContinuacion && !formData.relacionEstudiante && presentedDocumentsList.length === 0) {
                this.notificationService.showNotification('No hay suficientes datos para guardar en proceso.', 'info');
                return of(null);
            }

            const matriculaRequest: Matricula = {
                idusuario: this.usuario.idusuario,
                idapoderado: idApoderado,
                idalumno: idAlumno,
                nivel: this.nivel,
                grado: this.grado,
                seccion: this.seccion,
                relacionEstudiante: formData.relacionEstudiante || null,
                estadoMatricula: estadoMatriculaDeseado,
                documentos: presentedDocumentsList.length > 0 ? presentedDocumentsList : null
            };

            if (this.esContinuacion && this.matriculaOriginal) {
                matriculaRequest.idmatricula = this.idMatriculaContinuar;
                matriculaRequest.fechaCreacion = this.matriculaOriginal.fechaCreacion;
                matriculaRequest.fechaActualizacion = new Date().toISOString();
            } else {
                matriculaRequest.fechaCreacion = new Date().toISOString();
                matriculaRequest.fechaActualizacion = null;
            }

            if (this.esContinuacion && this.idMatriculaContinuar) {
                return this.matriculaService.editarMatricula(this.idMatriculaContinuar, matriculaRequest).pipe(
                    map(matriculaEditada => ({ ...matriculaEditada, idmatricula: this.idMatriculaContinuar }))
                );
            } else {
                return this.matriculaService.agregarMatricula(matriculaRequest);
            }
        }),
        catchError(err => {
            let errorMsg = 'Error desconocido durante el registro.';
            if (err instanceof HttpErrorResponse) {
                 try {
                     const errorBody = err.error;
                     errorMsg = (errorBody && errorBody.message) ? errorBody.message : `Error del servidor (${err.status}): ${err.statusText || 'Mensaje desconocido'}.`;
                 } catch (e) {
                     errorMsg = `Error de comunicación con el servidor (${err.status}).`;
                 }
            } else if (err instanceof Error) {
                 errorMsg = err.message;
            }
            this.notificationService.showNotification(`Error: ${errorMsg}`, 'error');
            return of(null);
        }),
        finalize(() => {
            this.isSubmitting = false;
            this.loadingMessage = 'Cargando formulario...';
            this.cdRef.detectChanges();
        })
    ).subscribe({
        next: (matriculaProcesada: any) => {
            if (matriculaProcesada === null) {
                 return;
            }

            if (estadoMatriculaDeseado === 'COMPLETADO') {
                 if (matriculaProcesada && matriculaProcesada.idmatricula) {
                     this.notificationService.showNotification('¡Matrícula registrada/actualizada! Generando comprobantes...', 'success');
                     this.router.navigate(['/comprobantes'], {
                         queryParams: { idMatricula: matriculaProcesada.idmatricula, nivel: this.nivel }
                     });
                 } else {
                     this.notificationService.showNotification('Matrícula procesada, pero hubo un problema al obtener la confirmación final.', 'error');
                 }
            } else if (estadoMatriculaDeseado === 'EN PROCESO') {
                this.notificationService.showNotification('Trámite de matrícula guardado en proceso.', 'info');
                this.router.navigate(['/matriculas/', this.nivel?.toLowerCase()]);
            }
        }
    });
  }


  onSubmit(): void {
    this.processMatricula('COMPLETADO');
  }

  onPauseAndSaveProgress(): void {
    this.processMatricula('EN PROCESO');
  }

  focusFirstInvalidControl(
       groupName: 'apoderado' | 'alumno',
       specificFields?: string[],
       singleControlName?: 'relacionEstudiante'
    ): void {
       let controlToFocus: AbstractControl | null = null;
       let elementId = '';

       if (singleControlName) {
           const singleControl = this.formMatricula.get(singleControlName);
           if (singleControl?.invalid && singleControl.touched) {
               controlToFocus = singleControl;
               elementId = singleControlName;
           }
       }

       if (!controlToFocus) {
           const formGroup = this.formMatricula.get(groupName) as FormGroup;
           if (formGroup) {
               const fieldsToCheck = specificFields || Object.keys(formGroup.controls);
               for (const key of fieldsToCheck) {
                   const control = formGroup.get(key);
                   if (control?.invalid && control.touched) {
                       controlToFocus = control;
                       if (groupName === 'apoderado') {
                           if (key === 'idtipodoc') {
                               elementId = this.currentView === 'search' ? 'apoderado_idtipodoc_search' : 'apoderado_idtipodoc_confirm';
                           } else if (key === 'numeroDocumento') {
                               elementId = this.currentView === 'search' ? 'apoderado_numeroDocumento_buscar' : 'apoderado_numeroDocumento_completo';
                           } else {
                               elementId = `apoderado_${key}`;
                           }
                       } else {
                           elementId = `alumno_${key}`;
                       }
                       break;
                   }
               }
           }
       }


       if (controlToFocus && elementId) {
           const element = document.getElementById(elementId) as HTMLElement | null;
           if (element) {
               element.focus({ preventScroll: false });
               element.scrollIntoView({ behavior: 'smooth', block: 'center' });
           } else {
           }
       }
   }
}
