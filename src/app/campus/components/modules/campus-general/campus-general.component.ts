import { Component } from '@angular/core';
import { CardComponent } from '../../shared/card/card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-campus-general',
  standalone: true,
  imports: [RouterModule, CardComponent],
  templateUrl: './campus-general.component.html',
  styleUrl: './campus-general.component.scss'
})
export class CampusGeneralComponent {

}
