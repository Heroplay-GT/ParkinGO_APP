import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  standalone: false
})
export class ButtonComponent {
  @Input() color: string = 'primary';
  @Input() expand: 'block' | 'full' | 'none' = 'block';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;

  @Output() btnClick = new EventEmitter<void>();

  onClick() {
    if (this.disabled || this.loading) return;
    this.btnClick.emit();
  }
}
