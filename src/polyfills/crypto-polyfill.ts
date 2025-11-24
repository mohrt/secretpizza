/**
 * Crypto polyfill for browser compatibility
 * Provides Node.js-style crypto API using browser's native crypto
 * This must run before any module that uses crypto is imported
 */

// Ensure crypto is available globally before any modules load
// Note: window.crypto is read-only, so we create a separate global 'crypto' variable
if (typeof window !== 'undefined') {
  const browserCrypto = window.crypto || (window as any).msCrypto
  
  if (browserCrypto && browserCrypto.getRandomValues) {
    // Create a crypto object that works for Node.js-style imports
    const cryptoPolyfill = {
      getRandomValues: browserCrypto.getRandomValues.bind(browserCrypto),
      randomBytes: (size: number): Uint8Array => {
        const bytes = new Uint8Array(size)
        browserCrypto.getRandomValues(bytes)
        return bytes
      },
    }

    // Make it available as a global variable (not window.crypto)
    // This is what secrets.js-grempe checks during initialization
    if (typeof globalThis !== 'undefined') {
      // Create a global 'crypto' variable (separate from window.crypto)
      Object.defineProperty(globalThis, 'crypto', {
        value: cryptoPolyfill,
        writable: true,
        configurable: true,
      })
    }
  }
}

export {}

