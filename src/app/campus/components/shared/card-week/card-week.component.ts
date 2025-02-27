import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-card-week',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule,RouterModule],
  templateUrl: './card-week.component.html',
  styleUrl: './card-week.component.scss'
})
export class CardWeekComponent {
    @Input() week: string = 'Numero de semana';
    @Input() title: string = 'Nombre de la semana';
    @Input() description: string = 'Descripción de la semana';
    @Input() route: string = '/';
  
    constructor(private router: Router) {}
    
      navigate() {
        this.router.navigate([this.route]);
      }
}
