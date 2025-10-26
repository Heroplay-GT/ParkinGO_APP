import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  standalone: false
})
export class InputComponent {
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() value: string | null = null;
  @Input() icon: string | null = null;

  @Output() valueChange = new EventEmitter<string>();

  onInput(event: any) {
    const v = event?.detail?.value ?? event?.target?.value ?? '';
    this.valueChange.emit(v);
  }
}
