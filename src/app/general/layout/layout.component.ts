import { ChangeDetectorRef, Component, OnInit, Output } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';
import { CommonModule } from '@angular/common';
import { DTOmenuService } from '../Services/dtomenu.service';
import { DTOUsuarioService } from '../Services/dtousuario.service';
import { DTOmenu } from '../Interface/DTOmenu';
import { DTOUsuario } from '../Interface/DTOUsuario';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, MenuComponent, CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  title = 'Angular';
  menus: DTOmenu[] = [];
  idUsuario: string = "537d4a03-953a-4851-8c12-1da09ad2122c";
  idRol: string = '';
  @Output() nombreRol: string = '';
  nombreUsuario: string = '';
  apellidoPaterno: string = '';
  apellidoMaterno: string = '';

  menuAbierto: boolean = true;

  constructor(
    private menuService: DTOmenuService,
    private usuarioService: DTOUsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.obtenerDatosUsuario();
  }

  obtenerDatosUsuario() {
    console.log("🔹 ID Usuario:", this.idUsuario);

    this.usuarioService.getUsuario(this.idUsuario).subscribe(usuarioResponse => {
      console.log("🔹 Respuesta del servicio de usuario:", usuarioResponse);

      if (usuarioResponse?.data) {
        const usuario: DTOUsuario = usuarioResponse.data;
        this.nombreUsuario = usuario.nombre || '';
        this.apellidoPaterno = usuario.apellidopaterno || '';
        this.apellidoMaterno = usuario.apellidomaterno || '';
        this.idRol = usuario.rol?.idRol || '';
        this.nombreRol = usuario.rol?.nombreRol || '';

        console.log("✅ ID Rol obtenido:", this.idRol);
        console.log("✅ Usuario:", this.nombreUsuario, this.apellidoPaterno, this.apellidoMaterno);

        if (this.idRol) {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem("rol", this.idRol);
            console.log("✅ Rol guardado en localStorage:", localStorage.getItem("rol"));
          }
          this.obtenerMenus();
        } else {
          console.warn("⚠ El usuario no tiene un rol asignado.");
        }
      } else {
        console.warn("⚠ No se encontró el usuario con ese ID.");
      }
    }, (error: HttpErrorResponse) => {
      console.error("❌ Error al obtener el usuario:", error.message);
    });
  }

  obtenerMenus() {
    this.menuService.getMenus(this.idRol).subscribe(menuResponse => {
      console.log("🔹 Respuesta del servicio de menús:", menuResponse);

      if (menuResponse?.data?.length) {
        this.menus = [...menuResponse.data];
        console.log("✅ Menús cargados:", this.menus);
      } else {
        console.warn("⚠ No hay menús disponibles.");
      }
      this.cdr.detectChanges();
    }, error => {
      console.error("❌ Error al obtener menús:", error);
    });
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }
  
  
}
