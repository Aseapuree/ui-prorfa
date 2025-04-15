import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencia.component.html',
  styleUrl: './asistencia.component.scss'
})
export class AsistenciaComponent implements OnInit {
  @Input() idSesion: string = '';
  @Input() idProfesorCurso: string | null = null;
  @Input() idAlumnoCurso: string | null = null;
  @Input() rolUsuario: string | null = null;

  bloqueado = true;
  fechaActual: Date = new Date(); // Propiedad para la fecha actual

  constructor() {}

  ngOnInit(): void {
    console.log('Asistencia - idSesion:', this.idSesion);
    console.log('Asistencia - idProfesorCurso:', this.idProfesorCurso);
    console.log('Asistencia - idAlumnoCurso:', this.idAlumnoCurso);
    console.log('Asistencia - rolUsuario:', this.rolUsuario);
  }

  toggleBloqueo(): void {
    this.bloqueado = !this.bloqueado;
  }
}