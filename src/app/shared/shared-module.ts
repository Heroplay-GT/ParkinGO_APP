import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ComponentsModule } from './components/components.module';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, ComponentsModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, ComponentsModule]
})
export class SharedModule {}
