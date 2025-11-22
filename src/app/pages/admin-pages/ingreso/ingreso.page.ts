import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot, updateDoc, addDoc, doc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Auth } from 'src/app/core/providers/auth/auth';

@Component({
  selector: 'app-ingreso',
  templateUrl: './ingreso.page.html',
  styleUrls: ['./ingreso.page.scss'],
  standalone: false
})
export class IngresoPage implements OnInit {

  reservations: any[] = [];
  filteredReservations: any[] = [];
  searchPlate = '';

  availableSpaces: any[] = [];

  selectedReservation: any = null;
  showReservationModal = false;
  showManualEntryModal = false;

  manual = {
    type: '',
    plate: '',
    model: '',
    space: ''
  };

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) { }

  async ngOnInit() {
    this.listenReservations();
    this.listenAvailableSpaces();
  }

  // ----------------------------------
  // 🔥 LISTA EN TIEMPO REAL DE RESERVAS
  // ----------------------------------
  listenReservations() {
    const ref = collection(this.firestore, 'reservations');
    const qRes = query(ref, where('status', '==', 'pending'));

    onSnapshot(qRes, (snap) => {
      this.reservations = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      this.filterReservations();
    });
  }

  // ----------------------------------
  // 🔥 LISTA EN TIEMPO REAL DE ESPACIOS
  // ----------------------------------
  listenAvailableSpaces() {
    const ref = collection(this.firestore, 'spaces');
    const qSpaces = query(ref, where('status', '==', 'Available'));

    onSnapshot(qSpaces, (snap) => {
      this.availableSpaces = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
    });
  }

  // ----------------------------------
  // 🔎 FILTRAR RESERVAS POR PLACA
  // ----------------------------------
  filterReservations() {
    const term = this.searchPlate.toLowerCase();

    this.filteredReservations = this.reservations.filter(r =>
      r.plate.toLowerCase().includes(term)
    );
  }

  // ----------------------------------
  // 📌 ABRIR MODAL DE RESERVA
  // ----------------------------------
  openReservationActions(res: any) {
    this.selectedReservation = res;
    this.showReservationModal = true;
  }

  closeReservationModal() {
    this.showReservationModal = false;
    this.selectedReservation = null;
  }

  // ----------------------------------
  // 🚗 INGRESAR VEHÍCULO CON RESERVA
  // ----------------------------------
  async ingresarReserva() {
    if (!this.selectedReservation) return;

    await updateDoc(doc(this.firestore, 'reservations', this.selectedReservation.id), {
      status: 'active',
      entryTime: new Date()
    });

    const toast = document.createElement('ion-toast');
    toast.message = '🚗 Vehicle entered!';
    toast.color = 'success';
    toast.duration = 2000;
    document.body.appendChild(toast);
    toast.present();

    this.closeReservationModal();
  }

  // ----------------------------------
  // ❌ CANCELAR RESERVA
  // ----------------------------------
  async cancelarReserva() {
    if (!this.selectedReservation) return;

    await updateDoc(doc(this.firestore, 'reservations', this.selectedReservation.id), {
      status: 'cancelled'
    });

    await updateDoc(doc(this.firestore, 'spaces', this.selectedReservation.space), {
      status: 'Available'
    });

    const toast = document.createElement('ion-toast');
    toast.message = '❌ Reservation cancelled';
    toast.color = 'danger';
    toast.duration = 2000;
    document.body.appendChild(toast);
    toast.present();

    this.closeReservationModal();
  }

  // ----------------------------------
  // 📌 ABRIR MODAL DE INGRESO MANUAL
  // ----------------------------------
  openManualEntryModal() {
    this.showManualEntryModal = true;
  }

  closeManualEntryModal() {
    this.showManualEntryModal = false;
    this.manual = { type: '', plate: '', model: '', space: '' };
  }

  // ----------------------------------
  // 📝 REGISTRAR INGRESO MANUAL
  // ----------------------------------
  async createManualEntry() {

    const data = {
      vehicleType: this.manual.type,
      plate: this.manual.plate,
      model: this.manual.model,
      space: this.manual.space,
      userId: null,
      startDate: new Date(),
      entryTime: new Date(),
      pricePerHour:
        this.availableSpaces.find(s => s.code === this.manual.space)?.pricePerHour,
      status: 'active'
    };

    await addDoc(collection(this.firestore, 'reservations'), data);

    await updateDoc(doc(this.firestore, 'spaces', this.manual.space), {
      status: 'Occupied'
    });

    const toast = document.createElement('ion-toast');
    toast.message = '🚘 Manual entry registered!';
    toast.color = 'success';
    toast.duration = 2000;
    document.body.appendChild(toast);
    toast.present();

    this.closeManualEntryModal();
  }

  getVehicleIcon(type: string) {
    type = type?.toLowerCase();
    if (type === 'car') return 'car-outline';
    if (type === 'motorcycle') return 'bicycle-outline';
    return 'bicycle-outline';
  }

  async doLogOut() {
    await this.auth.logout();
    this.router.navigate(['/login-admin']);
  }

  async go(route: string) {
    switch (route) {
      case 'clients': this.router.navigate(['/clients']); break;
      case 'retirar': this.router.navigate(['/admin']); break;
      case 'config-admin': this.router.navigate(['/config-admin']); break;
      case 'logout': await this.doLogOut(); break;
    }
  }
}
