// import { ChangeDetectorRef, Component, Inject, OnInit, Output, PLATFORM_ID } from '@angular/core';
// import { Router, RouterOutlet } from '@angular/router';
// import { MenuComponent } from '../menu/menu.component';
// import { CommonModule, isPlatformBrowser } from '@angular/common';
// import { DTOmenuService } from '../Services/dtomenu.service';
// import { DTOUsuarioService } from '../Services/dtousuario.service';
// import { DTOmenu } from '../Interface/DTOMenu';
// import { DTOUsuario } from '../Interface/DTOUsuario';
// import { HttpErrorResponse } from '@angular/common/http';
// import { ValidateService } from '../../services/validateAuth.service';  // Importa el servicio

// @Component({
//   selector: 'app-layout',
//   standalone: true,
//   imports: [RouterOutlet, MenuComponent, CommonModule],
//   templateUrl: './layout.component.html',
//   styleUrls: ['./layout.component.scss']
// })
// export class LayoutComponent implements OnInit {
//   menus: DTOmenu[] = [];
//   @Output() nombreRol: string = '';
//   usuarioMostrar:DTOUsuario={};
//   idUsuarioBuscar = '';
//   menuAbierto: boolean = true;

//   constructor(
//     private menuService: DTOmenuService,
//     private usuarioService: DTOUsuarioService,
//     private cdr: ChangeDetectorRef,
//     private authService: ValidateService,
//     @Inject(PLATFORM_ID) private platformId: any,
//   ) {}

//   ngOnInit() {
//     this.verificarSesion();
//     this.obtenerDatosUsuario();
//   }


//   //Temporal para poder acceder al id usuario
//   getCookie(name: string) {
//     if (isPlatformBrowser(this.platformId)) {
//       const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
//       return match ? match[2] : null;
//     }
//     return;
//   }


//   obtenerDatosUsuario() {

//     const userId = this.getCookie('user-id') || '';
//     console.log("🔹 ID Usuario:", userId);
//     this.usuarioService.getUsuario(userId).subscribe(usuarioResponse => {
//       console.log("🔹 Respuesta del servicio de usuario:", usuarioResponse);

//       if (usuarioResponse?.data) {
//         this.usuarioMostrar = usuarioResponse.data;

//         console.log("✅ Usuario y rol obtenido: ", this.usuarioMostrar);

//         if (this.usuarioMostrar.rol?.idRol) {
//           localStorage.setItem("rol", this.usuarioMostrar.rol?.idRol || '');
//           console.log("✅ Rol guardado en localStorage:", localStorage.getItem("rol"));
//             // Forzar actualización en Angular
//           this.cdr.detectChanges();
//           this.obtenerMenus();
//         } else {
//           console.warn("⚠ El usuario no tiene un rol asignado.");
//         }
//       } else {
//         console.warn("⚠ No se encontró el usuario con ese ID.");
//       }
//     }, (error) => {
//       console.error("❌ Error al obtener el usuario:", error);
//     });
//   }

//   obtenerMenus() {
//     this.menuService.getMenus(this.usuarioMostrar.rol?.idRol).subscribe(menuResponse => {
//       console.log("🔹 Respuesta del servicio de menús:", menuResponse);

//       if (menuResponse?.data?.length) {
//         this.menus = [...menuResponse.data];
//         console.log("✅ Menús cargados:", this.menus);
//       } else {
//         console.warn("⚠ No hay menús disponibles.");
//       }
//       this.cdr.detectChanges();
//     }, error => {
//       console.error("❌ Error al obtener menús:", error);
//     });
//   }

//   toggleMenu() {
//     this.menuAbierto = !this.menuAbierto;
//   }



//   //METODO QUE SIRVE PARA QUE VALIDAR LA SESION ACTUAL Y LA COOKIE SIGA ACTIVA
//   verificarSesion() {
//     this.authService.verificarSesion().subscribe({
//       next: () => console.log("Sesión válida"),
//       error: () =>window.location.href = "http://localhost:4203" // Redirigir si no está autenticado
//     });
//   }
// }

import { ChangeDetectorRef, Component, Inject, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DTOmenuService } from '../../Services/dtomenu.service';
import { DTOUsuarioService } from '../../Services/dtousuario.service';
import { DTOmenu } from '../../Interface/DTOMenu';
import { DTOUsuario } from '../../Interface/DTOUsuario';
import { ValidateService } from '../../../services/validateAuth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { of, lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, MenuComponent, CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  menus: DTOmenu[] = [];
  @Output() nombreRol: string = '';
  usuarioMostrar: DTOUsuario = {};
  menuAbierto: boolean = true;

  constructor(
    private menuService: DTOmenuService,
    private usuarioService: DTOUsuarioService,
    private cdr: ChangeDetectorRef,
    private authService: ValidateService,
    @Inject(PLATFORM_ID) private platformId: any,
  ) {}

  async ngOnInit() {
    this.verificarSesion();
    await this.obtenerDatosUsuarioYMenus();
  }

  private getCookie(name: string) {
    if (isPlatformBrowser(this.platformId)) {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    }
    return;
  }

  private async obtenerDatosUsuarioYMenus() {
    const userId = this.getCookie('user-id') || '';
    if (!userId) {
      console.warn("⚠ No se encontró un ID de usuario.");
      return;
    }

    try {
      const usuarioResponse = await lastValueFrom(this.usuarioService.getUsuario(userId));
      if (!usuarioResponse?.data) {
        console.warn("⚠ No se encontró el usuario con ese ID.");
        return;
      }

      this.usuarioMostrar = usuarioResponse.data;
      console.log("Usuario obtenido: ", this.usuarioMostrar);

      const idRol = this.usuarioMostrar.rol?.idRol;
      if (!idRol) {
        console.warn("⚠ El usuario no tiene un rol asignado.");
        return;
      }

      localStorage.setItem("rol", idRol);
      console.log("Rol guardado en localStorage:", localStorage.getItem("rol"));
      this.cdr.detectChanges();

      const menuResponse = await lastValueFrom(this.menuService.getMenus(idRol));
      this.menus = menuResponse?.data || [];
      console.log("Menús cargados:", this.menus);
      this.cdr.detectChanges();
    } catch (error) {
      console.error("Error en la obtención de usuario o menús:", error);
    }
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  private async verificarSesion() {
    try {
      await lastValueFrom(this.authService.verificarSesion());
      console.log("Sesión válida");
    } catch {
      window.location.href = "http://localhost:4203"; // Redirigir si no está autenticado
    }
  }
  
}
