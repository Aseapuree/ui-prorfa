import { TooltipComponent } from './../../../general/components/tooltip/tooltip.component';
import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EntidadService } from '../../services/entidad.service';
import { Entidad, DatosNGS, DocumentoEntidad, Nivel, Grado, SeccionVacantes } from '../../interfaces/DTOEntidad';
import { HttpClientModule } from '@angular/common/http';
import { finalize } from 'rxjs';
import { GeneralLoadingSpinnerComponent } from '../../../general/components/spinner/spinner.component';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule, AbstractControl } from '@angular/forms';
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
  @ViewChildren('carousel') carouselElements!: QueryList<ElementRef>;
  carouselPositions: number[] = []; // Posición actual de cada carrusel por nivel
  cardWidth = 150 + 16; // Ancho de la tarjeta (150px) + gap (1rem = 16px)

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
  }

  // Inicializa las posiciones del carrusel
  private inicializarCarruseles(): void {
    if (this.entidad?.datosngs?.niveles) {
      this.carouselPositions = new Array(this.entidad.datosngs.niveles.length).fill(0);
      this.cdRef.detectChanges(); // Asegura que la UI se actualice
    } else {
      this.carouselPositions = [];
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
    if (!this.entidad || !this.entidad.datosngs || !this.entidad.datosngs.niveles || !this.entidad.datosngs.niveles[nivelIndex]) {
      return false;
    }
    const numGrados = this.entidad.datosngs.niveles[nivelIndex].grados?.length || 0;
    return numGrados > 3 && this.carouselPositions[nivelIndex] < Math.max(0, numGrados - 3);
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
    if (!this.entidad || !this.entidad.datosngs || !this.entidad.datosngs.niveles || !this.entidad.datosngs.niveles[nivelIndex]) {
      return;
    }
    const numGrados = this.entidad.datosngs.niveles[nivelIndex].grados?.length || 0;
    const maxPosition = Math.max(0, numGrados - 3); // Mostrar 3 tarjetas a la vez
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
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.archivoLogoSeleccionado = null;
    this.vistaPreviaLogo = '';
    if (this.entidad) {
      this.crearFormularioDeEntidad(this.entidad);
    }
  }

  guardarCambios(): void {
    if (!this.esValidoModificado(this.formularioEntidad)) {
      this.marcarModificadosComoTocados(this.formularioEntidad);
      this.notificationService.showNotification('Por favor, complete todos los campos requeridos que ha editado.', 'error');
      return;
    }
    if (!this.entidad || !this.entidad.identidad) {
      this.notificationService.showNotification('Error: No se puede identificar la entidad a actualizar.', 'error');
      return;
    }

    const cambios = this.obtenerValoresModificados(this.formularioEntidad);
    if (Object.keys(cambios).length === 0) {
      this.notificationService.showNotification('No hay cambios para guardar.', 'info');
      return;
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

    this.guardando = true;
    this.mensajeSpinner = 'Guardando cambios...';
    this.entidadService.editarEntidad(this.entidad.identidad, cambios).pipe(
      finalize(() => {
        this.guardando = false;
        this.mensajeSpinner = 'Cargando datos...';
      })
    ).subscribe({
      next: entidadActualizada => {
        this.entidad = entidadActualizada;
        this.editando = false;
        this.crearFormularioDeEntidad(entidadActualizada);
        this.inicializarCarruseles(); // Reinicializa los carruseles después de guardar
        this.notificationService.showNotification('Entidad actualizada correctamente.', 'success');
      },
      error: err => {
        this.notificationService.showNotification(`Error al guardar los cambios: ${err.message}`, 'error');
      }
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
            const subCambios = this.obtenerValoresModificados(child);
            if (Object.keys(subCambios).length > 0) {
              cambios[key] = subCambios;
            }
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
      telefonoColegio: [entidad.telefonoColegio ?? '', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
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
    return this.fb.group({
      necesarios: this.fb.group({
        documento1: [documentos?.necesarios?.documento1 ?? '', Validators.required],
        documento2: [documentos?.necesarios?.documento2 ?? '', Validators.required],
      }),
      adicionales: this.fb.group({
        intercambio: this.fb.group({
          documento1: [documentos?.adicionales?.intercambio?.documento1 ?? ''],
          documento2: [documentos?.adicionales?.intercambio?.documento2 ?? ''],
        }),
        discapacidad: this.fb.group({
          documento1: [documentos?.adicionales?.discapacidad?.documento1 ?? ''],
        })
      })
    });
  }

  crearFormGroupDatosNgs(datos?: DatosNGS): FormGroup {
    const nivelesArray = datos?.niveles?.map(nivel => this.crearFormGroupNivel(nivel)) || [];
    return this.fb.group({
      niveles: this.fb.array(nivelesArray, Validators.minLength(1))
    });
  }

  crearFormGroupNivel(nivel: Nivel): FormGroup {
    const gradosArray = nivel.grados?.map(grado => this.crearFormGroupGrado(grado)) || [];
    return this.fb.group({
      nombre: [nivel.nombre ?? '', Validators.required],
      grados: this.fb.array(gradosArray, Validators.minLength(1))
    });
  }

  crearFormGroupGrado(grado: Grado): FormGroup {
    const seccionesArray = grado.secciones?.map(seccion => this.crearFormGroupSeccion(seccion)) || [];
    return this.fb.group({
      nombre: [grado.nombre ?? '', Validators.required],
      secciones: this.fb.array(seccionesArray, Validators.minLength(1))
    });
  }

  crearFormGroupSeccion(seccion: SeccionVacantes): FormGroup {
    return this.fb.group({
      nombre: [seccion.nombre ?? '', Validators.required],
      vacantes: [seccion.vacantes ?? 0, [Validators.required, Validators.min(0)]]
    });
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
      nombre: ['', Validators.required],
      grados: this.fb.array([], Validators.minLength(1))
    });
    this.niveles().push(nuevoNivel);
    this.niveles().markAsDirty();
    this.carouselPositions.push(0); // Añade posición inicial para el nuevo nivel
    this.cdRef.detectChanges();
  }

  agregarGrado(nivelIndex: number): void {
    const nuevoGrado = this.fb.group({
      nombre: ['', Validators.required],
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
  }

  eliminarNivel(nivelIndex: number): void {
    this.niveles().removeAt(nivelIndex);
    this.niveles().markAsDirty();
    this.carouselPositions.splice(nivelIndex, 1); // Actualiza las posiciones del carrusel
    this.cdRef.detectChanges();
  }

  eliminarGrado(nivelIndex: number, gradoIndex: number): void {
    this.grados(nivelIndex).removeAt(gradoIndex);
    this.grados(nivelIndex).markAsDirty();
    // Reinicia la posición del carrusel si es necesario
    if (this.carouselPositions[nivelIndex] > 0) {
      const numGrados = this.grados(nivelIndex).length;
      const maxPosition = Math.max(0, numGrados - 3);
      this.carouselPositions[nivelIndex] = Math.min(this.carouselPositions[nivelIndex], maxPosition);
      this.cdRef.detectChanges();
    }
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

    const newSecciones = this.formularioSecciones.value.secciones.map((s: any) => ({ ...s, vacantes: Number(s.vacantes) }));

    if (this.editando) {
      const seccionesCtrl = this.seccion(this.indiceNivelSeleccionado!, this.indiceGradoSeleccionado!);
      seccionesCtrl.clear();
      newSecciones.forEach((s: SeccionVacantes) => seccionesCtrl.push(this.crearFormGroupSeccion(s)));
      seccionesCtrl.markAsDirty();
      this.notificationService.showNotification('Secciones actualizadas. Recuerde guardar los cambios generales.', 'success');
    } else {
      const nivelesLength = this.entidad?.datosngs?.niveles?.length || 0;
      const gradosLength = this.entidad?.datosngs?.niveles?.[this.indiceNivelSeleccionado!]?.grados?.length || 0;
      const nivelesPatch = Array(nivelesLength).fill(undefined);
      const gradosPatch = Array(gradosLength).fill(undefined);
      gradosPatch[this.indiceGradoSeleccionado!] = { secciones: newSecciones };
      nivelesPatch[this.indiceNivelSeleccionado!] = { grados: gradosPatch };
      const cambios = { datosngs: { niveles: nivelesPatch } };

      this.cargando = true;
      this.mensajeSpinner = 'Guardando secciones...';
      this.entidadService.editarEntidad(this.entidad.identidad, cambios).pipe(
        finalize(() => {
          this.cargando = false;
          this.mensajeSpinner = 'Cargando datos...';
        })
      ).subscribe({
        next: entidadActualizada => {
          this.entidad = entidadActualizada;
          this.inicializarCarruseles(); // Reinicializa los carruseles después de actualizar
          this.notificationService.showNotification('Secciones actualizadas correctamente.', 'success');
        },
        error: err => {
          this.notificationService.showNotification(`Error al guardar las secciones: ${err.message}`, 'error');
        }
      });
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
}
