import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MasterService {
  private apiUrl = 'http://localhost:8080/v1/maestra'; // Replace with actual API URL

  constructor(private http: HttpClient) {}



  listByPrefijo(prefijo:number): Observable<any> {
    return this.http.get(`${this.apiUrl}/listar?prefijo=`+prefijo,{withCredentials:true});
  }

  registerAuth(dtoRegister: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, dtoRegister);
  }
}