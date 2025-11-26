import { Component, OnInit } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, deleteDoc, doc } from '@angular/fire/firestore';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth as AuthFirebase, EmailAuthProvider, reauthenticateWithCredential } from '@angular/fire/auth';
import { Auth } from 'src/app/core/providers/auth/auth';

@Component({
  selector: 'app-config-admin',
  templateUrl: 'config-admin.page.html',
  styleUrls: ['config-admin.page.scss'],
  standalone: false
})
export class ConfigAdminPage implements OnInit {

  showConfigModal = false;
  showDeleteModal = false;

  adminPassword = '';

  configForm!: FormGroup;

  summary: any = {
    car: { count: 0, price: 0 },
    moto: { count: 0, price: 0 },
    bike: { count: 0, price: 0 }
  };

  constructor(
    private firestore: Firestore,
    private fb: FormBuilder,
    private router: Router,
    private afAuth: AuthFirebase,
    private readonly auth: Auth
  ) { }

  ngOnInit() {
    this.configForm = this.fb.group({
      carCount: [0],
      carPrice: [0],

      motoCount: [0],
      motoPrice: [0],

      bikeCount: [0],
      bikePrice: [0],
    });

    this.loadSummary();
  }

  openCreateConfig() {
    this.showConfigModal = true;
  }

  closeConfig() {
    this.showConfigModal = false;
  }

  openDeleteModal() {
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.adminPassword = '';
  }

  async loadSummary() {
    const snap = await getDocs(collection(this.firestore, 'spaces'));

    this.summary = {
      car: { count: 0, price: 0 },
      moto: { count: 0, price: 0 },
      bike: { count: 0, price: 0 }
    };

    snap.forEach(doc => {
      const data = doc.data() as any;

      if (data.vehicleType === 'Car') {
        this.summary.car.count++;
        this.summary.car.price = data.pricePerHour;
      }
      if (data.vehicleType === 'Motorcycle') {
        this.summary.moto.count++;
        this.summary.moto.price = data.pricePerHour;
      }
      if (data.vehicleType === 'Bicycle') {
        this.summary.bike.count++;
        this.summary.bike.price = data.pricePerHour;
      }
    });
  }

  async generateSpaces(type: string, count: number, price: number) {
    if (!count || count <= 0) return;

    const spacesRef = collection(this.firestore, 'spaces');

    for (let i = 1; i <= count; i++) {
      const code = `${type.toUpperCase().substring(0, 3)}-${i}`;
      await addDoc(spacesRef, {
        code,
        vehicleType: type,
        pricePerHour: price,
        status: 'Available'
      });
    }
  }

  async createSpaces() {
    const { carCount, carPrice, motoCount, motoPrice, bikeCount, bikePrice } = this.configForm.value;

    await this.generateSpaces('Car', carCount, carPrice);
    await this.generateSpaces('Motorcycle', motoCount, motoPrice);
    await this.generateSpaces('Bicycle', bikeCount, bikePrice);

    const toast = document.createElement('ion-toast');
    toast.message = '🚀 Spaces created successfully!';
    toast.duration = 2500;
    toast.color = 'success';
    document.body.appendChild(toast);
    toast.present();

    this.closeConfig();
    await this.loadSummary();
  }

  // 🔥 CONFIRMAR Y BORRAR TODOS LOS ESPACIOS
  async confirmDeleteSpaces() {
    try {
      const currentUser = this.afAuth.currentUser;

      if (!currentUser) {
        alert("No admin logged in");
        return;
      }

      // Reautenticar
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        this.adminPassword
      );

      await reauthenticateWithCredential(currentUser, credential);

      // 🔥 BORRAR TODOS LOS ESPACIOS
      const snap = await getDocs(collection(this.firestore, 'spaces'));

      for (const s of snap.docs) {
        await deleteDoc(doc(this.firestore, 'spaces', s.id));
      }

      const toast = document.createElement('ion-toast');
      toast.message = '🗑 All spaces deleted';
      toast.duration = 2500;
      toast.color = 'danger';
      document.body.appendChild(toast);
      toast.present();

      this.closeDeleteModal();
      await this.loadSummary();
    } catch (error: any) {
      console.error(error);

      const toast = document.createElement('ion-toast');
      toast.message = 'Incorrect password';
      toast.duration = 2500;
      toast.color = 'danger';
      document.body.appendChild(toast);
      toast.present();
    }
  }

  async doLogOut() {
    await this.auth.logout();
    this.router.navigate(['/login-admin']);
  }

  async go(route: string) {

    switch (route) {

      case 'reportes':
        this.router.navigate(['/reports']);
        break;
      case 'ingreso':
        this.router.navigate(['/ingreso']);
        break;
      case 'retirar':
        this.router.navigate(['/admin']);
        break;

      case 'logout':
        await this.doLogOut();
        break;
      default:
        console.log('Unknown nav:', route);
    }
  }

}
