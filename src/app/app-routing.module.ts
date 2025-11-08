import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { AuthGuard,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';

const isLogged = () => redirectLoggedInTo(['index']);
const isNotLogged = () => redirectUnauthorizedTo(['login']);

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./pages/pages-users/home/home.module').then( m => m.HomePageModule),

    canActivate: [AuthGuard],
    data: { authGuardPipe: isLogged }
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/pages-users/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/pages-users/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin-pages/admin/admin.module').then( m => m.AdminPageModule)
  },
  {
    path: 'index',
    loadChildren: () => import('./pages/pages-users/index/index.module').then( m => m.IndexPageModule),
    canActivate: [AuthGuard],
    data: { authGuardPipe: isNotLogged }
  },
  {
    path: 'admin-pages',
    loadChildren: () => import('./pages/admin-pages/admin/admin.module').then( m => m.AdminPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/admin-pages/auth/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },





];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
