import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, getDocs, query, where, addDoc, doc, updateDoc } from '@angular/fire/firestore';
import { Auth } from 'src/app/core/providers/auth/auth';
import { Router } from '@angular/router';

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
    const code = event.target.value;
    const found = this.availableSpaces.find(s => s.code === code);
    if (found) {
      this.selectedSpace = found;
      this.pricePerHour = found.pricePerHour;
    }
  }

  // Save reservation and update space status
  async saveReservation() {
    const user = await this.auth['afb'].currentUser;
    if (!user) {
      alert('⚠️ You must be logged in to register a reservation.');
      return;
    }

    const data = {
      ...this.reservaForm.value,
      pricePerHour: this.pricePerHour,
      userId: user.uid,
      email: user.email,
      startDate: new Date(),
    };

    await addDoc(collection(this.firestore, 'reservations'), data);

    // Update space to "Occupied"
    if (this.selectedSpace?.id) {
      const spaceRef = doc(this.firestore, 'spaces', this.selectedSpace.id);
      await updateDoc(spaceRef, { status: 'Occupied' });
    }

    alert('✅ Reservation registered successfully!');
    this.reservaForm.reset();
    this.availableSpaces = [];
    this.pricePerHour = 0;
    this.selectedSpace = null;
  }

  async doLogOut() {
    await this.auth.logout();
    this.router.navigate(['/home']);
  }

  async go(route: string) {

    switch(route) {
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
