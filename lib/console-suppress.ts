/**
 * Console Suppression Utility
 * Suppresses console.log, console.info, and console.debug in production
 * while keeping console.error and console.warn for critical issues
 */

if (typeof window !== 'undefined') {
  // Client-side: Suppress console output in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Store original console methods
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalDebug = console.debug;
    
    // Override console methods to be no-ops in production
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    
    // Keep console.error and console.warn for critical issues
    // They will still work but can be filtered by logger if needed
  }
}

// Server-side: This will be handled by the logger utility
// The logger already suppresses output based on NODE_ENV

