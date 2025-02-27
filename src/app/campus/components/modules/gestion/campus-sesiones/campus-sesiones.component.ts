import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxPaginationModule } from 'ngx-pagination';
import { CardWeekComponent } from '../../../shared/card-week/card-week.component';
import { CampusInfoWeekComponent } from '../../weeks/campus-info-week/campus-info-week.component';
import { SesionService } from '../../../../services/sesion.service';
import { Sesion } from '../../../../interface/sesion';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-campus-sesiones',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule,RouterModule,CardWeekComponent, CampusInfoWeekComponent,HttpClientModule, NgxPaginationModule],
  providers: [SesionService],
  templateUrl: './campus-sesiones.component.html',
  styleUrl: './campus-sesiones.component.scss'
})
export class CampusSesionesComponent {
  public page!: number;
  sesiones: Sesion[] = [];

  constructor(private sesionService: SesionService) {}

  async ngOnInit(): Promise<void> {
    await this.obtenerSesion();
  }

  async obtenerSesion(): Promise<void> {
    try {
      const data = await lastValueFrom(this.sesionService.obtenerSesionList());
      console.log('Datos recibidos:', data);
      this.sesiones = data;
    } catch (error) {
      console.error('Error al obtener las sesiones', error);
    }
  }
}
