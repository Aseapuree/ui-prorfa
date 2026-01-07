import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../../campus/services/usuario.service';
import { DTOUsuarioService } from '../../Services/dtousuario.service';
import { lastValueFrom } from 'rxjs';
import { DTOrolesService } from '../../Services/dtoroles.service';
import { DTORoles } from '../../interfaces/DTORoles';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit {
  perfilForm!: FormGroup;
  imagenPrevia: string | ArrayBuffer | null = null;
  selectedImage: File | null = null;
  errorMessage: string | null = null;
  selectedRole: string = 'Alumno'; // Valor por defecto
  entidadLogo: string = 'https://via.placeholder.com/60?text=Logo'; // Placeholder para el logo
  cursosList: string[] = []; // Lista para cursos
  aulasList: string[] = []; // Lista para aulas




  @ViewChild('fileInput') fileInput!: ElementRef;

  // Mapeo de tb_rol_pk_id a tb_rol_nombre_rol
  private roleMap: { [key: string]: string } = {
    '6e9f12bd-08fb-4f30-bc86-f810a5a2b927': 'Administrador',
    'ffa9fee1-fbba-4f1f-8a65-5833ef19306e': 'Alumno',
    '1acbfee1-78dc-4b9a-944b-7ef656186829': 'Profesor',
    '07c8f96d-d127-41fa-98fb-7af4e4711597': 'Tesorero',
    'e4e91e6b-0f36-440a-8d64-1108a2a5dc33': 'Desarrollador',
  };

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object,
    private usuarioService:DTOUsuarioService,
    private roleService:DTOrolesService
  ) {
    // Inicializar el formulario en el constructor
    this.initializeForm();
  }


  roles:DTORoles[]=[];

  async ngOnInit() {

    try {
      // Intentar obtener el rol desde localStorage solo en el navegador
      if (isPlatformBrowser(this.platformId)) {
        await this.getUserAndRoles();
        const roleId = localStorage.getItem('rol');
        // this.selectedRole=this.roles.find(r=>
        //   r.idRol==roleId

        // )?.idRol ?? "";
        this.selectedRole = roleId && this.roleMap[roleId] ? this.roleMap[roleId] : 'Alumno';
        console.log("EL rol: ",this.selectedRole)
      }
      // Actualizar el formulario con los datos del rol
      this.updateRole();
    } catch (error) {
      console.error('Error al inicializar el rol:', error);
      this.selectedRole = 'Alumno';
      this.updateRole();
    }
  }


  async getUserAndRoles(){
    
    let iduser= localStorage.getItem("IDUSER") ?? "";
    let user= await lastValueFrom(this.usuarioService.getUsuario(iduser));
     console.log("El usuario extraido: ",user)
     this.roles =await lastValueFrom(this.roleService.getRoles());
     console.log("Los roles extraidos: ",this.roles)
    
  }

  initializeForm(): void {
    this.perfilForm = this.fb.group({
      nombreCompleto: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.minLength(6)]],
      imagen: [null],
      codigoMatricula: [{ value: '', disabled: this.selectedRole === 'Alumno' }],
      grado: [{ value: '', disabled: this.selectedRole === 'Alumno' }],
      seccion: [{ value: '', disabled: this.selectedRole === 'Alumno' }],
      nivel: [{ value: '', disabled: this.selectedRole === 'Alumno' }],
      direccion: [{ value: '', disabled: this.selectedRole === 'Alumno' }],
      apoderadoNombre: [{ value: '', disabled: this.selectedRole === 'Alumno' }],
      apoderadoTelefono: [{ value: '', disabled: this.selectedRole === 'Alumno' }],
      apoderadoCorreo: [{ value: '', disabled: this.selectedRole === 'Alumno' }, [Validators.email]],
      fechaMatricula: [{ value: '', disabled: this.selectedRole === 'Alumno' }],
      rol: [{ value: '', disabled: true }],
      telefono: [{ value: '', disabled: true }],
      cursos: [{ value: '', disabled: true }],
      aulas: [{ value: '', disabled: true }],
      nombreColegio: [{ value: '', disabled: true }],
      direccionColegio: [{ value: '', disabled: true }],
      rucColegio: [{ value: '', disabled: true }],
      telefonoColegio: [{ value: '', disabled: true }],
      correoColegio: [{ value: '', disabled: true }],
      codigoAlumno: [{ value: '', disabled: true }],
      totalPagosRecibidos: [{ value: '', disabled: true }],
      codigoPago: [{ value: '', disabled: true }],
      totalProfesores: [{ value: '', disabled: true }],
      totalCursos: [{ value: '', disabled: true }],
      totalAlumnos: [{ value: '', disabled: true }],
    });
  }

  updateRole(): void {
    console.log('Actualizando rol:', this.selectedRole); // Depuración
    // Simular datos según el rol (en un sistema real, esto vendría del backend)
    const mockData: { [key: string]: any } = {
      Alumno: {
        nombreCompleto: 'Juan Pérez Gómez',
        correo: 'juan.perez@estudiante.edu',
        codigoMatricula: 'MAT-2025-001',
        grado: '5to',
        seccion: 'A',
        nivel: 'Secundaria',
        direccion: 'Av. Principal 123, Lima',
        apoderadoNombre: 'María Gómez López',
        apoderadoTelefono: '987654321',
        apoderadoCorreo: 'maria.gomez@padres.edu',
        fechaMatricula: '2025-03-01',
        rol: 'Alumno',
      },
      Profesor: {
        nombreCompleto: 'Ana López Martínez',
        correo: 'ana.lopez@profesor.edu',
        rol: 'Profesor',
        telefono: '987654321',
        direccion: 'Calle Los Maestros 789, Lima',
        cursos: [
          'Matemáticas - 4to A',
          'Ciencias - 4to A',
          'Matemáticas - 5to B',
          'Física - 5to B',
          'Química - 6to A',
          'Biología - 6to A',
        ],
        aulas: [
          '4to A - Secundaria',
          '4to A - Secundaria',
          '5to B - Secundaria',
          '5to B - Secundaria',
          '6to A - Secundaria',
          '6to A - Secundaria',
        ],
      },
      Administrador: {
        nombreCompleto: 'Carlos Ramírez Torres',
        correo: 'carlos.ramirez@admin.edu',
        rol: 'Administrador',
        totalProfesores: '50',
        totalCursos: '30',
        totalAlumnos: '1200',
      },
      Tesorero: {
        nombreCompleto: 'Laura Fernández Díaz',
        correo: 'laura.fernandez@tesorero.edu',
        rol: 'Tesorero',
        telefono: '912345678',
        direccion: 'Av. Finanzas 456, Lima',
        codigoMatricula: 'MAT-2025-001',
        codigoAlumno: 'ALU-2025-001',
        totalPagosRecibidos: '45000.00 PEN',
        codigoPago: 'PAG-2025-001',
      },
      Desarrollador: {
        nombreCompleto: 'Miguel Torres Vargas',
        correo: 'miguel.torres@dev.edu',
        rol: 'Desarrollador',
        nombreColegio: 'Colegio San Juan',
        direccionColegio: 'Calle Educación 456, Lima',
        rucColegio: '20512345678',
        telefonoColegio: '012345678',
        correoColegio: 'contacto@sanjuan.edu',
      },
    };

    // Actualizar estado de los campos según el rol
    if (this.selectedRole === 'Alumno') {
      Object.keys(this.perfilForm.controls).forEach(key => {
        if (key !== 'nombreCompleto' && key !== 'correo' && key !== 'contrasena' && key !== 'imagen') {
          this.perfilForm.get(key)?.disable();
        }
      });
    } else {
      Object.keys(this.perfilForm.controls).forEach(key => {
        if (key !== 'nombreCompleto' && key !== 'correo' && key !== 'contrasena' && key !== 'imagen') {
          this.perfilForm.get(key)?.disable();
        } else {
          this.perfilForm.get(key)?.enable();
        }
      });
    }

    const roleData = mockData[this.selectedRole] || mockData['Alumno'];
    console.log('Datos aplicados al formulario:', roleData); // Depuración
    this.perfilForm.patchValue(roleData);

    // Actualizar listas de cursos y aulas para el rol Profesor
    if (this.selectedRole === 'Profesor') {
      this.cursosList = roleData.cursos || [];
      this.aulasList = roleData.aulas || [];
    } else {
      this.cursosList = [];
      this.aulasList = [];
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'La imagen no debe exceder los 5MB.';
        return;
      }
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Por favor, selecciona una imagen válida.';
        return;
      }

      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPrevia = reader.result;
        this.errorMessage = null;
      };
      reader.readAsDataURL(file);
    }
  }

  guardarPerfil(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    if (this.selectedRole === 'Alumno') {
      this.errorMessage = 'Los alumnos no pueden modificar su perfil.';
      return;
    }

    const formData = new FormData();
    formData.append('nombreCompleto', this.perfilForm.get('nombreCompleto')?.value || '');
    formData.append('correo', this.perfilForm.get('correo')?.value || '');
    const contrasena = this.perfilForm.get('contrasena')?.value;
    if (contrasena) {
      formData.append('contrasena', contrasena);
    }
    if (this.selectedImage) {
      formData.append('imagen', this.selectedImage);
    }

    console.log('Datos enviados:', formData);
    this.errorMessage = null;
  }
}