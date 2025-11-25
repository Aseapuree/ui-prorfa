import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Curso, Competencia } from '../../../../interface/curso';
import { TextInputRestrictionDirective } from '../../../shared/text-input-restriction.directive/text-input-restriction.directive.component';

@Component({
  selector: 'app-curso-form',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule,TextInputRestrictionDirective],
  templateUrl: './curso-form.component.html',
  styleUrl: './curso-form.component.scss',
})
export class CursoFormComponent {
  @Input() curso: Curso = {
    nombre: '',
    abreviatura: '',
    descripcion: '',
    competencias: [],
  };
  @Input() isReadOnly: boolean = false;
  @Output() submit = new EventEmitter<Curso>();
  @Output() cancel = new EventEmitter<void>();

  addCompetencia() {
    this.curso.competencias.push({ nombre: '' });
  }

  removeCompetencia(index: number) {
    this.curso.competencias.splice(index, 1);
  }

  // ← MÉTODO NUEVO
  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    // Validación final: al menos una competencia con nombre
    const hasValidCompetencias =
      this.curso.competencias.length > 0 &&
      this.curso.competencias.every((c) => c.nombre?.trim());

    if (hasValidCompetencias) {
      this.submit.emit(this.curso);
    }
  }

  // Añade este método
  hasValidCompetencias(): boolean {
    return (
      this.curso.competencias.length > 0 &&
      this.curso.competencias.every((c) => c.nombre?.trim().length > 0)
    );
  }
}
