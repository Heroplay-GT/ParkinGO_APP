import { Component, OnDestroy } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { Result } from '@zxing/library';

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
    private router: Router
  ) { }

  ngOnDestroy() {
    this.stopScan();
  }

  // ----------------------------------------
  // START SCAN
  // ----------------------------------------
  async startScan() {
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
      const granted = await BarcodeScanner.checkPermissions();
      if (granted.camera !== 'granted') {
        const requested = await BarcodeScanner.requestPermissions();
        if (requested.camera !== 'granted') {
          this.showToast('Camera permission denied', 'danger');
          this.scanning = false;
          return;
        }
      }

      // Ocultar el fondo de la web
      document.body.classList.add('barcode-scanner-active');

      const listener = await BarcodeScanner.addListener(
        'barcodesScanned',
        async (result) => {
          if (!this.scanning) return;
          if (result.barcodes && result.barcodes.length > 0) {
            await this.processQR(result.barcodes[0].displayValue);
          }
        }
      );

      await BarcodeScanner.startScan();

    } catch (err) {
      console.error(err);
      this.showToast('Native scanner error', 'danger');
      this.scanning = false;
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
  showToast(message: string, color: string) {
    const t: any = document.createElement('ion-toast');
    t.message = message;
    t.color = color;
    t.duration = 2000;
    document.body.appendChild(t);
    // present() returns a promise; fire-and-forget is fine here
    try { t.present(); } catch (e) { /* noop */ }
  }

  goBack() {
    this.stopScan();
    this.router.navigate(['/ingreso']);
  }
}
