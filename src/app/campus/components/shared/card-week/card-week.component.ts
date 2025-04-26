import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-card-week',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule,RouterModule, MatButtonModule, MatDialogModule],
  templateUrl: './card-week.component.html',
  styleUrl: './card-week.component.scss'
})
export class CardWeekComponent {
    @Input() week: string = 'Numero de semana';
    @Input() title: string = 'Nombre de la semana';
    @Input() description: string = 'Descripción de la semana';
    @Input() route: string = '/';
    @Input() idSesion?: string; // Nuevo input para el ID de la sesión
    @Input() fechaAsignada?: string;
  
    constructor(
      private router: Router
    ) {}
    
    navigate() {
      if (this.idSesion) {
          this.router.navigate([this.route, this.idSesion]);
      } else {
          this.router.navigate([this.route]);
      }
  }

    
}
