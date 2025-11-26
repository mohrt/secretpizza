import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { ExternalLink, Square, SquareCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

export type DieType = "coin" | "d4" | "d6" | "d8" | "d10" | "d16"

export interface DiceState {
  enabled: boolean
  value: string
}

interface DiceRollSectionProps {
  diceState: Record<DieType, DiceState>
  onToggleDie: (die: DieType) => void
  onUpdateDieValue: (die: DieType, value: string) => void
  onConvertToSeed: () => void
  isConvertDisabled: boolean
}

const dieDescriptions: Record<DieType, string> = {
  coin: "Coin - Flip for heads or tails (2 outcomes)",
  d4: "D4 - 4-sided die (1-4)",
  d6: "D6 - 6-sided die (1-6)",
  d8: "D8 - 8-sided die (1-8)",
  d10: "D10 - 10-sided die (0-9)",
  d16: "D16 - 16-sided hexadecimal die (0-F)",
}

export function DiceRollSection({
  diceState,
  onToggleDie,
  onUpdateDieValue,
  onConvertToSeed,
  isConvertDisabled,
}: DiceRollSectionProps) {
  const isMobile = useIsMobile()

  const showTooltip = (message: string) => {
    if (isMobile) {
      toast.info(message)
    }
  }

  const getDiceInstruction = () => {
    const activeDice = (Object.keys(diceState) as DieType[]).filter((die) => diceState[die].enabled)

    if (activeDice.length === 0) {
      return (
        <p className="text-sm text-muted-foreground mb-4">
          Using dice or coins allows you to generate a seed phrase without having to trust a random number generator.{" "}
          <a
            href="https://www.thediceshoponline.com/impact-opaque-hexidice-d16-hexadecimal-dice"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-0.5"
          >
            Buy special hexadecimal dice
            <ExternalLink className="h-3 w-3" />
          </a>{" "}
          to generate keys more efficiently.
        </p>
      )
    }

    const sidesMap: Record<DieType, number> = {
      coin: 2,
      d4: 4,
      d6: 6,
      d8: 8,
      d10: 10,
      d16: 16,
    }

    const inputExamples: Record<DieType, string> = {
      coin: "tails=0, heads=1",
      d4: "1-4",
      d6: "1-6",
      d8: "1-8",
      d10: "0-9",
      d16: "0-9, A-F (Hexadecimal)",
    }

    const instructions = activeDice.map((die) => {
      const sides = sidesMap[die]
      const minRolls = Math.ceil(128 / Math.log2(sides))
      return `${minRolls} rolls for ${die}`
    })

    const detailedInstructions = activeDice.map((die) => {
      return `For ${die}: ${inputExamples[die]}`
    })

    return (
      <div className="text-sm text-muted-foreground mb-4 space-y-2">
        <p>
          To achieve 128-bit security, you need at least: {instructions.join(", ")}.{" "}
          <a
            href="https://github.com/mohrt/dice2mnemonic"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-0.5"
          >
            Read the docs
            <ExternalLink className="h-3 w-3" />
          </a>{" "}
          for details.
        </p>
        <p>
          <strong>How to enter:</strong> {detailedInstructions.join(". ")}.
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="p-4 bg-muted/30 rounded-lg border mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
        {getDiceInstruction()}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 pb-8">
          {(Object.keys(diceState) as DieType[]).map((die) => (
            <div key={die} className="flex items-center w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "rounded-r-none border-r-0 px-3 h-10 min-w-[4rem] relative overflow-hidden transition-all flex items-center gap-1.5 flex-1 justify-center",
                      diceState[die].enabled
                        ? "bg-primary/10 border-primary text-primary hover:bg-primary/20 hover:text-primary z-10"
                        : "bg-background text-muted-foreground hover:bg-muted",
                    )}
                    onClick={() => {
                      onToggleDie(die)
                      if (isMobile) {
                        showTooltip(dieDescriptions[die])
                      }
                    }}
                  >
                    {diceState[die].enabled ? (
                      <SquareCheck className="h-4 w-4 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 shrink-0 opacity-50" />
                    )}
                    <div className="relative w-6 h-6 shrink-0">
                      <img
                        src={`/images/dice/${die === "d16" ? "hexad16" : die}.png`}
                        alt={die}
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <span className="uppercase font-semibold text-xs hidden md:inline">{die}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dieDescriptions[die]}</p>
                </TooltipContent>
              </Tooltip>
              <Input
                type="number"
                min="1"
                value={diceState[die].value}
                onChange={(e) => onUpdateDieValue(die, e.target.value)}
                disabled={!diceState[die].enabled}
                className={cn(
                  "w-[48px] h-10 rounded-l-none text-center px-0 transition-all",
                  diceState[die].enabled
                    ? "border-primary bg-background ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-muted/50"
                    : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed",
                )}
              />
            </div>
          ))}
          <Button
            variant="default"
            className="col-span-2 lg:col-span-3 text-white"
            disabled={isConvertDisabled}
            onClick={onConvertToSeed}
          >
            Convert roll data to seed phrase
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}

