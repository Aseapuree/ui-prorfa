import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { registerLocaleData } from '@angular/common'; // Importa registerLocaleData
import localeEs from '@angular/common/locales/es'; // Importa el locale para español

// Registra el idioma español
registerLocaleData(localeEs, 'es');

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));