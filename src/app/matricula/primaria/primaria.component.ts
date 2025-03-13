import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-primaria',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf],
  templateUrl: './primaria.component.html',
  styleUrls: ['./primaria.component.scss']
})
export class PrimariaComponent implements OnInit {

  gradosPrimaria: string[] = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto'];
  vacantesPrimaria: number[] = [0, 0, 0, 0, 0, 0];
  seccionesPrimaria: any[] = [];

  cargando: boolean = true;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.cargarVacantes();
  }

  cargarVacantes(): void {
    this.http.get<any>('http://localhost:8080/v1/matriculas/vacantesPrimaria')
      .subscribe({
        next: (data) => {
          for (let grado = 1; grado <= 6; grado++) {
            const secciones = data[grado] || {};
            this.seccionesPrimaria[grado - 1] = secciones;
            let totalVacantes = 0;

            for (const sec of ['A', 'B', 'C', 'D']) {
              totalVacantes += secciones[sec] || 0;
            }
            this.vacantesPrimaria[grado - 1] = totalVacantes;
          }
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al cargar vacantes de Primaria:', err);
          this.cargando = false;
        }
      });
  }

  matricular(index: number): void {
    const grado = index + 1;
    this.router.navigate(['/registrarmatricula'], {
      queryParams: { nivel: 'Primaria', grado }
    });
  }
}
