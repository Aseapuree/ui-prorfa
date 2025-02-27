import { Component } from '@angular/core';
import { InfoWeekComponent } from '../../../shared/info-week/info-week.component';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-campus-info-week',
  standalone: true,
  imports: [CommonModule, RouterLink,RouterModule, InfoWeekComponent, FontAwesomeModule],
  templateUrl: './campus-info-week.component.html',
  styleUrl: './campus-info-week.component.scss'
})
export class CampusInfoWeekComponent {

}
