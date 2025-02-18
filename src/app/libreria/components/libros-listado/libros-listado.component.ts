import { Component, signal, computed } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LibrosDetalleComponent } from '../libros-detalle/libros-detalle.component';

interface Book {
  title: string;
  author: string;
  description: string;
  imageUrl: string;
}

export const books = [
  {
    title: 'El Señor de los Anillos',
    author: 'J.R.R. Tolkien',
    category: 'Infantil',
    description: 'Una épica aventura en la Tierra Media.',
    imageUrl: 'https://edit.org/images/cat/portadas-libros-big-2019101610.jpg' // Reemplaza con la URL real de la imagen
  },
  {
    title: 'Cien Años de Soledad',
    author: 'Gabriel García Márquez',
    category: 'Infantil',
    description: 'La historia de la familia Buendía en Macondo.',
    imageUrl: 'https://edit.org/images/cat/portadas-libros-big-2019101610.jpg' // Reemplaza con la URL real de la imagen
  }
  ,
  {
    title: '190334',
    author: 'George Orwell',
    category: 'Infantil',
    description: 'Una distopía sobre el control totalitario.',
    imageUrl: 'https://edit.org/images/cat/portadas-libros-big-2019101610.jpg' // Reemplaza con la URL real de la imagen
  }
  ,
  {
    title: '1984',
    author: 'George Orwell',
    category: 'Infantil',
    description: 'Una distopía sobre el control totalitario.',
    imageUrl: 'https://edit.org/images/cat/portadas-libros-big-2019101610.jpg' // Reemplaza con la URL real de la imagen
  }
  ,
  {
    title: '19214',
    author: 'George Orwell',
    category: 'Infantil',
    description: 'Una distopía sobre el control totalitario.',
    imageUrl: 'https://edit.org/images/cat/portadas-libros-big-2019101610.jpg' // Reemplaza con la URL real de la imagen
  }
  ,
  {
    title: '11184',
    author: 'George Orwell',
    category: 'Infantil',
    description: 'Una distopía sobre el control totalitario.',
    imageUrl: 'https://edit.org/images/cat/portadas-libros-big-2019101610.jpg' // Reemplaza con la URL real de la imagen
  }
  ,
  {
    title: '1914',
    author: 'George Orwell',
    category: 'Infantil',
    description: 'Una distopía sobre el control totalitario.',
    imageUrl: 'https://edit.org/images/cat/portadas-libros-big-2019101610.jpg' // Reemplaza con la URL real de la imagen
  }
  ,
  {
    title: '1924',
    author: 'George Orwell',
    category: 'Infantil',
    description: 'Una distopía sobre el control totalitario.',
    imageUrl: 'https://edit.org/images/cat/portadas-libros-big-2019101610.jpg' // Reemplaza con la URL real de la imagen
  }
  ,
  {
    title: '1920',
    author: 'George Orwell',
    category: 'Infantil',
    description: 'Una distopía sobre el control totalitario.',
    imageUrl: 'https://edit.org/images/cat/portadas-libros-big-2019101610.jpg' // Reemplaza con la URL real de la imagen
  }
  
];
@Component({
  selector: 'app-libros-listado',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule, FormsModule,LibrosDetalleComponent],
  templateUrl: './libros-listado.component.html',
  styleUrl: './libros-listado.component.scss'
})
export class LibrosListadoComponent {
  searchTerm = ''; // Campo de búsqueda
  selectedCategory = ''; // Categoría seleccionada
  categories = ['Todos', 'Ficción', 'Historia', 'Ciencia', 'Matemáticas', 'Infantil']; // Categorías disponibles
  sortBy!: string ; // Campo de ordenamiento
  sortOrder: 'asc' | 'desc' = 'asc'; // Orden actual
  currentPage = 1;
  itemsPerPage = 6;
  selectedBook: any = null;

  libros =books;




  get filteredBooks() {
    let books = this.libros;

    // Filtrar por categoría
    if (this.selectedCategory && this.selectedCategory !== 'Todos') {
      books = books.filter(libro => libro.category === this.selectedCategory);
    }

    // Filtrar por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      books = books.filter(libro =>
        libro.title.toLowerCase().includes(term) || libro.author.toLowerCase().includes(term)
      );
    }

    // Ordenar libros
    if (this.sortBy) {
      books = books.sort((a, b) => {
        const key = this.sortBy as keyof typeof a; // 👈 Casting explícito
        const valueA = a[key].toString().toLowerCase();
        const valueB = b[key].toString().toLowerCase();
        return this.sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      });
    }

    return books.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage);
  }

  onCategoryChange(category: string) {
    this.selectedCategory = category;
    this.currentPage = 1;
  }

  toggleSort(field: string) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
  }

  openModal(libro: any) {
    this.selectedBook = libro;
  }

  closeModal() {
    this.selectedBook = null;
  }

  changePage(page: number) {
    this.currentPage = page;
  }

  getTotalPages(): number {
    return Math.ceil(this.libros.length / this.itemsPerPage);
  }
  
  getPages(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  
}