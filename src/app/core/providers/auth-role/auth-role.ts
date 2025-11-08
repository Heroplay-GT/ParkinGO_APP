import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthRoleService {
  constructor(private afAuth: Auth, private firestore: Firestore) {}

  async getUserRole(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    if (!user) return null;

    const userRef = doc(this.firestore, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return data['role'] || null;
    }

    return null;
  }
}
