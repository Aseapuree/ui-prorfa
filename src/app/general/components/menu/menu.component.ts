import { Component, OnInit, ChangeDetectorRef, Input, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DTOmenuService } from '../../Services/dtomenu.service';
import { DTOMenu } from '../../Interface/DTOMenu';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { fontAwesomeIcons } from '../../../campus/components/shared/font-awesome-icons';
import { faUserCircle, faSignOutAlt, faHome } from '@fortawesome/free-solid-svg-icons';
import { HttpClient } from '@angular/common/http';

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
  @Input() perfilUrl: string | null = null;
  faUserCircle = faUserCircle;
  faSignOutAlt = faSignOutAlt;
  faHome = faHome;

  menus: DTOMenu[] = [];
  menuJerarquico: any[] = []; // Estructura con submenús
  subMenuOpen: { [key: string]: boolean } = {}; 
  menuCerrado = false;

  constructor(
    private menuService: DTOmenuService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.cargarDatosDesdeLocalStorage();

    if (isPlatformBrowser(this.platformId)) {
      console.log("✅ Plataforma es navegador (browser)");
      const urlImagen = localStorage.getItem("perfilUrl");
      console.log("📸 URL obtenida de localStorage:", urlImagen);
      if (urlImagen && urlImagen.trim() !== '') {
        this.cargarImagenDesdeBackend(urlImagen);
      } else {
        console.warn("❌ No se encontró una URL válida en localStorage.");
      }
    } else {
      console.warn("⚠ Plataforma no es navegador, localStorage no está disponible.");
    }
  }

  cargarDatosDesdeLocalStorage() {
    if (isPlatformBrowser(this.platformId)) {
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

      this.menuJerarquico = this.menus
        .filter(menu => menu.idmenuparent === null)
        .map(menu => ({
          ...menu,
          icono: this.getIcon(menu.menu_icono ?? ''),
          submenus: this.menus.filter(sub => sub.idmenuparent === menu.idMenu)
        }));

      console.log("📌 Menús estructurados:", this.menuJerarquico);

      this.cdr.detectChanges();
    }, error => {
      console.error("❌ Error al obtener menús en MenuComponent:", error);
    });
  }

  extraerIdDesdeUrl(url: string): string | null {
    const regexFileD = /\/d\/([a-zA-Z0-9_-]+)/;
    const regexUc = /id=([a-zA-Z0-9_-]+)/;

    let match = url.match(regexFileD);
    if (match) {
      return match[1];
    }

    match = url.match(regexUc);
    if (match) {
      return match[1];
    }

    // Verificar si ya es un ID
    const regexId = /^[a-zA-Z0-9_-]+$/;
    if (regexId.test(url)) {
      return url;
    }

    console.warn("⚠ No se pudo extraer ID de la URL:", url);
    return null;
  }

  cargarImagenDesdeBackend(urlDrive: string) {
    if (!urlDrive || urlDrive.trim() === '') return;

    const fileId = this.extraerIdDesdeUrl(urlDrive);
    if (!fileId) {
      console.error("❌ No se pudo extraer el ID de la URL:", urlDrive);
      this.perfilUrl = null;
      return;
    }

    const apiUrl = `http://localhost:8080/api/perfil/imagen/${fileId}`;
    console.log("🚀 Solicitando imagen desde backend:", apiUrl);

    this.http.get(apiUrl, {
      responseType: 'blob',
      withCredentials: true
    }).subscribe(blob => {
      const imageUrl = URL.createObjectURL(blob);
      this.perfilUrl = imageUrl;
      this.cdr.detectChanges();
      console.log("✅ Imagen cargada y asignada a perfilUrl:", this.perfilUrl);
    }, error => {
      console.error("❌ Error al cargar imagen desde backend:", error);
      this.perfilUrl = null;
    });
  }

  get imagenValida(): boolean {
    return !!this.perfilUrl && this.perfilUrl !== 'null' && this.perfilUrl !== 'undefined' && this.perfilUrl.trim() !== '';
  }

  obtenerIniciales(): string {
    if (!this.nombreUsuario) return '?';

    const nombres = this.nombreUsuario.trim().split(' ');
    const apellido = this.apellidoPaterno?.trim().split(' ')[0] || '';

    if (nombres.length === 1) {
      const inicialNombre = nombres[0][0] || '';
      const inicialApellido = apellido[0] || '';
      return (inicialNombre + inicialApellido).toUpperCase();
    }

    return (nombres[0][0] + nombres[1][0]).toUpperCase();
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
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    } else {
      console.warn("⚠ No se pudo limpiar localStorage porque no está disponible.");
    }

    window.location.href = 'http://localhost:4203';
  }

  getIconColorClass(iconName: string): string {
    const colorClassMap: { [key: string]: string } = {};
    return colorClassMap[iconName] || '';
  }

  principal() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    } else {
      console.warn("⚠ No se pudo limpiar localStorage porque no está disponible.");
    }

    window.location.href = 'http://localhost:4200/inicio';
  }
}