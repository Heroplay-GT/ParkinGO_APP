import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Auth } from 'src/app/core/providers/auth/auth';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
  DocumentData,
  doc,
  updateDoc
} from '@angular/fire/firestore';

@Component({
  selector: 'app-index',
  templateUrl: './index.page.html',
  styleUrls: ['./index.page.scss'],
  standalone: false
})
export class IndexPage implements OnInit {
  reservations: any[] = [];
  loading = true;
  userEmail: string | null = null;

  // 🔹 Propiedades para el QR modal
  showQRModal = false;
  selectedQR: string | null = null;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadReservations();
    await this.markExpiredReservations();
  }

  async ionViewWillEnter() {
    await this.loadReservations(); // 🔹 recarga cada vez que entras
    await this.markExpiredReservations();
  }


  // 🔹 Cargar reservas del usuario ordenadas (más recientes primero)
  async loadReservations() {
    this.loading = true;
    try {
      const user = await this.auth['afb'].currentUser;
      if (!user) return;

      const q = query(
        collection(this.firestore, 'reservations'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);

      this.reservations = snapshot.docs
        .map(doc => {
          const data = doc.data() as DocumentData;
          const startDate = data['startDate']?.toDate ? data['startDate'].toDate() : new Date(data['startDate']);
          return { id: doc.id, ...data, startDate };
        })
        .sort((a, b) => b.startDate - a.startDate); // 🔹 Orden descendente
    } catch (error) {
      console.error('🔥 Error loading reservations:', error);
    }
    this.loading = false;
  }

  // 🔹 Mostrar QR
  openQR(res: any) {
    if (res.qrCode) {
      this.selectedQR = res.qrCode;
      this.showQRModal = true;
    } else {
      const toast = document.createElement('ion-toast');
      toast.message = '⚠️ This reservation has no QR code';
      toast.duration = 2500;
      toast.color = 'warning';
      document.body.appendChild(toast);
      toast.present();
    }
  }

  // 🔹 Cerrar modal QR
  closeQR() {
    this.showQRModal = false;
    this.selectedQR = null;
  }

  // 🔹 Cancelar reserva sin eliminar
  async cancelReservation(reservationId: string) {
    try {
      const res = this.reservations.find(r => r.id === reservationId);
      if (!res) return;

      const confirmCancel = confirm(`Cancel reservation for ${res.plate}?`);
      if (!confirmCancel) return;

      // 🔹 Marcar como cancelada
      const ref = doc(this.firestore, 'reservations', reservationId);
      await updateDoc(ref, { status: 'cancelled' });

      // 1️⃣ Buscar espacio por el campo "code"
      const spaceQuery = query(
        collection(this.firestore, 'spaces'),
        where('code', '==', res.space)
      );

      const spaceSnap = await getDocs(spaceQuery);

      // 2️⃣ Actualizar el espacio encontrado
      for (const s of spaceSnap.docs) {
        await updateDoc(s.ref, { status: 'Available' });
      }


      // 🔹 Actualizar lista local
      res.status = 'cancelled';

      const toast = document.createElement('ion-toast');
      toast.message = '🚫 Reservation cancelled';
      toast.duration = 2500;
      toast.color = 'medium';
      document.body.appendChild(toast);
      toast.present();
    } catch (error) {
      console.error('🔥 Error cancelling reservation:', error);
    }
  }

  getVehicleIcon(vehicleType: string): string {
    switch (vehicleType?.toLowerCase()) {
      case 'car':
      case 'carro':
        return 'car-outline';
      case 'motorcycle':
      case 'moto':
        return 'bicycle-outline';
      case 'bicycle':
      case 'bicicleta':
        return 'bicycle-outline';
      default:
        return 'help-outline';
    }
  }

  async markExpiredReservations() {
    const q = query(collection(this.firestore, 'reservations'));
    const snapshot = await getDocs(q);

    const now = new Date();

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as any;
      const endDate = data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate);

      if (endDate < now && data.status === 'pending') {
        await updateDoc(docSnap.ref, { status: 'expired' });

        const spaceRef = doc(this.firestore, 'spaces', data.space);
        await updateDoc(spaceRef, { status: 'Available' });
      }
    }
  }

  // 🔹 Logout
  async doLogOut() {
    await this.auth.logout();
    this.router.navigate(['/home']);
  }

  // 🔹 Navegación del submenú
  async go(route: string) {
    switch (route) {

      case 'reservations':
        this.router.navigate(['/reservations']);
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
