import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DTOMenu } from '../Interface/DTOMenu'; 
import { DTOResponse } from '../Interface/DTOResponse';

@Injectable({
  providedIn: 'root'
})
export class DTOmenuService {
  private url = '/api/v1/menu/ver?id=';

  constructor(private http: HttpClient) { }

  getMenus(idrol:any): Observable<DTOResponse<DTOMenu[]>> {
    return this.http.get<DTOResponse<DTOMenu[]>>(`${this.url}${idrol}`,{withCredentials:true});
  }
}
