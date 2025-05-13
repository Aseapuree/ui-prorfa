import { Component, Inject } from '@angular/core';
import { Competencia } from '../../../../interface/curso';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-modal-competencias',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './modal-competencias.component.html',
  styleUrl: './modal-competencias.component.scss'
})
export class ModalCompetenciasComponent {
constructor(@Inject(MAT_DIALOG_DATA) public data: { competencias: Competencia[]; isReadOnly: boolean }) {}
}
