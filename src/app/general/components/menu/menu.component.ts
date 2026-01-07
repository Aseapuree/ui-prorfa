import { Component, OnInit, ChangeDetectorRef, Input, Inject, PLATFORM_ID, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router, NavigationEnd, RouterEvent } from '@angular/router';
import { DTOmenuService } from '../../Services/dtomenu.service';
import { DTOMenu } from '../../interfaces/DTOMenu'; 
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { fontAwesomeIcons } from '../../../campus/components/shared/font-awesome-icons'; // Asegúrate que la ruta sea correcta
import { faUserCircle, faSignOutAlt, faHome } from '@fortawesome/free-solid-svg-icons';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit, OnChanges {
  @Input() nombreUsuario: string = '';
  @Input() apellidoPaterno: string = '';
  @Input() apellidoMaterno: string = '';
  @Input() nombreRol: string = '';
  @Input() idRol: string = '';
  @Input() perfilUrl: string | null = null;
  @Output() menuToggle = new EventEmitter<void>();

  faUserCircle = faUserCircle;
  faSignOutAlt = faSignOutAlt;
  faHome = faHome;

  menus: DTOMenu[] = [];
  menuJerarquico: any[] = [];
  subMenuOpen: { [key: string]: boolean } = {};
  menuCerrado = false;
  activeTooltipId: string | null = null;

  activeMenuId: string | null = null;
  activeSubMenuId: string | null = null;

  constructor(
    private menuService: DTOmenuService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.cargarImagenDesdeLocalStorage();

    if (isPlatformBrowser(this.platformId)) {
      this.router.events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        //console.log('Evento de enrutador NavigationEnd:', event.urlAfterRedirects);
        this.updateActiveMenu(event.urlAfterRedirects);
      });
      this.updateActiveMenu(this.router.url);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idRol'] && this.idRol && this.idRol !== 'undefined') {
      //console.log('ngOnChanges: Cambió idRol, obteniendo menús para rol:', this.idRol);
      this.obtenerMenus(this.idRol);
    } else if (changes['menuJerarquico'] && isPlatformBrowser(this.platformId)) {
      //console.log('ngOnChanges: Cambió menuJerarquico, actualizando menú activo.');
      this.updateActiveMenu(this.router.url);
    }
  }

  cargarImagenDesdeLocalStorage() {
    if (isPlatformBrowser(this.platformId)) {
      const urlImagen = localStorage.getItem("perfilUrl");
      if (urlImagen && urlImagen.trim() !== '') {
        this.cargarImagenDesdeBackend(urlImagen);
      }
    }
  }

  obtenerMenus(rol: string) {
    this.menuService.getMenus(rol).subscribe(menuResponse => {
      this.menus = menuResponse?.data || [];
      this.menuJerarquico = this.menus
        .filter(menu => menu.idmenuparent === null)
        .map(menu => ({
          ...menu,
          icono: this.getIcon(menu.menu_icono ?? ''),
          submenus: this.menus.filter(sub => sub.idmenuparent === menu.idMenu)
                           .map(sub => ({...sub, icono: this.getIcon(sub.menu_icono ?? '')}))
        }));

      //console.log('Menús cargados, menuJerarquico:', JSON.parse(JSON.stringify(this.menuJerarquico.map(m => ({id: m.idMenu, ruta: m.menu_ruta, sub: m.submenus?.length})))));

      if (isPlatformBrowser(this.platformId)) {
        this.updateActiveMenu(this.router.url);
      }
      this.cdr.detectChanges();
    }, error => {
      console.error("❌ Error al obtener menús en MenuComponent:", error);
    });
  }

  updateActiveMenu(currentUrl: string) {
    const normalizedUrl = currentUrl === '/' ? '/inicio' : currentUrl;
    //console.log(`Actualizando menú activo. URL actual: '${normalizedUrl}' (original: '${currentUrl}')`);

    let bestMatch = { menuId: null as string | null, subMenuId: null as string | null, specificity: -1 };

    const staticItems = [
        { id: 'inicio', route: '/inicio' },
        { id: 'perfil', route: '/perfil' }
    ];

    for (const staticItem of staticItems) {
        if (staticItem.route && normalizedUrl.startsWith(staticItem.route)) {
            let currentSpecificity = staticItem.route.length;
            if (normalizedUrl === staticItem.route) currentSpecificity += 1;
            //console.log(`Verificación estática: Elemento ${staticItem.id}, Ruta ${staticItem.route}, Especificidad ${currentSpecificity}`);
            if (currentSpecificity > bestMatch.specificity) {
                bestMatch = { menuId: staticItem.id, subMenuId: null, specificity: currentSpecificity };
            }
        }
    }

    for (const menuItem of this.menuJerarquico) {
        if (menuItem.menu_ruta) {
            //console.log(`Verificación de menú: Elemento ${menuItem.idMenu}, Ruta ${menuItem.menu_ruta}`);
            if (normalizedUrl.startsWith(menuItem.menu_ruta)) {
                let currentSpecificity = menuItem.menu_ruta.length;
                if (normalizedUrl === menuItem.menu_ruta) currentSpecificity += 1;
                //console.log(`  Coincidencia encontrada para ${menuItem.idMenu}. Especificidad: ${currentSpecificity}`);
                if (currentSpecificity > bestMatch.specificity) {
                    bestMatch = { menuId: menuItem.idMenu, subMenuId: null, specificity: currentSpecificity };
                }
            }
        }

        if (menuItem.submenus && menuItem.submenus.length > 0) {
            for (const subMenuItem of menuItem.submenus) {
                if (subMenuItem.menu_ruta) {
                    //console.log(`  Verificación de submenú: Elemento ${subMenuItem.idMenu} (padre ${menuItem.idMenu}), Ruta ${subMenuItem.menu_ruta}`);
                    if (normalizedUrl.startsWith(subMenuItem.menu_ruta)) {
                        let currentSpecificity = subMenuItem.menu_ruta.length;
                        if (normalizedUrl === subMenuItem.menu_ruta) currentSpecificity += 1;
                        //console.log(`    Coincidencia encontrada para submenú ${subMenuItem.idMenu}. Especificidad: ${currentSpecificity}`);
                        if (currentSpecificity > bestMatch.specificity) {
                            bestMatch = { menuId: menuItem.idMenu, subMenuId: subMenuItem.idMenu, specificity: currentSpecificity };
                        }
                    }
                }
            }
        }
    }

    console.log('Mejor coincidencia encontrada:', bestMatch);

    if (this.activeMenuId !== bestMatch.menuId || this.activeSubMenuId !== bestMatch.subMenuId) {
      this.activeMenuId = bestMatch.menuId;
      this.activeSubMenuId = bestMatch.subMenuId;
      //console.log('IDs activos establecidos: activeMenuId =', this.activeMenuId, ', activeSubMenuId =', this.activeSubMenuId);

      if (this.activeMenuId && this.activeSubMenuId && !this.menuCerrado) {
        if (!this.subMenuOpen[this.activeMenuId]) {
          //console.log('Abriendo submenú padre para elemento activo:', this.activeMenuId);
          this.subMenuOpen[this.activeMenuId] = true;
        }
      }
      this.cdr.detectChanges();
    } else {
      console.log('Los IDs activos no cambiaron.');
    }
  }

  extraerIdDesdeUrl(url: string): string | null {
    const regexFileD = /\/d\/([a-zAZ0-9_-]+)/;
    const regexUc = /id=([a-zA-Z0-9_-]+)/;
    let match = url.match(regexFileD);
    if (match) return match[1];
    match = url.match(regexUc);
    if (match) return match[1];
    const regexId = /^[a-zA-Z0-9_-]+$/;
    if (regexId.test(url)) return url;
    return null;
  }

  cargarImagenDesdeBackend(urlDrive: string) {
    if (!urlDrive || urlDrive.trim() === '') return;
    const fileId = this.extraerIdDesdeUrl(urlDrive);
    if (!fileId) {
      this.perfilUrl = null;
      return;
    }
    const apiUrl = `/api/api/perfil/imagen/${fileId}`;
    this.http.get(apiUrl, { responseType: 'blob', withCredentials: true }).subscribe(blob => {
      const imageUrl = URL.createObjectURL(blob);
      this.perfilUrl = imageUrl;
      this.cdr.detectChanges();
    }, error => {
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
    if (nombres.length === 1 && apellido) {
      const inicialNombre = nombres[0][0] || '';
      const inicialApellido = apellido[0] || '';
      return (inicialNombre + inicialApellido).toUpperCase();
    }
    if (nombres.length >= 2) {
      return (nombres[0][0] + (nombres[1]?.[0] || '')).toUpperCase();
    }
    if (nombres.length === 1) {
      return (nombres[0][0] + (nombres[0].length > 1 ? nombres[0][1] : '')).toUpperCase();
    }
    return (nombres[0]?.[0] || '?').toUpperCase();
  }

  getIcon(menu_icono: string): IconDefinition | null {
    const iconoEncontrado = fontAwesomeIcons.find(icon => icon.iconName === menu_icono?.toLowerCase());
    if (!iconoEncontrado && menu_icono) console.warn(`⚠ No se encontró el icono: "${menu_icono}" en fontAwesomeIcons`);
    return iconoEncontrado || null;
  }

  toggleMenu() {
    this.menuCerrado = !this.menuCerrado;
    this.activeTooltipId = null;
    this.menuToggle.emit();
  }

  toggleSubMenu(menuId: string) {
    if (this.menuCerrado) {
      // En modo cerrado, al hacer clic, mantener el submenú visible
      if (this.activeTooltipId === menuId) {
        this.activeTooltipId = null; // Si ya está activo, lo cerramos
      } else {
        this.activeTooltipId = menuId; // Si no está activo, lo abrimos
      }
    } else {
      // En modo abierto, toggle normal del submenú
      this.subMenuOpen[menuId || ''] = !this.subMenuOpen[menuId || ''];
    }
    this.cdr.detectChanges();
  }

  showExpanded(id: string) {
    if (this.menuCerrado && id) {
      this.activeTooltipId = id;
      this.cdr.detectChanges();
    }
  }

  hideExpanded() {
    if (this.menuCerrado) {
      this.activeTooltipId = null;
      this.cdr.detectChanges();
    }
  }

  trackById(index: number, item: DTOMenu): string {
    return item.idMenu ?? index.toString();
  }

  navigate(menu: DTOMenu) {
    this.activeTooltipId = null;
    if (menu.menu_ruta) {
      this.router.navigate([menu.menu_ruta]);
    } else {
      console.warn(`⚠ No se puede navegar: el menú "${menu.menu_descripcion}" no tiene una ruta definida.`);
    }
  }

  irAPerfil() {
    this.activeTooltipId = null;
    this.router.navigate(['/perfil']);
  }

  principal() {
    this.activeTooltipId = null;
    this.router.navigate(['/inicio']);
  }

  logout() {
    this.activeTooltipId = null;
    if (isPlatformBrowser(this.platformId)) localStorage.clear();
    window.location.href = 'http://34.231.204.50/oauth';
  }
}
