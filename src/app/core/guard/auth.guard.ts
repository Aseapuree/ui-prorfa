import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ValidateService } from '../services/validateAuth.service';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: ValidateService, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async canActivate(): Promise<boolean> {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const isAuthenticated = await firstValueFrom(this.authService.verificarSesion());
        console.log('IS AUTH', isAuthenticated);
        if (!isAuthenticated) {
          window.location.href = 'http://localhost:4203';
          return false;
        }
        return true;
      } catch (error) {
        window.location.href = 'http://localhost:4203';
        return false;
      }
    } else {
      // Para entornos que no sean navegador
      return true;
    }
  }
}
