import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApoderadoService } from './../../services/apoderado.service';
import { AlumnoService } from './../../services/alumno.service';
import { MatriculaService } from './../../services/matricula.service';
import { NotificationService } from './../../../campus/components/shared/notificaciones/notification.service';
import { Matricula } from '../../interfaces/DTOMatricula';
import { Apoderado } from '../../interfaces/DTOApoderado';
import { Alumno } from '../../interfaces/DTOAlumno';
import {
  faCalendarAlt, faEnvelope, faHome, faIdCard, faPhone, faSearch, faUser,
  faHashtag, faSignature, faAddressCard, faUsers, faSpinner,
  faComment,
  faClipboardList,
  faVenusMars,
  faToggleOn, faToggleOff, faInfoCircle, faPauseCircle, faPlayCircle
} from '@fortawesome/free-solid-svg-icons';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap, startWith, finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { GeneralLoadingSpinnerComponent } from '../../../general/components/spinner/spinner.component';
import { NotificationComponent } from "../../../campus/components/shared/notificaciones/notification.component";

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

  currentView: 'search' | 'apoderado' | 'alumno' = 'search';
  mostrarFormularioApoderado: boolean = false;
  mostrarFormularioAlumno: boolean = false;

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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apoderadoService: ApoderadoService,
    private alumnoService: AlumnoService,
    private matriculaService: MatriculaService,
    private notificationService: NotificationService,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadingMessage = 'Cargando formulario...';

    this.route.queryParams.subscribe(params => {
      this.nivel = params['nivel'];
      this.grado = +params['grado'];

      if (!this.nivel || !this.grado) {
        this.notificationService.showNotification('Faltan parámetros de nivel o grado.', 'error');
        this.isLoading = false;
        this.loadingMessage = 'Error al cargar parámetros.';
        return;
      }

      if (this.grado) {
        this.matriculaService.asignarSeccion(this.grado).subscribe({
           next: (seccionAsignada: string) => {
            this.seccion = seccionAsignada;
            if (this.seccion === 'SIN VACANTE') {
                 this.notificationService.showNotification('No hay vacantes disponibles para este grado y nivel.', 'error');
                 this.loadingMessage = 'Sin vacantes disponibles.';
           } else if (this.seccion === 'ERROR') {
                 this.notificationService.showNotification('Error al obtener la sección asignada.', 'error');
                 this.loadingMessage = 'Error al obtener sección.';
           } else {
                 this.notificationService.showNotification(`Sección asignada: ${this.seccion}`, 'info');
                 this.loadingMessage = '';
            }
            this.isLoading = false;
            this.cdRef.detectChanges();
           },
          error: (err) => {
            this.seccion = 'ERROR';
            this.notificationService.showNotification('Error de comunicación al obtener la sección.', 'error');
            this.loadingMessage = 'Error de comunicación.';
            this.isLoading = false;
            this.cdRef.detectChanges();
           }
        });
      } else {
          this.isLoading = false;
          this.loadingMessage = 'Error de parámetros.';
          this.cdRef.detectChanges();
      }
    });

    this.crearFormulario();
    this.setupConditionalValidators();
    this.setupDocumentNumberFieldState();
    this.setupConditionalTextFields();
  }

  crearFormulario(): void {
    this.formMatricula = this.fb.group({
      relacionEstudiante: ['', Validators.required],
      apoderado: this.fb.group({
        idapoderado: [null],
        idtipodoc: ['', Validators.required],
        numeroDocumento: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(this.soloNumerosPattern), documentRegexValidator()]],
        nombre: ['', [Validators.required, soloLetrasValidator()]],
        apellidoPaterno: ['', [Validators.required, soloLetrasValidator()]],
        apellidoMaterno: ['', [Validators.required, soloLetrasValidator()]],
        nacionalidad: ['', [Validators.required, soloLetrasValidator()]],
        genero: ['', Validators.required],
        telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
        direccion: ['', [Validators.required, Validators.pattern(this.direccionPattern)]],
        correo: ['', [Validators.required, emailRegexValidator()]],
        fechaNacimiento: ['', [Validators.required, minAgeValidator(18)]]
      }),
      alumno: this.fb.group({
        nombre: ['', [Validators.required, soloLetrasValidator()]],
        apellidoPaterno: ['', [Validators.required, soloLetrasValidator()]],
        apellidoMaterno: ['', [Validators.required, soloLetrasValidator()]],
        nacionalidad: ['', [Validators.required, soloLetrasValidator()]],
        genero: ['', Validators.required],
        idtipodoc: ['', Validators.required],
        numeroDocumento: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(this.soloNumerosPattern), documentRegexValidator()]],
        fechaNacimiento: ['', [Validators.required, minAgeValidator(this.getMinAgeForGrade())]],
        direccion: ['', [Validators.required, Validators.pattern(this.direccionPattern)]],
        tieneIntercambio: [false],
        tipoIntercambio: [{ value: '', disabled: true }],
        tieneDiscapacidad: [false],
        tipoDiscapacidad: [{ value: '', disabled: true }],
        tieneOtros: [false],
        tipoOtros: [{ value: '', disabled: true }]
      })
    });
  }

  setupDocumentNumberFieldState(): void {
      const apoderadoTipoDocControl = this.formMatricula.get('apoderado.idtipodoc');
      const apoderadoNumeroDocControl = this.formMatricula.get('apoderado.numeroDocumento');
      const alumnoTipoDocControl = this.formMatricula.get('alumno.idtipodoc');
      const alumnoNumeroDocControl = this.formMatricula.get('alumno.numeroDocumento');

      apoderadoTipoDocControl?.valueChanges.pipe(
          startWith(apoderadoTipoDocControl.value)
      ).subscribe(tipoDocValue => {
          if (this.currentView === 'search') {
              if (tipoDocValue && !this.isSearching) {
                  apoderadoNumeroDocControl?.enable({ emitEvent: false });
              } else {
                  apoderadoNumeroDocControl?.disable({ emitEvent: false });
                  apoderadoNumeroDocControl?.reset('', { emitEvent: false });
              }
               apoderadoNumeroDocControl?.updateValueAndValidity();
          }
      });

      apoderadoTipoDocControl?.valueChanges.pipe(
           startWith(apoderadoTipoDocControl.value)
       ).subscribe(tipoDocValue => {
           if (this.currentView === 'apoderado' && !this.apoderadoEncontrado) {
               if (tipoDocValue) {
                   apoderadoNumeroDocControl?.enable({ emitEvent: false });
               } else {
                   apoderadoNumeroDocControl?.disable({ emitEvent: false });
               }
               apoderadoNumeroDocControl?.updateValueAndValidity();
           }
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
                textControl?.setValidators(Validators.required);
            } else {
                textControl?.disable({ emitEvent: false });
                textControl?.reset('', { emitEvent: false });
                textControl?.clearValidators();
            }
            textControl?.updateValueAndValidity({ emitEvent: false });
        });
    });
  }

  setupConditionalValidators(): void {
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
        if (apoderado.fechaNacimiento) {
          try {
                const dateObj = new Date(apoderado.fechaNacimiento);
               apoderado.fechaNacimiento = !isNaN(dateObj.getTime()) ? dateObj.toISOString().substring(0, 10) : '';
          } catch(e) {
               apoderado.fechaNacimiento = '';
          }
        }

        this.apoderadoEncontrado = apoderado;
        this.formMatricula.get('apoderado')?.patchValue({
            ...apoderado,
            idapoderado: apoderado.idapoderado
        });

        this.formMatricula.get('apoderado.idtipodoc')?.disable({ emitEvent: false });
        this.formMatricula.get('apoderado.numeroDocumento')?.disable({ emitEvent: false });

        this.mostrarFormularioApoderado = true;
        this.currentView = 'apoderado';
        this.notificationService.showNotification('Apoderado encontrado. Verifique/complete los datos.', 'success');

        this.formMatricula.get('apoderado')?.markAsPristine();
        this.formMatricula.get('apoderado')?.markAsUntouched();
        this.formMatricula.get('relacionEstudiante')?.reset('', { emitEvent: false });
        this.formMatricula.get('relacionEstudiante')?.markAsPristine();
        this.formMatricula.get('relacionEstudiante')?.markAsUntouched();

        setTimeout(() => this.focusFirstInvalidControl('apoderado'), 50);
      },
      error: (err: HttpErrorResponse) => {
        this.apoderadoEncontrado = null;
        const currentValues = this.formMatricula.get('apoderado')?.value;
        this.formMatricula.get('apoderado')?.reset({
            idapoderado: null,
            nombre: '', apellidoPaterno: '', apellidoMaterno: '', genero: '', telefono: '',
            direccion: '', correo: '', fechaNacimiento: ''
        }, { emitEvent: false });
        this.formMatricula.get('apoderado.idtipodoc')?.patchValue(currentValues.idtipodoc, { emitEvent: false });
         this.formMatricula.get('apoderado.numeroDocumento')?.patchValue(currentValues.numeroDocumento, { emitEvent: false });
         this.formMatricula.get('apoderado.numeroDocumento')?.updateValueAndValidity();

         this.formMatricula.get('apoderado.idtipodoc')?.enable({ emitEvent: false });

        this.formMatricula.get('relacionEstudiante')?.reset('', { emitEvent: false });
        this.formMatricula.get('relacionEstudiante')?.markAsPristine();
        this.formMatricula.get('relacionEstudiante')?.markAsUntouched();
        this.mostrarFormularioApoderado = true;
        this.mostrarFormularioAlumno = false;
        this.currentView = 'apoderado';

        if (err.status === 404) {
            this.notificationService.showNotification('Apoderado no registrado. Complete los datos para crearlo.', 'info');
        } else {
            this.notificationService.showNotification('Error al buscar apoderado. Intente de nuevo.', 'error');
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
      this.mostrarFormularioAlumno = true;
      this.notificationService.showNotification('Datos del apoderado correctos. Ingrese datos del alumno.', 'info');
      setTimeout(() => document.getElementById('alumno-fieldset')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      setTimeout(() => this.focusFirstInvalidControl('alumno'), 100);
    } else {
      this.mostrarFormularioAlumno = false;
      setTimeout(() => {
         this.focusFirstInvalidControl('apoderado', undefined, 'relacionEstudiante');
      }, 50);
    }
  }

  regresarAApoderado(): void {
    this.currentView = 'apoderado';
    this.mostrarFormularioAlumno = false;
    setTimeout(() => document.querySelector('.apoderado-form legend')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  regresarABusqueda(): void {
      this.currentView = 'search';
      this.mostrarFormularioApoderado = false;
      this.mostrarFormularioAlumno = false;
      this.apoderadoEncontrado = null;

      this.formMatricula.get('apoderado.idtipodoc')?.reset('', { emitEvent: false });
      this.formMatricula.get('apoderado.numeroDocumento')?.reset('', { emitEvent: false });
      this.formMatricula.get('apoderado.idtipodoc')?.setErrors(null);
      this.formMatricula.get('apoderado.numeroDocumento')?.setErrors(null);
      this.formMatricula.get('apoderado.idtipodoc')?.markAsUntouched();
      this.formMatricula.get('apoderado.numeroDocumento')?.markAsUntouched();

      this.formMatricula.get('apoderado.idtipodoc')?.enable({ emitEvent: false });
  }

  private convertToLocalDateTime(dateString: string | null | undefined): string | null {
      if (!dateString) return null;
      try {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
              return null;
          }
          return `${dateString}T00:00:00`;
      } catch (e) {
          return null;
      }
  }

  private processMatricula(estadoMatricula: 'COMPLETADO' | 'EN PROCESO'): void {
    if (this.isSubmitting) return;

    if (estadoMatricula === 'COMPLETADO') {
        this.formMatricula.markAllAsTouched();
        this.formMatricula.updateValueAndValidity();
        if (this.formMatricula.invalid) {
            if (this.formMatricula.get('alumno')?.invalid) {
                this.currentView = 'alumno';
                setTimeout(() => this.focusFirstInvalidControl('alumno'), 50);
            } else if (this.formMatricula.get('apoderado')?.invalid || this.formMatricula.get('relacionEstudiante')?.invalid) {
                this.currentView = 'apoderado';
                setTimeout(() => this.focusFirstInvalidControl('apoderado', undefined, 'relacionEstudiante'), 50);
            }
            this.notificationService.showNotification('Formulario inválido. Revise los campos marcados.', 'error');
            return;
        }
    }


    if (!this.seccion || this.seccion === 'SIN VACANTE' || this.seccion === 'ERROR') {
        this.notificationService.showNotification(`No se puede ${estadoMatricula === 'COMPLETADO' ? 'registrar' : 'pausar'}: sección inválida o sin vacantes.`, 'error');
        return;
    }

    this.isSubmitting = true;
    this.cdRef.detectChanges();

    const formData = this.formMatricula.getRawValue();
    const apoderadoFechaNacimiento = this.convertToLocalDateTime(formData.apoderado.fechaNacimiento);
    const alumnoFechaNacimiento = this.convertToLocalDateTime(formData.alumno.fechaNacimiento);

    const apoderadoData: Apoderado = {
        ...formData.apoderado,
        fechaNacimiento: apoderadoFechaNacimiento
    };
    if (apoderadoData.idapoderado === null) {
        delete apoderadoData.idapoderado;
    }


    const alumnoData: Alumno = {
        nombre: formData.alumno.nombre || null,
        apellidoPaterno: formData.alumno.apellidoPaterno || null,
        apellidoMaterno: formData.alumno.apellidoMaterno || null,
        nacionalidad: formData.alumno.nacionalidad || null,
        genero: formData.alumno.genero || null,
        idtipodoc: formData.alumno.idtipodoc || null,
        numeroDocumento: formData.alumno.numeroDocumento || null,
        fechaNacimiento: alumnoFechaNacimiento,
        direccion: formData.alumno.direccion || null,
        tipoIntercambio: formData.alumno.tieneIntercambio ? (formData.alumno.tipoIntercambio || null) : null,
        tipoDiscapacidad: formData.alumno.tieneDiscapacidad ? (formData.alumno.tipoDiscapacidad || null) : null,
        tipoOtros: formData.alumno.tieneOtros ? (formData.alumno.tipoOtros || null) : null
    };

    let apoderadoObservable: Observable<Apoderado>;

    if (this.apoderadoEncontrado && this.apoderadoEncontrado.idapoderado) {
        const apoderadoGroup = this.formMatricula.get('apoderado') as FormGroup;
        const isApoderadoModified = Object.keys(apoderadoGroup.controls).some(key => apoderadoGroup.get(key)?.dirty);

        if (isApoderadoModified || estadoMatricula === 'EN PROCESO') {
             const apoderadoPayload = { ...this.apoderadoEncontrado, ...apoderadoData, idapoderado: this.apoderadoEncontrado.idapoderado };
            apoderadoObservable = this.apoderadoService.editarApoderado(this.apoderadoEncontrado.idapoderado, apoderadoPayload).pipe(
                map((resp: any) => (resp && resp.idapoderado) ? resp : (resp && resp.data && resp.data.idapoderado) ? resp.data : (() => { throw new Error('Respuesta inesperada al editar apoderado.'); })())
            );
        } else {
            apoderadoObservable = of(this.apoderadoEncontrado);
        }
    } else {
        if (Object.values(apoderadoData).some(val => val !== null && val !== '' && val !== undefined) || estadoMatricula === 'EN PROCESO') {
            apoderadoObservable = this.apoderadoService.agregarApoderado(apoderadoData).pipe(
                map((apoderadoCreado: Apoderado) => (apoderadoCreado && apoderadoCreado.idapoderado) ? apoderadoCreado : (() => { throw new Error('Respuesta inesperada al crear apoderado.'); })())
            );
        } else {
            apoderadoObservable = of({ idapoderado: undefined } as Apoderado);
        }
    }

    apoderadoObservable.pipe(
        switchMap((apoderadoProcesado: Apoderado) => {
            if (estadoMatricula === 'EN PROCESO' && !apoderadoProcesado?.idapoderado && Object.values(apoderadoData).some(val => val !== null && val !== '' && val !== undefined)) {
                 throw new Error('No se pudo procesar el Apoderado con los datos proporcionados para pausar.');
            }

            const idApoderadoFinal = apoderadoProcesado?.idapoderado;

            if (Object.values(alumnoData).some(val => val !== null && val !== '' && val !== undefined) || estadoMatricula === 'EN PROCESO') {
                return this.alumnoService.agregarAlumno(alumnoData).pipe(
                    map((alumnoResp: any) => {
                        if (alumnoResp && alumnoResp.code >= 200 && alumnoResp.code < 300 && alumnoResp.data && alumnoResp.data.idalumno) {
                            const idAlumnoCreado = alumnoResp.data.idalumno;
                            return { idApoderado: idApoderadoFinal, idAlumno: idAlumnoCreado };
                        } else {
                             if(estadoMatricula === 'COMPLETADO' && (!alumnoResp?.data?.idalumno) ){
                                throw new Error('Respuesta inesperada al crear alumno.');
                             }
                             return { idApoderado: idApoderadoFinal, idAlumno: undefined };
                        }
                    })
                );
            } else {
                 return of({ idApoderado: idApoderadoFinal, idAlumno: undefined });
            }
        }),
        switchMap(({ idApoderado, idAlumno }) => {
            if (estadoMatricula === 'COMPLETADO' && (!idApoderado || !idAlumno)) {
                throw new Error('Faltan IDs de apoderado o alumno para completar la matrícula.');
            }
             if (estadoMatricula === 'EN PROCESO' && !idApoderado && !idAlumno && !formData.relacionEstudiante && !this.nivel && !this.grado && !this.seccion) {
                this.notificationService.showNotification('No hay suficientes datos para pausar el trámite.', 'info');
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
                estadoMatricula: estadoMatricula
            };
            return this.matriculaService.agregarMatricula(matriculaRequest).pipe(
     map((matriculaDesdeServicio: Matricula) => {
         if (matriculaDesdeServicio && matriculaDesdeServicio.idmatricula) {
             return matriculaDesdeServicio;
         } else {
             if (estadoMatricula === 'COMPLETADO') {
                  throw new Error('Respuesta inesperada del servicio de matrícula (falta ID en la matrícula devuelta).');
             }
             throw new Error('Respuesta inesperada del servicio de matrícula (objeto matrícula inválido o sin ID).');
         }
     })
);
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
            this.cdRef.detectChanges();
        })
    ).subscribe({
        next: (matriculaCreada: any) => {

            if (estadoMatricula === 'COMPLETADO') {
                 if (matriculaCreada && matriculaCreada.idmatricula) {
                     const idMatriculaCreada = matriculaCreada.idmatricula;
                     this.notificationService.showNotification('¡Matrícula registrada! Generando comprobantes...', 'success');
                     this.router.navigate(['/comprobantes'], {
                         queryParams: { idMatricula: idMatriculaCreada, nivel: this.nivel }
                     });
                 } else {

                     this.notificationService.showNotification('Matrícula procesada, pero hubo un problema al obtener la confirmación para COMPLETADO.', 'error');
                 }
            } else if (estadoMatricula === 'EN PROCESO') {

                this.notificationService.showNotification('Matrícula guardada en proceso.', 'info');
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
                       elementId = `${groupName}_${key}`;
                       if (elementId === 'apoderado_numeroDocumento' && this.currentView === 'search') {
                            elementId = 'apoderado_numeroDocumento_buscar';
                       } else if (elementId === 'apoderado_numeroDocumento' && this.currentView === 'apoderado') {
                            elementId = 'apoderado_numeroDocumento_completo';
                       } else if (elementId === 'apoderado_idtipodoc' && this.currentView === 'search') {
                            elementId = 'apoderado_idtipodoc_search';
                       } else if (elementId === 'apoderado_idtipodoc' && this.currentView === 'apoderado') {
                            elementId = 'apoderado_idtipodoc_confirm';
                       }
                       else if (elementId === 'apoderado_genero') {
                           elementId = 'apoderado_genero';
                       } else if (elementId === 'alumno_genero') {
                           elementId = 'alumno_genero';
                       } else if (elementId.startsWith('alumno_tipo')) {
                           elementId = elementId.replace('tipo', 'tiene');
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
           }
       }
   }
}
