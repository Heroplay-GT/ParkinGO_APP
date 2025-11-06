import { Injectable } from '@angular/core';
import { Auth as AuthFirebase,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    signInWithPopup,
    GoogleAuthProvider
  } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  constructor(private readonly afb: AuthFirebase) { }

  // Register a new user with email and password
  async register(email: string, password: string): Promise<void> {
    try {
      const response = await createUserWithEmailAndPassword(
        this.afb,
        email,
        password);
        console.log('User registered successfully:', response);
    } catch (error) {
      console.error('Error registering user:', (error as any).message);
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
      console.log('User logged in with Google successfully:', response);
    } catch (error) {
      console.error('Error logging in with Google:', (error as any).message);
    }
  }

}
