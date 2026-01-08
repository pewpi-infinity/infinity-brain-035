/**
 * Token Service - Manages token creation, validation, and lifecycle
 * Part of pewpi-shared unified library
 */

class TokenService {
  constructor() {
    this.tokens = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the token service
   * @returns {Promise<boolean>} - Success status
   */
  async initialize() {
    try {
      if (this.initialized) {
        console.warn('[TokenService] Already initialized');
        return true;
      }

      // Initialize token storage
      this.tokens.clear();
      this.initialized = true;
      console.log('[TokenService] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[TokenService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Create a new token
   * @param {string} type - Token type (e.g., 'auth', 'session', 'api')
   * @param {object} payload - Token payload data
   * @param {number} expiresIn - Expiration time in milliseconds
   * @returns {object} - Token object with id and value
   */
  createToken(type, payload = {}, expiresIn = 3600000) {
    if (!this.initialized) {
      throw new Error('[TokenService] Not initialized');
    }

    const tokenId = this._generateTokenId();
    const token = {
      id: tokenId,
      type: type || 'generic',
      value: this._generateTokenValue(),
      payload: payload,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresIn,
      valid: true
    };

    this.tokens.set(tokenId, token);
    console.log(`[TokenService] Created token: ${tokenId} (${type})`);
    return {
      id: token.id,
      value: token.value,
      type: token.type,
      expiresAt: token.expiresAt
    };
  }

  /**
   * Validate a token
   * @param {string} tokenId - Token ID to validate
   * @returns {boolean} - Validation status
   */
  validateToken(tokenId) {
    if (!this.initialized) {
      throw new Error('[TokenService] Not initialized');
    }

    const token = this.tokens.get(tokenId);
    if (!token) {
      return false;
    }

    // Check expiration
    if (Date.now() > token.expiresAt) {
      token.valid = false;
      console.log(`[TokenService] Token expired: ${tokenId}`);
      return false;
    }

    return token.valid;
  }

  /**
   * Get token details
   * @param {string} tokenId - Token ID
   * @returns {object|null} - Token details or null
   */
  getToken(tokenId) {
    if (!this.initialized) {
      throw new Error('[TokenService] Not initialized');
    }

    const token = this.tokens.get(tokenId);
    if (!token) {
      return null;
    }

    return {
      id: token.id,
      type: token.type,
      payload: token.payload,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      valid: this.validateToken(tokenId)
    };
  }

  /**
   * Revoke a token
   * @param {string} tokenId - Token ID to revoke
   * @returns {boolean} - Success status
   */
  revokeToken(tokenId) {
    if (!this.initialized) {
      throw new Error('[TokenService] Not initialized');
    }

    const token = this.tokens.get(tokenId);
    if (!token) {
      return false;
    }

    token.valid = false;
    console.log(`[TokenService] Token revoked: ${tokenId}`);
    return true;
  }

  /**
   * Clean up expired tokens
   * @returns {number} - Number of tokens cleaned
   */
  cleanupExpiredTokens() {
    if (!this.initialized) {
      throw new Error('[TokenService] Not initialized');
    }

    const now = Date.now();
    let cleaned = 0;

    for (const [tokenId, token] of this.tokens.entries()) {
      if (now > token.expiresAt) {
        this.tokens.delete(tokenId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[TokenService] Cleaned ${cleaned} expired tokens`);
    }

    return cleaned;
  }

  /**
   * Generate a unique token ID
   * @private
   * @returns {string} - Token ID
   */
  _generateTokenId() {
    return `tok_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate a secure token value
   * @private
   * @returns {string} - Token value
   */
  _generateTokenValue() {
    // Generate a cryptographically secure random token
    const array = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get service status
   * @returns {object} - Service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      totalTokens: this.tokens.size,
      validTokens: Array.from(this.tokens.values()).filter(t => t.valid && Date.now() <= t.expiresAt).length
    };
  }
}

// Export as singleton
const tokenService = new TokenService();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = tokenService;
}

if (typeof window !== 'undefined') {
  window.TokenService = tokenService;
}
