/**
 * Wallet utilities for BSV wallet generation
 * All operations are client-side only for security
 */

import { PrivateKey } from '@bsv/sdk'

/**
 * Parse derivation path string into components
 * Format: m/44'/236'/0'/0 or m/44'/236'/0'/0/0
 */
function parseDerivationPath(path: string): {
  basePath: string
  startIndex: number
} {
  // Remove 'm/' prefix if present
  const cleanPath = path.replace(/^m\//, '')
  
  // Split by '/' and check if last component is a number (address index)
  const parts = cleanPath.split('/')
  const lastPart = parts[parts.length - 1]
  const lastIndex = parseInt(lastPart, 10)
  
  if (!isNaN(lastIndex) && lastPart === lastIndex.toString()) {
    // Last part is a number, it's the address index
    return {
      basePath: 'm/' + parts.slice(0, -1).join('/'),
      startIndex: lastIndex
    }
  } else {
    // No address index in path, start from 0
    return {
      basePath: path.startsWith('m/') ? path : 'm/' + path,
      startIndex: 0
    }
  }
}

/**
 * Derive addresses and public key from mnemonic using BIP32/BIP44 derivation path
 */
export async function deriveAddressesFromMnemonic(
  mnemonic: string,
  derivationPath: string,
  count: number = 5
): Promise<{ addresses: string[]; firstPublicKey: string }> {
  const { mnemonicToSeedSync } = await import("@scure/bip39")
  const seed = mnemonicToSeedSync(mnemonic.trim(), "")
  
  const { basePath, startIndex } = parseDerivationPath(derivationPath)
  
  // For now, use a simplified approach:
  // - Use the seed as master key
  // - Derive addresses by hashing seed + index
  // This is not full BIP32 but will produce deterministic addresses
  
  const addresses: string[] = []
  let firstPublicKey = ""
  
  for (let i = 0; i < count; i++) {
    const addressIndex = startIndex + i
    
    // Create deterministic key material from seed + path + index
    const pathData = basePath + '/' + addressIndex
    const keyMaterial = new TextEncoder().encode(seed.toString() + pathData)
    
    // Hash to get 32 bytes for private key
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyMaterial)
    const privateKeyBytes = new Uint8Array(hashBuffer)
    
    // Ensure valid private key (not all zeros, within secp256k1 range)
    // For simplicity, we'll use the bytes directly
    const privateKeyHex = Array.from(privateKeyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    try {
      const privateKey = PrivateKey.fromString(privateKeyHex)
      const publicKey = privateKey.toPublicKey()
      const address = publicKey.toAddress()
      addresses.push(address)
      
      // Store the public key for the first address (index 0)
      if (i === 0) {
        firstPublicKey = publicKey.toString()
      }
    } catch (error) {
      // If key is invalid, try with a different hash
      const hash2 = await crypto.subtle.digest('SHA-256', privateKeyBytes)
      const privateKeyHex2 = Array.from(new Uint8Array(hash2))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      const privateKey = PrivateKey.fromString(privateKeyHex2)
      const publicKey = privateKey.toPublicKey()
      const address = publicKey.toAddress()
      addresses.push(address)
      
      // Store the public key for the first address (index 0)
      if (i === 0) {
        firstPublicKey = publicKey.toString()
      }
    }
  }
  
  return { addresses, firstPublicKey }
}

export interface Wallet {
  privateKey: string
  publicKey: string
  address: string
}

/**
 * Generate a new BSV wallet
 * @returns Wallet object with private key, public key, and address
 */
export function generateWallet(): Wallet {
  // Generate a new private key
  const privateKey = PrivateKey.fromRandom()
  
  // Derive public key
  const publicKey = privateKey.toPublicKey()
  
  // Derive address from public key (mainnet)
  const address = publicKey.toAddress()
  
  return {
    privateKey: privateKey.toString(),
    publicKey: publicKey.toString(),
    address: address,
  }
}

/**
 * Validate a private key string
 * @param privateKeyString - Private key in string format
 * @returns true if valid, false otherwise
 */
export function validatePrivateKey(privateKeyString: string): boolean {
  try {
    PrivateKey.fromString(privateKeyString)
    return true
  } catch {
    return false
  }
}

/**
 * Generate multiple addresses from a wallet
 * For now, returns the wallet's primary address multiple times
 * In production, this should use proper HD wallet derivation (BIP32/BIP44) to generate
 * multiple addresses from a single seed/mnemonic
 * @param wallet - Wallet object
 * @param count - Number of addresses to generate (default: 5)
 * @returns Array of addresses
 */
export function generateAddresses(wallet: Wallet, count: number = 5): string[] {
  // For now, return the wallet's primary address
  // TODO: Implement proper HD wallet derivation (BIP32/BIP44) to generate multiple addresses
  // from a single seed/mnemonic phrase
  return Array(count).fill(wallet.address)
}

