import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Info, Pizza, Dice3, Download, Key } from "lucide-react"
import { generateMnemonic } from "bip39"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

import { DiceRollSection, type DieType, type DiceState } from "@/components/dice-roll-section"
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

export interface MainInterfaceHandle {
  setActiveTab: (tab: string) => void
  setShowRollArea: (show: boolean) => void
  enableDice: (dice: DieType[]) => void
  setPreset: (total: string, required: string) => void
  setShowAdvancedOptions: (show: boolean) => void
}

interface MainInterfaceProps {
  activeTab?: string
  onTabChange?: (value: string) => void
  onKeySliceFilesClick?: () => void
}

export const MainInterface = forwardRef<MainInterfaceHandle, MainInterfaceProps>(
  ({ activeTab, onTabChange, onKeySliceFilesClick }, ref) => {
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
    const [visibleAddresses, setVisibleAddresses] = useState(5)
    const [addresses, setAddresses] = useState<Array<{ id: number; address: string; used: boolean }>>([])
    const [selectedQrAddress, setSelectedQrAddress] = useState<string | null>(null)
    const [selectedKeySlice, setSelectedKeySlice] = useState<number | null>(null)
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

    const [diceState, setDiceState] = useState<Record<DieType, DiceState>>({
      coin: { enabled: false, value: "" },
      d4: { enabled: false, value: "" },
      d6: { enabled: false, value: "" },
      d8: { enabled: false, value: "" },
      d10: { enabled: false, value: "" },
      d16: { enabled: false, value: "" },
    })

    const ENTROPY_TARGET_LENGTH = 50

    // Imperative handle for parent control
    useImperativeHandle(ref, () => ({
      setActiveTab: (tab) => onTabChange?.(tab),
      setShowRollArea: (show) => setShowRollArea(show),
      enableDice: (diceToEnable) => {
        setDiceState((prev) => {
          const newState = { ...prev }
          diceToEnable.forEach((die) => {
            newState[die] = { ...newState[die], enabled: true, value: "1" }
          })
          return newState
        })
      },
      setPreset: (total, required) => {
        setTotalSlices(total)
        setRequiredSlices(required)
      },
      setShowAdvancedOptions: (show) => setShowAdvancedOptions(show),
    }))

    // Event handlers
    const toggleDie = (die: DieType) => {
      setDiceState((prev) => ({
        ...prev,
        [die]: {
          enabled: !prev[die].enabled,
          value: !prev[die].enabled ? "1" : prev[die].value,
        },
      }))
    }

    const updateDieValue = (die: DieType, value: string) => {
      setDiceState((prev) => ({
        ...prev,
        [die]: { ...prev[die], value },
      }))
    }

    const generatePhrase = (words: 12 | 24) => {
      const strength = words === 12 ? 128 : 256
      const mnemonic = generateMnemonic(strength)
      setSecret(mnemonic)
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
      setIsGenerating(true)
      setShowResults(false)

      const response = await fetch("/addresses.json")
      const data = await response.json()
      // Handle both old array format and new object format
      const addressList = Array.isArray(data) ? data : data.addresses
      setAddresses(addressList)

      await new Promise((resolve) => setTimeout(resolve, 2000))

      setIsGenerating(false)
      setShowResults(true)
    }

    const handleAddressToggle = (id: number) => {
      const newAddresses = [...addresses]
      const index = addresses.findIndex((a) => a.id === id)
      newAddresses[index] = {
        ...newAddresses[index],
        used: !newAddresses[index].used,
      }
      setAddresses(newAddresses)
    }

    const handlePresetClick = (total: string, required: string) => {
      setTotalSlices(total)
      setRequiredSlices(required)
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
                      onChange={(e) => setSecret(e.target.value)}
                      placeholder={
                        Object.values(diceState).some((d) => d.enabled)
                          ? "Type your die / coin roll results here: e.g. 123912923993021312332133023012301231233213302301"
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
                      diceState={diceState}
                      onToggleDie={toggleDie}
                      onUpdateDieValue={updateDieValue}
                      onConvertToSeed={() => generatePhrase(24)}
                      isConvertDisabled={secret.length < ENTROPY_TARGET_LENGTH}
                    />
                  )}

                  <PizzaChart
                    totalSlices={Number.parseInt(totalSlices)}
                    requiredSlices={Number.parseInt(requiredSlices)}
                  />

                  <PresetButtons
                    onPresetClick={handlePresetClick}
                    showAdvancedOptions={showAdvancedOptions}
                    onToggleAdvancedOptions={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  />

                  {showAdvancedOptions && (
                    <SliceConfigSliders
                      totalSlices={totalSlices}
                      requiredSlices={requiredSlices}
                      onTotalChange={handleTotalSlicesChange}
                      onRequiredChange={handleRequiredSlicesChange}
                    />
                  )}

                  {showAdvancedOptions && (
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
                  )}

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
                    onSliceClick={(idx) => setSelectedKeySlice(idx)}
                  />

                  <AddressTable
                    addresses={addresses}
                    visibleCount={visibleAddresses}
                    totalSlices={totalSlices}
                    requiredSlices={requiredSlices}
                    onAddressToggle={handleAddressToggle}
                    onQrClick={(address) => setSelectedQrAddress(address)}
                    onShowMore={() => setVisibleAddresses(addresses.length)}
                  />

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
                        Download your complete key slices kit including all slices and address information.
                      </p>
                      <Button className="w-full bg-black hover:bg-black/90 text-white" onClick={onKeySliceFilesClick}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Complete Kit
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
          onClose={() => setSelectedKeySlice(null)}
        />
      </TooltipProvider>
    )
  },
)

MainInterface.displayName = "MainInterface"

