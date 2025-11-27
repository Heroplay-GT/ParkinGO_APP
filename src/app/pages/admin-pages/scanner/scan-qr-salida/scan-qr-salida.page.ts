import { Component, OnDestroy } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc, addDoc, collection } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-scan-qr-salida',
  templateUrl: './scan-qr-salida.page.html',
  styleUrls: ['./scan-qr-salida.page.scss'],
  standalone: false
})
export class ScanQrSalidaPage implements OnDestroy {

  scanning = false;
  isNative = Capacitor.getPlatform() !== 'web';

  webScanner: BrowserMultiFormatReader | null = null;
  videoStream: MediaStream | null = null;

  constructor(
    private firestore: Firestore,
    private router: Router,
    private toastController: ToastController
  ) { }

  ngOnDestroy() {
    this.stopScan();
  }

  // ----------------------------------------
  // START SCAN
  // ----------------------------------------
  async startScan() {
    console.log('startScan called');
    console.log('isNative:', this.isNative);
    console.log('Platform:', Capacitor.getPlatform());
    
    this.scanning = true;

    if (this.isNative) {
      await this.scanNative();
    } else {
      await this.scanWeb();
    }
  }

  // ----------------------------------------
  // STOP SCAN
  // ----------------------------------------
  stopScan() {
    this.scanning = false;

    if (this.webScanner) {
      try { (this.webScanner as any).reset(); } catch { }
      this.webScanner = null;
    }

    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
      this.videoStream = null;
    }

    // Detener escanner nativo y restaurar fondo
    if (this.isNative) {
      try {
        BarcodeScanner.stopScan();
        BarcodeScanner.removeAllListeners();
        document.body.classList.remove('barcode-scanner-active');
      } catch { }
    }
  }

  // ----------------------------------------
  // NATIVE SCAN (ANDROID / iOS)
  // ----------------------------------------
  async scanNative() {
    try {
      console.log('scanNative started');
      
      // Verificar permisos
      console.log('Checking permissions...');
      const granted = await BarcodeScanner.checkPermissions();
      console.log('Permissions result:', granted);
      
      if (granted.camera !== 'granted') {
        console.log('Requesting permissions...');
        const requested = await BarcodeScanner.requestPermissions();
        console.log('Request result:', requested);
        
        if (requested.camera !== 'granted') {
          this.showToast('Se necesitan permisos de cámara', 'danger');
          this.scanning = false;
          return;
        }
      }

      console.log('Permissions granted, starting scan...');
      
      // Ocultar el fondo de la web
      document.body.classList.add('barcode-scanner-active');

      // Agregar listener para los códigos escaneados
      console.log('Adding barcodesScanned listener...');
      const listener = await BarcodeScanner.addListener(
        'barcodesScanned',
        async (result) => {
          console.log('🔍 SALIDA - Barcode detected:', result);
          console.log('🔍 SALIDA - Barcodes array:', result.barcodes);
          console.log('🔍 SALIDA - Scanning state:', this.scanning);
          
          if (!this.scanning) {
            console.log('⚠️ SALIDA - Not scanning, ignoring');
            return;
          }
          
          if (result.barcodes && result.barcodes.length > 0) {
            const code = result.barcodes[0].displayValue;
            console.log('✅ SALIDA - Processing code:', code);
            await this.processQR(code);
          } else {
            console.log('⚠️ SALIDA - No barcodes in result');
          }
        }
      );
      console.log('Listener added successfully');

      // Iniciar el escaneo
      console.log('Calling BarcodeScanner.startScan()...');
      await BarcodeScanner.startScan();
      console.log('Scanner started successfully');

    } catch (err) {
      console.error('Error en scanNative:', err);
      this.showToast('Error al iniciar el escáner: ' + (err as any).message, 'danger');
      this.scanning = false;
      document.body.classList.remove('barcode-scanner-active');
    }
  }

  // ----------------------------------------
  // WEB SCAN (ZXING)
  // ----------------------------------------
  async scanWeb() {
    this.webScanner = new BrowserMultiFormatReader();

    const video = document.getElementById("video-preview") as HTMLVideoElement | null;
    if (!video) {
      this.showToast('Elemento de video no encontrado', 'danger');
      this.scanning = false;
      return;
    }

    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      video.srcObject = this.videoStream;
      await video.play();

      await this.webScanner.decodeFromVideoDevice(
        undefined,
        video,
        async (result: any) => {
          if (!this.scanning) return;
          if (result) {
            await this.processQR(result.getText());
          }
        }
      );

    } catch (err) {
      console.error(err);
      this.showToast('Error en el escáner web', 'danger');
      this.scanning = false;
    }
  }

  // ----------------------------------------
  // PROCESS QR - LÓGICA DE RETIRO
  // ----------------------------------------
  async processQR(raw: string) {
    console.log('🚀 SALIDA - processQR called with:', raw);
    this.stopScan();
    console.log('🚀 SALIDA - Scanner stopped');

    try {
      if (!raw) {
        console.log('❌ SALIDA - Empty QR');
        this.showToast('QR vacío', 'warning');
        return;
      }

      console.log('🚀 SALIDA - Parsing JSON...');
      const data = JSON.parse(raw);
      console.log('🚀 SALIDA - Parsed data:', data);
      const reservationId = data.id;

      if (!reservationId) {
        this.showToast('QR inválido (id faltante)', 'danger');
        return;
      }

      // Obtener reserva
      const ref = doc(this.firestore, 'reservations', reservationId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        this.showToast('Reserva no encontrada', 'warning');
        return;
      }

      const vehicle: any = snap.data();

      // Validar que esté activa
      if (vehicle.status !== 'active') {
        this.showToast('La reserva no está activa', 'danger');
        return;
      }

      // Convertir entryTime a Date
      const entryTime = this.toDate(vehicle.entryTime);
      const exitTime = new Date();

      // Calcular horas y total
      const hours = this.calculateHours(entryTime);
      const total = (vehicle.pricePerHour ?? 0) * hours;

      // 1️⃣ Guardar en colección "salidas"
      await addDoc(collection(this.firestore, 'salidas'), {
        reservationId,
        plate: vehicle.plate ?? null,
        model: vehicle.model ?? null,
        space: vehicle.space ?? null,
        vehicleType: vehicle.vehicleType ?? null,
        entryTime,
        exitTime,
        hours,
        total,
        userId: vehicle.userId ?? null
      });

      // 2️⃣ Actualizar reserva como "finalizado"
      await updateDoc(ref, {
        status: 'finalizado',
        exitTime,
        hours,
        total
      });

      // 3️⃣ Liberar espacio
      if (vehicle.space) {
        await updateDoc(doc(this.firestore, 'spaces', vehicle.space), {
          status: 'Available'
        });
      }

      // Notificación de éxito
      this.showToast(
        `✔ Vehículo ${vehicle.plate ?? 'N/A'} retirado — Total: $${total.toLocaleString()}`,
        'success'
      );

      // Navegar a retiro
      this.router.navigate(['/retiro']);

    } catch (err) {
      console.error(err);
      this.showToast('QR inválido o dañado', 'danger');
    }
  }

  // ----------------------------------------
  // CONVERTIR A DATE
  // ----------------------------------------
  private toDate(v: any): Date {
    if (!v) return new Date();
    if (typeof v.toDate === 'function') return v.toDate();
    if (typeof v === 'number') return new Date(v);
    if (typeof v === 'string') return new Date(v);
    if (v.seconds) return new Date((v.seconds * 1000) + (v.nanoseconds ? v.nanoseconds / 1e6 : 0));
    return new Date();
  }

  // ----------------------------------------
  // CALCULAR HORAS
  // ----------------------------------------
  private calculateHours(entryTime: Date): number {
    const diff = new Date().getTime() - entryTime.getTime();
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    return hours <= 0 ? 1 : hours;
  }

  // ----------------------------------------
  // TOAST
  // ----------------------------------------
  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      color: color,
      duration: 2500,
      position: 'bottom'
    });
    await toast.present();
  }

  goBack() {
    this.stopScan();
    this.router.navigate(['/admin']);
  }
}
