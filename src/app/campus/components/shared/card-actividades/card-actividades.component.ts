import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {  RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

type TipoActividad = 'introducciones' | 'materiales' | 'actividades' | 'asistencias'; // Agregar 'asistencias'

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
  @Input() asistencia: string | undefined = 'Asistencia'; // Cambiar a opcional para permitir ocultar la pestaña
  @Input() actividadSeleccionada: TipoActividad | null = null;
  @Input() showBackButton: boolean = true; // Mantener tu propiedad para controlar el botón de retroceder
  @Output() seleccionarActividad = new EventEmitter<TipoActividad>();
  @Output() retroceder = new EventEmitter<void>();

  seleccionar(tipo: TipoActividad): void {
    this.seleccionarActividad.emit(tipo);
  }

  onRetroceder(): void {
    console.log('Evento retroceder disparado desde CardActividadesComponent');
    this.retroceder.emit();
  }
}

