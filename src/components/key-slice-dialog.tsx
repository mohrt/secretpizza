import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import { toast } from "sonner"
import SliceTemplate from "@/components/SliceTemplate"

interface KeySliceDialogProps {
  sliceIndex: number | null
  totalSlices: number
  requiredSlices: number
  sliceData: { share: string; qrCode: string; index: number } | null
  walletAddress: string
  walletPublicKey?: string
  walletLabel?: string
  generatedOn: Date
  visualMarker: string
  onClose: () => void
}

export function KeySliceDialog({ 
  sliceIndex, 
  totalSlices, 
  requiredSlices,
  sliceData, 
  walletAddress,
  walletPublicKey,
  walletLabel,
  generatedOn,
  visualMarker,
  onClose 
}: KeySliceDialogProps) {
  const sliceTemplateRef = React.useRef<HTMLDivElement>(null)

  const handleDownload = () => {
    if (sliceIndex === null || !sliceTemplateRef.current) return
    
    // Convert the HTML template to an image using html2canvas or similar
    // For now, we'll use a simpler approach: print to PDF
    toast.info("Download", {
      description: "Use the Print button and select 'Save as PDF' to download",
    })
  }

  const handlePrint = () => {
    if (sliceIndex === null) return
    
    // Add a class to body to identify we're printing from this dialog
    document.body.classList.add('printing-key-slice-dialog')
    
    // Remove the class after print dialog closes
    const removeClass = () => {
      document.body.classList.remove('printing-key-slice-dialog')
      window.removeEventListener('afterprint', removeClass)
    }
    window.addEventListener('afterprint', removeClass)
    
    window.print()
    toast.info("Print", {
      description: `Opening print dialog for key slice ${sliceIndex + 1}`,
    })
  }

  if (sliceIndex === null || !sliceData) return null

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0;
          }
          
          /* When printing from key slice dialog, hide everything except the dialog content */
          body.printing-key-slice-dialog > *:not([data-radix-portal]) {
            display: none !important;
          }
          
          body.printing-key-slice-dialog [data-radix-portal] > *:not(.key-slice-dialog-print) {
            display: none !important;
          }
          
          /* Hide all slice templates that are NOT inside the key-slice-dialog-print */
          body.printing-key-slice-dialog .slice-template:not(.key-slice-dialog-print .slice-template) {
            display: none !important;
          }
          
          /* Hide print-only templates from other components */
          body.printing-key-slice-dialog .print-only,
          body.printing-key-slice-dialog .slices-templates {
            display: none !important;
          }
          
          /* Hide dialog UI elements */
          body.printing-key-slice-dialog [data-radix-dialog-overlay],
          body.printing-key-slice-dialog .key-slice-dialog-print > header,
          body.printing-key-slice-dialog .key-slice-dialog-print button,
          body.printing-key-slice-dialog .print\\:hidden,
          body.printing-key-slice-dialog .slice-template-container > div:last-child {
            display: none !important;
          }
          
          /* Reset dialog for printing - remove all positioning and sizing constraints */
          body.printing-key-slice-dialog .key-slice-dialog-print {
            all: unset !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            position: static !important;
            transform: none !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            bottom: auto !important;
            max-width: none !important;
            max-height: none !important;
            width: auto !important;
            height: auto !important;
          }
          
          /* Reset container */
          body.printing-key-slice-dialog .slice-template-container {
            all: unset !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Ensure template doesn't break across pages and only appears once */
          body.printing-key-slice-dialog .slice-template-container .slice-template {
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }
          
          /* Ensure only one instance of the template is visible */
          body.printing-key-slice-dialog .slice-template-container .slice-template ~ .slice-template {
            display: none !important;
          }
          
          /* Let template use its own print styles from SliceTemplate.css */
        }
      `}</style>
      <Dialog open={sliceIndex !== null} onOpenChange={onClose}>
        <DialogContent className="key-slice-dialog-print sm:max-w-5xl bg-white max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle>
              Key Slice {sliceIndex + 1} of {totalSlices}
            </DialogTitle>
            <DialogDescription>
              View and print your key slice certificate. This slice contains the share data needed to recover your secret.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 p-4 print:p-0 slice-template-container">
            <div ref={sliceTemplateRef} className="w-full">
              <SliceTemplate
                sliceNumber={sliceIndex + 1}
                totalSlices={totalSlices}
                threshold={requiredSlices}
                shareData={sliceData.share}
                walletAddress={walletAddress || "N/A - Address not available"}
                walletPublicKey={walletPublicKey}
                walletLabel={walletLabel}
                generatedOn={generatedOn}
                visualMarker={visualMarker}
              />
            </div>
            <div className="flex gap-2 w-full print:hidden">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex-1 bg-transparent hover:bg-primary/10 hover:text-black"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex-1 bg-transparent hover:bg-primary/10 hover:text-black"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

