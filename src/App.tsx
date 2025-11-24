import WalletGenerator from './components/WalletGenerator'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Secret Pizza</h1>
        <p className="subtitle">BSV Cold Storage Wallet Generator</p>
      </header>
      <main>
        <WalletGenerator />
      </main>
      <footer className="App-footer">
        <p>
          <strong>Security Notice:</strong> All wallet operations happen in your browser. 
          Your private keys never leave your device.
        </p>
      </footer>
    </div>
  )
}

export default App

