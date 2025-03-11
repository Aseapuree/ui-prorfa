import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal1.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent {

  constructor(public _matDialogRef: MatDialogRef <ModalComponent>){}

  cerrarModal(): void {
    this._matDialogRef.close(); // con esto cerramos el modal
  }

}
