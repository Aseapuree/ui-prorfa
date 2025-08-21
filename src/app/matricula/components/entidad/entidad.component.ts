import { Entidad } from '../../interfaces/DTOEntidad';
import { mergeApplicationConfig, ApplicationConfig, Component } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';

@Component({
  selector: 'app-entidad',
  standalone: true,
  imports: [],
  templateUrl: './entidad.component.html',
  styleUrls: ['./entidad.component.scss']
})

export class EntidadComponent {
}
