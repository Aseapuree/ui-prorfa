import { Routes } from '@angular/router';
import { CampusComponent } from './components/modules/campus/campus.component';
import { Sesion1Component } from './components/modules/courses/sesion1/sesion1.component';
import { LayoutComponent } from './general/layout/layout.component';
import { LibrosListadoComponent } from './libreria/components/libros-listado/libros-listado.component';

export const routes: Routes = [
    {path: '', component: LayoutComponent, children:[
        {path:'campus',component:CampusComponent
            
        },
        { path: 'libreria', component: LibrosListadoComponent}
    ] },
    { path: 'curso-angular', component: Sesion1Component}
];
