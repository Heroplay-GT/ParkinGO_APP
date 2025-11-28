import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from 'src/app/core/providers/auth/auth';
import { AuthRoleService } from 'src/app/core/providers/auth-role/auth-role';


@Component({
  selector: 'app-login-admin',
  templateUrl: './login-admin.page.html',
  styleUrls: ['./login-admin.page.scss'],
  standalone: false
})
export class LoginAdminPage implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string = '';
  logoExists: boolean = true;

  constructor(
    private router: Router,
    private readonly authSrv: Auth,
    private readonly authRoleSrv: AuthRoleService
  ) { }

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required)
    });
  }

  onLogoError() {
    this.logoExists = false;
  }

  onLogoLoad() {
    this.logoExists = true;
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.showToast('⚠️ Please enter valid email and password', 'warning');
      return;
    }

    try {
      await this.authSrv.login(this.loginForm.value.email, this.loginForm.value.password);
      
      // Verificar rol de admin
      const role = await this.authRoleSrv.getUserRole();
      
      if (role === 'admin') {
        this.showToast('✅ Login successful', 'success');
        this.router.navigate(['/admin']);
      } else {
        await this.authSrv.logout();
        this.showToast('❌ Invalid credentials', 'danger');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        this.showToast('❌ Invalid email or password', 'danger');
      } else if (error.code === 'auth/invalid-email') {
        this.showToast('⚠️ Invalid email format', 'warning');
      } else {
        this.showToast('❌ Login failed', 'danger');
      }
    }
  }

  showToast(message: string, color: string) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2500;
    toast.color = color;
    document.body.appendChild(toast);
    toast.present();
  }

   ionViewWillLeave() {
    this.loginForm.reset();
  }

}
