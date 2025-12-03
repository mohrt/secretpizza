import { useState } from 'react'
import { generateWallet, type Wallet } from '../utils/wallet'
import { splitSecret, type ShamirConfig } from '../utils/shamir'
import { generateQRCodeDataURL } from '../utils/qrcode'
import './WalletGenerator.css'

interface ShareWithQR {
  share: string
  qrCode: string
  index: number
}

export default function WalletGenerator() {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [shares, setShares] = useState<ShareWithQR[]>([])
  const [config, setConfig] = useState<ShamirConfig>({ shares: 5, threshold: 3 })
  const [isGenerating, setIsGenerating] = useState(false)
  const [step, setStep] = useState<'generate' | 'split' | 'print'>('generate')

  const handleGenerateWallet = () => {
    const newWallet = generateWallet()
    setWallet(newWallet)
    setShares([])
    setStep('split')
  }

  const handleSplitWallet = async () => {
    if (!wallet) return

    setIsGenerating(true)
    try {
      const shareStrings = await splitSecret(wallet.privateKey, config.shares, config.threshold)
      
      // Generate QR codes for each share
      const sharesWithQR = await Promise.all(
        shareStrings.map(async (share, index) => ({
          share,
          qrCode: await generateQRCodeDataURL(share, { width: 600, errorCorrectionLevel: 'H' }),
          index: index + 1,
        }))
      )

      setShares(sharesWithQR)
      setStep('print')
    } catch (error) {
      console.error('Error splitting wallet:', error)
      alert('Error splitting wallet. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleReset = () => {
    setWallet(null)
    setShares([])
    setStep('generate')
  }

  return (
    <div className="wallet-generator">
      {step === 'generate' && (
        <div className="step-generate">
          <h2>Generate BSV Wallet</h2>
          <p>Create a new cold storage wallet. All operations happen in your browser - your keys never leave your device.</p>
          <button onClick={handleGenerateWallet} className="btn-primary">
            Generate New Wallet
          </button>
        </div>
      )}

      {step === 'split' && wallet && (
        <div className="step-split">
          <h2>Configure Secret Sharing</h2>
          <p>Split your wallet into multiple shares using Shamir Secret Sharing.</p>
          
          <div className="wallet-info">
            <div className="info-item">
              <label>Wallet Address:</label>
              <code>{wallet.address}</code>
            </div>
          </div>

          <div className="config-form">
            <div className="form-group">
              <label>
                Total Shares:
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={config.shares}
                  onChange={(e) => setConfig({ ...config, shares: parseInt(e.target.value) || 2 })}
                />
              </label>
              <small>Total number of shares to create</small>
            </div>

            <div className="form-group">
              <label>
                Threshold:
                <input
                  type="number"
                  min="2"
                  max={config.shares}
                  value={config.threshold}
                  onChange={(e) => setConfig({ ...config, threshold: parseInt(e.target.value) || 2 })}
                />
              </label>
              <small>Minimum shares needed to reconstruct (must be ≤ total shares)</small>
            </div>

            <div className="info-box">
              <strong>Example:</strong> With {config.shares} shares and threshold {config.threshold}, 
              you need at least {config.threshold} shares to recover the wallet.
            </div>

            <button 
              onClick={handleSplitWallet} 
              className="btn-primary"
              disabled={isGenerating || config.threshold > config.shares}
            >
              {isGenerating ? 'Generating Shares...' : 'Split Wallet'}
            </button>
          </div>

          <button onClick={handleReset} className="btn-secondary">
            Start Over
          </button>
        </div>
      )}

      {step === 'print' && shares.length > 0 && (
        <div className="step-print">
          <h2>Print Your Shares</h2>
          <p>Each share contains a QR code. Print and store them securely in separate locations.</p>
          
          <div className="print-actions">
            <button onClick={handlePrint} className="btn-primary">
              Print All Shares
            </button>
            <button onClick={handleReset} className="btn-secondary">
              Generate New Wallet
            </button>
          </div>

          <div className="shares-grid">
            {shares.map((shareWithQR) => (
              <div key={shareWithQR.index} className="share-card print-page">
                <div className="share-header">
                  <h3>Share {shareWithQR.index} of {shares.length}</h3>
                  <p className="share-info">
                    Threshold: {config.threshold} of {config.shares} required
                  </p>
                </div>
                <div className="qr-container">
                  <img src={shareWithQR.qrCode} alt={`QR code for share ${shareWithQR.index}`} />
                </div>
                <div className="share-text">
                  <label>Share Data:</label>
                  <code>{shareWithQR.share}</code>
                </div>
                <div className="share-warning">
                  ⚠️ Keep this share secure. Do not share with unauthorized parties.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

