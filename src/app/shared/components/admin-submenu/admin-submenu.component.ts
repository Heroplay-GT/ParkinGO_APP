import { Component, EventEmitter, Output } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-admin-submenu',
  templateUrl: './admin-submenu.component.html',
  styleUrls: ['./admin-submenu.component.scss'],
  standalone:false
})
export class AdminSubmenuComponent {
  @Output() navigate = new EventEmitter<string>();

  constructor(private alertController: AlertController) {}

  async go(route: string) {
    if (route === 'logout') {
      const alert = await this.alertController.create({
        header: 'Cerrar Sesión',
        message: '¿Estás seguro de que deseas cerrar sesión?',
        cssClass: 'custom-alert',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: 'Cerrar Sesión',
            role: 'confirm',
            handler: () => {
              this.navigate.emit(route);
            }
          }
        ]
      });

      await alert.present();
    } else {
      this.navigate.emit(route);
    }
  }
}
