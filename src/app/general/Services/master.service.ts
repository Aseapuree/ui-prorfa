import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'
@Injectable({
  providedIn: 'root'
})
export class MasterService {

  private apiUrl = `${environment.apiUrl}/v1/maestra`;
  constructor(private http: HttpClient) {}

  listByPrefijo(prefijo:number): Observable<any> {
    return this.http.get(`${this.apiUrl}/listar?prefijo=`+prefijo,{withCredentials:true});
  }

  registerAuth(dtoRegister: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, dtoRegister);
  }
}
