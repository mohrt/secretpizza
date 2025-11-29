import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export type DieType = "coin" | "d4" | "d6" | "d8" | "d10" | "d16"

interface DiceRollSectionProps {
  selectedDie: DieType | null
  onSelectDie: (die: DieType | null) => void
  onConvertToSeed: (rolls: string, dieType: DieType, outputType: "mnemonic" | "privateKey", seedLength?: 12 | 24) => void
}

const dieDescriptions: Record<DieType, string> = {
  coin: "Coin - Flip for heads or tails (2 outcomes)",
  d4: "D4 - 4-sided die (1-4)",
  d6: "D6 - 6-sided die (1-6)",
  d8: "D8 - 8-sided die (1-8)",
  d10: "D10 - 10-sided die (0-9)",
  d16: "D16 - 16-sided hexadecimal die (0-F)",
}

const inputExamples: Record<DieType, string> = {
  coin: "tails=0, heads=1",
  d4: "1-4",
  d6: "1-6",
  d8: "1-8",
  d10: "0-9",
  d16: "0-9, A-F (Hexadecimal)",
}

const sidesMap: Record<DieType, number> = {
  coin: 2,
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d16: 16,
}

// Calculate minimum rolls needed for mnemonic
function calculateMinRolls(dieType: DieType | null, seedLength: 12 | 24 = 12): number {
  if (!dieType) return 0
  
  const sides = sidesMap[dieType]
  const BIP39_WORDLIST_SIZE = 2048
  const r = Math.ceil(Math.log(BIP39_WORDLIST_SIZE) / Math.log(sides))
  
  // For mnemonic: (seedLength - 1) words + checksum (which needs fewer rolls)
  // Each word needs r rolls, but rejection sampling means we need more
  // 
  // Rejection sampling: we generate candidates in range [1, n^r]
  // but only accept [1, 2048]. Rejection rate = (n^r - 2048) / n^r
  // Expected attempts per word = 1 / (2048 / n^r) = n^r / 2048
  // Expected rolls per word = (n^r / 2048) * r
  const maxCandidate = Math.pow(sides, r)
  const rejectionRate = (maxCandidate - BIP39_WORDLIST_SIZE) / maxCandidate
  const expectedAttempts = 1 / (1 - rejectionRate) // Geometric distribution
  const expectedRollsPerWord = expectedAttempts * r
  
  // For (seedLength - 1) words (excluding checksum), add buffer for duplicates
  // Duplicate rejection means we might need to try multiple times per word
  // Worst-case inputs (like all F's for d16) can cause 100% rejection rate
  // Repetitive patterns can cause duplicate word cycles
  // Add 5x buffer to account for rejection sampling, duplicate word rejections, worst-case inputs, repetitive patterns, and variance
  const wordsNeeded = seedLength - 1
  const estimatedRolls = Math.ceil(wordsNeeded * expectedRollsPerWord * 5)
  
  return estimatedRolls
}

// Validate and filter input based on die type - blocks invalid characters immediately
function validateAndFilterInput(input: string, dieType: DieType | null): string {
  if (!dieType) return input
  
  let filtered = input.toUpperCase()
  
  if (dieType === "coin") {
    // Allow only: 0, 1, H, T
    filtered = filtered.replace(/[^01HT]/g, "")
  } else if (dieType === "d16") {
    // Allow only: 0-9, A-F
    filtered = filtered.replace(/[^0-9A-F]/g, "")
  } else if (dieType === "d10") {
    // Allow only: 0-9
    filtered = filtered.replace(/[^0-9]/g, "")
  } else {
    // d4, d6, d8: Allow only valid digits for that die
    const max = sidesMap[dieType]
    // First filter to only digits
    filtered = filtered.replace(/[^0-9]/g, "")
    // Then filter to only allow digits in valid range (1 to max)
    filtered = filtered.split("").filter(char => {
      const num = parseInt(char, 10)
      return num >= 1 && num <= max
    }).join("")
  }
  
  return filtered
}

// Count valid rolls entered (returns actual character count for the die type)
function countRolls(input: string, dieType: DieType | null): number {
  if (!dieType || !input.trim()) return 0
  
  const filtered = validateAndFilterInput(input, dieType)
  // For all dice types, each character represents one roll
  return filtered.length
}

export function DiceRollSection({
  selectedDie,
  onSelectDie,
  onConvertToSeed,
}: DiceRollSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [rollsInput, setRollsInput] = useState("")
  const [outputType, setOutputType] = useState<"mnemonic" | "privateKey">("mnemonic")
  const [seedLength, setSeedLength] = useState<12 | 24>(12)
  
  const minRollsNeeded = useMemo(() => {
    if (outputType === "mnemonic") {
      return calculateMinRolls(selectedDie, seedLength)
    } else {
      // For private key: need exactly 64 hex characters (32 bytes)
      // For d16: 64 hex chars directly
      // For other dice: need enough rolls to generate 64 hex chars
      if (selectedDie === "d16") {
        return 64
      } else if (selectedDie) {
        // Estimate: need enough base-N digits to represent a 256-bit number
        // 256 bits = 32 bytes = 64 hex chars
        // We need enough base-N digits to cover 256 bits
        const bitsPerRoll = Math.log2(sidesMap[selectedDie])
        return Math.ceil(256 / bitsPerRoll)
      }
      return 0
    }
  }, [selectedDie, outputType, seedLength])
  
  const maxRollsAllowed = useMemo(() => {
    if (outputType === "privateKey" && selectedDie === "d16") {
      // For d16 private key: exactly 64 hex characters
      return 64
    } else if (outputType === "privateKey") {
      // For other dice private key: allow some extra but cap it reasonably
      return minRollsNeeded + 20 // Allow a bit extra for safety
    } else {
      // For mnemonic: allow much more for worst-case scenarios
      // Worst-case inputs (like all F's for d16) can cause 100% rejection rate
      // Allow up to 20x the minimum, or at least 2000 rolls, whichever is higher
      // This ensures worst-case inputs have enough rolls to eventually succeed
      return Math.max(minRollsNeeded * 20, 2000)
    }
  }, [selectedDie, outputType, minRollsNeeded])
  
  const rollsEntered = useMemo(() => {
    return countRolls(rollsInput, selectedDie)
  }, [rollsInput, selectedDie])
  
  const rollsRemaining = Math.max(0, minRollsNeeded - rollsEntered)
  const progressPercent = minRollsNeeded > 0 
    ? Math.min(100, (rollsEntered / minRollsNeeded) * 100)
    : 0


  const getDiceInstruction = () => {
    if (!selectedDie) {
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

    const sides = sidesMap[selectedDie]
    const minRolls = Math.ceil(128 / Math.log2(sides))

    return (
      <div className="text-sm text-muted-foreground mb-4 space-y-2">
        <p>
          To achieve 128-bit security, you need at least {minRolls} rolls for {selectedDie}.{" "}
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
          <strong>How to enter:</strong> For {selectedDie}: {inputExamples[selectedDie]}.
        </p>
      </div>
    )
  }

  const handleConvertClick = () => {
    if (!selectedDie) {
      toast.error("Please select a die type first")
      return
    }
    // Reset dialog state when opening
    setRollsInput("")
    setOutputType("mnemonic") // Reset to default
    setSeedLength(12) // Reset to default
    setDialogOpen(true)
  }
  
  // Reset when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      // Clear input when dialog closes
      setRollsInput("")
    } else {
      // Also clear when dialog opens (in case it was already open)
      setRollsInput("")
    }
  }, [dialogOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const filtered = validateAndFilterInput(newValue, selectedDie)
    
    // Limit to maximum allowed characters - check BEFORE slicing
    if (filtered.length > maxRollsAllowed) {
      // Truncate to max allowed
      const limited = filtered.slice(0, maxRollsAllowed)
      setRollsInput(limited)
    } else {
      setRollsInput(filtered)
    }
  }

  const handleConvert = () => {
    if (!selectedDie) return
    
    const trimmedRolls = rollsInput.trim()
    if (!trimmedRolls) {
      toast.error("Please enter your dice rolls")
      return
    }

    if (rollsEntered < minRollsNeeded) {
      toast.error(`Need at least ${minRollsNeeded} rolls. You have entered ${rollsEntered}.`)
      return
    }

    onConvertToSeed(trimmedRolls, selectedDie, outputType, outputType === "mnemonic" ? seedLength : undefined)
    setDialogOpen(false)
    setRollsInput("")
  }

  return (
    <TooltipProvider>
      <div className="p-4 bg-muted/30 rounded-lg border mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
        {getDiceInstruction()}
        
        <div className="space-y-4">
          <RadioGroup
            value={selectedDie || ""}
            onValueChange={(value) => onSelectDie(value ? (value as DieType) : null)}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4"
          >
            {(Object.keys(sidesMap) as DieType[]).map((die) => (
              <div key={die} className="flex items-center space-x-3">
                <RadioGroupItem value={die} id={die} className="size-6 border-2" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label
                      htmlFor={die}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer flex-1 px-3 py-2 rounded-md border transition-all",
                        selectedDie === die
                          ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/20"
                          : "bg-background border-border hover:bg-muted hover:border-primary/50"
                      )}
                    >
                      <div className="relative w-6 h-6 shrink-0">
                        <img
                          src={`/images/dice/${die === "d16" ? "hexad16" : die}.png`}
                          alt={die}
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <span className="uppercase font-semibold text-xs">{die}</span>
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{dieDescriptions[die]}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
          </RadioGroup>

          <Button
            variant="default"
            className="w-full text-white"
            disabled={!selectedDie}
            onClick={handleConvertClick}
          >
            Convert roll data to seed phrase
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Enter Dice Rolls</DialogTitle>
            <DialogDescription>
              Enter your {selectedDie} roll results. {selectedDie && inputExamples[selectedDie]}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="rolls">Dice Rolls</Label>
                <span className="text-xs text-muted-foreground">
                  {rollsEntered} / {minRollsNeeded} rolls
                </span>
              </div>
              <Textarea
                key={`rolls-${dialogOpen}-${selectedDie}`}
                id="rolls"
                value={rollsInput}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  // Prevent invalid characters from being typed
                  if (!selectedDie) return
                  
                  const key = e.key
                  const isControlKey = e.ctrlKey || e.metaKey || e.altKey || 
                    key === "Backspace" || key === "Delete" || key === "Tab" || 
                    key === "Enter" || key === "ArrowLeft" || key === "ArrowRight" ||
                    key === "ArrowUp" || key === "ArrowDown" || key === "Home" || 
                    key === "End" || key.length > 1
                  
                  if (isControlKey) return // Allow control keys
                  
                  // Check if we've reached the maximum allowed characters
                  // Get current textarea value to check length accurately
                  const textarea = e.currentTarget
                  const currentValue = textarea.value
                  const selectionStart = textarea.selectionStart
                  const selectionEnd = textarea.selectionEnd
                  
                  // Check if this is an insertion (not deletion)
                  const isInsertion = key.length === 1 && !isControlKey
                  
                  if (isInsertion) {
                    // Calculate what the new value would be
                    const beforeSelection = currentValue.slice(0, selectionStart)
                    const afterSelection = currentValue.slice(selectionEnd)
                    const newValue = beforeSelection + key + afterSelection
                    
                    // Filter the new value to see what it would actually be
                    const filtered = validateAndFilterInput(newValue, selectedDie)
                    const newLength = filtered.length
                    
                    // Block if adding this character would exceed the limit
                    if (newLength > maxRollsAllowed) {
                      e.preventDefault()
                      return
                    }
                  }
                  
                  // Check if the key is valid for this die type
                  const keyUpper = key.toUpperCase()
                  let isValid = false
                  
                  if (selectedDie === "coin") {
                    isValid = /[01HT]/.test(keyUpper)
                  } else if (selectedDie === "d16") {
                    isValid = /[0-9A-F]/.test(keyUpper)
                  } else if (selectedDie === "d10") {
                    isValid = /[0-9]/.test(key)
                  } else {
                    // d4, d6, d8: only allow digits 1 to max
                    const max = sidesMap[selectedDie]
                    const num = parseInt(key, 10)
                    isValid = !isNaN(num) && num >= 1 && num <= max
                  }
                  
                  if (!isValid) {
                    e.preventDefault() // Block invalid character
                  }
                }}
                onPaste={(e) => {
                  // Handle paste events to insert at cursor position
                  e.preventDefault()
                  if (!selectedDie) return
                  
                  const textarea = e.currentTarget
                  const currentValue = textarea.value
                  const selectionStart = textarea.selectionStart
                  const selectionEnd = textarea.selectionEnd
                  
                  // Get pasted text and filter it
                  const pastedText = e.clipboardData.getData("text")
                  const filteredPasted = validateAndFilterInput(pastedText, selectedDie)
                  
                  // Insert pasted text at cursor position (replacing selection if any)
                  const beforeSelection = currentValue.slice(0, selectionStart)
                  const afterSelection = currentValue.slice(selectionEnd)
                  const newValue = beforeSelection + filteredPasted + afterSelection
                  
                  // Filter the entire new value and limit to max
                  const filtered = validateAndFilterInput(newValue, selectedDie)
                  const limited = filtered.slice(0, maxRollsAllowed)
                  
                  setRollsInput(limited)
                  
                  // Set cursor position after the pasted content
                  setTimeout(() => {
                    const newCursorPos = Math.min(selectionStart + filteredPasted.length, limited.length)
                    textarea.setSelectionRange(newCursorPos, newCursorPos)
                  }, 0)
                }}
                placeholder={selectedDie ? `Enter ${selectedDie} rolls: ${inputExamples[selectedDie]}` : "Enter dice rolls"}
                className="min-h-[120px] max-h-[300px] font-mono text-sm break-all"
                style={{ wordBreak: "break-all", overflowWrap: "break-word" }}
              />
              {minRollsNeeded > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>
                      {rollsRemaining > 0 
                        ? `${rollsRemaining} more rolls needed`
                        : "Ready to convert"}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Output Format</Label>
              <RadioGroup value={outputType} onValueChange={(value) => setOutputType(value as "mnemonic" | "privateKey")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mnemonic" id="mnemonic" />
                  <Label htmlFor="mnemonic" className="cursor-pointer">Seed Phrase</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="privateKey" id="privateKey" />
                  <Label htmlFor="privateKey" className="cursor-pointer">Private Key</Label>
                </div>
              </RadioGroup>
            </div>

            {outputType === "mnemonic" && (
              <div className="space-y-2">
                <Label>Seed Phrase Length</Label>
                <RadioGroup value={seedLength.toString()} onValueChange={(value) => setSeedLength(value === "12" ? 12 : 24)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="12" id="seed12" />
                    <Label htmlFor="seed12" className="cursor-pointer">12 words</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="24" id="seed24" />
                    <Label htmlFor="seed24" className="cursor-pointer">24 words</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConvert} 
              disabled={!rollsInput.trim() || rollsEntered < minRollsNeeded}
            >
              Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
