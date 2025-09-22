import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EntidadService } from '../../services/entidad.service';
import { Entidad } from '../../interfaces/DTOEntidad';
import { HttpClientModule } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { GeneralLoadingSpinnerComponent } from '../../../general/components/spinner/spinner.component';

@Component({
  selector: 'app-entidad',
  standalone: true,
  imports: [CommonModule, HttpClientModule, GeneralLoadingSpinnerComponent],
  templateUrl: './entidad.component.html',
  styleUrls: ['./entidad.component.scss']
})
export class EntidadComponent implements OnInit {

  entidad$: Observable<Entidad> | undefined;
  loading = false;
  spinnerMessage: string = 'Cargando datos...';

  constructor(
    private entidadService: EntidadService,
    private route: ActivatedRoute
  ) { }

  /*ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.obtenerDatosEntidad(id);
      } else {
        this.obtenerDatosEntidad('9a11a63f-0a52-4518-abc4-dc1e27e1aa57');
      }
    });
  }

  obtenerDatosEntidad(id: string): void {
    this.entidad$ = this.entidadService.obtenerEntidad(id);
  }*/

  ngOnInit(): void {
    // Se obtiene el ID del usuario directamente desde el localStorage.
    const idUsuario = localStorage.getItem('IDUSER');

    // Se verifica si el ID existe antes de llamar al servicio.
    if (idUsuario) {
      this.obtenerDatosEntidadPorUsuario(idUsuario);
    } else {
      console.error('ID de usuario no encontrado en el localStorage.');
    }
  }

  obtenerDatosEntidadPorUsuario(id: string): void {
    this.loading = true;
   this.entidadService.obtenerEntidadPorUsuario(id).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe(entidad => {
      this.entidad$ = new Observable(observer => {
        observer.next(entidad);
        observer.complete();
      });
    });
  }
}

