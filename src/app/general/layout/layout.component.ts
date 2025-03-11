import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';
import { CommonModule } from '@angular/common';
import { ValidateService } from '../../services/validateAuth.service';  // Importa el servicio

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, MenuComponent, CommonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {

  constructor(private authService: ValidateService, private router: Router) {}

  ngOnInit() {
    this.verificarSesion();
  }

  verificarSesion() {
    this.authService.verificarSesion().subscribe({
      next: () => console.log("Sesión válida"),
      error: () =>window.location.href = "http://localhost:4203" // Redirigir si no está autenticado
    });
  }
}
