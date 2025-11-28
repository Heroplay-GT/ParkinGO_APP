import { Router } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Auth } from 'src/app/core/providers/auth/auth';
import {
  Firestore,
  collection,
  query,
  where,
  DocumentData,
  doc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
  getDocs
} from '@angular/fire/firestore';

@Component({
  selector: 'app-index',
  templateUrl: './index.page.html',
  styleUrls: ['./index.page.scss'],
  standalone: false
})
export class IndexPage implements OnInit, OnDestroy {
  reservations: any[] = [];
  loading = true;
  userEmail: string | null = null;

  // 🔹 Propiedades para el QR modal
  showQRModal = false;
  selectedQR: string | null = null;

  // 🔹 Unsubscriber para tiempo real
  private unsubscribeReservations: Unsubscribe | null = null;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) { }

  ngOnInit() {
    this.subscribeToReservations();
    this.markExpiredReservations();
  }

  ngOnDestroy() {
    // 🔹 Desuscribirse cuando se destruye el componente
    this.unsubscribeReservations?.();
  }

  ionViewWillEnter() {
    // Si ya está suscrito, no vuelvas a suscribir
    if (!this.unsubscribeReservations) {
      this.subscribeToReservations();
    }
    this.markExpiredReservations();
  }

  ionViewWillLeave() {
    // Opcional: desuscribirse al salir de la página
    // this.unsubscribeReservations?.();
  }

  // ========================================
  // SUBSCRIBE TO RESERVATIONS (TIEMPO REAL)
  // ========================================
  subscribeToReservations() {
    this.loading = true;
    try {
      const user = this.auth['afb'].currentUser;
      if (!user) {
        this.loading = false;
        return;
      }

      const q = query(
        collection(this.firestore, 'reservations'),
        where('userId', '==', user.uid)
      );

      // 🔹 onSnapshot = escucha cambios en tiempo real
      this.unsubscribeReservations = onSnapshot(
        q,
        (snapshot) => {
          this.reservations = snapshot.docs
            .map(doc => {
              const data = doc.data() as DocumentData;
              const startDate = data['startDate']?.toDate
                ? data['startDate'].toDate()
                : new Date(data['startDate']);
              // normalizar vehicleType y otros campos opcionales
              const vehicleType = data['vehicleType'] || data['vehicle'] || '';
              return { id: doc.id, ...data, startDate, vehicleType };
            })
            .sort((a, b) => b.startDate - a.startDate); // 🔹 Orden descendente

          console.log('✓ Reservations updated in real-time:', this.reservations.length);
          this.loading = false;
        },
        (error) => {
          console.error('🔥 Error subscribing to reservations:', error);
          this.loading = false;
        }
      );
    } catch (error) {
      console.error('🔥 Error in subscribeToReservations:', error);
      this.loading = false;
    }
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

  // getVehicleIcon reemplazado por versión segura
  getVehicleIcon(vehicleType?: string): string {
    const v = (vehicleType || '').toLowerCase();

    switch (v) {
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
      const endDate = data.endDate?.toDate
        ? data.endDate.toDate()
        : new Date(data.endDate);

      if (endDate < now && data.status === 'pending') {
        await updateDoc(docSnap.ref, { status: 'expired' });

        const spaceRef = doc(this.firestore, 'spaces', data.space);
        await updateDoc(spaceRef, { status: 'Available' });
      }
    }
  }

  // 🔹 Logout
  async doLogOut() {
    this.unsubscribeReservations?.();
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

  refreshList() {
    this.subscribeToReservations();
  }

}
