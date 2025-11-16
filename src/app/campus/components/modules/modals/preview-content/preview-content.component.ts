import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CampusCursosComponent } from '../../gestion/campus-cursos/campus-cursos.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-preview-content',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule],
  templateUrl: './preview-content.component.html',
  styleUrl: './preview-content.component.scss'
})
export class PreviewContentComponent {
  @Input() data: any = {};
  @Output() close = new EventEmitter<void>(); // ← Usa output

  onClose() {
    this.close.emit();
  }
}
