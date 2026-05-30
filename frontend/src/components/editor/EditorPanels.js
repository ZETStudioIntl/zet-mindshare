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
import FontPanel from './FontPanel';
import PageSizePanel from './PageSizePanel';
import BulletListPanel from './BulletListPanel';
import NumberedListPanel from './NumberedListPanel';
import IndentPanel from './IndentPanel';
import MarginsPanel from './MarginsPanel';
import ColumnsPanel from './ColumnsPanel';
import ShortcutsPanel from './ShortcutsPanel';
import LayersPanel from './LayersPanel';
import FootnotePanel from './FootnotePanel';
import TOCPanel from './TOCPanel';
import MirrorPanel from './MirrorPanel';
import VoiceInputPanel from './VoiceInputPanel';
import {
  Search, Loader2, X, Wand2, Plus, Check,
  Languages,
  Bold, Italic, Underline, Strikethrough, Highlighter,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Eye, EyeOff, Lock, Unlock,
  ChevronUp, ChevronDown, Trash2, Table, Zap, Mic, Pencil, ImagePlus,
  Copy as CopyIcon, Link2,
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
    showLink, setShowLink, linkUrl, setLinkUrl, linkText, setLinkText, addLinkToCanvas,
  } = useContext(EditorStateContext);
  const { t } = useLanguage();

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
    <FontPanel />
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
    <PageSizePanel />

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
    <BulletListPanel />

    {/* Numbered List Panel */}
    <NumberedListPanel />

    {/* Indent Panel */}
    <IndentPanel />

    {/* Margins Panel */}
    <MarginsPanel />

    {/* Columns Panel */}
    <ColumnsPanel />

    {/* Calculator Panel */}
    <CalculatorPanel />

    {/* Chat Settings Panel */}
    <ChatSettingsPanel />

    {/* Chart Panel */}
    {showGraphic && <ChartPanel editingChartId={editingChartId} chartType={chartType} setChartType={setChartType} chartTitle={chartTitle} setChartTitle={setChartTitle} chartLabels={chartLabels} setChartLabels={setChartLabels} chartData={chartData} setChartData={setChartData} chartColors={chartColors} setChartColors={setChartColors} chartImage={chartImage} setChartImage={setChartImage} gradientStart={gradientStart} gradientEnd={gradientEnd} setGradientStart={setGradientStart} setGradientEnd={setGradientEnd} createChart={createChart} isMobile={isMobile} onClose={() => { setShowGraphic(false); setEditingChartId(null); }} />}

    {/* Shortcuts Panel */}
    <ShortcutsPanel />

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
    <LayersPanel />

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
          <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Header</label><input type="text" value={headerText} onChange={e => setHeaderText(e.target.value)} placeholder="Header text" className="zet-input text-xs w-full" /></div>
          <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Footer</label><input type="text" value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="Footer text" className="zet-input text-xs w-full" /></div>
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
    <FootnotePanel />

    {/* TOC Panel */}
    <TOCPanel />

    {/* Find & Replace Panel */}
    {showFindReplace && <FindReplacePanel findScope={findScope} setFindScope={setFindScope} findText={findText} setFindText={setFindText} replaceText={replaceText} setReplaceText={setReplaceText} findResults={findResults} setSelectedElement={setSelectedElement} findInDocument={findInDocument} replaceInDocument={replaceInDocument} isMobile={isMobile} onClose={() => setShowFindReplace(false)} />}

    {/* Mirror Panel */}
    {/* Emoji Picker Panel */}
    {showEmoji && <DraggablePanel title="Emoji" onClose={() => setShowEmoji(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <EmojiPicker onSelect={(emoji) => { insertEmoji(emoji); }} onClose={() => setShowEmoji(false)} />
    </DraggablePanel>}

    <MirrorPanel />

    {/* Voice Input (STT) Panel */}
    <VoiceInputPanel />

    {/* Link Panel */}
    {showLink && <DraggablePanel title="Bağlantı Ekle" onClose={() => setShowLink(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-64 space-y-3">
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>URL</label>
          <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com" className="zet-input text-xs w-full" />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Görünen Metin</label>
          <input type="text" value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Metin (boş bırakılırsa URL gösterilir)" className="zet-input text-xs w-full" />
        </div>
        <button
          onClick={addLinkToCanvas}
          disabled={!linkUrl.trim()}
          className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          style={{ background: linkUrl.trim() ? 'rgba(76,168,173,0.15)' : 'rgba(76,168,173,0.05)', color: linkUrl.trim() ? '#4ca8ad' : 'var(--zet-text-muted)', border: '1px solid rgba(76,168,173,0.3)', cursor: linkUrl.trim() ? 'pointer' : 'not-allowed' }}
        >
          <Link2 className="h-3.5 w-3.5" /> Belgeye Ekle
        </button>
      </div>
    </DraggablePanel>}
    </>
  );
};

export default EditorPanels;
