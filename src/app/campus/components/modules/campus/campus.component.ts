import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/card/card.component';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { ProfesorCursoService } from '../../../services/profesor-curso.service';
import { ProfesorCurso } from '../../../interface/ProfesorCurso'; 
import { lastValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { UserData, ValidateService } from '../../../../services/validateAuth.service';
import { UsuarioService } from '../../../services/usuario.service';
import { AlumnoCursoService } from '../../../services/alumno-curso.service';
import { AlumnoCurso } from '../../../interface/AlumnoCurso';

@Component({
  selector: 'app-campus',
  standalone: true,
  imports: [RouterModule, CardComponent, HttpClientModule, CommonModule, NgxPaginationModule, MatButtonModule, MatDialogModule],
  providers: [ProfesorCursoService, AlumnoCursoService],
  templateUrl: './campus.component.html',
  styleUrl: './campus.component.scss'
})
export class CampusComponent implements OnInit {
  public page: number = 1;
    profesorcursos: ProfesorCurso[] = [];
    alumnocursos: AlumnoCurso[] = [];
    usuarioId: string | null = null;
    rolUsuario: string | null = null;

    constructor(
        private profesorCursoService: ProfesorCursoService,
        private alumnoCursoService: AlumnoCursoService,
        private authService: ValidateService,
        private usuarioService: UsuarioService
    ) {}

    async ngOnInit(): Promise<void> {
        try {
            const userData: UserData = await lastValueFrom(this.authService.getUserData());
            console.log('Datos del usuario:', userData);

            const idAuth = userData?.data?.id;
            this.rolUsuario = userData?.data?.rol || null;
            if (!idAuth) {
                console.error('No se encontró el id_auth del usuario');
                return;
            }

            this.usuarioId = await lastValueFrom(this.usuarioService.getUsuarioByIdAuth(idAuth));
            console.log('usuarioId obtenido:', this.usuarioId);

            if (this.usuarioId) {
                localStorage.setItem('usuarioId', this.usuarioId);
                if (this.rolUsuario === 'Profesor') {
                    await this.obtenerCursosPorProfesor();
                } else if (this.rolUsuario === 'Alumno') {
                    await this.obtenerCursosPorAlumno();
                } else {
                    console.warn('Rol no reconocido:', this.rolUsuario);
                }
            } else {
                console.error('No se encontró el ID del usuario autenticado');
            }
        } catch (error) {
            console.error('Error al inicializar el componente:', error);
        }
    }

    async obtenerCursosPorProfesor(): Promise<void> {
        try {
            this.profesorcursos = await lastValueFrom(
                this.profesorCursoService.obtenerCursosPorProfesor(this.usuarioId!)
            );
            console.log('Cursos del profesor:', this.profesorcursos);
        } catch (error) {
            console.error('Error al obtener los cursos del profesor', error);
        }
    }

    async obtenerCursosPorAlumno(): Promise<void> {
        try {
            this.alumnocursos = await lastValueFrom(
                this.alumnoCursoService.obtenerCursosPorAlumno(this.usuarioId!)
            );
            console.log('Cursos del alumno:', this.alumnocursos);
        } catch (error) {
            console.error('Error al obtener los cursos del alumno', error);
        }
    }

}
