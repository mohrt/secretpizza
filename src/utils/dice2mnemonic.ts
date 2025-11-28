/**
 * Dice to mnemonic conversion following the algorithm from:
 * https://github.com/mohrt/dice2mnemonic
 * 
 * This is PURELY DETERMINISTIC - NO PRNG is used
 */

import { entropyToMnemonic, validateMnemonic } from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english.js"

const BIP39_WORDLIST_SIZE = 2048

/**
 * Mimics m-sided die using an n-sided die
 * Based on: https://math.stackexchange.com/a/2249950
 * 
 * @param m - Target number of sides (e.g., 2048 for BIP39 wordlist)
 * @param n - Number of sides on the actual die
 * @param rolls - Array of dice roll values (1-based, will be converted to 0-based)
 * @param rollIndex - Current index in the rolls array (will be modified)
 * @returns A uniform random number in range [1, m]
 */
function uniformGenerator(
  m: number,
  n: number,
  rolls: number[],
  rollIndex: { current: number }
): number {
  const r = Math.ceil(Math.log(m) / Math.log(n))
  
  // Keep trying until we get a valid candidate (rejection sampling)
  // This matches the Python script's while True loop
  while (true) {
    // Need r rolls to generate one uniform value
    if (rollIndex.current + r > rolls.length) {
      throw new Error(`Not enough dice rolls. Need at least ${r} more rolls.`)
    }
    
    // Convert rolls to 0-based and calculate candidate
    let candidate = 0
    for (let power = 0; power < r; power++) {
      const roll = rolls[rollIndex.current + power]
      if (roll < 1 || roll > n) {
        throw new Error(`Invalid roll value: ${roll}. Must be between 1 and ${n}.`)
      }
      candidate += Math.pow(n, power) * (roll - 1)
    }
    candidate += 1 // Convert to 1-based
    
    rollIndex.current += r
    
    // If candidate is valid, return it
    if (candidate <= m) {
      return candidate
    }
    
    // Otherwise, reject and try again with next r rolls (continue loop)
    // This is rejection sampling - we keep consuming rolls until we get a valid candidate
  }
}

/**
 * Parse dice roll string into array of numbers
 */
function parseDiceRolls(rolls: string, dieType: "coin" | "d4" | "d6" | "d8" | "d10" | "d16"): number[] {
  let normalized = rolls.trim().toUpperCase()
  
  if (dieType === "coin") {
    // Convert H/T to 1/2, or 0/1 to 1/2
    // H or 0 → 1 (heads)
    // T or 1 → 2 (tails)
    // Use temporary markers to avoid conflicts
    normalized = normalized.replace(/[HT]/g, (char) => char === "H" ? "A" : "B") // H→A, T→B
    normalized = normalized.replace(/0/g, "A") // 0 → A (will become 1)
    normalized = normalized.replace(/1/g, "B") // 1 → B (will become 2)
    normalized = normalized.replace(/A/g, "1") // A → 1 (heads)
    normalized = normalized.replace(/B/g, "2") // B → 2 (tails)
    normalized = normalized.replace(/[^12]/g, "")
    return normalized.split("").map(Number)
  } else if (dieType === "d16") {
    // Hexadecimal: 0-9, A-F -> 1-16
    normalized = normalized.replace(/[^0-9A-F]/g, "")
    return normalized.split("").map((char) => {
      const num = parseInt(char, 16)
      return num + 1 // Convert 0-15 to 1-16
    })
  } else if (dieType === "d10") {
    // Standard d10 dice show 0-9 (used for percentile rolls in RPGs)
    // Convert 0-9 to 1-10 internally for uniformGenerator
    normalized = normalized.replace(/[^0-9]/g, "")
    return normalized.split("").map((char) => {
      const num = parseInt(char, 10)
      return num + 1 // Convert 0-9 to 1-10
    })
  } else {
    // For d4, d6, d8: dice show 1-n, parse as-is
    normalized = normalized.replace(/[^0-9]/g, "")
    return normalized.split("").map(Number)
  }
}

/**
 * Get number of sides for a die type
 */
function getDieSides(dieType: "coin" | "d4" | "d6" | "d8" | "d10" | "d16"): number {
  const sidesMap = {
    coin: 2,
    d4: 4,
    d6: 6,
    d8: 8,
    d10: 10,
    d16: 16,
  }
  return sidesMap[dieType]
}

/**
 * Convert dice rolls to mnemonic phrase using the dice2mnemonic algorithm
 * 
 * @param rolls - String of dice rolls
 * @param dieType - Type of die used
 * @param seedLength - Desired mnemonic length (12, 15, 18, 21, or 24 words)
 * @returns Mnemonic phrase
 */
export function diceRollsToMnemonic(
  rolls: string,
  dieType: "coin" | "d4" | "d6" | "d8" | "d10" | "d16",
  seedLength: 12 | 15 | 18 | 21 | 24
): string {
  const parsedRolls = parseDiceRolls(rolls, dieType)
  const sides = getDieSides(dieType)
  const rollIndex = { current: 0 }
  
  // Check for worst-case input: all maximum values (e.g., all F's for d16)
  // This will cause 100% rejection rate and can never succeed
  if (parsedRolls.length > 0) {
    const allMaxValue = parsedRolls.every(roll => roll === sides)
    if (allMaxValue) {
      throw new Error(
        `Invalid input: All dice rolls are the maximum value (${sides}). ` +
        `This causes 100% rejection rate and cannot generate a valid mnemonic. ` +
        `Please use a mix of different values.`
      )
    }
    
    // Check for highly repetitive patterns (e.g., repeating sequences)
    // These can cause duplicate word cycles
    if (parsedRolls.length >= 16) {
      const first16 = parsedRolls.slice(0, 16)
      const second16 = parsedRolls.slice(16, 32)
      const isRepeating = first16.length === second16.length && 
        first16.every((val, i) => val === second16[i])
      if (isRepeating && parsedRolls.length > 64) {
        // Warn but don't block - just inform user they may need more rolls
        console.warn("Warning: Input appears to be a repeating pattern. This may cause duplicate word cycles and require more rolls.")
      }
    }
  }
  
  // Validate seed length
  if (![12, 15, 18, 21, 24].includes(seedLength)) {
    throw new Error("Seed length must be 12, 15, 18, 21, or 24")
  }
  
  // Generate word indices (excluding checksum)
  const wordIndices: number[] = []
  const usedIndices = new Set<number>()
  
  for (let i = 0; i < seedLength - 1; i++) {
    let wordIndex: number
    let attempts = 0
    const maxAttempts = 1000 // Prevent infinite loop
    const rollIndexBefore = rollIndex.current
    
    while (attempts < maxAttempts) {
      try {
        // uniform_generator returns 1-based, convert to 0-based
        wordIndex = uniformGenerator(BIP39_WORDLIST_SIZE, sides, parsedRolls, rollIndex) - 1
        
        // Check for duplicates (Python script skips duplicates)
        if (usedIndices.has(wordIndex)) {
          attempts++
          continue // Try again with next rolls
        }
        
        wordIndices.push(wordIndex)
        usedIndices.add(wordIndex)
        break
      } catch (error) {
        // If we run out of rolls, we can't continue
        throw new Error(`Not enough dice rolls to generate ${seedLength}-word mnemonic. ${error}`)
      }
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Too many duplicate words. Need more dice rolls.")
    }
  }
  
  // Build phrase from word indices
  const phraseWords: string[] = []
  for (const index of wordIndices) {
    phraseWords.push(wordlist[index])
  }
  const partialPhrase = phraseWords.join(" ")
  
  // Find valid checksum words
  const validChecksumWords: string[] = []
  for (let i = 0; i < wordlist.length; i++) {
    const testPhrase = partialPhrase + " " + wordlist[i]
    if (validateMnemonic(testPhrase, wordlist)) {
      validChecksumWords.push(wordlist[i])
    }
  }
  
  if (validChecksumWords.length === 0) {
    throw new Error("No valid checksum word found. This should not happen.")
  }
  
  // Use dice to select checksum word
  const checksumIndex = uniformGenerator(validChecksumWords.length, sides, parsedRolls, rollIndex) - 1
  const checksumWord = validChecksumWords[checksumIndex]
  
  const finalPhrase = partialPhrase + " " + checksumWord
  
  // Verify the final phrase
  if (!validateMnemonic(finalPhrase, wordlist)) {
    throw new Error("Generated mnemonic failed validation. This should not happen.")
  }
  
  return finalPhrase
}

/**
 * Convert dice rolls to private key (deterministic)
 * For d16: use the exact hex string entered (base16, no conversion)
 * For other dice: convert base-N number to base16 (hex)
 */
export function diceRollsToPrivateKey(
  rolls: string,
  dieType: "coin" | "d4" | "d6" | "d8" | "d10" | "d16"
): string {
  if (dieType === "d16") {
    // For d16, use the exact hex string entered (already base16)
    // Private keys are 32 bytes = 64 hex characters
    const normalized = rolls.trim().toUpperCase().replace(/[^0-9A-F]/g, "")
    // Take first 64 characters (32 bytes) for private key, pad if needed
    return normalized.slice(0, 64).padEnd(64, "0")
  }
  
  // For other dice types, convert base-N number to base16 (hex)
  // Parse the raw input to get the actual die face values
  let normalized = rolls.trim().toUpperCase()
  const sides = getDieSides(dieType)
  
  // Parse dice rolls based on die type to get 0-based values for base-N conversion
  let baseNDigits: number[] = []
  
  if (dieType === "coin") {
    // Coin: 0/1 or H/T -> convert to 0/1 for base-2
    normalized = normalized.replace(/[HT]/g, (char) => char === "H" ? "1" : "0")
    normalized = normalized.replace(/[^01]/g, "")
    baseNDigits = normalized.split("").map(Number) // Already 0-1, perfect for base-2
  } else if (dieType === "d10") {
    // d10: User enters 0-9, these are already base-10 digits (0-9)
    normalized = normalized.replace(/[^0-9]/g, "")
    baseNDigits = normalized.split("").map(Number) // Already 0-9, perfect for base-10
  } else {
    // d4, d6, d8: User enters 1-N, convert to 0-(N-1) for base-N
    normalized = normalized.replace(/[^0-9]/g, "")
    baseNDigits = normalized.split("").map((char) => {
      const num = parseInt(char, 10)
      if (num < 1 || num > sides) {
        throw new Error(`Invalid roll: ${num}. Must be between 1 and ${sides}.`)
      }
      return num - 1 // Convert 1-N to 0-(N-1) for base-N
    })
  }
  
  // Convert base-N number to BigInt
  let bigIntValue = BigInt(0)
  for (const digit of baseNDigits) {
    if (digit < 0 || digit >= sides) {
      throw new Error(`Invalid base-${sides} digit: ${digit}. Must be between 0 and ${sides - 1}.`)
    }
    bigIntValue = bigIntValue * BigInt(sides) + BigInt(digit)
  }
  
  // Convert BigInt to hex string (base16)
  // We want 64 hex characters (32 bytes)
  let hexString = bigIntValue.toString(16).toUpperCase()
  
  // Pad to 64 characters if needed, or truncate if too long
  if (hexString.length < 64) {
    hexString = hexString.padStart(64, "0")
  } else {
    hexString = hexString.slice(-64) // Take last 64 characters if longer
  }
  
  return hexString
}

