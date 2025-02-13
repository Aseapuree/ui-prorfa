import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { FaIconComponent  } from '@fortawesome/angular-fontawesome';
import { Router } from '@angular/router';

@Component({
  selector: 'app-session-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, FaIconComponent,RouterModule],
  templateUrl: './session-menu.component.html',
  styleUrl: './session-menu.component.scss'
})
export class SessionMenuComponent {
  @Input() image: string = 'assets/default-image.jpg';
  @Input() session: string = 'Nombre de la sesión';
  @Input() route: string = '/';

  constructor(private router: Router) {}
  
    navigate() {
      this.router.navigate([this.route]);
    }

}
