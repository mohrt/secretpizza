import { useState } from 'react'
import { generateWallet, type Wallet, generateAddresses } from '../utils/wallet'
import { splitSecret, type ShamirConfig } from '../utils/shamir'
import { generateQRCodeDataURL } from '../utils/qrcode'
import SliceTemplate from './SliceTemplate'
import './CutSlices.css'

interface ShareWithQR {
  share: string
  qrCode: string
  index: number
}

interface AddressWithQR {
  address: string
  qrCode: string
  used: boolean
}

type KeyDerivation = '12-words' | '24-words' | 'roll-key'

export default function CutSlices() {
  const [keyDerivation, setKeyDerivation] = useState<KeyDerivation>('roll-key')
  const [message, setMessage] = useState('')
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [shares, setShares] = useState<ShareWithQR[]>([])
  const [config, setConfig] = useState<ShamirConfig>({ shares: 3, threshold: 2 })
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [walletLabel, setWalletLabel] = useState('')
  const [instructions, setInstructions] = useState('')
  const [generatedDate] = useState(new Date())
  const [addresses, setAddresses] = useState<AddressWithQR[]>([])
  const [showMoreAddresses, setShowMoreAddresses] = useState(false)

  const handleRollKey = () => {
    const newWallet = generateWallet()
    setWallet(newWallet)
    setMessage(newWallet.privateKey)
    setShares([])
  }

  const handlePreset = (shares: number, threshold: number) => {
    setConfig({ shares, threshold })
  }

  const handleGenerate = async () => {
    if (!message.trim()) {
      alert('Please enter a message or roll a key')
      return
    }

    setIsGenerating(true)
    try {
      // Use the message as the secret (could be mnemonic, private key, or any text)
      const secret = message.trim()
      const shareStrings = await splitSecret(secret, config.shares, config.threshold)
      
      // Generate QR codes for each share
      const sharesWithQR = await Promise.all(
        shareStrings.map(async (share, index) => ({
          share,
          qrCode: await generateQRCodeDataURL(share, { width: 600, errorCorrectionLevel: 'H' }),
          index: index + 1,
        }))
      )

      setShares(sharesWithQR)

      // Generate addresses if we have a wallet
      if (wallet) {
        const addressList = generateAddresses(wallet, 5)
        const addressesWithQR = await Promise.all(
          addressList.map(async (address) => ({
            address,
            qrCode: await generateQRCodeDataURL(address, { width: 100, errorCorrectionLevel: 'M' }),
            used: false,
          }))
        )
        setAddresses(addressesWithQR)
      }
    } catch (error) {
      console.error('Error splitting secret:', error)
      alert('Error splitting secret. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadKit = () => {
    // Create a downloadable package with all slices and address information
    // For now, trigger print which includes all slices
    window.print()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="cut-slices">
      <div className="cut-slices-header">
        <h2>🔪 Slice your bitcoins</h2>
        <p>Slice your secret phrase into several slices that needs to be combined to recover it.</p>
      </div>

      <div className="cut-slices-content">
        <div className="key-derivation-section">
          <label>Choose how to derive your key</label>
          <div className="key-derivation-buttons">
            <button
              className={`key-option ${keyDerivation === '12-words' ? 'active' : ''}`}
              onClick={() => setKeyDerivation('12-words')}
            >
              12-words
            </button>
            <span className="separator">•</span>
            <button
              className={`key-option ${keyDerivation === '24-words' ? 'active' : ''}`}
              onClick={() => setKeyDerivation('24-words')}
            >
              24-words
            </button>
            <span className="separator">•</span>
            <button
              className={`key-option ${keyDerivation === 'roll-key' ? 'active' : ''}`}
              onClick={() => {
                setKeyDerivation('roll-key')
                handleRollKey()
              }}
            >
              <span>🎲</span>
              Roll key
            </button>
          </div>
        </div>

        <div className="message-input-section">
          <label>Message to be sliced</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a mnemonic phrase, private key, or any text you want kept secret."
            rows={4}
            className="message-input"
          />
        </div>

        {wallet && (
          <>
            <div className="wallet-label-section">
              <label>Wallet Label (optional)</label>
              <input
                type="text"
                value={walletLabel}
                onChange={(e) => setWalletLabel(e.target.value)}
                placeholder="Enter a label for this wallet"
                className="wallet-label-input"
              />
            </div>

            <div className="instructions-section">
              <label>Instructions (optional)</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Custom instructions for this key slice"
                rows={3}
                className="instructions-input"
              />
            </div>
          </>
        )}

        <div className="pizza-visualization">
          <div className="pizza-container">
            <img src="/images/pizza.png" alt="Pizza" className="pizza-image" />
            <div className="pizza-ratio-overlay">
              <span className="pizza-ratio">{config.threshold}/{config.shares}</span>
            </div>
          </div>
        </div>

        <div className="presets-section">
          <div className="preset-buttons">
            <button
              className={`preset ${config.shares === 3 && config.threshold === 2 ? 'active' : ''}`}
              onClick={() => handlePreset(3, 2)}
            >
              2-of-3
            </button>
            <button
              className={`preset ${config.shares === 5 && config.threshold === 3 ? 'active' : ''}`}
              onClick={() => handlePreset(5, 3)}
            >
              3-of-5
            </button>
            <button
              className={`preset ${config.shares === 22 && config.threshold === 3 ? 'active' : ''}`}
              onClick={() => handlePreset(22, 3)}
            >
              3-of-22
            </button>
          </div>
          <button
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide advanced options' : 'Show advanced options'}
          </button>
        </div>

        {showAdvanced && (
          <div className="advanced-options">
            <div className="form-group">
              <label>
                Total Shares:
                <input
                  type="number"
                  min="2"
                  max="255"
                  value={config.shares}
                  onChange={(e) => setConfig({ ...config, shares: parseInt(e.target.value) || 2 })}
                />
              </label>
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
            </div>
          </div>
        )}

        <button
          className="generate-button"
          onClick={handleGenerate}
          disabled={isGenerating || !message.trim() || config.threshold > config.shares}
        >
          <span>🔪</span>
          {isGenerating ? 'Generating...' : `Generate ${config.shares} Key Slices (needs ${config.threshold} to restore)`}
        </button>

        {shares.length > 0 && wallet && (
          <>
            {/* Key Slices Preview */}
            <div className="slices-preview-section">
              <h3>Key Slices Preview</h3>
              <div className="slices-preview-grid">
                {shares.map((shareWithQR) => (
                  <div key={shareWithQR.index} className="slice-preview-item">
                    <SliceTemplate
                      sliceNumber={shareWithQR.index}
                      totalSlices={shares.length}
                      threshold={config.threshold}
                      shareData={shareWithQR.share}
                      walletAddress={wallet.address}
                      walletLabel={walletLabel}
                      instructions={instructions}
                      generatedOn={generatedDate}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Addresses Table */}
            {addresses.length > 0 && (
              <div className="addresses-section">
                <div className="addresses-header">
                  <h3>
                    Addresses belonging to {config.threshold}/{config.shares} wallet with the label: '{walletLabel || 'storage'}'
                  </h3>
                  <span className="addresses-date">generated on {formatDate(generatedDate)}</span>
                </div>
                <div className="addresses-table-container">
                  <table className="addresses-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>used?</th>
                        <th>address</th>
                        <th>QR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(showMoreAddresses ? addresses : addresses.slice(0, 5)).map((addr, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <input
                              type="checkbox"
                              checked={addr.used}
                              onChange={(e) => {
                                const newAddresses = [...addresses]
                                newAddresses[index].used = e.target.checked
                                setAddresses(newAddresses)
                              }}
                            />
                          </td>
                          <td className="address-cell">
                            <code>{addr.address}</code>
                          </td>
                          <td>
                            <img src={addr.qrCode} alt={`QR code for ${addr.address}`} className="address-qr" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {addresses.length > 5 && (
                    <button
                      className="show-more-button"
                      onClick={() => setShowMoreAddresses(!showMoreAddresses)}
                    >
                      {showMoreAddresses ? 'Show fewer addresses' : 'Show more addresses'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Download Kit */}
            <div className="download-kit-section">
              <h3>Download Kit</h3>
              <p>Download your complete key slices kit including all slices and address information.</p>
              <button className="download-kit-button" onClick={handleDownloadKit}>
                <span>⬇</span>
                Download Complete Kit
              </button>
            </div>

            {/* Full Size Slices for Printing */}
            <div className="slices-templates print-only">
              {shares.map((shareWithQR) => (
                <SliceTemplate
                  key={shareWithQR.index}
                  sliceNumber={shareWithQR.index}
                  totalSlices={shares.length}
                  threshold={config.threshold}
                  shareData={shareWithQR.share}
                  walletAddress={wallet.address}
                  walletLabel={walletLabel}
                  instructions={instructions}
                  generatedOn={generatedDate}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

