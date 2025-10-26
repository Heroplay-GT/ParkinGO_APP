import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ButtonComponent } from './button/button.component';
import { HeaderComponent } from './header/header.component';
import { InputComponent } from './input/input.component';
import { LinkComponent } from './link/link.component';

@NgModule({
  declarations: [
    ButtonComponent,
    HeaderComponent,
    InputComponent,
    LinkComponent
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
  exports: [ButtonComponent, HeaderComponent, InputComponent, LinkComponent]
})
export class ComponentsModule {}
