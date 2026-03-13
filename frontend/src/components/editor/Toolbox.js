import React, { useState, useRef } from 'react';
import { Search, PanelLeftClose, PanelLeftOpen, Lock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const Toolbox = ({
  tools,
  activeTool,
  onToolSelect,
  onDeleteSelected,
  hasSelection,
  zoom,
  isOpen,
  onToggle,
  lockedTools = [],
  onLockedClick,
}) => {
  const { t } = useLanguage();
  const [toolSearch, setToolSearch] = useState('');
  const [hoveredTool, setHoveredTool] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const filtered = tools.filter(tool =>
    t(tool.nameKey).toLowerCase().includes(toolSearch.toLowerCase()) ||
    tool.id.includes(toolSearch.toLowerCase())
  );

  const handleMouseMove = (e, toolId) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 30
      });
    }
    setHoveredTool(toolId);
  };

  return (
    <div
      ref={containerRef}
      data-testid="toolbox-panel"
      className={`border-r flex flex-col transition-all duration-200 relative ${isOpen ? 'w-72' : 'w-10'}`}
      style={{ borderColor: 'var(--zet-border)' }}
    >
      {/* Header */}
      <div className="p-1 flex items-center gap-1 border-b" style={{ borderColor: 'var(--zet-border)' }}>
        {isOpen && (
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'var(--zet-text-muted)' }} />
            <input
              data-testid="toolbox-search"
              placeholder={t('search')}
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              className="zet-input pl-7 text-xs py-1 w-full"
            />
          </div>
        )}
        <button
          data-testid="toolbox-toggle"
          onClick={onToggle}
          className="tool-btn w-7 h-7 flex-shrink-0"
        >
          {isOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </button>
      </div>

      {/* Tools Grid */}
      {isOpen && (
        <div className="p-1 flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-1">
            {filtered.map(tool => {
              const isLocked = lockedTools.includes(tool.id);
              return (
                <button
                  key={tool.id}
                  data-testid={`tool-${tool.id}`}
                  onClick={() => isLocked ? onLockedClick?.(tool.id) : onToolSelect(tool.id)}
                  onMouseMove={(e) => handleMouseMove(e, tool.id)}
                  onMouseLeave={() => setHoveredTool(null)}
                  className={`tool-btn h-10 w-full relative ${activeTool === tool.id ? 'active' : ''} ${isLocked ? 'opacity-40' : ''}`}
                >
                  <tool.icon className="h-4 w-4" />
                  {isLocked && <Lock className="h-2.5 w-2.5 absolute top-0.5 right-0.5" style={{ color: '#f59e0b' }} />}
                </button>
              );
            })}
          </div>

          {/* Zoom info */}
          <div className="mt-2 pt-2 border-t text-center text-xs" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text-muted)' }}>
            Zoom: {Math.round(zoom * 100)}%
          </div>

          {/* Delete button */}
          {hasSelection && (
            <button
              data-testid="delete-selected-btn"
              onClick={onDeleteSelected}
              className="w-full mt-2 py-1.5 rounded bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors"
            >
              {t('delete')}
            </button>
          )}
        </div>
      )}

      {/* Floating Tooltip above cursor */}
      {hoveredTool && (
        <div
          className="fixed px-2 py-1 rounded text-xs whitespace-nowrap z-[9999] pointer-events-none animate-fadeIn shadow-lg"
          style={{ 
            left: tooltipPos.x + (containerRef.current?.getBoundingClientRect().left || 0) - 40,
            top: tooltipPos.y + (containerRef.current?.getBoundingClientRect().top || 0) - 10,
            background: 'var(--zet-bg-card)', 
            color: 'var(--zet-text)', 
            border: '1px solid var(--zet-border)',
            transform: 'translateX(-50%)'
          }}
        >
          {t(tools.find(t => t.id === hoveredTool)?.nameKey || '')}
          {lockedTools.includes(hoveredTool) && <span className="ml-1" style={{ color: '#f59e0b' }}>(Kilitli)</span>}
          {tools.find(t => t.id === hoveredTool)?.shortcut && (
            <span className="ml-2 opacity-60">({tools.find(t => t.id === hoveredTool)?.shortcut})</span>
          )}
        </div>
      )}
    </div>
  );
};
