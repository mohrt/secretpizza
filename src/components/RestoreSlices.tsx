import { useState } from 'react'
import { reconstructSecret } from '../utils/shamir'
import './RestoreSlices.css'

export default function RestoreSlices() {
  const [shareFiles, setShareFiles] = useState<File[]>([])
  const [shareTexts, setShareTexts] = useState<string[]>([])
  const [restoredMessage, setRestoredMessage] = useState('')
  const [isRestoring, setIsRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setShareFiles(files)
    
    // Read file contents
    Promise.all(
      files.map(file => 
        file.text().then(text => text.trim())
      )
    ).then(texts => {
      setShareTexts(texts)
    }).catch(err => {
      console.error('Error reading files:', err)
      setError('Error reading files')
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    setShareFiles(files)
    
    Promise.all(
      files.map(file => 
        file.text().then(text => text.trim())
      )
    ).then(texts => {
      setShareTexts(texts)
    }).catch(err => {
      console.error('Error reading files:', err)
      setError('Error reading files')
    })
  }

  const handleRestore = async () => {
    if (shareTexts.length < 2) {
      setError('Please upload at least 2 slice files')
      return
    }

    setIsRestoring(true)
    setError(null)
    
    try {
      const restored = await reconstructSecret(shareTexts)
      setRestoredMessage(restored)
    } catch (err) {
      console.error('Error restoring secret:', err)
      setError('Failed to restore secret. Make sure you have enough valid slices.')
      setRestoredMessage('')
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="restore-slices">
      <div className="restore-header">
        <h2>Restore message</h2>
        <p>Combine your 🔑🍕 (key slice) files to reveal the original message.</p>
      </div>

      <div className="restore-content">
        <div className="info-box">
          <p>Ensure you provide at least the minimum number of slices required (e.g., 2 of 3).</p>
        </div>

        <div className="upload-section">
          <div className="upload-area">
            <div className="upload-header">
              <label>Upload 🍕🔑 slices</label>
              <button className="upload-icon-button" onClick={() => document.getElementById('file-input')?.click()}>
                📁
              </button>
            </div>
            <div
              className="drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="drop-zone-content">
                <button
                  className="upload-button"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  Upload files
                </button>
                <p>or drag and drop</p>
              </div>
              <input
                id="file-input"
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
            {shareFiles.length > 0 && (
              <div className="uploaded-files">
                <p>{shareFiles.length} file(s) uploaded</p>
                <ul>
                  {shareFiles.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            className="restore-button"
            onClick={handleRestore}
            disabled={isRestoring || shareTexts.length < 2}
          >
            {isRestoring ? 'Restoring...' : 'Restore'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="restored-message-section">
          <label>Restored Message</label>
          <textarea
            value={restoredMessage}
            readOnly
            placeholder="Your restored message will appear here..."
            rows={6}
            className="restored-message-input"
          />
        </div>
      </div>
    </div>
  )
}


