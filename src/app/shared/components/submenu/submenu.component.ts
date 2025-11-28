import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { IonIcon } from "@ionic/angular/standalone";
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-submenu',
  templateUrl: './submenu.component.html',
  styleUrls: ['./submenu.component.scss'],
  standalone: false,
})
export class SubmenuComponent  implements OnInit {

  constructor(private alertController: AlertController) { }

  ngOnInit() {}

  @Output() navigate = new EventEmitter<string>();

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
