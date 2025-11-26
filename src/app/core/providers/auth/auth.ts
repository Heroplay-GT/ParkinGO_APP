import { Injectable } from '@angular/core';
import {
  Auth as AuthFirebase,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithRedirect,
  getRedirectResult,
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
  ) {
    // Verificar si hay un resultado de redirección pendiente
    this.handleRedirectResult();
  }

  // Register a new user with email and password
  async register(email: string, password: string, phoneNumber: string, name: string): Promise<string> {
    try {
      const response = await createUserWithEmailAndPassword(this.afb, email, password);

      await sendEmailVerification(response.user);

      const userRef = doc(this.db, 'users', response.user.uid);
      await setDoc(userRef, {
        uid: response.user.uid,
        email,
        name,
        phoneNumber,
        role: 'user',
        createdAt: new Date(),
        provider: 'email'
      });

      return response.user.uid;
    } catch (error: any) {
      console.error('Error registering user:', error.message);
      let errorMessage = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      throw new Error(errorMessage);
    }
  }

  // Login an existing user with email and password
  async login(email: string, password: string): Promise<void> {
    try {
      const response = await signInWithEmailAndPassword(
        this.afb,
        email,
        password
      );
      console.log('User logged in successfully:', response);
    } catch (error: any) {
      console.error('Error logging in user:', error.message);
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      }
      throw new Error(errorMessage);
    }
  }

  // Logout the current user
  async logout(): Promise<void> {
    await signOut(this.afb);
  }

  // Login with Google (usando Redirect en lugar de Popup)
  async loginWithGoogle(): Promise<void> {
    try {
      const googleProvider = new GoogleAuthProvider();
      // Redirige al usuario a Google
      await signInWithRedirect(this.afb, googleProvider);
      console.log('Redirecting to Google login...');
    } catch (error: any) {
      console.error('Error initiating Google login:', error.message);
      let errorMessage = 'Google login failed';
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked by browser';
      }
      throw new Error(errorMessage);
    }
  }

  // Manejar el resultado del redirect de Google
  private async handleRedirectResult(): Promise<void> {
    try {
      const result = await getRedirectResult(this.afb);

      if (result) {
        const user = result.user;

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
          console.log('✓ New Google user added to Firestore');
        } else {
          console.log('✓ User already exists in Firestore');
        }

        console.log('✓ User logged in with Google successfully:', user.email);
      }
    } catch (error: any) {
      console.error('Error handling Google redirect:', error.message);
    }
  }
}
