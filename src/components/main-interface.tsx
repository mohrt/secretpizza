import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Info, Pizza, Dice3, Key, Printer } from "lucide-react"
import { entropyToMnemonic } from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english.js"
import { PrivateKey } from "@bsv/sdk"
import { diceRollsToMnemonic, diceRollsToPrivateKey } from "@/utils/dice2mnemonic"
import { splitSecret } from "@/utils/shamir"
import { generateQRCodeDataURL } from "@/utils/qrcode"
import { deriveAddressesFromMnemonic } from "@/utils/wallet"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

import { DiceRollSection, type DieType } from "@/components/dice-roll-section"
import { PizzaChart } from "@/components/pizza-chart"
import { PresetButtons } from "@/components/preset-buttons"
import { SliceConfigSliders } from "@/components/slice-config-sliders"
import { KeySlicePreview } from "@/components/key-slice-preview"
import { AddressTable } from "@/components/address-table"
import { QrDialog } from "@/components/qr-dialog"
import { KeySliceDialog } from "@/components/key-slice-dialog"
import { AboutTab } from "@/components/about-tab"
import { RestoreTab } from "@/components/restore-tab"
import DisplayCards from "@/components/ui/display-cards"
import { EntropyCollector } from "@/components/entropy-collector"

export interface MainInterfaceHandle {
  setActiveTab: (tab: string) => void
  setShowRollArea: (show: boolean) => void
  enableDice: (dice: DieType[]) => void
  setPreset: (total: string, required: string) => void
}

interface MainInterfaceProps {
  activeTab?: string
  onTabChange?: (value: string) => void
  onKeySliceFilesClick?: () => void
  onPrintCompleteKit?: (slices: any[]) => void
}

export const MainInterface = forwardRef<MainInterfaceHandle, MainInterfaceProps>(
  ({ activeTab, onTabChange, onKeySliceFilesClick, onPrintCompleteKit }, ref) => {
    const isMobile = useIsMobile()

    // State management
    const [secret, setSecret] = useState("")
    const [totalSlices, setTotalSlices] = useState("3")
    const [requiredSlices, setRequiredSlices] = useState("2")
    const [visualMarker, setVisualMarker] = useState("pizza")
    const [filenamePrefix, setFilenamePrefix] = useState("coldpizza_")
    const [showRollArea, setShowRollArea] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [addressCount, setAddressCount] = useState("5")
    const [addresses, setAddresses] = useState<Array<{ id: number; address: string }>>([])
    const [selectedQrAddress, setSelectedQrAddress] = useState<string | null>(null)
    const [selectedKeySlice, setSelectedKeySlice] = useState<number | null>(null)
    const [slices, setSlices] = useState<Array<{ share: string; qrCode: string; index: number }>>([])
    const [walletAddress, setWalletAddress] = useState<string>("")
    const [walletPublicKey, setWalletPublicKey] = useState<string>("")
    const [generatedDate, setGeneratedDate] = useState<Date>(new Date())
    const [isMnemonic, setIsMnemonic] = useState(false)
    const [showAddresses, setShowAddresses] = useState(false)
    // BSV standard BIP44 derivation path: m/44'/236'/0'/0 (coin type 236 is BSV)
    const [derivationPath, setDerivationPath] = useState("m/44'/236'/0'/0")

    const [selectedDie, setSelectedDie] = useState<DieType | null>(null)
    const [showEntropyCollector, setShowEntropyCollector] = useState(false)
    const [pendingWordCount, setPendingWordCount] = useState<12 | 24 | null>(null)
    const [cachedEntropy, setCachedEntropy] = useState<Uint8Array | null>(null)

    const ENTROPY_TARGET_LENGTH = 50

    // Imperative handle for parent control
    useImperativeHandle(ref, () => ({
      setActiveTab: (tab) => onTabChange?.(tab),
      setShowRollArea: (show) => setShowRollArea(show),
      enableDice: (diceToEnable) => {
        if (diceToEnable.length > 0) {
          setSelectedDie(diceToEnable[0])
        }
      },
      setPreset: (total, required) => {
        setTotalSlices(total)
        setRequiredSlices(required)
      },
    }))

    // Convert dice rolls to mnemonic or private key
    // IMPORTANT: This is PURELY DETERMINISTIC - NO PRNG is used
    // Uses the exact algorithm from https://github.com/mohrt/dice2mnemonic
    const convertDiceRollsToSecret = (rolls: string, dieType: DieType, outputType: "mnemonic" | "privateKey", seedLength: 12 | 24 = 12) => {
      try {
        if (outputType === "mnemonic") {
          // Use dice2mnemonic algorithm (matches Python script exactly)
          const mnemonic = diceRollsToMnemonic(rolls, dieType, seedLength)
          setSecret(mnemonic)
          setIsMnemonic(true)
          setShowAddresses(false) // Don't show addresses by default
          toast.success(`Generated ${seedLength}-word mnemonic phrase from dice rolls`)
        } else {
          // Convert to private key (deterministic)
          // d16: uses exact hex string (base16)
          // Other dice: converts base-N to base16 (hex)
          const privateKeyHex = diceRollsToPrivateKey(rolls, dieType)
          
          if (dieType === "d16") {
            // For d16, use the hex string directly (already base16)
            setSecret(privateKeyHex)
          } else {
            // For other dice types, convert hex to PrivateKey format
            try {
              const privateKey = PrivateKey.fromString(privateKeyHex)
              setSecret(privateKey.toString())
            } catch (e) {
              // If conversion fails, use hex string directly
              setSecret(privateKeyHex)
            }
          }
          toast.success("Generated private key from dice rolls")
        }
      } catch (error) {
        console.error("Error converting dice rolls:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to convert dice rolls"
        toast.error(errorMessage)
      }
    }

    const generatePhrase = (words: 12 | 24) => {
      // Check if we already have cached entropy
      if (cachedEntropy && cachedEntropy.length >= 32) {
        // Use cached entropy as additional seed for crypto PRNG
        // Generate fresh random bytes each time
        const requiredBytes = words === 12 ? 16 : 32
        
        // Generate fresh crypto random bytes
        const freshEntropy = new Uint8Array(requiredBytes)
        crypto.getRandomValues(freshEntropy)
        
        // Mix cached entropy with fresh crypto entropy (XOR)
        const finalEntropy = new Uint8Array(requiredBytes)
        for (let i = 0; i < requiredBytes; i++) {
          finalEntropy[i] = freshEntropy[i] ^ cachedEntropy[i % cachedEntropy.length]
        }
        
        const mnemonic = entropyToMnemonic(finalEntropy, wordlist)
        setSecret(mnemonic)
        setIsMnemonic(true)
        setShowAddresses(false) // Don't show addresses by default
        toast.success(`Generated ${words}-word mnemonic phrase`)
        return
      }
      
      // No cached entropy, need to collect it
      setPendingWordCount(words)
      setShowEntropyCollector(true)
    }

    const handleEntropyCollected = (entropy: Uint8Array) => {
      if (!pendingWordCount) return
      
      try {
        // Cache the entropy for reuse during this session
        setCachedEntropy(entropy)
        
        // Use cached entropy as additional seed for crypto PRNG
        // Generate fresh random bytes each time
        const requiredBytes = pendingWordCount === 12 ? 16 : 32
        
        // Generate fresh crypto random bytes
        const freshEntropy = new Uint8Array(requiredBytes)
        crypto.getRandomValues(freshEntropy)
        
        // Mix cached entropy with fresh crypto entropy (XOR)
        const finalEntropy = new Uint8Array(requiredBytes)
        for (let i = 0; i < requiredBytes; i++) {
          finalEntropy[i] = freshEntropy[i] ^ entropy[i % entropy.length]
        }
        
        const mnemonic = entropyToMnemonic(finalEntropy, wordlist)
        setSecret(mnemonic)
        setIsMnemonic(true)
        setShowAddresses(false) // Don't show addresses by default
        setShowEntropyCollector(false)
        setPendingWordCount(null)
        toast.success(`Generated ${pendingWordCount}-word mnemonic phrase`)
      } catch (error) {
        console.error("Error generating mnemonic from entropy:", error)
        toast.error("Failed to generate mnemonic. Please try again.")
      }
    }

    const handleTotalSlicesChange = (value: number[]) => {
      const newTotal = value[0].toString()
      setTotalSlices(newTotal)
      if (Number.parseInt(requiredSlices) > value[0]) {
        setRequiredSlices(newTotal)
      }
    }

    const handleRequiredSlicesChange = (value: number[]) => {
      const required = value[0]
      const total = Number.parseInt(totalSlices)
      if (required <= total) {
        setRequiredSlices(required.toString())
      }
    }

    const handleVisualMarkerChange = (value: string) => {
      setVisualMarker(value)

      const now = new Date()
      const year = now.getFullYear().toString().slice(-2)
      const month = (now.getMonth() + 1).toString().padStart(2, "0")
      const day = now.getDate().toString().padStart(2, "0")
      const minute = now.getMinutes().toString().padStart(2, "0")
      const second = now.getSeconds().toString().padStart(2, "0")
      const timestamp = `${year}${month}${day}${minute}${second}`

      const prefixMap: Record<string, string> = {
        pizza: "coldpizza_",
        cosmos: "cosmos_",
        primates: "primates_",
        vehicles: "vehicles_",
        furniture: "furniture_",
        instruments: "instruments_",
        trees: "trees_",
        colors: "colors_",
        shapes: "shapes_",
        tools: "tools_",
      }

      if (prefixMap[value]) {
        setFilenamePrefix(`${prefixMap[value]}${timestamp}_`)
      }
    }

    const handleGenerateSlices = async () => {
      if (!secret.trim()) {
        toast.error("Please enter a secret (mnemonic phrase or private key) first")
        return
      }

      setIsGenerating(true)
      setShowResults(false)

      try {
        const total = Number.parseInt(totalSlices)
        const required = Number.parseInt(requiredSlices)

        // Split the secret into shares
        const shareStrings = await splitSecret(secret.trim(), total, required)

        // Generate QR codes for each share
        const slicesWithQR = await Promise.all(
          shareStrings.map(async (share, index) => ({
            share,
            qrCode: await generateQRCodeDataURL(share, { width: 400, errorCorrectionLevel: 'H' }),
            index: index + 1,
          }))
        )

        setSlices(slicesWithQR)

        // Derive public key and address based on secret type
        if (isMnemonic) {
          try {
            // Derive addresses from mnemonic using the specified derivation path
            const count = Number.parseInt(addressCount) || 5
            const { addresses: addressesList, firstPublicKey } = await deriveAddressesFromMnemonic(secret.trim(), derivationPath, count)
            
            // Store the primary wallet address and public key (first derived address)
            setWalletAddress(addressesList[0])
            setWalletPublicKey(firstPublicKey)
            
            const addressesWithQR = await Promise.all(
              addressesList.map(async (address, index) => ({
                id: index + 1,
                address,
              }))
            )
            setAddresses(addressesWithQR)
          } catch (error) {
            // Address generation failed, but slices were generated successfully
            console.error("Error generating addresses from mnemonic:", error)
            setWalletAddress("")
            setWalletPublicKey("")
            setAddresses([])
          }
        } else {
          // Try to parse as private key and derive public key
          try {
            const privateKey = PrivateKey.fromString(secret.trim())
            const publicKey = privateKey.toPublicKey()
            const address = publicKey.toAddress()
            
            setWalletAddress(address)
            setWalletPublicKey(publicKey.toString())
            setAddresses([]) // Don't show addresses for private keys
          } catch (error) {
            // Not a valid private key, clear wallet info
            setWalletAddress("")
            setWalletPublicKey("")
            setAddresses([])
          }
        }
        
        // Store the generation date
        setGeneratedDate(new Date())

        setIsGenerating(false)
        setShowResults(true)
        toast.success(`Successfully generated ${total} key slices`)
      } catch (error) {
        console.error("Error generating slices:", error)
        toast.error("Failed to generate slices. Please try again.")
        setIsGenerating(false)
      }
    }


    const handlePresetClick = (total: string, required: string) => {
      setTotalSlices(total)
      setRequiredSlices(required)
    }

    const handleAddressCountChange = async (newCount: string) => {
      setAddressCount(newCount)
      
      // Regenerate addresses if we have a mnemonic
      if (isMnemonic && secret.trim()) {
        try {
          const count = Number.parseInt(newCount) || 5
          const { addresses: addressesList, firstPublicKey } = await deriveAddressesFromMnemonic(secret.trim(), derivationPath, count)
          
          setWalletAddress(addressesList[0])
          setWalletPublicKey(firstPublicKey)
          
          const addressesWithQR = await Promise.all(
            addressesList.map(async (address, index) => ({
              id: index + 1,
              address,
            }))
          )
          setAddresses(addressesWithQR)
        } catch (error) {
          console.error("Error regenerating addresses:", error)
          toast.error("Failed to regenerate addresses")
        }
      }
    }

    const showTooltip = (message: string) => {
      if (isMobile) {
        toast.info(message)
      }
    }

    // Refs and state for animated tab indicator
    const tabsListRef = useRef<HTMLDivElement>(null)
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

    useEffect(() => {
      const updateIndicator = () => {
        if (!tabsListRef.current) return
        const activeTabElement = tabsListRef.current.querySelector('[data-state="active"]') as HTMLElement
        if (activeTabElement) {
          const listRect = tabsListRef.current.getBoundingClientRect()
          const tabRect = activeTabElement.getBoundingClientRect()
          setIndicatorStyle({
            left: tabRect.left - listRect.left + 12,
            width: tabRect.width - 24,
          })
        }
      }

      updateIndicator()
      window.addEventListener("resize", updateIndicator)
      return () => window.removeEventListener("resize", updateIndicator)
    }, [activeTab])

    return (
      <TooltipProvider>
        <Tabs value={activeTab} onValueChange={onTabChange} defaultValue="about" className="w-full space-y-2">
          <TabsList
            ref={tabsListRef}
            className="relative grid w-full grid-cols-1 md:grid-cols-3 h-auto items-stretch bg-muted backdrop-blur-none shadow-md p-1 pb-2 gap-1 md:gap-0 border-b border-border pr-1"
          >
            {/* Animated indicator */}
            <div
              className="absolute bottom-0 h-[3px] bg-primary transition-all duration-300 ease-in-out hidden md:block"
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />

            <TabsTrigger
              value="about"
              className="text-sm font-medium h-9 md:h-auto text-muted-foreground border-0 rounded-none bg-transparent shadow-none data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Why slice your private 🔑 ?
            </TabsTrigger>
            <TabsTrigger
              value="generate"
              className="text-sm font-medium h-9 md:h-auto text-muted-foreground border-0 rounded-none bg-transparent shadow-none data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Cut private 🔑 into slices
            </TabsTrigger>
            <TabsTrigger
              value="restore"
              className="text-sm font-medium h-9 md:h-auto text-muted-foreground border-0 rounded-none bg-transparent shadow-none data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Restore private 🔑 from slices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="focus-visible:outline-hidden">
            <AboutTab />
          </TabsContent>

          <TabsContent value="generate" className="focus-visible:outline-hidden">
            <Card className="bg-card border">
              <CardHeader>
                <CardTitle>🔪 Slice your bitcoins </CardTitle>
                <CardDescription>
                  Slice your secret phrase into{" "}
                  <button
                    type="button"
                    onClick={onKeySliceFilesClick}
                    className="text-primary hover:underline font-medium"
                  >
                    several key slices
                  </button>{" "}
                  that needs to be combined to recover it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center md:items-start flex-col md:flex-row my-0 py-0 items-center gap-4 justify-between pb-5">
                    <span className="mt-1 md:mt-0">Choose how to derive your key</span>
                    <div className="flex flex-col md:flex-row items-end md:items-center gap-1 md:gap-2">
                      <div className="flex gap-2 items-center justify-between">
                        <Button
                          variant="link"
                          className="h-auto p-0 text-xs text-primary"
                          onClick={() => generatePhrase(12)}
                        >
                          12-words
                        </Button>
                        <span className="text-xs text-muted-foreground">•</span>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-xs text-primary"
                          onClick={() => generatePhrase(24)}
                        >
                          24-words
                        </Button>
                        <span className="hidden md:inline text-xs text-muted-foreground">•</span>
                        <Button
                          variant={showRollArea ? "secondary" : "ghost"}
                          className={cn(
                            "h-6 px-2 text-xs gap-1 transition-colors",
                            showRollArea
                              ? "bg-primary/10 text-primary hover:bg-primary/20"
                              : "text-primary hover:text-primary/80 hover:bg-transparent p-0 h-auto font-normal",
                          )}
                          onClick={() => setShowRollArea(!showRollArea)}
                        >
                          {showRollArea ? "Hide Dice" : "Roll key"}
                          <Dice3 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="secret"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Message to be sliced
                    </label>
                    <Textarea
                      id="secret"
                      value={secret}
                      onChange={(e) => {
                        const value = e.target.value
                        setSecret(value)
                        // Detect if it's a mnemonic phrase (12 or 24 words)
                        const words = value.trim().split(/\s+/)
                        const isMnemonicPhrase = (words.length === 12 || words.length === 24) && 
                          words.every(word => /^[a-z]+$/.test(word.toLowerCase()))
                        setIsMnemonic(isMnemonicPhrase)
                        if (!isMnemonicPhrase) {
                          setShowAddresses(false)
                          setAddresses([])
                        }
                      }}
                      placeholder={
                        selectedDie
                          ? `Enter your ${selectedDie} roll results here`
                          : "Enter a mnemonic phrase, private key, or any text you want kept secret."
                      }
                      className="min-h-[120px] font-mono text-sm resize-y"
                    />
                    

                    {showRollArea && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Entropy progress</span>
                          <span>{Math.max(0, ENTROPY_TARGET_LENGTH - secret.length)} more characters required</span>
                        </div>
                        <Progress
                          value={Math.min(100, (secret.length / ENTROPY_TARGET_LENGTH) * 100)}
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>

                  {showRollArea && (
                    <DiceRollSection
                      selectedDie={selectedDie}
                      onSelectDie={setSelectedDie}
                      onConvertToSeed={convertDiceRollsToSecret}
                    />
                  )}

                  <PizzaChart
                    totalSlices={Number.parseInt(totalSlices)}
                    requiredSlices={Number.parseInt(requiredSlices)}
                  />

                  <PresetButtons
                    onPresetClick={handlePresetClick}
                    totalSlices={totalSlices}
                    requiredSlices={requiredSlices}
                  />

                  <SliceConfigSliders
                    totalSlices={totalSlices}
                    requiredSlices={requiredSlices}
                    onTotalChange={handleTotalSlicesChange}
                    onRequiredChange={handleRequiredSlicesChange}
                  />

                  <div className="flex flex-col md:flex-row gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 justify-between">
                          <label htmlFor="marker">Visual marker</label>
                          <Tooltip>
                            <TooltipTrigger
                              onClick={(e) => {
                                if (isMobile) {
                                  e.preventDefault()
                                  showTooltip("A visual icon to help you identify related slices.")
                                }
                              }}
                            >
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Choose a theme, each key slice will have a unique icon from your chosen theme.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select value={visualMarker} onValueChange={handleVisualMarkerChange}>
                          <SelectTrigger id="marker">
                            <SelectValue placeholder="Select marker" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pizza">🍕 pepperoni, mushrooms, etc.</SelectItem>
                            <SelectItem value="cosmos">🪐 planet, star, etc.</SelectItem>
                            <SelectItem value="primates">🦍 monkey, gorilla, etc.</SelectItem>
                            <SelectItem value="vehicles">🚗 car, truck, etc.</SelectItem>
                            <SelectItem value="furniture">🪑 chair, table, etc.</SelectItem>
                            <SelectItem value="instruments">🎸 guitar, piano, etc.</SelectItem>
                            <SelectItem value="trees">🌳 oak, pine, etc.</SelectItem>
                            <SelectItem value="colors">🎨 red, blue, etc.</SelectItem>
                            <SelectItem value="shapes">🔷 circle, square, etc.</SelectItem>
                            <SelectItem value="tools">🔨 hammer, screwdriver, etc.</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 justify-between">
                          <label htmlFor="filename">Filename prefix</label>
                          <Tooltip>
                            <TooltipTrigger
                              onClick={(e) => {
                                if (isMobile) {
                                  e.preventDefault()
                                  showTooltip("A prefix for the generated files.")
                                }
                              }}
                            >
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>A prefix for the generated files.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="filename"
                          value={filenamePrefix}
                          onChange={(e) => setFilenamePrefix(e.target.value)}
                          className="font-mono text-xs"
                          placeholder="prefix_"
                        />
                      </div>
                    </div>

                  <Button
                    className="w-full bg-black hover:bg-black/90 text-white disabled:bg-black/50 disabled:text-white/70"
                    onClick={handleGenerateSlices}
                    disabled={!secret.trim()}
                  >
                    <Pizza className="w-4 h-4 mr-2" />
                    {!secret.trim() ? (
                      <span>Enter key data to slice</span>
                    ) : (
                      <>
                        <span className="md:hidden">
                          Generate {totalSlices} Slices (needs {requiredSlices})
                        </span>
                        <span className="hidden md:inline">
                          Generate {totalSlices} key slices ({requiredSlices} required to restore)
                        </span>
                      </>
                    )}
                  </Button>

                  {/* Loading spinner inside the main card */}
                  {isGenerating && (
                    <div className="flex flex-col items-center justify-center py-8 animate-in fade-in duration-300">
                      <div className="relative w-32 h-32">
                        <img src="/images/pizzaloader.webp" alt="Loading..." className="object-contain w-full h-full" />
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">Generating your key slices...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {showResults && (
              <Card className="bg-card border mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <CardHeader>
                  <CardTitle>Generated Key Slices</CardTitle>
                  <CardDescription>
                    Your secret has been split into {totalSlices} key slices. You need {requiredSlices} slices to
                    recover it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <KeySlicePreview
                    totalSlices={Number.parseInt(totalSlices)}
                    visualMarker={visualMarker}
                    slices={slices}
                    onSliceClick={(idx) => setSelectedKeySlice(idx)}
                  />

                  {isMnemonic && addresses.length > 0 && (
                    <div className="space-y-2">
                      {showAddresses ? (
                        <>
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Address Preview</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAddresses(false)}
                              className="text-xs"
                            >
                              Hide Address Preview
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
                              <div className="flex items-center gap-2 justify-between">
                                <label htmlFor="derivation-path" className="text-sm font-medium">
                                  Derivation Path
                                </label>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>BIP32/BIP44 derivation path for address generation. Format: m/44'/236'/0'/0</p>
                                    <p className="mt-1 text-xs">For BSV, standard path is m/44'/236'/0'/0. Addresses will be derived at /0, /1, /2, etc.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <Input
                                id="derivation-path"
                                value={derivationPath}
                                onChange={async (e) => {
                                  const newPath = e.target.value
                                  setDerivationPath(newPath)
                                  
                                  // Regenerate addresses when derivation path changes
                                  if (isMnemonic && secret.trim()) {
                                    try {
                                      const count = Number.parseInt(addressCount) || 5
                                      const { addresses: addressesList, firstPublicKey } = await deriveAddressesFromMnemonic(secret.trim(), newPath, count)
                                      
                                      setWalletAddress(addressesList[0])
                                      setWalletPublicKey(firstPublicKey)
                                      
                                      const addressesWithQR = await Promise.all(
                                        addressesList.map(async (address, index) => ({
                                          id: index + 1,
                                          address,
                                        }))
                                      )
                                      setAddresses(addressesWithQR)
                                    } catch (error) {
                                      console.error("Error regenerating addresses:", error)
                                      toast.error("Failed to regenerate addresses with new derivation path")
                                    }
                                  }
                                }}
                                placeholder="m/44'/236'/0'/0"
                                className="font-mono text-xs"
                              />
                              <p className="text-xs text-muted-foreground">
                                Addresses will be derived at: {derivationPath}/0, {derivationPath}/1, {derivationPath}/2, etc.
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <label htmlFor="address-count" className="text-sm font-medium">
                                Number of addresses:
                              </label>
                              <Select value={addressCount} onValueChange={handleAddressCountChange}>
                                <SelectTrigger id="address-count" className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5</SelectItem>
                                  <SelectItem value="10">10</SelectItem>
                                  <SelectItem value="15">15</SelectItem>
                                  <SelectItem value="20">20</SelectItem>
                                  <SelectItem value="25">25</SelectItem>
                                  <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <AddressTable
                              addresses={addresses}
                              visibleCount={addresses.length}
                              totalSlices={totalSlices}
                              requiredSlices={requiredSlices}
                              onQrClick={(address) => setSelectedQrAddress(address)}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Addresses Generated</span>
                            <span className="text-xs text-muted-foreground">
                              {addresses.length} address{addresses.length !== 1 ? 'es' : ''} ready to view
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddresses(true)}
                          >
                            View Addresses
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Download Kit</h3>
                    <div className="p-4 rounded-lg border bg-[rgba(235,235,235,1)]">
                      {/* Dynamic display cards for key slices */}
                      <div className="flex justify-center py-8 mb-4">
                        <DisplayCards
                          cards={Array.from({ length: Number.parseInt(totalSlices) }, (_, idx) => ({
                            icon: <Key className="size-4 text-primary" />,
                            title: `Key Slice #${idx + 1}`,
                            description: `Slice ${idx + 1} of ${totalSlices}`,
                            date: new Date().toLocaleDateString(),
                            iconClassName: "text-primary",
                            titleClassName: "text-primary",
                            className:
                              idx === Number.parseInt(totalSlices) - 1
                                ? "[grid-area:stack] translate-x-[" +
                                  idx * 16 +
                                  "px] translate-y-[" +
                                  idx * 10 +
                                  "px] hover:translate-y-[" +
                                  (idx * 10 - 10) +
                                  "px]"
                                : "[grid-area:stack] translate-x-[" +
                                  idx * 16 +
                                  "px] translate-y-[" +
                                  idx * 10 +
                                  "px] hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                          }))}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Print all slices to PDF. Each slice will be on its own page. Click Print and choose "Save as PDF" to download.
                      </p>
                      <Button
                        className="w-full bg-black hover:bg-black/90 text-white"
                        onClick={() => {
                          if (onPrintCompleteKit) {
                            // Prepare slice data for printing
                            const sliceData = slices.map(slice => ({
                              index: slice.index,
                              share: slice.share,
                              totalSlices: Number.parseInt(totalSlices),
                              threshold: Number.parseInt(requiredSlices),
                              walletAddress,
                              walletPublicKey,
                              walletLabel: filenamePrefix.replace(/_\d+_$/, ""),
                              generatedOn: generatedDate,
                              visualMarker
                            }))
                            onPrintCompleteKit(sliceData)
                          }
                        }}
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Complete Kit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="restore" className="focus-visible:outline-hidden">
            <RestoreTab onKeySliceFilesClick={onKeySliceFilesClick} />
          </TabsContent>
        </Tabs>

        <QrDialog address={selectedQrAddress} onClose={() => setSelectedQrAddress(null)} />

        <KeySliceDialog
          sliceIndex={selectedKeySlice}
          totalSlices={Number.parseInt(totalSlices)}
          requiredSlices={Number.parseInt(requiredSlices)}
          sliceData={selectedKeySlice !== null ? slices[selectedKeySlice] : null}
          walletAddress={walletAddress}
          walletPublicKey={walletPublicKey}
          walletLabel={filenamePrefix.replace(/_\d+_$/, "")} // Remove timestamp suffix
          generatedOn={generatedDate}
          visualMarker={visualMarker}
          onClose={() => setSelectedKeySlice(null)}
        />
        <EntropyCollector
          open={showEntropyCollector}
          onClose={() => {
            setShowEntropyCollector(false)
            setPendingWordCount(null)
          }}
          onComplete={handleEntropyCollected}
          targetBits={pendingWordCount === 12 ? 128 : 256}
        />


      </TooltipProvider>
    )
  },
)

MainInterface.displayName = "MainInterface"

