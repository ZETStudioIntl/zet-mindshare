import React, { useContext, useRef, useEffect } from 'react';
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

  useEffect(() => {
    if (zetaEditMode && textareaRef.current) textareaRef.current.focus();
  }, [zetaEditMode]);

  if (!zetaEditMode) return null;

  const handleSend = () => {
    if (!zetaEditInput.trim() || zetaEditLoading) return;
    applyZetaDocEdit(zetaEditInput.trim());
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{
      position: 'fixed', bottom: 80, right: 16, zIndex: 300,
      width: 320, borderRadius: 16,
      background: 'linear-gradient(135deg, #0d0f2a 0%, #1a1f5c 100%)',
      border: '1px solid rgba(76,168,173,0.35)',
      boxShadow: '0 8px 40px rgba(41,47,145,0.5)',
      fontFamily: "'DM Sans', sans-serif",
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
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
        <button onClick={() => { setZetaEditMode(false); rejectZetaOps(); }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2 }}>
          ×
        </button>
      </div>

      {/* Explanation */}
      {zetaEditExplanation && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            {zetaEditExplanation}
          </p>
        </div>
      )}

      {/* Pending approve/reject */}
      {zetaPendingCount > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, alignSelf: 'center', flex: 1 }}>
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

      {/* Input */}
      <div style={{ padding: 12, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          ref={textareaRef}
          value={zetaEditInput}
          onChange={e => setZetaEditInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Zeta'ya ne yapmasını istiyorsunuz?&#10;Örn: Kırmızı bir başlık ekle, tablo oluştur..."
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
          ) : '→'}
        </button>
      </div>

      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 10, paddingBottom: 8, margin: 0 }}>
        Her istek 5 kredi kullanır · Enter ile gönder
      </p>
    </div>
  );
};

export default ZetaEditPanel;
