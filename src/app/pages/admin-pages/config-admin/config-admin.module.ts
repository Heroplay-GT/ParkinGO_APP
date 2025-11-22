import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConfigAdminPageRoutingModule } from './config-admin-routing.module';

import { ConfigAdminPage } from './config-admin.page';
import { ComponentsModule } from 'src/app/shared/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConfigAdminPageRoutingModule,
    ComponentsModule,
    ReactiveFormsModule
],
  declarations: [ConfigAdminPage]
})
export class ConfigAdminPageModule {}
