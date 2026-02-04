import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() abreviatura: string = '';
  @Input() teacher: string = 'Nombre del profesor';
  @Input() grado: string = '';
  @Output() cardClicked = new EventEmitter<void>();
  @Input() idProfesorCurso?: string;

  isResponsive: boolean = false;

  constructor(private router: Router) {
    this.checkResponsive();
    window.addEventListener('resize', () => this.checkResponsive());
  }


  private checkResponsive() {
    this.isResponsive = window.innerWidth <= 940;
  }


  get displayTitle(): string {
    return this.isResponsive && this.abreviatura ? this.abreviatura : this.title;
  }

  onClick() {
    this.cardClicked.emit();
  }
}
