import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IngresoPageRoutingModule } from './ingreso-routing.module';

import { IngresoPage } from './ingreso.page';
import { ComponentsModule } from 'src/app/shared/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    IngresoPageRoutingModule,
    ComponentsModule
  ],
  declarations: [IngresoPage]
})
export class IngresoPageModule {}
