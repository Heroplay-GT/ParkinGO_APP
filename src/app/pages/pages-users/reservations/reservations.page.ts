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
  ) {}

  ngOnInit() {
    this.reservaForm = this.fb.group({
      vehicleType: ['', Validators.required],
      plate: ['', Validators.required],
      model: ['', Validators.required],
      space: ['', Validators.required],
    });
  }

  // Cargar espacios disponibles según el tipo
  async updateType() {
    const type = this.reservaForm.get('vehicleType')?.value;

    // 🔹 Si es bicicleta, no requerimos placa
    const plateControl = this.reservaForm.get('plate');
    if (type === 'Bicycle') {
      plateControl?.clearValidators();
      plateControl?.updateValueAndValidity();
    } else {
      plateControl?.setValidators([Validators.required]);
      plateControl?.updateValueAndValidity();
    }

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

  onSelectSpace(event: any) {
    const id = event.detail.value;
    const found = this.availableSpaces.find(s => s.id === id);
    if (found) {
      this.selectedSpace = found;
      this.pricePerHour = found.pricePerHour;
    }
  }

  // 🔹 Validar que no haya reservas con la misma placa
  async plateExists(plate: string): Promise<boolean> {
    const q = query(
      collection(this.firestore, 'reservations'),
      where('plate', '==', plate),
      where('status', 'in', ['pending', 'active'])
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty; // true si ya existe una reserva activa/pendiente con esa placa
  }

  // Guardar reserva
  async saveReservation() {
    const user = await this.auth['afb'].currentUser;
    if (!user) return;

    const type = this.reservaForm.value.vehicleType;
    const plate = this.reservaForm.value.plate;

    // 🔸 Validar placa duplicada si no es bicicleta
    if (type !== 'Bicycle' && plate) {
      const exists = await this.plateExists(plate);
      if (exists) {
        const toast = document.createElement('ion-toast');
        toast.message = '⚠️ A reservation already exists with this plate.';
        toast.duration = 2500;
        toast.color = 'warning';
        document.body.appendChild(toast);
        await toast.present();
        return;
      }
    }

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 1);

    const reservationData = {
      vehicleType: type,
      plate: plate || 'N/A',
      model: this.reservaForm.value.model,
      space: this.selectedSpace.code,
      spaceId: this.selectedSpace.id,
      userId: user.uid,
      email: user.email,
      startDate: now,
      endDate: endDate,
      pricePerHour: this.pricePerHour,
      status: 'pending'
    };

    try {
      const docRef = await addDoc(collection(this.firestore, 'reservations'), reservationData);

      // Generar QR
      const qrData = JSON.stringify({ id: docRef.id, plate: reservationData.plate });
      const qrCode = await QRCode.toDataURL(qrData);

      await updateDoc(doc(this.firestore, 'reservations', docRef.id), { qrCode });

      // Marcar espacio como ocupado
      const spaceRef = doc(this.firestore, 'spaces', this.selectedSpace.id);
      await updateDoc(spaceRef, { status: 'Occupied' });

      const toast = document.createElement('ion-toast');
      toast.message = '✅ Reservation created successfully!';
      toast.duration = 2500;
      toast.color = 'success';
      document.body.appendChild(toast);
      await toast.present();

      this.reservaForm.reset();
      this.availableSpaces = [];
      this.pricePerHour = 0;
    } catch (error) {
      console.error('🔥 Error saving reservation:', error);
      const toast = document.createElement('ion-toast');
      toast.message = '❌ Error saving reservation.';
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

      case 'config':
        this.router.navigate(['/config']);
        break;
      case 'logout':
        await this.doLogOut();
        break;
      default:
        console.log('Unknown nav:', route);
    }
  }
}
