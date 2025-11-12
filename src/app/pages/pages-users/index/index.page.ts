import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Auth } from 'src/app/core/providers/auth/auth';
import { Firestore,
  collection,
  getDocs,
  query,
  where,
  DocumentData,
  deleteDoc,
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

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadReservations();
  }

  async loadReservations() {
    this.loading = true;

    try {
      const user = await this.auth['afb'].currentUser;
      if (!user) {
        console.warn('⚠️ No user logged in');
        this.loading = false;
        return;
      }

      this.userEmail = user.email;

      const q = query(
        collection(this.firestore, 'reservations'),
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(q);

      this.reservations = snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        let formattedDate: Date | null = null;

        const startDate = data['startDate']; // ✅ Acceso seguro con corchetes

        if (startDate) {
          // Si tiene método toDate() (es Timestamp)
          if (typeof startDate.toDate === 'function') {
            formattedDate = startDate.toDate();
          }
          // Si es string
          else if (typeof startDate === 'string') {
            formattedDate = new Date(startDate);
          }
        }

        return {
          id: doc.id,
          ...data,
          startDate: formattedDate
        };
      });


      console.log('✅ Reservations loaded:', this.reservations);
    } catch (error) {
      console.error('🔥 Error loading reservations:', error);
    }

    this.loading = false;
  }

  async cancelReservation(reservationId: string) {
    try {
      const reservation = this.reservations.find(r => r.id === reservationId);
      if (!reservation) {
        alert('Reservation not found');
        return;
      }

      // Confirmación del usuario
      const confirmCancel = confirm(
        `Are you sure you want to cancel the reservation for ${reservation.plate}?`
      );
      if (!confirmCancel) return;

      // 1️⃣ Eliminar la reserva
      await deleteDoc(doc(this.firestore, 'reservations', reservationId));

      // 2️⃣ Cambiar el estado del espacio a "Available"
      const spaceQuery = query(
        collection(this.firestore, 'spaces'),
        where('space', '==', reservation.space)
      );
      const spaceSnap = await getDocs(spaceQuery);
      spaceSnap.forEach(async s => {
        await updateDoc(doc(this.firestore, 'spaces', s.id), {
          status: 'Available'
        });
      });

      // 3️⃣ Actualizar la lista local
      this.reservations = this.reservations.filter(r => r.id !== reservationId);

      alert('✅ Reservation cancelled successfully!');
    } catch (error) {
      console.error('🔥 Error cancelling reservation:', error);
      alert('❌ Could not cancel reservation.');
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
