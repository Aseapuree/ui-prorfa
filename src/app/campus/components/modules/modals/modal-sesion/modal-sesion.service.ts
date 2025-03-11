import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Sesion } from '../../../../interface/sesion';
import { ComponentType } from '@angular/cdk/portal';
import { DialogoConfirmacionComponent } from '../dialogo-confirmacion/dialogo-confirmacion.component';

@Injectable({
  providedIn: 'root'
})
export class ModalSesionService {

  /*openConfirmDialog(message: string): Promise<boolean> {
    return this._dialog
      .open(DialogoConfirmacionComponent, {
        dta: {message},
        width: '700px',
        disableClose: true
      })
      .afterClosed()
      .toPromise();
  }
      */

  private readonly _dialog = inject(MatDialog);

  openModal<CT, T = Sesion>(componentRef: ComponentType<CT>, data?: T, isEditing = false): void{
    console.log('Modal sesion abierto...');
    const config = { data, isEditing };

    this._dialog.open(componentRef, {
      data: config,
      width: '100px'
    });
  }

  closeModal(): void{
    this._dialog.closeAll();
  }
}
