import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input() image: string = 'assets/default-image.jpg';
  @Input() session: string = 'Nombre de la sesión';
  @Input() title: string = 'Título de la clase';
  @Input() teacher: string = 'Nombre del profesor';
  @Input() route: string = '/'; // Nueva propiedad para la ruta

  constructor(private router: Router) {}

  navigate() {
    this.router.navigate([this.route]);
  }
}
