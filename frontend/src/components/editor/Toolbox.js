import React, { useState } from 'react';
import { Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
}) => {
  const { t } = useLanguage();
  const [toolSearch, setToolSearch] = useState('');
  const [hoveredTool, setHoveredTool] = useState(null);

  const filtered = tools.filter(tool =>
    t(tool.nameKey).toLowerCase().includes(toolSearch.toLowerCase()) ||
    tool.id.includes(toolSearch.toLowerCase())
  );

  return (
    <div
      data-testid="toolbox-panel"
      className={`border-r flex flex-col transition-all duration-200 ${isOpen ? 'w-56' : 'w-10'}`}
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
            {filtered.map(tool => (
              <div
                key={tool.id}
                className="relative"
                onMouseEnter={() => setHoveredTool(tool.id)}
                onMouseLeave={() => setHoveredTool(null)}
              >
                <button
                  data-testid={`tool-${tool.id}`}
                  onClick={() => onToolSelect(tool.id)}
                  className={`tool-btn h-10 w-full ${activeTool === tool.id ? 'active' : ''}`}
                >
                  <tool.icon className="h-4 w-4" />
                </button>
                {/* Tooltip */}
                {hoveredTool === tool.id && (
                  <div
                    className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs whitespace-nowrap z-50 pointer-events-none animate-fadeIn"
                    style={{ background: 'var(--zet-bg-card)', color: 'var(--zet-text)', border: '1px solid var(--zet-border)' }}
                  >
                    {t(tool.nameKey)}
                  </div>
                )}
              </div>
            ))}
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
    </div>
  );
};
