/**
 * Shamir Secret Sharing utilities
 * All operations are client-side only for security
 */

import { split, combine } from 'shamir-secret-sharing'

export interface ShamirConfig {
  shares: number
  threshold: number
}

/**
 * Convert string to Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

/**
 * Convert Uint8Array to string
 */
function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr)
}

/**
 * Convert Uint8Array to hex string for storage/display
 */
function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert hex string to Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

/**
 * Split a secret into Shamir secret shares
 * @param secret - The secret to split (private key)
 * @param shares - Total number of shares to create
 * @param threshold - Minimum number of shares needed to reconstruct
 * @returns Promise resolving to array of share hex strings
 */
export async function splitSecret(
  secret: string,
  shares: number,
  threshold: number
): Promise<string[]> {
  if (shares < 2) {
    throw new Error('Must create at least 2 shares')
  }
  
  if (threshold < 2) {
    throw new Error('Threshold must be at least 2')
  }
  
  if (threshold > shares) {
    throw new Error('Threshold cannot exceed number of shares')
  }

  // Convert secret string to Uint8Array
  const secretBytes = stringToUint8Array(secret)
  
  // Split the secret
  const shareArrays = await split(secretBytes, shares, threshold)
  
  // Convert each share to hex string for storage
  return shareArrays.map(uint8ArrayToHex)
}

/**
 * Reconstruct a secret from Shamir secret shares
 * @param shares - Array of share hex strings (minimum threshold number)
 * @returns Promise resolving to the reconstructed secret (private key)
 */
export async function reconstructSecret(shares: string[]): Promise<string> {
  if (shares.length < 2) {
    throw new Error('Need at least 2 shares to reconstruct')
  }

  // Convert hex strings back to Uint8Array
  const shareArrays = shares.map(hexToUint8Array)
  
  // Combine shares
  const secretBytes = await combine(shareArrays)
  
  // Convert back to string
  return uint8ArrayToString(secretBytes)
}

/**
 * Validate a share string (hex format)
 * @param share - Share hex string to validate
 * @returns true if valid hex format, false otherwise
 */
export function validateShare(share: string): boolean {
  try {
    // Check if it's valid hex
    if (!/^[0-9a-fA-F]+$/.test(share)) {
      return false
    }
    // Check if length is even (hex pairs)
    if (share.length % 2 !== 0) {
      return false
    }
    // Try to convert to Uint8Array
    hexToUint8Array(share)
    return true
  } catch {
    return false
  }
}

