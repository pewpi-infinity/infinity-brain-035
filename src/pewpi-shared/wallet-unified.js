/**
 * Wallet Unified - Unified wallet management for multiple blockchain networks
 * Part of pewpi-shared unified library
 */

class WalletUnified {
  constructor() {
    this.initialized = false;
    this.connectedWallet = null;
    this.supportedWallets = ['MetaMask', 'WalletConnect', 'Phantom', 'Generic'];
    this.balance = 0;
    this.network = null;
    this.authService = null;
  }

  /**
   * Initialize the wallet service
   * @param {object} authService - Auth service instance
   * @returns {Promise<boolean>} - Success status
   */
  async initialize(authService) {
    try {
      if (this.initialized) {
        console.warn('[WalletUnified] Already initialized');
        return true;
      }

      this.authService = authService;
      
      // Detect available wallet providers
      await this._detectWalletProviders();

      this.initialized = true;
      console.log('[WalletUnified] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[WalletUnified] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Connect to a wallet
   * @param {string} walletType - Type of wallet to connect ('MetaMask', 'WalletConnect', etc.)
   * @returns {Promise<object>} - Connection result
   */
  async connect(walletType = 'Generic') {
    if (!this.initialized) {
      throw new Error('[WalletUnified] Not initialized');
    }

    try {
      console.log(`[WalletUnified] Connecting to ${walletType}...`);

      let address = null;
      let provider = null;

      // Connect based on wallet type
      switch (walletType) {
        case 'MetaMask':
          const result = await this._connectMetaMask();
          address = result.address;
          provider = result.provider;
          break;
        
        case 'WalletConnect':
          address = await this._connectWalletConnect();
          break;
        
        case 'Phantom':
          address = await this._connectPhantom();
          break;
        
        case 'Generic':
        default:
          address = await this._connectGeneric();
          break;
      }

      if (!address) {
        return {
          success: false,
          error: 'Failed to connect wallet'
        };
      }

      // Store wallet connection
      this.connectedWallet = {
        type: walletType,
        address: address,
        provider: provider,
        connectedAt: Date.now()
      };

      // Fetch initial balance
      await this.updateBalance();

      // Authenticate with wallet address if auth service available
      if (this.authService) {
        const signature = await this._signMessage('Authenticate with pewpi-shared');
        await this.authService.authenticate(address, signature, 'wallet');
      }

      console.log(`[WalletUnified] Connected: ${address}`);

      return {
        success: true,
        wallet: {
          type: walletType,
          address: address,
          balance: this.balance
        }
      };
    } catch (error) {
      console.error('[WalletUnified] Connection error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Disconnect wallet
   * @returns {Promise<boolean>} - Success status
   */
  async disconnect() {
    if (!this.initialized) {
      throw new Error('[WalletUnified] Not initialized');
    }

    try {
      if (this.connectedWallet) {
        console.log(`[WalletUnified] Disconnecting ${this.connectedWallet.address}`);
        this.connectedWallet = null;
        this.balance = 0;
        this.network = null;
      }

      return true;
    } catch (error) {
      console.error('[WalletUnified] Disconnect error:', error);
      return false;
    }
  }

  /**
   * Get connected wallet info
   * @returns {object|null} - Wallet info or null
   */
  getWalletInfo() {
    if (!this.initialized) {
      throw new Error('[WalletUnified] Not initialized');
    }

    if (!this.connectedWallet) {
      return null;
    }

    return {
      type: this.connectedWallet.type,
      address: this.connectedWallet.address,
      balance: this.balance,
      network: this.network,
      connectedAt: this.connectedWallet.connectedAt
    };
  }

  /**
   * Update wallet balance
   * @returns {Promise<number>} - Updated balance
   */
  async updateBalance() {
    if (!this.initialized) {
      throw new Error('[WalletUnified] Not initialized');
    }

    if (!this.connectedWallet) {
      throw new Error('[WalletUnified] No wallet connected');
    }

    try {
      // Fetch balance based on wallet type
      const balance = await this._fetchBalance();
      this.balance = balance;
      console.log(`[WalletUnified] Balance updated: ${balance}`);
      return balance;
    } catch (error) {
      console.error('[WalletUnified] Balance update error:', error);
      return 0;
    }
  }

  /**
   * Sign a message with the connected wallet
   * @param {string} message - Message to sign
   * @returns {Promise<string>} - Signature
   */
  async signMessage(message) {
    if (!this.initialized) {
      throw new Error('[WalletUnified] Not initialized');
    }

    if (!this.connectedWallet) {
      throw new Error('[WalletUnified] No wallet connected');
    }

    return await this._signMessage(message);
  }

  /**
   * Send transaction
   * @param {object} transaction - Transaction details
   * @returns {Promise<object>} - Transaction result
   */
  async sendTransaction(transaction) {
    if (!this.initialized) {
      throw new Error('[WalletUnified] Not initialized');
    }

    if (!this.connectedWallet) {
      throw new Error('[WalletUnified] No wallet connected');
    }

    try {
      console.log('[WalletUnified] Sending transaction...');
      
      // Validate transaction
      if (!transaction.to || !transaction.value) {
        throw new Error('Invalid transaction parameters');
      }

      // Send transaction based on wallet type
      const txHash = await this._sendTransaction(transaction);

      console.log(`[WalletUnified] Transaction sent: ${txHash}`);

      return {
        success: true,
        txHash: txHash
      };
    } catch (error) {
      console.error('[WalletUnified] Transaction error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Detect available wallet providers
   * @private
   * @returns {Promise<void>}
   */
  async _detectWalletProviders() {
    const detected = [];

    if (typeof window !== 'undefined') {
      if (window.ethereum) {
        detected.push('MetaMask');
      }
      if (window.solana) {
        detected.push('Phantom');
      }
    }

    console.log('[WalletUnified] Detected wallets:', detected);
  }

  /**
   * Connect MetaMask wallet
   * @private
   * @returns {Promise<object>} - Address and provider
   */
  async _connectMetaMask() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not available');
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    this.network = chainId;

    return {
      address: accounts[0],
      provider: window.ethereum
    };
  }

  /**
   * Connect WalletConnect
   * @private
   * @returns {Promise<string>} - Wallet address
   */
  async _connectWalletConnect() {
    // Simulate WalletConnect connection
    console.log('[WalletUnified] WalletConnect not fully implemented, using mock');
    return this._generateMockAddress();
  }

  /**
   * Connect Phantom wallet
   * @private
   * @returns {Promise<string>} - Wallet address
   */
  async _connectPhantom() {
    if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
      const resp = await window.solana.connect();
      return resp.publicKey.toString();
    }
    
    console.log('[WalletUnified] Phantom not available, using mock');
    return this._generateMockAddress();
  }

  /**
   * Connect generic wallet
   * @private
   * @returns {Promise<string>} - Wallet address
   */
  async _connectGeneric() {
    // Generate a mock address for demo purposes
    return this._generateMockAddress();
  }

  /**
   * Fetch wallet balance
   * @private
   * @returns {Promise<number>} - Balance
   */
  async _fetchBalance() {
    if (this.connectedWallet.provider && typeof window !== 'undefined' && window.ethereum) {
      try {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [this.connectedWallet.address, 'latest']
        });
        return parseInt(balance, 16) / 1e18; // Convert wei to ETH
      } catch (error) {
        console.warn('[WalletUnified] Failed to fetch real balance:', error);
      }
    }

    // Mock balance for demo
    return Math.random() * 10;
  }

  /**
   * Sign message
   * @private
   * @param {string} message - Message to sign
   * @returns {Promise<string>} - Signature
   */
  async _signMessage(message) {
    if (this.connectedWallet.provider && typeof window !== 'undefined' && window.ethereum) {
      try {
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, this.connectedWallet.address]
        });
        return signature;
      } catch (error) {
        console.warn('[WalletUnified] Failed to sign message:', error);
      }
    }

    // Mock signature for demo
    return `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  }

  /**
   * Send transaction
   * @private
   * @param {object} transaction - Transaction details
   * @returns {Promise<string>} - Transaction hash
   */
  async _sendTransaction(transaction) {
    if (this.connectedWallet.provider && typeof window !== 'undefined' && window.ethereum) {
      try {
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: this.connectedWallet.address,
            to: transaction.to,
            value: transaction.value.toString(16)
          }]
        });
        return txHash;
      } catch (error) {
        console.warn('[WalletUnified] Failed to send transaction:', error);
        throw error;
      }
    }

    // Mock transaction hash for demo
    return `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  }

  /**
   * Generate mock wallet address
   * @private
   * @returns {string} - Mock address
   */
  _generateMockAddress() {
    return `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  }

  /**
   * Get service status
   * @returns {object} - Service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      connected: this.connectedWallet !== null,
      walletType: this.connectedWallet ? this.connectedWallet.type : null,
      address: this.connectedWallet ? this.connectedWallet.address : null,
      balance: this.balance,
      network: this.network
    };
  }
}

// Export as singleton
const walletUnified = new WalletUnified();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = walletUnified;
}

if (typeof window !== 'undefined') {
  window.WalletUnified = walletUnified;
}
