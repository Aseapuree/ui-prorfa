import { TooltipComponent } from './../../../general/components/tooltip/tooltip.component';
import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EntidadService } from '../../services/entidad.service';
import { Entidad, DatosNGS, DocumentoEntidad, Nivel, Grado, SeccionVacantes } from '../../interfaces/DTOEntidad';
import { HttpClientModule } from '@angular/common/http';
import { finalize } from 'rxjs';
import { GeneralLoadingSpinnerComponent } from '../../../general/components/spinner/spinner.component';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NotificationService } from '../../../campus/components/shared/notificaciones/notification.service';
import { NotificationComponent } from '../../../campus/components/shared/notificaciones/notification.component';

@Component({
  selector: 'app-entidad',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    GeneralLoadingSpinnerComponent,
    ReactiveFormsModule,
    FormsModule,
    NotificationComponent,
    TooltipComponent
  ],
  templateUrl: './entidad.component.html',
  styleUrls: ['./entidad.component.scss']
})
export class EntidadComponent implements OnInit {
  isDarkMode: boolean = true; // Controla el modo oscuro globalmente
  entidad: Entidad | null = null;
  cargando = false;
  editando = false;
  guardando = false;
  mensajeSpinner: string = 'Cargando datos...';
  formularioEntidad!: FormGroup;
  mostrarModalSecciones = false;
  indiceNivelSeleccionado?: number;
  indiceGradoSeleccionado?: number;
  nombreGradoSeleccionado: string = '';
  formularioSecciones!: FormGroup;
  vistaPreviaLogo: string = '';
  archivoLogoSeleccionado: File | null = null;
  @ViewChild('logoInput') inputLogo?: ElementRef<HTMLInputElement>;
  @ViewChildren('carouselViewport') carouselViewports!: QueryList<ElementRef>;
  carouselPositions: number[] = []; // Posición actual de cada carrusel por nivel
  visibleCards: number[] = []; // Número de tarjetas visibles por nivel
  cardWidth = 150 + 16; // Ancho de la tarjeta (150px) + gap (1rem = 16px)
  keysNecesarios: string[] = ['documento1', 'documento2'];
  keysAdicionales: string[] = ['intercambio', 'discapacidad'];
  keysDocumentosAdicionalesMap: { [key: string]: string[] } = {
    'intercambio': ['documento1', 'documento2'],
    'discapacidad': ['documento1']
  };
  positionNecesarios: number = 0;
  positionAdicionales: number = 0;
  itemHeight = 100; // Altura aproximada de cada item
  @ViewChild('necesariosViewport') necesariosViewport?: ElementRef;
  @ViewChild('necesariosContent') necesariosContent?: ElementRef;
  @ViewChild('adicionalesViewport') adicionalesViewport?: ElementRef;
  @ViewChild('adicionalesContent') adicionalesContent?: ElementRef;

  constructor(
    private entidadService: EntidadService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const idUsuario = localStorage.getItem('IDUSER');
    if (idUsuario) {
      this.obtenerDatosEntidadPorUsuario(idUsuario);
    } else {
      this.notificationService.showNotification('Error: No se pudo identificar al usuario.', 'error');
    }
    this.updateDarkMode();/*MODO OSCURO */
  }

  ngAfterViewInit(): void {
    this.updateDarkMode();/*MODO OSCURO */
    this.carouselViewports.changes.subscribe(() => this.updateVisibleCards());
    this.updateVisibleCards();
  }

  private updateDarkMode(): void {
    // Agregar o quitar clase 'dark'
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.cdRef.detectChanges();
  }

  private updateVisibleCards(): void {
    if (this.carouselViewports) {
      this.visibleCards = this.carouselViewports.toArray().map(el => {
        const vw = el.nativeElement.clientWidth;
        const gap = 16;
        const cardW = 150;
        const step = cardW + gap;
        return Math.max(1, Math.floor((vw + gap / 2) / step));
      });
      this.cdRef.detectChanges();
    }
  }

  // Inicializa las posiciones del carrusel
  private inicializarCarruseles(): void {
    if (this.entidad?.datosngs?.niveles) {
      this.carouselPositions = new Array(this.entidad.datosngs.niveles.length).fill(0);
      this.visibleCards = new Array(this.entidad.datosngs.niveles.length).fill(0);
      this.cdRef.detectChanges(); // Asegura que la UI se actualice
      this.updateVisibleCards();
    } else {
      this.carouselPositions = [];
      this.visibleCards = [];
    }
  }

  // Obtiene la transformación translateX para el carrusel
  getTranslateX(nivelIndex: number): number {
    return -this.carouselPositions[nivelIndex] * this.cardWidth;
  }

  // Determina si mostrar la flecha izquierda
  mostrarFlechaIzquierda(nivelIndex: number): boolean {
    return this.carouselPositions[nivelIndex] > 0;
  }

  // Determina si mostrar la flecha derecha
  mostrarFlechaDerecha(nivelIndex: number): boolean {
    let numGrados = 0;
    const visible = this.visibleCards[nivelIndex] || (this.editando ? 6 : 3);
    if (this.editando) {
      numGrados = this.grados(nivelIndex).length;
    } else {
      if (!this.entidad || !this.entidad.datosngs || !this.entidad.datosngs.niveles || !this.entidad.datosngs.niveles[nivelIndex]) {
        return false;
      }
      numGrados = this.entidad.datosngs.niveles[nivelIndex].grados?.length || 0;
    }
    return numGrados > visible && this.carouselPositions[nivelIndex] < Math.max(0, numGrados - visible);
  }

  // Mueve el carrusel a la izquierda
  moverIzquierda(nivelIndex: number): void {
    if (this.carouselPositions[nivelIndex] > 0) {
      this.carouselPositions[nivelIndex]--;
      this.cdRef.detectChanges();
    }
  }

  // Mueve el carrusel a la derecha
  moverDerecha(nivelIndex: number): void {
    let numGrados = 0;
    const visible = this.visibleCards[nivelIndex] || (this.editando ? 6 : 3);
    if (this.editando) {
      numGrados = this.grados(nivelIndex).length;
    } else {
      if (!this.entidad || !this.entidad.datosngs || !this.entidad.datosngs.niveles || !this.entidad.datosngs.niveles[nivelIndex]) {
        return;
      }
      numGrados = this.entidad.datosngs.niveles[nivelIndex].grados?.length || 0;
    }
    const maxPosition = Math.max(0, numGrados - visible);
    if (this.carouselPositions[nivelIndex] < maxPosition) {
      this.carouselPositions[nivelIndex]++;
      this.cdRef.detectChanges();
    }
  }

  obtenerDatosEntidadPorUsuario(id: string): void {
    this.cargando = true;
    this.mensajeSpinner = 'Cargando datos de la entidad...';
    this.entidadService.obtenerEntidadPorUsuario(id).pipe(
      finalize(() => {
        this.cargando = false;
        this.inicializarCarruseles(); // Inicializa los carruseles después de cargar datos
        this.cdRef.detectChanges();
      })
    ).subscribe({
      next: entidad => {
        this.entidad = entidad;
        this.crearFormularioDeEntidad(entidad);
      },
      error: err => {
        this.notificationService.showNotification(`Error al cargar la entidad: ${err.message}`, 'error');
      }
    });
  }

  iniciarEdicion(): void {
    this.editando = true;
    this.vistaPreviaLogo = this.entidad?.logoColegio || '';
    this.carouselPositions = new Array(this.carouselPositions.length).fill(0);
    this.cdRef.detectChanges();
    this.updateVisibleCards();
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.archivoLogoSeleccionado = null;
    this.vistaPreviaLogo = '';
    if (this.entidad) {
      this.crearFormularioDeEntidad(this.entidad);
    }
    this.keysNecesarios = ['documento1', 'documento2'];
    this.keysAdicionales = ['intercambio', 'discapacidad'];
    this.keysDocumentosAdicionalesMap = {
      'intercambio': ['documento1', 'documento2'],
      'discapacidad': ['documento1']
    };
    this.carouselPositions = new Array(this.carouselPositions.length).fill(0);
    this.cdRef.detectChanges();
    this.updateVisibleCards();
  }

  guardarCambios(): void {
  if (!this.esValidoModificado(this.formularioEntidad)) {
    this.marcarModificadosComoTocados(this.formularioEntidad);
    this.notificationService.showNotification('Por favor, complete todos los campos requeridos que ha editado.', 'error');
    return;
  }

  // Verificar que entidad no sea null y que tenga identidad
  if (!this.entidad || !this.entidad.identidad) {
    this.notificationService.showNotification('Error: No se puede identificar la entidad a actualizar.', 'error');
    return;
  }

  this.guardando = true;
  this.mensajeSpinner = 'Guardando cambios...';

  // Primero subir el logo si es necesario
  this.subirLogoSiEsNecesario()
    .then(() => {
      // Después de subir el logo (si era necesario), continuar con el guardado normal
      const cambios = this.obtenerValoresModificados(this.formularioEntidad);

      // Asegurarse de que siempre se incluya la identidad
      if (!cambios.identidad && this.entidad?.identidad) {
        cambios.identidad = this.entidad.identidad;
      }

      if (cambios.datosngs && cambios.datosngs.niveles) {
        cambios.datosngs.niveles.forEach((nivel: any) => {
          if (nivel.grados) {
            nivel.grados.forEach((grado: any) => {
              if (grado.secciones) {
                grado.secciones.forEach((seccion: any) => {
                  if (seccion.vacantes !== undefined) {
                    seccion.vacantes = Number(seccion.vacantes);
                  }
                });
              }
            });
          }
        });
      }

      // Usamos una variable local con aserción de tipo para evitar el error de TypeScript
      const entidadId: string = this.entidad!.identidad!;

      this.entidadService.editarEntidad(entidadId, cambios).pipe(
        finalize(() => {
          this.guardando = false;
          this.mensajeSpinner = 'Cargando datos...';
        })
      ).subscribe({
        next: entidadActualizada => {
          this.entidad = entidadActualizada;
          this.editando = false;
          this.crearFormularioDeEntidad(entidadActualizada);
          this.inicializarCarruseles();
          this.notificationService.showNotification('Entidad actualizada correctamente.', 'success');
        },
        error: err => {
          this.notificationService.showNotification(`Error al guardar los cambios: ${err.message}`, 'error');
        }
      });
    })
    .catch(err => {
      this.guardando = false;
      this.mensajeSpinner = 'Cargando datos...';
    });
}

  private esValidoModificado(control: AbstractControl): boolean {
    if (control instanceof FormGroup) {
      return Object.keys(control.controls).every(key => {
        const child = control.get(key)!;
        return this.esValidoModificado(child);
      });
    } else if (control instanceof FormArray) {
      return control.controls.every(child => this.esValidoModificado(child));
    } else {
      if (control.dirty) {
        return control.valid;
      } else {
        return true;
      }
    }
  }

  private obtenerValoresModificados(control: AbstractControl): any {
  const cambios: any = {};

  if (control instanceof FormGroup) {
    Object.keys(control.controls).forEach(key => {
      const child = control.get(key)!;
      if (child.dirty) {
        if (child instanceof FormGroup) {
          // Enviar el objeto completo si algún campo del formulario anidado está modificado
          cambios[key] = child.value;
        } else if (child instanceof FormArray) {
          cambios[key] = child.value;
        } else {
          cambios[key] = child.value;
        }
      }
    });
  }
  return cambios;
}

  private marcarModificadosComoTocados(control: AbstractControl): void {
    if (control instanceof FormGroup) {
      Object.values(control.controls).forEach(child => this.marcarModificadosComoTocados(child));
    } else if (control instanceof FormArray) {
      control.controls.forEach(child => this.marcarModificadosComoTocados(child));
    } else {
      if (control.dirty) {
        control.markAsTouched();
      }
    }
  }

  crearFormularioDeEntidad(entidad: Entidad): void {
    this.formularioEntidad = this.fb.group({
      nombreColegio: [entidad.nombreColegio ?? '', Validators.required],
      direccionColegio: [entidad.direccionColegio ?? '', Validators.required],
      rucColegio: [entidad.rucColegio ?? '', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      razonSocial: [entidad.razonSocial ?? '', Validators.required],
      telefonoColegio: [entidad.telefonoColegio ?? '', [Validators.required, Validators.pattern(/^(\d{7,9}|074\s*-\s*\d{6})$/)]],
      correoColegio: [entidad.correoColegio ?? '', [Validators.required, Validators.email]],
      logoColegio: [entidad.logoColegio ?? '', [Validators.required, this.validadorUrl]],
      documentos: this.crearFormGroupDocumentos(entidad.documentos),
      datosngs: this.crearFormGroupDatosNgs(entidad.datosngs)
    });
  }

  validadorUrl(control: any): { [key: string]: boolean } | null {
    const value = control.value;
    if (!value) return null;
    if (value.startsWith('data:image/')) return null;
    if (/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(value)) return null;
    return { 'invalidUrl': true };
  }

  crearFormGroupDocumentos(documentos?: DocumentoEntidad): FormGroup {
    const necesariosGroup = this.fb.group<{ [key: string]: AbstractControl<any, any> }>({});
    this.keysNecesarios.forEach(key => {
      necesariosGroup.addControl(key, this.fb.control(((documentos?.necesarios as any)?.[key] ?? '').toUpperCase(), Validators.required));
    });

    const adicionalesGroup = this.fb.group<{ [key: string]: AbstractControl<any, any> }>({});
    this.keysAdicionales.forEach(catKey => {
      const catGroup = this.fb.group<{ [key: string]: AbstractControl<any, any> }>({
        nombre: this.fb.control(((documentos?.adicionales as any)?.[catKey]?.nombre ?? catKey.charAt(0).toUpperCase() + catKey.slice(1)).toUpperCase())
      });
      this.keysDocumentosAdicionalesMap[catKey].forEach(docKey => {
        catGroup.addControl(docKey, this.fb.control(((documentos?.adicionales as any)?.[catKey]?.[docKey] ?? '').toUpperCase()));
      });
      adicionalesGroup.addControl(catKey, catGroup);
    });

    return this.fb.group({
      necesarios: necesariosGroup,
      adicionales: adicionalesGroup
    });
  }

  keysDocumentosAdicionales(catKey: string): string[] {
    return this.keysDocumentosAdicionalesMap[catKey] || [];
  }

  agregarDocumentoNecesario(): void {
    const necesarios = this.formularioEntidad.get('documentos.necesarios') as FormGroup;
    const newKey = `documento${this.keysNecesarios.length + 1}`;
    necesarios.addControl(newKey, this.fb.control('', Validators.required));
    this.keysNecesarios.push(newKey);
    this.cdRef.detectChanges();
    this.positionNecesarios = 0;
  }

  eliminarDocumentoNecesario(i: number): void {
    const necesarios = this.formularioEntidad.get('documentos.necesarios') as FormGroup;
    const key = this.keysNecesarios[i];
    necesarios.removeControl(key);
    this.keysNecesarios.splice(i, 1);
    this.cdRef.detectChanges();
    this.positionNecesarios = Math.min(this.positionNecesarios, this.getMaxScrollNecesarios());
  }

  agregarCategoriaAdicional(): void {
    const adicionales = this.formularioEntidad.get('documentos.adicionales') as FormGroup;
    const newKey = `categoria${this.keysAdicionales.length + 1}`;
    const newGroup = this.fb.group({
      nombre: ['', Validators.required],
      documento1: ['']
    });
    adicionales.addControl(newKey, newGroup);
    this.keysAdicionales.push(newKey);
    this.keysDocumentosAdicionalesMap[newKey] = ['documento1'];
    this.cdRef.detectChanges();
    this.positionAdicionales = 0;
  }

  eliminarCategoriaAdicional(catIndex: number): void {
    const adicionales = this.formularioEntidad.get('documentos.adicionales') as FormGroup;
    const key = this.keysAdicionales[catIndex];
    adicionales.removeControl(key);
    this.keysAdicionales.splice(catIndex, 1);
    delete this.keysDocumentosAdicionalesMap[key];
    this.cdRef.detectChanges();
    this.positionAdicionales = Math.min(this.positionAdicionales, this.getMaxScrollAdicionales());
  }

  agregarDocumentoAdicional(catKey: string): void {
    const categoria = this.formularioEntidad.get('documentos.adicionales.' + catKey) as FormGroup;
    const newKey = `documento${this.keysDocumentosAdicionalesMap[catKey].length + 1}`;
    categoria.addControl(newKey, this.fb.control(''));
    this.keysDocumentosAdicionalesMap[catKey].push(newKey);
    this.cdRef.detectChanges();
    this.positionAdicionales = 0;
  }

  eliminarDocumentoAdicional(catKey: string, docIndex: number): void {
    const categoria = this.formularioEntidad.get('documentos.adicionales.' + catKey) as FormGroup;
    const docKey = this.keysDocumentosAdicionalesMap[catKey][docIndex];
    categoria.removeControl(docKey);
    this.keysDocumentosAdicionalesMap[catKey].splice(docIndex, 1);
    this.cdRef.detectChanges();
    this.positionAdicionales = Math.min(this.positionAdicionales, this.getMaxScrollAdicionales());
  }

  crearFormGroupDatosNgs(datos?: DatosNGS): FormGroup {
    const nivelesArray = datos?.niveles?.map(nivel => this.crearFormGroupNivel(nivel)) || [];
    const formGroup = this.fb.group({
      niveles: this.fb.array(nivelesArray, Validators.minLength(1))
    });
    return formGroup;
  }

  crearFormGroupNivel(nivel: Nivel): FormGroup {
    const gradosArray = nivel.grados?.map(grado => this.crearFormGroupGrado(grado)) || [];
    return this.fb.group({
      nombre: [nivel.nombre ?? '', [Validators.required, this.uniqueNivelNameValidator()]],
      grados: this.fb.array(gradosArray, Validators.minLength(1))
    });
  }

  crearFormGroupGrado(grado: Grado): FormGroup {
    const seccionesArray = grado.secciones?.map(seccion => this.crearFormGroupSeccion(seccion)) || [];
    return this.fb.group({
      nombre: [grado.nombre ?? '', [Validators.required, this.uniqueGradoNameValidator()]],
      secciones: this.fb.array(seccionesArray, Validators.minLength(1))
    });
  }

  crearFormGroupSeccion(seccion: SeccionVacantes): FormGroup {
    return this.fb.group({
      nombre: [seccion.nombre ?? '', [Validators.required, this.uniqueSeccionNameValidator()]],
      vacantes: [seccion.vacantes ?? 0, [Validators.required, Validators.min(0)]]
    });
  }

  uniqueNivelNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !control.parent) return null;
      const currentNombre = control.value.toLowerCase();
      const nivelesArray = control.parent.parent as FormArray;
      let count = 0;
      for (const nivelCtrl of nivelesArray.controls) {
        const nombreCtrl = nivelCtrl.get('nombre');
        if (nombreCtrl && nombreCtrl.value.toLowerCase() === currentNombre) {
          count++;
        }
      }
      return count > 1 ? { duplicateNivel: true } : null;
    };
  }

  uniqueGradoNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !control.parent) return null;
      const currentNombre = control.value.toLowerCase();
      const gradosArray = control.parent.parent as FormArray;
      let count = 0;
      for (const gradoCtrl of gradosArray.controls) {
        const nombreCtrl = gradoCtrl.get('nombre');
        if (nombreCtrl && nombreCtrl.value.toLowerCase() === currentNombre) {
          count++;
        }
      }
      return count > 1 ? { duplicateGrado: true } : null;
    };
  }

  uniqueSeccionNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !control.parent) return null;
      const currentNombre = control.value.toLowerCase();
      const seccionesArray = control.parent.parent as FormArray;
      let count = 0;
      for (const seccionCtrl of seccionesArray.controls) {
        const nombreCtrl = seccionCtrl.get('nombre');
        if (nombreCtrl && nombreCtrl.value.toLowerCase() === currentNombre) {
          count++;
        }
      }
      return count > 1 ? { duplicateSeccion: true } : null;
    };
  }

  niveles(): FormArray {
    return this.formularioEntidad.get('datosngs.niveles') as FormArray;
  }

  grados(nivelIndex: number): FormArray {
    return this.niveles().at(nivelIndex).get('grados') as FormArray;
  }

  seccion(nivelIndex: number, gradoIndex: number): FormArray {
    return this.grados(nivelIndex).at(gradoIndex).get('secciones') as FormArray;
  }

  agregarNivel(): void {
    const nuevoNivel = this.fb.group({
      nombre: ['', [Validators.required, this.uniqueNivelNameValidator()]],
      grados: this.fb.array([], Validators.minLength(1))
    });
    this.niveles().push(nuevoNivel);
    this.niveles().markAsDirty();
    this.carouselPositions.push(0); // Añade posición inicial para el nuevo nivel
    this.visibleCards.push(0);
    this.cdRef.detectChanges();
    this.updateVisibleCards();
  }

  agregarGrado(nivelIndex: number): void {
    const nuevoGrado = this.fb.group({
      nombre: ['', [Validators.required, this.uniqueGradoNameValidator()]],
      secciones: this.fb.array([], Validators.minLength(1))
    });
    this.grados(nivelIndex).push(nuevoGrado);
    this.grados(nivelIndex).markAsDirty();
    // Abrir el modal de secciones directamente
    this.indiceNivelSeleccionado = nivelIndex;
    this.indiceGradoSeleccionado = this.grados(nivelIndex).length - 1;
    this.nombreGradoSeleccionado = '';
    this.formularioSecciones = this.fb.group({
      secciones: this.fb.array([])
    });
    this.mostrarModalSecciones = true;
    this.cdRef.detectChanges();
    this.updateVisibleCards();
  }

  eliminarNivel(nivelIndex: number): void {
    this.niveles().removeAt(nivelIndex);
    this.niveles().markAsDirty();
    this.carouselPositions.splice(nivelIndex, 1); // Actualiza las posiciones del carrusel
    this.visibleCards.splice(nivelIndex, 1);
    this.cdRef.detectChanges();
    this.updateVisibleCards();
  }

  eliminarGrado(nivelIndex: number, gradoIndex: number): void {
    this.grados(nivelIndex).removeAt(gradoIndex);
    this.grados(nivelIndex).markAsDirty();
    // Reinicia la posición del carrusel si es necesario
    if (this.carouselPositions[nivelIndex] > 0) {
      const numGrados = this.grados(nivelIndex).length;
      const visible = this.visibleCards[nivelIndex] || (this.editando ? 6 : 3);
      const maxPosition = Math.max(0, numGrados - visible);
      this.carouselPositions[nivelIndex] = Math.min(this.carouselPositions[nivelIndex], maxPosition);
      this.cdRef.detectChanges();
    }
    this.updateVisibleCards();
  }

  abrirModalSecciones(nivelIndex: number, gradoIndex: number): void {
    this.indiceNivelSeleccionado = nivelIndex;
    this.indiceGradoSeleccionado = gradoIndex;
    if (this.editando) {
      this.nombreGradoSeleccionado = this.grados(nivelIndex).at(gradoIndex).get('nombre')?.value || '';
    } else {
      this.nombreGradoSeleccionado = this.entidad?.datosngs?.niveles?.[nivelIndex]?.grados?.[gradoIndex]?.nombre || '';
    }
    let secciones: SeccionVacantes[];
    if (this.editando) {
      secciones = this.seccion(nivelIndex, gradoIndex).value;
    } else {
      secciones = this.entidad?.datosngs?.niveles?.[nivelIndex]?.grados?.[gradoIndex]?.secciones || [];
    }
    this.formularioSecciones = this.fb.group({
      secciones: this.fb.array(secciones.map((s: SeccionVacantes) => this.crearFormGroupSeccion(s)))
    });
    this.mostrarModalSecciones = true;
    this.cdRef.detectChanges();
  }

  cerrarModalSecciones(): void {
    this.mostrarModalSecciones = false;
    this.cdRef.detectChanges();
  }

  agregarSeccion(): void {
    const nuevaSeccion = this.crearFormGroupSeccion({ nombre: '', vacantes: 0 });
    this.secciones().push(nuevaSeccion);
    this.cdRef.detectChanges();
  }

  eliminarSeccion(seccionIndex: number): void {
    this.secciones().removeAt(seccionIndex);
    this.cdRef.detectChanges();
  }

  secciones(): FormArray {
    return this.formularioSecciones.get('secciones') as FormArray;
  }

  guardarSecciones(): void {
    if (!this.formularioSecciones.valid) {
        this.formularioSecciones.markAllAsTouched();
        this.notificationService.showNotification('Por favor, complete todos los campos requeridos.', 'error');
        return;
    }

    if (!this.entidad || !this.entidad.identidad) {
        this.notificationService.showNotification('Error: No se puede identificar la entidad a actualizar.', 'error');
        return;
    }

    const nuevasSecciones = this.formularioSecciones.value.secciones.map((s: any) => ({ ...s, vacantes: Number(s.vacantes) }));

    if (this.editando) {
        const seccionesCtrl = this.seccion(this.indiceNivelSeleccionado!, this.indiceGradoSeleccionado!);
        seccionesCtrl.clear();
        nuevasSecciones.forEach((s: SeccionVacantes) => seccionesCtrl.push(this.crearFormGroupSeccion(s)));
        seccionesCtrl.markAsDirty();
        this.notificationService.showNotification('Secciones actualizadas. Recuerde guardar los cambios generales.', 'success');
        this.updateVisibleCards();
    } else {
        const seccionesFormArray = this.seccion(this.indiceNivelSeleccionado!, this.indiceGradoSeleccionado!);
        seccionesFormArray.clear();
        nuevasSecciones.forEach((s: SeccionVacantes) => {
            seccionesFormArray.push(this.crearFormGroupSeccion(s));
        });
        seccionesFormArray.markAsDirty();
        const gradosFormArray = this.grados(this.indiceNivelSeleccionado!);
        gradosFormArray.markAsDirty();
        this.niveles().markAsDirty();
        this.guardarCambios();
    }
    this.mostrarModalSecciones = false;
    this.cdRef.detectChanges();
}

  activarInputArchivo(): void {
    this.inputLogo?.nativeElement.click();
  }

  alCambiarLogo(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const validFormats = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 2.1 * 1024 * 1024;

    if (!validFormats.includes(file.type)) {
      this.notificationService.showNotification('El archivo no es válido. Debe ser PNG, JPG o JPEG.', 'error');
      input.value = '';
      return;
    }

    if (file.size > maxSize) {
      this.notificationService.showNotification('El archivo excede el tamaño máximo de 2MB.', 'error');
      input.value = '';
      return;
    }

    this.archivoLogoSeleccionado = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.vistaPreviaLogo = e.target?.result as string;
      this.formularioEntidad.patchValue({ logoColegio: this.vistaPreviaLogo });
      this.formularioEntidad.get('logoColegio')?.markAsDirty();
      this.cdRef.detectChanges();
    };
    reader.readAsDataURL(this.archivoLogoSeleccionado);
  }
}

  private subirLogoSiEsNecesario(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (this.archivoLogoSeleccionado && this.entidad?.identidad) {
      // Usamos una variable local con aserción de tipo para evitar el error de TypeScript
      const entidadId: string = this.entidad!.identidad!;

      this.entidadService.subirLogo(entidadId, this.archivoLogoSeleccionado)
        .subscribe({
          next: entidadActualizada => {
            this.entidad = entidadActualizada;
            this.formularioEntidad.patchValue({ logoColegio: entidadActualizada.logoColegio });
            this.vistaPreviaLogo = entidadActualizada.logoColegio || '';
            this.archivoLogoSeleccionado = null;
            resolve();
          },
          error: err => {
            this.notificationService.showNotification(`Error al subir el logo: ${err.message}`, 'error');
            reject(err);
          }
        });
    } else {
      resolve();
    }
  });
}


  getMaxScrollNecesarios(): number {
    if (this.necesariosContent && this.necesariosViewport) {
      return this.necesariosContent.nativeElement.scrollHeight - this.necesariosViewport.nativeElement.clientHeight;
    }
    return 0;
  }

  getMaxScrollAdicionales(): number {
    if (this.adicionalesContent && this.adicionalesViewport) {
      return this.adicionalesContent.nativeElement.scrollHeight - this.adicionalesViewport.nativeElement.clientHeight;
    }
    return 0;
  }

  moverArribaNecesarios(): void {
    this.positionNecesarios -= this.itemHeight;
    this.positionNecesarios = Math.max(0, this.positionNecesarios);
    this.cdRef.detectChanges();
  }

  moverAbajoNecesarios(): void {
    this.positionNecesarios += this.itemHeight;
    this.positionNecesarios = Math.min(this.positionNecesarios, this.getMaxScrollNecesarios());
    this.cdRef.detectChanges();
  }

  mostrarFlechaArribaNecesarios(): boolean {
    return this.positionNecesarios > 0;
  }

  mostrarFlechaAbajoNecesarios(): boolean {
    return this.getMaxScrollNecesarios() > 0 && this.positionNecesarios < this.getMaxScrollNecesarios();
  }

  getTranslateYNecesarios(): number {
    return -this.positionNecesarios;
  }

  moverArribaAdicionales(): void {
    this.positionAdicionales -= this.itemHeight;
    this.positionAdicionales = Math.max(0, this.positionAdicionales);
    this.cdRef.detectChanges();
  }

  moverAbajoAdicionales(): void {
    this.positionAdicionales += this.itemHeight;
    this.positionAdicionales = Math.min(this.positionAdicionales, this.getMaxScrollAdicionales());
    this.cdRef.detectChanges();
  }

  mostrarFlechaArribaAdicionales(): boolean {
    return this.positionAdicionales > 0;
  }

  mostrarFlechaAbajoAdicionales(): boolean {
    return this.getMaxScrollAdicionales() > 0 && this.positionAdicionales < this.getMaxScrollAdicionales();
  }

  getTranslateYAdicionales(): number {
    return -this.positionAdicionales;
  }

  convertirAMayusculas(event: Event, controlPath: string): void {
    const input = event.target as HTMLInputElement;
    const upperValue = input.value.toUpperCase();
    input.value = upperValue;
    this.formularioEntidad.get(controlPath)?.patchValue(upperValue);
  }

  onFocusVacantes(control: AbstractControl): void {
    if (control.value === 0 || control.value === '0') {
      control.patchValue('');
    }
  }
}
