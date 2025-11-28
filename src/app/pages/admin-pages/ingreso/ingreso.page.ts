import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  manualEntry = {
    vehicleType: '',
    plate: '',
    model: '',
    spaceCode: ''
  };

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
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
      this.availableSpaces = snap.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            code: data['code'],
            vehicleType: data['vehicleType'],
            pricePerHour: data['pricePerHour'],
            status: data['status']
          };
        })
        .filter(space => space.code && space.pricePerHour); // Filtrar espacios válidos
      
      console.log('Available spaces loaded:', this.availableSpaces.length);
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
    this.cdr.detectChanges();
  }

  closeReservationModal() {
    this.showReservationModal = false;
    this.selectedReservation = null;
    this.cdr.detectChanges();
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
    console.log('Opening manual entry modal...');
    console.log('Available spaces:', this.availableSpaces);
    
    // Resetear el objeto
    this.manualEntry = {
      vehicleType: '',
      plate: '',
      model: '',
      spaceCode: ''
    };
    
    this.showManualEntryModal = true;
    this.cdr.detectChanges();
    
    // Forzar otra detección después de un momento
    setTimeout(() => {
      this.cdr.detectChanges();
      console.log('Modal state:', this.showManualEntryModal);
      console.log('Manual entry data:', this.manualEntry);
    }, 100);
  }

  closeManualEntryModal() {
    this.showManualEntryModal = false;
    this.manualEntry = {
      vehicleType: '',
      plate: '',
      model: '',
      spaceCode: ''
    };
    this.cdr.detectChanges();
  }

  // ----------------------------------
  // 📝 REGISTRAR INGRESO MANUAL
  // ----------------------------------
  async createManualEntry() {
    console.log('Creating manual entry with data:', this.manualEntry);
    
    if (!this.manualEntry.vehicleType || !this.manualEntry.plate || !this.manualEntry.model || !this.manualEntry.spaceCode) {
      const toast = document.createElement('ion-toast');
      toast.message = '⚠️ Please fill all fields';
      toast.color = 'warning';
      toast.duration = 2000;
      document.body.appendChild(toast);
      toast.present();
      console.log('Validation failed:', {
        vehicleType: this.manualEntry.vehicleType,
        plate: this.manualEntry.plate,
        model: this.manualEntry.model,
        spaceCode: this.manualEntry.spaceCode
      });
      return;
    }

    const selectedSpace = this.availableSpaces.find(s => s.code === this.manualEntry.spaceCode);
    console.log('Selected space:', selectedSpace);

    if (!selectedSpace) {
      const toast = document.createElement('ion-toast');
      toast.message = '⚠️ Space not found';
      toast.color = 'warning';
      toast.duration = 2000;
      document.body.appendChild(toast);
      toast.present();
      return;
    }

    const data = {
      vehicleType: this.manualEntry.vehicleType,
      plate: this.manualEntry.plate || 'N/A',
      model: this.manualEntry.model,
      space: this.manualEntry.spaceCode,
      spaceId: selectedSpace.id,
      userId: null,
      email: 'admin-manual-entry',
      startDate: new Date(),
      entryTime: new Date(),
      pricePerHour: selectedSpace.pricePerHour,
      status: 'active'
    };

    console.log('Data to save:', data);

    try {
      const docRef = await addDoc(collection(this.firestore, 'reservations'), data);
      console.log('Reservation created with ID:', docRef.id);

      await updateDoc(doc(this.firestore, 'spaces', selectedSpace.id), {
        status: 'Occupied'
      });
      console.log('Space updated to Occupied');

      const toast = document.createElement('ion-toast');
      toast.message = '🚘 Manual entry registered!';
      toast.color = 'success';
      toast.duration = 2000;
      document.body.appendChild(toast);
      toast.present();

      this.closeManualEntryModal();
    } catch (error) {
      console.error('Error creating manual entry:', error);
      const toast = document.createElement('ion-toast');
      toast.message = '❌ Error creating entry: ' + (error as any).message;
      toast.color = 'danger';
      toast.duration = 3000;
      document.body.appendChild(toast);
      toast.present();
    }
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

  selectSpace(spaceCode: string) {
    this.manualEntry.spaceCode = spaceCode;
    this.cdr.detectChanges();
  }

  async go(route: string) {
    switch (route) {
      case 'clients': this.router.navigate(['/clients']); break;
      case 'reportes': this.router.navigate(['/reports']); break;
      case 'retirar': this.router.navigate(['/admin']); break;
      case 'config-admin': this.router.navigate(['/config-admin']); break;
      case 'logout': await this.doLogOut(); break;
    }
  }

  refreshList() {
    this.listenReservations?.();
  }

  openScannerPage() {
    this.router.navigate(['scan-qr']);
  }
}
