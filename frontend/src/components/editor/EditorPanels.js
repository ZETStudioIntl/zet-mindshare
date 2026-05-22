import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DraggablePanel } from './DraggablePanel';
import EmojiPicker from './EmojiPicker';
import AIImagePanel from './AIImagePanel';
import SignaturePanel from './SignaturePanel';
import ChartPanel from './ChartPanel';
import QRCodePanel from './QRCodePanel';
import WatermarkPanel from './WatermarkPanel';
import PageNumbersPanel from './PageNumbersPanel';
import FindReplacePanel from './FindReplacePanel';
import TemplatesPanel from './TemplatesPanel';
import ExportPanel from './ExportPanel';
import { TOOLS, PAGE_SIZES, PRESET_COLORS, TRANSLATE_LANGUAGES, LINE_SPACINGS } from '../../lib/editorConstants';
import ColorPickerPanel from './ColorPickerPanel';
import MagnifierPanel from './MagnifierPanel';
import ParagraphPanel from './ParagraphPanel';
import PhotoEditPanel from './PhotoEditPanel';
import CalculatorPanel from './CalculatorPanel';
import ChatSettingsPanel from './ChatSettingsPanel';
import { SHAPE_LIST, PUNCTUATION_LIST } from './Toolbox';
import {
  Search, Loader2, X, Wand2, Plus, Check,
  Languages,
  Bold, Italic, Underline, Strikethrough, Highlighter,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Eye, EyeOff, Lock, Unlock,
  ChevronUp, ChevronDown, Trash2, Table, Zap, Mic, Pencil, ImagePlus,
  Copy as CopyIcon,
} from 'lucide-react';

const PARA_STYLES = [
  { id: 'h1',      label: 'Baslik 1', fontSize: 32, bold: true,  lineHeight: 1.3 },
  { id: 'h2',      label: 'Baslik 2', fontSize: 24, bold: true,  lineHeight: 1.3 },
  { id: 'h3',      label: 'Baslik 3', fontSize: 18, bold: true,  lineHeight: 1.4 },
  { id: 'normal',  label: 'Normal',   fontSize: 14, bold: false, lineHeight: 1.5 },
  { id: 'small',   label: 'Kucuk',    fontSize: 11, bold: false, lineHeight: 1.4 },
  { id: 'caption', label: 'Alt Yazi', fontSize: 10, bold: false, lineHeight: 1.3 },
  { id: 'quote',   label: 'Alinti',   fontSize: 14, bold: false, lineHeight: 1.8 },
];

const EditorPanels = () => {
  const {
    activeStopId, activeTool, addAiImageToCanvas, addEditedPhotoToCanvas, addSignatureToCanvas, addVoiceTextToDocument,
    aiAspectRatio, aiGenerating, aiImagePro, aiMimeType, aiPreview, aiPrompt, aiReference, aiTargetShape,
    allFonts, applyColor, applyGradient, applyHeaderFooter, applyHeadingStyle, applyInlineStyle, applyListFormat,
    applyParaStyle, applyTemplate, applyTextAlign, applyTranslation, applyWatermark,
    calcCopied, calcExpr, calcResult, canvasElements,
    chartColors, chartData, chartImage, chartLabels, chartTitle, chartType,
    clearSignature, colorTarget, columnCount, columnGap, createChart, createQRCode, createTable, creditsRemaining,
    currentBulletStyle, currentColor, currentFont, currentFontSize, currentLineHeight, currentNumberStyle, currentPage, currentTextAlign,
    customColor, customHeight, customWidth, dailyCredits, deleteElement, document, drawOpacity, drawSize,
    editingChartId, editingShortcut, elSttLoading, eraserDragMode, eraserSize,
    executePhotoEdit, exportQuality, exporting,
    findInDocument, findResults, findScope, findText, firstLineIndent, fontSearch,
    footerEven, footerOdd, footerText, generateAIImage,
    gradientAngle, gradientBarRef, gradientEnd, gradientStart, gradientStops,
    gridSize, gridVisible, handleExport, handlePhotoEditUpload, handleSaveHistory,
    handleSignatureMouseDown, handleSignatureMouseMove, handleSignatureMouseUp, handleSignaturePhotoUpload, handleTranslate,
    headerEven, headerFooterMode, headerOdd, headerText, hexInput, highlighterColor, history,
    importFromMS, indentBottom, indentLeft, indentRight, indentTop, insertEmoji,
    isBold, isDrawingOnPhoto, isItalic, isListening, isMobile, isRecordingEL, isStrikethrough, isUnderline,
    judgeMood, lastSelectedRef, loadGoogleFont,
    magnifierBorderColor, magnifierGradientEnd, magnifierGradientStart,
    marginBottom, marginLeft, marginRight, marginTop, mirrorAngle, mirrorElement, moveLayerDown, moveLayerUp,
    pageBackground, pageNumberFormat, pageNumberPosition, pageNumberStart, pageNumberStyle, pageNumbersEnabled,
    pageSize, pageSizeScope, paragraphSpaceAfter, paragraphSpaceBefore,
    photoEditCanvasRef, photoEditDrawMode, photoEditDrawings, photoEditImage, photoEditLoading, photoEditPrompt, photoEditResult,
    planLimits, qrText, replaceInDocument, replaceText, rotateElement, rulerVisible, selectedElement,
    setActiveStopId, setActiveTool, setAiAspectRatio, setAiImagePro, setAiPreview, setAiPrompt, setAiReference, setAiTargetShape,
    setCalcCopied, setCalcExpr, setCalcResult, setCanvasElements,
    setChartColors, setChartData, setChartImage, setChartLabels, setChartTitle, setChartType,
    setColorTarget, setColumnCount, setColumnGap,
    setCurrentBulletStyle, setCurrentColor, setCurrentFont, setCurrentFontSize, setCurrentLineHeight, setCurrentNumberStyle,
    setCustomColor, setCustomHeight, setCustomWidth, setDocument, setDrawOpacity, setDrawSize,
    setEditingChartId, setEditingShortcut, setEraserDragMode, setEraserSize, setExportQuality,
    setFindScope, setFindText, setFirstLineIndent, setFontSearch,
    setFooterEven, setFooterOdd, setFooterText, setGradientAngle, setGradientEnd, setGradientStart, setGradientStops,
    setGridSize, setGridVisible, setHeaderEven, setHeaderFooterMode, setHeaderOdd, setHeaderText,
    setHexInput, setHighlighterColor,
    setIndentBottom, setIndentLeft, setIndentRight, setIndentTop,
    setIsBold, setIsDrawingOnPhoto, setIsItalic, setIsStrikethrough, setIsUnderline,
    setJudgeMood, setMagnifierBorderColor, setMagnifierGradientEnd, setMagnifierGradientStart,
    setMarginBottom, setMarginLeft, setMarginRight, setMarginTop, setMirrorAngle, setPageBackground,
    setPageNumberFormat, setPageNumberPosition, setPageNumberStart, setPageNumberStyle, setPageSize, setPageSizeScope,
    setParagraphSpaceAfter, setParagraphSpaceBefore,
    setPhotoEditDrawMode, setPhotoEditDrawings, setPhotoEditImage, setPhotoEditPrompt, setPhotoEditResult,
    setQrText, setReplaceText, setRulerVisible, setSelectedElement, setShortcutSearch,
    setShowBulletList, setShowCalculator, setShowChatSettings, setShowColor, setShowColumns, setShowCreateImage,
    setShowDraw, setShowEmoji, setShowEraser, setShowExport, setShowFindReplace, setShowFont, setShowFootnote,
    setShowGraphic, setShowGrid, setShowHeaderFooter, setShowIndent, setShowLayers, setShowLineSpacing,
    setShowMargins, setShowMirror, setShowNumberedList, setShowPageColor, setShowPageNumbers, setShowPageSize,
    setShowParagraph, setShowPhotoEdit, setShowPunctuation, setShowQRCode, setShowRuler, setShowShapes,
    setShowShortcuts, setShowSignature, setShowStyles, setShowTOC, setShowTable, setShowTemplates,
    setShowTextSize, setShowTranslate, setShowUpgradeModal, setShowVoiceInput, setShowWatermark, setShowWordType, setShowZoom,
    setSnapToGrid, setSpellCheckEnabled, setTableCols, setTableRows, setTranslateLang, setTranslateText,
    setUpgradeReason, setUseMagnifierGradient, setVoiceTranscript,
    setWatermarkColor, setWatermarkOpacity, setWatermarkText, setZetaCustomPrompt, setZetaEmoji, setZetaMood,
    setZoomLevel, setZoomRadius,
    shortcutSearch, shortcuts,
    showBulletList, showCalculator, showChatSettings, showColor, showColumns, showCreateImage,
    showDraw, showEmoji, showEraser, showExport, showFindReplace, showFont, showFootnote,
    showGraphic, showGrid, showHeaderFooter, showIndent, showLayers, showLineSpacing,
    showMargins, showMirror, showNumberedList, showPageColor, showPageNumbers, showPageSize,
    showParagraph, showPhotoEdit, showPunctuation, showQRCode, showRuler, showShapes,
    showShortcuts, showSignature, showStyles, showTOC, showTable, showTemplates,
    showTextSize, showTranslate, showVoiceInput, showWatermark, showWordType, showZoom,
    signatureCanvasRef, signatureData, snapToGrid, spellCheckEnabled,
    startElevenLabsSTT, startListening, stopElevenLabsSTT, stopListening,
    tableCols, tableRows, toggleLayerLock, toggleLayerVisibility, togglePageNumbers,
    translateElementId, translateLang, translateLoading, translateResult, translateText,
    updatePageNumberSettings, updateShortcut, useMagnifierGradient, voiceTranscript,
    watermarkColor, watermarkOpacity, watermarkText,
    zetaCustomPrompt, zetaEmoji, zetaMood, zoomLevel, zoomRadius,
  } = useContext(EditorStateContext);
  const { t, language } = useLanguage();
  const filteredFonts = allFonts.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase()));

  return (
    <>    {showDraw && <DraggablePanel title={t('pencil')} onClose={() => setShowDraw(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="space-y-3 w-48">
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Size: {drawSize}px</label><input type="range" min="1" max="20" value={drawSize} onChange={e => setDrawSize(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Opacity: {drawOpacity}%</label><input type="range" min="10" max="100" value={drawOpacity} onChange={e => setDrawOpacity(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <div className="flex gap-1.5 flex-wrap">{PRESET_COLORS.slice(0, 8).map(c => <button key={c} onClick={() => setCurrentColor(c)} className={`w-6 h-6 rounded-md border ${currentColor === c ? 'ring-2 ring-white scale-110' : 'border-white/10'} transition-transform`} style={{ background: c }} />)}</div>
      </div>
    </DraggablePanel>}
    {showEraser && <DraggablePanel title={t('eraser')} onClose={() => setShowEraser(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="space-y-3 w-48">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--zet-text)' }}>
          <input type="checkbox" checked={eraserDragMode} onChange={e => setEraserDragMode(e.target.checked)} className="rounded" />
          Drag Mode (Sürükle)
        </label>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Size: {eraserSize}px</label><input type="range" min="5" max="50" value={eraserSize} onChange={e => setEraserSize(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <div className="flex items-center justify-center p-3 rounded" style={{ background: 'var(--zet-bg)' }}><div className="rounded-full border-2 border-dashed" style={{ width: eraserSize * 2, height: eraserSize * 2, borderColor: 'var(--zet-primary-light)' }} /></div>
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{eraserDragMode ? 'Çizerek sil' : 'Tıklayarak sil'}</p>
      </div>
    </DraggablePanel>}
    <ColorPickerPanel />
    {showTextSize && <DraggablePanel title={t('textSize')} onClose={() => setShowTextSize(false)} initialPosition={{ x: isMobile ? 20 : 370, y: 100 }}>
      <div className="space-y-3 w-48">
        {/* Slider in pt (6–96pt), stored internally as px: px = pt * 96/72 */}
        <input type="range" min="6" max="96" step="1" value={Math.round(currentFontSize * 72 / 96)} onChange={e => { const px = Math.round(Number(e.target.value) * 96 / 72); setCurrentFontSize(px); applyInlineStyle('fontSize', px); }} className="w-full accent-blue-500" />
        <div className="flex items-center gap-2">
          <input type="number" min="6" max="144" step="1" value={Math.round(currentFontSize * 72 / 96)} onChange={e => { const px = Math.round(Math.max(6, Number(e.target.value) || 12) * 96 / 72); setCurrentFontSize(px); applyInlineStyle('fontSize', px); }} className="zet-input w-16 text-center text-sm" />
          <span className="text-sm" style={{ color: 'var(--zet-text)' }}>pt</span>
        </div>
        <div className="flex flex-wrap gap-1">{[8,9,10,11,12,14,16,18,20,24,28,32,36,48,72].map(pt => (<button key={pt} onClick={() => { const px = Math.round(pt * 96/72); setCurrentFontSize(px); applyInlineStyle('fontSize', px); }} className={`text-xs px-1.5 py-0.5 rounded transition-colors ${Math.round(currentFontSize*72/96) === pt ? 'glow-sm' : 'hover:bg-white/10'}`} style={{ background: Math.round(currentFontSize*72/96) === pt ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}>{pt}</button>))}</div>
        <div className="p-2 rounded text-center" style={{ background: 'var(--zet-bg)' }}><span style={{ fontSize: Math.min(currentFontSize, 48), color: 'var(--zet-text)', fontFamily: currentFont }}>Aa</span></div>
      </div>
    </DraggablePanel>}
    {showFont && <DraggablePanel title={`${t('font')} (${allFonts.length}+)`} onClose={() => setShowFont(false)} initialPosition={{ x: isMobile ? 20 : 420, y: 100 }}>
      <div className="w-64">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'var(--zet-text-muted)' }} />
          <input placeholder={`Font ara... (${allFonts.length}+ font)`} value={fontSearch} onChange={e => setFontSearch(e.target.value)} className="zet-input pl-7 text-xs w-full" />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-0.5" onScroll={e => {
          const top = e.target.scrollTop;
          const startIdx = Math.max(0, Math.floor(top / 30) - 3);
          filteredFonts.slice(startIdx, startIdx + 20).forEach(f => loadGoogleFont(f));
        }}>
          {filteredFonts.slice(0, fontSearch ? 500 : 300).map(f => (
            <button key={f}
              onClick={() => { loadGoogleFont(f); setCurrentFont(f); applyInlineStyle('fontFamily', f); setShowFont(false); }}
              onMouseEnter={() => loadGoogleFont(f)}
              className={`w-full text-left px-2 py-1.5 rounded transition-colors ${currentFont === f ? 'glow-sm' : 'hover:bg-white/5'}`}
              style={{ background: currentFont === f ? 'var(--zet-primary)' : 'transparent', color: 'var(--zet-text)', fontFamily: f, fontSize: 13 }}
            >
              {f}
            </button>
          ))}
        </div>
        {filteredFonts.length > 100 && <p className="text-center text-xs mt-1" style={{ color: 'var(--zet-text-muted)' }}>Arama ile daralt ({filteredFonts.length} sonuç)</p>}
      </div>
    </DraggablePanel>}
    {showLineSpacing && <DraggablePanel title={t('lineSpacing')} onClose={() => setShowLineSpacing(false)} initialPosition={{ x: isMobile ? 20 : 300, y: 100 }}>
      <div className="space-y-2 w-48">
        {LINE_SPACINGS.map(s => <button key={s} onClick={() => { setCurrentLineHeight(s); applyInlineStyle('lineHeight', s); setShowLineSpacing(false); }}
          className={`w-full p-2 rounded text-left text-sm transition-colors ${currentLineHeight === s ? 'glow-sm' : 'hover:bg-white/5'}`}
          style={{ background: currentLineHeight === s ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}>{s}x</button>)}
      </div>
    </DraggablePanel>}
    {showWordType && <DraggablePanel title={t('wordType')} onClose={() => setShowWordType(false)} initialPosition={{ x: isMobile ? 20 : 300, y: 100 }}>
      <div className="space-y-2 w-52">
        <div className="grid grid-cols-2 gap-2">
          <button data-testid="toggle-bold" onClick={() => { setIsBold(!isBold); applyInlineStyle('bold', !isBold); }} className={`flex items-center gap-2 p-2.5 rounded text-sm transition-colors ${isBold ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: isBold ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}><Bold className="h-4 w-4" /> Bold</button>
          <button data-testid="toggle-italic" onClick={() => { setIsItalic(!isItalic); applyInlineStyle('italic', !isItalic); }} className={`flex items-center gap-2 p-2.5 rounded text-sm transition-colors ${isItalic ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: isItalic ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}><Italic className="h-4 w-4" /> Italic</button>
          <button data-testid="toggle-underline" onClick={() => { setIsUnderline(!isUnderline); applyInlineStyle('underline', !isUnderline); }} className={`flex items-center gap-2 p-2.5 rounded text-sm transition-colors ${isUnderline ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: isUnderline ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}><Underline className="h-4 w-4" /> Underline</button>
          <button data-testid="toggle-strikethrough" onClick={() => { setIsStrikethrough(!isStrikethrough); applyInlineStyle('strikethrough', !isStrikethrough); }} className={`flex items-center gap-2 p-2.5 rounded text-sm transition-colors ${isStrikethrough ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: isStrikethrough ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}><Strikethrough className="h-4 w-4" /> Strike</button>
        </div>
      </div>
    </DraggablePanel>}
    {showPageSize && <DraggablePanel title={t('pageSize')} onClose={() => setShowPageSize(false)} initialPosition={{ x: isMobile ? 20 : 320, y: 200 }}>
      <div className="space-y-2 w-52">
        {/* Scope selector */}
        <div className="flex rounded overflow-hidden border" style={{ borderColor: 'var(--zet-border)' }}>
          <button onClick={() => setPageSizeScope('current')} className="flex-1 py-1.5 text-xs transition-colors" style={{ background: pageSizeScope === 'current' ? 'var(--zet-primary)' : 'var(--zet-bg)', color: pageSizeScope === 'current' ? '#fff' : 'var(--zet-text-muted)' }}>
            Yalnızca bu sayfa
          </button>
          <button onClick={() => setPageSizeScope('all')} className="flex-1 py-1.5 text-xs transition-colors" style={{ background: pageSizeScope === 'all' ? 'var(--zet-primary)' : 'var(--zet-bg)', color: pageSizeScope === 'all' ? '#fff' : 'var(--zet-text-muted)' }}>
            Tüm sayfalar
          </button>
        </div>
        {PAGE_SIZES.map(s => <button key={s.name} onClick={() => {
          const oldW = pageSize.width, oldH = pageSize.height;
          const sx = s.width / oldW, sy = s.height / oldH;
          setPageSize(s);
          const scaleEls = els => els.map(el => ({ ...el, x: el.x * sx, y: el.y * sy, ...(el.width != null ? { width: el.width * sx } : {}), ...(el.height != null ? { height: el.height * sy } : {}), ...(el.fontSize != null ? { fontSize: Math.round(el.fontSize * sx) } : {}) }));
          setCanvasElements(prev => scaleEls(prev));
          setDocument(prev => {
            if (!prev) return prev;
            const pages = [...(prev.pages || [])];
            if (pageSizeScope === 'all') {
              return { ...prev, pages: pages.map(p => ({ ...p, pageSize: s, elements: scaleEls(p.elements || []) })) };
            }
            if (pages[currentPage]) pages[currentPage] = { ...pages[currentPage], pageSize: s };
            return { ...prev, pages };
          });
          setShowPageSize(false);
        }} className={`w-full p-2 rounded text-left text-sm transition-colors ${pageSize.name === s.name ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: pageSize.name === s.name ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}>{s.name} <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{s.width}×{s.height}</span></button>)}
        <div className="flex gap-1 pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}><input type="number" value={customWidth} onChange={e => setCustomWidth(Number(e.target.value))} className="zet-input flex-1 text-xs" placeholder="W" /><input type="number" value={customHeight} onChange={e => setCustomHeight(Number(e.target.value))} className="zet-input flex-1 text-xs" placeholder="H" /></div>
        <button onClick={() => {
          const s = { name: 'Custom', width: customWidth, height: customHeight };
          const oldW = pageSize.width, oldH = pageSize.height;
          const sx = s.width / oldW, sy = s.height / oldH;
          setPageSize(s);
          const scaleEls = els => els.map(el => ({ ...el, x: el.x * sx, y: el.y * sy, ...(el.width != null ? { width: el.width * sx } : {}), ...(el.height != null ? { height: el.height * sy } : {}), ...(el.fontSize != null ? { fontSize: Math.round(el.fontSize * sx) } : {}) }));
          setCanvasElements(prev => scaleEls(prev));
          setDocument(prev => {
            if (!prev) return prev;
            const pages = [...(prev.pages || [])];
            if (pageSizeScope === 'all') {
              return { ...prev, pages: pages.map(p => ({ ...p, pageSize: s, elements: scaleEls(p.elements || []) })) };
            }
            if (pages[currentPage]) pages[currentPage] = { ...pages[currentPage], pageSize: s };
            return { ...prev, pages };
          });
          setShowPageSize(false);
        }} className="zet-btn w-full text-sm">Apply</button>
      </div>
    </DraggablePanel>}

    <MagnifierPanel />
    {showCreateImage && <AIImagePanel aiTargetShape={aiTargetShape} creditsRemaining={creditsRemaining} dailyCredits={dailyCredits} aiImagePro={aiImagePro} setAiImagePro={setAiImagePro} planLimits={planLimits} setUpgradeReason={setUpgradeReason} setShowUpgradeModal={setShowUpgradeModal} aiAspectRatio={aiAspectRatio} setAiAspectRatio={setAiAspectRatio} aiReference={aiReference} setAiReference={setAiReference} aiPreview={aiPreview} aiMimeType={aiMimeType} addAiImageToCanvas={addAiImageToCanvas} aiPrompt={aiPrompt} setAiPrompt={setAiPrompt} generateAIImage={generateAIImage} aiGenerating={aiGenerating} setShowPhotoEdit={setShowPhotoEdit} t={t} isMobile={isMobile} onClose={() => { setShowCreateImage(false); setAiPreview(null); setAiTargetShape(null); }} />}
    {showTranslate && <DraggablePanel title={t('translate')} onClose={() => setShowTranslate(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 120 }}>
      <div className="w-72 space-y-3">
        <textarea data-testid="translate-source-text" value={translateText} onChange={e => setTranslateText(e.target.value)} rows={3} className="zet-input text-xs w-full resize-none" placeholder="Select text or type here..." />
        <select data-testid="translate-lang-select" value={translateLang} onChange={e => setTranslateLang(e.target.value)} className="zet-input text-sm w-full">{TRANSLATE_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select>
        <button data-testid="translate-btn" onClick={handleTranslate} disabled={translateLoading || !translateText.trim()} className="zet-btn w-full flex items-center justify-center gap-1.5 text-sm py-2">{translateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />} {t('translate')}</button>
        {translateResult && <div className="space-y-2"><div className="p-2 rounded text-sm" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)' }}>{translateResult}</div>
          {translateElementId && <button data-testid="translate-apply-btn" onClick={applyTranslation} className="zet-btn w-full flex items-center justify-center gap-1.5 text-sm py-2" style={{ background: '#4ca8ad' }}><Check className="h-4 w-4" /> Add</button>}
        </div>}
      </div>
    </DraggablePanel>}
    
    {/* Paragraph Alignment Panel */}
    <ParagraphPanel />

    {/* Page Color Panel */}
    {showPageColor && <DraggablePanel title="Page Color" onClose={() => setShowPageColor(false)} initialPosition={{ x: isMobile ? 20 : 300, y: 100 }}>
      <div className="space-y-3 w-52">
        <div className="grid grid-cols-6 gap-1.5">
          {['#FFFFFF', '#F5F5DC', '#FFFAF0', '#F0FFF0', '#F0F8FF', '#FFF0F5', '#1a1a2e', '#16213e', '#0f0f0f', '#1e1e1e', '#2d2d2d', '#3d3d3d'].map(c => (
            <button key={c} onClick={() => setPageBackground(c)} className={`w-7 h-7 rounded-md border ${pageBackground === c ? 'ring-2 ring-blue-500 scale-110' : 'border-white/10'} transition-transform`} style={{ background: c }} />
          ))}
        </div>
        <input type="color" value={pageBackground} onChange={e => setPageBackground(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
      </div>
    </DraggablePanel>}

    {/* Shapes Panel */}
    {showShapes && <DraggablePanel title="Şekiller" onClose={() => setShowShapes(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-64 space-y-2 max-h-[70vh] overflow-y-auto">
        {Array.from(new Set(SHAPE_LIST.map(s => s.group || 'Temel'))).map(group => (
          <div key={group}>
            <p className="text-[9px] font-semibold mb-1 px-1" style={{ color: 'var(--zet-text-muted)' }}>{group.toUpperCase()}</p>
            <div className="grid grid-cols-4 gap-1">
              {SHAPE_LIST.filter(s => (s.group || 'Temel') === group).map(shape => (
                <button
                  key={shape.id}
                  title={shape.label}
                  onClick={() => { setActiveTool(shape.id); setShowShapes(false); }}
                  className={`flex flex-col items-center justify-center gap-0.5 p-2 rounded transition-colors hover:bg-white/10 ${activeTool === shape.id ? 'bg-white/15' : ''}`}
                  style={{ border: activeTool === shape.id ? '1px solid var(--zet-primary)' : '1px solid var(--zet-border)' }}
                >
                  <span className="text-xs leading-none">{
                    { triangle:'▲', square:'■', circle:'●', ring:'○', star:'★', hexagon:'⬡', diamond:'◆', pentagon:'⬠', heart:'♥', arrow:'➔', parallelogram:'▱',
                      oval:'⬭', 'arrow-right':'→', 'arrow-left':'←', 'arrow-up':'↑', 'arrow-down':'↓', 'arrow-double':'↔',
                      star3:'⚡', star4:'✦', star6:'✡', bubble:'💬', 'bubble-left':'💬', 'diamond-flow':'◇', cylinder:'🛢',
                      'math-sum':'∑', 'math-pi':'π', 'math-sqrt':'√', 'math-inf':'∞', 'math-int':'∫',
                      'bracket-sq':'[]', 'brace-curly':'{}' }[shape.id] || '■'
                  }</span>
                  <span className="text-[7px] truncate w-full text-center" style={{ color: 'var(--zet-text-muted)' }}>{shape.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="text-[10px] pt-1 text-center" style={{ color: 'var(--zet-text-muted)' }}>Seçip tuvale tıklayın</p>
      </div>
    </DraggablePanel>}

    {/* Punctuation Panel */}
    {showPunctuation && <DraggablePanel title="Noktalama İşaretleri" onClose={() => setShowPunctuation(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 120 }}>
      <div className="w-60">
        <div className="flex flex-wrap gap-1">
          {PUNCTUATION_LIST.map((char, i) => (
            <button
              key={i}
              title={char}
              onMouseDown={(e) => {
                e.preventDefault(); // focus'u contenteditable'da tutar
                document.execCommand('insertText', false, char);
              }}
              className="w-8 h-8 rounded font-mono text-sm flex items-center justify-center hover:bg-white/15 transition-colors"
              style={{ border: '1px solid var(--zet-border)', color: 'var(--zet-text)' }}
            >
              {char}
            </button>
          ))}
        </div>
        <p className="text-[10px] mt-2 text-center" style={{ color: 'var(--zet-text-muted)' }}>Metin kutusunda imleci konumlandırın, ardından sembolü tıklayın</p>
      </div>
    </DraggablePanel>}

    {/* Photo Edit Panel */}
    <PhotoEditPanel />

    {/* Signature Panel */}
    {showSignature && <SignaturePanel signatureCanvasRef={signatureCanvasRef} handleSignatureMouseDown={handleSignatureMouseDown} handleSignatureMouseMove={handleSignatureMouseMove} handleSignatureMouseUp={handleSignatureMouseUp} clearSignature={clearSignature} addSignatureToCanvas={addSignatureToCanvas} signatureData={signatureData} handleSignaturePhotoUpload={handleSignaturePhotoUpload} isMobile={isMobile} onClose={() => { setShowSignature(false); clearSignature(); }} />}

    {/* Bullet List Panel */}
    {showBulletList && <DraggablePanel title="Madde İşaretli Liste" onClose={() => setShowBulletList(false)} initialPosition={{ x: isMobile ? 20 : 300, y: 100 }}>
      <div className="w-52 space-y-3">
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Liste stili seç</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { style: 'disc',   label: '●', desc: 'Dolu' },
            { style: 'circle', label: '○', desc: 'Boş' },
            { style: 'square', label: '▪', desc: 'Kare' },
            { style: 'disclosure-closed', label: '›', desc: 'Ok' },
            { style: 'none',   label: '—', desc: 'Tire' },
          ].map(({ style, label, desc }) => (
            <button key={style} onClick={() => {
              setCurrentBulletStyle(style);
              applyListFormat('ul', style);
              setShowBulletList(false);
            }} className={`flex flex-col items-center gap-0.5 p-2 rounded transition-colors ${currentBulletStyle === style ? 'glow-sm' : 'hover:bg-white/10'}`}
              style={{ background: currentBulletStyle === style ? 'var(--zet-primary)' : 'var(--zet-bg)', border: '1px solid var(--zet-border)', color: 'var(--zet-text)' }}>
              <span className="text-base leading-none">{label}</span>
              <span className="text-[10px]" style={{ color: 'var(--zet-text-muted)' }}>{desc}</span>
            </button>
          ))}
        </div>
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--zet-text-muted)' }}>TAB = alt liste &nbsp;·&nbsp; Shift+TAB = geri</p>
          <button onClick={() => {
            const target = selectedElement || lastSelectedRef.current;
            if (!target) return;
            const el = canvasElements.find(e => e.id === target);
            if (!el) return;
            const cleaned = (el.htmlContent || el.content || '').replace(/<\/?[uo]l[^>]*>/gi, '').replace(/<li[^>]*>/gi, '').replace(/<\/li>/gi, '\n').replace(/\n+/g, '\n').trim();
            setCanvasElements(prev => { const u = prev.map(e => e.id === target ? { ...e, htmlContent: cleaned, content: cleaned.replace(/<[^>]*>/g, '') } : e); handleSaveHistory(u); return u; });
            setShowBulletList(false);
          }} className="zet-btn w-full text-xs py-1.5" style={{ color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}>Listeyi Kaldır</button>
        </div>
      </div>
    </DraggablePanel>}

    {/* Numbered List Panel */}
    {showNumberedList && <DraggablePanel title="Numaralı Liste" onClose={() => setShowNumberedList(false)} initialPosition={{ x: isMobile ? 20 : 300, y: 100 }}>
      <div className="w-52 space-y-3">
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Numara stili seç</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { style: 'decimal',      label: '1.', desc: 'Sayı' },
            { style: 'lower-alpha',  label: 'a.', desc: 'Küçük' },
            { style: 'upper-alpha',  label: 'A.', desc: 'Büyük' },
            { style: 'lower-roman',  label: 'i.', desc: 'Roma k.' },
            { style: 'upper-roman',  label: 'I.', desc: 'Roma B.' },
            { style: 'decimal-leading-zero', label: '01.', desc: 'Sıfırlı' },
          ].map(({ style, label, desc }) => (
            <button key={style} onClick={() => {
              setCurrentNumberStyle(style);
              applyListFormat('ol', style);
              setShowNumberedList(false);
            }} className={`flex flex-col items-center gap-0.5 p-2 rounded transition-colors ${currentNumberStyle === style ? 'glow-sm' : 'hover:bg-white/10'}`}
              style={{ background: currentNumberStyle === style ? 'var(--zet-primary)' : 'var(--zet-bg)', border: '1px solid var(--zet-border)', color: 'var(--zet-text)' }}>
              <span className="text-sm font-mono leading-none">{label}</span>
              <span className="text-[10px]" style={{ color: 'var(--zet-text-muted)' }}>{desc}</span>
            </button>
          ))}
        </div>
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--zet-text-muted)' }}>TAB = alt liste &nbsp;·&nbsp; Shift+TAB = geri</p>
          <button onClick={() => {
            const target = selectedElement || lastSelectedRef.current;
            if (!target) return;
            const el = canvasElements.find(e => e.id === target);
            if (!el) return;
            const cleaned = (el.htmlContent || el.content || '').replace(/<\/?[uo]l[^>]*>/gi, '').replace(/<li[^>]*>/gi, '').replace(/<\/li>/gi, '\n').replace(/\n+/g, '\n').trim();
            setCanvasElements(prev => { const u = prev.map(e => e.id === target ? { ...e, htmlContent: cleaned, content: cleaned.replace(/<[^>]*>/g, '') } : e); handleSaveHistory(u); return u; });
            setShowNumberedList(false);
          }} className="zet-btn w-full text-xs py-1.5" style={{ color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}>Listeyi Kaldır</button>
        </div>
      </div>
    </DraggablePanel>}

    {/* Indent Panel */}
    {showIndent && <DraggablePanel title="Girinti" onClose={() => setShowIndent(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="w-56 space-y-2">
        {[
          { label: 'Sol', value: indentLeft, set: setIndentLeft, key: 'paddingLeft' },
          { label: 'Sağ', value: indentRight, set: setIndentRight, key: 'paddingRight' },
          { label: 'Üst', value: indentTop, set: setIndentTop, key: 'paddingTop' },
          { label: 'Alt', value: indentBottom, set: setIndentBottom, key: 'paddingBottom' },
        ].map(({ label, value, set, key }) => (
          <div key={key}>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: 'var(--zet-text)' }}>{label}</label>
              <span className="text-xs font-mono" style={{ color: 'var(--zet-primary)' }}>{value}px</span>
            </div>
            <input type="range" min="0" max="120" value={value} onChange={e => {
              const v = parseInt(e.target.value);
              set(v);
              const target = selectedElement || lastSelectedRef.current;
              if (target) setCanvasElements(prev => { const u = prev.map(el => el.id === target && el.type === 'text' ? { ...el, [key]: v } : el); handleSaveHistory(u); return u; });
            }} className="w-full accent-blue-500" />
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <button onClick={() => {
            setIndentLeft(0); setIndentRight(0); setIndentTop(0); setIndentBottom(0);
            const target = selectedElement || lastSelectedRef.current;
            if (target) setCanvasElements(prev => { const u = prev.map(el => el.id === target && el.type === 'text' ? { ...el, paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 } : el); handleSaveHistory(u); return u; });
          }} className="zet-btn flex-1 py-1.5 text-xs">Sıfırla</button>
          <button data-testid="indent-apply-all" onClick={() => {
            setCanvasElements(prev => { const u = prev.map(el => el.type === 'text' ? { ...el, paddingLeft: indentLeft, paddingRight: indentRight, paddingTop: indentTop, paddingBottom: indentBottom } : el); handleSaveHistory(u); return u; });
            setDocument(prev => {
              if (!prev?.pages) return prev;
              return { ...prev, pages: prev.pages.map((page, idx) => idx === currentPage ? page : { ...page, elements: (page.elements || []).map(el => el.type === 'text' ? { ...el, paddingLeft: indentLeft, paddingRight: indentRight, paddingTop: indentTop, paddingBottom: indentBottom } : el) }) };
            });
          }} className="zet-btn flex-1 py-1.5 text-xs" style={{ background: 'var(--zet-primary)', color: '#fff' }}>Tümüne</button>
        </div>
      </div>
    </DraggablePanel>}

    {/* Margins Panel */}
    {showMargins && <DraggablePanel title="Kenar Boşlukları" onClose={() => setShowMargins(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="w-56 space-y-2">
        {[
          { label: 'Üst',  value: marginTop,    set: setMarginTop },
          { label: 'Alt',  value: marginBottom, set: setMarginBottom },
          { label: 'Sol',  value: marginLeft,   set: setMarginLeft },
          { label: 'Sağ',  value: marginRight,  set: setMarginRight },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: 'var(--zet-text)' }}>{label}</label>
              <span className="text-xs font-mono" style={{ color: 'var(--zet-primary)' }}>{value}px</span>
            </div>
            <input type="range" min="0" max="200" value={value} onChange={e => set(parseInt(e.target.value))} className="w-full accent-blue-500" />
          </div>
        ))}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <p className="text-xs mb-1.5" style={{ color: 'var(--zet-text-muted)' }}>Hazır Ayarlar</p>
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: 'Normal',   t: 95,  b: 95,  l: 95,  r: 95 },
              { label: 'Dar',      t: 48,  b: 48,  l: 48,  r: 48 },
              { label: 'Geniş',   t: 189, b: 189, l: 189, r: 189 },
              { label: 'Senaryo', t: 95,  b: 95,  l: 144, r: 95 },
              { label: 'Akademik',t: 95,  b: 95,  l: 121, r: 95 },
              { label: 'Kitap',   t: 76,  b: 76,  l: 113, r: 95 },
            ].map(({ label, t, b, l, r }) => (
              <button key={label} onClick={() => {
                setMarginTop(t); setMarginBottom(b); setMarginLeft(l); setMarginRight(r);
                const w = pageSize.width - l - r;
                setCanvasElements(prev => prev.map(el => el.type === 'text' ? { ...el, x: l, width: w } : el));
                if (label === 'Senaryo') { setCurrentFont('Courier New'); setCurrentFontSize(16); }
              }} className="zet-btn text-xs py-1.5">{label}</button>
            ))}
          </div>
        </div>
        <button data-testid="margins-apply-all" onClick={() => {
          const w = pageSize.width - marginLeft - marginRight;
          setCanvasElements(prev => { const u = prev.map(el => el.type === 'text' ? { ...el, x: marginLeft, width: w } : el); handleSaveHistory(u); return u; });
          setDocument(prev => {
            if (!prev?.pages) return prev;
            return { ...prev, pages: prev.pages.map((page, idx) => idx === currentPage ? page : { ...page, elements: (page.elements || []).map(el => el.type === 'text' ? { ...el, x: marginLeft, width: w } : el) }) };
          });
        }} className="zet-btn w-full py-1.5 text-xs font-medium" style={{ background: 'var(--zet-primary)', color: '#fff' }}>Tümüne Uygula</button>
      </div>
    </DraggablePanel>}

    {/* Columns Panel */}
    {showColumns && <DraggablePanel title="Sütun Düzeni" onClose={() => setShowColumns(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="w-56 space-y-3">
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Sütun Aralığı: {columnGap}px</label>
          <input type="range" min="10" max="80" value={columnGap} onChange={e => setColumnGap(parseInt(e.target.value))} className="w-full accent-blue-500" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(n => (
            <button key={n} onClick={() => {
              setColumnCount(n);
              if (n === 1) { setShowColumns(false); return; }
              const availW = pageSize.width - marginLeft - marginRight;
              const colW = Math.round((availW - (n - 1) * columnGap) / n);
              const cols = Array.from({ length: n }, (_, i) => ({
                id: `col_${Date.now()}_${i}`, type: 'text',
                x: marginLeft + i * (colW + columnGap),
                y: marginTop, content: '', htmlContent: '',
                fontSize: currentFontSize, fontFamily: currentFont, color: currentColor,
                width: colW, lineHeight: currentLineHeight, textAlign: 'left',
              }));
              const updated = [...canvasElements, ...cols];
              setCanvasElements(updated);
              handleSaveHistory(updated);
              setSelectedElement(cols[0].id);
              setShowColumns(false);
            }}
              className="zet-btn py-2.5 text-sm font-semibold"
              style={{ background: columnCount === n ? 'var(--zet-primary)' : 'var(--zet-bg)', color: columnCount === n ? '#fff' : 'var(--zet-text)', border: '1px solid var(--zet-border)' }}>
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>
          Sütun genişliği: ~{Math.round((pageSize.width - marginLeft - marginRight - (columnCount - 1) * columnGap) / Math.max(columnCount, 1))}px
        </p>
      </div>
    </DraggablePanel>}

    {/* Calculator Panel */}
    <CalculatorPanel />

    {/* Chat Settings Panel */}
    <ChatSettingsPanel />

    {/* Chart Panel */}
    {showGraphic && <ChartPanel editingChartId={editingChartId} chartType={chartType} setChartType={setChartType} chartTitle={chartTitle} setChartTitle={setChartTitle} chartLabels={chartLabels} setChartLabels={setChartLabels} chartData={chartData} setChartData={setChartData} chartColors={chartColors} setChartColors={setChartColors} chartImage={chartImage} setChartImage={setChartImage} gradientStart={gradientStart} gradientEnd={gradientEnd} setGradientStart={setGradientStart} setGradientEnd={setGradientEnd} createChart={createChart} isMobile={isMobile} onClose={() => { setShowGraphic(false); setEditingChartId(null); }} />}

    {/* Shortcuts Panel */}
    {showShortcuts && <DraggablePanel title="Keyboard Shortcuts" onClose={() => { setShowShortcuts(false); setShortcutSearch(''); }} initialPosition={{ x: isMobile ? 20 : 280, y: 60 }}>
      <div className="w-80 space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'var(--zet-text-muted)' }} />
          <input
            placeholder="Search tools..."
            value={shortcutSearch}
            onChange={(e) => setShortcutSearch(e.target.value)}
            className="zet-input pl-7 text-xs w-full"
          />
        </div>
        <div className="max-h-72 overflow-y-auto space-y-1">
          {TOOLS.filter(tool => 
            !shortcutSearch || 
            tool.nameKey.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
            tool.id.toLowerCase().includes(shortcutSearch.toLowerCase())
          ).map(tool => {
            const currentKey = Object.keys(shortcuts).find(k => shortcuts[k] === tool.id);
            return (
              <div key={tool.id} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--zet-bg)' }}>
                <div className="flex items-center gap-2">
                  <tool.icon className="h-4 w-4" style={{ color: 'var(--zet-text)' }} />
                  <span className="text-sm" style={{ color: 'var(--zet-text)' }}>{tool.nameKey}</span>
                </div>
                {editingShortcut === tool.id ? (
                  <input autoFocus className="zet-input w-12 text-center text-xs font-mono" maxLength={1} onKeyDown={e => { if (e.key.length === 1) { updateShortcut(e.key); } else if (e.key === 'Escape') setEditingShortcut(null); }} onBlur={() => setEditingShortcut(null)} placeholder="?" />
                ) : (
                  <button onClick={() => setEditingShortcut(tool.id)} className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'var(--zet-bg-card)', color: currentKey ? 'var(--zet-primary)' : 'var(--zet-text-muted)' }}>{currentKey || '—'}</button>
                )}
              </div>
            );
          })}
        </div>
        <div className="pt-2 border-t text-xs" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text-muted)' }}>
          <p>Click a key to edit. Press the new key to assign.</p>
          <p className="mt-1">Delete/Backspace: Delete selected element</p>
          <p>Escape: Deselect</p>
        </div>
      </div>
    </DraggablePanel>}

    {/* Table Panel */}
    {showTable && <DraggablePanel title="Table" onClose={() => setShowTable(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-52 space-y-3">
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Rows: {tableRows}</label><input type="range" min="1" max="10" value={tableRows} onChange={e => setTableRows(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Columns: {tableCols}</label><input type="range" min="1" max="10" value={tableCols} onChange={e => setTableCols(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <div className="p-2 rounded flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${Math.min(tableCols, 5)}, 1fr)` }}>
            {Array.from({ length: Math.min(tableRows, 5) * Math.min(tableCols, 5) }).map((_, i) => (
              <div key={i} className="w-4 h-3 border" style={{ borderColor: 'var(--zet-text-muted)', background: 'var(--zet-bg-card)' }} />
            ))}
          </div>
        </div>
        <button onClick={createTable} className="zet-btn w-full flex items-center justify-center gap-2 py-2"><Table className="h-4 w-4" /> Create Table</button>
      </div>
    </DraggablePanel>}

    {/* Layers Panel - with drag-to-reorder */}
    {showLayers && <DraggablePanel title="Layers" onClose={() => setShowLayers(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 60 }}>
      <div className="w-64 space-y-1 max-h-80 overflow-y-auto">
        {[...canvasElements].reverse().map((el, i) => (
          <div key={el.id} data-testid={`layer-item-${el.id}`}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', el.id); e.currentTarget.style.opacity = '0.4'; }}
            onDragEnd={(e) => { e.currentTarget.style.opacity = '1'; }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderTop = '2px solid #4ca8ad'; }}
            onDragLeave={(e) => { e.currentTarget.style.borderTop = 'none'; }}
            onDrop={(e) => {
              e.preventDefault(); e.currentTarget.style.borderTop = 'none';
              const dragId = e.dataTransfer.getData('text/plain');
              if (dragId === el.id) return;
              const updated = [...canvasElements];
              const fromIdx = updated.findIndex(x => x.id === dragId);
              const toIdx = updated.findIndex(x => x.id === el.id);
              if (fromIdx === -1 || toIdx === -1) return;
              const [moved] = updated.splice(fromIdx, 1);
              updated.splice(toIdx, 0, moved);
              setCanvasElements(updated); history.push(updated);
            }}
            className={`flex items-center justify-between p-2 rounded text-xs cursor-grab active:cursor-grabbing ${selectedElement === el.id ? 'ring-1 ring-blue-500' : ''}`} style={{ background: 'var(--zet-bg)' }} onClick={() => setSelectedElement(el.id)}>
            <div className="flex items-center gap-2 truncate flex-1">
              <span className="w-4 text-center" style={{ color: 'var(--zet-text-muted)' }}>{canvasElements.length - i}</span>
              <span className="truncate" style={{ color: el.hidden ? 'var(--zet-text-muted)' : 'var(--zet-text)' }}>{el.type === 'text' ? (el.content?.slice(0, 20) || 'Text') : el.type === 'table' ? 'Table' : el.type}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(el.id); }} className="p-1 rounded hover:bg-white/10" title={el.hidden ? 'Show' : 'Hide'}>{el.hidden ? <EyeOff className="h-3 w-3" style={{ color: 'var(--zet-text-muted)' }} /> : <Eye className="h-3 w-3" style={{ color: 'var(--zet-text)' }} />}</button>
              <button onClick={(e) => { e.stopPropagation(); toggleLayerLock(el.id); }} className="p-1 rounded hover:bg-white/10" title={el.locked ? 'Unlock' : 'Lock'}>{el.locked ? <Lock className="h-3 w-3" style={{ color: 'var(--zet-primary)' }} /> : <Unlock className="h-3 w-3" style={{ color: 'var(--zet-text-muted)' }} />}</button>
              <button onClick={(e) => { e.stopPropagation(); moveLayerUp(el.id); }} className="p-1 rounded hover:bg-white/10" title="Move Up"><ChevronUp className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
              <button onClick={(e) => { e.stopPropagation(); moveLayerDown(el.id); }} className="p-1 rounded hover:bg-white/10" title="Move Down"><ChevronDown className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
              <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} className="p-1 rounded hover:bg-red-500/20" title="Delete"><Trash2 className="h-3 w-3" style={{ color: '#f87171' }} /></button>
            </div>
          </div>
        ))}
        {canvasElements.length === 0 && <div className="text-center py-4 text-xs" style={{ color: 'var(--zet-text-muted)' }}>No layers</div>}
      </div>
    </DraggablePanel>}

    {/* Grid Panel */}
    {showGrid && <DraggablePanel title="Grid" onClose={() => setShowGrid(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-52 space-y-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--zet-text)' }}>
          <input type="checkbox" checked={gridVisible} onChange={e => setGridVisible(e.target.checked)} className="rounded" />
          Show Grid
        </label>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Grid Size: {gridSize}px</label><input type="range" min="10" max="50" value={gridSize} onChange={e => setGridSize(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--zet-text)' }}>
          <input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} className="rounded" />
          Snap to Grid
        </label>
      </div>
    </DraggablePanel>}

    {/* Ruler Panel */}
    {showRuler && <DraggablePanel title="Ruler" onClose={() => setShowRuler(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-48 space-y-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--zet-text)' }}>
          <input type="checkbox" checked={rulerVisible} onChange={e => setRulerVisible(e.target.checked)} className="rounded" />
          Show Rulers
        </label>
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Rulers help align elements precisely.</p>
      </div>
    </DraggablePanel>}

    {/* Templates Panel */}
    {showTemplates && <TemplatesPanel applyTemplate={applyTemplate} isMobile={isMobile} onClose={() => setShowTemplates(false)} />}

    {/* Export Panel */}
    {showExport && <ExportPanel handleExport={handleExport} exporting={exporting} exportQuality={exportQuality} setExportQuality={setExportQuality} importFromMS={importFromMS} isMobile={isMobile} onClose={() => setShowExport(false)} />}

    {/* QR Code Panel */}
    {showQRCode && <QRCodePanel qrText={qrText} setQrText={setQrText} createQRCode={createQRCode} isMobile={isMobile} onClose={() => setShowQRCode(false)} />}

    {/* Watermark Panel */}
    {showWatermark && <WatermarkPanel watermarkText={watermarkText} setWatermarkText={setWatermarkText} watermarkOpacity={watermarkOpacity} setWatermarkOpacity={setWatermarkOpacity} watermarkColor={watermarkColor} setWatermarkColor={setWatermarkColor} applyWatermark={applyWatermark} isMobile={isMobile} onClose={() => setShowWatermark(false)} />}

    {/* Page Numbers Panel */}
    {showPageNumbers && <PageNumbersPanel pageNumbersEnabled={pageNumbersEnabled} togglePageNumbers={togglePageNumbers} pageNumberPosition={pageNumberPosition} setPageNumberPosition={setPageNumberPosition} pageNumberFormat={pageNumberFormat} setPageNumberFormat={setPageNumberFormat} pageNumberStyle={pageNumberStyle} setPageNumberStyle={setPageNumberStyle} pageNumberStart={pageNumberStart} setPageNumberStart={setPageNumberStart} updatePageNumberSettings={updatePageNumberSettings} isMobile={isMobile} onClose={() => setShowPageNumbers(false)} />}

    {/* Header/Footer Panel */}
    {showHeaderFooter && <DraggablePanel title="Header & Footer" onClose={() => setShowHeaderFooter(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-72 space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setHeaderFooterMode('all')} className={`flex-1 py-1 rounded text-xs transition-colors ${headerFooterMode === 'all' ? 'zet-btn' : 'zet-btn-outline'}`}>Tüm Sayfalar</button>
          <button onClick={() => setHeaderFooterMode('odd-even')} className={`flex-1 py-1 rounded text-xs transition-colors ${headerFooterMode === 'odd-even' ? 'zet-btn' : 'zet-btn-outline'}`}>Tek/Çift</button>
        </div>
        {headerFooterMode === 'all' ? (<>
          <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Header</label><input type="text" value={headerText} onChange={e => setHeaderText(e.target.value)} placeholder="Header text" className="zet-input text-xs w-full" /></div>
          <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Footer</label><input type="text" value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="Footer text" className="zet-input text-xs w-full" /></div>
        </>) : (<>
          <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Tek Sayfa Header</label><input type="text" value={headerOdd} onChange={e => setHeaderOdd(e.target.value)} placeholder="Tek sayfa başlık" className="zet-input text-xs w-full" /></div>
          <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Çift Sayfa Header</label><input type="text" value={headerEven} onChange={e => setHeaderEven(e.target.value)} placeholder="Çift sayfa başlık" className="zet-input text-xs w-full" /></div>
          <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Tek Sayfa Footer</label><input type="text" value={footerOdd} onChange={e => setFooterOdd(e.target.value)} placeholder="Tek sayfa alt" className="zet-input text-xs w-full" /></div>
          <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Çift Sayfa Footer</label><input type="text" value={footerEven} onChange={e => setFooterEven(e.target.value)} placeholder="Çift sayfa alt" className="zet-input text-xs w-full" /></div>
        </>)}
        <button onClick={applyHeaderFooter} className="zet-btn w-full">Uygula</button>
      </div>
    </DraggablePanel>}

    {/* Paragraph Styles Panel */}
    {showStyles && <DraggablePanel title="Paragraf Stilleri" onClose={() => setShowStyles(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-56 space-y-1">
        <p className="text-xs mb-2" style={{ color: 'var(--zet-text-muted)' }}>İmlecin bulunduğu paragrafa stil uygular</p>
        {PARA_STYLES.map(style => (
          <button key={style.id} onMouseDown={e => e.preventDefault()} onClick={() => applyParaStyle(style)} className="w-full text-left px-3 py-2 rounded text-xs hover:bg-white/10 transition-colors border" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text)', fontWeight: style.bold ? 'bold' : 'normal', fontSize: style.fontSize > 20 ? 14 : 12 }}>
            <span style={{ fontSize: style.id === 'h1' ? 16 : style.id === 'h2' ? 14 : 12 }}>{style.label}</span>
            <span className="ml-2 opacity-50" style={{ fontWeight: 'normal', fontSize: 10 }}>{style.fontSize}px · {style.lineHeight}lh</span>
          </button>
        ))}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <label className="text-xs flex items-center gap-2 cursor-pointer" style={{ color: 'var(--zet-text)' }}>
            <input type="checkbox" checked={spellCheckEnabled} onChange={e => setSpellCheckEnabled(e.target.checked)} className="rounded" />
            Yazım Denetimi
          </label>
        </div>
      </div>
    </DraggablePanel>}

    {/* Footnote Panel */}
    {showFootnote && <DraggablePanel title="Dipnot" onClose={() => setShowFootnote(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-64 space-y-3">
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Seçili metne dipnot numarası ekler ve sayfanın altına dipnot alanı oluşturur.</p>
        <textarea id="footnote-text" placeholder="Dipnot metni..." rows={3} className="zet-input text-xs w-full resize-none" />
        <button onClick={() => {
          const text = document.getElementById('footnote-text')?.value?.trim();
          if (!text) return;
          const target = selectedElement || lastSelectedRef.current;
          const footnoteNum = (canvasElements.filter(e => e.footnoteNum).length) + 1;
          if (target) {
            // Insert superscript marker into selected text element
            const el = canvasElements.find(e => e.id === target);
            if (el?.type === 'text') {
              const marker = `<sup data-footnote-id="${footnoteNum}" style="color:#4ca8ad;font-size:0.7em;cursor:pointer">[${footnoteNum}]</sup>`;
              const updated = canvasElements.map(e => e.id === target ? { ...e, htmlContent: (e.htmlContent || e.content || '') + marker, content: (e.content || '') + `[${footnoteNum}]` } : e);
              setCanvasElements(updated);
              handleSaveHistory(updated);
            }
          }
          // Add footnote element at page bottom
          const fnEl = { id: `fn_${Date.now()}`, type: 'text', x: marginLeft, y: pageSize.height - marginBottom - 40, content: `[${footnoteNum}] ${text}`, htmlContent: `<span style="color:#4ca8ad;font-size:0.8em">[${footnoteNum}]</span> <span style="font-size:0.85em">${text}</span>`, fontSize: 11, fontFamily: currentFont, color: currentColor, width: pageSize.width - marginLeft - marginRight, lineHeight: 1.4, footnoteNum };
          const updated2 = [...canvasElements, fnEl];
          setCanvasElements(updated2);
          handleSaveHistory(updated2);
          setShowFootnote(false);
        }} className="zet-btn w-full text-xs">Dipnot Ekle</button>
      </div>
    </DraggablePanel>}

    {/* TOC Panel */}
    {showTOC && <DraggablePanel title="İçindekiler" onClose={() => setShowTOC(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-72 space-y-3">
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Büyük/kalın metin elementlerinden başlıklar algılanır.</p>
        {(() => {
          const headings = [];
          (document?.pages || []).forEach((page, pi) => {
            (page.elements || []).forEach(el => {
              if (el.type === 'text' && (el.bold || (el.fontSize || 16) >= 21)) {
                const text = (el.content || '').replace(/<[^>]*>/g, '').trim().slice(0, 60);
                if (text) headings.push({ text, page: pi + 1, level: (el.fontSize || 16) >= 29 ? 1 : (el.fontSize || 16) >= 21 ? 2 : 3 });
              }
            });
          });
          return headings.length === 0 ? (
            <p className="text-xs text-center py-2" style={{ color: 'var(--zet-text-muted)' }}>Başlık bulunamadı.</p>
          ) : (
            <>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {headings.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1" style={{ paddingLeft: (h.level - 1) * 12 }}>
                    <span className="font-medium truncate flex-1" style={{ color: 'var(--zet-text)' }}>{h.text}</span>
                    <span className="flex-shrink-0 text-xs" style={{ color: 'var(--zet-text-muted)' }}>s.{h.page}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                const lines = headings.map(h => `${'  '.repeat(h.level - 1)}${h.text}${'·'.repeat(Math.max(1, 40 - h.text.length - (h.level - 1) * 2))}${h.page}`).join('\n');
                const tocEl = { id: `toc_${Date.now()}`, type: 'text', x: marginLeft, y: marginTop, content: 'İÇİNDEKİLER\n' + lines, htmlContent: '<b>İÇİNDEKİLER</b><br>' + headings.map(h => `<span data-toc-page="${h.page}" style="padding-left:${(h.level-1)*12}px;display:block;cursor:pointer">${h.text} <span style="float:right;color:var(--zet-text-muted)">${h.page}</span></span>`).join(''), fontSize: 13, fontFamily: currentFont, color: currentColor, width: pageSize.width - marginLeft - marginRight, lineHeight: 1.6 };
                const updated = [...canvasElements, tocEl];
                setCanvasElements(updated);
                handleSaveHistory(updated);
                setShowTOC(false);
              }} className="zet-btn w-full text-xs">Canvas'a Ekle</button>
            </>
          );
        })()}
      </div>
    </DraggablePanel>}

    {/* Find & Replace Panel */}
    {showFindReplace && <FindReplacePanel findScope={findScope} setFindScope={setFindScope} findText={findText} setFindText={setFindText} replaceText={replaceText} setReplaceText={setReplaceText} findResults={findResults} setSelectedElement={setSelectedElement} findInDocument={findInDocument} replaceInDocument={replaceInDocument} isMobile={isMobile} onClose={() => setShowFindReplace(false)} />}

    {/* Mirror Panel */}
    {/* Emoji Picker Panel */}
    {showEmoji && <DraggablePanel title="Emoji" onClose={() => setShowEmoji(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <EmojiPicker onSelect={(emoji) => { insertEmoji(emoji); }} onClose={() => setShowEmoji(false)} />
    </DraggablePanel>}

    {showMirror && <DraggablePanel title="Mirror / Rotate" onClose={() => setShowMirror(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-56 space-y-3">
        {!selectedElement ? (
          <div className="text-center py-4 text-xs" style={{ color: 'var(--zet-text-muted)' }}>Select an element first</div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-xs block" style={{ color: 'var(--zet-text-muted)' }}>Mirror</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => mirrorElement('horizontal')} className="zet-btn text-xs py-2 flex items-center justify-center gap-1">
                  ↔ Horizontal
                </button>
                <button onClick={() => mirrorElement('vertical')} className="zet-btn text-xs py-2 flex items-center justify-center gap-1">
                  ↕ Vertical
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs block" style={{ color: 'var(--zet-text-muted)' }}>Döndür: {mirrorAngle}°</label>
              <input
                type="range" min="-180" max="180" value={mirrorAngle}
                onChange={e => {
                  const angle = Number(e.target.value);
                  setMirrorAngle(angle);
                  if (selectedElement) setCanvasElements(prev => prev.map(el => el.id === selectedElement ? { ...el, rotation: angle } : el));
                }}
                onMouseUp={() => { if (selectedElement) handleSaveHistory(canvasElements); }}
                className="w-full accent-blue-500"
              />
              <div className="grid grid-cols-4 gap-1">
                <button onClick={() => { rotateElement(-90); setMirrorAngle(a => a - 90); }} className="zet-btn text-xs py-1">-90°</button>
                <button onClick={() => { rotateElement(-45); setMirrorAngle(a => a - 45); }} className="zet-btn text-xs py-1">-45°</button>
                <button onClick={() => { rotateElement(45); setMirrorAngle(a => a + 45); }} className="zet-btn text-xs py-1">+45°</button>
                <button onClick={() => { rotateElement(90); setMirrorAngle(a => a + 90); }} className="zet-btn text-xs py-1">+90°</button>
              </div>
            </div>
          </>
        )}
      </div>
    </DraggablePanel>}

    {/* Voice Input (STT) Panel */}
    {showVoiceInput && <DraggablePanel title="Ses Girişi" onClose={() => { setShowVoiceInput(false); stopListening(); stopElevenLabsSTT(); setVoiceTranscript(''); }} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-72 space-y-3">
        {/* ElevenLabs STT */}
        <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--zet-border)', background: 'var(--zet-bg)' }}>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--zet-primary)' }}>
            <Zap className="h-3 w-3" /> ElevenLabs Scribe
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={isRecordingEL ? stopElevenLabsSTT : startElevenLabsSTT}
              disabled={elSttLoading}
              className={`flex-1 py-2 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${isRecordingEL ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-700 text-white'} disabled:opacity-50`}
            >
              {elSttLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
              {elSttLoading ? 'İşleniyor...' : isRecordingEL ? 'Durdur' : 'Kayıt Başlat'}
            </button>
          </div>
        </div>

        {/* Browser STT */}
        <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--zet-border)', background: 'var(--zet-bg)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--zet-text-muted)' }}>Tarayıcı STT</p>
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-full py-2 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : ''}`}
            style={!isListening ? { background: 'var(--zet-bg-card)', color: 'var(--zet-text)' } : {}}
          >
            <Mic className="h-3.5 w-3.5" />
            {isListening ? 'Dinleniyor... Durdurmak için tıkla' : 'Dinlemeye başla'}
          </button>
        </div>

        {voiceTranscript && (
          <div className="space-y-2">
            <label className="text-xs block" style={{ color: 'var(--zet-text-muted)' }}>Transkript:</label>
            <div className="p-3 rounded text-sm max-h-32 overflow-y-auto" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)' }}>
              {voiceTranscript}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setVoiceTranscript('')} className="zet-btn text-xs py-2" style={{ background: 'var(--zet-bg)' }}>Temizle</button>
              <button onClick={addVoiceTextToDocument} className="zet-btn text-xs py-2">Belgeye Ekle</button>
            </div>
          </div>
        )}

        <div className="text-xs pt-2 border-t" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text-muted)' }}>
          <p>Dil: {language === 'tr' ? 'Türkçe' : 'English'}</p>
        </div>
      </div>
    </DraggablePanel>}
    </>
  );
};

export default EditorPanels;
