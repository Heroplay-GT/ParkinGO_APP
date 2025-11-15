import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConfigAdminPageRoutingModule } from './config-admin-routing.module';

import { ConfigAdminPage } from './config-admin.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConfigAdminPageRoutingModule
  ],
  declarations: [ConfigAdminPage]
})
export class ConfigAdminPageModule {}
