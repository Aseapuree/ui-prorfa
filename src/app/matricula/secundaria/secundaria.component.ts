import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';


@Component({
  selector: 'app-secundaria',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf],
  templateUrl: './secundaria.component.html',
  styleUrls: ['./secundaria.component.scss']
})
export class SecundariaComponent implements OnInit {

  gradosSecundaria: string[] = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto'];
  vacantesSecundaria: number[] = [0, 0, 0, 0, 0];
  seccionesSecundaria: { [key: string]: number }[] = [];

  cargando: boolean = true;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.cargarVacantes();
  }

  cargarVacantes(): void {
    this.http.get<any>('http://localhost:8080/v1/matriculas/vacantesSecundaria')
      .subscribe({
        next: (data) => {
          for (let grado = 1; grado <= 5; grado++) {
            const secciones = data[grado] || {};
            this.seccionesSecundaria[grado - 1] = secciones;
            let totalVacantes = 0;
            for (const sec of ['A', 'B', 'C', 'D']) {
              totalVacantes += secciones[sec] || 0;
            }
            this.vacantesSecundaria[grado - 1] = totalVacantes;
          }
          this.cargando = false;
        },

        error: (err) => {
          console.error('Error al cargar vacantes de Secundaria:', err);
          this.cargando = false;
        }
      });
  }

  matricular(index: number): void {
    const grado = index + 1;
    this.router.navigate(['/registrarmatricula'], {
      queryParams: { nivel: 'Secundaria', grado }
    });
  }
}
