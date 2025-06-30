import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private apiUrl = 'http://your-api-url/api'; // Replace with actual API URL
  private emailApiUrl = 'http://your-api-url/email'; // Replace with actual email API URL
  private imageUploadUrl = 'http://your-api-url/upload'; // Replace with actual image upload URL

  constructor(private http: HttpClient) {}

  uploadImage(formData: FormData): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(this.imageUploadUrl, formData);
  }

  registerUserInDb(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, usuario);
  }

  registerAuth(dtoRegister: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, dtoRegister);
  }

  sendEmail(destinatarios: string[], asunto: string, cuerpoHtml: string, adjuntos: any[]): Observable<any> {
    const emailPayload = {
      destinatarios,
      asunto,
      cuerpoHtml,
      adjuntos
    };
    return this.http.post(this.emailApiUrl, emailPayload);
  }
}