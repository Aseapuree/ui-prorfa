import { Routes } from '@angular/router';
import { CampusComponent } from './campus/components/modules/campus/campus.component';
import { Sesion1Component } from './campus/components/modules/courses/sesion1/sesion1.component';
import { LayoutComponent } from './general/layout/layout.component';

export const routes: Routes = [
    {path: '', component: LayoutComponent, children:[
        {path:'campus',component:CampusComponent}
    ] },
    { path: 'curso-angular', component: Sesion1Component}
];
