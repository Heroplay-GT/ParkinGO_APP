import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LoginAdminPageRoutingModule } from './login-admin-routing.module';

import { LoginAdminPage } from './login-admin.page';
import { ComponentsModule } from "src/app/shared/components/components.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoginAdminPageRoutingModule,
    ComponentsModule,
    ReactiveFormsModule
],
  declarations: [LoginAdminPage]
})
export class LoginAdminPageModule {}
