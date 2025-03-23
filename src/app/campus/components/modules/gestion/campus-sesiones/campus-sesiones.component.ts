import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxPaginationModule } from 'ngx-pagination';
import { CardWeekComponent } from '../../../shared/card-week/card-week.component';
import { SesionService } from '../../../../services/sesion.service';
import { Sesion } from '../../../../interface/sesion';
import { lastValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ModalSesionService } from '../../modals/modal-sesion/modal-sesion.service';
import { ModalSesionComponent } from '../../modals/modal-sesion/modal-sesion.component';
import { DialogoConfirmacionComponent } from '../../modals/dialogo-confirmacion/dialogo-confirmacion.component';

@Component({
  selector: 'app-campus-sesiones',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule, FontAwesomeModule,RouterModule,CardWeekComponent,HttpClientModule],
  providers: [SesionService],
  templateUrl: './campus-sesiones.component.html',
  styleUrl: './campus-sesiones.component.scss'
})
export class CampusSesionesComponent {
  public page!: number;
  sesiones: Sesion[] = [];
  idProfesorCurso: string = '';

  constructor(
    private sesionService: SesionService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router
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

  openAddModal(): void {
    const dialogRef = this.dialog.open(ModalSesionComponent, {
      width: '600px',
      data: {
        isEditing: false,
        idProfesorCurso: this.idProfesorCurso, // Pasar el ID del profesor-curso
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.obtenerSesiones(); // Recargar las sesiones después de agregar
      }
    });
  }

  openEditModal(sesion: Sesion): void {
    const dialogRef = this.dialog.open(ModalSesionComponent, {
      width: '600px',
      data: {
        isEditing: true,
        sesion: sesion, // Pasar la sesión a editar
        idProfesorCurso: this.idProfesorCurso, // Pasar el ID del profesor-curso
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.obtenerSesiones(); // Recargar las sesiones después de editar
      }
    });
  }


  eliminarSesion(idSesion: string): void{
    const dialoRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '1px',
      height: '1px',
      data: { message : '¿Estas seguro de que quieres eliminar esta sesion?'}
    });

    dialoRef.afterClosed().subscribe(result => {
      if (result) {
        this._sesionSVC.eliminarSesion(idSesion).subscribe({
          next: () => {
            this.obtenerSesiones();
            
          },
          error: (err) => console.error("Error al eliminar una sesion", err)
        })
      }
    })
  }

  // Método para navegar a las actividades de una sesión
  irAActividades(idSesion: string): void {
    this.router.navigate(['/card-actividades', idSesion], {
      state: { idProfesorCurso: this.idProfesorCurso }
    });
  }
}