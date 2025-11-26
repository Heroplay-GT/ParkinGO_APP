import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ScanQrSalidaPageRoutingModule } from './scan-qr-salida-routing.module';

import { ScanQrSalidaPage } from './scan-qr-salida.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScanQrSalidaPageRoutingModule
  ],
  declarations: [ScanQrSalidaPage]
})
export class ScanQrSalidaPageModule {}
