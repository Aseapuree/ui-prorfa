import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-info-week',
  standalone: true,
  imports: [CommonModule, RouterLink, FaIconComponent,RouterModule],
  templateUrl: './info-week.component.html',
  styleUrl: './info-week.component.scss'
})
export class InfoWeekComponent {

}
