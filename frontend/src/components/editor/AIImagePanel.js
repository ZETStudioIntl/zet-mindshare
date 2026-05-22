import React from 'react';
import { Upload, ImagePlus, Plus, Loader2, Wand2 } from 'lucide-react';
import { DraggablePanel } from './DraggablePanel';

const AIImagePanel = ({
  aiTargetShape, creditsRemaining, dailyCredits,
  aiImagePro, setAiImagePro, planLimits,
  setUpgradeReason, setShowUpgradeModal,
  aiAspectRatio, setAiAspectRatio,
  aiReference, setAiReference,
  aiPreview, aiMimeType,
  addAiImageToCanvas,
  aiPrompt, setAiPrompt,
  generateAIImage, aiGenerating,
  setShowPhotoEdit,
  t, isMobile, onClose,
}) => (
  <DraggablePanel title={aiTargetShape ? "AI Image (Shape)" : "AI Image"} onClose={onClose} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
    <div className="w-72 space-y-3">
      <div className="text-xs px-2 py-1.5 rounded flex items-center justify-between" style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }}>
        <span style={{ color: 'var(--zet-text-muted)' }}>Kalan Kredi:</span>
        <span style={{ color: creditsRemaining > 0 ? '#22c55e' : '#ef4444' }}>{creditsRemaining} / {dailyCredits}</span>
      </div>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--zet-text)' }}>Nano Banana Pro</span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: aiImagePro ? '#f59e0b' : 'var(--zet-border)', color: aiImagePro ? '#fff' : 'var(--zet-text-muted)' }}>{aiImagePro ? '50 kredi' : '20 kredi'}</span>
        </div>
        <button data-testid="ai-pro-toggle" onClick={() => { if (!planLimits.nano_pro) { setUpgradeReason('Nano Banana Pro, Pro veya Ultra planda kullanılabilir.'); setShowUpgradeModal(true); } else { setAiImagePro(!aiImagePro); } }} className="w-10 h-5 rounded-full transition-colors" style={{ background: aiImagePro ? '#f59e0b' : 'var(--zet-border)' }}>
          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${aiImagePro ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>
      <div>
        <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Boyut</label>
        <div className="flex flex-wrap gap-1">
          {(planLimits.custom_image_sizes || ['16:9']).map(ratio => (
            <button key={ratio} onClick={() => setAiAspectRatio(ratio)} className={`text-xs px-2 py-1 rounded transition-colors ${aiAspectRatio === ratio ? 'font-semibold' : ''}`} style={{ background: aiAspectRatio === ratio ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)', border: `1px solid ${aiAspectRatio === ratio ? 'var(--zet-primary)' : 'var(--zet-border)'}` }} data-testid={`ai-ratio-${ratio.replace(/[:.]/g, '-')}`}>
              {ratio}
            </button>
          ))}
        </div>
      </div>
      {aiTargetShape && <div className="text-xs px-2 py-1.5 rounded" style={{ background: 'var(--zet-primary)', color: 'var(--zet-text)' }}>Adding to: {aiTargetShape.startsWith('vector_') ? 'Vector Shape' : 'Shape'}</div>}
      <div>
        <label className="text-xs mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Reference</label>
        <label className="zet-btn text-xs w-full flex items-center justify-center gap-1 cursor-pointer py-2">
          <Upload className="h-3 w-3" />{aiReference ? 'Loaded' : 'Upload'}
          <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setAiReference(ev.target.result.split(',')[1]); r.readAsDataURL(f); } }} className="hidden" />
        </label>
      </div>
      {aiPreview && (
        <div className="space-y-2">
          <img data-testid="ai-image-preview" src={`data:${aiMimeType};base64,${aiPreview}`} alt="AI" className="w-full rounded border" style={{ borderColor: 'var(--zet-border)', maxHeight: 200, objectFit: 'contain' }} />
          <button data-testid="ai-image-add-btn" onClick={addAiImageToCanvas} className="zet-btn w-full flex items-center justify-center gap-1.5 text-sm py-2">
            <Plus className="h-4 w-4" /> {aiTargetShape ? 'Add to Shape' : 'Add to Document'}
          </button>
        </div>
      )}
      <div className="flex gap-1">
        <input data-testid="ai-image-prompt" placeholder="Görseli tanımlayın..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && generateAIImage()} className="zet-input flex-1 text-xs" />
        <button data-testid="ai-image-generate-btn" onClick={generateAIImage} disabled={aiGenerating || creditsRemaining < (aiImagePro ? 50 : 20)} className="zet-btn px-2">
          {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        </button>
      </div>
      {creditsRemaining < (aiImagePro ? 50 : 20) && <p className="text-xs text-center" style={{ color: '#ef4444' }}>Yetersiz kredi! Bu işlem {aiImagePro ? 50 : 20} kredi gerektirir.</p>}
      <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
        <button onClick={() => { setShowPhotoEdit(true); onClose(); }} className="zet-btn w-full flex items-center justify-center gap-2 py-2 text-xs">
          <ImagePlus className="h-4 w-4" /> {t('photoEdit') || 'Edit Existing Photo'}
        </button>
      </div>
    </div>
  </DraggablePanel>
);

export default AIImagePanel;
