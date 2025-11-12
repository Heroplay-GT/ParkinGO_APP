import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, getDocs, query, where, addDoc, doc, updateDoc } from '@angular/fire/firestore';
import { Auth } from 'src/app/core/providers/auth/auth';
import { Router } from '@angular/router';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-reservations',
  templateUrl: './reservations.page.html',
  styleUrls: ['./reservations.page.scss'],
  standalone: false
})
export class ReservationsPage implements OnInit {
  reservaForm!: FormGroup;
  vehicleTypes = ['Car', 'Motorcycle', 'Bicycle'];
  availableSpaces: any[] = [];
  selectedSpace: any = null;
  pricePerHour = 0;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) { }

  ngOnInit() {
    this.reservaForm = this.fb.group({
      vehicleType: ['', Validators.required],
      plate: ['', Validators.required],
      model: ['', Validators.required],
      space: ['', Validators.required],
    });
  }

  // Load available spaces by vehicle type
  async updateType() {
    const type = this.reservaForm.get('vehicleType')?.value;
    if (!type) return;

    const q = query(
      collection(this.firestore, 'spaces'),
      where('vehicleType', '==', type),
      where('status', '==', 'Available')
    );

    const snapshot = await getDocs(q);
    this.availableSpaces = snapshot.docs.map(doc => ({
      id: doc.id,
      code: doc.data()['code'],
      pricePerHour: doc.data()['pricePerHour'],
    }));

    this.selectedSpace = null;
    this.pricePerHour = 0;
  }

  // Update selected space and price
  onSelectSpace(event: any) {
    const id = event.detail.value;
    const found = this.availableSpaces.find(s => s.id === id);
    if (found) {
      this.selectedSpace = found;
      this.pricePerHour = found.pricePerHour;
    }
  }

  // Save reservation and generate QR
  async saveReservation() {
    const user = await this.auth['afb'].currentUser;
    if (!user) return;

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 1);

    const reservationData = {
      ...this.reservaForm.value,
      userId: user.uid,
      email: user.email,
      startDate: now,
      endDate: endDate,
      pricePerHour: this.pricePerHour,
      status: 'pending'
    };

    try {
      // Guardar la reserva
      const docRef = await addDoc(collection(this.firestore, 'reservations'), reservationData);

      // Generar QR
      const qrData = JSON.stringify({ id: docRef.id, plate: reservationData.plate });
      const qrCode = await QRCode.toDataURL(qrData); // ✅ Funciona correctamente con esta importación

      // Actualizar el documento con el QR
      await updateDoc(doc(this.firestore, 'reservations', docRef.id), { qrCode });

      // Cambiar el espacio a "Occupied"
      const spaceRef = doc(this.firestore, 'spaces', this.reservaForm.value.space);
      await updateDoc(spaceRef, { status: 'Occupied' });

      // Mostrar Toast
      const toast = document.createElement('ion-toast');
      toast.message = '✅ Reservation created successfully!';
      toast.duration = 2500;
      toast.color = 'success';
      document.body.appendChild(toast);
      await toast.present();

      this.reservaForm.reset();
      this.availableSpaces = [];
      this.pricePerHour = 0;

      this.router.navigate(['/index']);

    } catch (error) {
      console.error('🔥 Error saving reservation:', error);

      const toast = document.createElement('ion-toast');
      toast.message = '❌ Error creating reservation';
      toast.duration = 2500;
      toast.color = 'danger';
      document.body.appendChild(toast);
      await toast.present();
    }
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
      case 'reportes':
        this.router.navigate(['/']);
        break;
      case 'reservations':
        this.router.navigate(['/reservations']);
        break;
      case 'retirar':
        this.router.navigate(['/']);
        break;
      case 'config':
        this.router.navigate(['/']);
        break;
      case 'logout':
        await this.doLogOut();
        break;
      default:
        console.log('Unknown nav:', route);
    }
  }
}
