import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-eliminar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-eliminar.component.html',
  styleUrl: './modal-eliminar.component.scss'
})
export class ModalEliminarComponent {


  constructor(
    public _matDialogRef: MatDialogRef <ModalEliminarComponent>){}

  // Metodo para cerrar el modal
  cerrarModal(): void {
    this._matDialogRef.close();
  }

}
