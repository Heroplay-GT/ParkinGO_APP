import { AuthRoleService } from './../../providers/auth-role/auth-role';
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private router: Router,
    private auth: Auth,
    private AuthRoleService: AuthRoleService
  ) {}

  async canActivate(): Promise<boolean | UrlTree> {
    const user = await this.auth.currentUser;
    if (!user) {
      // No hay sesión → redirigir al login de admin
      await this.router.createUrlTree(['/login-admin']);
      return false;
    }

    const role = await this.AuthRoleService.getUserRole();

    if (role === 'admin') {
      return true; // ✅ puede acceder al panel admin
    } else {
      // 🚫 no es admin → enviarlo a home de usuarios
      await this.router.createUrlTree(['/home']);
      return false;
    }
  }
}
