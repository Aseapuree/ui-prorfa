import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DTOMenu } from '../interfaces/DTOMenu'; 
import { DTOResponse } from '../interfaces/DTOResponse';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DTOmenuService {
  private url = `${environment.apiUrl}/v1/menu/ver?id=`;

  constructor(private http: HttpClient) { }

  getMenus(idrol:any): Observable<DTOResponse<DTOMenu[]>> {
    return this.http.get<DTOResponse<DTOMenu[]>>(`${this.url}${idrol}`,{withCredentials:true});
  }
}
