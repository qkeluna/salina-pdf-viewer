import React, { useRef, useState, useCallback } from 'react'
import './HighlightLayer.css'

interface Highlight {
  id: string
  text: string
  color: string
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  pageNumber: number
}

interface HighlightLayerProps {
  pageNumber: number
  highlights: Highlight[]
  scale: number
  onRemoveHighlight?: (id: string) => void
}

interface ContextMenu {
  visible: boolean
  x: number
  y: number
  highlightId: string
  text: string
}

const HighlightLayer: React.FC<HighlightLayerProps> = ({
  pageNumber,
  highlights,
  scale,
  onRemoveHighlight
}) => {
  const layerRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    highlightId: '',
    text: ''
  })
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null)

  // Copy text to clipboard
  const copyToClipboard = useCallback(async (text: string, highlightId?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      console.log('Text copied to clipboard:', text)
      
      // Show visual feedback
      const targetHighlightId = highlightId || selectedHighlight
      if (targetHighlightId) {
        const highlightElement = document.querySelector(`[data-highlight-id="${targetHighlightId}"]`)
        if (highlightElement) {
          highlightElement.classList.add('copied')
          setTimeout(() => {
            highlightElement.classList.remove('copied')
          }, 500)
        }
      }
      
      // Show success notification
      alert('Text copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy text: ', err)
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (successful) {
          alert('Text copied to clipboard!')
        } else {
          alert('Failed to copy text. Please try selecting and copying manually.')
        }
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
        alert('Copy not supported. Please select text manually and use Ctrl+C.')
      }
    }
  }, [selectedHighlight])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle shortcuts when a highlight is selected
    if (selectedHighlight) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        const highlight = highlights.find(h => h.id === selectedHighlight)
        if (highlight) {
          e.preventDefault()
          e.stopPropagation()
          copyToClipboard(highlight.text, selectedHighlight)
        }
      }
    }
    
    if (e.key === 'Escape') {
      setContextMenu(prev => ({ ...prev, visible: false }))
      setSelectedHighlight(null)
    }
  }, [selectedHighlight, highlights, copyToClipboard])

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, highlight: Highlight) => {
    e.preventDefault()
    e.stopPropagation()
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      highlightId: highlight.id,
      text: highlight.text
    })
    setSelectedHighlight(highlight.id)
  }, [])

  // Hide context menu when clicking outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.highlight-context-menu')) {
      setContextMenu(prev => ({ ...prev, visible: false }))
      if (!target.closest('.highlight')) {
        setSelectedHighlight(null)
      }
    }
  }, [])

  // Setup event listeners
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClickOutside)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [handleKeyDown, handleClickOutside])

  const pageHighlights = highlights.filter(h => h.pageNumber === pageNumber)

  return (
    <div
      ref={layerRef}
      className="highlight-layer"
    >
      {pageHighlights.map((highlight) => (
        <div
          key={highlight.id}
          className={`highlight ${selectedHighlight === highlight.id ? 'selected' : ''}`}
          style={{
            position: 'absolute',
            left: `${highlight.position.x * scale}px`,
            top: `${highlight.position.y * scale}px`,
            width: `${highlight.position.width * scale}px`,
            height: `${highlight.position.height * scale}px`,
            backgroundColor: highlight.color,
            opacity: selectedHighlight === highlight.id ? 0.7 : 0.4,
            borderRadius: '2px',
            pointerEvents: 'auto',
            cursor: 'pointer',
            zIndex: 11,
            mixBlendMode: 'multiply',
            transition: 'all 0.2s ease',
            border: selectedHighlight === highlight.id ? '2px solid rgba(0, 123, 255, 0.8)' : 'none',
            boxShadow: selectedHighlight === highlight.id ? '0 0 6px rgba(0, 123, 255, 0.6)' : 'none'
          }}
          title={`${highlight.text} (Right-click or Cmd+C to copy)`}
          tabIndex={0}
          data-highlight-id={highlight.id}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedHighlight(highlight.id)
            setContextMenu(prev => ({ ...prev, visible: false }))
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            if (onRemoveHighlight) {
              onRemoveHighlight(highlight.id)
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, highlight)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              copyToClipboard(highlight.text, highlight.id)
            }
          }}
          onMouseEnter={(e) => {
            if (selectedHighlight !== highlight.id) {
              e.currentTarget.style.opacity = '0.6'
              e.currentTarget.style.transform = 'scale(1.01)'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedHighlight !== highlight.id) {
              e.currentTarget.style.opacity = '0.4'
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        />
      ))}
      
      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="highlight-context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            copyToClipboard(contextMenu.text, contextMenu.highlightId)
            setContextMenu(prev => ({ ...prev, visible: false }))
          }}>
            📋 Copy Text
          </div>
          {onRemoveHighlight && (
            <div className="context-menu-item" onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemoveHighlight(contextMenu.highlightId)
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}>
              🗑️ Remove Highlight
            </div>
          )}
          <div className="context-menu-separator"></div>
          <div className="context-menu-info">
            Cmd+C / Ctrl+C to copy
          </div>
        </div>
      )}
    </div>
  )
}

export default HighlightLayer 