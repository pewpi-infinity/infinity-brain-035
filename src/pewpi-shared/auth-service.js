/**
 * Auth Service - Manages authentication and authorization
 * Part of pewpi-shared unified library
 */

class AuthService {
  constructor() {
    this.initialized = false;
    this.currentUser = null;
    this.sessions = new Map();
    this.tokenService = null;
  }

  /**
   * Initialize the auth service
   * @param {object} tokenService - Token service instance
   * @returns {Promise<boolean>} - Success status
   */
  async initialize(tokenService) {
    try {
      if (this.initialized) {
        console.warn('[AuthService] Already initialized');
        return true;
      }

      this.tokenService = tokenService;
      
      // Try to restore session from storage
      await this._restoreSession();

      this.initialized = true;
      console.log('[AuthService] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[AuthService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Authenticate a user
   * @param {string} identifier - User identifier (username, email, wallet address)
   * @param {string} credential - Authentication credential (password, signature, etc.)
   * @param {string} method - Authentication method ('password', 'wallet', 'token')
   * @returns {Promise<object>} - Authentication result with session token
   */
  async authenticate(identifier, credential, method = 'password') {
    if (!this.initialized) {
      throw new Error('[AuthService] Not initialized');
    }

    try {
      console.log(`[AuthService] Authenticating user: ${identifier} (${method})`);

      // Validate credentials based on method
      const isValid = await this._validateCredentials(identifier, credential, method);
      
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Create user session
      const user = {
        id: this._generateUserId(),
        identifier: identifier,
        authMethod: method,
        authenticatedAt: Date.now()
      };

      // Create session token
      const sessionToken = this.tokenService.createToken('session', {
        userId: user.id,
        identifier: identifier,
        method: method
      }, 86400000); // 24 hours

      // Store session
      this.sessions.set(sessionToken.id, {
        user: user,
        tokenId: sessionToken.id,
        createdAt: Date.now()
      });

      this.currentUser = user;

      // Persist session
      await this._persistSession(sessionToken.id);

      console.log(`[AuthService] User authenticated: ${user.id}`);

      return {
        success: true,
        user: user,
        sessionToken: sessionToken
      };
    } catch (error) {
      console.error('[AuthService] Authentication error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate a session token
   * @param {string} tokenId - Session token ID
   * @returns {boolean} - Validation status
   */
  validateSession(tokenId) {
    if (!this.initialized) {
      throw new Error('[AuthService] Not initialized');
    }

    const session = this.sessions.get(tokenId);
    if (!session) {
      return false;
    }

    // Validate token
    return this.tokenService.validateToken(tokenId);
  }

  /**
   * Get current authenticated user
   * @returns {object|null} - Current user or null
   */
  getCurrentUser() {
    if (!this.initialized) {
      throw new Error('[AuthService] Not initialized');
    }

    return this.currentUser;
  }

  /**
   * Logout current user
   * @returns {Promise<boolean>} - Success status
   */
  async logout() {
    if (!this.initialized) {
      throw new Error('[AuthService] Not initialized');
    }

    try {
      // Find and revoke current session
      for (const [tokenId, session] of this.sessions.entries()) {
        if (session.user === this.currentUser) {
          this.tokenService.revokeToken(tokenId);
          this.sessions.delete(tokenId);
        }
      }

      this.currentUser = null;

      // Clear persisted session
      await this._clearPersistedSession();

      console.log('[AuthService] User logged out');
      return true;
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
      return false;
    }
  }

  /**
   * Validate credentials
   * @private
   * @param {string} identifier - User identifier
   * @param {string} credential - Credential
   * @param {string} method - Auth method
   * @returns {Promise<boolean>} - Validation result
   */
  async _validateCredentials(identifier, credential, method) {
    // In a real implementation, this would validate against a backend
    // For demo purposes, we'll accept any non-empty credentials
    if (!identifier || !credential) {
      return false;
    }

    // Simulate async validation
    await new Promise(resolve => setTimeout(resolve, 100));

    // Basic validation logic
    switch (method) {
      case 'wallet':
        // Validate wallet signature
        return credential.length >= 32;
      case 'token':
        // Validate token format
        return credential.startsWith('tok_');
      case 'password':
      default:
        // Validate password (minimum length)
        return credential.length >= 8;
    }
  }

  /**
   * Generate a unique user ID
   * @private
   * @returns {string} - User ID
   */
  _generateUserId() {
    return `usr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Persist session to storage
   * @private
   * @param {string} tokenId - Session token ID
   * @returns {Promise<void>}
   */
  async _persistSession(tokenId) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pewpi_session', tokenId);
      }
    } catch (error) {
      console.warn('[AuthService] Failed to persist session:', error);
    }
  }

  /**
   * Restore session from storage
   * @private
   * @returns {Promise<void>}
   */
  async _restoreSession() {
    try {
      if (typeof localStorage !== 'undefined') {
        const tokenId = localStorage.getItem('pewpi_session');
        if (tokenId && this.tokenService) {
          const isValid = this.tokenService.validateToken(tokenId);
          if (isValid) {
            const token = this.tokenService.getToken(tokenId);
            if (token && token.payload) {
              this.currentUser = {
                id: token.payload.userId,
                identifier: token.payload.identifier,
                authMethod: token.payload.method
              };
              console.log('[AuthService] Session restored');
            }
          }
        }
      }
    } catch (error) {
      console.warn('[AuthService] Failed to restore session:', error);
    }
  }

  /**
   * Clear persisted session
   * @private
   * @returns {Promise<void>}
   */
  async _clearPersistedSession() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('pewpi_session');
      }
    } catch (error) {
      console.warn('[AuthService] Failed to clear session:', error);
    }
  }

  /**
   * Get service status
   * @returns {object} - Service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      authenticated: this.currentUser !== null,
      activeSessions: this.sessions.size,
      currentUser: this.currentUser ? {
        id: this.currentUser.id,
        identifier: this.currentUser.identifier,
        method: this.currentUser.authMethod
      } : null
    };
  }
}

// Export as singleton
const authService = new AuthService();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = authService;
}

if (typeof window !== 'undefined') {
  window.AuthService = authService;
}
