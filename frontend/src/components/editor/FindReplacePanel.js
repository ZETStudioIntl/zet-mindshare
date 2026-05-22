import React from 'react';
import { Search } from 'lucide-react';
import { DraggablePanel } from './DraggablePanel';

const FindReplacePanel = ({ findScope, setFindScope, findText, setFindText, replaceText, setReplaceText, findResults, setSelectedElement, findInDocument, replaceInDocument, isMobile, onClose }) => (
  <DraggablePanel title="Find & Replace" onClose={onClose} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
    <div className="w-64 space-y-3">
      <div className="flex rounded overflow-hidden border" style={{ borderColor: 'var(--zet-border)' }}>
        <button onClick={() => setFindScope('current')} className="flex-1 py-1 text-xs transition-colors" style={{ background: findScope === 'current' ? 'var(--zet-primary)' : 'var(--zet-bg)', color: findScope === 'current' ? '#fff' : 'var(--zet-text-muted)' }}>Bu sayfa</button>
        <button onClick={() => setFindScope('all')} className="flex-1 py-1 text-xs transition-colors" style={{ background: findScope === 'all' ? 'var(--zet-primary)' : 'var(--zet-bg)', color: findScope === 'all' ? '#fff' : 'var(--zet-text-muted)' }}>Tüm sayfalar</button>
      </div>
      <div className="flex gap-2">
        <input data-testid="find-input" type="text" value={findText} onChange={e => setFindText(e.target.value)} onKeyDown={e => e.key === 'Enter' && findInDocument()} placeholder="Find" className="zet-input text-xs flex-1" />
        <button data-testid="find-btn" onClick={findInDocument} className="zet-btn px-2"><Search className="h-3 w-3" /></button>
      </div>
      <input data-testid="replace-input" type="text" value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Replace with" className="zet-input text-xs w-full" />
      <button data-testid="replace-all-btn" onClick={replaceInDocument} disabled={!findText.trim()} className="zet-btn w-full text-xs">Replace All</button>
      {findResults.length > 0 && (
        <div className="space-y-1">
          <div data-testid="find-results-count" className="text-xs font-medium" style={{ color: '#22c55e' }}>Found {findResults.length} match{findResults.length > 1 ? 'es' : ''}</div>
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {findResults.map((r, i) => (
              <div key={i} data-testid={`find-result-${i}`} onClick={() => setSelectedElement(r.id)} className="text-xs p-1.5 rounded cursor-pointer truncate hover:bg-white/10" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)' }}>
                {r.content.slice(0, 40)}{r.content.length > 40 ? '...' : ''}
              </div>
            ))}
          </div>
        </div>
      )}
      {findResults.length === 0 && findText.trim() && (
        <div className="text-xs text-center" style={{ color: 'var(--zet-text-muted)' }}>No matches found</div>
      )}
    </div>
  </DraggablePanel>
);

export default FindReplacePanel;
