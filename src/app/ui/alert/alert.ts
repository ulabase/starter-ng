import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  input,
  output,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'app-alert',
  template: `
    <div
      [class]="type() === 'success' ? 'success-msg' : 'form-error'"
      [attr.role]="type() === 'success' ? 'status' : 'alert'"
    >
      <span class="alert-content"><ng-content /></span>
      @if (dismissible()) {
        <button type="button" class="alert-dismiss" (click)="close.emit()" aria-label="Dismiss">
          &times;
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    :host {
      display: block;
    }
    div {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .alert-content {
      flex: 1;
    }
    .alert-dismiss {
      flex-shrink: 0;
      font: inherit;
      font-size: 1.125rem;
      line-height: 1;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      opacity: 0.6;
      color: inherit;
    }
    .alert-dismiss:hover {
      opacity: 1;
    }
  `,
})
export class Alert implements OnInit {
  type = input.required<'success' | 'error'>();
  dismissible = input(true);
  autoDismiss = input(4000);
  close = output<void>();

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const ms = this.autoDismiss();
    if (ms > 0) {
      const id = setTimeout(() => this.close.emit(), ms);
      this.destroyRef.onDestroy(() => clearTimeout(id));
    }
  }
}
