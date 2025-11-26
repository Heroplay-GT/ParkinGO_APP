import { Auth } from 'src/app/core/providers/auth/auth';
import { Router } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Firestore, collection, onSnapshot, Unsubscribe } from '@angular/fire/firestore';
import { Chart, ChartConfiguration } from 'chart.js/auto';

interface ReportData {
  totalReservations: number;
  totalRevenue: number;
  occupiedSpaces: number;
  totalSpaces: number;
  averageStay: number;
  topVehicles: { plate: string; count: number }[];
  dailyRevenue: { date: string; amount: number }[];
  spaceUsage: { name: string; count: number }[];
  vehicleTypes: { type: string; count: number }[];
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: false
})
export class ReportsPage implements OnInit, OnDestroy {

  reportData: ReportData = {
    totalReservations: 0,
    totalRevenue: 0,
    occupiedSpaces: 0,
    totalSpaces: 0,
    averageStay: 0,
    topVehicles: [],
    dailyRevenue: [],
    spaceUsage: [],
    vehicleTypes: []
  };

  loading = true;
  selectedPeriod: 'week' | 'month' | 'year' = 'month';

  // Charts
  revenueChart: Chart | null = null;
  vehicleChart: Chart | null = null;
  spacesChart: Chart | null = null;
  typesChart: Chart | null = null;

  // Unsubscribers
  private unsubscribeSalidas: Unsubscribe | null = null;
  private unsubscribeSpaces: Unsubscribe | null = null;

  constructor(
    private router: Router,
    private auth: Auth,
    private firestore: Firestore
  ) {

  }

  ngOnInit() {
    this.subscribeToReports();
  }

  ngOnDestroy() {
    this.unsubscribeSalidas?.();
    this.unsubscribeSpaces?.();
    this.destroyCharts();
  }

  async doLogOut() {
    await this.auth.logout();
    this.router.navigate(['/login-admin']);
  }

  async go(route: string) {
    switch (route) {
      case 'clients': this.router.navigate(['/clients']); break;
      case 'ingreso': this.router.navigate(['/ingreso']); break;
      case 'retirar': this.router.navigate(['/admin']); break;
      case 'config-admin': this.router.navigate(['/config-admin']); break;
      case 'logout': await this.doLogOut(); break;
    }
  }

  // ----------------------------------------
  // SUBSCRIBE TO REAL-TIME DATA
  // ----------------------------------------
  subscribeToReports() {
    this.loading = true;

    // Subscribe to Salidas (exits/revenue)
    const salidasRef = collection(this.firestore, 'salidas');
    this.unsubscribeSalidas = onSnapshot(salidasRef, (snapshot) => {
      this.processSalidasData(snapshot.docs);
      this.updateCharts();
    }, (error) => {
      console.error('Error subscribing to salidas:', error);
      this.loading = false;
    });

    // Subscribe to Spaces
    const spacesRef = collection(this.firestore, 'spaces');
    this.unsubscribeSpaces = onSnapshot(spacesRef, (snapshot) => {
      this.processSpacesData(snapshot.docs);
      this.updateCharts();
      this.loading = false;
    }, (error) => {
      console.error('Error subscribing to spaces:', error);
      this.loading = false;
    });
  }

  // ----------------------------------------
  // PROCESS SALIDAS DATA (REAL-TIME)
  // ----------------------------------------
  private processSalidasData(docs: any[]) {
    this.reportData.totalReservations = docs.length;

    let totalHours = 0;
    let totalRevenue = 0;
    const topVehiclesMap = new Map<string, number>();
    const vehicleTypesMap = new Map<string, number>();
    const dailyMap = new Map<string, number>();

    docs.forEach(doc => {
      const data = doc.data();

      // Revenue
      totalRevenue += data.total || 0;
      totalHours += data.hours || 0;

      // Top vehicles
      const plate = data.plate || 'Unknown';
      topVehiclesMap.set(plate, (topVehiclesMap.get(plate) || 0) + 1);

      // Vehicle types
      const type = data.vehicleType || 'Other';
      vehicleTypesMap.set(type, (vehicleTypesMap.get(type) || 0) + 1);

      // Daily revenue
      const exitTime = data.exitTime?.toDate?.() || new Date(data.exitTime);
      const dateStr = exitTime.toISOString().split('T')[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + (data.total || 0));
    });

    this.reportData.totalRevenue = totalRevenue;
    this.reportData.averageStay = docs.length > 0 ? Math.round(totalHours / docs.length) : 0;

    // Top 5 vehicles
    this.reportData.topVehicles = Array.from(topVehiclesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([plate, count]) => ({ plate, count }));

    // Vehicle types
    this.reportData.vehicleTypes = Array.from(vehicleTypesMap.entries())
      .map(([type, count]) => ({ type, count }));

    // Daily revenue
    this.reportData.dailyRevenue = Array.from(dailyMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, amount]) => ({ date, amount }));
  }

  // ----------------------------------------
  // PROCESS SPACES DATA (REAL-TIME)
  // ----------------------------------------
  private processSpacesData(docs: any[]) {
    this.reportData.totalSpaces = docs.length;

    let occupied = 0;
    const spaceUsageMap = new Map<string, number>();

    docs.forEach(doc => {
      const data = doc.data();

      if (data.status === 'Occupied') occupied++;

      // Space usage by zone
      const zone = data.zone || 'General';
      spaceUsageMap.set(zone, (spaceUsageMap.get(zone) || 0) + 1);
    });

    this.reportData.occupiedSpaces = occupied;
    this.reportData.spaceUsage = Array.from(spaceUsageMap.entries())
      .map(([name, count]) => ({ name, count }));
  }

  // ----------------------------------------
  // UPDATE CHARTS
  // ----------------------------------------
  private updateCharts() {
    setTimeout(() => {
      if (this.revenueChart) this.revenueChart.destroy();
      if (this.vehicleChart) this.vehicleChart.destroy();
      if (this.spacesChart) this.spacesChart.destroy();
      if (this.typesChart) this.typesChart.destroy();

      this.createRevenueChart();
      this.createVehicleChart();
      this.createSpacesChart();
      this.createTypesChart();
    }, 100);
  }

  // ----------------------------------------
  // REVENUE CHART (Line)
  // ----------------------------------------
  private createRevenueChart() {
    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.reportData.dailyRevenue.map(d => d.date),
        datasets: [{
          label: 'Daily Revenue ($)',
          data: this.reportData.dailyRevenue.map(d => d.amount),
          borderColor: '#3880ff',
          backgroundColor: 'rgba(56, 128, 255, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#3880ff',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true, labels: { font: { size: 12, weight: 'bold' } } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { callback: (v) => `$${v}` } }
        }
      }
    };

    this.revenueChart = new Chart(ctx, config);
  }

  // ----------------------------------------
  // TOP VEHICLES CHART (Bar)
  // ----------------------------------------
  private createVehicleChart() {
    const ctx = document.getElementById('vehicleChart') as HTMLCanvasElement;
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.reportData.topVehicles.map(v => v.plate),
        datasets: [{
          label: 'Parking Sessions',
          data: this.reportData.topVehicles.map(v => v.count),
          backgroundColor: [
            '#3880ff',
            '#00d4ff',
            '#00d4a2',
            '#ffc409',
            '#ff4757'
          ],
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: { legend: { display: false } }
      }
    };

    this.vehicleChart = new Chart(ctx, config);
  }

  // ----------------------------------------
  // SPACES CHART (Doughnut)
  // ----------------------------------------
  private createSpacesChart() {
    const ctx = document.getElementById('spacesChart') as HTMLCanvasElement;
    if (!ctx) return;

    const available = this.reportData.totalSpaces - this.reportData.occupiedSpaces;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Occupied', 'Available'],
        datasets: [{
          data: [this.reportData.occupiedSpaces, available],
          backgroundColor: ['#ff4757', '#2ed573'],
          borderColor: ['#fff', '#fff'],
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12, weight: 'bold' } } }
        }
      }
    };

    this.spacesChart = new Chart(ctx, config);
  }

  // ----------------------------------------
  // VEHICLE TYPES CHART (Pie)
  // ----------------------------------------
  private createTypesChart() {
    const ctx = document.getElementById('typesChart') as HTMLCanvasElement;
    if (!ctx) return;

    const colors = ['#3880ff', '#00d4ff', '#00d4a2', '#ffc409', '#ff4757', '#845ef7'];

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: this.reportData.vehicleTypes.map(v => v.type),
        datasets: [{
          data: this.reportData.vehicleTypes.map(v => v.count),
          backgroundColor: colors.slice(0, this.reportData.vehicleTypes.length),
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12, weight: 'bold' } } }
        }
      }
    };

    this.typesChart = new Chart(ctx, config);
  }

  // ----------------------------------------
  // DESTROY CHARTS
  // ----------------------------------------
  private destroyCharts() {
    this.revenueChart?.destroy();
    this.vehicleChart?.destroy();
    this.spacesChart?.destroy();
    this.typesChart?.destroy();
  }

  // ----------------------------------------
  // REFRESH DATA
  // ----------------------------------------
  async refreshReports() {
    this.subscribeToReports();
  }

  // ----------------------------------------
  // EXPORT DATA
  // ----------------------------------------
  exportToCSV() {
    const data = [
      ['ParkinGO Report'],
      ['Generated:', new Date().toLocaleString()],
      [],
      ['Total Reservations', this.reportData.totalReservations],
      ['Total Revenue', `$${this.reportData.totalRevenue}`],
      ['Average Stay (hours)', this.reportData.averageStay],
      ['Occupied Spaces', `${this.reportData.occupiedSpaces}/${this.reportData.totalSpaces}`],
      []
    ];

    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parkingo-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
