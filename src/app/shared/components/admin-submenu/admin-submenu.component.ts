import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-admin-submenu',
  templateUrl: './admin-submenu.component.html',
  styleUrls: ['./admin-submenu.component.scss'],
  standalone:false
})
export class AdminSubmenuComponent {
  @Output() navigate = new EventEmitter<string>();

  go(route: string) {
    this.navigate.emit(route);
  }
}
