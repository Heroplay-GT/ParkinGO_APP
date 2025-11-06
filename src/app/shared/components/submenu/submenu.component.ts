import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { IonIcon } from "@ionic/angular/standalone";

@Component({
  selector: 'app-submenu',
  templateUrl: './submenu.component.html',
  styleUrls: ['./submenu.component.scss'],
  standalone: false,
})
export class SubmenuComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

  @Output() navigate = new EventEmitter<string>();

  go(route: string) {
    this.navigate.emit(route);
  }
}

