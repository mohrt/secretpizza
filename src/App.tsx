import { useState, useRef, useEffect } from "react"
import { MainInterface, type MainInterfaceHandle } from './components/main-interface'
import { Toaster, toast } from "sonner"
import SliceTemplate from './components/SliceTemplate'
import { generateQRCodeDataURL } from "@/utils/qrcode"
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState("about")
  const mainInterfaceRef = useRef<MainInterfaceHandle>(null)
  const [printSlices, setPrintSlices] = useState<any[]>([])
  const [shouldPrint, setShouldPrint] = useState(false)

  const handleKeySliceFilesClick = () => {
    setActiveTab("about")
    // Could trigger tour widget here if needed
  }

  const handlePrintCompleteKit = (slices: any[]) => {
    setPrintSlices(slices)
    setShouldPrint(true)
  }

  // Trigger print after the print-only section has been rendered
  useEffect(() => {
    if (!shouldPrint || printSlices.length === 0) return

    const generatePrintContent = async () => {
      // Generate QR codes for each slice
      const slicesWithQR = await Promise.all(
        printSlices.map(async (slice) => {
          const shareQR = await generateQRCodeDataURL(slice.share, { width: 600, errorCorrectionLevel: 'H' })
          const addressQR = slice.walletAddress 
            ? await generateQRCodeDataURL(slice.walletAddress, { width: 600, errorCorrectionLevel: 'H' })
            : null
          return {
            ...slice,
            shareQR,
            addressQR
          }
        })
      )

      // Create a new window with just the print content
      const printWindow = window.open('', '_blank', 'width=800,height=600')

      if (!printWindow) {
        toast.error("Failed to open print window")
        setPrintSlices([])
        setShouldPrint(false)
        return
      }

      // Visual marker icons for each theme (same as SliceTemplate)
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

      // Generate the HTML for printing
      // Build QR code HTML for each slice to avoid nested template literals
      const slicesHTML = slicesWithQR.map(slice => {
          const addressQRHtml = slice.addressQR 
            ? `<img src="${slice.addressQR}" alt="Wallet address QR code" style="width: 100%; height: 100%; object-fit: contain;" />`
            : '<div style="font-size: 8pt; text-align: center; color: #666; padding: 0.5in;">Address not available</div>'
          
          const generatedDate = new Date(slice.generatedOn || new Date()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })

          // Get the correct visual marker icon for this slice
          const visualMarker = slice.visualMarker || 'pizza'
          const markerIcon = getVisualMarkerIcon(visualMarker, slice.index)
          
          return `
                <div class="slice-template">
                  <div class="slice-header">
                    <div class="slice-header-left">
                      <div class="slice-title">key slice ${slice.index} of ${slice.totalSlices || printSlices.length}</div>
                      <div class="key-icon">${markerIcon}</div>
                    </div>
                    <div class="slice-header-center">
                      <div class="decorative-circle">
                        <div class="logo-content">
                          <img src="/images/shamir-logo.png" alt="Secret Pizza" class="logo-image" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="slice-body">
                    <div class="slice-column-left">
                      <div class="field-group">
                        <label class="field-label">wallet label</label>
                        <div class="field-value">${slice.walletLabel || 'coldpizza'}</div>
                      </div>
                      <div class="field-group">
                        <label class="field-label">instructions</label>
                        <div class="field-value instructions-field">
                          Keep this key slice secure. You will need at least ${slice.threshold || Math.ceil(printSlices.length / 2)} of ${slice.totalSlices || printSlices.length} slices to restore the wallet.
                        </div>
                      </div>
                    </div>
                    <div class="slice-column-right">
                      <div class="data-section">
                        <label class="data-label">key slice data</label>
                        <div class="data-content">
                          <div class="data-text">
                            <pre>${slice.share}</pre>
                          </div>
                          <div class="data-qr">
                            <img src="${slice.shareQR}" alt="Key slice data QR code" style="width: 100%; height: 100%; object-fit: contain;" />
                          </div>
                        </div>
                      </div>
                      <div class="data-section">
                        <label class="data-label">primary address</label>
                        <div class="data-content">
                          <div class="data-text">
                            <pre>${slice.walletAddress || "N/A - Address not available"}</pre>
                          </div>
                          <div class="data-qr">
                            ${addressQRHtml}
                          </div>
                        </div>
                      </div>
                      <div class="field-group">
                        <label class="field-label">generated on</label>
                        <div class="field-value">${generatedDate}</div>
                      </div>
                    </div>
                  </div>
                  <div class="slice-footer">
                    <div class="footer-border"></div>
                    <div class="footer-notice">
                      keep this key slice secure, whoever gave it to you will ask for it in the future. read more on secretpizza.org
                    </div>
                  </div>
                </div>
              `
        }).join('')

      const printHTML = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Secret Pizza - Key Slices</title>
              <style>
                @page {
                  size: 8.5in 11in;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  font-family: 'Times New Roman', serif;
                  background: white;
                }
                .slice-template {
                  width: 8.5in;
                  height: 11in;
                  background: white;
                  border: 2px solid #000;
                  padding: 0.75in;
                  margin: 0 auto;
                  font-family: 'Times New Roman', serif;
                  color: #000;
                  position: relative;
                  box-sizing: border-box;
                  display: flex;
                  flex-direction: column;
                  page-break-inside: avoid !important;
                  page-break-before: avoid !important;
                  page-break-after: avoid !important;
                }
                .slice-template:not(:last-child) {
                  page-break-after: always !important;
                }
                .slice-template:last-child {
                  page-break-after: avoid !important;
                }
                /* All the slice styling... */
                .slice-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 0.3in;
                  border-bottom: 2px solid #000;
                  padding-bottom: 0.15in;
                  page-break-after: avoid;
                  flex-shrink: 0;
                }
                .slice-header-left {
                  display: flex;
                  flex-direction: column;
                  gap: 0.25in;
                }
                .slice-title {
                  font-size: 24pt;
                  font-weight: bold;
                  text-transform: lowercase;
                  letter-spacing: 1px;
                }
                .key-icon {
                  font-size: 48pt;
                  line-height: 1;
                }
                .slice-header-center {
                  flex: 1;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                }
                .decorative-circle {
                  width: 2in;
                  height: 2in;
                  border: none;
                  border-radius: 50%;
                  position: relative;
                }
                .logo-content {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: 1.9in;
                  height: 1.9in;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  z-index: 1;
                }
                .logo-image {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                }
                .slice-body {
                  display: flex;
                  gap: 0.3in; /* Reduced from 0.4in */
                  margin-bottom: 0.4in; /* Reduced from 0.5in */
                  flex: 1;
                  page-break-inside: avoid;
                }
                .slice-column-left,
                .slice-column-right {
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  gap: 0.3in;
                  page-break-inside: avoid;
                }
                .slice-column-left {
                  border-right: 1px solid #000;
                  padding-right: 0.4in;
                  height: calc(100% - 0.8in); /* Shorter than full height */
                }
                .field-group {
                  display: flex;
                  flex-direction: column;
                  gap: 0.125in;
                }
                .field-label {
                  font-size: 10pt;
                  font-weight: bold;
                  text-transform: lowercase;
                  letter-spacing: 0.5px;
                  border-bottom: 1px solid #000;
                  padding-bottom: 0.05in;
                }
                .field-value {
                  font-size: 11pt;
                  line-height: 1.4;
                  min-height: 0.5in;
                  padding: 0.1in;
                  border: 1px solid #000;
                  font-family: 'Courier New', monospace;
                }
                .instructions-field {
                  min-height: 1.2in; /* Reduced from 2in */
                  white-space: pre-wrap;
                  word-wrap: break-word;
                }
                .data-section {
                  display: flex;
                  flex-direction: column;
                  gap: 0.125in;
                  margin-bottom: 0.2in; /* Reduced from 0.5in */
                }
                .data-label {
                  font-size: 10pt;
                  font-weight: bold;
                  text-transform: lowercase;
                  letter-spacing: 0.5px;
                  border-bottom: 1px solid #000;
                  padding-bottom: 0.05in;
                }
                .data-content {
                  display: flex;
                  gap: 0.25in;
                  align-items: flex-start;
                }
                .data-text {
                  flex: 1;
                  font-family: 'Courier New', monospace;
                  font-size: 8pt;
                  line-height: 1.3;
                  word-break: break-all;
                }
                .data-text pre {
                  margin: 0;
                  white-space: pre-wrap;
                  word-wrap: break-word;
                }
                .data-qr {
                  flex-shrink: 0;
                  width: 1.5in;
                  height: 1.5in;
                  border: 1px solid #000;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 0.1in;
                  background: white;
                }
                .slice-footer {
                  position: absolute;
                  bottom: 0.5in;
                  left: 0.75in;
                  right: 0.75in;
                  height: 0.75in;
                  page-break-before: avoid;
                }
                .footer-border {
                  border-top: 1px solid #000;
                  margin-bottom: 0.125in;
                }
                .footer-notice {
                  font-size: 8pt;
                  text-align: center;
                  text-transform: lowercase;
                  color: #000;
                  line-height: 1.4;
                }
              </style>
            </head>
            <body>
              ${slicesHTML}
            </body>
          </html>
        `

      printWindow.document.write(printHTML)
      printWindow.document.close()

      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 200)

      // Clean up state
      setPrintSlices([])
      setShouldPrint(false)

      toast.info("Print Complete Kit", {
        description: "Choose 'Save as PDF' to download all slices",
      })
    }

    generatePrintContent().catch((error) => {
      console.error("Error generating print content:", error)
      toast.error("Failed to generate print content")
      setPrintSlices([])
      setShouldPrint(false)
    })
  }, [shouldPrint, printSlices])

  return (
    <div className="min-h-screen relative pb-24 md:pb-0 bg-muted">
      {/* Added repeating background pattern with transparency */}
      <div
        className="fixed inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'url("/images/bg-pattern.jpeg")',
          backgroundRepeat: "repeat",
          backgroundSize: "400px",
        }}
      />

      {/* Wrapped content in relative div to sit above background */}
      <div className="relative z-10">
        <header className="text-center px-4 pb-8 pt-12 space-y-0">
          <div className="relative w-48 h-32 mx-auto">
            <img
              src="/images/shamir-logo.png"
              alt="Secret Coin Logo"
              className="object-contain my-0 py-0 pb-2 w-full h-full"
            />
          </div>
          <h1 className="text-3xl md:text-4xl tracking-tight text-foreground font-normal font-serif text-balance">
            Slice your bitcoin like pizza{" "}
          </h1>
        </header>

        <main className="container max-w-3xl mx-auto px-4">
          <MainInterface
            ref={mainInterfaceRef}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onKeySliceFilesClick={handleKeySliceFilesClick}
            onPrintCompleteKit={handlePrintCompleteKit}
          />
        </main>

        {/* Print-only section for complete kit */}
        <div id="print-only-container" style={{ display: 'none' }}>
          {printSlices.map((slice) => (
            <SliceTemplate
              key={slice.index}
              sliceNumber={slice.index}
              totalSlices={slice.totalSlices || printSlices.length}
              threshold={slice.threshold || Math.ceil(printSlices.length / 2)}
              shareData={slice.share}
              walletAddress={slice.walletAddress || "N/A - Address not available"}
              walletPublicKey={slice.walletPublicKey}
              walletLabel={slice.walletLabel || "coldpizza"}
              generatedOn={slice.generatedOn || new Date()}
              visualMarker={slice.visualMarker || "pizza"}
            />
          ))}
        </div>

      </div>

      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0;
          }

          /* When printing complete kit, hide everything except print container */
          html.printing-complete-kit body > * {
            display: none !important;
          }

          html.printing-complete-kit #print-only-container {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Ensure each slice is on its own page */
          #print-only-container .slice-template {
            display: flex !important;
            page-break-inside: avoid !important;
          }

          #print-only-container .slice-template:not(:last-child) {
            page-break-after: always !important;
          }

          #print-only-container .slice-template:last-child {
            page-break-after: avoid !important;
          }
        }
      `}</style>

      <Toaster />
    </div>
  )
}

export default App
