import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-profesor-curso-form',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './profesor-curso-form.component.html',
  styleUrl: './profesor-curso-form.component.scss',
})
export class ProfesorCursoFormComponent {
  @Input() asignacion: any = {
    usuario: null,
    curso: null,
    nivel: '',
    grado: '',
    seccion: '',
  };
  @Input() isReadOnly = false;
  @Input() usuarios: any[] = [];
  @Input() cursos: any[] = [];
  @Input() niveles: string[] = [];
  @Input() grados: string[] = [];
  @Input() secciones: any[] = [];

  @Output() submit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  onNivelChange() {
    this.asignacion.grado = '';
    this.asignacion.seccion = '';
    // Lógica para cargar grados (puedes emitir evento si necesitas cargar dinámicamente)
  }

  onGradoChange() {
    this.asignacion.seccion = '';
  }

  compareUsuario(o1: any, o2: any): boolean {
  return o1 && o2 ? o1.idusuario === o2.idusuario : o1 === o2;
}

compareCurso(o1: any, o2: any): boolean {
  return o1 && o2 ? o1.idCurso === o2.idCurso : o1 === o2;
}
}
