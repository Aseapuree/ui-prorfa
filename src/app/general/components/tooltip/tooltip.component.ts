import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, ViewChild, ElementRef, inject, Renderer2, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.scss'
})
export class TooltipComponent implements AfterViewInit, OnDestroy {
  @Input() tooltipText: string = '';
  isVisible: boolean = false;
  position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  tooltipStyle: { [key: string]: string } = {};
  arrowStyle: { [key: string]: string } = {};
  fixedClasses: string = 'fixed flex items-center justify-center w-fit max-w-xs p-3 rounded-lg transition-opacity duration-200 text-sm break-words z-[9999]';

  @ViewChild('tooltip') tooltipEl!: ElementRef;

  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);

  get isDarkMode(): boolean {
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


  ngAfterViewInit(): void {

    if (this.tooltipEl) {
      this.renderer.appendChild(document.body, this.tooltipEl.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.tooltipEl) {
      this.renderer.removeChild(document.body, this.tooltipEl.nativeElement);
    }
  }


  private calculatePosition() {
    const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipEl.nativeElement.getBoundingClientRect();
    const offset = 10; // Margen para la flecha
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const space = {
      top: hostRect.top,
      bottom: viewportHeight - hostRect.bottom,
      left: hostRect.left,
      right: viewportWidth - hostRect.right
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
        (dir === 'top' && space.top >= tooltipSize.height + offset) ||
        (dir === 'bottom' && space.bottom >= tooltipSize.height + offset) ||
        (dir === 'left' && space.left >= tooltipSize.width + offset) ||
        (dir === 'right' && space.right >= tooltipSize.width + offset)
      ) {
        this.position = dir as 'top' | 'bottom' | 'left' | 'right';
        break;
      }
    }

    // Si no hay espacio en ninguno, elige el de mayor espacio disponible
    if (this.position === 'bottom' && space.bottom < tooltipSize.height + offset) {
      const maxSpaceDir = Object.keys(space).reduce((a, b) => space[a as keyof typeof space] > space[b as keyof typeof space] ? a : b);
      this.position = maxSpaceDir as 'top' | 'bottom' | 'left' | 'right';
    }

    // Limpiar estilos previos
    this.tooltipStyle = {};
    this.arrowStyle = {};

    let arrowDegrees = 0;
    const arrowHalfSize = 6; // Mitad del tamaño de la flecha

    // Calcular posición base del tooltip, alineado con el host
    let tooltipLeft = hostRect.left;
    let tooltipTop = hostRect.top;

    switch (this.position) {
      case 'bottom':
        tooltipTop = hostRect.bottom + offset;
        this.arrowStyle['top'] = `-${offset}px`;
        arrowDegrees = -90;
        break;
      case 'top':
        tooltipTop = hostRect.top - tooltipSize.height - offset;
        this.arrowStyle['bottom'] = `-${offset}px`;
        arrowDegrees = 90;
        break;
      case 'right':
        tooltipLeft = hostRect.right + offset;
        this.arrowStyle['left'] = `-${offset}px`;
        arrowDegrees = 180;
        break;
      case 'left':
        tooltipLeft = hostRect.left - tooltipSize.width - offset;
        this.arrowStyle['right'] = `-${offset}px`;
        arrowDegrees = 0;
        break;
    }

    // Asegurar que el tooltip no salga de la pantalla (clamp)
    tooltipLeft = Math.max(5, Math.min(tooltipLeft, viewportWidth - tooltipSize.width - 5));
    tooltipTop = Math.max(5, Math.min(tooltipTop, viewportHeight - tooltipSize.height - 5));

    // Aplicar estilos finales
    this.tooltipStyle['left'] = `${tooltipLeft}px`;
    this.tooltipStyle['top'] = `${tooltipTop}px`;

    // Posicionar la flecha para que apunte al centro del elemento host
    if (this.position === 'bottom' || this.position === 'top') {
      const arrowLeft = hostRect.left + hostRect.width / 2 - tooltipLeft - arrowHalfSize;
      this.arrowStyle['left'] = `${arrowLeft}px`;
    } else { // left or right
      const arrowTop = hostRect.top + hostRect.height / 2 - tooltipTop - arrowHalfSize;
      this.arrowStyle['top'] = `${arrowTop}px`;
    }

    this.arrowStyle['transform'] = `rotate(${arrowDegrees}deg)`;
  }
}
