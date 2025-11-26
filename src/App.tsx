import { useState, useRef } from "react"
import { MainInterface, type MainInterfaceHandle } from './components/main-interface'
import { Toaster } from "sonner"
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState("about")
  const mainInterfaceRef = useRef<MainInterfaceHandle>(null)

  const handleKeySliceFilesClick = () => {
    setActiveTab("about")
    // Could trigger tour widget here if needed
  }

  return (
    <div className="min-h-screen relative pb-24 md:pb-0 bg-muted">
      {/* Added repeating background pattern with transparency */}
      <div
        className="fixed inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'url("/images/bg-pattern.jpeg")',
          backgroundRepeat: "repeat",
          backgroundSize: "400px",
        }}
      />

      {/* Wrapped content in relative div to sit above background */}
      <div className="relative z-10">
        <header className="text-center px-4 pb-8 pt-12 space-y-0">
          <div className="relative w-48 h-32 mx-auto">
            <img
              src="/images/shamir-logo.png"
              alt="Secret Coin Logo"
              className="object-contain my-0 py-0 pb-2 w-full h-full"
            />
          </div>
          <h1 className="text-3xl md:text-4xl tracking-tight text-foreground font-normal font-serif text-balance">
            Slice your bitcoin like pizza{" "}
          </h1>
        </header>

        <main className="container max-w-3xl mx-auto px-4">
          <MainInterface
            ref={mainInterfaceRef}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onKeySliceFilesClick={handleKeySliceFilesClick}
          />
        </main>
      </div>

      <Toaster />
    </div>
  )
}

export default App
