import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false
})
export class AdminPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  onNav(route: string) {

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

        this.router.navigate(['/login']);
        break;
      default:
        console.log('Unknown nav:', route);
    }
  }

}
