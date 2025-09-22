import { Routes } from '@angular/router';
import { CampusComponent } from './campus/components/modules/campus/campus.component';
import { LayoutComponent } from './general/components/layout/layout.component';
import { LibrosListadoComponent } from './libreria/components/libros-listado/libros-listado.component';
import { CampusSesionesComponent } from './campus/components/modules/gestion/campus-sesiones/campus-sesiones.component';
import { CampusCursosComponent } from './campus/components/modules/gestion/campus-cursos/campus-cursos.component';
import { CampusActividadesComponent } from './campus/components/modules/gestion/campus-actividades/campus-actividades.component';
import { AuthGuard } from './core/guard/auth.guard';
import { PerfilComponent} from './general/components/perfil/perfil.component';
import { MatriculasComponent } from'./matricula/components/matriculas/matriculas.component';
import { RegistrarMatriculaComponent } from './matricula/components/registrarmatricula/registrarmatricula.component';
import { ComprobanteComponent } from './matricula/components/comprobantes/comprobantes.component';
import { MatriculadosComponent } from './matricula/components/matriculados/matriculados.component';
import { InicioComponent } from './general/components/inicio/inicio.component';
import { AsistenciaComponent } from './general/components/asistencia/asistencia.component';
import { CampusGradosComponent } from './campus/components/modules/campus-grados/campus-grados.component';
import { ProfesorCursoComponent } from './campus/components/modules/gestion/profesor-curso/profesor-curso.component';
import { NotasGeneralesComponent } from './general/components/notas-generales/notas-generales.component';
import { CampusVistaComponent } from './general/components/campus-vista/campus-vista.component';
import { AdminUsersComponent } from './general/components/admin-users/admin-users.component';
import { NotasBimestralesComponent } from './matricula/components/notas-bimestrales/notas-bimestrales.component';
import { ListaAlumnosComponent } from './matricula/components/lista-alumnos/lista-alumnos.component';
import { EntidadComponent } from './matricula/components/entidad/entidad.component';

export const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
          { path: 'campus', component: CampusComponent, canActivate: [AuthGuard] },
          { path: 'campus/grados/:nivel', component: CampusGradosComponent, canActivate: [AuthGuard] },
          { path: 'gestion/cursos', component: CampusCursosComponent, canActivate: [AuthGuard] },
          { path: 'gestion/profesor-curso', component: ProfesorCursoComponent, canActivate: [AuthGuard] },
          { path: 'sesiones/profesor/:idProfesorCurso', component: CampusSesionesComponent, canActivate: [AuthGuard] },
          { path: 'sesiones/alumno/:idCurso', component: CampusSesionesComponent, canActivate: [AuthGuard] },
          { path: 'card-actividades/:idSesion', component: CampusActividadesComponent, canActivate: [AuthGuard] },
          { path: 'libreria', component: LibrosListadoComponent, canActivate: [AuthGuard] },
          { path: 'perfil', component: PerfilComponent, canActivate: [AuthGuard] },
          { path: 'inicio', component: InicioComponent, canActivate: [AuthGuard] },
          { path: 'asistencia', component: AsistenciaComponent, canActivate: [AuthGuard] },
          { path: 'asistencias/profesor/:idProfesorCurso/:idSesion', component: AsistenciaComponent, canActivate: [AuthGuard] },
          { path: 'asistencias/alumno/:idCurso/:idSesion', component: AsistenciaComponent, canActivate: [AuthGuard] },
          { path: 'matricula/:id', component: MatriculasComponent, canActivate: [AuthGuard] },
          { path: 'registrarmatricula', component: RegistrarMatriculaComponent, canActivate: [AuthGuard] },
          { path: 'matriculas/primaria', component: MatriculasComponent, canActivate: [AuthGuard] },
          { path: 'matriculas/secundaria', component: MatriculasComponent, canActivate: [AuthGuard] },
          { path: 'comprobantes', component: ComprobanteComponent, canActivate: [AuthGuard] },
          { path: 'matriculados', component: MatriculadosComponent, canActivate: [AuthGuard] },
          { path: 'users', component: AdminUsersComponent, canActivate: [AuthGuard] },
          {path:'notas',component:NotasGeneralesComponent,canActivate:[AuthGuard]},
          { path: 'campus-vista', component: CampusVistaComponent, canActivate: [AuthGuard] },
          { path: 'capp-notas-bimestrales', component: NotasBimestralesComponent, canActivate: [AuthGuard] },
          { path: 'app-lista-alumnos', component: ListaAlumnosComponent, canActivate: [AuthGuard] },
          //{ path: 'comprobante/:type/:idMatricula', component: ComprobanteComponent, canActivate: [AuthGuard] },
          {path:'entidad',component:EntidadComponent,canActivate:[AuthGuard]},

        ],
        canActivate: [AuthGuard]
      }

];
