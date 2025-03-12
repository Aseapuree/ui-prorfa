import { Routes } from '@angular/router';
import { CampusComponent } from './campus/components/modules/campus/campus.component';
import { LayoutComponent } from './general/layout/layout.component';
import { LibrosListadoComponent } from './libreria/components/libros-listado/libros-listado.component';
import { CampusSesionesComponent } from './campus/components/modules/gestion/campus-sesiones/campus-sesiones.component';
import { CampusCursosComponent } from './campus/components/modules/gestion/campus-cursos/campus-cursos.component';
import { CampusActividadesComponent } from './campus/components/modules/gestion/campus-actividades/campus-actividades.component';
import { CampusAlumnoComponent } from './campus/components/modules/campus-alumno/campus-alumno/campus-alumno.component';
import { SesionesAlumnoComponent } from './campus/components/modules/campus-alumno/sesiones-alumno/sesiones-alumno.component';
import { ActividadesAlumnoComponent } from './campus/components/modules/campus-alumno/actividades-alumno/actividades-alumno.component';

export const routes: Routes = [
    {path: '', component: LayoutComponent, children:[
        {path:'campus',component:CampusComponent},// Campus profesor
        {path: 'campus-alumno',component:CampusAlumnoComponent},//campus alumno
        {path:'cursos', component: CampusCursosComponent},
        { path: 'libreria', component: LibrosListadoComponent},
        { path: 'sesiones/:idProfesorCurso', component: CampusSesionesComponent },// Campus profesor
        { path: 'sesiones-alumno/:idProfesorCurso', component: SesionesAlumnoComponent},//campus alumno
        { path: 'card-actividades/:idSesion', component: CampusActividadesComponent }, // Campus profesor
        { path: 'actividades/:idSesion', component: ActividadesAlumnoComponent}//campus alumno
    ] },
    
];
