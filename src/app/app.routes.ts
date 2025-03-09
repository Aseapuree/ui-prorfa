import { Routes } from '@angular/router';
import { CampusComponent } from './campus/components/modules/campus/campus.component';
import { LayoutComponent } from './general/layout/layout.component';
import { LibrosListadoComponent } from './libreria/components/libros-listado/libros-listado.component';
import { CampusInfoWeekComponent } from './campus/components/modules/weeks/campus-info-week/campus-info-week.component';
import { CampusSesionesComponent } from './campus/components/modules/gestion/campus-sesiones/campus-sesiones.component';
import { CampusCursosComponent } from './campus/components/modules/gestion/campus-cursos/campus-cursos.component';

export const routes: Routes = [
    {path: '', component: LayoutComponent, children:[
        {path:'campus',component:CampusComponent},
        {path:'cursos', component: CampusCursosComponent},
        { path: 'libreria', component: LibrosListadoComponent},
        { path: 'sesiones/:idProfesorCurso', component: CampusSesionesComponent },
        { path: 'info-week', component: CampusInfoWeekComponent}
    ] },
    
];
