import { Button } from "@/components/ui/button"
import QRCode from "react-qr-code"
import { Copy } from "lucide-react"
import { toast } from "sonner"

interface Address {
  id: number
  address: string
  used: boolean
}

interface AddressTableProps {
  addresses: Address[]
  visibleCount: number
  totalSlices: string
  requiredSlices: string
  onAddressToggle: (id: number) => void
  onQrClick: (address: string) => void
  onShowMore: () => void
}

export function AddressTable({
  addresses,
  visibleCount,
  totalSlices,
  requiredSlices,
  onAddressToggle,
  onQrClick,
  onShowMore,
}: AddressTableProps) {
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success(`Copied to clipboard`, {
      description: address,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Addresses Preview</h3>
          <span className="text-xs text-muted-foreground">
            generated on {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Addresses belonging to {requiredSlices}/{totalSlices} wallet with the label: 'storage'
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-center font-medium">#</th>
                <th className="p-2 text-center">used?</th>
                <th className="p-2 text-left font-medium">address</th>
                <th className="p-2 text-center font-medium">Copy</th>
                <th className="p-2 text-center font-medium">QR</th>
              </tr>
            </thead>
            <tbody>
              {addresses.slice(0, visibleCount).map((addr, idx) => (
                <tr key={addr.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-2 text-center text-muted-foreground">{addr.id}</td>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={addr.used}
                      onChange={() => onAddressToggle(addr.id)}
                      className="rounded cursor-pointer"
                    />
                  </td>
                  <td className="p-2 font-mono text-xs break-all">{addr.address}</td>
                  <td className="p-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyAddress(addr.address)}
                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-black"
                      aria-label={`Copy address ${addr.id}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => onQrClick(addr.address)}
                      className="inline-block p-1 hover:bg-muted/50 rounded transition-colors"
                      aria-label={`View QR code for address ${addr.id}`}
                    >
                      <QRCode value={addr.address} size={48} level="M" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleCount < addresses.length && (
          <div className="p-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowMore}
              className="w-full text-xs bg-stone-100 text-muted-foreground hover:bg-primary/20 hover:text-foreground"
            >
              Show more addresses
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

