import type { Plugin } from 'vite'

/**
 * Vite plugin to inject crypto polyfill and transform library code
 */
export function cryptoPolyfillPlugin(): Plugin {
  return {
    name: 'crypto-polyfill',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>
    <script>
      // Inject crypto polyfill before any modules load
      // This MUST run before secrets.js-grempe loads
      (function() {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
          const browserCrypto = window.crypto;
          const cryptoPolyfill = {
            getRandomValues: function(array) {
              return browserCrypto.getRandomValues(array);
            },
            randomBytes: function(size) {
              const bytes = new Uint8Array(size);
              browserCrypto.getRandomValues(bytes);
              return bytes;
            }
          };
          
          // Make available as globalThis.crypto
          if (typeof globalThis !== 'undefined') {
            try {
              Object.defineProperty(globalThis, 'crypto', {
                value: cryptoPolyfill,
                writable: true,
                configurable: true,
                enumerable: true,
              });
            } catch (e) {
              globalThis.crypto = cryptoPolyfill;
            }
          }
          
          // Also set on window (though it's read-only, this ensures it's available)
          // And create a bare global 'crypto' variable using IIFE
          (function(global) {
            try {
              global.crypto = cryptoPolyfill;
            } catch (e) {
              // Ignore if can't set
            }
          })(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : this);
        }
      })();
    </script>`
      )
    },
    transform(code, id) {
      // Transform secrets.js-grempe to use globalThis.crypto instead of bare crypto
      if (id.includes('secrets.js-grempe')) {
        // Replace bare 'crypto' references with 'globalThis.crypto' or '(typeof crypto !== "undefined" ? crypto : globalThis.crypto)'
        return code.replace(
          /(\W)crypto\.getRandomValues/g,
          '$1(typeof crypto !== "undefined" ? crypto : (typeof globalThis !== "undefined" ? globalThis.crypto : window.crypto)).getRandomValues'
        ).replace(
          /(\W)typeof crypto/g,
          '$1typeof (typeof crypto !== "undefined" ? crypto : (typeof globalThis !== "undefined" ? globalThis.crypto : window.crypto))'
        );
      }
      return code;
    },
  }
}

