import React from 'react'
import { generateQRCodeDataURL } from '../utils/qrcode'
import './SliceTemplate.css'

interface SliceTemplateProps {
  sliceNumber: number
  totalSlices: number
  threshold: number
  shareData: string
  walletAddress: string
  walletPublicKey?: string
  walletLabel?: string
  instructions?: string
  generatedOn: Date
  visualMarker?: string
}

// Visual marker icons for each theme
const visualMarkerIcons: Record<string, string[]> = {
  pizza: ['🍕', '🍄', '🧅', '🫒', '🌶️', '🥓', '🧀', '🍅', '🌿', '🥬', '🫑', '🥒', '🌽', '🥕', '🥔', '🥑', '🥩', '🍖', '🦐', '🦑', '🐟', '🐠'],
  cosmos: ['🪐', '⭐', '🌟', '✨', '💫', '🌙', '☀️', '🌍', '🌎', '🌏', '🔭', '🛸', '👽', '🚀', '🌌', '🌠', '☄️', '🌑', '🌒', '🌓', '🌔', '🌕'],
  primates: ['🦍', '🦧', '🐵', '🙈', '🙉', '🙊', '🐒', '🦝', '🦁', '🐯', '🐅', '🐆', '🐴', '🦄', '🦓', '🦌', '🦬', '🐂', '🐃', '🐄', '🐎', '🐖'],
  vehicles: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼', '🚁', '✈️'],
  furniture: ['🪑', '🛋️', '🛏️', '🪣', '🪤', '🪆', '🪡', '🪢', '🪣', '🪝', '🪟', '🪞', '🪟', '🪠', '🪡', '🪢', '🪣', '🪝', '🪟', '🪞', '🪟', '🪠'],
  instruments: ['🎸', '🎹', '🥁', '🎺', '🎷', '🎤', '🎧', '🎵', '🎶', '🎼', '🎻', '🪘', '🪗', '🪕', '🎹', '🥁', '🎺', '🎷', '🎤', '🎧', '🎵', '🎶'],
  trees: ['🌳', '🌲', '🌴', '🌵', '🌱', '🌿', '☘️', '🍀', '🍃', '🍂', '🍁', '🌾', '🌺', '🌻', '🌷', '🌹', '🥀', '🌼', '🌸', '🌍', '🌎', '🌏'],
  colors: ['🎨', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔶', '🔷', '🔸'],
  shapes: ['🔷', '🔶', '🔸', '🔹', '🔺', '🔻', '💠', '🔳', '🔲', '⚪', '⚫', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '🟥', '🟧', '🟨', '🟩', '🟦'],
  tools: ['🔨', '🪓', '⛏️', '🪚', '🔧', '🪛', '🔩', '⚙️', '🪤', '🧰', '🧲', '🪜', '⚒️', '🛠️', '🗡️', '⚔️', '🔪', '🗡️', '⚔️', '🪓', '⛏️', '🪚'],
}

function getVisualMarkerIcon(theme: string, sliceNumber: number): string {
  const icons = visualMarkerIcons[theme] || visualMarkerIcons.pizza
  return icons[(sliceNumber - 1) % icons.length]
}

export default function SliceTemplate({
  sliceNumber,
  totalSlices,
  threshold,
  shareData,
  walletAddress,
  walletPublicKey: _walletPublicKey,
  walletLabel = '',
  instructions = '',
  generatedOn,
  visualMarker = 'pizza',
}: SliceTemplateProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="slice-template">
      <div className="slice-header">
        <div className="slice-header-left">
          <div className="slice-title">key slice {sliceNumber} of {totalSlices}</div>
          <div className="key-icon">{getVisualMarkerIcon(visualMarker, sliceNumber)}</div>
        </div>
        <div className="slice-header-center">
          <div className="decorative-circle">
            <div className="logo-content">
              <img 
                src="/images/shamir-logo.png" 
                alt="Secret Pizza" 
                className="logo-image"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="slice-body">
        <div className="slice-column-left">
          <div className="field-group">
            <label className="field-label">wallet label</label>
            <div className="field-value">{walletLabel || '________________'}</div>
          </div>

          <div className="field-group">
            <label className="field-label">instructions</label>
            <div className="field-value instructions-field">
              {instructions || 'Keep this key slice secure. You will need at least ' + threshold + ' of ' + totalSlices + ' slices to restore the wallet.'}
            </div>
          </div>
        </div>

        <div className="slice-column-right">
          <div className="data-section">
            <label className="data-label">key slice data</label>
            <div className="data-content">
              <div className="data-text">
                <pre>{shareData}</pre>
              </div>
              <div className="data-qr">
                <SliceQRCode data={shareData} />
              </div>
            </div>
          </div>

          <div className="data-section">
            <label className="data-label">primary address</label>
            <div className="data-content">
              <div className="data-text">
                <pre>{walletAddress}</pre>
              </div>
              <div className="data-qr">
                <SliceQRCode data={walletAddress} />
              </div>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">generated on</label>
            <div className="field-value">{formatDate(generatedOn)}</div>
          </div>
        </div>
      </div>

      <div className="slice-footer">
        <div className="footer-border"></div>
        <div className="footer-notice">
          keep this key slice secure, whoever gave it to you will ask for it in the future. read more on secretpizza.org
        </div>
      </div>
    </div>
  )
}

// Separate component for QR codes to handle async generation
function SliceQRCode({ data }: { data: string }) {
  const [qrCode, setQrCode] = React.useState<string>('')
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    generateQRCodeDataURL(data, { width: 200, errorCorrectionLevel: 'H' })
      .then(setQrCode)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [data])

  if (loading) {
    return <div className="qr-loading">Generating QR code...</div>
  }

  return <img src={qrCode} alt="QR Code" className="qr-image" />
}

