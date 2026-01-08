/**
 * Machines Adapter - Adapts external machine/state interfaces to pewpi-shared
 * Part of pewpi-shared unified library
 */

class MachinesAdapter {
  constructor() {
    this.initialized = false;
    this.machines = new Map();
    this.states = new Map();
    this.transitions = new Map();
  }

  /**
   * Initialize the machines adapter
   * @returns {Promise<boolean>} - Success status
   */
  async initialize() {
    try {
      if (this.initialized) {
        console.warn('[MachinesAdapter] Already initialized');
        return true;
      }

      this.machines.clear();
      this.states.clear();
      this.transitions.clear();

      this.initialized = true;
      console.log('[MachinesAdapter] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[MachinesAdapter] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Register a state machine
   * @param {string} machineId - Unique machine identifier
   * @param {object} config - Machine configuration
   * @returns {object} - Machine instance
   */
  registerMachine(machineId, config) {
    if (!this.initialized) {
      throw new Error('[MachinesAdapter] Not initialized');
    }

    const machine = {
      id: machineId,
      name: config.name || machineId,
      initialState: config.initialState,
      currentState: config.initialState,
      states: config.states || {},
      context: config.context || {},
      createdAt: Date.now()
    };

    this.machines.set(machineId, machine);
    this.states.set(machineId, machine.currentState);

    console.log(`[MachinesAdapter] Registered machine: ${machineId}`);
    return this.getMachine(machineId);
  }

  /**
   * Get a registered machine
   * @param {string} machineId - Machine identifier
   * @returns {object|null} - Machine instance or null
   */
  getMachine(machineId) {
    if (!this.initialized) {
      throw new Error('[MachinesAdapter] Not initialized');
    }

    const machine = this.machines.get(machineId);
    if (!machine) {
      return null;
    }

    return {
      id: machine.id,
      name: machine.name,
      currentState: machine.currentState,
      context: machine.context,
      availableTransitions: this._getAvailableTransitions(machineId)
    };
  }

  /**
   * Transition a machine to a new state
   * @param {string} machineId - Machine identifier
   * @param {string} event - Event triggering the transition
   * @param {object} eventData - Event data
   * @returns {Promise<object>} - Transition result
   */
  async transition(machineId, event, eventData = {}) {
    if (!this.initialized) {
      throw new Error('[MachinesAdapter] Not initialized');
    }

    const machine = this.machines.get(machineId);
    if (!machine) {
      throw new Error(`[MachinesAdapter] Machine not found: ${machineId}`);
    }

    const currentState = machine.currentState;
    const stateConfig = machine.states[currentState];

    if (!stateConfig) {
      throw new Error(`[MachinesAdapter] Invalid state: ${currentState}`);
    }

    // Check if transition is allowed
    const transition = stateConfig.on && stateConfig.on[event];
    if (!transition) {
      console.warn(`[MachinesAdapter] No transition for event '${event}' in state '${currentState}'`);
      return {
        success: false,
        currentState: currentState,
        error: 'Invalid transition'
      };
    }

    const targetState = typeof transition === 'string' ? transition : transition.target;

    // Execute actions if defined
    if (typeof transition === 'object' && transition.actions) {
      await this._executeActions(machine, transition.actions, eventData);
    }

    // Update state
    const previousState = machine.currentState;
    machine.currentState = targetState;
    this.states.set(machineId, targetState);

    // Record transition
    const transitionRecord = {
      machineId: machineId,
      from: previousState,
      to: targetState,
      event: event,
      eventData: eventData,
      timestamp: Date.now()
    };

    if (!this.transitions.has(machineId)) {
      this.transitions.set(machineId, []);
    }
    this.transitions.get(machineId).push(transitionRecord);

    console.log(`[MachinesAdapter] Transition: ${machineId} ${previousState} → ${targetState} (${event})`);

    return {
      success: true,
      previousState: previousState,
      currentState: targetState,
      event: event
    };
  }

  /**
   * Get current state of a machine
   * @param {string} machineId - Machine identifier
   * @returns {string|null} - Current state or null
   */
  getCurrentState(machineId) {
    if (!this.initialized) {
      throw new Error('[MachinesAdapter] Not initialized');
    }

    const machine = this.machines.get(machineId);
    return machine ? machine.currentState : null;
  }

  /**
   * Update machine context
   * @param {string} machineId - Machine identifier
   * @param {object} contextUpdates - Context updates
   * @returns {boolean} - Success status
   */
  updateContext(machineId, contextUpdates) {
    if (!this.initialized) {
      throw new Error('[MachinesAdapter] Not initialized');
    }

    const machine = this.machines.get(machineId);
    if (!machine) {
      return false;
    }

    machine.context = {
      ...machine.context,
      ...contextUpdates
    };

    console.log(`[MachinesAdapter] Updated context for ${machineId}`);
    return true;
  }

  /**
   * Get machine context
   * @param {string} machineId - Machine identifier
   * @returns {object|null} - Context or null
   */
  getContext(machineId) {
    if (!this.initialized) {
      throw new Error('[MachinesAdapter] Not initialized');
    }

    const machine = this.machines.get(machineId);
    return machine ? machine.context : null;
  }

  /**
   * Get transition history for a machine
   * @param {string} machineId - Machine identifier
   * @param {number} limit - Maximum number of transitions to return
   * @returns {array} - Transition history
   */
  getTransitionHistory(machineId, limit = 10) {
    if (!this.initialized) {
      throw new Error('[MachinesAdapter] Not initialized');
    }

    const history = this.transitions.get(machineId) || [];
    return history.slice(-limit);
  }

  /**
   * Execute actions
   * @private
   * @param {object} machine - Machine instance
   * @param {array|function} actions - Actions to execute
   * @param {object} eventData - Event data
   * @returns {Promise<void>}
   */
  async _executeActions(machine, actions, eventData) {
    const actionList = Array.isArray(actions) ? actions : [actions];

    for (const action of actionList) {
      try {
        if (typeof action === 'function') {
          await action(machine.context, eventData);
        } else if (typeof action === 'string') {
          console.log(`[MachinesAdapter] Action: ${action}`);
        }
      } catch (error) {
        console.error('[MachinesAdapter] Action execution error:', error);
      }
    }
  }

  /**
   * Get available transitions for current state
   * @private
   * @param {string} machineId - Machine identifier
   * @returns {array} - Available transitions
   */
  _getAvailableTransitions(machineId) {
    const machine = this.machines.get(machineId);
    if (!machine) {
      return [];
    }

    const stateConfig = machine.states[machine.currentState];
    if (!stateConfig || !stateConfig.on) {
      return [];
    }

    return Object.keys(stateConfig.on);
  }

  /**
   * Remove a machine
   * @param {string} machineId - Machine identifier
   * @returns {boolean} - Success status
   */
  removeMachine(machineId) {
    if (!this.initialized) {
      throw new Error('[MachinesAdapter] Not initialized');
    }

    const existed = this.machines.has(machineId);
    
    if (existed) {
      this.machines.delete(machineId);
      this.states.delete(machineId);
      this.transitions.delete(machineId);
      console.log(`[MachinesAdapter] Removed machine: ${machineId}`);
    }

    return existed;
  }

  /**
   * Get service status
   * @returns {object} - Service status
   */
  getStatus() {
    const machineStates = {};
    
    for (const [machineId, machine] of this.machines.entries()) {
      machineStates[machineId] = machine.currentState;
    }

    return {
      initialized: this.initialized,
      totalMachines: this.machines.size,
      machineStates: machineStates
    };
  }
}

// Export as singleton
const machinesAdapter = new MachinesAdapter();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = machinesAdapter;
}

if (typeof window !== 'undefined') {
  window.MachinesAdapter = machinesAdapter;
}
