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
import { PrimariaComponent } from './matricula/primaria/primaria.component';
import { SecundariaComponent } from './matricula/secundaria/secundaria.component';
import { RegistrarMatriculaComponent } from './matricula/registrarmatricula/registrarmatricula.component';

export const routes: Routes = [
    {path: '', component: LayoutComponent, children:[
        {path:'campus',component:CampusComponent, canActivate: [AuthGuard]},
        {path:'cursos', component: CampusCursosComponent, canActivate: [AuthGuard]},
        // {path:'usuarios', component: CampusUsuarioComponent, canActivate: [AuthGuard]},
        { path: 'libreria', component: LibrosListadoComponent, canActivate: [AuthGuard]},
        { path: 'curso-angular', component: CampusSesionesComponent, canActivate: [AuthGuard]},
        {path:'perfil',component: PerfilComponent,canActivate:[AuthGuard]},
        // { path: 'info-week', component: CampusInfoWeekComponent, canActivate: [AuthGuard]},
        {path:'primaria', component: PrimariaComponent},
        {path:'secundaria', component: SecundariaComponent},
        { path: 'registrarmatricula', component: RegistrarMatriculaComponent }
    ],canActivate:[AuthGuard] },

];
