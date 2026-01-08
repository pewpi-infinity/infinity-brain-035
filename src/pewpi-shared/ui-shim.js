/**
 * UI Shim - Provides UI utilities and components for pewpi-shared
 * Part of pewpi-shared unified library
 */

class UIShim {
  constructor() {
    this.initialized = false;
    this.components = new Map();
    this.theme = 'dark';
  }

  /**
   * Initialize the UI shim
   * @param {object} options - Initialization options
   * @returns {Promise<boolean>} - Success status
   */
  async initialize(options = {}) {
    try {
      if (this.initialized) {
        console.warn('[UIShim] Already initialized');
        return true;
      }

      this.theme = options.theme || 'dark';
      this.components.clear();

      // Inject base styles if in browser environment
      if (typeof document !== 'undefined') {
        this._injectBaseStyles();
      }

      this.initialized = true;
      console.log('[UIShim] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[UIShim] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Create a notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type ('info', 'success', 'warning', 'error')
   * @param {number} duration - Display duration in milliseconds
   * @returns {string} - Notification ID
   */
  notify(message, type = 'info', duration = 3000) {
    if (!this.initialized) {
      console.warn('[UIShim] Not initialized, logging notification:', message);
      return null;
    }

    if (typeof document === 'undefined') {
      console.log(`[UIShim] Notification [${type}]: ${message}`);
      return null;
    }

    const notificationId = `notif_${Date.now()}`;
    const notification = this._createNotificationElement(notificationId, message, type);

    document.body.appendChild(notification);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismissNotification(notificationId);
      }, duration);
    }

    return notificationId;
  }

  /**
   * Dismiss a notification
   * @param {string} notificationId - Notification ID
   * @returns {boolean} - Success status
   */
  dismissNotification(notificationId) {
    if (typeof document === 'undefined') {
      return false;
    }

    const notification = document.getElementById(notificationId);
    if (notification) {
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.remove();
      }, 300);
      return true;
    }

    return false;
  }

  /**
   * Create a modal dialog
   * @param {object} config - Modal configuration
   * @returns {string} - Modal ID
   */
  createModal(config) {
    if (!this.initialized) {
      throw new Error('[UIShim] Not initialized');
    }

    if (typeof document === 'undefined') {
      console.log('[UIShim] Modal cannot be created in non-browser environment');
      return null;
    }

    const modalId = config.id || `modal_${Date.now()}`;
    const modal = this._createModalElement(modalId, config);

    document.body.appendChild(modal);
    this.components.set(modalId, modal);

    return modalId;
  }

  /**
   * Show a modal
   * @param {string} modalId - Modal ID
   * @returns {boolean} - Success status
   */
  showModal(modalId) {
    if (typeof document === 'undefined') {
      return false;
    }

    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
      return true;
    }

    return false;
  }

  /**
   * Hide a modal
   * @param {string} modalId - Modal ID
   * @returns {boolean} - Success status
   */
  hideModal(modalId) {
    if (typeof document === 'undefined') {
      return false;
    }

    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      return true;
    }

    return false;
  }

  /**
   * Create a button element
   * @param {object} config - Button configuration
   * @returns {HTMLElement|null} - Button element
   */
  createButton(config) {
    if (typeof document === 'undefined') {
      return null;
    }

    const button = document.createElement('button');
    button.textContent = config.label || 'Button';
    button.className = 'pewpi-button';
    
    if (config.variant) {
      button.classList.add(`pewpi-button-${config.variant}`);
    }

    if (config.onClick) {
      button.addEventListener('click', config.onClick);
    }

    return button;
  }

  /**
   * Create a loading spinner
   * @param {object} config - Spinner configuration
   * @returns {HTMLElement|null} - Spinner element
   */
  createSpinner(config = {}) {
    if (typeof document === 'undefined') {
      return null;
    }

    const spinner = document.createElement('div');
    spinner.className = 'pewpi-spinner';
    spinner.innerHTML = `
      <div class="pewpi-spinner-inner"></div>
    `;

    if (config.size) {
      spinner.style.width = config.size;
      spinner.style.height = config.size;
    }

    return spinner;
  }

  /**
   * Inject base styles
   * @private
   */
  _injectBaseStyles() {
    const styleId = 'pewpi-shared-styles';
    
    if (document.getElementById(styleId)) {
      return; // Already injected
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .pewpi-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 300px;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        z-index: 10000;
        opacity: 1;
        transition: opacity 0.3s ease;
      }

      .pewpi-notification-info {
        background: #0ea5e9;
        color: white;
      }

      .pewpi-notification-success {
        background: #10b981;
        color: white;
      }

      .pewpi-notification-warning {
        background: #f59e0b;
        color: white;
      }

      .pewpi-notification-error {
        background: #ef4444;
        color: white;
      }

      .pewpi-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .pewpi-modal-content {
        background: ${this.theme === 'dark' ? '#1f2937' : 'white'};
        color: ${this.theme === 'dark' ? 'white' : '#1f2937'};
        padding: 24px;
        border-radius: 12px;
        min-width: 400px;
        max-width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }

      .pewpi-modal-header {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 16px;
      }

      .pewpi-modal-body {
        margin-bottom: 20px;
      }

      .pewpi-modal-footer {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .pewpi-button {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .pewpi-button-primary {
        background: #0ea5e9;
        color: white;
      }

      .pewpi-button-primary:hover {
        background: #0284c7;
      }

      .pewpi-button-secondary {
        background: #6b7280;
        color: white;
      }

      .pewpi-button-secondary:hover {
        background: #4b5563;
      }

      .pewpi-spinner {
        width: 40px;
        height: 40px;
        position: relative;
      }

      .pewpi-spinner-inner {
        width: 100%;
        height: 100%;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-top-color: #0ea5e9;
        border-radius: 50%;
        animation: pewpi-spin 0.8s linear infinite;
      }

      @keyframes pewpi-spin {
        to { transform: rotate(360deg); }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Create notification element
   * @private
   * @param {string} id - Notification ID
   * @param {string} message - Message
   * @param {string} type - Type
   * @returns {HTMLElement} - Notification element
   */
  _createNotificationElement(id, message, type) {
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `pewpi-notification pewpi-notification-${type}`;
    notification.textContent = message;
    return notification;
  }

  /**
   * Create modal element
   * @private
   * @param {string} id - Modal ID
   * @param {object} config - Configuration
   * @returns {HTMLElement} - Modal element
   */
  _createModalElement(id, config) {
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'pewpi-modal';

    const content = document.createElement('div');
    content.className = 'pewpi-modal-content';

    if (config.title) {
      const header = document.createElement('div');
      header.className = 'pewpi-modal-header';
      header.textContent = config.title;
      content.appendChild(header);
    }

    if (config.body) {
      const body = document.createElement('div');
      body.className = 'pewpi-modal-body';
      body.innerHTML = config.body;
      content.appendChild(body);
    }

    if (config.buttons) {
      const footer = document.createElement('div');
      footer.className = 'pewpi-modal-footer';
      
      config.buttons.forEach(btnConfig => {
        const button = this.createButton(btnConfig);
        footer.appendChild(button);
      });

      content.appendChild(footer);
    }

    modal.appendChild(content);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideModal(id);
      }
    });

    return modal;
  }

  /**
   * Get service status
   * @returns {object} - Service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      theme: this.theme,
      components: this.components.size
    };
  }
}

// Export as singleton
const uiShim = new UIShim();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = uiShim;
}

if (typeof window !== 'undefined') {
  window.UIShim = uiShim;
}
