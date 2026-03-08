import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChevronDown, ChevronUp, Plus, Sparkles, Send, Download, Loader2, Image, Volume2, Scale } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const RightPanel = ({
  document: doc,
  currentPage,
  setCurrentPage,
  pageSize,
  zoom,
  onAddPage,
  onDeletePage,
  docId,
  wordCount,
  canvasContainerRef,
  forceSection,
  onExport,
  exporting,
  documentContent, // Text content from canvas elements
}) => {
  const { t } = useLanguage();
  const [pagesOpen, setPagesOpen] = useState(true);
  const [zetaOpen, setZetaOpen] = useState(true);
  const showPages = forceSection ? forceSection === 'pages' : true;
  const showZeta = forceSection ? forceSection === 'zeta' : true;
  const [zetaMessages, setZetaMessages] = useState([]);
  const [zetaInput, setZetaInput] = useState('');
  const [zetaLoading, setZetaLoading] = useState(false);
  const [zetaSessionId, setZetaSessionId] = useState(null);
  const [zetaImage, setZetaImage] = useState(null);
  const [speakingMsg, setSpeakingMsg] = useState(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const audioRef = useRef(null);
  const chatEndRef = useRef(null);

  // ZET Judge Mini state
  const [activeAI, setActiveAI] = useState('zeta'); // 'zeta' or 'judge'
  const [judgeMessages, setJudgeMessages] = useState([]);
  const [judgeInput, setJudgeInput] = useState('');
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [judgeSessionId, setJudgeSessionId] = useState(null);
  const [judgeImage, setJudgeImage] = useState(null);
  const judgeChatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [zetaMessages]);

  useEffect(() => {
    judgeChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [judgeMessages]);

  // Upload image for Judge
  const handleJudgeImageUpload = () => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => setJudgeImage(ev.target.result);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Send message to ZET Judge
  const sendJudgeMessage = async () => {
    if (!judgeInput.trim() && !judgeImage) return;
    const userMsg = { role: 'user', content: judgeInput, image: judgeImage };
    setJudgeMessages(prev => [...prev, userMsg]);
    setJudgeInput('');
    const sentImage = judgeImage;
    setJudgeImage(null);
    setJudgeLoading(true);
    try {
      const res = await axios.post(`${API}/judge/chat`, {
        message: judgeInput + (sentImage ? '\n[Görsel eklendi]' : ''),
        session_id: judgeSessionId,
        doc_id: docId,
        document_content: documentContent || '',
        image_data: sentImage
      });
      setJudgeMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
      setJudgeSessionId(res.data.session_id);
    } catch (err) {
      setJudgeMessages(prev => [...prev, { role: 'assistant', content: 'Hata oluştu. Lütfen tekrar deneyin.' }]);
    } finally {
      setJudgeLoading(false);
    }
  };

  // Upload image to send to ZETA
  const handleImageUpload = () => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => setZetaImage(ev.target.result);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Text to speech for ZETA messages
  const speakMessage = async (text, msgIndex) => {
    if (speakingMsg === msgIndex) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      window.speechSynthesis.cancel();
      setSpeakingMsg(null);
      return;
    }

    setSpeakingMsg(msgIndex);
    setTtsLoading(true);
    
    try {
      // Try ElevenLabs TTS first
      const res = await axios.post(`${API}/voice/tts`, {
        text: text,
        voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel
        model_id: 'eleven_multilingual_v2'
      }, { withCredentials: true });
      
      if (res.data.audio_url && audioRef.current) {
        audioRef.current.src = res.data.audio_url;
        audioRef.current.onended = () => setSpeakingMsg(null);
        await audioRef.current.play();
      }
    } catch (err) {
      console.error('TTS failed, using browser:', err);
      // Fallback to browser TTS
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeakingMsg(null);
      window.speechSynthesis.speak(utterance);
    }
    setTtsLoading(false);
  };

  const sendZetaMessage = async () => {
    if (!zetaInput.trim() || zetaLoading) return;
    const msg = zetaInput;
    const imageToSend = zetaImage;
    
    // Add user message with image if present
    setZetaMessages(prev => [...prev, { 
      role: 'user', 
      content: msg,
      image: imageToSend || null 
    }]);
    setZetaInput('');
    setZetaImage(null);
    setZetaLoading(true);
    
    try {
      const res = await axios.post(`${API}/zeta/chat`, { 
        message: msg, 
        doc_id: docId, 
        session_id: zetaSessionId,
        document_content: documentContent || '',
        image: imageToSend || null
      }, { withCredentials: true });
      setZetaSessionId(res.data.session_id);
      setZetaMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch {
      setZetaMessages(prev => [...prev, { role: 'assistant', content: 'Error!' }]);
    }
    setZetaLoading(false);
  };

  const stats = { pageCount: doc?.pages?.length || 0, wordCount };

  return (
    <div data-testid="right-panel" className="w-72 border-l flex flex-col" style={{ borderColor: 'var(--zet-border)' }}>
      {/* Export Button */}
      {showPages && (
        <div className="p-2 border-b" style={{ borderColor: 'var(--zet-border)' }}>
          <button data-testid="export-pdf-btn" onClick={onExport} disabled={exporting} className="zet-btn w-full flex items-center justify-center gap-2 py-2 text-sm">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export PDF
          </button>
        </div>
      )}
      
      {/* Pages Section */}
      {showPages && (
      <div className="border-b" style={{ borderColor: 'var(--zet-border)' }}>
        <div className="p-2 flex items-center justify-between">
          <span className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>{t('allPages')}</span>
          <div className="flex gap-1">
            {pagesOpen && (
              <button data-testid="add-page-btn" onClick={onAddPage} className="p-1 hover:bg-white/10 rounded transition-colors">
                <Plus className="h-3 w-3" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            )}
            <button onClick={() => setPagesOpen(!pagesOpen)} className="p-1 hover:bg-white/10 rounded">
              {pagesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
        {pagesOpen && (
          <div className="px-2 pb-2">
            <div className="text-xs mb-1" style={{ color: 'var(--zet-text-muted)' }}>
              {stats.pageCount} {t('pages')} · {stats.wordCount} {t('words') || 'words'}
            </div>
            <div className="grid grid-cols-3 gap-1 max-h-28 overflow-y-auto">
              {doc.pages?.map((page, idx) => (
                <div key={page.page_id} className="relative group">
                  <div
                    data-testid={`page-thumb-${idx}`}
                    onClick={() => {
                      setCurrentPage(idx);
                      canvasContainerRef?.current?.scrollTo({
                        top: idx * ((page.pageSize?.height || pageSize.height) * zoom + 24),
                        behavior: 'smooth'
                      });
                    }}
                    className={`aspect-[3/4] rounded border-2 cursor-pointer overflow-hidden transition-colors ${currentPage === idx ? 'border-blue-500' : 'border-transparent hover:border-white/20'}`}
                    style={{ background: 'white' }}
                  >
                    <div className="w-full h-full relative" style={{ transform: 'scale(0.15)', transformOrigin: 'top left' }}>
                      {(page.elements || []).slice(0, 5).map(el => (
                        <div key={el.id} className="absolute" style={{ left: el.x, top: el.y, fontSize: el.fontSize || 12, color: el.color || '#000' }}>
                          {el.type === 'text' && (el.content || '').slice(0, 20)}
                        </div>
                      ))}
                    </div>
                  </div>
                  {doc.pages.length > 1 && (
                    <button
                      onClick={() => onDeletePage(idx)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* AI Section - ZETA & Judge */}
      {showZeta && (
      <div className="flex-1 flex flex-col min-h-0">
        {/* AI Selector Tabs */}
        <div className="flex border-b" style={{ borderColor: 'var(--zet-border)' }}>
          <button 
            onClick={() => setActiveAI('zeta')}
            data-testid="ai-tab-zeta"
            className={`flex-1 p-2 flex items-center justify-center gap-1.5 transition-all ${activeAI === 'zeta' ? 'border-b-2' : 'opacity-60 hover:opacity-100'}`}
            style={{ borderColor: activeAI === 'zeta' ? 'var(--zet-primary-light)' : 'transparent' }}
          >
            <Sparkles className="h-4 w-4" style={{ color: 'var(--zet-primary-light)' }} />
            <span className="font-medium text-xs" style={{ color: 'var(--zet-text)' }}>ZETA</span>
          </button>
          <button 
            onClick={() => setActiveAI('judge')}
            data-testid="ai-tab-judge"
            className={`flex-1 p-2 flex items-center justify-center gap-1.5 transition-all ${activeAI === 'judge' ? 'border-b-2' : 'opacity-60 hover:opacity-100'}`}
            style={{ borderColor: activeAI === 'judge' ? '#c8005a' : 'transparent' }}
          >
            <Scale className="h-4 w-4" style={{ color: '#c8005a' }} />
            <span className="font-medium text-xs" style={{ color: 'var(--zet-text)' }}>Judge</span>
          </button>
        </div>

        {/* ZETA Chat */}
        {activeAI === 'zeta' && (
          <>
            <div data-testid="zeta-messages" className="flex-1 p-2 overflow-y-auto text-xs" style={{ background: 'var(--zet-bg)' }}>
              {zetaMessages.length === 0 && (
                <div className="text-center py-6" style={{ color: 'var(--zet-text-muted)' }}>
                  <Sparkles className="h-5 w-5 mx-auto mb-2 opacity-50" />
                  <p>{t('askZetaAnything')}</p>
                </div>
              )}
              {zetaMessages.map((msg, i) => (
                <div key={i} className={`mb-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.image && (
                    <div className="mb-1">
                      <img src={msg.image} alt="Uploaded" className="max-w-[120px] max-h-[80px] rounded inline-block" />
                    </div>
                  )}
                  <div className="inline-flex items-start gap-1 max-w-[90%]">
                    <div
                      className="px-2.5 py-1.5 rounded-lg"
                      style={{
                        background: msg.role === 'user' ? 'var(--zet-primary)' : 'var(--zet-bg-card)',
                        color: 'var(--zet-text)',
                      }}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'assistant' && (
                      <button 
                        onClick={() => speakMessage(msg.content, i)}
                        className={`p-1 rounded hover:bg-white/10 flex-shrink-0 ${speakingMsg === i ? 'bg-white/10' : ''}`}
                        title="Listen"
                      >
                        <Volume2 className={`h-3 w-3 ${speakingMsg === i ? 'text-blue-400' : ''}`} style={{ color: speakingMsg === i ? undefined : 'var(--zet-text-muted)' }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {zetaLoading && (
                <div className="flex gap-1 py-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--zet-primary-light)', animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--zet-primary-light)', animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--zet-primary-light)', animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={chatEndRef} />
              <audio ref={audioRef} hidden />
            </div>
            <div className="p-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
              {zetaImage && (
                <div className="mb-2 relative inline-block">
                  <img src={zetaImage} alt="To send" className="max-w-[80px] max-h-[60px] rounded" />
                  <button onClick={() => setZetaImage(null)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">×</button>
                </div>
              )}
              <div className="flex gap-1">
                <button onClick={handleImageUpload} className="tool-btn w-8 h-8 flex-shrink-0" title="Add image">
                  <Image className="h-3 w-3" />
                </button>
                <input
                  data-testid="zeta-input"
                  placeholder={t('askZeta')}
                  value={zetaInput}
                  onChange={e => setZetaInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendZetaMessage()}
                  className="zet-input flex-1 text-xs py-1.5"
                />
                <button data-testid="zeta-send-btn" onClick={sendZetaMessage} className="zet-btn px-2">
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ZET Judge Mini Chat */}
        {activeAI === 'judge' && (
          <>
            <div 
              data-testid="judge-messages" 
              className="flex-1 p-2 overflow-y-auto text-xs" 
              style={{ background: 'linear-gradient(135deg, #4b0c37 0%, #1a0a14 100%)' }}
            >
              {judgeMessages.length === 0 && (
                <div className="text-center py-6" style={{ color: '#c8005a' }}>
                  <Scale className="h-6 w-6 mx-auto mb-2 opacity-70" />
                  <p className="font-semibold">ZET Judge Mini</p>
                  <p className="text-xs mt-1 opacity-70">İş analizi • Vizyon • Strateji</p>
                </div>
              )}
              {judgeMessages.map((msg, i) => (
                <div key={i} className={`mb-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.image && (
                    <div className="mb-1">
                      <img src={msg.image} alt="Uploaded" className="max-w-[120px] max-h-[80px] rounded inline-block" />
                    </div>
                  )}
                  <div className="inline-block max-w-[90%]">
                    <div
                      className="px-2.5 py-1.5 rounded-lg"
                      style={{
                        background: msg.role === 'user' ? '#c8005a' : 'rgba(200, 0, 90, 0.2)',
                        color: '#fff',
                        border: msg.role === 'assistant' ? '1px solid rgba(200, 0, 90, 0.3)' : 'none'
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {judgeLoading && (
                <div className="flex gap-1 py-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#c8005a', animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#c8005a', animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#c8005a', animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={judgeChatEndRef} />
            </div>
            <div className="p-2 border-t" style={{ borderColor: '#c8005a33', background: '#4b0c37' }}>
              {judgeImage && (
                <div className="mb-2 relative inline-block">
                  <img src={judgeImage} alt="To send" className="max-w-[80px] max-h-[60px] rounded" />
                  <button onClick={() => setJudgeImage(null)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">×</button>
                </div>
              )}
              <div className="flex gap-1">
                <button onClick={handleJudgeImageUpload} className="w-8 h-8 flex-shrink-0 rounded flex items-center justify-center" style={{ background: 'rgba(200, 0, 90, 0.3)' }} title="Görsel ekle">
                  <Image className="h-3 w-3" style={{ color: '#c8005a' }} />
                </button>
                <input
                  data-testid="judge-input"
                  placeholder="Analiz için materyal veya soru..."
                  value={judgeInput}
                  onChange={e => setJudgeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendJudgeMessage()}
                  className="flex-1 text-xs py-1.5 px-2 rounded"
                  style={{ background: 'rgba(200, 0, 90, 0.15)', border: '1px solid #c8005a33', color: '#fff' }}
                />
                <button data-testid="judge-send-btn" onClick={sendJudgeMessage} className="px-2 rounded" style={{ background: '#c8005a' }}>
                  <Send className="h-3 w-3 text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
};
