import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DraggablePanel } from './DraggablePanel';
import { ImagePlus, Pencil, Loader2, Wand2, Plus } from 'lucide-react';

const PhotoEditPanel = () => {
  const { t } = useLanguage();
  const {
    isMobile, showPhotoEdit, setShowPhotoEdit,
    setPhotoEditImage, setPhotoEditResult, setPhotoEditDrawings, setPhotoEditDrawMode,
    planLimits, creditsRemaining,
    photoEditImage, handlePhotoEditUpload, photoEditDrawMode, photoEditCanvasRef,
    setIsDrawingOnPhoto, isDrawingOnPhoto, photoEditDrawings,
    photoEditResult, photoEditPrompt, setPhotoEditPrompt,
    executePhotoEdit, photoEditLoading, addEditedPhotoToCanvas,
  } = useContext(EditorStateContext);
  if (!showPhotoEdit) return null;
  return (
    <DraggablePanel title="AI Photo Edit" onClose={() => { setShowPhotoEdit(false); setPhotoEditImage(null); setPhotoEditResult(null); setPhotoEditDrawings([]); setPhotoEditDrawMode(false); }} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="space-y-3 w-72">
        {/* Credits info */}
        <div className="text-xs px-2 py-1.5 rounded flex items-center justify-between" style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }}>
          <span style={{ color: 'var(--zet-text-muted)' }}>Maliyet: {planLimits.nano_pro ? 'Standart 15 / Pro 40' : '15'} kredi</span>
          <span style={{ color: creditsRemaining > 0 ? '#22c55e' : '#ef4444' }}>{creditsRemaining} kalan</span>
        </div>
        {!photoEditImage ? (
          <button onClick={handlePhotoEditUpload} className="zet-btn w-full py-6 flex flex-col items-center gap-2">
            <ImagePlus className="h-6 w-6" />
            <span className="text-sm">{t('selectPhoto') || 'Select Photo'}</span>
          </button>
        ) : (
          <>
            {/* Photo with drawing overlay */}
            <div className="relative">
              <p className="text-xs mb-1" style={{ color: 'var(--zet-text-muted)' }}>
                {photoEditDrawMode ? '✏️ Düzenlemek istediğiniz yeri çizin' : 'Original'}
              </p>
              <div className="relative">
                <img src={photoEditImage} alt="Original" className="w-full rounded" style={{ maxHeight: 180 }} />
                {photoEditDrawMode && (
                  <canvas
                    ref={photoEditCanvasRef}
                    className="absolute inset-0 w-full h-full cursor-crosshair"
                    style={{ touchAction: 'none' }}
                    onMouseDown={(e) => {
                      const rect = e.target.getBoundingClientRect();
                      setIsDrawingOnPhoto(true);
                      setPhotoEditDrawings(prev => [...prev, [{ x: e.clientX - rect.left, y: e.clientY - rect.top }]]);
                    }}
                    onMouseMove={(e) => {
                      if (!isDrawingOnPhoto) return;
                      const rect = e.target.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      setPhotoEditDrawings(prev => {
                        const newDrawings = [...prev];
                        if (newDrawings.length > 0) {
                          newDrawings[newDrawings.length - 1] = [...newDrawings[newDrawings.length - 1], { x, y }];
                        }
                        return newDrawings;
                      });
                      // Draw on canvas
                      const canvas = photoEditCanvasRef.current;
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx.strokeStyle = '#ff0000';
                        ctx.lineWidth = 3;
                        ctx.lineCap = 'round';
                        const drawings = photoEditDrawings;
                        if (drawings.length > 0) {
                          const lastPath = drawings[drawings.length - 1];
                          if (lastPath.length > 1) {
                            ctx.beginPath();
                            ctx.moveTo(lastPath[lastPath.length - 2].x, lastPath[lastPath.length - 2].y);
                            ctx.lineTo(x, y);
                            ctx.stroke();
                          }
                        }
                      }
                    }}
                    onMouseUp={() => setIsDrawingOnPhoto(false)}
                    onMouseLeave={() => setIsDrawingOnPhoto(false)}
                  />
                )}
                {/* Show red circles where user drew */}
                {photoEditDrawings.length > 0 && !photoEditDrawMode && (
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full">
                      {photoEditDrawings.map((path, i) => (
                        <path 
                          key={i} 
                          d={`M ${path.map(p => `${p.x} ${p.y}`).join(' L ')}`} 
                          stroke="#ff0000" 
                          strokeWidth="3" 
                          fill="none" 
                          strokeLinecap="round"
                        />
                      ))}
                    </svg>
                  </div>
                )}
              </div>
            </div>
            
            {/* Draw mode toggle */}
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setPhotoEditDrawMode(!photoEditDrawMode);
                  if (!photoEditDrawMode) {
                    // Initialize canvas when entering draw mode
                    setTimeout(() => {
                      const canvas = photoEditCanvasRef.current;
                      if (canvas) {
                        const img = canvas.parentElement.querySelector('img');
                        if (img) {
                          canvas.width = img.clientWidth;
                          canvas.height = img.clientHeight;
                        }
                      }
                    }, 100);
                  }
                }}
                className={`flex-1 py-1.5 text-xs rounded flex items-center justify-center gap-1 ${photoEditDrawMode ? 'ring-2 ring-red-500' : ''}`}
                style={{ background: photoEditDrawMode ? 'rgba(255,0,0,0.2)' : 'var(--zet-bg)', color: photoEditDrawMode ? '#ff6464' : 'var(--zet-text)' }}
              >
                <Pencil className="h-3 w-3" /> {photoEditDrawMode ? 'Çizim Modu Açık' : 'Kalemle İşaretle'}
              </button>
              {photoEditDrawings.length > 0 && (
                <button 
                  onClick={() => {
                    setPhotoEditDrawings([]);
                    const canvas = photoEditCanvasRef.current;
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                  }}
                  className="px-2 py-1.5 text-xs rounded"
                  style={{ background: 'var(--zet-bg)', color: 'var(--zet-text-muted)' }}
                >
                  Temizle
                </button>
              )}
            </div>
            
            {/* Result preview */}
            {photoEditResult && (
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--zet-text-muted)' }}>Düzenlenmiş</p>
                <img src={photoEditResult} alt="Edited" className="w-full rounded" style={{ maxHeight: 120 }} />
              </div>
            )}
            
            <textarea
              placeholder={photoEditDrawings.length > 0 
                ? "Çizdiğiniz alanı nasıl değiştirelim? (örn: 'Bu alanı sil', 'Buraya çiçek ekle')" 
                : "Değişiklikleri açıklayın... (örn: 'Arka planı kaldır', 'Gün batımı yap')"}
              value={photoEditPrompt}
              onChange={e => setPhotoEditPrompt(e.target.value)}
              className="zet-input w-full text-xs h-14 resize-none"
            />
            <div className="flex gap-2">
              <button 
                onClick={executePhotoEdit} 
                disabled={photoEditLoading || !photoEditPrompt.trim()}
                className="zet-btn flex-1 py-2 flex items-center justify-center gap-2"
              >
                {photoEditLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {t('edit') || 'Düzenle'}
              </button>
              {photoEditResult && (
                <button onClick={addEditedPhotoToCanvas} className="zet-btn flex-1 py-2 flex items-center justify-center gap-2" style={{ background: 'var(--zet-primary)' }}>
                  <Plus className="h-4 w-4" /> Ekle
                </button>
              )}
            </div>
            <button onClick={handlePhotoEditUpload} className="text-xs underline w-full text-center" style={{ color: 'var(--zet-text-muted)' }}>
              {t('selectDifferent') || 'Farklı fotoğraf seç'}
            </button>
          </>
        )}
      </div>
    </DraggablePanel>
  );
};

export default PhotoEditPanel;
