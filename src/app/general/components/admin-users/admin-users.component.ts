import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AlertComponent } from '../../../campus/components/shared/alert/alert.component';
import { CommonModule } from '@angular/common';
import { AdminUserService } from '../../Services/admin-user.service';
import { DTOrolesService } from '../../Services/dtoroles.service';
import { lastValueFrom } from 'rxjs';
import { DTORoles } from '../../interfaces/DTORoles';
import { MasterService } from '../../Services/master.service';

@Component({
  selector: 'app-admin-user',
  standalone: true,
  imports: [AlertComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  userForm: FormGroup;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  isSubmitting = false;
  imagePreview: string | ArrayBuffer | null = null;
  docTypes: { correlativo: number; descripcion: string }[] = [];
  roles: { nombreRol: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: AdminUserService,
    private rolesService: DTOrolesService,
    private masterService: MasterService
  ) {
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      apellidopaterno: ['', [Validators.required, Validators.maxLength(50)]],
      apellidomaterno: ['', [Validators.maxLength(50)]],
      idtipodoc: ['', Validators.required],
      numerodocidenti: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      nombreusuario: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(30)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      telefono: ['', [Validators.maxLength(9)]],
      direccion: ['', [Validators.maxLength(200)]],
      profileImage: [null, Validators.required],
      rol: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(50)]]
    });
  }

  async ngOnInit() {
    await this.getDataInit();
    console.log("Los roles traidos: ", this.roles);
    console.log("docTypes: ", this.docTypes);
  }

  async getDataInit() {
    this.roles = await lastValueFrom(this.rolesService.getRoles()).then(r => r.map((role: any) => ({ nombreRol: role.nombreRol })));
    this.docTypes = await lastValueFrom(this.masterService.listByPrefijo(4)).then(r =>
      r.data.filter((item: any) => item.correlativo !== 0).map((item: any) => ({ correlativo: item.correlativo, descripcion: item.descripcion }))
    );
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result;
      reader.readAsDataURL(file);
      this.userForm.get('profileImage')?.setValue(file);
      this.userForm.get('profileImage')?.updateValueAndValidity();
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    target.classList.remove('bg-gray-50');
    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result;
      reader.readAsDataURL(file);
      this.userForm.get('profileImage')?.setValue(file);
      this.userForm.get('profileImage')?.updateValueAndValidity();
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    target.classList.add('bg-gray-50');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    target.classList.remove('bg-gray-50');
  }

  onKeyUp(fieldName: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    this.validateField(fieldName, value);
  }

  validateField(fieldName: string, value: string): void {
    const control = this.userForm.get(fieldName);
    if (!control) return;

    const validationRules: { [key: string]: { pattern: RegExp; message: string } } = {
      nombre: { pattern: /^[A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$/, message: 'Solo letras y espacios permitidos.' },
      apellidopaterno: { pattern:  /^[A-Za-zÁÉÍÓÚÑáéíóúñ]+(?: [A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$/, message: 'Solo letras y espacios permitidos.' },
      apellidomaterno: { pattern: /^[a-zA-Z\s]+$/, message: 'Solo letras y espacios permitidos.' },
      numerodocidenti: { pattern: /^[a-zA-Z0-9]+$/, message: 'Solo caracteres alfanuméricos permitidos.' },
      nombreusuario: { pattern: /^[a-zA-Z0-9._-]+$/, message: 'Solo alfanuméricos, puntos, guiones y guiones bajos permitidos.' },
      telefono: { pattern: /^\d{9}$/, message: 'Debe tener exactamente 9 dígitos.' },
      direccion: { pattern: /^[a-zA-Z0-9\s,.-]+$/, message: 'Solo alfanuméricos, espacios y signos comunes permitidos.' },
      password: { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$/, message: 'Mínimo 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial.' }
    };

    const rule = validationRules[fieldName];
    if (rule && value && !rule.pattern.test(value)) {
      control.setErrors({ ...control.errors, pattern: { message: rule.message } });
    } else {
      const errors = { ...control.errors };
      delete errors['pattern'];
      control.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      const formData = new FormData();
      Object.keys(this.userForm.value).forEach(key => {
        if (key === 'profileImage' && this.userForm.value[key] instanceof File) {
          formData.append(key, this.userForm.value[key]);
        } else {
          formData.append(key, this.userForm.value[key]);
        }
      });
      console.log('Form Values:', this.userForm.value);
      console.log('Validation Status:', {
        nombre: this.userForm.get('nombre')?.errors,
        numerodocidenti: this.userForm.get('numerodocidenti')?.errors,
        telefono: this.userForm.get('telefono')?.errors
      });

      this.userService.registerUserInDb(formData).subscribe(
        response => {
          this.successMessage = 'Usuario registrado con éxito.';
          this.errorMessage = null;
          this.isSubmitting = false;
          this.userForm.reset();
          this.imagePreview = null;
        },
        error => {
          this.errorMessage = 'Error al registrar el usuario. Intente de nuevo.';
          this.successMessage = null;
          this.isSubmitting = false;
        }
      );
    } else {
      console.log('Form is invalid. Errors:', this.userForm.errors);
    }
  }
}