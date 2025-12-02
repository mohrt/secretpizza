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
          <h3>2. What you print</h3>
          <p>
            After generating slices, you can print each slice as a PDF. Each printed slice contains the hex share, QR code, and visual marker needed to recover the secret.
          </p>
          <p>
            Each slice is self-contained and can be handed to a distinct holder. The slice includes:
          </p>
          <ul>
            <li>
              Hex share data for manual entry
            </li>
            <li>
              QR code for quick scanning during recovery
            </li>
            <li>
              Visual marker to identify the slice
            </li>
            <li>
              Primary wallet address for verification
            </li>
          </ul>
        </div>

        <div className="info-section">
          <h3>3. Printing options</h3>
          <p>
            Print the slice PDFs on standard US Letter or A4 paper. For enhanced security, consider using a dumb printer with no networking capabilities.
          </p>
        </div>

        <div className="info-section">
          <h3>4. How to prepare slice packages</h3>
          <ul>
            <li>Generate slices.</li>
            <li>Print each slice PDF.</li>
            <li>Store each printed slice in a secure location (safe, safety deposit box, etc.).</li>
            <li>Distribute the printed slices to the designated holders.</li>
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

