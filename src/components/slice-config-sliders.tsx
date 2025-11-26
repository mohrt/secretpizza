import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

interface SliceConfigSlidersProps {
  totalSlices: string
  requiredSlices: string
  onTotalChange: (value: number[]) => void
  onRequiredChange: (value: number[]) => void
}

export function SliceConfigSliders({
  totalSlices,
  requiredSlices,
  onTotalChange,
  onRequiredChange,
}: SliceConfigSlidersProps) {
  const isMobile = useIsMobile()

  const showTooltip = (message: string) => {
    if (isMobile) {
      toast.info(message)
    }
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 my-0 py-6 pt-0 gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 justify-between">
            <label htmlFor="shares">Total 🔑 slices</label>
            <Tooltip>
              <TooltipTrigger
                onClick={(e) => {
                  if (isMobile) {
                    e.preventDefault()
                    showTooltip("The total number of slices you want to create.")
                  }
                }}
              >
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>The total number of slices you want to create.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-center">{totalSlices}</div>
            <Slider
              id="shares"
              min={2}
              max={30}
              step={1}
              value={[Number.parseInt(totalSlices)]}
              onValueChange={onTotalChange}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 md:col-span-2 justify-between">
            <label htmlFor="threshold">🔑 slices required to restore</label>
            <Tooltip>
              <TooltipTrigger
                onClick={(e) => {
                  if (isMobile) {
                    e.preventDefault()
                    showTooltip("The minimum number of slices needed to recover the secret.")
                  }
                }}
              >
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>The minimum number of slices needed to recover the secret.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-center">{requiredSlices}</div>
            <Slider
              id="threshold"
              min={2}
              max={Number.parseInt(totalSlices)}
              step={1}
              value={[Number.parseInt(requiredSlices)]}
              onValueChange={onRequiredChange}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

