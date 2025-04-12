import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule,CommonModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  perfilForm!: FormGroup;
  imagenPrevia: string | ArrayBuffer | null = null;
  selectedImage!: File;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.perfilForm = this.fb.group({
      nombre: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      contrasena: [''],
      imagen: [null]
    });

    // Puedes cargar los datos del usuario aquí si los tienes
  }

  onImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPrevia = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  guardarPerfil() {
    const formData = new FormData();
    formData.append('nombre', this.perfilForm.get('nombre')?.value);
    formData.append('correo', this.perfilForm.get('correo')?.value);
    formData.append('contrasena', this.perfilForm.get('contrasena')?.value);
    if (this.selectedImage) {
      formData.append('imagen', this.selectedImage);
    }

    // Aquí iría la llamada a tu servicio para hacer el POST/PUT al backend
    console.log('Datos enviados:', formData);
  }
}
