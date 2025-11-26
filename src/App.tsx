import Tabs from './components/Tabs'
import WhySlice from './components/WhySlice'
import CutSlices from './components/CutSlices'
import RestoreSlices from './components/RestoreSlices'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <img src="/images/shamir-logo.png" alt="Secret Coin Logo" className="logo" />
          <h1>Slice your bitcoin like pizza</h1>
        </div>
      </header>
      <main className="App-main">
        <Tabs
          tabs={[
            {
              id: 'why',
              label: "Why slice your private 🔑 ?",
              content: <WhySlice />
            },
            {
              id: 'cut',
              label: 'Cut private 🔑 into slices',
              content: <CutSlices />
            },
            {
              id: 'restore',
              label: 'Restore private 🔑 from slices',
              content: <RestoreSlices />
            }
          ]}
          defaultTab="why"
        />
      </main>
    </div>
  )
}

export default App

