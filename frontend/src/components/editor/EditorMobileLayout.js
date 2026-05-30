import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { CanvasArea } from './CanvasArea';
import { RightPanel } from './RightPanel';
import EditorPanels from './EditorPanels';
import { TOOLS } from '../../lib/editorConstants';
import {
  Home, Undo, Redo, Zap, Save, Menu, Layers, Download, Sparkles,
  X, Loader2, Pause, Play, SkipBack, SkipForward, Upload, Lock,
} from 'lucide-react';

const EditorMobileLayout = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    activeTool, addPage, alignElements, audioRef, availableVoices,
    canvasContainerRef, canvasElements, changeImageTarget, changePage,
    columnCount, columnGap, copyElementById,
    creditsRemaining, currentColor, currentFont, currentFontSize,
    currentLineHeight, currentPage, currentTextAlign,
    deleteElement, deletePage, document, drawOpacity, drawPaths, drawSize,
    eraserDragMode, eraserSize, exporting,
    fastSelectTools, fetchCreditPackages, fetchVoices,
    generateTTS, getFullDocContent, getWordCount,
    gradientEnd, gradientStart, gridSize, gridVisible,
    handleAddAiImageToShape, handleAddImageToShape, handleAutoWriteContent,
    handleChangeImage, handleEditChart, handleElementSelect, handleImageUpload,
    handleInsertText, handleLinkClick, handleRedo, handleSaveHistory, handleSetTextWrap,
    handleTextFlow, handleToolSelect, handleUndo, handleUpdateSettings, handleZetaTakeNote,
    history, isBold, isItalic, isMobile, isPlaying, isReadOnly, isStrikethrough, isUnderline,
    judgeMood, magnifierBorderColor, magnifierGradientEnd, magnifierGradientStart,
    magnifierPos, marginBottom, marginLeft, marginRight, marginTop,
    mirrorElementById, mobilePanel, pageBackground, pageSize, playVoiceFrom,
    refreshCredits, rulerVisible, saveDocument, saving,
    selectedElement, selectedElements, selectedVoice,
    setCanvasElements, setChangeImageTarget, setDocument, setDrawPaths,
    setIsPlaying, setMagnifierPos, setMobilePanel, setSelectedElement, setSelectedElements,
    setSelectedVoice, setShowCreditModal, setShowExport, setShowImageUpload,
    setShowUpgradeModal, setShowVoice, setTtsAudio, setUploadForShape, setUpgradeReason, setZoom,
    showImageUpload, showVoice, skipVoice, snapToGrid, spellCheckEnabled, stopVoice,
    uploadForShape, useGradient, userPlan, userUsage, useMagnifierGradient,
    voiceLoading, voiceProgress, zoom, zoomLevel, zoomRadius,
    docId, exportToPDF,
    zetaCustomPrompt, zetaEmoji, zetaMood,
    pdfInputRef, importPDF,
  } = useContext(EditorStateContext);
  return (
      <div data-testid="editor-page" className="flex flex-col overflow-hidden" style={{ background: 'var(--zet-bg)', height: '100dvh', maxHeight: '100dvh' }}>
        {/* Hidden PDF file input — same as desktop, needed for importpdf tool */}
        <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) importPDF(f); e.target.value = ''; }} />
        {/* Mobile Header */}
        <header className="h-11 px-2 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: 'var(--zet-border)' }}>
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <button onClick={() => navigate('/dashboard')} className="tool-btn w-8 h-8 flex-shrink-0"><Home className="h-4 w-4" /></button>
            <input value={document.title} onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))} className="bg-transparent font-medium px-1 text-sm outline-none min-w-0 flex-1 truncate" style={{ color: 'var(--zet-text)' }} />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={handleUndo} disabled={!history.canUndo} className={`tool-btn w-7 h-7 ${!history.canUndo ? 'opacity-30' : ''}`}><Undo className="h-3.5 w-3.5" /></button>
            <button onClick={handleRedo} disabled={!history.canRedo} className={`tool-btn w-7 h-7 ${!history.canRedo ? 'opacity-30' : ''}`}><Redo className="h-3.5 w-3.5" /></button>
            {/* Credits badge */}
            <div onClick={() => { fetchCreditPackages(); setShowCreditModal(true); }} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs cursor-pointer flex-shrink-0" style={{ background: creditsRemaining > 0 ? 'rgba(76,168,173,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${creditsRemaining > 0 ? 'rgba(76,168,173,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
              <Zap className="h-3 w-3" style={{ color: creditsRemaining > 0 ? '#4ca8ad' : '#ef4444' }} />
              <span className="font-semibold" style={{ color: creditsRemaining > 0 ? '#4ca8ad' : '#ef4444' }}>{creditsRemaining}</span>
            </div>
            <button onClick={() => saveDocument()} className="zet-btn px-2 py-1 text-xs flex-shrink-0"><Save className={`h-3.5 w-3.5 ${saving ? 'animate-pulse' : ''}`} /></button>
          </div>
        </header>

        {/* Mobile Canvas */}
        <div className="flex-1 relative" style={{ touchAction: 'pan-y', overflowY: 'scroll', WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
          {isReadOnly && (
            <>
              <div style={{ position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(245,158,11,0.18)', borderBottom: '1px solid rgba(245,158,11,0.35)', fontSize: 11, color: '#f59e0b', fontWeight: 500 }}>
                <Lock size={11} style={{ flexShrink: 0 }} />
                <span>Başka bir cihazda açık — düzenleme kilitli</span>
              </div>
              <div style={{ position: 'absolute', inset: 0, zIndex: 39, cursor: 'not-allowed' }}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
              />
            </>
          )}
          <CanvasArea document={document} currentPage={currentPage} changePage={changePage}
            canvasElements={canvasElements} setCanvasElements={setCanvasElements}
            drawPaths={drawPaths} setDrawPaths={setDrawPaths} pageSize={pageSize} zoom={zoom} setZoom={setZoom}
            activeTool={activeTool} currentFontSize={currentFontSize} currentFont={currentFont} currentColor={currentColor}
            currentLineHeight={currentLineHeight} currentTextAlign={currentTextAlign}
            drawSize={drawSize} drawOpacity={drawOpacity} eraserSize={eraserSize}
            markingColor={'#FFFF00'} markingOpacity={40} markingSize={20}
            selectedElement={selectedElement} setSelectedElement={setSelectedElement}
            selectedElements={selectedElements} setSelectedElements={setSelectedElements}
            onSaveHistory={handleSaveHistory} canvasContainerRef={canvasContainerRef}
            onElementSelect={handleElementSelect} onDeleteElement={deleteElement}
            onChangeImage={handleChangeImage} onAddImageToShape={handleAddImageToShape}
            onAddAiImageToShape={handleAddAiImageToShape}
            isBold={isBold} isItalic={isItalic} isUnderline={isUnderline} isStrikethrough={isStrikethrough}
            pageBackground={pageBackground} gradientStart={gradientStart} gradientEnd={gradientEnd} useGradient={useGradient}
            zoomLevel={zoomLevel} zoomRadius={zoomRadius} magnifierPos={magnifierPos} setMagnifierPos={setMagnifierPos}
            magnifierBorderColor={magnifierBorderColor} magnifierGradientStart={magnifierGradientStart}
            magnifierGradientEnd={magnifierGradientEnd} useMagnifierGradient={useMagnifierGradient}
            onAddPage={addPage} onCopyElement={copyElementById} onMirrorElement={mirrorElementById} onFlowText={handleTextFlow}
            rulerVisible={rulerVisible} gridVisible={gridVisible} gridSize={gridSize}
            eraserDragMode={eraserDragMode}
            columnCount={columnCount} columnGap={columnGap}
            pageMargins={{ top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight }}
            onSetTextWrap={handleSetTextWrap} onLinkClick={handleLinkClick} spellCheck={spellCheckEnabled}
            snapToGrid={snapToGrid} userPlan={userPlan} onEditChart={handleEditChart} />
        </div>

        {/* Multi-select Alignment Toolbar */}
        {selectedElements.length > 1 && (
          <div className="flex-shrink-0 border-t px-2 py-1 flex items-center gap-1 overflow-x-auto flex-wrap" style={{ borderColor: 'var(--zet-border)', background: 'var(--zet-bg-card)' }}>
            <span className="text-xs mr-1 flex-shrink-0" style={{ color: 'var(--zet-text-muted)' }}>{selectedElements.length} seçili</span>
            {[
              { key: 'left',     label: '⇤ Sol' },
              { key: 'center-h', label: '↔ Orta' },
              { key: 'right',    label: '⇥ Sağ' },
              { key: 'top',      label: '⇡ Üst' },
              { key: 'center-v', label: '↕ Orta' },
              { key: 'bottom',   label: '⇣ Alt' },
              { key: 'dist-h',   label: '|⇔| Y.Dağıt' },
              { key: 'dist-v',   label: '⇕ D.Dağıt' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => alignElements(key)} className="tool-btn text-xs px-2 h-7 flex-shrink-0" style={{ fontSize: 11 }}>{label}</button>
            ))}
            <button onClick={() => { setSelectedElements([]); setSelectedElement(null); }} className="tool-btn text-xs px-2 h-7 flex-shrink-0 ml-1" style={{ color: 'var(--zet-text-muted)' }}>✕ Temizle</button>
          </div>
        )}

        {/* Fast Select Bar */}
        {fastSelectTools.length > 0 && (
          <div className="flex-shrink-0 border-t px-2 py-1 flex items-center gap-1 overflow-x-auto" style={{ borderColor: 'var(--zet-border)', background: 'var(--zet-bg-card)' }}>
            <Zap className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--zet-primary-light)' }} />
            {fastSelectTools.map(toolId => {
              const tool = TOOLS.find(t => t.id === toolId);
              if (!tool) return null;
              return (
                <button
                  key={toolId}
                  onClick={() => handleToolSelect(toolId)}
                  className={`tool-btn w-8 h-8 flex-shrink-0 ${activeTool === toolId ? 'active ring-1 ring-blue-500' : ''}`}
                  title={t(tool.nameKey) || tool.nameKey}
                >
                  <tool.icon className="h-4 w-4" style={{ color: activeTool === toolId ? 'var(--zet-primary-light)' : 'var(--zet-text)' }} />
                </button>
              );
            })}
            {/* Page indicator */}
            <div className="ml-auto flex-shrink-0 flex items-center gap-1 text-xs" style={{ color: 'var(--zet-text-muted)' }}>
              <span>{currentPage + 1}/{document.pages?.length || 1}</span>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation Bar */}
        <div className="border-t flex-shrink-0" style={{ borderColor: 'var(--zet-border)', background: 'var(--zet-bg-card)' }}>
          <div className="flex items-center justify-around py-1.5 px-1">
            {/* Toolbox Button */}
            <button
              onClick={() => setMobilePanel(mobilePanel === 'tools' ? null : 'tools')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${mobilePanel === 'tools' ? 'bg-white/10' : ''}`}
            >
              <Menu className="h-5 w-5" style={{ color: mobilePanel === 'tools' ? 'var(--zet-primary-light)' : 'var(--zet-text-muted)' }} />
              <span className="text-[10px]" style={{ color: mobilePanel === 'tools' ? 'var(--zet-primary-light)' : 'var(--zet-text-muted)' }}>Araçlar</span>
            </button>

            {/* Pages Button */}
            <button
              onClick={() => setMobilePanel(mobilePanel === 'pages' ? null : 'pages')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${mobilePanel === 'pages' ? 'bg-white/10' : ''}`}
            >
              <Layers className="h-5 w-5" style={{ color: mobilePanel === 'pages' ? 'var(--zet-primary-light)' : 'var(--zet-text-muted)' }} />
              <span className="text-[10px]" style={{ color: mobilePanel === 'pages' ? 'var(--zet-primary-light)' : 'var(--zet-text-muted)' }}>Sayfalar</span>
            </button>

            {/* Export Button */}
            <button
              onClick={() => setShowExport(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all"
            >
              <Download className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              <span className="text-[10px]" style={{ color: 'var(--zet-text-muted)' }}>Dışa Aktar</span>
            </button>

            {/* ZETA Chat Button */}
            <button
              onClick={() => setMobilePanel(mobilePanel === 'zeta' ? null : 'zeta')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${mobilePanel === 'zeta' ? 'bg-white/10' : ''}`}
            >
              <Sparkles className="h-5 w-5" style={{ color: mobilePanel === 'zeta' ? 'var(--zet-primary-light)' : 'var(--zet-text-muted)' }} />
              <span className="text-[10px]" style={{ color: mobilePanel === 'zeta' ? 'var(--zet-primary-light)' : 'var(--zet-text-muted)' }}>AI Chat</span>
            </button>
          </div>
        </div>

        {/* Mobile Tools Panel */}
        {mobilePanel === 'tools' && (
          <div className="fixed inset-0 z-50 flex flex-col" onClick={(e) => e.target === e.currentTarget && setMobilePanel(null)}>
            <div className="flex-1" onClick={() => setMobilePanel(null)} />
            <div className="rounded-t-2xl max-h-[65vh] overflow-y-auto" style={{ background: 'var(--zet-bg-card)' }}>
              <div className="sticky top-0 p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--zet-border)', background: 'var(--zet-bg-card)' }}>
                <span className="font-medium" style={{ color: 'var(--zet-text)' }}>Araçlar</span>
                <button onClick={() => setMobilePanel(null)} className="p-1 rounded hover:bg-white/10">
                  <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2 p-3">
                {TOOLS.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => { handleToolSelect(tool.id); if (!['text', 'draw', 'pen', 'marking', 'eraser', 'select'].includes(tool.id)) setMobilePanel(null); }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${activeTool === tool.id ? 'bg-white/10 ring-1 ring-blue-500' : 'hover:bg-white/5'}`}
                  >
                    <tool.icon className="h-5 w-5" style={{ color: activeTool === tool.id ? 'var(--zet-primary-light)' : 'var(--zet-text)' }} />
                    <span className="text-xs truncate w-full text-center" style={{ color: 'var(--zet-text-muted)' }}>{t(tool.nameKey) || tool.nameKey}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Side Panel (Pages/ZETA) */}
        {(mobilePanel === 'pages' || mobilePanel === 'zeta') && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40" onClick={() => setMobilePanel(null)} />
            <div className="w-72 h-full" style={{ background: 'var(--zet-bg-card)' }}>
              <RightPanel document={document} currentPage={currentPage} setCurrentPage={changePage}
                pageSize={pageSize} zoom={zoom} onAddPage={addPage} onDeletePage={deletePage}
                docId={docId} wordCount={getWordCount()} canvasContainerRef={canvasContainerRef}
                forceSection={mobilePanel} onExport={exportToPDF} exporting={exporting} 
                documentContent={getFullDocContent()} userUsage={userUsage} userPlan={userPlan} 
                onShowUpgrade={(reason) => { setUpgradeReason(reason); setShowUpgradeModal(true); }}
                onShowChatSettings={() => setShowChatSettings(true)}
                zetaMood={zetaMood} zetaEmoji={zetaEmoji} zetaCustomPrompt={zetaCustomPrompt} judgeMood={judgeMood}
                onAutoWriteContent={handleAutoWriteContent} onRefreshCredits={refreshCredits}
                onUpdateSettings={handleUpdateSettings} onTakeNote={handleZetaTakeNote}
                onInsertText={handleInsertText}
                onAddImageToCanvas={(src) => {
                  const updated = [...canvasElements, { id: `el_${Date.now()}`, type: 'image', x: 20, y: 40, width: 200, height: 200, src }];
                  setCanvasElements(updated);
                  handleSaveHistory(updated);
                }}
                canvasElements={canvasElements} activeTool={activeTool} />
            </div>
          </div>
        )}

        {/* Voice bar + floating panels */}
        {showVoice && (
          <div className="p-2 border-t flex-shrink-0" style={{ background: 'var(--zet-bg-card)', borderColor: 'var(--zet-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                onClick={() => { if (availableVoices.length === 0) fetchVoices(); }}
                className="zet-input text-xs flex-1"
              >
                {availableVoices.length > 0 ? (
                  availableVoices.map(v => (
                    <option key={v.voice_id} value={v.voice_id}>{v.name}{v.gender ? ` (${v.gender})` : ''}</option>
                  ))
                ) : (
                  <>
                    <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Female)</option>
                    <option value="VR6AewLTigWG4xSOukaG">Arnold (Male)</option>
                    <option value="EXAVITQu4vr4xnSDxMaL">Bella (Female)</option>
                    <option value="ErXwobaYiN019PkySvjV">Antoni (Male)</option>
                  </>
                )}
              </select>
              <button onClick={generateTTS} disabled={voiceLoading} className="zet-btn text-xs px-3">
                {voiceLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Generate'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => skipVoice('back')} className="tool-btn w-7 h-7"><SkipBack className="h-3.5 w-3.5" /></button>
              <button onClick={isPlaying ? () => { stopVoice(); } : () => playVoiceFrom(voiceProgress / 100)} className="tool-btn w-8 h-8">{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
              <button onClick={() => skipVoice('forward')} className="tool-btn w-7 h-7"><SkipForward className="h-3.5 w-3.5" /></button>
              <div className="flex-1 h-2 rounded-full cursor-pointer" style={{ background: 'var(--zet-bg)' }} onClick={e => { const f = (e.clientX - e.currentTarget.getBoundingClientRect().left) / e.currentTarget.getBoundingClientRect().width; playVoiceFrom(f); }}>
                <div className="h-full rounded-full" style={{ width: `${voiceProgress}%`, background: 'var(--zet-primary-light)' }} />
              </div>
              <button onClick={() => { stopVoice(); setShowVoice(false); setTtsAudio(null); }} className="p-1"><X className="h-3.5 w-3.5" style={{ color: 'var(--zet-text-muted)' }} /></button>
            </div>
            <audio ref={audioRef} onEnded={() => { setIsPlaying(false); setVoiceProgress(100); }} onTimeUpdate={() => { if (audioRef.current) setVoiceProgress((audioRef.current.currentTime / audioRef.current.duration) * 100); }} hidden />
          </div>
        )}
        <EditorPanels />
        {showImageUpload && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowImageUpload(false); setUploadForShape(null); setChangeImageTarget(null); }}>
            <div className="zet-card p-5 w-72 animate-fadeIn" onClick={e => e.stopPropagation()}>
              <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--zet-text)' }}>{changeImageTarget ? 'Change Image' : t('image')}</h3>
              <label className="zet-btn w-full flex items-center justify-center gap-2 cursor-pointer py-3"><Upload className="h-4 w-4" /><span>Choose File</span><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>
            </div>
          </div>
        )}
      </div>
  );
};

export default EditorMobileLayout;
