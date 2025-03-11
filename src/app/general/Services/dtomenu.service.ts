import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DTOmenu } from '../Interface/DTOmenu'; 
import { DTOResponse } from '../Interface/DTOResponse';

@Injectable({
  providedIn: 'root'
})
export class DTOmenuService {
  private url = 'http://localhost:8080/v1/menu/ver?id=';

  constructor(private http: HttpClient) { }

  getMenus(idrol:any): Observable<DTOResponse<DTOmenu[]>> {
    return this.http.get<DTOResponse<DTOmenu[]>>(`${this.url}${idrol}`);
  }
}
