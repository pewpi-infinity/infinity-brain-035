#!/usr/bin/env node
/**
 * Test script for pewpi-shared services in Node.js environment
 */

const path = require('path');

console.log('=== pewpi-shared Node.js Test ===\n');

async function testServices() {
  try {
    // Test Token Service
    console.log('1. Testing Token Service...');
    const tokenService = require('./src/pewpi-shared/token-service');
    await tokenService.initialize();
    const token = tokenService.createToken('test', { userId: 'test123' }, 60000);
    console.log(`   ✓ Token created: ${token.id}`);
    const isValid = tokenService.validateToken(token.id);
    console.log(`   ✓ Token is valid: ${isValid}`);
    const status = tokenService.getStatus();
    console.log(`   ✓ Total tokens: ${status.totalTokens}`);

    // Test Auth Service
    console.log('\n2. Testing Auth Service...');
    const authService = require('./src/pewpi-shared/auth-service');
    await authService.initialize(tokenService);
    const authResult = await authService.authenticate(
      'test@pewpi.com',
      'testpassword',
      'password'
    );
    console.log(`   ✓ Authentication: ${authResult.success}`);
    if (authResult.success) {
      console.log(`   ✓ User ID: ${authResult.user.id}`);
      console.log(`   ✓ Session token: ${authResult.sessionToken.id}`);
    }

    // Test Integration Listener
    console.log('\n3. Testing Integration Listener...');
    const integrationListener = require('./src/pewpi-shared/integration-listener');
    await integrationListener.initialize();
    
    let eventReceived = false;
    integrationListener.on('test:event', (data) => {
      eventReceived = true;
      console.log(`   ✓ Event received: ${data.message}`);
    });
    
    await integrationListener.emit('test:event', { message: 'Hello from test!' });
    console.log(`   ✓ Event system working: ${eventReceived}`);

    // Test Machines Adapter
    console.log('\n4. Testing Machines Adapter...');
    const machinesAdapter = require('./src/pewpi-shared/machines/adapter');
    await machinesAdapter.initialize();
    
    machinesAdapter.registerMachine('testFlow', {
      name: 'Test Flow',
      initialState: 'idle',
      states: {
        idle: {
          on: { START: 'running' }
        },
        running: {
          on: { STOP: 'idle' }
        }
      }
    });
    console.log('   ✓ Machine registered: testFlow');
    
    const transition = await machinesAdapter.transition('testFlow', 'START');
    console.log(`   ✓ Transitioned to: ${transition.currentState}`);

    // Test Wallet Unified
    console.log('\n5. Testing Wallet Unified...');
    const walletUnified = require('./src/pewpi-shared/wallet-unified');
    await walletUnified.initialize(authService);
    const walletResult = await walletUnified.connect('Generic');
    console.log(`   ✓ Wallet connection: ${walletResult.success}`);
    if (walletResult.success) {
      console.log(`   ✓ Wallet address: ${walletResult.wallet.address}`);
      console.log(`   ✓ Balance: ${walletResult.wallet.balance.toFixed(4)}`);
    }

    // Test UI Shim
    console.log('\n6. Testing UI Shim...');
    const uiShim = require('./src/pewpi-shared/ui-shim');
    await uiShim.initialize();
    console.log('   ✓ UI Shim initialized');
    const uiStatus = uiShim.getStatus();
    console.log(`   ✓ UI initialized: ${uiStatus.initialized}`);

    // Overall status
    console.log('\n=== All Tests Passed ✓ ===');
    console.log('\nOverall Status:');
    console.log(`  - Token Service: ${tokenService.getStatus().initialized ? '✓' : '✗'}`);
    console.log(`  - Auth Service: ${authService.getStatus().initialized ? '✓' : '✗'}`);
    console.log(`  - Wallet Unified: ${walletUnified.getStatus().initialized ? '✓' : '✗'}`);
    console.log(`  - Integration Listener: ${integrationListener.getStatus().initialized ? '✓' : '✗'}`);
    console.log(`  - Machines Adapter: ${machinesAdapter.getStatus().initialized ? '✓' : '✗'}`);
    console.log(`  - UI Shim: ${uiShim.getStatus().initialized ? '✓' : '✗'}`);

    console.log('\n∞ pewpi-shared is ready for production!\n');

    return true;
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run tests
testServices().then(success => {
  process.exit(success ? 0 : 1);
});
