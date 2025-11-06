import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from 'src/app/core/providers/auth/auth';

@Component({
  selector: 'app-index',
  templateUrl: './index.page.html',
  styleUrls: ['./index.page.scss'],
  standalone: false
})
export class IndexPage implements OnInit {

  constructor(
    private readonly auth: Auth,
    private router: Router
  ) { }

  ngOnInit() {
  }

   async doLogOut() {
    await  this.auth.logout();
    this.router.navigate(['/home']);
  }

  async onNav(route: string) {

    switch(route) {
      case 'clientes':
        this.router.navigate(['/']);
        break;
      case 'reportes':
        this.router.navigate(['/']);
        break;
      case 'ingreso':
        this.router.navigate(['/']);
        break;
      case 'retirar':
        this.router.navigate(['/']);
        break;
      case 'config':
        this.router.navigate(['/']);
        break;
      case 'logout':
        await this.doLogOut();
        break;
      default:
        console.log('Unknown nav:', route);
    }
  }
}
