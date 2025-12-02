import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dice3, Sparkles } from "lucide-react"
import { DiceRollSection, type DieType } from "@/components/dice-roll-section"
import { EntropyCollector } from "@/components/entropy-collector"
import { entropyToMnemonic } from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english.js"
import { PrivateKey } from "@bsv/sdk"
import { toast } from "sonner"

// Module-level cache for entropy (persists across component re-renders but resets on page reload)
let cachedEntropy: Uint8Array | null = null

interface GenerateKeyDialogProps {
  open: boolean
  onClose: () => void
  onSecretGenerated: (secret: string, isMnemonic: boolean) => void
  onDiceConvert: (rolls: string, dieType: DieType, outputType: "mnemonic" | "privateKey", seedLength?: 12 | 24) => void
  selectedDie: DieType | null
  onSelectDie: (die: DieType | null) => void
}

export function GenerateKeyDialog({
  open,
  onClose,
  onSecretGenerated,
  onDiceConvert,
  selectedDie,
  onSelectDie,
}: GenerateKeyDialogProps) {
  const [activeTab, setActiveTab] = useState<"random" | "dice">("random")
  const [randomType, setRandomType] = useState<"privateKey" | "12words" | "24words">("12words")
  const [showEntropyCollector, setShowEntropyCollector] = useState(false)
  const [pendingRandomType, setPendingRandomType] = useState<"privateKey" | "12words" | "24words" | null>(null)

  const generateFromCachedEntropy = (type: "privateKey" | "12words" | "24words") => {
    if (!cachedEntropy || cachedEntropy.length < 32) {
      // Not enough cached entropy, need to collect
      setPendingRandomType(type)
      setShowEntropyCollector(true)
      return
    }

    // Use cached entropy
    try {
      if (type === "privateKey") {
        // Generate 32 bytes for private key
        const requiredBytes = 32
        const freshEntropy = new Uint8Array(requiredBytes)
        crypto.getRandomValues(freshEntropy)

        // Mix cached entropy with fresh crypto entropy
        const finalEntropy = new Uint8Array(requiredBytes)
        for (let i = 0; i < requiredBytes; i++) {
          finalEntropy[i] = freshEntropy[i] ^ cachedEntropy[i % cachedEntropy.length]
        }

        // Convert entropy bytes to hex string for PrivateKey (must be exactly 64 hex chars = 32 bytes)
        const hexString = Array.from(finalEntropy.slice(0, 32))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .padEnd(64, '0') // Ensure exactly 64 characters
        
        // Create PrivateKey from the entropy
        const privateKey = PrivateKey.fromString(hexString)
        onSecretGenerated(privateKey.toString(), false)
        toast.success("Private key generated successfully")
      } else {
        // Generate mnemonic (12 or 24 words)
        const words = type === "12words" ? 12 : 24
        const requiredBytes = words === 12 ? 16 : 32
        
        const freshEntropy = new Uint8Array(requiredBytes)
        crypto.getRandomValues(freshEntropy)

        // Mix cached entropy with fresh crypto entropy
        const finalEntropy = new Uint8Array(requiredBytes)
        for (let i = 0; i < requiredBytes; i++) {
          finalEntropy[i] = freshEntropy[i] ^ cachedEntropy[i % cachedEntropy.length]
        }

        const mnemonic = entropyToMnemonic(finalEntropy, wordlist)
        onSecretGenerated(mnemonic, true)
        toast.success(`Generated ${words}-word mnemonic phrase`)
      }
      
      // Close dialog after generation
      onClose()
    } catch (error) {
      console.error("Error generating secret:", error)
      toast.error("Failed to generate secret. Please try again.")
    }
  }

  const handleRandomGenerate = (type: "privateKey" | "12words" | "24words") => {
    generateFromCachedEntropy(type)
  }

  const handleEntropyCollected = (entropy: Uint8Array) => {
    if (!pendingRandomType) return

    try {
      // Cache the entropy for future use (persists until page reload)
      cachedEntropy = entropy

      if (pendingRandomType === "privateKey") {
        // Generate 32 bytes for private key
        const requiredBytes = 32
        const freshEntropy = new Uint8Array(requiredBytes)
        crypto.getRandomValues(freshEntropy)

        // Mix user entropy with crypto entropy
        const finalEntropy = new Uint8Array(requiredBytes)
        for (let i = 0; i < requiredBytes; i++) {
          finalEntropy[i] = freshEntropy[i] ^ entropy[i % entropy.length]
        }

        // Convert entropy bytes to hex string for PrivateKey (must be exactly 64 hex chars = 32 bytes)
        const hexString = Array.from(finalEntropy.slice(0, 32))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .padEnd(64, '0') // Ensure exactly 64 characters
        
        // Create PrivateKey from the entropy
        const privateKey = PrivateKey.fromString(hexString)
        onSecretGenerated(privateKey.toString(), false)
        toast.success("Private key generated successfully")
      } else {
        // Generate mnemonic (12 or 24 words)
        const words = pendingRandomType === "12words" ? 12 : 24
        const requiredBytes = words === 12 ? 16 : 32
        
        const freshEntropy = new Uint8Array(requiredBytes)
        crypto.getRandomValues(freshEntropy)

        // Mix user entropy with crypto entropy
        const finalEntropy = new Uint8Array(requiredBytes)
        for (let i = 0; i < requiredBytes; i++) {
          finalEntropy[i] = freshEntropy[i] ^ entropy[i % entropy.length]
        }

        const mnemonic = entropyToMnemonic(finalEntropy, wordlist)
        onSecretGenerated(mnemonic, true)
        toast.success(`Generated ${words}-word mnemonic phrase`)
      }

      setShowEntropyCollector(false)
      setPendingRandomType(null)
      onClose()
    } catch (error) {
      console.error("Error generating secret:", error)
      toast.error("Failed to generate secret. Please try again.")
      setShowEntropyCollector(false)
      setPendingRandomType(null)
    }
  }

  // Wrapper for dice conversion that closes the dialog
  const handleDiceConvert = (rolls: string, dieType: DieType, outputType: "mnemonic" | "privateKey", seedLength?: 12 | 24) => {
    onDiceConvert(rolls, dieType, outputType, seedLength)
    onClose() // Close dialog after dice generation
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate Key</DialogTitle>
            <DialogDescription>
              Choose how you want to generate your secret key or seed phrase.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "random" | "dice")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="random">
                <Sparkles className="w-4 h-4 mr-2" />
                Random
              </TabsTrigger>
              <TabsTrigger value="dice">
                <Dice3 className="w-4 h-4 mr-2" />
                Roll Dice
              </TabsTrigger>
            </TabsList>

            <TabsContent value="random" className="mt-4 space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Generate a random secret using mouse movements and keyboard input for entropy.
                </p>
                
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant={randomType === "12words" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => {
                      setRandomType("12words")
                      handleRandomGenerate("12words")
                    }}
                  >
                    <span className="mr-2">📝</span>
                    12-word seed phrase
                  </Button>
                  
                  <Button
                    variant={randomType === "24words" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => {
                      setRandomType("24words")
                      handleRandomGenerate("24words")
                    }}
                  >
                    <span className="mr-2">📝</span>
                    24-word seed phrase
                  </Button>
                  
                  <Button
                    variant={randomType === "privateKey" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => {
                      setRandomType("privateKey")
                      handleRandomGenerate("privateKey")
                    }}
                  >
                    <span className="mr-2">🔑</span>
                    Private key
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dice" className="mt-4">
              <DiceRollSection
                selectedDie={selectedDie}
                onSelectDie={onSelectDie}
                onConvertToSeed={handleDiceConvert}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <EntropyCollector
        open={showEntropyCollector}
        onClose={() => {
          setShowEntropyCollector(false)
          setPendingRandomType(null)
        }}
        onComplete={handleEntropyCollected}
        targetBits={pendingRandomType === "24words" ? 256 : 128}
      />
    </>
  )
}

