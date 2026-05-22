import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';
import { Check, Copy as CopyIcon } from 'lucide-react';

const CalculatorPanel = () => {
  const {
    isMobile, showCalculator, setShowCalculator,
    calcExpr, setCalcExpr, calcResult, setCalcResult, calcCopied, setCalcCopied,
  } = useContext(EditorStateContext);
  if (!showCalculator) return null;
      const calcPress = (val) => {
        if (val === 'C') { setCalcExpr(''); setCalcResult(''); setCalcCopied(false); return; }
        if (val === '⌫') { setCalcExpr(p => p.slice(0, -1)); setCalcResult(''); return; }
        if (val === '=') {
          try {
            const safe = calcExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.');
            // eslint-disable-next-line no-new-func
            const r = Function('"use strict"; return (' + safe + ')')();
            setCalcResult(isFinite(r) ? (+(+r).toFixed(10)).toString() : 'Hata');
          } catch { setCalcResult('Hata'); }
          return;
        }
        setCalcExpr(p => p + val);
        setCalcResult('');
      };
      const rows = [
        ['C', '⌫', '%', '÷'],
        ['7', '8', '9', '×'],
        ['4', '5', '6', '-'],
        ['1', '2', '3', '+'],
        ['±', '0', '.', '='],
      ];
      return (
        <DraggablePanel title="Hesap Makinesi" onClose={() => { setShowCalculator(false); setCalcExpr(''); setCalcResult(''); }} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
          <div style={{ width: 220 }}>
            {/* Display */}
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px', marginBottom: 10, minHeight: 64 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', minHeight: 18, wordBreak: 'break-all', textAlign: 'right' }}>{calcExpr || '0'}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: calcResult === 'Hata' ? '#ef4444' : '#4ca8ad' }}>{calcResult}</span>
                {calcResult && calcResult !== 'Hata' && (
                  <button onClick={() => { navigator.clipboard.writeText(calcResult); setCalcCopied(true); setTimeout(() => setCalcCopied(false), 1500); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: calcCopied ? '#22c55e' : 'rgba(255,255,255,0.4)' }}
                    title="Kopyala">
                    {calcCopied ? <Check className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>
            {/* Buttons */}
            {rows.map((row, ri) => (
              <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 6 }}>
                {row.map(btn => {
                  const isOp = ['÷', '×', '-', '+', '='].includes(btn);
                  const isAct = ['C', '⌫', '%', '±'].includes(btn);
                  return (
                    <button key={btn} onClick={() => {
                      if (btn === '±') { setCalcExpr(p => p.startsWith('-') ? p.slice(1) : '-' + p); return; }
                      calcPress(btn);
                    }}
                      style={{
                        padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600,
                        background: isOp ? 'var(--zet-primary)' : isAct ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
                        color: isOp ? '#fff' : isAct ? '#f59e0b' : 'var(--zet-text)',
                        transition: 'opacity 0.1s',
                      }}
                      onMouseDown={e => e.currentTarget.style.opacity = '0.7'}
                      onMouseUp={e => e.currentTarget.style.opacity = '1'}
                    >{btn}</button>
                  );
                })}
              </div>
            ))}
          </div>
        </DraggablePanel>
      );
};

export default CalculatorPanel;
