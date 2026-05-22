import React from 'react';
import { DraggablePanel } from './DraggablePanel';
import { TEMPLATES } from '../../lib/editorConstants';

const CATEGORIES = ['Temel', 'İş', 'Kariyer', 'Hukuki', 'Eğitim', 'Kişisel', 'Pazarlama', 'Yaratıcı'];

const TemplatesPanel = ({ applyTemplate, isMobile, onClose }) => (
  <DraggablePanel title="Templates" onClose={onClose} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
    <div className="w-72 space-y-1 max-h-[60vh] overflow-y-auto">
      {CATEGORIES.map(cat => {
        const catTemplates = TEMPLATES.filter(t => t.category === cat);
        if (!catTemplates.length) return null;
        return (
          <div key={cat}>
            <p className="text-xs font-semibold px-2 pt-2 pb-1" style={{ color: 'var(--zet-text-muted)' }}>{cat}</p>
            {catTemplates.map(tpl => (
              <button key={tpl.id} onClick={() => applyTemplate(tpl.id)} className="w-full p-2.5 rounded text-left hover:bg-white/5 transition-colors flex items-center gap-3" style={{ background: 'var(--zet-bg)' }} data-testid={`template-${tpl.id}`}>
                <span className="text-lg flex-shrink-0">{tpl.icon}</span>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: 'var(--zet-text)' }}>{tpl.name}</div>
                </div>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  </DraggablePanel>
);

export default TemplatesPanel;
