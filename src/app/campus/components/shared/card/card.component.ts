import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ModalEliminarComponent } from '../modal-eliminar/modal-eliminar.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input() image: string = 'assets/default-image.jpg';
  @Input() session: string = 'Nombre de la sesión';
  @Input() title: string = 'Título de la clase';
  @Input() teacher: string = 'Nombre del profesor';
  @Input() route: string = '/'; // Nueva propiedad para la ruta
  @Input() idProfesorCurso?: string;

  constructor(
    private router: Router,
    private _matDialog: MatDialog 
  ) {}

  //Metodo para navegar a la ruta
  navigate() {
    this.router.navigate([this.route]);
  }

  //Metodo para abril modal de eliminar
  deleteItem():void {
    this._matDialog.open(ModalEliminarComponent, {
          
    })
    }
}
