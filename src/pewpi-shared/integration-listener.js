/**
 * Integration Listener - Listens for events and manages integration hooks
 * Part of pewpi-shared unified library
 */

class IntegrationListener {
  constructor() {
    this.initialized = false;
    this.listeners = new Map();
    this.eventQueue = [];
    this.processing = false;
  }

  /**
   * Initialize the integration listener
   * @returns {Promise<boolean>} - Success status
   */
  async initialize() {
    try {
      if (this.initialized) {
        console.warn('[IntegrationListener] Already initialized');
        return true;
      }

      this.listeners.clear();
      this.eventQueue = [];
      this.initialized = true;

      console.log('[IntegrationListener] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[IntegrationListener] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Register an event listener
   * @param {string} eventType - Type of event to listen for
   * @param {function} handler - Event handler function
   * @param {object} options - Listener options
   * @returns {string} - Listener ID
   */
  on(eventType, handler, options = {}) {
    if (!this.initialized) {
      throw new Error('[IntegrationListener] Not initialized');
    }

    const listenerId = this._generateListenerId();
    
    const listener = {
      id: listenerId,
      eventType: eventType,
      handler: handler,
      options: {
        once: options.once || false,
        priority: options.priority || 0
      },
      registeredAt: Date.now()
    };

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType).push(listener);

    // Sort by priority (higher priority first)
    this.listeners.get(eventType).sort((a, b) => b.options.priority - a.options.priority);

    console.log(`[IntegrationListener] Registered listener: ${eventType} (${listenerId})`);
    return listenerId;
  }

  /**
   * Remove an event listener
   * @param {string} listenerId - Listener ID to remove
   * @returns {boolean} - Success status
   */
  off(listenerId) {
    if (!this.initialized) {
      throw new Error('[IntegrationListener] Not initialized');
    }

    for (const [eventType, listeners] of this.listeners.entries()) {
      const index = listeners.findIndex(l => l.id === listenerId);
      if (index !== -1) {
        listeners.splice(index, 1);
        console.log(`[IntegrationListener] Removed listener: ${listenerId}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Emit an event
   * @param {string} eventType - Type of event to emit
   * @param {object} eventData - Event data
   * @returns {Promise<void>}
   */
  async emit(eventType, eventData = {}) {
    if (!this.initialized) {
      throw new Error('[IntegrationListener] Not initialized');
    }

    const event = {
      type: eventType,
      data: eventData,
      timestamp: Date.now(),
      id: this._generateEventId()
    };

    console.log(`[IntegrationListener] Emitting event: ${eventType}`, eventData);

    // Add to queue
    this.eventQueue.push(event);

    // Process queue
    await this._processQueue();
  }

  /**
   * Process event queue
   * @private
   * @returns {Promise<void>}
   */
  async _processQueue() {
    if (this.processing || this.eventQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      await this._processEvent(event);
    }

    this.processing = false;
  }

  /**
   * Process a single event
   * @private
   * @param {object} event - Event to process
   * @returns {Promise<void>}
   */
  async _processEvent(event) {
    const listeners = this.listeners.get(event.type);
    
    if (!listeners || listeners.length === 0) {
      return;
    }

    // Execute listeners
    const toRemove = [];

    for (const listener of listeners) {
      try {
        await listener.handler(event.data, event);
        
        // Remove if 'once' option is set
        if (listener.options.once) {
          toRemove.push(listener.id);
        }
      } catch (error) {
        console.error(`[IntegrationListener] Handler error for ${event.type}:`, error);
      }
    }

    // Remove 'once' listeners
    toRemove.forEach(id => this.off(id));
  }

  /**
   * Get all listeners for an event type
   * @param {string} eventType - Event type
   * @returns {array} - Array of listeners
   */
  getListeners(eventType) {
    if (!this.initialized) {
      throw new Error('[IntegrationListener] Not initialized');
    }

    return this.listeners.get(eventType) || [];
  }

  /**
   * Clear all listeners
   * @param {string} eventType - Optional event type to clear (clears all if not specified)
   * @returns {number} - Number of listeners cleared
   */
  clearListeners(eventType = null) {
    if (!this.initialized) {
      throw new Error('[IntegrationListener] Not initialized');
    }

    if (eventType) {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const count = listeners.length;
        this.listeners.delete(eventType);
        console.log(`[IntegrationListener] Cleared ${count} listeners for ${eventType}`);
        return count;
      }
      return 0;
    } else {
      let total = 0;
      for (const listeners of this.listeners.values()) {
        total += listeners.length;
      }
      this.listeners.clear();
      console.log(`[IntegrationListener] Cleared all ${total} listeners`);
      return total;
    }
  }

  /**
   * Generate a unique listener ID
   * @private
   * @returns {string} - Listener ID
   */
  _generateListenerId() {
    return `lst_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate a unique event ID
   * @private
   * @returns {string} - Event ID
   */
  _generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get service status
   * @returns {object} - Service status
   */
  getStatus() {
    const listenerCounts = {};
    let totalListeners = 0;

    for (const [eventType, listeners] of this.listeners.entries()) {
      listenerCounts[eventType] = listeners.length;
      totalListeners += listeners.length;
    }

    return {
      initialized: this.initialized,
      totalListeners: totalListeners,
      eventTypes: this.listeners.size,
      listenerCounts: listenerCounts,
      queuedEvents: this.eventQueue.length,
      processing: this.processing
    };
  }
}

// Export as singleton
const integrationListener = new IntegrationListener();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = integrationListener;
}

if (typeof window !== 'undefined') {
  window.IntegrationListener = integrationListener;
}
