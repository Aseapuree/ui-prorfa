import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // 👈 IMPORTANTE
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule], // 👈 AGREGA CommonModule AQUÍ
  templateUrl: './asistencia.component.html',
  styleUrl: './asistencia.component.scss'
})
export class AsistenciaComponent {
  bloqueado = true;

  toggleBloqueo() {
    this.bloqueado = !this.bloqueado;
  }
}
