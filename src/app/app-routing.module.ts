import { UserGuard } from './core/guards/user/user-guard';
import { RoleGuard } from './core/guards/role/role-guard';
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import {
  AuthGuard,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';

const isLogged = () => redirectLoggedInTo(['index']);
const isNotLogged = () => redirectUnauthorizedTo(['login']);

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./pages/pages-users/home/home.module').then(m => m.HomePageModule),
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/pages-users/auth/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/pages-users/auth/register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin-pages/admin/admin.module').then(m => m.AdminPageModule),
    canActivate: [RoleGuard],
  },
  {
    path: 'index',
    loadChildren: () => import('./pages/pages-users/index/index.module').then(m => m.IndexPageModule),
    canActivate: [UserGuard],
  },
  {
    path: 'login-admin',
    loadChildren: () => import('./pages/admin-pages/auth/login-admin/login-admin.module').then(m => m.LoginAdminPageModule)
  },
  {
    path: 'reservations',
    loadChildren: () => import('./pages/pages-users/reservations/reservations.module').then(m => m.ReservationsPageModule),
    canActivate: [UserGuard],
  },
  {
    path: 'not-found',
    loadChildren: () => import('./pages/not-found/not-found.module').then(m => m.NotFoundPageModule)
  },
  {
    path: 'config',
    loadChildren: () => import('./pages/pages-users/config/config.module').then(m => m.ConfigPageModule),
    canActivate: [UserGuard],
  },
  {
    path: 'clients',
    loadChildren: () => import('./pages/admin-pages/clients/clients.module').then(m => m.ClientsPageModule)
  },
  {
    path: 'config-admin',
    loadChildren: () => import('./pages/admin-pages/config-admin/config-admin.module').then(m => m.ConfigAdminPageModule)
  },
  {
    path: 'ingreso',
    loadChildren: () => import('./pages/admin-pages/ingreso/ingreso.module').then(m => m.IngresoPageModule)
  },
  {
    path: 'scan-qr',
    loadChildren: () => import('./pages/admin-pages/scanner/scan-qr/scan-qr.module').then(m => m.ScanQrPageModule)
  },
  {
    path: 'scan-qr-salida',
    loadChildren: () => import('./pages/admin-pages/scanner/scan-qr-salida/scan-qr-salida.module').then( m => m.ScanQrSalidaPageModule)
  },
  {
    path: 'reports',
    loadChildren: () => import('./pages/admin-pages/reports/reports.module').then( m => m.ReportsPageModule)
  },
  {
    path: '**',
    redirectTo: 'not-found',
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
