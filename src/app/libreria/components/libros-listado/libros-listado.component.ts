import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-libros-listado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './libros-listado.component.html',
  styleUrl: './libros-listado.component.scss'
})
export class LibrosComponent {


  books = [
    {
      title: 'El Señor de los Anillos',
      author: 'J.R.R. Tolkien',
      description: 'Una épica aventura en la Tierra Media.'
    },
    {
      title: 'Cien Años de Soledad',
      author: 'Gabriel García Márquez',
      description: 'La historia de la familia Buendía en Macondo.'
    },
    {
      title: '1984',
      author: 'George Orwell',
      description: 'Una distopía sobre el control totalitario.'
    }
  ];
}
