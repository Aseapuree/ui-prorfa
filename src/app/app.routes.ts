import { Routes } from '@angular/router';
import { CampusComponent } from './campus/components/modules/campus/campus.component';
import { LayoutComponent } from './general/layout/layout.component';
import { LibrosListadoComponent } from './libreria/components/libros-listado/libros-listado.component';
import { CampusInfoWeekComponent } from './campus/components/modules/weeks/campus-info-week/campus-info-week.component';
import { CampusSesionesComponent } from './campus/components/modules/courses/campus-sesiones/campus-sesiones.component';

export const routes: Routes = [
    {path: '', component: LayoutComponent, children:[
        {path:'campus',component:CampusComponent
            
        },
        { path: 'libreria', component: LibrosListadoComponent},
        { path: 'curso-angular', component: CampusSesionesComponent},
        { path: 'info-week', component: CampusInfoWeekComponent}
    ] },
    
];
