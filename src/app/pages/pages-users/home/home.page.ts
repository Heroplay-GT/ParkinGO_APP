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
    console.log('🔓 HomePage initialized - Secret code listener ACTIVE');
  }

  ngOnDestroy() {
    console.log('🔒 HomePage destroyed - Removing listeners');
    this.removeSecretCodeListener();
    this.removeTripleTapListener();
  }

  ionViewWillLeave() {
    console.log('🔒 Leaving HomePage - Removing listeners');
    this.removeSecretCodeListener();
    this.removeTripleTapListener();
  }

  // ========================================
  // KONAMI CODE
  // ========================================

  private setupSecretCodeListener() {
    this.keyDownListener = (event: KeyboardEvent) => {
      console.log('Key pressed:', event.key);
      this.secretCode.push(event.key.toLowerCase());
      this.secretCode = this.secretCode.slice(-this.secretSequence.length);

      console.log('Current sequence:', this.secretCode.join(','));
      console.log('Target sequence:', this.secretSequence.join(','));

      const currentString = this.secretCode.join(',');
      const targetString = this.secretSequence.map(k => k.toLowerCase()).join(',');

      if (currentString === targetString) {
        console.log('✅ KONAMI CODE MATCHED!');
        this.triggerSecretAccess('konami');
        this.secretCode = [];
      }
    };

    window.addEventListener('keydown', this.keyDownListener);
    console.log('✓ Konami code listener added');
  }

  private removeSecretCodeListener() {
    if (this.keyDownListener) {
      window.removeEventListener('keydown', this.keyDownListener);
      this.keyDownListener = null;
      console.log('✓ Konami code listener removed');
    }
  }

  // ========================================
  // TRIPLE TAP
  // ========================================

  private setupTripleTapListener() {
    this.clickListener = (event: MouseEvent) => {
      const now = Date.now();

      if (now - this.lastTapTime < 300) {
        this.tapSequence.push(1);
        console.log('Tap detected! Total taps:', this.tapSequence.length);
      } else {
        this.tapSequence = [1];
        console.log('Tap sequence reset');
      }

      this.lastTapTime = now;

      if (this.tapSequence.length === 3) {
        console.log('✅ TRIPLE TAP MATCHED!');
        this.triggerSecretAccess('triple-tap');
        this.tapSequence = [];
      }
    };

    document.addEventListener('click', this.clickListener);
    console.log('✓ Triple tap listener added');
  }

  private removeTripleTapListener() {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
      this.clickListener = null;
      console.log('✓ Triple tap listener removed');
    }
  }

  // ========================================
  // TRIGGER SECRET ACCESS
  // ========================================

  private triggerSecretAccess(method: string) {
    console.log(`🔓 Secret access triggered via ${method}!`);

    // 🔹 Remover listeners antes de navegar
    this.removeSecretCodeListener();
    this.removeTripleTapListener();

    this.showSecretAnimation();

    setTimeout(() => {
      console.log('Navigating to admin login...');
      this.router.navigate(['login-admin']).then(success => {
        console.log('Navigation success:', success);
      }).catch(err => {
        console.error('Navigation error:', err);
      });
    }, 1500);
  }

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

    overlay.offsetHeight;

    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);

    setTimeout(() => {
      overlay.remove();
    }, 3000);
  }
}
