import { Routes } from '@angular/router';
import { PrincipalComponent } from './general/principal/principal.component';
import { CampusComponent } from './campus/components/modules/campus/campus.component';
import { Sesion1Component } from './campus/components/modules/courses/sesion1/sesion1.component';

export const routes: Routes = [
    {path: '', component: PrincipalComponent },
    {path: 'campus', component: CampusComponent},
    { path: 'curso-angular', component: Sesion1Component}
];
