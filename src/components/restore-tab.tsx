import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ClipboardPaste, Camera, Check, Plus } from "lucide-react"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"
import { reconstructSecret } from "@/utils/shamir"
import { validateMnemonic } from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english.js"
import { Html5Qrcode } from "html5-qrcode"

interface RestoreTabProps {
  onKeySliceFilesClick?: () => void
}

export function RestoreTab({ onKeySliceFilesClick }: RestoreTabProps) {
  const isMobile = useIsMobile()
  const tabsListRef = useRef<HTMLDivElement>(null)

  const [innerTab, setInnerTab] = useState<string>(isMobile ? "scan" : "paste")
  const [scannedSlices, setScannedSlices] = useState<string[]>([]) // Array of scanned share strings
  const [isScanning, setIsScanning] = useState(false)
  const [isAttemptingRecovery, setIsAttemptingRecovery] = useState(false)
  const [recoveryData, setRecoveryData] = useState<{ privateKey: string; mnemonic: string } | null>(null)
  const [showRecoveredData, setShowRecoveredData] = useState(false)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerRef = useRef<HTMLDivElement>(null)

  const [keySliceInputs, setKeySliceInputs] = useState<string[]>(["", ""])
  const [showPasteRecoveredData, setShowPasteRecoveredData] = useState(false)

  useEffect(() => {
    fetch("/addresses.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON")
        }
        return res.json()
      })
      .then((data) => {
        if (data.recoveryData) {
          setRecoveryData(data.recoveryData)
        }
      })
      .catch((error) => {
        // Silently fail if addresses.json doesn't exist - it's optional
        if (error.message.includes("404") || error.message.includes("not JSON")) {
          // File doesn't exist or is not JSON, which is fine
          return
        }
        console.error("Error loading recovery data:", error)
      })
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


  const handleScanClick = async () => {
    // Stop any existing scanner first
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
      } catch (error) {
        // Ignore stop errors
        scannerRef.current = null
      }
    }

    // Show the scanner container
    setIsScanning(true)
    
    // Wait for React to render the container
    await new Promise(resolve => setTimeout(resolve, 200))

    // Check if container exists
    const container = document.getElementById("qr-reader-scan-tab")
    if (!container) {
      console.error("Scanner container not found")
      setIsScanning(false)
      toast.error("Scanner container not ready. Please try again.")
      return
    }

    try {
      // Create new scanner instance
      scannerRef.current = new Html5Qrcode("qr-reader-scan-tab")
      const scanner = scannerRef.current

      // Try to get available cameras first
      let cameraId: string | { facingMode: string } = { facingMode: "environment" }
      
      try {
        const devices = await Html5Qrcode.getCameras()
        console.log("Available cameras:", devices)

        // If we have camera devices, try to find a back camera
        if (devices && devices.length > 0) {
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes("back") || 
            device.label.toLowerCase().includes("rear")
          )
          if (backCamera) {
            cameraId = backCamera.id
          } else {
            // Use first available camera
            cameraId = devices[0].id
          }
        } else {
          // No cameras found, use default config
          console.warn("No cameras found, using default config")
        }
      } catch (cameraError) {
        console.warn("Could not enumerate cameras, using default config:", cameraError)
        // Use default config
      }

      console.log("Using camera:", cameraId)

      // Start scanning with larger qrbox and higher camera resolution for high-density QR codes
      // html5-qrcode primarily focuses on QR codes by default
      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 400, height: 400 },
          aspectRatio: 1.0,
          videoConstraints: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: "environment",
          },
        },
        (decodedText) => {
          // QR code detected
          handleQRCodeScanned(decodedText)
        },
        (_errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
        }
      )
    } catch (error) {
      console.error("Error starting scanner:", error)
      setIsScanning(false)
      scannerRef.current = null
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      if (errorMessage.includes("Permission") || errorMessage.includes("permission")) {
        toast.error("Camera permission denied. Please allow camera access and try again.")
      } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("not found")) {
        toast.error("No camera found. Please connect a camera and try again.")
      } else {
        toast.error(`Failed to start camera: ${errorMessage}`)
      }
    }
  }

  const handleQRCodeScanned = async (decodedText: string) => {
    // Clean the scanned text (remove whitespace, ensure hex-only)
    const cleanedShare = decodedText.replace(/\s+/g, '').replace(/[^0-9a-fA-F]/g, '')
    
    if (cleanedShare.length === 0) {
      toast.error("Invalid QR code: No valid hex data found")
      return
    }

    // Check if this share is already scanned
    if (scannedSlices.includes(cleanedShare)) {
      toast.info("This slice has already been scanned")
      return
    }

    // Stop scanning temporarily
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch (error) {
        // Ignore stop errors
      }
    }
    setIsScanning(false)

    // Add to scanned slices
    const newScannedSlices = [...scannedSlices, cleanedShare]
    setScannedSlices(newScannedSlices)

    toast.success(`Key slice ${newScannedSlices.length} scanned successfully!`)

    // If we have at least 2 slices, try to recover
    // Note: We don't know the threshold, so we try after each scan once we have 2+
    if (newScannedSlices.length >= 2) {
      setIsAttemptingRecovery(true)
      try {
        await recoverFromScannedSlices(newScannedSlices)
      } catch (error) {
        // Error already handled in recoverFromScannedSlices
      } finally {
        setIsAttemptingRecovery(false)
      }
    }
  }

  const recoverFromScannedSlices = async (shares: string[]) => {
    if (shares.length < 2) return

    // Validate that all shares have the same length
    const shareLengths = shares.map(share => share.length)
    const firstLength = shareLengths[0]
    const allSameLength = shareLengths.every(length => length === firstLength)

    if (!allSameLength) {
      const lengthCounts = shareLengths.reduce((acc, len) => {
        acc[len] = (acc[len] || 0) + 1
        return acc
      }, {} as Record<number, number>)
      const lengthDetails = Object.entries(lengthCounts)
        .map(([len, count]) => `${count} slice${count > 1 ? 's' : ''} with ${len} characters`)
        .join(', ')
      toast.error(`All slices must have the same length. Found: ${lengthDetails}. Please scan all slices again.`)
      return
    }

    // Validate that hex length is even
    if (firstLength % 2 !== 0) {
      toast.error(`Invalid slice length: ${firstLength} characters. Hex strings must have an even number of characters.`)
      return
    }

    try {
      // Reconstruct the secret from the shares
      const recoveredSecret = await reconstructSecret(shares)

      // Normalize the recovered secret
      const cleanedSecret = recoveredSecret
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        .trim()
        .replace(/\s+/g, ' ')

      // Check if it's a valid BIP39 mnemonic phrase
      const isMnemonicPhrase = validateMnemonic(cleanedSecret, wordlist)

      // Set the recovery data
      setRecoveryData({
        privateKey: isMnemonicPhrase ? "" : cleanedSecret,
        mnemonic: isMnemonicPhrase ? cleanedSecret : ""
      })

      setShowRecoveredData(true)
      toast.success("Secret successfully recovered!")
    } catch (error) {
      console.error("Error recovering secret:", error)
      let errorMessage = "Unknown error"
      
      if (error instanceof Error) {
        errorMessage = error.message
        if (errorMessage.includes("same byte length")) {
          errorMessage = "All slices must have the same length. Please scan all slices again."
        } else if (errorMessage.includes("at least 2 shares")) {
          errorMessage = "You need at least 2 slices to recover the secret."
        } else if (errorMessage.includes("invalid") || errorMessage.includes("Invalid")) {
          errorMessage = "Invalid slice data. Please check that your slices are correct and complete."
        }
      }
      
      // If it's a validation error (length mismatch, etc), show as error
      // Otherwise, it might just be that we don't have enough slices yet, so show as info
      if (errorMessage.includes("same byte length") || errorMessage.includes("Invalid")) {
        toast.error(`Failed to recover secret: ${errorMessage}. Please check your slices.`)
      } else {
        // Likely just need more slices - this is normal, so show as info
        toast.info(`Not enough slices yet. Keep scanning.`)
      }
    }
  }

  const handleResetScan = async () => {
    // Stop scanner if running
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
      } catch (error) {
        // Ignore stop errors
      }
    }
    setIsScanning(false)
    setScannedSlices([])
    setShowRecoveredData(false)
    setRecoveryData(null)
  }

  // Cleanup scanner when component unmounts or tab changes
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {
          // Ignore cleanup errors
        })
      }
    }
  }, [])

  // Stop scanner when switching away from scan tab
  useEffect(() => {
    if (innerTab !== "scan" && scannerRef.current && isScanning) {
      scannerRef.current.stop().catch(() => {
        // Ignore stop errors
      })
      setIsScanning(false)
    }
  }, [innerTab, isScanning])

  const handleKeySliceChange = (index: number, value: string) => {
    // Only allow hex characters (0-9, a-f, A-F) - remove all other characters
    const hexOnly = value.replace(/[^0-9a-fA-F]/g, '')
    const newInputs = [...keySliceInputs]
    newInputs[index] = hexOnly
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

  const handlePasteRestore = async () => {
    if (!canRestore) return

    // Get the filled slice inputs (already sanitized to hex-only by handleKeySliceChange)
    const filledShares = keySliceInputs
      .filter(input => input.length > 0)

    if (filledShares.length < 2) {
      toast.error("Please provide at least 2 key slices")
      return
    }

    // Validate that all shares have the same length
    const shareLengths = filledShares.map(share => share.length)
    const firstLength = shareLengths[0]
    const allSameLength = shareLengths.every(length => length === firstLength)

    if (!allSameLength) {
      const lengthCounts = shareLengths.reduce((acc, len) => {
        acc[len] = (acc[len] || 0) + 1
        return acc
      }, {} as Record<number, number>)
      const lengthDetails = Object.entries(lengthCounts)
        .map(([len, count]) => `${count} slice${count > 1 ? 's' : ''} with ${len} characters`)
        .join(', ')
      toast.error(`All slices must have the same length. Found: ${lengthDetails}. Please check your slices.`)
      return
    }

    // Validate that hex length is even (required for byte conversion)
    if (firstLength % 2 !== 0) {
      toast.error(`Invalid slice length: ${firstLength} characters. Hex strings must have an even number of characters.`)
      return
    }

    try {
      // Reconstruct the secret from the shares
      const recoveredSecret = await reconstructSecret(filledShares)

      // Normalize the recovered secret (trim and normalize whitespace)
      // First remove all non-printable characters and normalize whitespace
      const cleanedSecret = recoveredSecret
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .trim()
        .replace(/\s+/g, ' ') // Normalize whitespace to single spaces

      // Check if it's a valid BIP39 mnemonic phrase
      const isMnemonicPhrase = validateMnemonic(cleanedSecret, wordlist)

      // Set the recovery data
      setRecoveryData({
        privateKey: isMnemonicPhrase ? "" : cleanedSecret,
        mnemonic: isMnemonicPhrase ? cleanedSecret : ""
      })

      setShowPasteRecoveredData(true)
      toast.success("Secret successfully recovered!")
    } catch (error) {
      console.error("Error recovering secret:", error)
      let errorMessage = "Unknown error"
      
      if (error instanceof Error) {
        errorMessage = error.message
        // Make error messages more user-friendly
        if (errorMessage.includes("same byte length")) {
          errorMessage = "All slices must have the same length. Please check that you've entered complete slices."
        } else if (errorMessage.includes("at least 2 shares")) {
          errorMessage = "You need at least 2 slices to recover the secret."
        } else if (errorMessage.includes("invalid") || errorMessage.includes("Invalid")) {
          errorMessage = "Invalid slice data. Please check that your slices are correct and complete."
        }
      }
      
      toast.error(`Failed to recover secret: ${errorMessage}`)
      setRecoveryData(null)
      setShowPasteRecoveredData(false)
    }
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
                    Scan each key slice QR code one at a time. Continue until the minimum required slices are scanned.
                  </div>
                  
                  {isAttemptingRecovery && (
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-700 dark:border-blue-300 border-t-transparent"></div>
                        <span className="text-sm font-medium">Attempting recovery with {scannedSlices.length} slice{scannedSlices.length > 1 ? 's' : ''}...</span>
                      </div>
                    </div>
                  )}

                  {/* Progress indicators */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <div
                        key={step}
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                          scannedSlices.length >= step
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground text-muted-foreground"
                        }`}
                      >
                        {scannedSlices.length >= step ? <Check className="w-5 h-5" /> : step}
                      </div>
                    ))}
                  </div>

                  {/* Scanning area */}
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/30">
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-4 w-full">
                        <div 
                          id="qr-reader-scan-tab" 
                          ref={scannerContainerRef}
                          className="w-full max-w-md"
                          style={{ minHeight: '300px' }}
                        />
                        <p className="text-sm text-muted-foreground">
                          Scanning key slice {scannedSlices.length + 1}... Point camera at QR code
                        </p>
                        <Button 
                          onClick={async () => {
                            if (scannerRef.current) {
                              try {
                                await scannerRef.current.stop()
                              } catch (error) {
                                // Ignore stop errors
                              }
                            }
                            setIsScanning(false)
                          }} 
                          variant="outline"
                          className="bg-transparent"
                        >
                          Stop Scanning
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <Camera className="w-16 h-16 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground text-center">
                          {scannedSlices.length === 0
                            ? "Click the button below to scan your first key slice QR code"
                            : `${scannedSlices.length} slice${scannedSlices.length > 1 ? 's' : ''} scanned. Continue scanning until recovery succeeds.`}
                        </p>
                        <Button onClick={handleScanClick} className="bg-black hover:bg-black/90 text-white">
                          <Camera className="w-4 h-4 mr-2" />
                          Scan key slice {scannedSlices.length + 1}
                        </Button>
                        {scannedSlices.length > 0 && (
                          <Button 
                            onClick={handleResetScan} 
                            variant="outline"
                            className="bg-transparent"
                          >
                            Reset
                          </Button>
                        )}
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

