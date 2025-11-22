import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot, updateDoc, addDoc, doc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Auth } from 'src/app/core/providers/auth/auth';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false
})
export class AdminPage implements OnInit {

  activeVehicles: any[] = [];
  filteredVehicles: any[] = [];
  searchPlate = '';

  selectedVehicle: any = null;
  showModal = false;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) { }

  ngOnInit() {
    this.listenActiveVehicles();
  }

  // -------------------------------------------------------------------
  // 🔥 LISTA EN TIEMPO REAL DE VEHÍCULOS ACTIVOS (EN EL PARQUEADERO)
  // -------------------------------------------------------------------
  listenActiveVehicles() {
    const ref = collection(this.firestore, 'reservations');
    const q = query(ref, where('status', '==', 'active'));

    onSnapshot(q, (snap) => {
      this.activeVehicles = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      this.filterVehicles();
    });
  }

  // -------------------------------------------------------------------
  // 🔎 FILTRAR POR PLACA
  // -------------------------------------------------------------------
  filterVehicles() {
    const term = this.searchPlate.toLowerCase();

    this.filteredVehicles = this.activeVehicles.filter(v =>
      v.plate.toLowerCase().includes(term)
    );
  }

  // -------------------------------------------------------------------
  // 📌 ABRIR MODAL PARA RETIRO
  // -------------------------------------------------------------------
  openDetails(vehicle: any) {
    this.selectedVehicle = vehicle;
    this.showModal = true;
  }

  closeDetails() {
    this.showModal = false;
    this.selectedVehicle = null;
  }

  // -------------------------------------------------------------------
  // ⏱ CALCULAR HORAS COBRADAS — REDONDEO HACIA ARRIBA
  // -------------------------------------------------------------------
  calculateHours(entry: any) {
    const entryDate = entry?.toDate ? entry.toDate() : new Date(entry);
    const now = new Date();

    const diffMs = now.getTime() - entryDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    return Math.ceil(diffHours); // redondeo hacia arriba
  }

  // -------------------------------------------------------------------
  // 💰 CALCULAR MONTO A COBRAR
  // -------------------------------------------------------------------
  calculateTotal(vehicle: any) {
    const hours = this.calculateHours(vehicle.entryTime);
    return hours * vehicle.pricePerHour;
  }

  // -------------------------------------------------------------------
  // 🚗 RETIRAR VEHÍCULO
  // -------------------------------------------------------------------
  async retirarVehiculo() {
    if (!this.selectedVehicle) return;

    const vehicle = this.selectedVehicle;
    const total = this.calculateTotal(vehicle);
    const hours = this.calculateHours(vehicle.entryTime);

    // Guardar registro en colección "salidas"
    await addDoc(collection(this.firestore, 'salidas'), {
      reservationId: vehicle.id,
      plate: vehicle.plate,
      model: vehicle.model,
      space: vehicle.space,
      vehicleType: vehicle.vehicleType,
      entryTime: vehicle.entryTime,
      exitTime: new Date(),
      hours,
      total,
      userId: vehicle.userId || null
    });

    // Actualizar reserva → finalizado
    await updateDoc(doc(this.firestore, 'reservations', vehicle.id), {
      status: 'finalizado',
      exitTime: new Date(),
      total,
      hours
    });

    // Liberar espacio
    await updateDoc(doc(this.firestore, 'spaces', vehicle.space), {
      status: 'Available'
    });

    // Notificación
    const toast = document.createElement('ion-toast');
    toast.message = `✔ Vehicle removed — Total: $${total}`;
    toast.color = 'success';
    toast.duration = 2500;
    document.body.appendChild(toast);
    toast.present();

    this.closeDetails();
  }

  // -------------------------------------------------------------------
  // ICONOS
  // -------------------------------------------------------------------
  getVehicleIcon(type: string) {
    type = type?.toLowerCase();
    if (type === 'car') return 'car-outline';
    if (type === 'motorcycle') return 'bicycle-outline';
    return 'bicycle-outline';
  }

  // -------------------------------------------------------------------
  // LOGOUT Y NAVEGACIÓN
  // -------------------------------------------------------------------
  async doLogOut() {
    await this.auth.logout();
    this.router.navigate(['/login-admin']);
  }

  async go(route: string) {
    switch (route) {
      case 'clients': this.router.navigate(['/clients']); break;
      case 'ingreso': this.router.navigate(['/ingreso']); break;
      case 'config-admin': this.router.navigate(['/config-admin']); break;
      case 'logout': await this.doLogOut(); break;
    }
  }
}
