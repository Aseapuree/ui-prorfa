import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DTORoles } from '../Interface/DTOroles'; 
import { DTOResponse } from '../Interface/DTOResponse';
@Injectable({
    providedIn: 'root'
  })
  export class DTOrolesService {
    private url = 'http://localhost:8080/v1/usuario/mostrar?id=';
  
    constructor(private http: HttpClient) { }
  
    getRol(idrolu:any): Observable<DTOResponse<DTORoles>> {
      return this.http.get<DTOResponse<DTORoles>>(`${this.url}${idrolu}`);
    }
  }