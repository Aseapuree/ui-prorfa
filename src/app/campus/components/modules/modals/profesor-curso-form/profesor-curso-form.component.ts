import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NotificationService } from '../../../shared/notificaciones/notification.service';

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

  cursoEsTutoria: boolean = false;

  constructor(private notificationService: NotificationService) {}

  onCursoChange() {
    const cursoSeleccionado = this.asignacion.curso;
    this.cursoEsTutoria = cursoSeleccionado?.nombre?.toLowerCase() === 'tutoria';
  }

  onNivelChange() {
    this.asignacion.grado = '';
    this.asignacion.seccion = '';
  }

  onGradoChange() {
    this.asignacion.seccion = '';
  }

  compareUsuario(o1: any, o2: any): boolean {
  return o1?.idusuario === o2?.idusuario;
}

compareCurso(o1: any, o2: any): boolean {
  return o1 && o2 ? o1.idCurso === o2.idCurso : o1 === o2;
}

submitForm() {
    if (!this.asignacion.usuario?.idusuario || !this.asignacion.curso?.idCurso) {
    this.notificationService.showNotification('Seleccione profesor y curso válidos', 'error');
    return;
  }
    if (!this.asignacion.nivel || !this.asignacion.grado || !this.asignacion.seccion) {
      this.notificationService.showNotification('Complete todos los campos', 'error');
      return;
    }
    if (this.cursoEsTutoria && (!this.asignacion.nivel || !this.asignacion.grado || !this.asignacion.seccion)) {
      this.notificationService.showNotification(
        'Para el curso de tutoría debes seleccionar nivel, grado y sección',
        'info'
      );
      return;
    }
    this.submit.emit(this.asignacion);
  }
}
