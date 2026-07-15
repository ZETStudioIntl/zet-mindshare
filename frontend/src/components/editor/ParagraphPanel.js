import React, { useContext } from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';

const ALIGN_BTNS = [
  { id: 'left',    Icon: AlignLeft },
  { id: 'center',  Icon: AlignCenter },
  { id: 'right',   Icon: AlignRight },
  { id: 'justify', Icon: AlignJustify },
];

const INDENT_PRESETS  = [0, 24, 36, 48];
const SPACING_PRESETS = [0, 6, 12, 18];

const HEADING_PRESETS = [
  { label: 'H1', size: 32, bold: true },
  { label: 'H2', size: 24, bold: true },
  { label: 'H3', size: 18, bold: true },
  { label: 'Normal', size: 12, bold: false },
];

export default function ParagraphPanel() {
  const {
    isMobile,
    showParagraph, setShowParagraph,
    applyHeadingStyle, applyTextAlign, currentTextAlign,
    firstLineIndent, setFirstLineIndent,
    paragraphSpaceBefore, setParagraphSpaceBefore,
    paragraphSpaceAfter, setParagraphSpaceAfter,
    selectedElement, lastSelectedRef, setCanvasElements, handleSaveHistory,
  } = useContext(EditorStateContext);

  if (!showParagraph) return null;

  const applyToSelected = (patch) => {
    const id = selectedElement || lastSelectedRef?.current;
    if (!id) return;
    setCanvasElements(prev => {
      const u = prev.map(el => el.id === id ? { ...el, ...patch } : el);
      handleSaveHistory(u);
      return u;
    });
  };

  const handleIndent = (val) => {
    setFirstLineIndent(val);
    applyToSelected({ textIndent: val });
  };

  const handleSpaceBefore = (val) => {
    setParagraphSpaceBefore(val);
    applyToSelected({ paragraphSpaceBefore: val });
  };

  const handleSpaceAfter = (val) => {
    setParagraphSpaceAfter(val);
    applyToSelected({ paragraphSpaceAfter: val });
  };

  const handleSpaceBoth = (val) => {
    setParagraphSpaceBefore(val);
    setParagraphSpaceAfter(val);
    applyToSelected({ paragraphSpaceBefore: val, paragraphSpaceAfter: val });
  };

  return (
    <DraggablePanel
      title="Paragraf"
      onClose={() => setShowParagraph(false)}
      initialPosition={{ x: isMobile ? 20 : 300, y: 100 }}
    >
      <div className="space-y-3 w-56">

        {/* Heading styles */}
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--zet-text-muted)' }}>Başlık Stili</p>
          <div className="grid grid-cols-4 gap-1.5">
            {HEADING_PRESETS.map(({ label, size, bold }) => (
              <button
                key={label}
                onClick={() => applyHeadingStyle(size, bold)}
                className="p-2 rounded text-sm transition-colors hover:bg-white/10"
                style={{
                  background: 'var(--zet-bg)',
                  color: 'var(--zet-text)',
                  border: '1px solid var(--zet-border)',
                  fontWeight: bold ? 'bold' : 'normal',
                  fontSize: label === 'Normal' ? 10 : undefined,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Alignment */}
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--zet-text-muted)' }}>Hizalama</p>
          <div className="grid grid-cols-4 gap-2">
            {ALIGN_BTNS.map(({ id, Icon }) => (
              <button
                key={id}
                onClick={() => applyTextAlign(id)}
                className={`p-2.5 rounded flex items-center justify-center ${currentTextAlign === id ? 'glow-sm' : 'hover:bg-white/5'}`}
                style={{ background: currentTextAlign === id ? 'var(--zet-primary)' : 'var(--zet-bg)' }}
              >
                <Icon className="h-4 w-4" style={{ color: 'var(--zet-text)' }} />
              </button>
            ))}
          </div>
        </div>

        {/* First-line indent */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--zet-text-muted)' }}>İlk Satır Girintisi</p>
          <div className="flex items-center gap-2">
            <input
              type="range" min="0" max="120" value={firstLineIndent}
              onChange={e => handleIndent(Number(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <span className="text-xs w-10 text-right" style={{ color: 'var(--zet-text)' }}>{firstLineIndent}px</span>
          </div>
          <div className="flex gap-1 mt-1">
            {INDENT_PRESETS.map(v => (
              <button
                key={v}
                onClick={() => handleIndent(v)}
                className="flex-1 text-xs py-0.5 rounded"
                style={{
                  background: firstLineIndent === v ? 'var(--zet-primary)' : 'var(--zet-bg)',
                  color: 'var(--zet-text)',
                  border: '1px solid var(--zet-border)',
                }}
              >
                {v === 0 ? 'Yok' : `${v}px`}
              </button>
            ))}
          </div>
        </div>

        {/* Paragraph spacing */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--zet-text-muted)' }}>Paragraf Aralığı</p>
          <div className="space-y-2">
            <div>
              <label className="text-xs flex justify-between mb-1" style={{ color: 'var(--zet-text-muted)' }}>
                <span>Önce</span><span>{paragraphSpaceBefore}px</span>
              </label>
              <input
                type="range" min="0" max="80" value={paragraphSpaceBefore}
                onChange={e => handleSpaceBefore(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
            <div>
              <label className="text-xs flex justify-between mb-1" style={{ color: 'var(--zet-text-muted)' }}>
                <span>Sonra</span><span>{paragraphSpaceAfter}px</span>
              </label>
              <input
                type="range" min="0" max="80" value={paragraphSpaceAfter}
                onChange={e => handleSpaceAfter(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
            <div className="flex gap-1">
              {SPACING_PRESETS.map(v => (
                <button
                  key={v}
                  onClick={() => handleSpaceBoth(v)}
                  className="flex-1 text-xs py-0.5 rounded"
                  style={{
                    background: 'var(--zet-bg)',
                    color: 'var(--zet-text)',
                    border: '1px solid var(--zet-border)',
                  }}
                >
                  {v === 0 ? 'Yok' : `${v}px`}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </DraggablePanel>
  );
}
