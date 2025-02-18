import { Routes } from '@angular/router';
import { PrincipalComponent } from './general/principal/principal.component';
import { LibrosListadoComponent } from './libreria/components/libros-listado/libros-listado.component';


export const routes: Routes = [
    { path: '', component: PrincipalComponent},
    { path: 'libreria', component: LibrosListadoComponent}

];
