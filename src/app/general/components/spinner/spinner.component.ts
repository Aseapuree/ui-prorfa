import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-general-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss']
})
export class GeneralLoadingSpinnerComponent {
  // Propiedad de entrada para controlar la visibilidad del spinner+
  @Input() visible = false;

  // Propiedad de entrada para el mensaje que se muestra debajo del spinner
  @Input() message = 'Cargando...';
}
