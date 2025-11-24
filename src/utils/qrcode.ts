/**
 * QR Code generation utilities
 */

import QRCode from 'qrcode'

/**
 * Generate a QR code data URL from text
 * @param text - Text to encode in QR code
 * @param options - Optional QR code options
 * @returns Promise resolving to data URL string
 */
export async function generateQRCodeDataURL(
  text: string,
  options?: {
    width?: number
    margin?: number
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  }
): Promise<string> {
  const defaultOptions = {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'M' as const,
    ...options,
  }

  try {
    const dataURL = await QRCode.toDataURL(text, defaultOptions)
    return dataURL
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error}`)
  }
}

/**
 * Generate a QR code as a canvas element
 * @param text - Text to encode in QR code
 * @param canvas - Canvas element to draw on
 * @param options - Optional QR code options
 * @returns Promise that resolves when QR code is drawn
 */
export async function generateQRCodeCanvas(
  text: string,
  canvas: HTMLCanvasElement,
  options?: {
    width?: number
    margin?: number
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  }
): Promise<void> {
  const defaultOptions = {
    width: canvas.width || 300,
    margin: 2,
    errorCorrectionLevel: 'M' as const,
    ...options,
  }

  try {
    await QRCode.toCanvas(canvas, text, defaultOptions)
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error}`)
  }
}

