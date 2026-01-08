/**
 * pewpi-shared Index Shim
 * Safe loader and initializer for pewpi-shared library
 * 
 * This shim provides defensive initialization of all pewpi-shared services
 * and ensures non-destructive integration with existing code.
 */

(function(global) {
  'use strict';

  // Check if already loaded
  if (global.PewpiShared) {
    console.warn('[pewpi-shared] Already loaded');
    return;
  }

  // Service container
  const services = {};
  let initialized = false;
  let initializing = false;

  /**
   * Load a service module safely
   * @param {string} name - Service name
   * @param {string} path - Module path
   * @returns {object|null} - Service instance or null
   */
  function loadService(name, path) {
    try {
      // Browser environment
      if (typeof document !== 'undefined') {
        // Services are loaded via separate script tags or modules
        // They register themselves on window
        return global[name] || null;
      }
      
      // Node.js environment
      if (typeof require !== 'undefined') {
        return require(path);
      }

      console.warn(`[pewpi-shared] Unable to load ${name} in this environment`);
      return null;
    } catch (error) {
      console.error(`[pewpi-shared] Failed to load ${name}:`, error);
      return null;
    }
  }

  /**
   * Initialize all pewpi-shared services
   * @param {object} options - Initialization options
   * @returns {Promise<boolean>} - Success status
   */
  async function initialize(options = {}) {
    if (initialized) {
      console.log('[pewpi-shared] Already initialized');
      return true;
    }

    if (initializing) {
      console.log('[pewpi-shared] Initialization in progress...');
      // Wait for initialization to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (initialized) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
      });
    }

    initializing = true;
    console.log('[pewpi-shared] Initializing services...');

    try {
      // Determine base path
      const basePath = options.basePath || './src/pewpi-shared';

      // Load services (in browser, they should be pre-loaded or loaded via script tags)
      // In Node.js, we'll require them

      // Token Service
      console.log('[pewpi-shared] Loading Token Service...');
      services.tokenService = loadService('TokenService', `${basePath}/token-service.js`);
      if (services.tokenService) {
        await services.tokenService.initialize();
        console.log('[pewpi-shared] ✓ Token Service ready');
      }

      // Auth Service
      console.log('[pewpi-shared] Loading Auth Service...');
      services.authService = loadService('AuthService', `${basePath}/auth-service.js`);
      if (services.authService && services.tokenService) {
        await services.authService.initialize(services.tokenService);
        console.log('[pewpi-shared] ✓ Auth Service ready');
      }

      // Wallet Unified
      console.log('[pewpi-shared] Loading Wallet Unified...');
      services.walletUnified = loadService('WalletUnified', `${basePath}/wallet-unified.js`);
      if (services.walletUnified && services.authService) {
        await services.walletUnified.initialize(services.authService);
        console.log('[pewpi-shared] ✓ Wallet Unified ready');
      }

      // Integration Listener
      console.log('[pewpi-shared] Loading Integration Listener...');
      services.integrationListener = loadService('IntegrationListener', `${basePath}/integration-listener.js`);
      if (services.integrationListener) {
        await services.integrationListener.initialize();
        console.log('[pewpi-shared] ✓ Integration Listener ready');
      }

      // Machines Adapter
      console.log('[pewpi-shared] Loading Machines Adapter...');
      services.machinesAdapter = loadService('MachinesAdapter', `${basePath}/machines/adapter.js`);
      if (services.machinesAdapter) {
        await services.machinesAdapter.initialize();
        console.log('[pewpi-shared] ✓ Machines Adapter ready');
      }

      // UI Shim
      console.log('[pewpi-shared] Loading UI Shim...');
      services.uiShim = loadService('UIShim', `${basePath}/ui-shim.js`);
      if (services.uiShim) {
        await services.uiShim.initialize(options.ui || {});
        console.log('[pewpi-shared] ✓ UI Shim ready');
      }

      initialized = true;
      initializing = false;

      console.log('[pewpi-shared] All services initialized successfully! ∞');
      
      // Emit initialization complete event
      if (services.integrationListener) {
        await services.integrationListener.emit('pewpi-shared:initialized', {
          services: Object.keys(services),
          timestamp: Date.now()
        });
      }

      return true;
    } catch (error) {
      console.error('[pewpi-shared] Initialization failed:', error);
      initializing = false;
      return false;
    }
  }

  /**
   * Get service status
   * @returns {object} - Status of all services
   */
  function getStatus() {
    const status = {
      initialized: initialized,
      initializing: initializing,
      services: {}
    };

    for (const [name, service] of Object.entries(services)) {
      if (service && typeof service.getStatus === 'function') {
        status.services[name] = service.getStatus();
      } else {
        status.services[name] = { loaded: !!service };
      }
    }

    return status;
  }

  /**
   * Safe service accessor
   * @param {string} serviceName - Name of service to get
   * @returns {object|null} - Service instance or null
   */
  function getService(serviceName) {
    if (!initialized) {
      console.warn('[pewpi-shared] Not initialized yet. Call PewpiShared.initialize() first.');
      return null;
    }

    return services[serviceName] || null;
  }

  /**
   * Auto-load services in browser environment
   * This dynamically loads service scripts if they haven't been loaded yet
   */
  async function autoLoad() {
    if (typeof document === 'undefined') {
      return; // Not in browser
    }

    const basePath = 'src/pewpi-shared';
    const serviceFiles = [
      'token-service.js',
      'auth-service.js',
      'wallet-unified.js',
      'integration-listener.js',
      'machines/adapter.js',
      'ui-shim.js'
    ];

    // Check if script is already loaded
    const scriptId = 'pewpi-shared-services';
    if (document.getElementById(scriptId)) {
      return; // Already loaded
    }

    // Load all service scripts
    const loadPromises = serviceFiles.map(file => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${basePath}/${file}`;
        script.async = false; // Maintain order
        script.onload = () => resolve();
        script.onerror = () => {
          console.warn(`[pewpi-shared] Failed to load ${file}, will continue`);
          resolve(); // Don't fail initialization
        };
        
        // Mark first script with ID
        if (file === serviceFiles[0]) {
          script.id = scriptId;
        }
        
        document.head.appendChild(script);
      });
    });

    await Promise.all(loadPromises);
    console.log('[pewpi-shared] Service scripts loaded');
  }

  // Create PewpiShared namespace
  const PewpiShared = {
    // Version
    version: '1.0.0',

    // Services container
    services: services,

    // Initialization
    initialize: initialize,

    // Status
    getStatus: getStatus,

    // Service accessor
    getService: getService,

    // Auto-load
    autoLoad: autoLoad,

    // Utilities
    utils: {
      /**
       * Check if running in browser
       * @returns {boolean}
       */
      isBrowser: () => typeof window !== 'undefined' && typeof document !== 'undefined',

      /**
       * Check if running in Node.js
       * @returns {boolean}
       */
      isNode: () => typeof process !== 'undefined' && process.versions && process.versions.node,

      /**
       * Safe JSON parse
       * @param {string} json - JSON string
       * @param {*} fallback - Fallback value
       * @returns {*} - Parsed object or fallback
       */
      safeJsonParse: (json, fallback = null) => {
        try {
          return JSON.parse(json);
        } catch (error) {
          return fallback;
        }
      },

      /**
       * Debounce function
       * @param {function} func - Function to debounce
       * @param {number} wait - Wait time in ms
       * @returns {function} - Debounced function
       */
      debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      }
    }
  };

  // Export to global scope
  global.PewpiShared = PewpiShared;

  // Export for Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PewpiShared;
  }

  // Auto-initialize in browser if desired
  if (typeof document !== 'undefined') {
    // Wait for DOM ready
    const initWhenReady = async () => {
      await autoLoad();
      // Auto-initialize can be enabled via data attribute
      const autoInit = document.querySelector('script[data-pewpi-auto-init="true"]');
      if (autoInit) {
        await initialize();
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWhenReady);
    } else {
      // DOM is already ready, execute immediately
      initWhenReady();
    }
  }

  console.log('[pewpi-shared] Index shim loaded. Call PewpiShared.initialize() to start.');

})(typeof window !== 'undefined' ? window : global);
