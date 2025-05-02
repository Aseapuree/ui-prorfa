import { CommonModule } from '@angular/common';
import { Component, HostListener, Input } from '@angular/core';

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

  @HostListener('mouseenter')
  showTooltip() {
    this.isVisible = true;
  }

  @HostListener('mouseleave')
  hideTooltip() {
    this.isVisible = false;
  }
}
