import React from 'react';
import { Plus, ImagePlus } from 'lucide-react';
import { DraggablePanel } from './DraggablePanel';

const SignaturePanel = ({ signatureCanvasRef, handleSignatureMouseDown, handleSignatureMouseMove, handleSignatureMouseUp, clearSignature, addSignatureToCanvas, signatureData, handleSignaturePhotoUpload, sigPhotoRaw, sigPhotoThreshold, handleSigPhotoThresholdChange, isMobile, onClose }) => (
  <DraggablePanel title="Digital Signature" onClose={onClose} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
    <div className="space-y-3 w-72">
      <p className="text-xs font-medium" style={{ color: 'var(--zet-text-muted)' }}>
        {sigPhotoRaw ? 'Arka plan temizlendi — önizleme:' : 'İmzanızı çizin:'}
      </p>
      <canvas
        ref={signatureCanvasRef}
        width={256}
        height={100}
        onMouseDown={sigPhotoRaw ? undefined : handleSignatureMouseDown}
        onMouseMove={sigPhotoRaw ? undefined : handleSignatureMouseMove}
        onMouseUp={sigPhotoRaw ? undefined : handleSignatureMouseUp}
        onMouseLeave={sigPhotoRaw ? undefined : handleSignatureMouseUp}
        className="rounded border w-full"
        style={{ background: sigPhotoRaw ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 12px 12px' : '#fff', borderColor: 'var(--zet-border)', cursor: sigPhotoRaw ? 'default' : 'crosshair' }}
      />
      {sigPhotoRaw && (
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>
            Arka plan eşiği: <span style={{ color: 'var(--zet-text)' }}>{sigPhotoThreshold}</span>
            <span className="ml-1 opacity-60">(yüksek = daha fazla temizle)</span>
          </label>
          <input
            type="range" min="100" max="250" value={sigPhotoThreshold}
            onChange={e => handleSigPhotoThresholdChange(Number(e.target.value))}
            className="w-full accent-teal-500"
          />
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={clearSignature} className="zet-btn py-1.5 text-xs px-3">Temizle</button>
        <button
          onClick={() => addSignatureToCanvas()}
          disabled={!signatureData}
          className="zet-btn flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
          style={{ background: signatureData ? 'var(--zet-primary)' : undefined }}
        >
          <Plus className="h-4 w-4" /> Belgeye Ekle
        </button>
      </div>
      {!sigPhotoRaw && (
        <div className="border-t pt-3" style={{ borderColor: 'var(--zet-border)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--zet-text-muted)' }}>veya fotoğraftan imza yükle:</p>
          <label className="zet-btn w-full py-2 text-xs flex items-center justify-center gap-2 cursor-pointer">
            <ImagePlus className="h-4 w-4" />
            Fotoğraf Yükle
            <input type="file" accept="image/*" onChange={handleSignaturePhotoUpload} className="sr-only" />
          </label>
        </div>
      )}
    </div>
  </DraggablePanel>
);

export default SignaturePanel;
