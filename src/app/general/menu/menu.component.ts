import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DTOmenuService } from '../Services/dtomenu.service';
import { DTOmenu } from '../Interface/DTOmenu';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  @Input() nombreUsuario: string = '';
  @Input() apellidoPaterno: string = '';  
  @Input() apellidoMaterno: string = '';  
  @Input() nombreRol: string = ''; 
  menus: DTOmenu[] = [];
  subMenuOpen: { [key: string]: boolean } = {}; 
  menuCerrado = false;

  constructor(private menuService: DTOmenuService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit() {
    this.cargarDatosDesdeLocalStorage();
  }

  cargarDatosDesdeLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      let rol = localStorage.getItem("rol");

      if (rol) {
        this.obtenerMenus(rol);
      } else {
        console.warn("⚠ No se encontró un rol en localStorage.");
      }
    } else {
      console.warn("⚠ localStorage no está disponible en este entorno.");
    }
  }

  obtenerMenus(rol: string) {
    this.menuService.getMenus(rol).subscribe(menuResponse => {
      console.log("🔹 Respuesta del servicio en MenuComponent:", menuResponse);

      this.menus = menuResponse?.data || [];
      console.log("✅ Menús cargados en MenuComponent:", this.menus);

      this.menus.forEach(menu => {
        if (menu.idmenurol) {
          this.subMenuOpen[menu.idmenurol] = false;
        }
      });

      this.cdr.detectChanges();
    }, error => {
      console.error("❌ Error al obtener menús en MenuComponent:", error);
    });
  }

  toggleMenu() {
    this.menuCerrado = !this.menuCerrado;
  }

  toggleSubMenu(menuId: string) {
    this.subMenuOpen[menuId] = !this.subMenuOpen[menuId];
  }

  trackById(index: number, item: DTOmenu): string {
    return item.idMenu ?? index.toString();
  }

  navigate(menu: DTOmenu) {
    if (menu.menu_ruta) {
      this.router.navigate([menu.menu_ruta]);
    }
  }

  irAPerfil() {
    this.router.navigate(['/perfil']);
  }

  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
    } else {
      console.warn("⚠ No se pudo limpiar localStorage porque no está disponible.");
    }
    
    // Redirigir manualmente a la nueva URL
    window.location.href = 'http://127.0.0.1:4203';
  }
  
}
