/**
 * Wallet utilities for BSV wallet generation
 * All operations are client-side only for security
 */

import { PrivateKey } from '@bsv/sdk'

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

