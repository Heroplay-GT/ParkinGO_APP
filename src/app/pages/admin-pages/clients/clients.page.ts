import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Auth } from 'src/app/core/providers/auth/auth';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.page.html',
  styleUrls: ['./clients.page.scss'],
  standalone: false
})
export class ClientsPage implements OnInit {

  clients: any[] = [];
  filteredClients: any[] = [];

  searchTerm: string = '';
  providerFilter: string = 'all';
  loading = true;

  constructor(
    private firestore: Firestore,
    private router: Router,
    private readonly auth: Auth
  ) { }

  async ngOnInit() {
    await this.loadClients();
  }

  async loadClients() {
    this.loading = true;

    try {
      const qClients = query(
        collection(this.firestore, 'users'),
        where('role', '==', 'user')
      );

      const snapshot = await getDocs(qClients);

      this.clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      this.filteredClients = [...this.clients];

    } catch (err) {
      console.error("🔥 Error loading clients:", err);
    }

    this.loading = false;
  }

  showDetails = false;
  selectedClient: any = null;

  openDetails(client: any) {
    this.selectedClient = client;
    this.showDetails = true;
  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase();

    this.filteredClients = this.clients.filter(client => {
      const matchesSearch =
        client.name?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term);

      const matchesProvider =
        this.providerFilter === 'all' ||
        client.provider === this.providerFilter;

      return matchesSearch && matchesProvider;
    });
  }

  closeDetails() {
    this.showDetails = false;
    this.selectedClient = null;
  }

  async doLogOut() {
    await this.auth.logout();
    this.router.navigate(['/login-admin']);
  }

  async go(route: string) {

    switch (route) {

      case 'reportes':
        this.router.navigate(['/']);
        break;
      case 'ingreso':
        this.router.navigate(['/ingreso']);
        break;
      case 'retirar':
        this.router.navigate(['/admin']);
        break;
      case 'config-admin':
        this.router.navigate(['/config-admin']);
        break;
      case 'logout':
        await this.doLogOut();
        break;
      default:
        console.log('Unknown nav:', route);
    }
  }

}
