import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { NgxPaginationModule } from 'ngx-pagination';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideClientHydration(),NgxPaginationModule,FontAwesomeModule, provideAnimationsAsync(),provideHttpClient(),importProvidersFrom(HttpClientModule,FormsModule,ReactiveFormsModule)]
};
