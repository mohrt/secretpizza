import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface EntropyCollectorProps {
  open: boolean
  onClose: () => void
  onComplete: (entropy: Uint8Array) => void
  targetBits: number // 128 for 12 words, 256 for 24 words
}

export function EntropyCollector({ open, onClose, onComplete, targetBits }: EntropyCollectorProps) {
  const [entropyProgress, setEntropyProgress] = useState(0)
  const [isCollecting, setIsCollecting] = useState(false)
  const entropyBufferRef = useRef<number[]>([])
  const mouseEntropyRef = useRef<number[]>([])
  const touchEntropyRef = useRef<number[]>([])
  const keyboardEntropyRef = useRef<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Minimum entropy bits needed (we'll collect more than needed for safety)
  const minEntropyBytes = Math.ceil(targetBits / 8)
  // Require significant user interaction - collect 2048 bytes of user entropy
  const targetEntropyBytes = 2048
  const lastCollectTimeRef = useRef<number>(0)
  const throttleMs = 10 // Only collect entropy every 10ms to prevent too-fast collection

  const collectEntropy = useCallback((value: number) => {
    if (!isCollecting) return
    
    // Throttle collection to prevent too-fast completion
    const now = Date.now()
    if (now - lastCollectTimeRef.current < throttleMs) {
      return
    }
    lastCollectTimeRef.current = now
    
    // Add to buffer (use low-order bits for entropy)
    entropyBufferRef.current.push(value & 0xff)
    
    // Also collect timing entropy (only low bits to avoid too much data)
    const timestamp = now
    entropyBufferRef.current.push(timestamp & 0xff)
    
    const progress = Math.min(100, (entropyBufferRef.current.length / targetEntropyBytes) * 100)
    setEntropyProgress(progress)
    
    if (entropyBufferRef.current.length >= targetEntropyBytes) {
      finishCollection()
    }
  }, [isCollecting, targetEntropyBytes])

  const finishCollection = useCallback(() => {
    setIsCollecting(false)
    
    // Combine all entropy sources
    const allEntropy = [
      ...entropyBufferRef.current,
      ...mouseEntropyRef.current,
      ...touchEntropyRef.current,
      ...keyboardEntropyRef.current,
    ]
    
    // Convert to Uint8Array
    const entropyBytes = new Uint8Array(allEntropy.slice(0, targetEntropyBytes))
    
    // Mix with crypto PRNG for additional security
    const cryptoEntropy = new Uint8Array(targetEntropyBytes)
    crypto.getRandomValues(cryptoEntropy)
    
    // XOR user entropy with crypto entropy
    for (let i = 0; i < entropyBytes.length; i++) {
      entropyBytes[i] ^= cryptoEntropy[i]
    }
    
    onComplete(entropyBytes)
    reset()
  }, [targetEntropyBytes, onComplete])

  const reset = () => {
    entropyBufferRef.current = []
    mouseEntropyRef.current = []
    touchEntropyRef.current = []
    keyboardEntropyRef.current = []
    lastCollectTimeRef.current = 0
    setEntropyProgress(0)
    setIsCollecting(false)
  }

  const handleStart = () => {
    reset()
    setIsCollecting(true)
  }

  // Mouse movement handler (only on window, not on div to avoid double collection)
  useEffect(() => {
    if (!open || !isCollecting) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isCollecting) return
      
      // Collect mouse position entropy
      const x = e.clientX & 0xff
      const y = e.clientY & 0xff
      mouseEntropyRef.current.push(x)
      mouseEntropyRef.current.push(y)
      
      // Collect from movement delta (more entropy from movement than position)
      collectEntropy(e.movementX)
      collectEntropy(e.movementY)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [open, isCollecting, collectEntropy])

  // Touch movement handler (mobile)
  useEffect(() => {
    if (!open || !isCollecting) return

    const handleTouchMove = (e: TouchEvent) => {
      if (!isCollecting) return
      
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i]
        const x = touch.clientX & 0xff
        const y = touch.clientY & 0xff
        touchEntropyRef.current.push(x)
        touchEntropyRef.current.push(y)
        
        collectEntropy(touch.clientX)
        collectEntropy(touch.clientY)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("touchmove", handleTouchMove, { passive: true })
      return () => container.removeEventListener("touchmove", handleTouchMove)
    }
  }, [open, isCollecting, collectEntropy])

  // Keyboard input handler
  useEffect(() => {
    if (!open || !isCollecting) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isCollecting) return
      
      // Collect key code and timing
      keyboardEntropyRef.current.push(e.keyCode & 0xff)
      collectEntropy(e.keyCode)
    }

    window.addEventListener("keypress", handleKeyPress)
    return () => window.removeEventListener("keypress", handleKeyPress)
  }, [open, isCollecting, collectEntropy])

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open])

  const canFinish = entropyProgress >= 100

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Collect Entropy</DialogTitle>
          <DialogDescription>
            Move your mouse, type on your keyboard, or slide your finger to add randomness to your seed phrase.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div
            ref={containerRef}
            className={cn(
              "w-full h-48 border-2 rounded-lg flex items-center justify-center transition-colors",
              isCollecting
                ? "border-primary bg-primary/5 cursor-crosshair"
                : "border-border bg-muted/30"
            )}
            // Mouse move on div is handled by window listener to avoid double collection
          >
            {!isCollecting ? (
              <p className="text-muted-foreground text-center px-4">
                Click "Start Collecting" and move your mouse, type, or slide your finger here
              </p>
            ) : (
              <p className="text-primary font-semibold text-center px-4">
                Keep moving your mouse, typing, or sliding your finger...
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Entropy collected</span>
              <span>{Math.round(entropyProgress)}%</span>
            </div>
            <Progress value={entropyProgress} className="h-2" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isCollecting ? "Cancel Collection" : "Cancel"}
          </Button>
          {!isCollecting ? (
            <Button onClick={handleStart}>Start Collecting</Button>
          ) : (
            <Button onClick={finishCollection} disabled={!canFinish}>
              {canFinish ? "Use This Entropy" : "Collecting..."}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

