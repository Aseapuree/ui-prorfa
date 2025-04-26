import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Sesion } from '../../../../interface/sesion';
import { ComponentType } from '@angular/cdk/portal';
import { DialogoConfirmacionComponent } from '../dialogo-confirmacion/dialogo-confirmacion.component';

@Injectable({
  providedIn: 'root'
})
export class ModalSesionService {

  constructor(private dialog: MatDialog) {}

  openModal<CT, T = Sesion>(componentRef: ComponentType<CT>, data?: T, isEditing = false): void {
    console.log('Modal sesión abierto...');
    this.dialog.open(componentRef, {
      data: { sesion: data, isEditing, idProfesorCurso: (data as any)?.idProfesorCurso },
      width: '1px', // Aumentar el ancho para mejor visualización
      disableClose: true // Evitar cerrar el diálogo al hacer clic fuera
    });
  }

  closeModal(): void {
    this.dialog.closeAll();
  }
}
