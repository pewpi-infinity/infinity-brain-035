# pewpi-shared Integration Guide

## Overview

This guide explains how pewpi-shared is integrated into the infinity-brain-035 repository in a non-destructive manner.

## Integration Philosophy

The integration follows these principles:

1. **Non-Destructive**: No modifications to existing functionality
2. **Defensive**: Safe initialization with fallbacks
3. **Optional**: Services can be used selectively
4. **Isolated**: All code in `src/pewpi-shared/` directory
5. **Zero-Breaking**: Existing code continues to work unchanged

## Directory Structure

```
src/pewpi-shared/
├── token-service.js          # Token management
├── auth-service.js           # Authentication
├── wallet-unified.js         # Wallet integration
├── integration-listener.js   # Event system
├── machines/
│   └── adapter.js           # State machines
├── ui-shim.js               # UI components
├── index-shim.js            # Safe loader/initializer
├── INTEGRATION.md           # This file
└── README.md                # API documentation
```

## Installation Steps

### 1. Repository Integration

The pewpi-shared library has been added to `src/pewpi-shared/` with all necessary files.

### 2. Dependencies (Optional)

Add to `package.json` if not present:

```json
{
  "dependencies": {
    "dexie": "^3.2.4",
    "crypto-js": "^4.2.0"
  }
}
```

**Note**: These dependencies are optional. pewpi-shared works without them using built-in browser APIs.

### 3. Include the Loader

To use pewpi-shared in your HTML pages:

```html
<script src="src/pewpi-shared/index-shim.js"></script>
```

Or in Node.js:

```javascript
const PewpiShared = require('./src/pewpi-shared/index-shim');
```

## Safe Initialization

### Automatic Initialization

The index-shim loader automatically initializes all services when included:

```html
<script src="src/pewpi-shared/index-shim.js"></script>
<script>
  // Services are available immediately after load
  PewpiShared.initialize().then(() => {
    console.log('All services ready');
  });
</script>
```

### Manual Service Access

Access individual services:

```javascript
const tokenService = PewpiShared.services.tokenService;
const authService = PewpiShared.services.authService;
const walletUnified = PewpiShared.services.walletUnified;
const integrationListener = PewpiShared.services.integrationListener;
const machinesAdapter = PewpiShared.services.machinesAdapter;
const uiShim = PewpiShared.services.uiShim;
```

### Selective Initialization

Initialize only the services you need:

```javascript
// Load services individually
const tokenService = require('./src/pewpi-shared/token-service');
const authService = require('./src/pewpi-shared/auth-service');

// Initialize
await tokenService.initialize();
await authService.initialize(tokenService);
```

## Integration Patterns

### Pattern 1: Enhance Existing Pages

Add authentication to an existing page without modifying it:

```html
<!-- existing-page.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Existing Page</title>
</head>
<body>
  <!-- Existing content unchanged -->
  <h1>My Page</h1>
  
  <!-- Add pewpi-shared at the end -->
  <script src="src/pewpi-shared/index-shim.js"></script>
  <script>
    // Add new features without breaking existing code
    PewpiShared.initialize().then(() => {
      // New authentication feature
      PewpiShared.services.authService.getCurrentUser();
    });
  </script>
</body>
</html>
```

### Pattern 2: Wallet-Enabled Features

Add wallet connectivity to pages:

```javascript
// Enable wallet features
PewpiShared.initialize().then(async () => {
  const wallet = PewpiShared.services.walletUnified;
  
  // Add wallet connect button
  const connectBtn = PewpiShared.services.uiShim.createButton({
    label: 'Connect Wallet',
    variant: 'primary',
    onClick: async () => {
      const result = await wallet.connect('MetaMask');
      if (result.success) {
        PewpiShared.services.uiShim.notify(
          `Connected: ${result.wallet.address}`,
          'success'
        );
      }
    }
  });
  
  document.body.appendChild(connectBtn);
});
```

### Pattern 3: Event-Driven Integration

Integrate with existing systems via events:

```javascript
PewpiShared.initialize().then(() => {
  const listener = PewpiShared.services.integrationListener;
  
  // Listen for existing system events
  listener.on('page:ready', (data) => {
    console.log('Page ready, initializing auth');
    // Initialize auth when page is ready
  });
  
  // Emit events to existing system
  listener.on('user:authenticated', (data) => {
    // Notify existing system of authentication
    if (window.existingSystem) {
      window.existingSystem.onUserLogin(data.userId);
    }
  });
});
```

### Pattern 4: State Machine Integration

Integrate with existing state management:

```javascript
PewpiShared.initialize().then(() => {
  const machines = PewpiShared.services.machinesAdapter;
  
  // Register app state machine
  machines.registerMachine('appFlow', {
    initialState: 'loading',
    states: {
      loading: {
        on: { LOADED: 'idle' }
      },
      idle: {
        on: { 
          AUTH_START: 'authenticating',
          WALLET_CONNECT: 'connecting'
        }
      },
      authenticating: {
        on: {
          AUTH_SUCCESS: 'authenticated',
          AUTH_FAILURE: 'idle'
        }
      },
      connecting: {
        on: {
          WALLET_CONNECTED: 'authenticated',
          WALLET_FAILURE: 'idle'
        }
      },
      authenticated: {
        on: { LOGOUT: 'idle' }
      }
    }
  });
  
  // Hook into existing app lifecycle
  document.addEventListener('DOMContentLoaded', () => {
    machines.transition('appFlow', 'LOADED');
  });
});
```

## Defensive Features

### 1. No Global Pollution

All services are namespaced under `PewpiShared` or available via modules:

```javascript
// Browser (global)
window.PewpiShared.services.tokenService

// Node.js (module)
const tokenService = require('./src/pewpi-shared/token-service');
```

### 2. Idempotent Initialization

Services can be initialized multiple times safely:

```javascript
await tokenService.initialize(); // First time
await tokenService.initialize(); // Safe - returns immediately
```

### 3. Graceful Degradation

Services work even if optional features aren't available:

```javascript
// Works without crypto.getRandomValues
const token = tokenService.createToken('test');

// Works without localStorage
const user = authService.getCurrentUser();

// Works without window.ethereum
const result = await walletUnified.connect('Generic');
```

### 4. Error Isolation

Errors in one service don't break others:

```javascript
try {
  await walletUnified.connect('MetaMask');
} catch (error) {
  // Wallet error doesn't affect other services
  console.error('Wallet error:', error);
  
  // Other services still work
  const token = tokenService.createToken('fallback');
}
```

## Migration Guide

### Gradual Migration

You can migrate existing code gradually:

#### Before (Existing Code)
```javascript
// Your existing authentication
function login(username, password) {
  // Custom implementation
}
```

#### After (With pewpi-shared)
```javascript
// Keep existing code, add pewpi-shared alongside
function login(username, password) {
  // Your existing implementation
  const result = customAuth(username, password);
  
  // Also update pewpi-shared (optional)
  if (window.PewpiShared) {
    PewpiShared.services.authService.authenticate(
      username, 
      password, 
      'password'
    );
  }
  
  return result;
}
```

#### Future (Full Migration)
```javascript
// Eventually replace with pewpi-shared
async function login(username, password) {
  const result = await PewpiShared.services.authService.authenticate(
    username,
    password,
    'password'
  );
  return result;
}
```

## Testing Integration

### Test Without Breaking Existing Code

```javascript
// test-integration.js
async function testPewpiShared() {
  console.log('Testing pewpi-shared integration...');
  
  // Test initialization
  await PewpiShared.initialize();
  console.log('✓ Initialization successful');
  
  // Test token service
  const token = PewpiShared.services.tokenService.createToken('test');
  console.log('✓ Token created:', token.id);
  
  // Test auth service
  const authResult = await PewpiShared.services.authService.authenticate(
    'test@example.com',
    'testpassword123',
    'password'
  );
  console.log('✓ Auth successful:', authResult.success);
  
  // Test wallet (with mock)
  const walletResult = await PewpiShared.services.walletUnified.connect('Generic');
  console.log('✓ Wallet connected:', walletResult.success);
  
  console.log('All tests passed! ✓');
}

// Run tests without affecting existing code
testPewpiShared().catch(console.error);
```

### Verify Non-Destructive Integration

```javascript
// Verify existing functionality still works
function verifyExistingCode() {
  // Test 1: Existing DOM elements unchanged
  const originalElements = document.querySelectorAll('*').length;
  console.log('Original elements:', originalElements);
  
  // Load pewpi-shared
  const script = document.createElement('script');
  script.src = 'src/pewpi-shared/index-shim.js';
  script.onload = () => {
    const newElements = document.querySelectorAll('*').length;
    console.log('After pewpi-shared:', newElements);
    console.log('No elements removed:', newElements >= originalElements);
  };
  document.head.appendChild(script);
}
```

## Troubleshooting

### Issue: Services Not Available

**Solution**: Ensure index-shim.js is loaded before accessing services.

```html
<script src="src/pewpi-shared/index-shim.js"></script>
<script>
  // Wait for initialization
  PewpiShared.initialize().then(() => {
    // Now services are ready
  });
</script>
```

### Issue: Wallet Connection Fails

**Solution**: Check if wallet provider is available.

```javascript
if (typeof window !== 'undefined' && window.ethereum) {
  await wallet.connect('MetaMask');
} else {
  console.log('MetaMask not available, using mock wallet');
  await wallet.connect('Generic');
}
```

### Issue: Token Service Not Working

**Solution**: Ensure initialization order.

```javascript
// Correct order
await tokenService.initialize();
await authService.initialize(tokenService); // Pass dependency
```

## Best Practices

### 1. Initialize Early

Load pewpi-shared early in your app lifecycle:

```html
<head>
  <script src="src/pewpi-shared/index-shim.js"></script>
</head>
```

### 2. Check Status

Verify services are ready before use:

```javascript
const status = PewpiShared.services.tokenService.getStatus();
if (status.initialized) {
  // Service is ready
}
```

### 3. Handle Errors

Always handle errors gracefully:

```javascript
try {
  const result = await walletUnified.connect('MetaMask');
  if (!result.success) {
    console.error('Connection failed:', result.error);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### 4. Use Events

Decouple components with the event system:

```javascript
// Component A
listener.on('data:updated', (data) => {
  // React to updates
});

// Component B
listener.emit('data:updated', { value: 123 });
```

## Security Notes

1. **Tokens**: Store securely, validate server-side
2. **Wallet Signatures**: Always verify on backend
3. **Sessions**: Use httpOnly cookies in production
4. **HTTPS**: Always use HTTPS in production
5. **Input Validation**: Validate all user inputs

## Performance Considerations

- Services are lazy-loaded (only load what you use)
- Tokens are stored in memory (fast access)
- Event queue processes asynchronously
- UI components use minimal CSS

## Rollback Plan

If you need to remove pewpi-shared:

1. Remove `<script src="src/pewpi-shared/index-shim.js">`
2. Remove `src/pewpi-shared/` directory
3. Remove pewpi-shared specific code
4. Existing code continues to work

No breaking changes!

## Support

For issues or questions about integration:

1. Check the README.md for API details
2. Review integration patterns above
3. Test with the provided test scripts
4. Verify initialization order

---

**Integration Status**: ✓ Non-Destructive, Safe, Ready for Production
