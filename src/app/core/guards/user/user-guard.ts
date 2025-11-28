import { AuthRoleService } from './../../providers/auth-role/auth-role';
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class UserGuard implements CanActivate {

  constructor(
    private router: Router,
    private auth: Auth,
    private AuthRoleService: AuthRoleService
  ) {}

  async canActivate(): Promise<boolean | UrlTree> {
    const user = await this.auth.currentUser;
    if (!user) {
      // No hay sesión → redirigir al login de usuarios
      await this.router.createUrlTree(['/login']);
      return false;
    }

    const role = await this.AuthRoleService.getUserRole();

    if (role === 'user') {
      return true; // ✅ puede acceder a páginas de usuario
    } else {
      // 🚫 es admin → enviarlo al panel admin
      await this.router.createUrlTree(['/admin']);
      return false;
    }
  }
}
