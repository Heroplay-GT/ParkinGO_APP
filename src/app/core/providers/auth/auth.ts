import { Injectable } from '@angular/core';
import {
  Auth as AuthFirebase,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
} from '@angular/fire/auth';
import {
  doc,
  Firestore,
  setDoc,
  getDoc
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  constructor(
    private readonly afb: AuthFirebase,
    private readonly db: Firestore
  ) { }

  // Register a new user with email and password
  async register(email: string, password: string): Promise<string> {
    try {
      const response = await createUserWithEmailAndPassword(
        this.afb,
        email,
        password);
      // Send email verification
      await sendEmailVerification(response.user);

      console.log('User registered successfully:', response);
      return response.user.uid;
    } catch (error) {
      console.error('Error registering user:', (error as any).message);
      throw error;
    }
  }

  // login an existing user with email and password
  async login(email: string, password: string): Promise<void> {
    try {
      const response = await signInWithEmailAndPassword(
        this.afb,
        email,
        password);
      console.log('User logged in successfully:', response);
    } catch (error) {
      console.error('Error logging in user:', (error as any).message);
    }
  }

  // logout the current user
  async logout(): Promise<void> {
    await signOut(this.afb);
  }

  // login with Google
  async loginWithGoogle(): Promise<void> {
    try {
      const googleProvider = new GoogleAuthProvider();
      const response = await signInWithPopup(this.afb, googleProvider);
      const user = response.user;

      const userRef = doc(this.db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: 'user',
          createdAt: new Date(),
          provider: 'google'
        });
        console.log(' New Google user added to Firestore');
      } else {
        console.log(' User already exists in Firestore');
      }

      console.log('User logged in with Google successfully:', response);

    } catch (error) {
      console.error('Error logging in with Google:', (error as any).message);
    }
  }

}
