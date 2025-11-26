import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ClipboardPaste, Camera, Check, Plus } from "lucide-react"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

interface RestoreTabProps {
  onKeySliceFilesClick?: () => void
}

export function RestoreTab({ onKeySliceFilesClick }: RestoreTabProps) {
  const isMobile = useIsMobile()
  const tabsListRef = useRef<HTMLDivElement>(null)

  const [innerTab, setInnerTab] = useState<string | undefined>(undefined)
  const [scannedSlices, setScannedSlices] = useState(0)
  const [isScanning, setIsScanning] = useState(false)
  const [recoveryData, setRecoveryData] = useState<{ privateKey: string; mnemonic: string } | null>(null)
  const [showRecoveredData, setShowRecoveredData] = useState(false)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const [keySliceInputs, setKeySliceInputs] = useState<string[]>(["", ""])
  const [showPasteRecoveredData, setShowPasteRecoveredData] = useState(false)

  useEffect(() => {
    if (innerTab === undefined) {
      setInnerTab(isMobile ? "scan" : "paste")
    }
  }, [isMobile, innerTab])

  useEffect(() => {
    fetch("/addresses.json")
      .then((res) => res.json())
      .then((data) => {
        if (data.recoveryData) {
          setRecoveryData(data.recoveryData)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!tabsListRef.current || !innerTab) return

    const updateIndicator = () => {
      const tabsList = tabsListRef.current
      if (!tabsList) return

      const activeTab = tabsList.querySelector(`[data-state="active"]`) as HTMLElement
      if (activeTab) {
        const listRect = tabsList.getBoundingClientRect()
        const tabRect = activeTab.getBoundingClientRect()
        setIndicatorStyle({
          left: tabRect.left - listRect.left + 12,
          width: tabRect.width - 24,
        })
      }
    }

    updateIndicator()
    window.addEventListener("resize", updateIndicator)
    return () => window.removeEventListener("resize", updateIndicator)
  }, [innerTab])

  const showTooltip = (message: string) => {
    if (isMobile) {
      toast.info(message)
    }
  }

  const handleScanClick = () => {
    setIsScanning(true)

    // Show pizza spinner for 1 second, then increment scanned slices
    setTimeout(() => {
      setIsScanning(false)
      const newCount = scannedSlices + 1
      setScannedSlices(newCount)

      if (newCount >= 3) {
        // All slices scanned, show recovered data
        setShowRecoveredData(true)
        toast.success("All key slices scanned! Secret recovered.")
      } else {
        toast.success(`Key slice ${newCount} scanned successfully!`)
      }
    }, 1000)
  }

  const handleResetScan = () => {
    setScannedSlices(0)
    setShowRecoveredData(false)
  }

  const handleKeySliceChange = (index: number, value: string) => {
    const newInputs = [...keySliceInputs]
    newInputs[index] = value
    setKeySliceInputs(newInputs)
  }

  const handleAddSlice = () => {
    setKeySliceInputs([...keySliceInputs, ""])
  }

  const handleRemoveSlice = (index: number) => {
    if (keySliceInputs.length > 2) {
      const newInputs = keySliceInputs.filter((_, i) => i !== index)
      setKeySliceInputs(newInputs)
    }
  }

  const filledInputsCount = keySliceInputs.filter((input) => input.trim().length > 0).length
  const canRestore = filledInputsCount >= 2

  const handlePasteRestore = () => {
    if (!canRestore) return
    setShowPasteRecoveredData(true)
    toast.success("Secret successfully recovered!")
  }

  const handleResetPaste = () => {
    setKeySliceInputs(["", ""])
    setShowPasteRecoveredData(false)
  }

  return (
    <TooltipProvider>
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle>Restore message </CardTitle>
          <CardDescription className="">
            Combine your{" "}
            <button
              onClick={onKeySliceFilesClick}
              className="text-primary underline underline-offset-2 hover:text-primary/80 cursor-pointer"
            >
              key slice files
            </button>{" "}
            to reveal the original message.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg border text-sm text-muted-foreground">
            Ensure you provide at least the minimum number of slices required (e.g., 2 of 3).
          </div>

          <Tabs value={innerTab} onValueChange={setInnerTab} className="w-full">
            <TabsList
              ref={tabsListRef}
              className="relative grid w-full grid-cols-2 h-auto items-stretch bg-muted backdrop-blur-none shadow-md p-1 pb-2 gap-1 border-b border-border"
            >
              <TabsTrigger
                value="scan"
                className="text-sm font-medium h-9 text-muted-foreground border-0 rounded-none bg-transparent shadow-none data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <Camera className="w-4 h-4 mr-2" />
                <span className="md:hidden">Scan</span>
                <span className="hidden md:inline">Scan QR codes</span>
              </TabsTrigger>
              <TabsTrigger
                value="paste"
                className="text-sm font-medium h-9 text-muted-foreground border-0 rounded-none bg-transparent shadow-none data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <ClipboardPaste className="w-4 h-4 mr-2" />
                <span className="md:hidden">Paste</span>
                <span className="hidden md:inline">Paste key slice data</span>
              </TabsTrigger>
              {/* Animated indicator */}
              <div
                className="absolute bottom-0 h-[3px] bg-primary transition-all duration-300 ease-in-out hidden md:block"
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                }}
              />
            </TabsList>

            {/* Scan QR codes tab */}
            <TabsContent value="scan" className="mt-4 space-y-4">
              {!showRecoveredData ? (
                <>
                  <div className="text-sm text-muted-foreground mb-4">
                    Scan each key slice QR code one at a time. You need to scan at least 3 slices to recover your
                    secret.
                  </div>

                  {/* Progress indicators */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                          scannedSlices >= step
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground text-muted-foreground"
                        }`}
                      >
                        {scannedSlices >= step ? <Check className="w-5 h-5" /> : step}
                      </div>
                    ))}
                  </div>

                  {/* Scanning area */}
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/30">
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-4">
                        <img src="/images/pizzaloader.webp" alt="Scanning..." width={80} height={80} />
                        <p className="text-sm text-muted-foreground">Scanning key slice {scannedSlices + 1}...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <Camera className="w-16 h-16 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground text-center">
                          {scannedSlices === 0
                            ? "Click the button below to scan your first key slice QR code"
                            : `${scannedSlices} of 3 slices scanned. Click to scan the next QR code.`}
                        </p>
                        <Button onClick={handleScanClick} className="bg-black hover:bg-black/90 text-white">
                          <Camera className="w-4 h-4 mr-2" />
                          Scan key slice {scannedSlices + 1}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Recovered data display */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600 mb-4">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Secret successfully recovered!</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Private Key</label>
                      <Input readOnly value={recoveryData?.privateKey || ""} className="font-mono text-sm bg-muted" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mnemonic Phrase</label>
                      <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                        {recoveryData?.mnemonic || ""}
                      </div>
                    </div>

                    <Button variant="outline" onClick={handleResetScan} className="w-full mt-4 bg-transparent">
                      Scan again
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Paste key slice data tab */}
            <TabsContent value="paste" className="mt-4 space-y-4">
              {!showPasteRecoveredData ? (
                <>
                  <div className="text-sm text-muted-foreground mb-4">
                    Paste the key slice data from each of your key slices. You need at least 2 slices to recover your
                    secret.
                  </div>

                  {/* Key slice inputs */}
                  <div className="space-y-3">
                    {keySliceInputs.map((value, index) => {
                      const hasContent = value.trim().length > 0
                      return (
                        <div key={index} className="relative flex items-center">
                          {/* Green check icon when input has content */}
                          {hasContent && (
                            <div className="absolute left-3 z-10">
                              <Check className="w-4 h-4 text-green-500" />
                            </div>
                          )}
                          <Input
                            value={value}
                            onChange={(e) => handleKeySliceChange(index, e.target.value)}
                            placeholder={
                              index === 0
                                ? "first key slice data"
                                : index === 1
                                  ? "second key slice data"
                                  : `key slice ${index + 1} data`
                            }
                            className={`flex-1 bg-muted pr-10 ${hasContent ? "pl-9" : ""} border-1 hover:border-2 ${
                              hasContent ? "border-green-500" : "border-slate-200"
                            } focus:ring-0 focus-visible:ring-0`}
                          />
                          {index >= 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSlice(index)}
                              className="absolute right-1 h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-white rounded"
                            >
                              &times;
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Add another slice button */}
                  <Button
                    variant="ghost"
                    onClick={handleAddSlice}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add another slice
                  </Button>

                  {/* Restore button */}
                  <Button
                    onClick={handlePasteRestore}
                    disabled={!canRestore}
                    className="w-full bg-black hover:bg-black/90 text-white disabled:opacity-50"
                  >
                    <ClipboardPaste className="w-4 h-4 mr-2" />
                    Restore ({filledInputsCount}/{keySliceInputs.length} slices)
                  </Button>
                </>
              ) : (
                <>
                  {/* Recovered data display - same as scan tab */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600 mb-4">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Secret successfully recovered!</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Private Key</label>
                      <Input readOnly value={recoveryData?.privateKey || ""} className="font-mono text-sm bg-muted" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mnemonic Phrase</label>
                      <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                        {recoveryData?.mnemonic || ""}
                      </div>
                    </div>

                    <Button variant="outline" onClick={handleResetPaste} className="w-full mt-4 bg-transparent">
                      Try again
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

