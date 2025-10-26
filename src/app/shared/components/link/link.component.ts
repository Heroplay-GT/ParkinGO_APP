import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-link',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss'],
  standalone: false
})
export class LinkComponent {
  @Input() text: string = '';
  @Input() color: string = 'primary';
  @Output() linkClick = new EventEmitter<void>();

  onClick() {
    this.linkClick.emit();
  }
}
