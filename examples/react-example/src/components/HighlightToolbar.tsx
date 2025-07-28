import React, { useRef } from 'react';
import './HighlightToolbar.css';

interface HighlightToolbarProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  onCreateHighlight: () => void;
  onClearAll: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleManager: () => void;
  highlightCount: number;
  isEnabled: boolean;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: 'yellow', bg: '#ffff00' },
  { name: 'Green', value: 'green', bg: '#00ff00' },
  { name: 'Blue', value: 'blue', bg: '#00ffff' },
  { name: 'Pink', value: 'pink', bg: '#ffc0cb' },
  { name: 'Orange', value: 'orange', bg: '#ffa500' },
  { name: 'Purple', value: 'purple', bg: '#dda0dd' },
  { name: 'Red', value: 'red', bg: '#ff6b6b' },
  { name: 'Gray', value: 'gray', bg: '#d3d3d3' },
];

const HighlightToolbar: React.FC<HighlightToolbarProps> = ({
  selectedColor,
  onColorChange,
  onCreateHighlight,
  onClearAll,
  onExport,
  onImport,
  onToggleManager,
  highlightCount,
  isEnabled,
}) => {
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  return (
    <div className="highlight-toolbar">
      <div className="toolbar-section">
        <h4>🖍️ Highlighting Tools</h4>
        <span className="highlight-count">
          {highlightCount} highlight{highlightCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Color Picker */}
      <div className="toolbar-section color-picker-section">
        <label>Color:</label>
        <div className="color-picker">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.value}
              className={`color-button ${selectedColor === color.value ? 'selected' : ''}`}
              style={{ backgroundColor: color.bg }}
              onClick={() => onColorChange(color.value)}
              title={color.name}
              disabled={!isEnabled}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="toolbar-section action-buttons">
        <button
          onClick={onCreateHighlight}
          disabled={!isEnabled}
          className="create-highlight-button"
          title="Select text first, then click to create highlight"
        >
          ✨ Create Highlight
        </button>
        
        <button
          onClick={onToggleManager}
          disabled={!isEnabled}
          className="toggle-manager-button"
        >
          📝 Manage ({highlightCount})
        </button>

        <button
          onClick={onClearAll}
          disabled={!isEnabled || highlightCount === 0}
          className="clear-all-button"
        >
          🗑️ Clear All
        </button>
      </div>

      {/* Import/Export */}
      <div className="toolbar-section io-buttons">
        <button
          onClick={onExport}
          disabled={!isEnabled || highlightCount === 0}
          className="export-button"
        >
          💾 Export
        </button>
        
        <button
          onClick={handleImportClick}
          disabled={!isEnabled}
          className="import-button"
        >
          📂 Import
        </button>
        
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          onChange={onImport}
          style={{ display: 'none' }}
        />
      </div>

      {/* Instructions */}
      <div className="toolbar-section instructions">
        <small>
          💡 <strong>Tip:</strong> Select text with your mouse, then click "Create Highlight" 
          or enable auto-highlighting in settings.
        </small>
      </div>
    </div>
  );
};

export default HighlightToolbar;