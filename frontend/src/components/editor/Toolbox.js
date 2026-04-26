import React, { useState, useRef } from 'react';
import { Search, PanelLeftClose, PanelLeftOpen, Lock, Triangle, Square, Circle, Star, CircleDashed, Hexagon, Diamond, Pentagon, Heart, ArrowBigRight, Shapes } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const SHAPE_LIST = [
  { id: 'triangle', icon: Triangle, label: 'Üçgen' },
  { id: 'square', icon: Square, label: 'Kare' },
  { id: 'circle', icon: Circle, label: 'Daire' },
  { id: 'ring', icon: CircleDashed, label: 'Halka' },
  { id: 'star', icon: Star, label: 'Yıldız' },
  { id: 'hexagon', icon: Hexagon, label: 'Altıgen' },
  { id: 'diamond', icon: Diamond, label: 'Elmas' },
  { id: 'pentagon', icon: Pentagon, label: 'Beşgen' },
  { id: 'heart', icon: Heart, label: 'Kalp' },
  { id: 'arrow', icon: ArrowBigRight, label: 'Ok' },
  { id: 'parallelogram', icon: Shapes, label: 'Paralelkenar' },
];

const PUNCTUATION_LIST = [
  '.', ',', ';', ':', '!', '?', "'", '"', '`', '-',
  '—', '–', '…', '‘', '’', '“', '”',
  '(', ')', '[', ']', '{', '}', '/', '\\', '|',
  '@', '#', '$', '%', '&', '*', '+', '=', '<', '>',
  '~', '^', '©', '®', '™', '§', '¶', '°', '±', '×', '÷',
];

const SHAPE_TOOL_IDS = new Set(SHAPE_LIST.map(s => s.id));

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
  onInsertText,
}) => {
  const { t } = useLanguage();
  const [toolSearch, setToolSearch] = useState('');
  const [hoveredTool, setHoveredTool] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [shapesOpen, setShapesOpen] = useState(false);
  const [punctuationOpen, setPunctuationOpen] = useState(false);
  const containerRef = useRef(null);

  const filtered = tools.filter(tool =>
    t(tool.nameKey).toLowerCase().includes(toolSearch.toLowerCase()) ||
    tool.id.includes(toolSearch.toLowerCase())
  );

  const handleMouseMove = (e, toolId) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 30 });
    }
    setHoveredTool(toolId);
  };

  const handleToolClick = (tool) => {
    if (tool.id === 'shapes') {
      setShapesOpen(o => !o);
      setPunctuationOpen(false);
      onToolSelect(tool.id);
      return;
    }
    if (tool.id === 'punctuation') {
      setPunctuationOpen(o => !o);
      setShapesOpen(false);
      onToolSelect(tool.id);
      return;
    }
    setShapesOpen(false);
    setPunctuationOpen(false);
    if (lockedTools.includes(tool.id)) { onLockedClick?.(tool.id); return; }
    onToolSelect(tool.id);
  };

  const isShapeActive = SHAPE_TOOL_IDS.has(activeTool);

  return (
    <div
      ref={containerRef}
      data-testid="toolbox-panel"
      className="border-r flex flex-col transition-all duration-200 relative w-full h-full"
      style={{ borderColor: 'var(--zet-border)' }}
    >
      {/* Header */}
      <div className="p-1 flex items-center gap-1 border-b flex-shrink-0" style={{ borderColor: 'var(--zet-border)' }}>
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
        <button data-testid="toolbox-toggle" onClick={onToggle} className="tool-btn w-7 h-7 flex-shrink-0">
          {isOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </button>
      </div>

      {/* Tools Grid */}
      {isOpen && (
        <div className="p-1 flex-1 overflow-y-auto overflow-x-hidden" style={{ minHeight: 0 }}>
          <div className="grid grid-cols-3 gap-1">
            {filtered.map(tool => {
              const isLocked = lockedTools.includes(tool.id);
              const isShapeTool = tool.id === 'shapes';
              const isPunctTool = tool.id === 'punctuation';
              const isActive = isShapeTool ? isShapeActive || shapesOpen
                : isPunctTool ? punctuationOpen
                : activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  data-testid={`tool-${tool.id}`}
                  onClick={() => handleToolClick(tool)}
                  onMouseMove={(e) => handleMouseMove(e, tool.id)}
                  onMouseLeave={() => setHoveredTool(null)}
                  className={`tool-btn h-10 w-full relative ${isActive ? 'active' : ''} ${isLocked ? 'opacity-40' : ''}`}
                >
                  <tool.icon className="h-4 w-4" />
                  {isLocked && <Lock className="h-2.5 w-2.5 absolute top-0.5 right-0.5" style={{ color: '#f59e0b' }} />}
                </button>
              );
            })}
          </div>

          {/* Shapes Sub-Panel */}
          {shapesOpen && (
            <div className="mt-2 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--zet-border)', background: 'var(--zet-bg-card)' }}>
              <div className="px-2 py-1 text-[10px] font-semibold border-b flex items-center gap-1" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text-muted)' }}>
                <Shapes className="h-3 w-3" /> Şekiller
              </div>
              <div className="p-1 grid grid-cols-3 gap-1">
                {SHAPE_LIST.map(shape => (
                  <button
                    key={shape.id}
                    title={shape.label}
                    onClick={() => { onToolSelect(shape.id); setShapesOpen(false); }}
                    className={`tool-btn h-9 w-full flex flex-col items-center justify-center gap-0.5 ${activeTool === shape.id ? 'active' : ''}`}
                  >
                    <shape.icon className="h-4 w-4" />
                    <span className="text-[8px] leading-none" style={{ color: 'var(--zet-text-muted)' }}>{shape.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Punctuation Sub-Panel */}
          {punctuationOpen && (
            <div className="mt-2 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--zet-border)', background: 'var(--zet-bg-card)' }}>
              <div className="px-2 py-1 text-[10px] font-semibold border-b" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text-muted)' }}>
                Noktalama İşaretleri
              </div>
              <div className="p-1.5 flex flex-wrap gap-1">
                {PUNCTUATION_LIST.map((char, i) => (
                  <button
                    key={i}
                    title={char}
                    onClick={() => {
                      if (onInsertText) onInsertText(char);
                      else document.execCommand('insertText', false, char);
                    }}
                    className="tool-btn w-7 h-7 text-xs font-mono"
                    style={{ color: 'var(--zet-text)' }}
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          )}

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

      {/* Floating Tooltip */}
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
