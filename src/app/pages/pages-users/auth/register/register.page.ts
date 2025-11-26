import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from 'src/app/core/providers/auth/auth';
import { Query } from 'src/app/core/providers/query/query';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;
  logoExists: boolean = true;

  constructor(
    private router: Router,
    private readonly authSrv: Auth,
    private readonly querySrv: Query
  ) {

  }

  ngOnInit() {
    this.registerForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(3)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', Validators.required),
      phoneNumber: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10}$')]),

    });
  }

  onLogoError() {
    this.logoExists = false;
  }

  onLogoLoad() {
    this.logoExists = true;
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.showToast('Please fill all fields correctly', 'warning');
      return;
    }

    const { password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.showToast('Passwords do not match', 'warning');
      return;
    }

    try {
      const uid = await this.authSrv.register(
        this.registerForm.value.email,
        this.registerForm.value.password,
        this.registerForm.value.phoneNumber,
        this.registerForm.value.name,
      );

      this.showToast('Registration successful! Please verify your email.', 'success');
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Registration error:', error);
      this.showToast(error.message || 'Registration failed', 'danger');
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  showToast(message: string, color: string) {
    const toast: any = document.createElement('ion-toast');
    toast.message = message;
    toast.color = color;
    toast.duration = 3000;
    toast.position = 'top';
    document.body.appendChild(toast);
    toast.present();
  }
}
