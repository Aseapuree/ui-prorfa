import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, ViewChild, ElementRef, inject } from '@angular/core';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.scss'
})
export class TooltipComponent {
  @Input() tooltipText: string = '';
  isVisible: boolean = false;
  position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  tooltipStyle: { [key: string]: string } = {};
  arrowStyle: { [key: string]: string } = {};
  fixedClasses: string = 'absolute flex items-center justify-center w-fit max-w-xs p-3 rounded-lg transition-opacity duration-200 text-sm break-words z-50';

  @ViewChild('tooltip') tooltipEl!: ElementRef;

  private elementRef = inject(ElementRef);

  get isDarkMode(): boolean {
    // Forzar modo claro por defecto si no hay clase 'dark' explícita
    return document.documentElement.classList.contains('dark');
  }

  @HostListener('mouseenter')
  showTooltip() {
    this.isVisible = true;
    setTimeout(() => {
      this.calculatePosition();
    }, 0);
  }

  @HostListener('mouseleave')
  hideTooltip() {
    this.isVisible = false;
  }

  private calculatePosition() {
    const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipEl.nativeElement.getBoundingClientRect();
    const offset = 12; // Margen para la flecha
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const space = {
      top: hostRect.top - offset,
      bottom: viewportHeight - hostRect.bottom - offset,
      left: hostRect.left - offset,
      right: viewportWidth - hostRect.right - offset
    };

    const tooltipSize = {
      height: tooltipRect.height,
      width: tooltipRect.width
    };

    // Prioridades: bottom, right, top, left
    const priorities = ['bottom', 'right', 'top', 'left'];
    this.position = 'bottom'; // Valor por defecto
    for (const dir of priorities) {
      if (
        (dir === 'top' && space.top > tooltipSize.height) ||
        (dir === 'bottom' && space.bottom > tooltipSize.height) ||
        (dir === 'left' && space.left > tooltipSize.width) ||
        (dir === 'right' && space.right > tooltipSize.width)
      ) {
        this.position = dir as 'top' | 'bottom' | 'left' | 'right';
        break;
      }
    }

    // Si no hay espacio en ninguno, elige el de mayor espacio disponible
    if (this.position === 'bottom' && space.bottom <= tooltipSize.height) {
      const maxSpaceDir = Object.keys(space).reduce((a, b) => space[a as keyof typeof space] > space[b as keyof typeof space] ? a : b);
      this.position = maxSpaceDir as 'top' | 'bottom' | 'left' | 'right';
    }

    // Limpiar estilos previos
    this.tooltipStyle = {};
    this.arrowStyle = {};

    let arrowDegrees = 0;
    const arrowHalfSize = 12; // Mitad del tamaño de la flecha (w-6 h-6 = 24px)

    switch (this.position) {
      case 'bottom':
        // Tooltip abajo
        const idealLeftB = hostRect.width / 2 - tooltipSize.width / 2;
        const leftB = Math.max(-hostRect.left, Math.min(idealLeftB, viewportWidth - hostRect.left - tooltipSize.width));
        this.tooltipStyle['top'] = `${hostRect.height + offset}px`;
        this.tooltipStyle['left'] = `${leftB}px`;
        const arrowLeftB = hostRect.width / 2 - leftB - arrowHalfSize;
        this.arrowStyle['left'] = `${arrowLeftB}px`;
        this.arrowStyle['top'] = `-${offset}px`;
        arrowDegrees = -90;
        break;
      case 'top':
        // Tooltip arriba
        const idealLeftT = hostRect.width / 2 - tooltipSize.width / 2;
        const leftT = Math.max(-hostRect.left, Math.min(idealLeftT, viewportWidth - hostRect.left - tooltipSize.width));
        this.tooltipStyle['bottom'] = `${hostRect.height + offset}px`;
        this.tooltipStyle['left'] = `${leftT}px`;
        const arrowLeftT = hostRect.width / 2 - leftT - arrowHalfSize;
        this.arrowStyle['left'] = `${arrowLeftT}px`;
        this.arrowStyle['bottom'] = `-${offset}px`;
        arrowDegrees = 90;
        break;
      case 'right':
        // Tooltip a la derecha
        const idealTopR = hostRect.height / 2 - tooltipSize.height / 2;
        const topR = Math.max(-hostRect.top, Math.min(idealTopR, viewportHeight - hostRect.top - tooltipSize.height));
        this.tooltipStyle['left'] = `${hostRect.width + offset}px`;
        this.tooltipStyle['top'] = `${topR}px`;
        const arrowTopR = hostRect.height / 2 - topR - arrowHalfSize;
        this.arrowStyle['top'] = `${arrowTopR}px`;
        this.arrowStyle['left'] = `-${offset}px`;
        arrowDegrees = 180;
        break;
      case 'left':
        // Tooltip a la izquierda
        const idealTopL = hostRect.height / 2 - tooltipSize.height / 2;
        const topL = Math.max(-hostRect.top, Math.min(idealTopL, viewportHeight - hostRect.top - tooltipSize.height));
        this.tooltipStyle['right'] = `${hostRect.width + offset}px`;
        this.tooltipStyle['top'] = `${topL}px`;
        const arrowTopL = hostRect.height / 2 - topL - arrowHalfSize;
        this.arrowStyle['top'] = `${arrowTopL}px`;
        this.arrowStyle['right'] = `-${offset}px`;
        arrowDegrees = 0;
        break;
    }

    this.arrowStyle['transform'] = `rotate(${arrowDegrees}deg)`;
  }
}
