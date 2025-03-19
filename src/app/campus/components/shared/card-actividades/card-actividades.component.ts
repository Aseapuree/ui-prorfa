import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {  RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

type TipoActividad = 'introducciones' | 'materiales' | 'actividades';

@Component({
  selector: 'app-card-actividades',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule,RouterModule],
  templateUrl: './card-actividades.component.html',
  styleUrl: './card-actividades.component.scss'
})
export class CardActividadesComponent {

  @Input() route: string = '/';
  @Input() introduccion: string = 'Introducción';
  @Input() material: string = 'Material';
  @Input() actividad: string = 'Actividad';
  @Input() actividadSeleccionada: TipoActividad | null = null;
  @Input() showBackButton: boolean = true; // Nueva entrada para controlar si se muestra el botón de retroceder 

  @Output() seleccionarActividad = new EventEmitter<TipoActividad>();
  @Output() retroceder = new EventEmitter<void>(); // Nuevo evento para notificar retroceso

  seleccionar(tipo: TipoActividad): void {
    this.seleccionarActividad.emit(tipo);
  }

  onRetroceder(): void {
    this.retroceder.emit(); // Emitir evento de retroceso
  }
}
