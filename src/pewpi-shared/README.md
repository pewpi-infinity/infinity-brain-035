# pewpi-shared

Unified authentication, wallet management, and token library for the pewpi-infinity ecosystem.

## Overview

pewpi-shared is a comprehensive JavaScript library that provides:

- **Token Service**: Secure token creation, validation, and lifecycle management
- **Auth Service**: Multi-method authentication (password, wallet, token)
- **Wallet Unified**: Unified interface for multiple blockchain wallets (MetaMask, Phantom, WalletConnect)
- **Integration Listener**: Event-driven architecture for system integration
- **Machines Adapter**: State machine management and coordination
- **UI Shim**: Ready-to-use UI components and utilities

## Features

### 🔐 Token Service
- Secure token generation with crypto random values
- Token validation and expiration handling
- Token lifecycle management (create, validate, revoke)
- Automatic cleanup of expired tokens

### 👤 Auth Service
- Multiple authentication methods (password, wallet signature, token)
- Session management with persistent storage
- Current user tracking
- Secure logout functionality

### 💰 Wallet Unified
- Support for multiple wallet types (MetaMask, Phantom, WalletConnect, Generic)
- Unified interface across different blockchain networks
- Balance tracking and updates
- Transaction signing and sending
- Message signing for authentication

### 📡 Integration Listener
- Event-driven architecture
- Priority-based event handlers
- Once-only and persistent listeners
- Event queue with ordered processing
- Type-safe event emissions

### 🤖 Machines Adapter
- State machine registration and management
- State transitions with validation
- Context management for machine state
- Transition history tracking
- Action execution on transitions

### 🎨 UI Shim
- Toast notifications (info, success, warning, error)
- Modal dialogs with configurable buttons
- Loading spinners
- Button components
- Dark/light theme support
- Zero external dependencies

## Installation

No installation required! pewpi-shared is designed to be integrated directly into your repository.

### Manual Integration

1. Copy the `src/pewpi-shared/` directory to your project
2. Include the index-shim loader in your HTML or entry point
3. Initialize the services you need

## Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <title>pewpi-shared Demo</title>
</head>
<body>
  <!-- Include the index-shim loader -->
  <script src="src/pewpi-shared/index-shim.js"></script>
  
  <script>
    // Initialize pewpi-shared
    PewpiShared.initialize().then(() => {
      console.log('pewpi-shared initialized');
      
      // Use the services
      const tokenService = PewpiShared.services.tokenService;
      const authService = PewpiShared.services.authService;
      const wallet = PewpiShared.services.walletUnified;
      
      // Create a token
      const token = tokenService.createToken('api', { userId: 'user123' });
      console.log('Token created:', token.id);
    });
  </script>
</body>
</html>
```

### Node.js Usage

```javascript
const tokenService = require('./src/pewpi-shared/token-service');
const authService = require('./src/pewpi-shared/auth-service');

// Initialize
async function init() {
  await tokenService.initialize();
  await authService.initialize(tokenService);
  
  // Authenticate
  const result = await authService.authenticate(
    'user@example.com',
    'securepassword',
    'password'
  );
  
  if (result.success) {
    console.log('Authenticated:', result.user.id);
    console.log('Session token:', result.sessionToken.id);
  }
}

init();
```

## API Reference

### Token Service

```javascript
// Initialize
await tokenService.initialize();

// Create token
const token = tokenService.createToken(
  'auth',                    // type
  { userId: 'user123' },     // payload
  3600000                    // expiresIn (ms)
);

// Validate token
const isValid = tokenService.validateToken(token.id);

// Get token details
const tokenDetails = tokenService.getToken(token.id);

// Revoke token
tokenService.revokeToken(token.id);

// Cleanup expired
const cleaned = tokenService.cleanupExpiredTokens();

// Get status
const status = tokenService.getStatus();
```

### Auth Service

```javascript
// Initialize with token service
await authService.initialize(tokenService);

// Authenticate
const result = await authService.authenticate(
  'user@example.com',      // identifier
  'password123',           // credential
  'password'               // method: 'password', 'wallet', 'token'
);

// Validate session
const isValid = authService.validateSession(sessionTokenId);

// Get current user
const user = authService.getCurrentUser();

// Logout
await authService.logout();

// Get status
const status = authService.getStatus();
```

### Wallet Unified

```javascript
// Initialize with auth service
await walletUnified.initialize(authService);

// Connect wallet
const result = await walletUnified.connect('MetaMask');
// Supported: 'MetaMask', 'Phantom', 'WalletConnect', 'Generic'

if (result.success) {
  console.log('Connected:', result.wallet.address);
  console.log('Balance:', result.wallet.balance);
}

// Get wallet info
const info = walletUnified.getWalletInfo();

// Update balance
const balance = await walletUnified.updateBalance();

// Sign message
const signature = await walletUnified.signMessage('Hello pewpi!');

// Send transaction
const tx = await walletUnified.sendTransaction({
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  value: '1000000000000000000' // 1 ETH in wei
});

// Disconnect
await walletUnified.disconnect();

// Get status
const status = walletUnified.getStatus();
```

### Integration Listener

```javascript
// Initialize
await integrationListener.initialize();

// Register listener
const listenerId = integrationListener.on(
  'user:login',              // eventType
  (data, event) => {         // handler
    console.log('User logged in:', data.userId);
  },
  { once: false, priority: 1 }  // options
);

// Emit event
await integrationListener.emit('user:login', { userId: 'user123' });

// Remove listener
integrationListener.off(listenerId);

// Clear all listeners
integrationListener.clearListeners('user:login');

// Get status
const status = integrationListener.getStatus();
```

### Machines Adapter

```javascript
// Initialize
await machinesAdapter.initialize();

// Register machine
machinesAdapter.registerMachine('authFlow', {
  name: 'Authentication Flow',
  initialState: 'idle',
  states: {
    idle: {
      on: {
        LOGIN: 'authenticating'
      }
    },
    authenticating: {
      on: {
        SUCCESS: 'authenticated',
        FAILURE: 'error'
      }
    },
    authenticated: {
      on: {
        LOGOUT: 'idle'
      }
    },
    error: {
      on: {
        RETRY: 'idle'
      }
    }
  },
  context: {}
});

// Transition state
const result = await machinesAdapter.transition('authFlow', 'LOGIN');

// Get current state
const state = machinesAdapter.getCurrentState('authFlow');

// Update context
machinesAdapter.updateContext('authFlow', { userId: 'user123' });

// Get machine
const machine = machinesAdapter.getMachine('authFlow');

// Get status
const status = machinesAdapter.getStatus();
```

### UI Shim

```javascript
// Initialize
await uiShim.initialize({ theme: 'dark' });

// Show notification
const notifId = uiShim.notify(
  'Operation successful!',   // message
  'success',                 // type: info, success, warning, error
  3000                       // duration (ms)
);

// Dismiss notification
uiShim.dismissNotification(notifId);

// Create modal
const modalId = uiShim.createModal({
  title: 'Confirm Action',
  body: 'Are you sure you want to proceed?',
  buttons: [
    {
      label: 'Cancel',
      variant: 'secondary',
      onClick: () => uiShim.hideModal(modalId)
    },
    {
      label: 'Confirm',
      variant: 'primary',
      onClick: () => {
        console.log('Confirmed');
        uiShim.hideModal(modalId);
      }
    }
  ]
});

// Show/hide modal
uiShim.showModal(modalId);
uiShim.hideModal(modalId);

// Create button
const button = uiShim.createButton({
  label: 'Click Me',
  variant: 'primary',
  onClick: () => console.log('Clicked!')
});

// Create spinner
const spinner = uiShim.createSpinner({ size: '40px' });

// Get status
const status = uiShim.getStatus();
```

## Architecture

### Service Initialization Flow

```
1. Load index-shim.js
2. Initialize Token Service
3. Initialize Auth Service (with Token Service)
4. Initialize Wallet Unified (with Auth Service)
5. Initialize Integration Listener
6. Initialize Machines Adapter
7. Initialize UI Shim
8. All services ready!
```

### Safe Initialization

pewpi-shared uses defensive initialization to ensure non-destructive integration:

- All services check if already initialized
- Services gracefully handle missing dependencies
- Browser-specific features are optional (works in Node.js)
- No global namespace pollution (uses module pattern)
- All services are singletons for consistency

## Dependencies

### Core Dependencies

- **dexie** (optional): For advanced IndexedDB storage
- **crypto-js** (optional): For enhanced cryptographic operations

Both dependencies are optional and pewpi-shared will work with built-in browser APIs if they're not available.

### Adding Dependencies

If you want to use the optional features:

```json
{
  "dependencies": {
    "dexie": "^3.2.4",
    "crypto-js": "^4.2.0"
  }
}
```

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

For older browsers, transpile with Babel.

## Security Considerations

- Tokens use cryptographically secure random generation
- Wallet signatures for authentication
- Session persistence in localStorage (consider httpOnly cookies for production)
- No sensitive data in logs (in production mode)
- Always validate tokens server-side in production

## Contributing

pewpi-shared is designed for the pewpi-infinity ecosystem. For contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Part of the pewpi-infinity ecosystem.

## Support

For issues, questions, or contributions, please refer to the main pewpi-infinity repository.

---

**Made with ∞ by the pewpi-infinity team**
