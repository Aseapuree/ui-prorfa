import { Routes } from '@angular/router';
import { CampusComponent } from './campus/components/modules/campus/campus.component';
import { LayoutComponent } from './general/components/layout/layout.component';
import { LibrosListadoComponent } from './libreria/components/libros-listado/libros-listado.component';
import { CampusSesionesComponent } from './campus/components/modules/gestion/campus-sesiones/campus-sesiones.component';
import { CampusCursosComponent } from './campus/components/modules/gestion/campus-cursos/campus-cursos.component';
import { CampusActividadesComponent } from './campus/components/modules/gestion/campus-actividades/campus-actividades.component';
import { CampusAlumnoComponent } from './campus/components/modules/campus-alumno/campus-alumno/campus-alumno.component';
import { SesionesAlumnoComponent } from './campus/components/modules/campus-alumno/sesiones-alumno/sesiones-alumno.component';
import { ActividadesAlumnoComponent } from './campus/components/modules/campus-alumno/actividades-alumno/actividades-alumno.component';
import { AuthGuard } from './guard/auth.guard';
import { PerfilComponent } from './general/components/perfil/perfil.component';
import { MatriculasComponent } from'./matricula/components/matriculas/matriculas.component';
import { RegistrarMatriculaComponent } from './matricula/components/registrarmatricula/registrarmatricula.component';
import { ComprobanteComponent } from './matricula/components/comprobantes/comprobantes.component';
import { MatriculadosComponent } from './matricula/components/matriculados/matriculados.component';

export const routes: Routes = [
    {path: '', component: LayoutComponent, children:[
        {path:'campus',component:CampusComponent, canActivate: [AuthGuard]},// Campus profesor
        {path:'cursos', component: CampusCursosComponent, canActivate: [AuthGuard]},
        {path: 'campus-alumno',component:CampusAlumnoComponent,canActivate: [AuthGuard]},//campus alumno
        { path: 'sesiones/:idProfesorCurso', component: CampusSesionesComponent,canActivate: [AuthGuard] },// Campus sesiones profesor
        { path: 'card-actividades/:idSesion', component: CampusActividadesComponent,canActivate: [AuthGuard] }, // Campus actividades profesor
        { path: 'sesiones-alumno/:idProfesorCurso', component: SesionesAlumnoComponent,canActivate: [AuthGuard]},//campus sesiones alumno
        { path: 'actividades/:idSesion', component: ActividadesAlumnoComponent,canActivate: [AuthGuard]},//campus actividades alumno
        { path: 'libreria', component: LibrosListadoComponent, canActivate: [AuthGuard]},
        {path:'perfil',component: PerfilComponent,canActivate:[AuthGuard]},
        {path:'matricula/:id', component: MatriculasComponent,canActivate:[AuthGuard]},
        {path:'registrarmatricula', component: RegistrarMatriculaComponent,canActivate:[AuthGuard]},
        {path:'matriculas/primaria', component: MatriculasComponent,canActivate:[AuthGuard]},
        {path:'matriculas/secundaria', component: MatriculasComponent,canActivate:[AuthGuard]},
        {path:'registrarmatricula', component: RegistrarMatriculaComponent,canActivate:[AuthGuard]},
        {path:'comprobantes', component: ComprobanteComponent,canActivate:[AuthGuard]},
        {path:'matriculados', component: MatriculadosComponent,canActivate:[AuthGuard]},
    ],canActivate:[AuthGuard] },

];
