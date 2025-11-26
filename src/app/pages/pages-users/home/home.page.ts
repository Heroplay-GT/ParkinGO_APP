import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit, OnDestroy {

  // Secret code detection - KONAMI CODE
  private secretCode: string[] = [];
  private secretSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  private keyDownListener: any;

  // Triple tap detection
  private tapSequence: number[] = [];
  private lastTapTime = 0;
  private clickListener: any;

  constructor(private router: Router) {}

  ngOnInit() {
    this.setupSecretCodeListener();
    this.setupTripleTapListener();
    console.log('HomePage initialized - Secret code listener activated');
  }

  ngOnDestroy() {
    this.removeSecretCodeListener();
    this.removeTripleTapListener();
  }

  // ========================================
  // KONAMI CODE
  // ========================================

  // ----------------------------------------
  // SETUP SECRET CODE LISTENER
  // ----------------------------------------
  private setupSecretCodeListener() {
    this.keyDownListener = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      console.log('Key pressed:', key);

      this.secretCode.push(key);
      this.secretCode = this.secretCode.slice(-this.secretSequence.length);

      console.log('Current sequence:', this.secretCode.join(','));
      console.log('Target sequence:', this.secretSequence.join(','));
      console.log('Progress:', this.secretCode.length, '/', this.secretSequence.length);

      // Comparar directamente sin convertir a minúsculas la secuencia
      const currentString = this.secretCode.join(',');
      const targetString = this.secretSequence.map(k => k.toLowerCase()).join(',');

      if (currentString === targetString) {
        console.log('✅ KONAMI CODE MATCHED!');
        this.triggerSecretAccess('konami');
        this.secretCode = []; // Reinicia después de completar
      }
    };

    window.addEventListener('keydown', this.keyDownListener);
  }

  // ----------------------------------------
  // REMOVE SECRET CODE LISTENER
  // ----------------------------------------
  private removeSecretCodeListener() {
    if (this.keyDownListener) {
      window.removeEventListener('keydown', this.keyDownListener);
    }
  }

  // ========================================
  // TRIPLE TAP
  // ========================================

  // ----------------------------------------
  // SETUP TRIPLE TAP LISTENER
  // ----------------------------------------
  private setupTripleTapListener() {
    this.clickListener = (event: MouseEvent) => {
      const now = Date.now();

      // Si pasó menos de 300ms desde el último click
      if (now - this.lastTapTime < 300) {
        this.tapSequence.push(1);
        console.log('Tap detected! Total taps:', this.tapSequence.length);
      } else {
        // Si pasó más de 300ms, reinicia
        this.tapSequence = [1];
        console.log('Tap sequence reset');
      }

      this.lastTapTime = now;

      // Si tenemos 3 taps, activa el acceso secreto
      if (this.tapSequence.length === 3) {
        console.log('✅ TRIPLE TAP MATCHED!');
        this.triggerSecretAccess('triple-tap');
        this.tapSequence = [];
      }
    };

    document.addEventListener('click', this.clickListener);
  }

  // ----------------------------------------
  // REMOVE TRIPLE TAP LISTENER
  // ----------------------------------------
  private removeTripleTapListener() {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }

  // ========================================
  // TRIGGER SECRET ACCESS
  // ========================================

  // ----------------------------------------
  // TRIGGER SECRET ACCESS
  // ----------------------------------------
  private triggerSecretAccess(method: string) {
    console.log(`🔓 Secret access triggered via ${method}!`);
    this.showSecretAnimation();

    setTimeout(() => {
      console.log('Navigating to admin login...');
      this.router.navigate(['login-admin']).then(success => {
        console.log('✅ Navigation success:', success);
      }).catch(err => {
        console.error('❌ Navigation error:', err);
      });
    }, 1500);
  }

  // ----------------------------------------
  // SHOW SECRET ANIMATION
  // ----------------------------------------
  private showSecretAnimation() {
    // Remover overlay anterior si existe
    const existingOverlay = document.querySelector('.secret-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'secret-overlay';
    overlay.innerHTML = `
      <div class="secret-content">
        <ion-icon name="lock-open"></ion-icon>
        <h1>🔓 ACCESS GRANTED</h1>
        <p>Welcome, Admin...</p>
      </div>
    `;
    document.body.appendChild(overlay);

    // Forzar repaint
    overlay.offsetHeight;

    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);

    // Remover overlay después de la animación
    setTimeout(() => {
      overlay.remove();
    }, 3000);
  }
}
