import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ModalEliminarComponent } from '../modal-eliminar/modal-eliminar.component';

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
  
    constructor(
      private router: Router,
      private _matDialog: MatDialog
    ) {}
    
      navigate() {
        this.router.navigate([this.route]);
      }

    //Metodo para abril modal de eliminar
      deleteItem():void {
        this._matDialog.open(ModalEliminarComponent, {
              
        })
        }
}
