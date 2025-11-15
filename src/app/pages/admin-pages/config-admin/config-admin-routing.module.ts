import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfigAdminPage } from './config-admin.page';

const routes: Routes = [
  {
    path: '',
    component: ConfigAdminPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfigAdminPageRoutingModule {}
