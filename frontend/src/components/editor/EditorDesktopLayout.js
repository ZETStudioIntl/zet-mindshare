import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { Toolbox } from './Toolbox';
import { CanvasArea } from './CanvasArea';
import { RightPanel } from './RightPanel';
import { ResizableDivider } from './ResizableDivider';
import EditorPanels from './EditorPanels';
import ShareDialog from './ShareDialog';
import CommentsPanel from './CommentsPanel';
import { startCheckout } from '../../lib/lemonSqueezy';
import { TOOLS } from '../../lib/editorConstants';
import {
  Home, Save, Undo, Redo, ArrowLeft, ArrowRight,
  Upload, Loader2, X, Play, Pause, SkipBack, SkipForward, Volume2,
  Menu, Layers, Sparkles, Zap, Keyboard, Download,
  Share2, MessageSquare, Users,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Group, Ungroup, CircleCheck, Cloud, Crown, Lock, AlertTriangle, RotateCcw,
} from 'lucide-react';

const EditorDesktopLayout = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    activeTool, addPage, alignElements, audioRef, availableVoices,
    buyingCredits, canvasContainerRef, canvasElements, changeImageTarget, changePage,
    collab, collabEnabled, setCollabEnabled,
    columnCount, columnGap, copyElementById,
    creditsRemaining, creditPackages, currentColor, currentFont, currentFontSize,
    currentLineHeight, currentPage, currentTextAlign,
    deleteElement, deleteSelected, deletePage, document, drawOpacity, drawPaths, drawSize,
    eraserDragMode, eraserSize, exporting,
    fastSelectTools, fetchCreditPackages, fetchVoices,
    generateTTS, getEstimatedSize, getFullDocContent, getImageCount,
    getLockedTools, getToolLockReason, getWordCount,
    gradientEnd, gradientStart, gridSize, gridVisible, groupElements,
    handleAddAiImageToShape, handleAddImageToShape, handleAutoWriteContent, handleBuyCredits,
    handleChangeImage, handleEditChart, handleElementSelect, handleImageUpload,
    handleInsertText, handleLinkClick, handleRedo, handleSaveHistory, handleSetTextWrap,
    handleTextFlow, handleToolSelect, handleUndo, handleUpdateSettings, handleZetaTakeNote,
    history, importPDF, isOnline, isFreeOffline,
    isBold, isItalic, isMobile, isPlaying, isStrikethrough, isUnderline,
    judgeMood, leftWidth, setLeftWidth,
    magnifierBorderColor, magnifierGradientEnd, magnifierGradientStart,
    magnifierPos, marginBottom, marginLeft, marginRight, marginTop,
    mirrorElementById, mobilePanel, pageBackground, pageSize, pdfImporting, pdfInputRef,
    playVoiceFrom, refreshCredits,
    rightOpen, setRightOpen, rightWidth, setRightWidth,
    isReadOnly, rulerVisible, saveDocument, saveStatus, saving,
    selectedElement, selectedElements, selectedVoice,
    setCanvasElements, setChangeImageTarget, setDocument, setDrawPaths,
    setIsPlaying, setMagnifierPos, setMobilePanel, setSelectedElement, setSelectedElements,
    setSelectedVoice, setShowCreditModal, setShowComments, setShowExport, setShowImageUpload,
    setShowShareDialog, setShowUpgradeModal, setShowVoice, setTtsAudio, setUploadForShape,
    setToolboxOpen, setUpgradeReason, setZoom,
    showComments, showCreditModal, showImageUpload, showShareDialog, showUpgradeModal, showVoice,
    skipVoice, snapToGrid, spellCheckEnabled, stopVoice,
    toolboxOpen, ungroupElements, uploadForShape, upgradeReason,
    useGradient, userPlan, userUsage, useMagnifierGradient,
    voiceLoading, voiceProgress, zoom, zoomLevel, zoomRadius,
    docId, exportToPDF,
    zetaCustomPrompt, zetaEmoji, zetaMood,
  } = useContext(EditorStateContext);
  return (
    <div data-testid="editor-page" className="h-screen flex flex-col" style={{ background: 'var(--zet-bg)' }}>
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed bottom-4 left-1/2 z-[500] -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-lg"
          style={{ background: isFreeOffline ? '#ef4444' : '#f59e0b', color: '#fff' }}>
          <span>📴</span>
          {isFreeOffline
            ? 'Çevrimdışısın — ücretsiz hesapla sadece mevcut metni düzenleyebilirsin'
            : 'Çevrimdışı — değişiklikler yerel olarak kaydediliyor'}
        </div>
      )}
      {/* Hidden PDF input */}
      <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) importPDF(f); e.target.value = ''; }} />
      {pdfImporting && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"><div className="zet-card p-6 text-center animate-fadeIn"><div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-3" style={{ borderColor: 'var(--zet-primary)', borderTopColor: 'transparent' }} /><p style={{ color: 'var(--zet-text)' }}>PDF içe aktarılıyor...</p></div></div>}
      <header data-testid="editor-header" className="h-12 px-3 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: 'var(--zet-border)' }}>
        <div className="flex items-center gap-2">
          <button data-testid="home-btn" onClick={() => navigate('/dashboard')} className="tool-btn w-8 h-8"><Home className="h-4 w-4" /></button>
          <div className="flex flex-col">
            <input data-testid="doc-title-input" value={document.title} onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))}
              className="bg-transparent font-medium px-2 text-sm border-b border-transparent hover:border-white/20 focus:border-white/40 transition-colors outline-none" style={{ color: 'var(--zet-text)', maxWidth: 200 }} />
            <input data-testid="doc-subtitle-input" value={document.subtitle || ''} onChange={(e) => setDocument(prev => ({ ...prev, subtitle: e.target.value }))}
              placeholder={!document.subtitle ? '⚠ Alt başlık ekle...' : ''}
              className="bg-transparent px-2 text-[10px] border-b border-transparent hover:border-white/20 focus:border-white/40 transition-colors outline-none"
              style={{ color: document.subtitle ? 'var(--zet-text-muted)' : '#f59e0b', maxWidth: 200 }} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button data-testid="undo-btn" onClick={handleUndo} disabled={!history.canUndo} className={`tool-btn w-8 h-8 ${!history.canUndo ? 'opacity-30' : ''}`}><Undo className="h-4 w-4" /></button>
          <span className="text-xs font-medium px-1" style={{ color: 'var(--zet-text-muted)' }}>{currentPage + 1}/{document.pages?.length || 1}</span>
          <button data-testid="redo-btn" onClick={handleRedo} disabled={!history.canRedo} className={`tool-btn w-8 h-8 ${!history.canRedo ? 'opacity-30' : ''}`}><Redo className="h-4 w-4" /></button>
          {selectedElements.length >= 2 && (
            <button data-testid="group-btn" onClick={groupElements} className="tool-btn w-8 h-8 ml-1" title="Grupla"><Group className="h-4 w-4" /></button>
          )}
          {(selectedElement || selectedElements.length > 0) && canvasElements.find(e => e.id === (selectedElement || selectedElements[0]))?.groupId && (
            <button data-testid="ungroup-btn" onClick={ungroupElements} className="tool-btn w-8 h-8" title="Grubu Coz"><Ungroup className="h-4 w-4" /></button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button data-testid="prev-page-btn" onClick={() => changePage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className={`tool-btn w-8 h-8 ${currentPage === 0 ? 'opacity-30' : ''}`}><ArrowLeft className="h-4 w-4" /></button>
          <button data-testid="next-page-btn" onClick={() => changePage(Math.min((document.pages?.length || 1) - 1, currentPage + 1))} disabled={currentPage >= (document.pages?.length || 1) - 1} className={`tool-btn w-8 h-8 ${currentPage >= (document.pages?.length || 1) - 1 ? 'opacity-30' : ''}`}><ArrowRight className="h-4 w-4" /></button>
          
          {/* Fast Select in Header */}
          {fastSelectTools.length > 0 && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l" style={{ borderColor: 'var(--zet-border)' }}>
              <Zap className="h-3 w-3" style={{ color: 'var(--zet-primary-light)' }} />
              {fastSelectTools.map(toolId => {
                const tool = TOOLS.find(t => t.id === toolId);
                if (!tool) return null;
                return (
                  <button
                    key={toolId}
                    data-testid={`fast-${toolId}`}
                    onClick={() => handleToolSelect(toolId)}
                    className={`tool-btn w-7 h-7 ${activeTool === toolId ? 'active' : ''}`}
                    title={t(tool.nameKey) || tool.nameKey}
                  >
                    <tool.icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          )}
          
          {!isMobile && <button data-testid="shortcuts-btn" onClick={() => setShowShortcuts(true)} className="tool-btn w-8 h-8" title="Keyboard Shortcuts"><Keyboard className="h-4 w-4" /></button>}
          <button data-testid="export-btn" onClick={() => setShowExport(true)} className="tool-btn w-8 h-8" title="Export"><Download className="h-4 w-4" /></button>
          {/* Collaboration buttons */}
          <div className="flex items-center gap-1 mr-2">
            <button data-testid="share-btn" onClick={() => setShowShareDialog(true)} className="tool-btn w-8 h-8 flex items-center justify-center" title="Paylas">
              <Share2 className="h-4 w-4" style={{ color: 'var(--zet-text)' }} />
            </button>
            <button data-testid="comments-btn" onClick={() => setShowComments(!showComments)} className={`tool-btn w-8 h-8 flex items-center justify-center ${showComments ? 'ring-1 ring-blue-500' : ''}`} title="Yorumlar">
              <MessageSquare className="h-4 w-4" style={{ color: 'var(--zet-text)' }} />
            </button>
            <button data-testid="collab-toggle" onClick={() => setCollabEnabled(!collabEnabled)} className={`tool-btn w-8 h-8 flex items-center justify-center ${collabEnabled ? 'ring-1 ring-green-500' : ''}`} title={collabEnabled ? 'Isbirligi Acik' : 'Isbirligi Kapat'}>
              <Users className="h-4 w-4" style={{ color: collabEnabled && collab.connected ? '#22c55e' : 'var(--zet-text)' }} />
            </button>
            {collab.onlineUsers.length > 1 && (
              <div data-testid="online-users" className="flex items-center -space-x-1.5 ml-1">
                {collab.onlineUsers.slice(0, 5).map(u => (
                  <div key={u.user_id} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2" style={{ background: u.color, borderColor: 'var(--zet-bg-card)', color: '#fff' }} title={u.name}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {collab.onlineUsers.length > 5 && <span className="text-[10px] ml-1" style={{ color: 'var(--zet-text-muted)' }}>+{collab.onlineUsers.length - 5}</span>}
              </div>
            )}
          </div>
          {/* Credit indicator - clickable */}
          <div data-testid="credit-indicator" onClick={() => { fetchCreditPackages(); setShowCreditModal(true); }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs cursor-pointer hover:scale-105 transition-transform" style={{ background: creditsRemaining > 0 ? 'rgba(76, 168, 173, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${creditsRemaining > 0 ? 'rgba(76, 168, 173, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
            <Zap className="h-3 w-3" style={{ color: creditsRemaining > 0 ? '#4ca8ad' : '#ef4444' }} />
            <span className="font-semibold" style={{ color: creditsRemaining > 0 ? '#4ca8ad' : '#ef4444' }}>{creditsRemaining}</span>
          </div>
          <button onClick={() => setToolboxOpen(o => !o)} className="tool-btn w-8 h-8" title="Sol Panel">
            {toolboxOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
          {!isFreeOffline && (
            <button onClick={() => setRightOpen(o => !o)} className="tool-btn w-8 h-8" title="Sağ Panel">
              {rightOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </button>
          )}
          <button data-testid="save-btn" onClick={() => saveDocument()} className="zet-btn flex items-center gap-1 text-xs px-3 py-1.5"><Save className={`h-3.5 w-3.5 ${saving ? 'animate-pulse' : ''}`} /></button>
          <div data-testid="save-status" className="flex items-center gap-1 text-xs ml-1">
            {saveStatus === 'saved' && <><CircleCheck className="h-3 w-3" style={{ color: '#22c55e' }} /><span className="hidden sm:inline" style={{ color: '#22c55e' }}>Kaydedildi</span></>}
            {saveStatus === 'saving' && <><Cloud className="h-3 w-3 animate-pulse" style={{ color: '#f59e0b' }} /><span className="hidden sm:inline" style={{ color: '#f59e0b' }}>Kaydediliyor...</span></>}
            {saveStatus === 'unsaved' && <><Cloud className="h-3 w-3" style={{ color: 'var(--zet-text-muted)' }} /><span className="hidden sm:inline" style={{ color: 'var(--zet-text-muted)' }}>Kaydedilmedi</span></>}
            {saveStatus === 'error' && (
              <button onClick={() => saveDocument()} className="flex items-center gap-1 hover:opacity-80" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <AlertTriangle className="h-3 w-3" />
                <span className="hidden sm:inline">Kaydedilemedi</span>
                <RotateCcw className="h-3 w-3 ml-1" />
              </button>
            )}
          </div>
          <img src="/logo.svg" alt="ZET" className="h-7 w-7 ml-1" />
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, height: 0, minHeight: 0, overflow: 'hidden', gap: 8, padding: '8px 8px 8px 0', background: 'var(--zet-bg)' }}>
        {/* Sol panel */}
        <div style={{ width: toolboxOpen ? leftWidth : 40, height: '100%', overflow: 'hidden', flexShrink: 0, transition: 'width 0.3s', minWidth: toolboxOpen ? 48 : 40 }}>
          <Toolbox tools={TOOLS} activeTool={activeTool} onToolSelect={handleToolSelect}
            onDeleteSelected={deleteSelected} hasSelection={!!selectedElement || selectedElements.length > 0}
            zoom={zoom} isOpen={toolboxOpen} onToggle={() => setToolboxOpen(!toolboxOpen)}
            lockedTools={getLockedTools()} onLockedClick={(toolId) => { setUpgradeReason(getToolLockReason(toolId)); setShowUpgradeModal(true); }}
            stats={{ pages: document?.pages?.length || 1, words: getWordCount(), images: getImageCount(), size: getEstimatedSize() }}
             />
        </div>

        <ResizableDivider onResize={delta => setLeftWidth(w => Math.max(48, Math.min(300, w + delta)))} />

        {/* Orta canvas */}
        <div style={{ flex: 1, height: '100%', minWidth: 0, position: 'relative' }}>
          {isReadOnly && (
            <>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'rgba(245,158,11,0.18)', borderBottom: '1px solid rgba(245,158,11,0.35)', backdropFilter: 'blur(4px)', fontSize: 12, color: '#f59e0b', fontWeight: 500 }}>
                <Lock size={13} style={{ flexShrink: 0 }} />
                <span>Bu belge başka bir cihazda açık — düzenleme kilitli. Diğer cihaz kapandığında otomatik olarak aktif olacaksınız.</span>
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
            onAddPage={addPage} onCopyElement={copyElementById} onMirrorElement={mirrorElementById} onFlowText={handleTextFlow}
            rulerVisible={rulerVisible} gridVisible={gridVisible} gridSize={gridSize}
            eraserDragMode={eraserDragMode} columnCount={columnCount} columnGap={columnGap}
            onSetTextWrap={handleSetTextWrap} onLinkClick={handleLinkClick} spellCheck={spellCheckEnabled}
            snapToGrid={snapToGrid} userPlan={userPlan} onEditChart={handleEditChart} />
        </div>

        <ResizableDivider onResize={delta => setRightWidth(w => Math.max(48, Math.min(500, w - delta)))} />

        {/* Sağ panel */}
        <div style={{ width: rightOpen ? rightWidth : 0, height: '100%', overflow: 'hidden', flexShrink: 0, transition: 'width 0.3s' }}>
          <RightPanel document={document} currentPage={currentPage} setCurrentPage={changePage}
            pageSize={pageSize} zoom={zoom} onAddPage={addPage} onDeletePage={deletePage}
            docId={docId} wordCount={getWordCount()} canvasContainerRef={canvasContainerRef}
            onExport={exportToPDF} exporting={exporting} documentContent={getFullDocContent()} userUsage={userUsage} userPlan={userPlan}
            onShowUpgrade={(reason) => { setUpgradeReason(reason); setShowUpgradeModal(true); }}
            onShowChatSettings={() => setShowChatSettings(true)}
            zetaMood={zetaMood} zetaEmoji={zetaEmoji} zetaCustomPrompt={zetaCustomPrompt}
            onAutoWriteContent={handleAutoWriteContent} onRefreshCredits={refreshCredits}
            onUpdateSettings={handleUpdateSettings} onTakeNote={handleZetaTakeNote}
            onInsertText={handleInsertText}
            canvasElements={canvasElements} activeTool={activeTool}
            onApplyEdit={(text) => {
              if (selectedElement) {
                setCanvasElements(prev => prev.map(el => el.id === selectedElement ? { ...el, content: text, htmlContent: null } : el));
              } else {
                const updated = [...canvasElements, { id: `el_${Date.now()}`, type: 'text', x: 40, y: 40, content: text, font: 'Arial', fontSize: 14, color: '#000', width: (pageSize?.width || 595) - 80 }];
                setCanvasElements(updated);
              }
            }} />
        </div>
      </div>

      {showVoice && (
        <div data-testid="voice-bar" className="p-3 border-t flex-shrink-0" style={{ background: 'var(--zet-bg-card)', borderColor: 'var(--zet-border)' }}>
          <div className="max-w-xl mx-auto space-y-2">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--zet-primary-light)' }} />
              <select 
                data-testid="voice-select"
                value={selectedVoice} 
                onChange={(e) => setSelectedVoice(e.target.value)}
                onClick={() => { if (availableVoices.length === 0) fetchVoices(); }}
                className="zet-input text-xs flex-1 max-w-xs"
              >
                <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Female)</option>
                <option value="VR6AewLTigWG4xSOukaG">Arnold (Male)</option>
                <option value="EXAVITQu4vr4xnSDxMaL">Bella (Female)</option>
                <option value="ErXwobaYiN019PkySvjV">Antoni (Male)</option>
                {availableVoices.filter(v => !['21m00Tcm4TlvDq8ikWAM', 'VR6AewLTigWG4xSOukaG', 'EXAVITQu4vr4xnSDxMaL', 'ErXwobaYiN019PkySvjV'].includes(v.voice_id)).map(v => (
                  <option key={v.voice_id} value={v.voice_id}>{v.name} {v.gender ? `(${v.gender})` : ''}</option>
                ))}
              </select>
              <button data-testid="voice-generate-btn" onClick={generateTTS} disabled={voiceLoading} className="zet-btn text-xs px-4">
                {voiceLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Generate AI Voice'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button data-testid="voice-skip-back" onClick={() => skipVoice('back')} className="tool-btn w-7 h-7"><SkipBack className="h-3.5 w-3.5" /></button>
              <button data-testid="voice-play-btn" onClick={isPlaying ? stopVoice : () => playVoiceFrom(voiceProgress / 100)} className="tool-btn w-9 h-9">{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
              <button data-testid="voice-skip-forward" onClick={() => skipVoice('forward')} className="tool-btn w-7 h-7"><SkipForward className="h-3.5 w-3.5" /></button>
              <div data-testid="voice-timeline" className="flex-1 h-2.5 rounded-full cursor-pointer relative group" style={{ background: 'var(--zet-bg)' }} onClick={e => { const f = (e.clientX - e.currentTarget.getBoundingClientRect().left) / e.currentTarget.getBoundingClientRect().width; playVoiceFrom(Math.max(0, Math.min(1, f))); }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${voiceProgress}%`, background: 'var(--zet-primary-light)' }} /><div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${voiceProgress}% - 8px)`, background: 'var(--zet-primary-light)' }} /></div>
              <button onClick={() => { stopVoice(); setShowVoice(false); setTtsAudio(null); }} className="p-1 hover:bg-white/10 rounded"><X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>
            </div>
            <audio ref={audioRef} onEnded={() => { setIsPlaying(false); setVoiceProgress(100); }} onTimeUpdate={() => { if (audioRef.current && audioRef.current.duration) setVoiceProgress((audioRef.current.currentTime / audioRef.current.duration) * 100); }} hidden />
          </div>
        </div>
      )}

      <EditorPanels />

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowUpgradeModal(false)}>
          <div className="zet-card p-6 w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #8b5cf6 100%)' }}>
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--zet-text)' }}>
                Planınızı Yükseltin
              </h2>
              <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>
                {upgradeReason || 'Daha fazla kredi ve özellik için planınızı yükseltin.'}
              </p>
            </div>
            
            {/* Plans with credits */}
            <div className="space-y-3 mb-6">
              {[
                { id: 'creative_station', label: 'Creative Station', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', price: '$30/ay', desc: '1200 kredi/gün | Judge sınırsız | Tüm boyutlar' },
                { id: 'pro', label: 'Pro', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', price: '$13/ay', desc: '130 kredi/gün | Nano Pro | Tüm araçlar | 7 boyut', recommended: true },
                { id: 'plus', label: 'Plus', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', price: '$5/ay', desc: '40 kredi/gün | Judge Mini | 3 boyut | Layers' },
              ].map(plan => (
                <div key={plan.id}
                  className="p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] relative"
                  style={{ background: plan.bg, borderColor: plan.color }}
                  onClick={() => { setShowUpgradeModal(false); startCheckout(plan.id, 'monthly'); }}
                >
                  {plan.recommended && <div className="absolute -top-2 left-4 px-2 py-0.5 rounded text-xs font-bold" style={{ background: plan.color, color: 'white' }}>Önerilen</div>}
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold" style={{ color: plan.color }}>{plan.label}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--zet-text)' }}>{plan.price}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{plan.desc}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: plan.color }}>Hemen Başla →</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--zet-bg)', color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}
              >
                Daha Sonra
              </button>
              <button
                onClick={() => { setShowUpgradeModal(false); fetchCreditPackages(); setShowCreditModal(true); }}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
                style={{ background: '#fbbf24', color: '#000' }}
              >
                Kredi Al
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowCreditModal(false)}>
          <div className="zet-card p-5 w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" style={{ color: '#fbbf24' }} />
                <h2 className="text-lg font-bold" style={{ color: 'var(--zet-text)' }}>Kredi Satın Al</h2>
              </div>
              <button onClick={() => setShowCreditModal(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>

            {creditPackages.length > 0 && creditPackages[0].discounted_price !== creditPackages[0].price && (
              <div className="mb-3 px-3 py-2 rounded-lg text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <span className="text-xs font-bold" style={{ color: '#10b981' }}>%15 Abone İndirimi Uygulandı!</span>
              </div>
            )}

            {creditPackages.length === 0 && (
              <div className="text-center py-6" style={{ color: 'var(--zet-text-muted)' }}>
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Paketler yükleniyor...</p>
              </div>
            )}

            <div className="space-y-2.5">
              {creditPackages.map(pkg => {
                const hasDiscount = pkg.discounted_price !== pkg.price;
                return (
                  <div key={pkg.id} className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.01]"
                    style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                        background: pkg.credits >= 1000 ? 'rgba(251,191,36,0.15)' : pkg.credits >= 700 ? 'rgba(139,92,246,0.15)' : pkg.credits >= 350 ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)'
                      }}>
                        <Zap className="h-5 w-5" style={{
                          color: pkg.credits >= 1000 ? '#fbbf24' : pkg.credits >= 700 ? '#8b5cf6' : pkg.credits >= 350 ? '#3b82f6' : '#10b981'
                        }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--zet-text)' }}>{pkg.credits} Kredi</p>
                        <p className="text-[10px]" style={{ color: 'var(--zet-text-muted)' }}>
                          {pkg.credits >= 1000 ? 'En Avantajlı' : pkg.credits >= 700 ? 'Popüler' : pkg.credits >= 350 ? 'Standart' : 'Başlangıç'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        {hasDiscount && (
                          <p className="text-[10px] line-through" style={{ color: 'var(--zet-text-muted)' }}>${pkg.price}</p>
                        )}
                        <p className="text-sm font-bold" style={{ color: hasDiscount ? '#10b981' : 'var(--zet-text)' }}>
                          ${pkg.discounted_price}
                        </p>
                      </div>
                      <button
                        onClick={() => handleBuyCredits(pkg.id)}
                        disabled={buyingCredits}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 disabled:opacity-40"
                        style={{ background: 'var(--zet-primary)', color: 'white' }}
                      >
                        {buyingCredits ? '...' : 'Satın Al'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-center mt-3" style={{ color: 'var(--zet-text-muted)' }}>
              Kredi paketleri anında hesabınıza eklenir. Free dışındaki planlara %15 indirim uygulanır.
              <br />Maksimum kredi bakiyesi: 1000.
            </p>
          </div>
        </div>
      )}

      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowImageUpload(false); setUploadForShape(null); setChangeImageTarget(null); }}>
          <div className="zet-card p-5 w-72 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>{changeImageTarget ? 'Gorsel Degistir' : uploadForShape ? 'Sekle Ekle' : t('image')}</h3>
              <button onClick={() => { setShowImageUpload(false); setUploadForShape(null); setChangeImageTarget(null); }}><X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>
            </div>
            <label data-testid="image-upload-btn" className="zet-btn w-full flex items-center justify-center gap-2 cursor-pointer py-3"><Upload className="h-4 w-4" /><span>Choose File</span><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      {showShareDialog && <ShareDialog docId={docId} onClose={() => setShowShareDialog(false)} />}

      {/* Comments Panel - slides in from right */}
      {showComments && (
        <div data-testid="comments-sidebar" className="fixed right-0 top-12 bottom-0 w-80 z-50 shadow-2xl" style={{ background: 'var(--zet-bg-card)', borderLeft: '1px solid var(--zet-border)' }}>
          <CommentsPanel docId={docId} onClose={() => setShowComments(false)} selectedElement={selectedElement} currentPage={currentPage} />
        </div>
      )}

      {/* Remote Cursors Overlay */}
      {collab.connected && Object.entries(collab.remoteCursors).map(([uid, cursor]) => cursor && (
        <div key={uid} className="fixed pointer-events-none z-[100] transition-all duration-150" style={{ left: cursor.x, top: cursor.y }}>
          <svg width="16" height="20" viewBox="0 0 16 20" fill={cursor.color}>
            <path d="M0 0L16 12L8 12L12 20L8 18L4 12L0 12Z" />
          </svg>
          <span className="text-[9px] px-1 py-0.5 rounded ml-3 whitespace-nowrap" style={{ background: cursor.color, color: '#fff' }}>{cursor.name}</span>
        </div>
      ))}
    </div>
  );
};

export default EditorDesktopLayout;
