import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScanQrSalidaPage } from './scan-qr-salida.page';

describe('ScanQrSalidaPage', () => {
  let component: ScanQrSalidaPage;
  let fixture: ComponentFixture<ScanQrSalidaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanQrSalidaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
