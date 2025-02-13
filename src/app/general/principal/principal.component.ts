import { Component } from '@angular/core';
import { MenuComponent } from '../menu/menu.component';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [MenuComponent,CommonModule,RouterOutlet],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss'
})
export class PrincipalComponent {

}
