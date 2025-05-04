import { ChangeDetectorRef, Component, Inject, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DTOmenuService } from '../../Services/dtomenu.service';
import { DTOUsuarioService } from '../../Services/dtousuario.service';
import { DTOMenu } from '../../Interface/DTOMenu';
import { DTOUsuario } from '../../Interface/DTOUsuario';
import { ValidateService } from '../../../services/validateAuth.service';
import {  lastValueFrom } from 'rxjs';
import { FooterComponent } from '../footer/footer.component';



@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, MenuComponent, CommonModule, FooterComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  menus: DTOMenu[] = [];
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

      localStorage.setItem("IDUSER",userId)

  
      this.usuarioMostrar = usuarioResponse.data;
      console.log("Usuario obtenido: ", this.usuarioMostrar);
  
      // ✅ Guardar perfilUrl en localStorage si existe
      if (this.usuarioMostrar.perfilurl) {
        localStorage.setItem("perfilUrl", this.usuarioMostrar.perfilurl);
        console.log("📦 perfilUrl guardado en localStorage:", this.usuarioMostrar.perfilurl);
      } else {
        console.warn("⚠ El usuario no tiene perfilurl.");
      }
  
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