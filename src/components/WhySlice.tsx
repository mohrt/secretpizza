import './WhySlice.css'

export default function WhySlice() {
  return (
    <div className="why-slice">
      <div className="why-slice-content">
        <div className="concept-section">
          <div className="concept-image">
            <img src="/images/pizza.png" alt="Pizza Key" className="pizza-key-image" />
          </div>
          <div className="concept-text">
            <h3>1. Core concept</h3>
            <p>
              Secret Pizza uses{' '}
              <a href="https://en.wikipedia.org/wiki/Shamir%27s_secret_sharing" target="_blank" rel="noopener noreferrer">
                Shamir secret sharing
              </a>{' '}
              to create key slices that let you save your bitcoins in a way that you need multiple slices to restore access. 
              This is useful if you want to store larger amounts of bitcoin for a longer extent of time, or ensure access 
              with multiple people in your family or business. A single slice discloses nothing. A pre-defined threshold 
              reconstructs the key. This helps you secure your bitcoins from theft or loss.
            </p>
          </div>
        </div>

        <div className="info-section">
          <h3>2. What you download</h3>
          <p>
            After generating slices you receive a zip file. It contains one folder per slice. Each folder is self contained 
            and can be handed to a distinct holder.
          </p>
          <ul>
            <li>
              <a href="https://github.com/mohrt/secretcoin" target="_blank" rel="noopener noreferrer">
                secretcoin
              </a>{' '}
              source, FAQ, setup, and redeem guides.
            </li>
            <li>
              A PDF of the slice with hex share, QR share, and a visual marker. Formats: US Letter/A4 printer paper and a 
              compact layout for Niimbot printers.
            </li>
            <li>A PDF with unused addresses generated alongside the slice.</li>
            <li>
              A readme outlining folder contents and steps to create a watch-only wallet in{' '}
              <a href="https://simply.cash" target="_blank" rel="noopener noreferrer">
                simply.cash
              </a>{' '}
              using the xpub tied to that slice's wallet.
            </li>
          </ul>
        </div>

        <div className="info-section">
          <h3>3. Printing options</h3>
          <p>
            Niimbot label printers are supported. The driver is open source, browser based, and works offline:{' '}
            <a href="https://niim.blue" target="_blank" rel="noopener noreferrer">
              niim.blue
            </a>
          </p>
          <p>
            If you need hardware, Niimbot printers are widely available for under $30. (e.g. on AliExpress or Amazon). 
            If you are really paranoid you can destroy the printer after printing the slices.
          </p>
        </div>

        <div className="info-section">
          <h3>4. How to prepare slice packages</h3>
          <ul>
            <li>Generate slices.</li>
            <li>Download the zip.</li>
            <li>Copy each slice folder to a separate USB drive.</li>
            <li>Print the slice using either the filter paper layout or the Niimbot label layout.</li>
            <li>Hand the printed slice and its USB drive in a ziplock bag to the designated person.</li>
          </ul>
        </div>

        <div className="info-section">
          <h3>5. How this protects you</h3>
          <p>
            Each holder retains only a fragment. Loss of one fragment does not expose funds. Reconstruction requires the 
            threshold you set. This forces shared recovery and reduces operational risk.
          </p>
        </div>

        <div className="footer-note">
          <p>
            Questions? Reach out to{' '}
            <a href="https://x.com/mohrt" target="_blank" rel="noopener noreferrer">
              @mohrt
            </a>
            . Design by{' '}
            <a href="https://x.com/shadilayvision" target="_blank" rel="noopener noreferrer">
              @shadilayvision
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

