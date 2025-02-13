import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { FaIconComponent  } from '@fortawesome/angular-fontawesome';
import { SessionMenuComponent } from '../../../shared/session-menu/session-menu.component';

@Component({
  selector: 'app-sesion1',
  standalone: true,
  imports: [CommonModule, RouterLink, FaIconComponent,RouterModule, SessionMenuComponent],
  templateUrl: './sesion1.component.html',
  styleUrl: './sesion1.component.scss'
})
export class Sesion1Component {

}
