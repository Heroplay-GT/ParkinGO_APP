import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfigAdminPage } from './config-admin.page';

describe('ConfigAdminPage', () => {
  let component: ConfigAdminPage;
  let fixture: ComponentFixture<ConfigAdminPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigAdminPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
