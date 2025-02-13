import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/card/card.component';

@Component({
  selector: 'app-campus',
  standalone: true,
  imports: [RouterModule, CardComponent],
  templateUrl: './campus.component.html',
  styleUrl: './campus.component.scss'
})
export class CampusComponent {

}
