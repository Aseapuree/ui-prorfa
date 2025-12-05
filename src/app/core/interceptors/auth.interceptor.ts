import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
      catchError((error) => {
          if (error.status === 401 ||  error.status === 403) {
              console.warn('Sesión expirada, redirigiendo...');
              window.location.href = "/oauth";
          }
          return throwError(() => error); // Forzamos que el error siga propagándose
      })
  );
};
