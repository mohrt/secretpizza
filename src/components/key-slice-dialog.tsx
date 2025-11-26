import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import { toast } from "sonner"

interface KeySliceDialogProps {
  sliceIndex: number | null
  totalSlices: number
  onClose: () => void
}

export function KeySliceDialog({ sliceIndex, totalSlices, onClose }: KeySliceDialogProps) {
  const handleDownload = () => {
    if (sliceIndex === null) return
    const link = document.createElement("a")
    link.href = "/images/key-slice-template.png"
    link.download = `key-slice-${sliceIndex + 1}-of-${totalSlices}.png`
    link.click()
    toast.success("Downloaded", {
      description: `Key slice ${sliceIndex + 1} downloaded successfully`,
    })
  }

  const handlePrint = () => {
    if (sliceIndex === null) return
    const printWindow = window.open("/images/key-slice-template.png", "_blank")
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
    toast.info("Print", {
      description: `Opening print dialog for key slice ${sliceIndex + 1}`,
    })
  }

  if (sliceIndex === null) return null

  return (
    <Dialog open={sliceIndex !== null} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white">
        <DialogHeader>
          <DialogTitle>
            Key Slice {sliceIndex + 1} of {totalSlices}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 p-4">
          <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden border">
            <img
              src="/images/key-slice-template.png"
              alt={`Key slice ${sliceIndex + 1} of ${totalSlices}`}
              className="w-full h-full object-contain bg-muted"
            />
          </div>
          <div className="flex gap-2 w-full">
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
  )
}

