import { Component, OnInit } from '@angular/core';
import {  RouterModule } from '@angular/router';
import { Usuario } from '../../../../interface/usuario';
import { UsuarioService } from '../../../../services/usuario.service';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-campus-usuario',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule],
  templateUrl: './campus-usuario.component.html',
  styleUrl: './campus-usuario.component.scss'
})
export class CampusUsuarioComponent implements OnInit {
  usuarios: Usuario[] = [];

  constructor(
    private usuarioService: UsuarioService
  ){}

  async ngOnInit(): Promise<void> {
    await this.obtenerUsuario();
  }

  // Obtener usuarios
  async obtenerUsuario(): Promise<void> {
    try {
      this.usuarios = await lastValueFrom(this.usuarioService.obtenerUsuarioList());
    } catch (error) {
      console.error('Error al obtener los usuarios', error);
    }
  }

}
