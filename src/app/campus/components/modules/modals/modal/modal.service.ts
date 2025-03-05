import { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Curso } from '../../../../interface/curso';
import { DialogoConfirmacionComponent } from '../dialogo-confirmacion/dialogo-confirmacion.component';

@Injectable({
  providedIn: 'root'
})
export class ModalService {


  openConfirmDialog(message: string): Promise<boolean> {
    return this._dialog
      .open(DialogoConfirmacionComponent, {
        data: { message },
        width: '700px',
        disableClose: true
      })
      .afterClosed()
      .toPromise();
  }

  private readonly _dialog = inject(MatDialog);

  openModal<CT, T = Curso>(componentRef: ComponentType<CT>, data?: T, isEditing = false): void {
    console.log('Modal abierto...'); // Depuración
    const config = { data, isEditing };
  
    this._dialog.open(componentRef, {
      data: config,
      width: '600px'
    });
  }

  

  closeModal(): void{
    this._dialog.closeAll();
  }

  
}
