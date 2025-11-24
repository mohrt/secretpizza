/**
 * Custom crypto polyfill module that provides browser crypto API
 * This file is used as an alias for 'crypto' in Vite config
 */

if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
  const browserCrypto = window.crypto;
  
  export default {
    getRandomValues: function(array) {
      return browserCrypto.getRandomValues(array);
    },
    randomBytes: function(size) {
      const bytes = new Uint8Array(size);
      browserCrypto.getRandomValues(bytes);
      return bytes;
    },
  };
  
  // Also export as named exports for compatibility
  export const getRandomValues = browserCrypto.getRandomValues.bind(browserCrypto);
  export function randomBytes(size) {
    const bytes = new Uint8Array(size);
    browserCrypto.getRandomValues(bytes);
    return bytes;
  }
} else {
  // Fallback - should not happen in modern browsers
  throw new Error('Browser crypto API not available');
}

