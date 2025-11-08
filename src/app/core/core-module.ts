import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { environment } from 'src/environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { Auth } from './providers/auth/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore'
import { Query } from './providers/query/query';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
  ]
  , providers: [
    provideFirebaseApp(() => initializeApp(environment.FIREBASE_APP)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    Auth,
    Query
    ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule?: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded.');
    }
  }
 }
