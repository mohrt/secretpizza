/**
 * Browser crypto polyfill for Node.js crypto module
 * Uses the browser's native crypto.getRandomValues API
 */

// Polyfill for crypto.randomBytes
if (typeof window !== 'undefined' && window.crypto) {
  const getRandomValues = window.crypto.getRandomValues.bind(window.crypto)
  
  // Create a minimal crypto polyfill
  const cryptoPolyfill = {
    randomBytes: (size: number): Uint8Array => {
      const bytes = new Uint8Array(size)
      getRandomValues(bytes)
      return bytes
    },
    getRandomValues: getRandomValues,
  }

  // Make it available globally for Node.js-style imports
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).crypto = cryptoPolyfill
  }
}

export {}

