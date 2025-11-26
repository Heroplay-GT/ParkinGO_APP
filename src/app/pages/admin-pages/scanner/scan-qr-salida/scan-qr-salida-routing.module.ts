import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ScanQrSalidaPage } from './scan-qr-salida.page';

const routes: Routes = [
  {
    path: '',
    component: ScanQrSalidaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScanQrSalidaPageRoutingModule {}
