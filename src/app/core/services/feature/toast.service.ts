import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly DEFAULT_DURATION = 4000;
  private readonly DEFAULT_POSITION = 'top-right';

  constructor() {
    this.injectStyles();
  }

  /**
   * Show success toast
   */
  success(message: string, duration?: number): void {
    this.show({ message, type: 'success', duration });
  }

  /**
   * Show error toast
   */
  error(message: string, duration?: number): void {
    this.show({ message, type: 'error', duration });
  }

  /**
   * Show warning toast
   */
  warning(message: string, duration?: number): void {
    this.show({ message, type: 'warning', duration });
  }

  /**
   * Show info toast
   */
  info(message: string, duration?: number): void {
    this.show({ message, type: 'info', duration });
  }

  /**
   * Show toast with custom configuration
   */
  show(config: ToastConfig): void {
    const {
      message,
      type = 'info',
      duration = this.DEFAULT_DURATION,
      position = this.DEFAULT_POSITION
    } = config;

    const toast = this.createToastElement(message, type, position);
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-remove
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  /**
   * Create toast element
   */
  private createToastElement(message: string, type: ToastType, position: string): HTMLElement {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type} toast-${position}`;

    const { bgColor, icon } = this.getTypeStyles(type);
    
    toast.style.cssText = `
      position: fixed;
      ${this.getPositionStyles(position)}
      background: ${bgColor};
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 250px;
      max-width: 400px;
      opacity: 0;
      transform: ${this.getInitialTransform(position)};
      transition: all 0.3s ease-out;
      cursor: pointer;
    `;

    toast.innerHTML = `
      <i class="bi bi-${icon}" style="font-size: 20px; flex-shrink: 0;"></i>
      <span style="flex: 1;">${message}</span>
      <i class="bi bi-x" style="font-size: 18px; opacity: 0.7; cursor: pointer; flex-shrink: 0;"></i>
    `;

    // Click to dismiss
    toast.addEventListener('click', () => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    });

    return toast;
  }

  /**
   * Get type-specific styles
   */
  private getTypeStyles(type: ToastType): { bgColor: string; icon: string } {
    const styles = {
      success: { bgColor: '#28a745', icon: 'check-circle-fill' },
      error: { bgColor: '#dc3545', icon: 'x-circle-fill' },
      warning: { bgColor: '#ffc107', icon: 'exclamation-triangle-fill' },
      info: { bgColor: '#17a2b8', icon: 'info-circle-fill' }
    };
    return styles[type];
  }

  /**
   * Get position styles
   */
  private getPositionStyles(position: string): string {
    const positions: Record<string, string> = {
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;',
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-center': 'top: 20px; left: 50%; transform: translateX(-50%);',
      'bottom-center': 'bottom: 20px; left: 50%; transform: translateX(-50%);'
    };
    return positions[position] || positions['top-right'];
  }

  /**
   * Get initial transform for animation
   */
  private getInitialTransform(position: string): string {
    if (position.includes('right')) return 'translateX(100%)';
    if (position.includes('left')) return 'translateX(-100%)';
    if (position.includes('top')) return 'translateY(-100%)';
    if (position.includes('bottom')) return 'translateY(100%)';
    return 'scale(0.8)';
  }

  /**
   * Inject global styles
   */
  private injectStyles(): void {
    if (document.getElementById('toast-styles')) return;

    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast-notification.show {
        opacity: 1 !important;
        transform: translate(0, 0) !important;
      }

      .toast-notification.hide {
        opacity: 0 !important;
        transform: scale(0.8) !important;
      }

      .toast-notification:hover {
        box-shadow: 0 6px 16px rgba(0,0,0,0.3);
        transform: scale(1.02);
      }
    `;
    document.head.appendChild(style);
  }
}