import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

interface PresetButtonsProps {
  onPresetClick: (total: string, required: string) => void
  showAdvancedOptions: boolean
  onToggleAdvancedOptions: () => void
}

export function PresetButtons({ onPresetClick, showAdvancedOptions, onToggleAdvancedOptions }: PresetButtonsProps) {
  const isMobile = useIsMobile()

  const presets = [
    {
      label: "2-of-3",
      total: "3",
      required: "2",
      shortDesc: "Small family backup",
      description: "Good for small families. Requires 2 out of 3 slices to recover.",
    },
    {
      label: "3-of-5",
      total: "5",
      required: "3",
      shortDesc: "Standard team setup",
      description: "Standard team setup. Requires 3 out of 5 slices to recover.",
    },
    {
      label: "3-of-22",
      total: "22",
      required: "3",
      shortDesc: "Tontine with accountant",
      description: "Tontine setup. An accounting firm gets 7 slices (enough to recover alone).",
    },
  ]

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex justify-center">
          <div className="flex flex-col gap-2 items-start">
            {presets.map((preset) => (
              <Tooltip key={preset.label}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs border-2 border-red-200 text-primary hover:bg-primary/20 hover:text-primary min-w-40"
                      onClick={() => {
                        onPresetClick(preset.total, preset.required)
                        if (isMobile) {
                          toast.info(preset.description)
                        }
                      }}
                    >
                      {preset.label}
                    </Button>
                    <span className="text-xs text-muted-foreground">{preset.shortDesc}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{preset.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs bg-stone-100   text-muted-foreground hover:bg-primary/20 hover:text-foreground  mb-4 mt-8"
            onClick={onToggleAdvancedOptions}
          >
            {showAdvancedOptions ? "Hide" : "Show"} advanced options
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}

