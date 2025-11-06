import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { environment } from 'src/environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { Auth } from './providers/auth/auth';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
  ]
  , providers: [
    provideFirebaseApp(() => initializeApp(environment.FIREBASE_APP)),
    provideAuth(() => getAuth()),
    Auth
    ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule?: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded.');
    }
  }
 }
