import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import QRCode from "react-qr-code"
import { toast } from "sonner"

interface QrDialogProps {
  address: string | null
  onClose: () => void
}

export function QrDialog({ address, onClose }: QrDialogProps) {
  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success("Copied", {
        description: "Address copied to clipboard",
      })
    }
  }

  if (!address) return null

  return (
    <Dialog open={!!address} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Address QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 p-4">
          <QRCode value={address} size={256} level="M" />
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono break-all bg-muted p-2 rounded">{address}</code>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

