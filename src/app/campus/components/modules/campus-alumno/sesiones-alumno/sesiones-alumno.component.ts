import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxPaginationModule } from 'ngx-pagination';
import { CardWeekComponent } from '../../../shared/card-week/card-week.component';
import { SesionService } from '../../../../services/sesion.service';
import { Sesion } from '../../../../interface/sesion';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-sesiones-alumno',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule, FontAwesomeModule,RouterModule,CardWeekComponent,HttpClientModule],
  providers: [SesionService],
  templateUrl: './sesiones-alumno.component.html',
  styleUrl: './sesiones-alumno.component.scss'
})
export class SesionesAlumnoComponent {
public page!: number;
  sesiones: Sesion[] = [];
  idProfesorCurso: string = '';

  constructor(
    private sesionService: SesionService,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  private readonly _sesionSVC = inject(SesionService);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.idProfesorCurso = params.get('idProfesorCurso') || '';
      if (this.idProfesorCurso) {
        this.obtenerSesiones();
      }
    });
  }

  obtenerSesiones(): void {
    this.sesionService.obtenerSesionesPorCurso(this.idProfesorCurso).subscribe({
      next: (data) => {
        this.sesiones = data;
      },
      error: (err) => {
        console.error('Error al obtener sesiones:', err);
      },
    });
  }


}
