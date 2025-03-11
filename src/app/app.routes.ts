import { Routes } from '@angular/router';
import { CampusComponent } from './campus/components/modules/campus/campus.component';
import { LayoutComponent } from './general/layout/layout.component';
import { LibrosListadoComponent } from './libreria/components/libros-listado/libros-listado.component';
import { CampusInfoWeekComponent } from './campus/components/modules/weeks/campus-info-week/campus-info-week.component';
import { CampusSesionesComponent } from './campus/components/modules/gestion/campus-sesiones/campus-sesiones.component';
import { CampusCursosComponent } from './campus/components/modules/gestion/campus-cursos/campus-cursos.component';
import { CampusUsuarioComponent } from './campus/components/modules/gestion/campus-usuario/campus-usuario.component';
import { AuthGuard } from './guard/auth.guard';

export const routes: Routes = [
    {path: '', component: LayoutComponent, children:[
        {path:'campus',component:CampusComponent, canActivate: [AuthGuard]},
        {path:'cursos', component: CampusCursosComponent, canActivate: [AuthGuard]},
        {path:'usuarios', component: CampusUsuarioComponent, canActivate: [AuthGuard]},
        { path: 'libreria', component: LibrosListadoComponent, canActivate: [AuthGuard]},
        { path: 'curso-angular', component: CampusSesionesComponent, canActivate: [AuthGuard]},
        { path: 'info-week', component: CampusInfoWeekComponent, canActivate: [AuthGuard]}
    ],canActivate:[AuthGuard] },
    
];
