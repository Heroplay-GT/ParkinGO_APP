import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth } from 'src/app/core/providers/auth/auth';
import { Firestore, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { updateEmail, updatePassword, deleteUser } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-config',
  templateUrl: './config.page.html',
  styleUrls: ['./config.page.scss'],
  standalone: false
})
export class ConfigPage implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  activeModal: 'info' | 'password' | 'delete' | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  async ngOnInit() {
    const user = await this.auth['afb'].currentUser;

    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: [user?.email || '', [Validators.required, Validators.email]],
      phone: ['']
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  openModal(type: 'info' | 'password' | 'delete') {
    this.activeModal = type;
  }

  closeModal() {
    this.activeModal = null;
  }

  async updateProfile() {
    const user = await this.auth['afb'].currentUser;
    if (!user) return;

    try {
      const { name, email, phone } = this.profileForm.value;
      if (email && email !== user.email) await updateEmail(user, email);
      await updateDoc(doc(this.firestore, 'users', user.uid), { name, email, phone });

      this.showToast('✅ Profile updated successfully', 'success');
      this.closeModal();
    } catch (err) {
      console.error('Error updating profile:', err);
      this.showToast('⚠️ Error updating profile', 'danger');
    }
  }

  async updatePassword() {
    const user = await this.auth['afb'].currentUser;
    if (!user) return;

    try {
      await updatePassword(user, this.passwordForm.value.newPassword);
      this.showToast('🔑 Password updated', 'success');
      this.passwordForm.reset();
      this.closeModal();
    } catch (err) {
      console.error('Error updating password:', err);
      this.showToast('⚠️ Error updating password', 'danger');
    }
  }

  async deleteAccount() {
    const user = await this.auth['afb'].currentUser;
    if (!user) return;

    try {
      await deleteDoc(doc(this.firestore, 'users', user.uid));
      await deleteUser(user);
      this.showToast('❌ Account deleted', 'danger');
      this.closeModal();
      this.router.navigate(['/home']);
    } catch (err) {
      console.error('Error deleting account:', err);
      this.showToast('⚠️ Could not delete account', 'danger');
    }
  }

  showToast(message: string, color: string) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2500;
    toast.color = color;
    document.body.appendChild(toast);
    toast.present();
  }

  async doLogOut() {
    await this.auth.logout();
    this.router.navigate(['/home']);
  }


  async go(route: string) {

    switch (route) {
      case 'index':
        this.router.navigate(['/index']);
        break;
      case 'reservations':
        this.router.navigate(['/reservations']);
        break;

      case 'logout':
        await this.doLogOut();
        break;
      default:
        console.log('Unknown nav:', route);
    }
  }
}
