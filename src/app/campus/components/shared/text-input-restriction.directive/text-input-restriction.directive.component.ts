import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { TEXT_ONLY_INTERMEDIATE_REGEX, ALPHANUMERIC_INTERMEDIATE_REGEX } from '../../../../general/components/const/const';
import { NotificationService } from '../notificaciones/notification.service';


@Directive({
  selector: '[appTextInputRestriction]', // ← Así sí funciona
  standalone: true,
})
export class TextInputRestrictionDirective {
  @Input('appTextInputRestriction') type: 'text-only' | 'alphanumeric' | 'abbreviation' = 'text-only';

  private lastValidValue = '';

  constructor(
    private el: ElementRef,
    private notification: NotificationService
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = this.el.nativeElement as HTMLInputElement | HTMLTextAreaElement;
    let value = input.value;

    // 1. Bloquear espacio al inicio
    if (value.startsWith(' ')) {
      input.value = this.lastValidValue;
      this.notification.showNotification('No se permite espacio al inicio.', 'info');
      return;
    }

    // 2. Reemplazar espacios múltiples por uno solo
    value = value.replace(/\s+/g, ' ');

    // 3. Validar según tipo
    if (this.type === 'abbreviation') {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Solo letras mayúsculas y números
      input.value = value;
      this.lastValidValue = value;
      return;
    }

    const regex = this.type === 'text-only'
      ? TEXT_ONLY_INTERMEDIATE_REGEX
      : ALPHANUMERIC_INTERMEDIATE_REGEX;

    if (!regex.test(value)) {
      input.value = this.lastValidValue;
      this.notification.showNotification(
        this.type === 'text-only'
          ? 'Solo se permiten letras, acentos y ñ.'
          : 'Solo letras, números, acentos y ñ.',
        'info'
      );
    } else {
      this.lastValidValue = value;
      input.value = value;
    }
  }

  @HostListener('blur')
  onBlur() {
    const input = this.el.nativeElement as HTMLInputElement | HTMLTextAreaElement;
    let value = input.value.trim();

    if (value && this.type !== 'abbreviation') {
      value = value.replace(/\s+/g, ' ');
      input.value = value;
      this.lastValidValue = value;
    }
  }
}