import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss'
})
export class InicioComponent implements OnDestroy {
  currentIndex: number = 0;
  totalSlides: number = 3; // Número de imágenes en el carrusel
  intervalId: any = null; // Asegurar que inicia como null

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.totalSlides;
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.totalSlides) % this.totalSlides;
  }

  goToSlide(index: number) {
    this.currentIndex = index;
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null; // Asegurar que se limpia completamente
    }
  }
 
}
