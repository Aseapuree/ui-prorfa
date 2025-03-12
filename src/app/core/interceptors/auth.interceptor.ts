import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
      catchError((error) => {
          if (error.status === 401) {
              console.warn('Sesión expirada, redirigiendo...');
              window.location.href = "http://localhost:4203";
          }
          return throwError(() => error); // Forzamos que el error siga propagándose
      })
  );
};
