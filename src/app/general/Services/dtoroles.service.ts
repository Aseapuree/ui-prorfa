import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DTORoles } from '../interfaces/DTORoles'; 
import { DTOResponse } from '../interfaces/DTOResponse';
@Injectable({
    providedIn: 'root'
  })
  export class DTOrolesService {
    private url = '/api/v1/';
  
    constructor(private http: HttpClient) { }
  
    getRol(idrolu:any): Observable<DTOResponse<DTORoles>> {
      return this.http.get<DTOResponse<DTORoles>>(`${this.url}usuario/mostrar?id=${idrolu}`,{withCredentials:true});
    }

    getRoles():Observable<DTORoles[]>{
      return this.http.get<[]>(`${this.url}roles/listar`,{withCredentials:true});
    }
  }