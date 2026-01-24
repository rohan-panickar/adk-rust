import { useTheme } from '../../hooks/useTheme';
import { useLayout } from '../../hooks/useLayout';
import { useViewport } from '@xyflow/react';

interface CanvasToolbarProps {
  onAutoLayout: () => void;
  onFitView: () => void;
  /** v2.0: Data flow overlay toggle */
  showDataFlowOverlay?: boolean;
  onToggleDataFlowOverlay?: () => void;
}

export function CanvasToolbar({ onAutoLayout, onFitView, showDataFlowOverlay, onToggleDataFlowOverlay }: CanvasToolbarProps) {
  const { 
    layoutMode, 
    layoutDirection, 
    toggleMode, 
    toggleDirection,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
  } = useLayout();
  const viewport = useViewport();
  const zoomPercent = Math.round(viewport.zoom * 100);
  
  const mode = useTheme(s => s.mode);
  const isLight = mode === 'light';
  const isHorizontal = layoutDirection === 'LR';
  const isFixedMode = layoutMode === 'fixed';
  
  const buttonClass = isLight
    ? 'bg-white hover:bg-gray-100 border-gray-300 text-gray-700'
    : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-200';
  
  const activeButtonClass = isLight
    ? 'bg-teal-100 hover:bg-teal-200 border-teal-500 text-teal-700'
    : 'bg-teal-900 hover:bg-teal-800 border-teal-500 text-teal-200';
  
  // Grid size options
  const gridSizeOptions = [10, 20, 40];
  
  return (
    <div className="absolute top-2 left-2 z-10 flex gap-2">
      {/* Layout Mode Toggle */}
      <button
        onClick={toggleMode}
        className={`px-3 py-1.5 border rounded text-sm flex items-center gap-2 ${isFixedMode ? activeButtonClass : buttonClass}`}
        title={`Layout Mode: ${isFixedMode ? 'Fixed (auto-arranged)' : 'Free (manual positioning)'}\nClick to switch to ${isFixedMode ? 'Free' : 'Fixed'} mode`}
      >
        <span>{isFixedMode ? '📐' : '✋'}</span>
        {isFixedMode ? 'Fixed' : 'Free'}
      </button>
      
      {/* Layout Direction Toggle */}
      <button
        onClick={toggleDirection}
        className={`px-3 py-1.5 border rounded text-sm flex items-center gap-2 ${buttonClass}`}
        title={`Layout Direction: ${isHorizontal ? 'Horizontal (Left to Right)' : 'Vertical (Top to Bottom)'}\nClick to switch to ${isHorizontal ? 'Vertical' : 'Horizontal'} layout`}
      >
        <span>{isHorizontal ? '↔' : '↕'}</span>
        {isHorizontal ? 'LR' : 'TB'}
      </button>
      
      {/* Snap to Grid Toggle */}
      <button
        onClick={() => setSnapToGrid(!snapToGrid)}
        className={`px-3 py-1.5 border rounded text-sm flex items-center gap-2 ${snapToGrid ? activeButtonClass : buttonClass}`}
        title={`Snap to Grid: ${snapToGrid ? 'On' : 'Off'} (${gridSize}px)\nClick to ${snapToGrid ? 'disable' : 'enable'} grid snapping`}
      >
        <span>{snapToGrid ? '⊞' : '⊟'}</span>
        Snap
      </button>
      
      {/* Grid Size Selector (only shown when snap is enabled) */}
      {snapToGrid && (
        <select
          value={gridSize}
          onChange={(e) => setGridSize(Number(e.target.value))}
          className={`px-2 py-1.5 border rounded text-sm ${buttonClass}`}
          title="Grid size in pixels"
        >
          {gridSizeOptions.map(size => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>
      )}
      
      {/* Auto Layout Button */}
      <button
        onClick={onAutoLayout}
        className={`px-3 py-1.5 border rounded text-sm flex items-center gap-2 ${buttonClass}`}
        title="Apply auto-layout to arrange nodes (Ctrl+L)"
      >
        <span>⊞</span> Layout
      </button>
      
      {/* Data Flow Overlay Toggle (v2.0) */}
      {/* @see Requirements 3.4: Toggle to show/hide data flow overlays */}
      {onToggleDataFlowOverlay && (
        <button
          onClick={onToggleDataFlowOverlay}
          className={`px-3 py-1.5 border rounded text-sm flex items-center gap-2 ${showDataFlowOverlay ? activeButtonClass : buttonClass}`}
          title={`Data Flow Overlay: ${showDataFlowOverlay ? 'On' : 'Off'}\nShows state keys flowing between nodes during execution`}
        >
          <span>🔀</span>
          {showDataFlowOverlay ? 'Flow On' : 'Flow Off'}
        </button>
      )}
      
      {/* Fit to View Button */}
      <button
        onClick={onFitView}
        className={`px-3 py-1.5 border rounded text-sm flex items-center gap-2 ${buttonClass}`}
        title="Fit all nodes in view (Ctrl+0)"
      >
        <span>⊡</span> Fit
      </button>
      
      {/* Zoom Level Display */}
      <div
        className={`px-3 py-1.5 border rounded text-sm flex items-center gap-1 ${buttonClass} cursor-default`}
        title="Current zoom level"
      >
        <span>🔍</span>
        {zoomPercent}%
      </div>
    </div>
  );
}
