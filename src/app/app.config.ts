import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { NgxPaginationModule } from 'ngx-pagination';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';

// Definir los formatos de fecha
export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

// Personalizar el DateAdapter para forzar el formato dd/MM/yyyy
class CustomDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if (typeof value === 'string' && value.indexOf('/') > -1) {
      const str = value.split('/');
      const day = Number(str[0]);
      const month = Number(str[1]) - 1; // Los meses en JavaScript son 0-indexed
      const year = Number(str[2]);
      return new Date(year, month, day);
    }
    return super.parse(value);
  }

  override format(date: Date, displayFormat: Object): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}


export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),
    provideAnimations(), // Necesario para Angular Material
    provideHttpClient(), // Necesario para peticiones HTTP
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }, // Configura el locale para Angular Material
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }, // Configura los formatos de fecha
    { provide: DateAdapter, useClass: CustomDateAdapter }, // Usa el adaptador personalizado
    provideClientHydration(),
    NgxPaginationModule,
    FontAwesomeModule,
    provideAnimationsAsync(),
    provideHttpClient(withFetch(),
    
    withInterceptors([authInterceptor]))]
};
