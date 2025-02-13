import { Routes } from '@angular/router';
import { PrincipalComponent } from './general/principal/principal.component';
import { LibrosComponent } from './libreria/components/libros-listado/libros-listado.component';


export const routes: Routes = [
    { path: '', component: PrincipalComponent},
    { path: 'libreria', component: LibrosComponent}

];
