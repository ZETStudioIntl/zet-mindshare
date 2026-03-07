import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChevronDown, ChevronUp, Plus, Sparkles, Send, Download, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const RightPanel = ({
  document: doc,
  currentPage,
  setCurrentPage,
  pageSize,
  zoom,
  onAddPage,
  onDeletePage,
  docId,
  wordCount,
  canvasContainerRef,
  forceSection,
  onExport,
  exporting,
}) => {
  const { t } = useLanguage();
  const [pagesOpen, setPagesOpen] = useState(true);
  const [zetaOpen, setZetaOpen] = useState(true);
  const showPages = forceSection ? forceSection === 'pages' : true;
  const showZeta = forceSection ? forceSection === 'zeta' : true;
  const [zetaMessages, setZetaMessages] = useState([]);
  const [zetaInput, setZetaInput] = useState('');
  const [zetaLoading, setZetaLoading] = useState(false);
  const [zetaSessionId, setZetaSessionId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [zetaMessages]);

  const sendZetaMessage = async () => {
    if (!zetaInput.trim() || zetaLoading) return;
    const msg = zetaInput;
    setZetaMessages(prev => [...prev, { role: 'user', content: msg }]);
    setZetaInput('');
    setZetaLoading(true);
    try {
      const res = await axios.post(`${API}/zeta/chat`, { message: msg, doc_id: docId, session_id: zetaSessionId }, { withCredentials: true });
      setZetaSessionId(res.data.session_id);
      setZetaMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch {
      setZetaMessages(prev => [...prev, { role: 'assistant', content: 'Error!' }]);
    }
    setZetaLoading(false);
  };

  const stats = { pageCount: doc?.pages?.length || 0, wordCount };

  return (
    <div data-testid="right-panel" className="w-72 border-l flex flex-col" style={{ borderColor: 'var(--zet-border)' }}>
      {/* Export Button */}
      {showPages && (
        <div className="p-2 border-b" style={{ borderColor: 'var(--zet-border)' }}>
          <button data-testid="export-pdf-btn" onClick={onExport} disabled={exporting} className="zet-btn w-full flex items-center justify-center gap-2 py-2 text-sm">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export PDF
          </button>
        </div>
      )}
      
      {/* Pages Section */}
      {showPages && (
      <div className="border-b" style={{ borderColor: 'var(--zet-border)' }}>
        <div className="p-2 flex items-center justify-between">
          <span className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>{t('allPages')}</span>
          <div className="flex gap-1">
            {pagesOpen && (
              <button data-testid="add-page-btn" onClick={onAddPage} className="p-1 hover:bg-white/10 rounded transition-colors">
                <Plus className="h-3 w-3" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            )}
            <button onClick={() => setPagesOpen(!pagesOpen)} className="p-1 hover:bg-white/10 rounded">
              {pagesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
        {pagesOpen && (
          <div className="px-2 pb-2">
            <div className="text-xs mb-1" style={{ color: 'var(--zet-text-muted)' }}>
              {stats.pageCount} {t('pages')} · {stats.wordCount} {t('words') || 'words'}
            </div>
            <div className="grid grid-cols-3 gap-1 max-h-28 overflow-y-auto">
              {doc.pages?.map((page, idx) => (
                <div key={page.page_id} className="relative group">
                  <div
                    data-testid={`page-thumb-${idx}`}
                    onClick={() => {
                      setCurrentPage(idx);
                      canvasContainerRef?.current?.scrollTo({
                        top: idx * ((page.pageSize?.height || pageSize.height) * zoom + 24),
                        behavior: 'smooth'
                      });
                    }}
                    className={`aspect-[3/4] rounded border-2 cursor-pointer overflow-hidden transition-colors ${currentPage === idx ? 'border-blue-500' : 'border-transparent hover:border-white/20'}`}
                    style={{ background: 'white' }}
                  >
                    <div className="w-full h-full relative" style={{ transform: 'scale(0.15)', transformOrigin: 'top left' }}>
                      {(page.elements || []).slice(0, 5).map(el => (
                        <div key={el.id} className="absolute" style={{ left: el.x, top: el.y, fontSize: el.fontSize || 12, color: el.color || '#000' }}>
                          {el.type === 'text' && (el.content || '').slice(0, 20)}
                        </div>
                      ))}
                    </div>
                  </div>
                  {doc.pages.length > 1 && (
                    <button
                      onClick={() => onDeletePage(idx)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* ZETA Section */}
      {showZeta && (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--zet-border)' }}>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" style={{ color: 'var(--zet-primary-light)' }} />
            <span className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>ZETA</span>
          </div>
          <button onClick={() => setZetaOpen(!zetaOpen)} className="p-1 hover:bg-white/10 rounded">
            {zetaOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
        {zetaOpen && (
          <>
            <div data-testid="zeta-messages" className="flex-1 p-2 overflow-y-auto text-xs" style={{ background: 'var(--zet-bg)' }}>
              {zetaMessages.length === 0 && (
                <div className="text-center py-6" style={{ color: 'var(--zet-text-muted)' }}>
                  <Sparkles className="h-5 w-5 mx-auto mb-2 opacity-50" />
                  <p>{t('askZetaAnything')}</p>
                </div>
              )}
              {zetaMessages.map((msg, i) => (
                <div key={i} className={`mb-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className="inline-block px-2.5 py-1.5 rounded-lg max-w-[90%]"
                    style={{
                      background: msg.role === 'user' ? 'var(--zet-primary)' : 'var(--zet-bg-card)',
                      color: 'var(--zet-text)',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {zetaLoading && (
                <div className="flex gap-1 py-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--zet-primary-light)', animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--zet-primary-light)', animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--zet-primary-light)', animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
              <div className="flex gap-1">
                <input
                  data-testid="zeta-input"
                  placeholder={t('askZeta')}
                  value={zetaInput}
                  onChange={e => setZetaInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendZetaMessage()}
                  className="zet-input flex-1 text-xs py-1.5"
                />
                <button data-testid="zeta-send-btn" onClick={sendZetaMessage} className="zet-btn px-2">
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
};
