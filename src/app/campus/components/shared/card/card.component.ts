import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-card',
  standalone: true,
  imports: [],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input() image: string = 'assets/default-image.jpg';
  @Input() session: string = 'Nombre de la sesión';
  @Input() title: string = 'Título de la clase';
  @Input() teacher: string = 'Nombre del profesor';
  @Input() route: string = '/'; // Nueva propiedad para la ruta
  @Input() idProfesorCurso?: string;

  constructor(
    private router: Router
  ) {}

  //Metodo para navegar a la ruta
  navigate() {
    this.router.navigate([this.route]);
  }

  
}
