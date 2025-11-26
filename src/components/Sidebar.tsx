import './Sidebar.css'

interface ActionCard {
  id: string
  title: string
  icon: string
  onClick?: () => void
}

export default function Sidebar() {
  const actionCards: ActionCard[] = [
    {
      id: 'how-to-use',
      title: 'How to use this app',
      icon: '📖',
      onClick: () => {
        // Scroll to top or show help
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },
    {
      id: 'create-slices',
      title: 'Create pizza slices',
      icon: '🍕',
      onClick: () => {
        // Could switch to cut tab
        const cutTab = document.getElementById('tab-cut')
        cutTab?.click()
      }
    },
    {
      id: 'total-slices',
      title: 'Total slices & required slices',
      icon: '🔢',
      onClick: () => {
        const cutTab = document.getElementById('tab-cut')
        cutTab?.click()
        // Scroll to presets
        setTimeout(() => {
          document.querySelector('.presets-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    },
    {
      id: 'generate-dice',
      title: 'Generate with Dice',
      icon: '🎲',
      onClick: () => {
        // Future feature
        alert('Dice generation coming soon!')
      }
    },
    {
      id: 'quick-presets',
      title: 'Quick Presets',
      icon: '⚡',
      onClick: () => {
        const cutTab = document.getElementById('tab-cut')
        cutTab?.click()
        setTimeout(() => {
          document.querySelector('.presets-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    },
    {
      id: 'restore-slices',
      title: 'Restore pizza from slices',
      icon: '🔓',
      onClick: () => {
        const restoreTab = document.getElementById('tab-restore')
        restoreTab?.click()
      }
    },
    {
      id: 'explain-upload',
      title: 'Explain uploading slices',
      icon: '📤',
      onClick: () => {
        const restoreTab = document.getElementById('tab-restore')
        restoreTab?.click()
        setTimeout(() => {
          document.querySelector('.upload-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    },
    {
      id: 'why-use',
      title: 'Why use this app?',
      icon: '❓',
      onClick: () => {
        const whyTab = document.getElementById('tab-why')
        whyTab?.click()
      }
    }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        {actionCards.map((card) => (
          <button
            key={card.id}
            className="action-card"
            onClick={card.onClick}
          >
            <span className="action-icon">{card.icon}</span>
            <div className="action-text">
              <div className="action-title">{card.title}</div>
            </div>
            <span className="action-arrow">→</span>
          </button>
        ))}
      </div>
    </aside>
  )
}


