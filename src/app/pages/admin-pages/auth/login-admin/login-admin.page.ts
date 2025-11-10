import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from 'src/app/core/providers/auth/auth';
import { Query } from 'src/app/core/providers/query/query';


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
    private readonly querySrv: Query
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
    if (this.loginForm.invalid) return;

    await this.authSrv.login(this.loginForm.value.email, this.loginForm.value.password);

    this.router.navigate(['/admin']);
  }

   ionViewWillLeave() {
    this.loginForm.reset();
  }

}
