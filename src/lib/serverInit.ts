/**
 * Server Initialization
 *
 * This module handles server-side initialization tasks that need to run
 * when the application starts. It's imported at the top level to ensure
 * initialization happens early.
 *
 * Tasks:
 * - Initialize event handlers for new backend
 * - Initialize backend feature flags (if needed)
 * - Setup any other server-side infrastructure
 */

import { initializeEventHandlers } from '@/services';

let initialized = false;

/**
 * Initialize server-side infrastructure
 * Safe to call multiple times (idempotent)
 */
export async function initializeServer() {
  if (initialized) {
    return;
  }

  console.log('[ServerInit] Initializing server infrastructure...');

  try {
    // Initialize event handlers (connects event bus to handlers)
    initializeEventHandlers();
    console.log('[ServerInit] ✅ Event handlers registered');

    // Initialize backend feature flags (optional - creates if not exist)
    try {
      const { initializeBackendFlags } = await import('./backendFlags');
      await initializeBackendFlags();
      console.log('[ServerInit] ✅ Backend feature flags initialized');
    } catch (error) {
      console.warn('[ServerInit] ⚠️ Backend flags initialization failed (non-fatal):', error);
    }

    initialized = true;
    console.log('[ServerInit] ✅ Server initialization complete');
  } catch (error) {
    console.error('[ServerInit] ❌ Initialization failed:', error);
    throw error;
  }
}

// Auto-initialize when this module is imported
initializeServer().catch((error) => {
  console.error('[ServerInit] Fatal initialization error:', error);
});

export { initialized };
