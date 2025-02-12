import { Routes } from '@angular/router';
import { CampusComponent } from './components/modules/campus/campus.component';
import { Sesion1Component } from './components/modules/courses/sesion1/sesion1.component';

export const routes: Routes = [
    {path: '', component: CampusComponent, pathMatch: 'full'},
    { path: 'curso-angular', component: Sesion1Component}
];
