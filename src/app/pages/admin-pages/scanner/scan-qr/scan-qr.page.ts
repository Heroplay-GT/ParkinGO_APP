import { Component, OnDestroy } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { Result } from '@zxing/library';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-scan-qr',
  templateUrl: './scan-qr.page.html',
  styleUrls: ['./scan-qr.page.scss'],
  standalone: false
})
export class ScanQrPage implements OnDestroy {

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
    console.log('startScan called - INGRESO');
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
      console.log('scanNative started - INGRESO');
      
      // Verificar permisos
      console.log('Checking permissions...');
      const granted = await BarcodeScanner.checkPermissions();
      console.log('Permissions result:', granted);
      
      if (granted.camera !== 'granted') {
        console.log('Requesting permissions...');
        const requested = await BarcodeScanner.requestPermissions();
        console.log('Request result:', requested);
        
        if (requested.camera !== 'granted') {
          this.showToast('Camera permission denied', 'danger');
          this.scanning = false;
          return;
        }
      }

      console.log('Permissions granted, starting scan...');
      
      // Ocultar el fondo de la web
      document.body.classList.add('barcode-scanner-active');

      // Agregar listener para los códigos escaneados
      const listener = await BarcodeScanner.addListener(
        'barcodesScanned',
        async (result) => {
          console.log('Barcode scanned:', result);
          if (!this.scanning) return;
          if (result.barcodes && result.barcodes.length > 0) {
            await this.processQR(result.barcodes[0].displayValue);
          }
        }
      );

      // Iniciar el escaneo
      console.log('Calling BarcodeScanner.startScan()...');
      await BarcodeScanner.startScan();
      console.log('Scanner started successfully');

    } catch (err) {
      console.error('Error en scanNative:', err);
      this.showToast('Native scanner error: ' + (err as any).message, 'danger');
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
      this.showToast('Video element no encontrado', 'danger');
      this.scanning = false;
      return;
    }

    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      video.srcObject = this.videoStream;
      await video.play();

      // decodeFromVideoDevice returns a promise; provide a callback to handle results
      await this.webScanner.decodeFromVideoDevice(
        undefined,
        video,
        async (result: Result | undefined) => {
          if (!this.scanning) return;
          if (result) {
            await this.processQR(result.getText());
          }
        }
      );

    } catch (err) {
      console.error(err);
      this.showToast('Web scanner error', 'danger');
      this.scanning = false;
    }
  }

  // ----------------------------------------
  // PROCESS QR CONTENT
  // ----------------------------------------
  async processQR(raw: string) {
    try {
      if (!raw) {
        this.showToast('QR vacío', 'warning');
        return;
      }

      const data = JSON.parse(raw);
      const id = data.id;
      if (!id) {
        this.showToast('QR inválido (id faltante)', 'danger');
        return;
      }

      const ref = doc(this.firestore, 'reservations', id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        this.showToast('Reservation not found', 'warning');
        return;
      }

      const res: any = snap.data();

      if (res.status !== 'pending') {
        this.showToast('Reservation already used', 'danger');
        return;
      }

      // Activate reservation
      await updateDoc(ref, {
        status: 'active',
        entryTime: new Date()
      });

      if (res.spaceId) {
        await updateDoc(doc(this.firestore, 'spaces', res.spaceId), {
          status: 'Occupied'
        });
      }

      this.showToast(`Vehicle ${res.plate} entered!`, 'success');

      this.stopScan();
      this.router.navigate(['/ingreso']);

    } catch (err) {
      console.error(err);
      this.showToast('Invalid QR format', 'danger');
    }
  }

  // ----------------------------------------
  async showToast(message: string, color: string) {
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
    this.router.navigate(['/ingreso']);
  }
}
