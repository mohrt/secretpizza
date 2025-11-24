/**
 * Wallet utilities for BSV wallet generation
 * All operations are client-side only for security
 */

import { PrivateKey, PublicKey } from '@bsv/sdk'

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

