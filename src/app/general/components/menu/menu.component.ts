import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DTOmenuService } from '../../Services/dtomenu.service';
import { DTOMenu } from '../../Interface/DTOMenu';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { fontAwesomeIcons } from '../../../campus/components/shared/font-awesome-icons';  // ✅ Importando iconos desde font-awesome-icons.ts
import { faUserCircle, faSignOutAlt,faHome} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  @Input() nombreUsuario: string = '';
  @Input() apellidoPaterno: string = '';  
  @Input() apellidoMaterno: string = '';  
  @Input() nombreRol: string = ''; 
  faUserCircle = faUserCircle;
  faSignOutAlt = faSignOutAlt;
  faHome = faHome;

  menus: DTOMenu[] = [];
  menuJerarquico: any[] = []; // Estructura con submenús
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

      // Construir jerarquía de menús y submenús
      this.menuJerarquico = this.menus
        .filter(menu => menu.idmenuparent === null) // Menús principales
        .map(menu => ({
          ...menu,
          icono: this.getIcon(menu.menu_icono ?? ''), // Asignar el icono
          submenus: this.menus.filter(sub => sub.idmenuparent === menu.idMenu) // Submenús correspondientes
        }));

      console.log("📌 Menús estructurados:", this.menuJerarquico);

      this.cdr.detectChanges();
    }, error => {
      console.error("❌ Error al obtener menús en MenuComponent:", error);
    });
    
  }

  

  getIcon(menu_icono: string): IconDefinition | null {
    console.log(`🔍 Buscando icono: "${menu_icono}"`);
  
    const iconoEncontrado = fontAwesomeIcons.find(icon => icon.iconName === menu_icono.toLowerCase());
  
    if (!iconoEncontrado) {
      console.warn(`⚠ No se encontró el icono: "${menu_icono}" en fontAwesomeIcons`);
    }
  
    return iconoEncontrado || null;
  }
  
  

  toggleMenu() {
    this.menuCerrado = !this.menuCerrado;
  }

  toggleSubMenu(menuId: string) {
    this.subMenuOpen[menuId] = !this.subMenuOpen[menuId];
  }

  trackById(index: number, item: DTOMenu): string {
    return item.idMenu ?? index.toString();
  }

  navigate(menu: DTOMenu) {
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
    window.location.href = 'http://localhost:4203';
  }

  getIconColorClass(iconName: string): string {
    const colorClassMap: { [key: string]: string } = {
    };
  
    return colorClassMap[iconName] || '';
  }
  principal() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
    } else {
      console.warn("⚠ No se pudo limpiar localStorage porque no está disponible.");
    }
    
    // Redirigir manualmente a la nueva URL
    window.location.href = 'http://localhost:4200/inicio';
  }
  
}
