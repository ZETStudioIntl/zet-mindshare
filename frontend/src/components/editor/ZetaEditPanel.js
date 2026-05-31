import React, { useContext, useRef, useState } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';

const ZetaEditPanel = () => {
  const {
    zetaEditMode, setZetaEditMode,
    zetaEditInput, setZetaEditInput,
    zetaEditLoading,
    zetaEditExplanation,
    zetaPendingCount,
    applyZetaDocEdit,
    approveZetaOps,
    rejectZetaOps,
  } = useContext(EditorStateContext);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachedDoc, setAttachedDoc] = useState(null);

  if (!zetaEditMode) return null;

  const handleSend = () => {
    if (!zetaEditInput.trim() || zetaEditLoading) return;
    const prompt = attachedDoc
      ? `Ekteki belge içeriği:\n"""\n${attachedDoc.content}\n"""\n\n${zetaEditInput.trim()}`
      : zetaEditInput.trim();
    applyZetaDocEdit(prompt);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAttachedDoc({ name: file.name, content: ev.target.result });
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  return (
    <div style={{
      position: 'fixed', right: 0, top: 48, bottom: 0, width: 320, zIndex: 50,
      background: 'linear-gradient(160deg, #0d0f2a 0%, #111640 100%)',
      borderLeft: '1px solid rgba(76,168,173,0.25)',
      boxShadow: '-4px 0 24px rgba(41,47,145,0.35)',
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo-mindshare.svg" alt="Zeta" style={{ width: 20, height: 20 }} />
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Zeta Edit</span>
          <span style={{
            fontSize: 10, color: '#4ca8ad',
            background: 'rgba(76,168,173,0.15)',
            border: '1px solid rgba(76,168,173,0.3)',
            borderRadius: 99, padding: '1px 7px',
          }}>BETA</span>
        </div>
        <button
          onClick={() => { setZetaEditMode(false); rejectZetaOps(); }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Explanation */}
      {zetaEditExplanation && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            {zetaEditExplanation}
          </p>
        </div>
      )}

      {/* Pending approve/reject */}
      {zetaPendingCount > 0 && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, flex: 1 }}>
            {zetaPendingCount} değişiklik bekliyor
          </span>
          <button onClick={approveZetaOps} style={{
            padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #292f91, #4ca8ad)', color: '#fff', fontSize: 12, fontWeight: 600,
          }}>Onayla</button>
          <button onClick={rejectZetaOps} style={{
            padding: '5px 12px', borderRadius: 8,
            border: '1px solid rgba(239,68,68,0.4)', cursor: 'pointer',
            background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: 12, fontWeight: 600,
          }}>Reddet</button>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Attached doc indicator */}
      {attachedDoc && (
        <div style={{
          margin: '0 12px 8px', padding: '6px 10px',
          background: 'rgba(76,168,173,0.1)', border: '1px solid rgba(76,168,173,0.25)',
          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ca8ad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span style={{ color: '#4ca8ad', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {attachedDoc.name}
          </span>
          <button
            onClick={() => setAttachedDoc(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0, display: 'flex' }}>
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Input area */}
      <div style={{ padding: '0 12px 12px', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.json,.csv,.xml,.html,.js,.ts,.py,.pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Belge ekle"
          style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
            cursor: 'pointer', background: attachedDoc ? 'rgba(76,168,173,0.2)' : 'rgba(255,255,255,0.06)',
            color: attachedDoc ? '#4ca8ad' : 'rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          autoFocus
          value={zetaEditInput}
          onChange={e => setZetaEditInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={"Zeta'ya ne yapmasını istiyorsunuz?\nÖrn: Kırmızı bir başlık ekle, tablo oluştur..."}
          disabled={zetaEditLoading}
          rows={3}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, padding: '8px 10px', color: '#fff', fontSize: 12,
            resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSend}
          disabled={zetaEditLoading || !zetaEditInput.trim()}
          style={{
            width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: zetaEditLoading || !zetaEditInput.trim()
              ? 'rgba(255,255,255,0.1)'
              : 'linear-gradient(135deg, #292f91, #4ca8ad)',
            color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
          {zetaEditLoading ? (
            <span style={{
              width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', display: 'block',
            }} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </div>

      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 10, paddingBottom: 10, margin: 0, flexShrink: 0 }}>
        Her istek 5 kredi kullanır · Enter ile gönder
      </p>
    </div>
  );
};

export default ZetaEditPanel;
