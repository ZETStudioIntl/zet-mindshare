import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, ChevronUp, Plus, Sparkles, Send, Download, Loader2, Volume2, Scale, Settings, PenTool, FileText, CreditCard, Search, X, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import axios from 'axios';
import ZetaTypingIndicator from '../ZetaTypingIndicator';

const CEO_EMAIL = 'muhammadbahaddinyilmaz@gmail.com';

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
  documentContent,
  userUsage,
  userPlan,
  onShowUpgrade,
  onShowChatSettings,
  zetaMood,
  zetaEmoji,
  zetaCustomPrompt,
  judgeMood,
  onAutoWriteContent,
  onRefreshCredits,
  onUpdateSettings,
  onTakeNote,
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [pagesOpen, setPagesOpen] = useState(true);
  const [zetaOpen, setZetaOpen] = useState(true);

  // CEO / Admin / console state
  const [isCEO, setIsCEO] = useState(() => localStorage.getItem('zet_ceo_mode') === 'true');
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('zet_admin_mode') === 'true');
  const [showConsole, setShowConsole] = useState(false);
  const [consoleLines, setConsoleLines] = useState([
    { type: 'system', text: 'ZET MINDSHARE TERMINAL v1.0' },
    { type: 'system', text: 'Type a command and press Enter.' },
    { type: 'system', text: '' },
  ]);
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleStage, setConsoleStage] = useState('main'); // 'main' | 'admin_login' | 'admin_pin'
  const consoleEndRef = useRef(null);
  const consoleInputRef = useRef(null);
  const showPages = forceSection ? forceSection === 'pages' : true;
  const showZeta = forceSection ? forceSection === 'zeta' : true;

  // ZETA Chat state
  const [zetaMessages, setZetaMessages] = useState([]);
  const [zetaInput, setZetaInput] = useState('');
  const [zetaLoading, setZetaLoading] = useState(false);
  const [zetaSessionId, setZetaSessionId] = useState(null);
  const [zetaImage, setZetaImage] = useState(null);
  const [speakingMsg, setSpeakingMsg] = useState(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const audioRef = useRef(null);
  const chatEndRef = useRef(null);

  // Tab state: 'zeta' or 'judge'
  const [activeAI, setActiveAI] = useState('zeta');
  // ZETA sub-mode: 'chat', 'autowrite', 'deep'
  const [zetaMode, setZetaMode] = useState('chat');

  // Judge state
  const [judgeMessages, setJudgeMessages] = useState([]);
  const [judgeInput, setJudgeInput] = useState('');
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [judgeSessionId, setJudgeSessionId] = useState(null);
  const [judgeImage, setJudgeImage] = useState(null);
  const [judgeMode, setJudgeMode] = useState('fast');
  const judgeChatEndRef = useRef(null);
  const [showJudgeSendMenu, setShowJudgeSendMenu] = useState(false);
  const [showZetaSendMenu, setShowZetaSendMenu] = useState(false);

  // Auto-write state
  const [autoPrompt, setAutoPrompt] = useState('');
  const [autoPages, setAutoPages] = useState(1);
  const [autoStyle, setAutoStyle] = useState('profesyonel');
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoResult, setAutoResult] = useState(null);
  const [autoError, setAutoError] = useState('');

  // Deep Analysis state
  const [deepTopic, setDeepTopic] = useState('');
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepResult, setDeepResult] = useState(null);
  const [deepError, setDeepError] = useState('');

  useEffect(() => {
    if (docId) {
      // Reset messages when switching documents
      setZetaMessages([]);
      setJudgeMessages([]);
      setZetaSessionId(null);
      setJudgeSessionId(null);
      loadChatHistory();
    }
  }, [docId]);

  const executeActions = async (actions) => {
    if (!actions || actions.length === 0) return;
    const settingsUpdate = {};
    for (const action of actions) {
      if (action.type === 'EMOJI') {
        settingsUpdate.zetaEmoji = action.value;
        localStorage.setItem('zet_zeta_emoji', action.value);
      } else if (action.type === 'MOOD') {
        settingsUpdate.zetaMood = action.value;
        localStorage.setItem('zet_zeta_mood', action.value);
      } else if (action.type === 'MEMORY') {
        try {
          await axios.post(`${API}/zeta/memory`, { content: action.value }, { withCredentials: true });
        } catch {}
      } else if (action.type === 'NOTE') {
        try {
          await axios.post(`${API}/notes`, { content: action.value }, { withCredentials: true });
          if (onTakeNote) onTakeNote(action.value);
        } catch {}
      }
    }
    if (Object.keys(settingsUpdate).length > 0 && onUpdateSettings) {
      onUpdateSettings(settingsUpdate);
    }
  };

  const loadChatHistory = async () => {
    try {
      const [zetaRes, judgeRes] = await Promise.all([
        axios.get(`${API}/chat-history/${docId}?ai_type=zeta`, { withCredentials: true }),
        axios.get(`${API}/chat-history/${docId}?ai_type=judge`, { withCredentials: true })
      ]);
      const zetaMsgs = zetaRes.data.flatMap(h => [
        { role: 'user', content: h.user_message },
        { role: 'assistant', content: h.ai_response }
      ]);
      const judgeMsgs = judgeRes.data.flatMap(h => [
        { role: 'user', content: h.user_message },
        { role: 'assistant', content: h.ai_response }
      ]);
      setZetaMessages(zetaMsgs);
      setJudgeMessages(judgeMsgs);
      if (zetaRes.data.length) setZetaSessionId(zetaRes.data[zetaRes.data.length - 1].session_id);
      if (judgeRes.data.length) setJudgeSessionId(judgeRes.data[judgeRes.data.length - 1].session_id);
      // Scroll to bottom after history loads
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'instant' });
        judgeChatEndRef.current?.scrollIntoView({ behavior: 'instant' });
      }, 100);
    } catch (err) {
      console.log('No chat history found');
    }
  };

  useEffect(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [zetaMessages]);

  useEffect(() => {
    setTimeout(() => judgeChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [judgeMessages]);

  useEffect(() => {
    if (!showJudgeSendMenu && !showZetaSendMenu) return;
    const close = () => { setShowJudgeSendMenu(false); setShowZetaSendMenu(false); };
    window.document.addEventListener('click', close);
    return () => window.document.removeEventListener('click', close);
  }, [showJudgeSendMenu, showZetaSendMenu]);

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

  const sendJudgeMessage = async () => {
    if (!judgeInput.trim() && !judgeImage) return;
    if (language === 'tr' && !(documentContent || '').trim()) {
      const userMsg = { role: 'user', content: judgeInput };
      setJudgeMessages(prev => [...prev, userMsg, { role: 'assistant', content: "I'm sorry ама ваш документ пуст. Aus diesem Grund لا أستطيع التحليل. Por eso 分析できません。" }]);
      setJudgeInput('');
      return;
    }
    const userMsg = { role: 'user', content: judgeInput, image: judgeImage, mode: judgeMode };
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
        image_data: sentImage,
        mode: judgeMode,
        personality: judgeMood || 'normal', is_ceo: isCEO
      });
      if (res.data.locked || res.data.limit_exceeded || res.data.char_limit_exceeded) {
        setJudgeMessages(prev => [...prev, { role: 'assistant', content: res.data.response, isWarning: true }]);
      } else {
        setJudgeMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        setJudgeSessionId(res.data.session_id);
      }
    } catch (err) {
      setJudgeMessages(prev => [...prev, { role: 'assistant', content: 'Hata olustu. Lutfen tekrar deneyin.' }]);
    } finally {
      setJudgeLoading(false);
    }
  };

  const speakMessage = async (text, msgIndex) => {
    if (speakingMsg === msgIndex) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      window.speechSynthesis.cancel();
      setSpeakingMsg(null);
      return;
    }
    setSpeakingMsg(msgIndex);
    setTtsLoading(true);
    try {
      const res = await axios.post(`${API}/voice/tts`, {
        text, voice_id: '21m00Tcm4TlvDq8ikWAM', model_id: 'eleven_multilingual_v2'
      }, { withCredentials: true });
      if (res.data.audio_url && audioRef.current) {
        audioRef.current.src = res.data.audio_url;
        audioRef.current.onended = () => setSpeakingMsg(null);
        await audioRef.current.play();
      }
    } catch (err) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeakingMsg(null);
      window.speechSynthesis.speak(utterance);
    } finally {
      setTtsLoading(false);
    }
  };

  const handleAutoWrite = async () => {
    if (!autoPrompt.trim() || autoLoading) return;
    setAutoLoading(true);
    setAutoError('');
    setAutoResult(null);
    try {
      const res = await axios.post(`${API}/zeta/auto-write`, {
        prompt: autoPrompt, page_count: autoPages, writing_style: autoStyle,
      }, { withCredentials: true });
      if (res.data.success) {
        setAutoResult(res.data);
        if (onRefreshCredits) onRefreshCredits();
      } else {
        setAutoError(res.data.error || 'Yazma başarısız');
      }
    } catch (err) {
      setAutoError(err.response?.data?.detail || 'Otomatik yazma başarısız');
    }
    setAutoLoading(false);
  };

  const handleDeepAnalysis = async () => {
    if (!deepTopic.trim() || deepLoading) return;
    setDeepLoading(true);
    setDeepError('');
    setDeepResult(null);
    try {
      const res = await axios.post(`${API}/zeta/deep-analysis`, {
        topic: deepTopic, document_content: documentContent || '',
      }, { withCredentials: true });
      if (res.data.success) {
        setDeepResult(res.data);
      } else {
        setDeepError(res.data.error || 'Analiz başarısız');
      }
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 403) setDeepError(detail || 'Derin Analiz sadece Pro ve Ultra aboneler için kullanılabilir.');
      else if (status === 402) setDeepError(detail || 'Yetersiz kredi! Derin Analiz 100 kredi gerektirir.');
      else setDeepError(detail || 'Derin analiz başarısız');
    }
    setDeepLoading(false);
  };

  // ─── Console logic ───────────────────────────────────────────
  useEffect(() => { consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [consoleLines]);
  useEffect(() => { if (showConsole) setTimeout(() => consoleInputRef.current?.focus(), 80); }, [showConsole]);

  // Google auth sonrası PIN adımını otomatik başlat
  useEffect(() => {
    if (localStorage.getItem('zet_ceo_pending') === 'true') {
      setShowConsole(true);
      setConsoleStage('admin_pin');
      setConsoleLines([
        { type: 'system', text: 'ZET MINDSHARE TERMINAL v1.0' },
        { type: 'system', text: '' },
        { type: 'success', text: '✓ Google kimlik doğrulaması başarılı.' },
        { type: 'output', text: '' },
        { type: 'output', text: '╔═══════════════════════════════╗' },
        { type: 'output', text: '║  İKİNCİ FAKTÖR: PIN           ║' },
        { type: 'output', text: '╚═══════════════════════════════╝' },
        { type: 'output', text: 'Admin PIN\'inizi girin:' },
      ]);
    }
  }, []);

  const addConsoleLine = (text, type = 'output') =>
    setConsoleLines(prev => [...prev, { type, text }]);

  // All known commands (used for autocomplete)
  const PUBLIC_COMMANDS = ['/clear/', '/open/admin/panel/login/'];
  const ADMIN_COMMANDS = ['/delete/admin/', '/logout/admin/', '/(number)/credits/', '/(number)/sp/', '/freesub/'];
  const CEO_COMMANDS = ['/verify/@username/red/', '/verify/@username/gold/', '/verify/@username/blue/', '/verify/@username/remove/'];
  const getVisibleCommands = () => isCEO ? [...PUBLIC_COMMANDS, ...ADMIN_COMMANDS, ...CEO_COMMANDS] : (isAdmin ? [...PUBLIC_COMMANDS, ...ADMIN_COMMANDS] : PUBLIC_COMMANDS);
  const getConsoleSuggestions = (input) => {
    if (!input) return [];
    const lower = input.toLowerCase().replace(/\s/g, '');
    return getVisibleCommands().filter(c => c.replace(/\(number\)/g, '').replace(/\s/g, '').startsWith(lower) || c.replace(/\(number\)/g, '').includes(lower));
  };

  const handleConsoleSubmit = async () => {
    const cmd = consoleInput.trim();
    if (!cmd) return;
    setConsoleInput('');

    // PIN adımı — şifre maskelendi, log'a yazmıyoruz
    if (consoleStage === 'admin_pin') {
      addConsoleLine('> ••••••••', 'input');
      try {
        await axios.post(`${API}/auth/admin-verify-pin`, { pin: cmd }, { withCredentials: true });
        localStorage.removeItem('zet_ceo_pending');
        localStorage.setItem('zet_ceo_mode', 'true');
        setIsCEO(true);
        setConsoleStage('main');
        addConsoleLine('', 'output');
        addConsoleLine('╔═══════════════════════════════╗', 'success');
        addConsoleLine('║  CEO MODU AKTİF               ║', 'success');
        addConsoleLine('╚═══════════════════════════════╝', 'success');
        addConsoleLine('Hoş geldiniz.', 'success');
      } catch (err) {
        const detail = err.response?.data?.detail || 'Yanlış PIN.';
        addConsoleLine(`✗ ${detail}`, 'error');
        if (err.response?.status === 403) {
          localStorage.removeItem('zet_ceo_pending');
          setConsoleStage('main');
          addConsoleLine('Kimlik doğrulama başarısız. Konsoldan çıkılıyor.', 'error');
          setTimeout(() => { setShowConsole(false); }, 2000);
        }
      }
      return;
    }

    addConsoleLine(`> ${cmd}`, 'input');
    const normalized = cmd.toLowerCase().replace(/\s+/g, '');

    // Extract numeric patterns like /(1000)/credits/ or /(500)/sp/
    const creditMatch = cmd.match(/\/\((\d+)\)\/credits\//i);
    const spMatch = cmd.match(/\/\((\d+)\)\/sp\//i);

    if (normalized === '/open/console/') {
      addConsoleLine('Already in console.', 'output');
    } else if (normalized === '/open/admin/panel/login/') {
      addConsoleLine('', 'output');
      addConsoleLine('╔═══════════════════════════════╗', 'output');
      addConsoleLine('║  ZET ADMIN PANEL — AUTH       ║', 'output');
      addConsoleLine('╚═══════════════════════════════╝', 'output');
      addConsoleLine('Identity verification required.', 'output');
      addConsoleLine('[GOOGLE_AUTH_PROMPT]', 'auth');
      setConsoleStage('admin_login');
    } else if (normalized === '/clear/') {
      setConsoleLines([{ type: 'system', text: 'ZET MINDSHARE TERMINAL v1.0' }, { type: 'system', text: '' }]);
    } else if (normalized === '/delete/admin/' || normalized === '/logout/admin/') {
      if (!isCEO && !isAdmin) { addConsoleLine('Permission denied.', 'error'); return; }
      localStorage.removeItem('zet_ceo_mode');
      localStorage.removeItem('zet_ceo_pending');
      localStorage.removeItem('zet_admin_mode');
      setIsCEO(false);
      setIsAdmin(false);
      addConsoleLine('Admin modu devre dışı bırakıldı. Standart kullanıcıya dönüldü.', 'output');
    } else if (creditMatch) {
      if (!isCEO && !isAdmin) { addConsoleLine('Permission denied.', 'error'); return; }
      const amount = parseInt(creditMatch[1]);
      addConsoleLine(`Adding ${amount} credits...`, 'output');
      try {
        const res = await axios.post(`${API}/admin/add-credits`, { amount }, { withCredentials: true });
        addConsoleLine(`✓ ${amount} kredi eklendi. Toplam: ${res.data.total}`, 'success');
      } catch (err) {
        addConsoleLine(`✗ ${err.response?.data?.detail || 'Kredi eklenemedi.'}`, 'error');
      }
    } else if (spMatch) {
      if (!isCEO && !isAdmin) { addConsoleLine('Permission denied.', 'error'); return; }
      const amount = parseInt(spMatch[1]);
      addConsoleLine(`${amount} SP ekleniyor...`, 'output');
      try {
        const res = await axios.post(`${API}/admin/add-sp`, { amount }, { withCredentials: true });
        addConsoleLine(`✓ ${amount} SP eklendi. Toplam: ${res.data.total}`, 'success');
      } catch (err) {
        addConsoleLine(`✗ ${err.response?.data?.detail || 'SP eklenemedi.'}`, 'error');
      }
    } else if (normalized === '/freesub/') {
      if (!isCEO && !isAdmin) { addConsoleLine('Permission denied.', 'error'); return; }
      addConsoleLine('Pro abonelik aktive ediliyor...', 'output');
      try {
        await axios.post(`${API}/admin/free-subscription`, {}, { withCredentials: true });
        addConsoleLine('✓ Pro abonelik aktive edildi.', 'success');
      } catch (err) {
        addConsoleLine(`✗ ${err.response?.data?.detail || 'Abonelik aktive edilemedi.'}`, 'error');
      }
    } else if (/^\/verify\/@[\w]+\/(red|gold|blue|remove)\/$/.test(normalized)) {
      if (!isCEO) { addConsoleLine('Permission denied. Sadece CEO verified atayabilir.', 'error'); return; }
      const parts = normalized.split('/');
      const username = parts[2].replace('@', '');
      const vtype = parts[3] === 'remove' ? null : parts[3];
      addConsoleLine(`@${username} için verified güncelleniyor...`, 'output');
      try {
        const res = await axios.post(`${API}/admin/set-verified`, { username, verified_type: vtype }, { withCredentials: true });
        addConsoleLine(`✓ ${res.data.message}`, 'success');
      } catch (err) {
        addConsoleLine(`✗ ${err.response?.data?.detail || 'İşlem başarısız.'}`, 'error');
      }
    } else if (normalized === 'exit' || normalized === 'close') {
      setShowConsole(false); setConsoleStage('main');
    } else {
      addConsoleLine(`Unknown command: ${cmd}`, 'error');
    }
  };

  const handleAdminGoogleAuth = () => {
    // Save current doc to return after auth
    if (doc?.doc_id) localStorage.setItem('zet_admin_auth_doc', doc.doc_id);
    localStorage.setItem('zet_admin_auth_pending', 'true');
    // Use same redirect flow as login page
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/admin-google`;
  };
  // ─────────────────────────────────────────────────────────────

  const sendZetaMessage = async () => {
    if (!zetaInput.trim() || zetaLoading) return;
    // Intercept console command
    if (zetaInput.trim().toLowerCase().replace(/\s+/g, '') === '/open/console/') {
      setZetaInput('');
      setShowConsole(true);
      return;
    }
    const msg = zetaInput;
    const imageToSend = zetaImage;
    setZetaMessages(prev => [...prev, { role: 'user', content: msg, image: imageToSend || null }]);
    setZetaInput('');
    setZetaImage(null);
    setZetaLoading(true);
    try {
      const res = await axios.post(`${API}/zeta/chat`, {
        message: msg, doc_id: docId, session_id: zetaSessionId,
        document_content: documentContent || '', image: imageToSend || null,
        mood: zetaMood || 'professional', emoji_level: zetaEmoji || 'medium',
        custom_prompt: zetaCustomPrompt || '', is_ceo: isCEO
      }, { withCredentials: true });
      setZetaSessionId(res.data.session_id);
      setZetaMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
      if (res.data.actions?.length) await executeActions(res.data.actions);
    } catch {
      setZetaMessages(prev => [...prev, { role: 'assistant', content: 'Hata olustu!' }]);
    }
    setZetaLoading(false);
  };

  const stats = { pageCount: doc?.pages?.length || 0, wordCount };

  return (
    <div data-testid="right-panel" className="w-72 h-full border-l flex flex-col" style={{ borderColor: 'var(--zet-border)' }}>
      {/* Export Button */}
      {showPages && (
        <div className="p-2 border-b" style={{ borderColor: 'var(--zet-border)' }}>
          <button data-testid="export-pdf-btn" onClick={onExport} disabled={exporting} className="zet-btn w-full flex items-center justify-center gap-2 py-2 text-sm">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF Aktar
          </button>
        </div>
      )}

      {/* Pages Seçtion */}
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
              {stats.pageCount} {t('pages')} · {stats.wordCount} {t('words') || 'kelime'}
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

      {/* AI Seçtion - 2 Tabs: ZETA & Judge */}
      {showZeta && (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Tab Bar */}
        <div className="flex border-b" style={{ borderColor: 'var(--zet-border)' }}>
          <button
            onClick={() => { setActiveAI('zeta'); setZetaMode('chat'); }}
            data-testid="ai-tab-zeta"
            className={`flex-1 p-2 flex items-center justify-center gap-1.5 transition-all ${activeAI === 'zeta' ? 'border-b-2' : 'opacity-60 hover:opacity-100'}`}
            style={{ borderColor: activeAI === 'zeta' ? 'var(--zet-primary-light)' : 'transparent' }}
          >
            <img src="/zeta-icon.svg" alt="ZETA" style={{ width: 14, height: 14, filter: 'invert(45%) sepia(80%) saturate(600%) hue-rotate(200deg) brightness(120%)' }} />
            <span className="font-medium text-xs" style={{ color: 'var(--zet-text)' }}>ZETA</span>
          </button>
          <button
            onClick={() => setActiveAI('judge')}
            data-testid="ai-tab-judge"
            className={`flex-1 p-2 flex items-center justify-center gap-1.5 transition-all ${activeAI === 'judge' ? 'border-b-2' : 'opacity-60 hover:opacity-100'}`}
            style={{ borderColor: activeAI === 'judge' ? '#c8005a' : 'transparent' }}
          >
            <Scale className="h-3.5 w-3.5" style={{ color: '#c8005a' }} />
            <span className="font-medium text-xs" style={{ color: 'var(--zet-text)' }}>Judge Mini</span>
          </button>
          {onShowChatSettings && (
            <button onClick={onShowChatSettings} data-testid="chat-settings-btn" className="p-2 hover:bg-white/10 rounded transition-all" title="Chat Ayarlari">
              <Settings className="h-3.5 w-3.5" style={{ color: 'var(--zet-text-muted)' }} />
            </button>
          )}
        </div>

        {/* CEO mode banner */}
        {isCEO && (
          <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] font-semibold" style={{ background: 'rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
            👑 CEO MODU AKTİF
          </div>
        )}
        {/* Admin mode banner */}
        {!isCEO && isAdmin && (
          <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] font-semibold" style={{ background: 'rgba(99,102,241,0.15)', borderBottom: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
            🛡 ADMİN MODU AKTİF
          </div>
        )}

        {/* ===== ZETA TAB ===== */}
        {activeAI === 'zeta' && (
          <>
            {/* ZETA Chat Mode */}
            {zetaMode === 'chat' && (
              <>
                <div data-testid="zeta-messages" className="flex-1 p-2 overflow-y-auto text-xs" style={{ background: 'var(--zet-bg)' }}>
                  {zetaMessages.length === 0 && (
                    <div className="text-center py-6" style={{ color: 'var(--zet-text-muted)' }}>
                      <img src="/zeta-icon.svg" alt="ZETA" className="mx-auto mb-2" style={{ width: 28, height: 28, opacity: 0.6, filter: 'invert(45%) sepia(80%) saturate(600%) hue-rotate(200deg) brightness(120%)' }} />
                      <p className="text-xs font-medium">{t('askZetaAnything')}</p>
                      <p className="text-[10px] mt-2 opacity-70">Belgenizi otomatik olarak görüyorum. Siyah bantla gizlenen alanları göremem.</p>
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
                        {msg.role === 'assistant' && (
                          <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'var(--zet-primary)', minWidth: 20 }}>
                            <img src="/zeta-icon.svg" alt="Z" style={{ width: 11, height: 11 }} />
                          </div>
                        )}
                        <div className="px-2.5 py-1.5 rounded-lg whitespace-pre-wrap" style={{ background: msg.role === 'user' ? 'var(--zet-primary)' : 'var(--zet-bg-card)', color: 'var(--zet-text)' }}>
                          {msg.content}
                        </div>
                        {msg.role === 'assistant' && (
                          <button onClick={() => speakMessage(msg.content, i)} className={`p-1 rounded hover:bg-white/10 flex-shrink-0 ${speakingMsg === i ? 'bg-white/10' : ''}`} title="Dinle">
                            <Volume2 className={`h-3 w-3 ${speakingMsg === i ? 'text-blue-400' : ''}`} style={{ color: speakingMsg === i ? undefined : 'var(--zet-text-muted)' }} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {zetaLoading && (
                    <ZetaTypingIndicator className="py-1" />
                  )}
                  <div ref={chatEndRef} />
                  <audio ref={audioRef} hidden />
                </div>
                {/* ZETA Input Bar */}
                <div className="p-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
                  {zetaImage && (
                    <div className="mb-2 relative inline-block">
                      <img src={zetaImage} alt="To send" className="max-w-[80px] max-h-[60px] rounded" />
                      <button onClick={() => setZetaImage(null)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">x</button>
                    </div>
                  )}
                  {showZetaSendMenu && (
                    <div className="flex gap-1 mb-1.5">
                      <button
                        data-testid="zeta-chat-send"
                        onClick={() => { setZetaMode('chat'); setShowZetaSendMenu(false); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-all"
                        style={{ background: zetaMode === 'chat' ? 'var(--zet-primary)' : 'var(--zet-bg-card)', color: zetaMode === 'chat' ? '#fff' : 'var(--zet-text)', border: '1px solid var(--zet-border)' }}
                      >
                        <Send className="h-2.5 w-2.5" /> Chat
                      </button>
                      <button
                        data-testid="zeta-autowrite-btn"
                        onClick={() => { setZetaMode('autowrite'); setShowZetaSendMenu(false); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-all"
                        style={{ background: zetaMode === 'autowrite' ? '#10b981' : 'var(--zet-bg-card)', color: zetaMode === 'autowrite' ? '#fff' : '#10b981', border: '1px solid rgba(16,185,129,0.35)' }}
                      >
                        <PenTool className="h-2.5 w-2.5" /> Oto Yaz
                      </button>
                      <button
                        data-testid="zeta-deep-btn"
                        onClick={() => { setZetaMode('deep'); setShowZetaSendMenu(false); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-all"
                        style={{ background: zetaMode === 'deep' ? '#f59e0b' : 'var(--zet-bg-card)', color: zetaMode === 'deep' ? '#fff' : '#f59e0b', border: '1px solid rgba(245,158,11,0.35)' }}
                      >
                        <Search className="h-2.5 w-2.5" /> Derin
                      </button>
                    </div>
                  )}
                  <div className="flex gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); setShowZetaSendMenu(v => !v); }}
                      className="p-1.5 rounded-lg flex-shrink-0 transition-all"
                      style={{ background: showZetaSendMenu ? 'var(--zet-primary)' : 'var(--zet-bg-card)', border: '1px solid var(--zet-border)', color: 'var(--zet-text)' }}
                      title="Mod seç"
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                    </button>
                    <input
                      data-testid="zeta-input"
                      placeholder={t('askZeta')}
                      value={zetaInput}
                      onChange={e => setZetaInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { setShowZetaSendMenu(false); sendZetaMessage(); } }}
                      className="zet-input flex-1 text-xs py-1.5"
                    />
                    <button
                      data-testid="zeta-send-btn"
                      onClick={() => { setShowZetaSendMenu(false); sendZetaMessage(); }}
                      className="zet-btn px-2"
                    >
                      <Send className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ZETA Auto-Write Mode */}
            {zetaMode === 'autowrite' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header with back button */}
                <div className="flex items-center gap-2 p-2 border-b" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)' }}>
                  <button data-testid="autowrite-back-btn" onClick={() => { setZetaMode('chat'); setAutoResult(null); }} className="p-1 rounded hover:bg-white/10">
                    <ArrowLeft className="h-3.5 w-3.5" style={{ color: '#10b981' }} />
                  </button>
                  <PenTool className="h-3.5 w-3.5" style={{ color: '#10b981' }} />
                  <span className="text-xs font-semibold" style={{ color: '#10b981' }}>Otomatik Yazma</span>
                </div>
                <div className="flex-1 p-3 overflow-y-auto">
                  {!autoResult ? (
                    <div className="space-y-3">
                      <p className="text-[10px] text-center" style={{ color: 'var(--zet-text-muted)' }}>ZETA belgenizi sizin için yazar</p>

                      <div>
                        <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Konu / Prompt</label>
                        <textarea
                          data-testid="auto-write-prompt"
                          value={autoPrompt}
                          onChange={e => setAutoPrompt(e.target.value)}
                          placeholder="Ornegin: Yapay zekanin gelecegi hakkında detaylı bir makale yaz..."
                          className="zet-input w-full text-xs resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Sayfa Sayisi</label>
                          <select data-testid="auto-write-pages" value={autoPages} onChange={e => setAutoPages(Number(e.target.value))} className="zet-input w-full text-xs py-1.5">
                            {[1,2,3,4,5,6,7].map(n => (<option key={n} value={n}>{n} sayfa</option>))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Yazim Stili</label>
                          <select data-testid="auto-write-style" value={autoStyle} onChange={e => setAutoStyle(e.target.value)} className="zet-input w-full text-xs py-1.5">
                            <option value="profesyonel">Profesyonel</option>
                            <option value="akademik">Akademik</option>
                            <option value="yaratici">Yaratici</option>
                            <option value="resmi">Resmi</option>
                            <option value="gunluk">Gunluk</option>
                            <option value="hikaye">Hikaye</option>
                          </select>
                        </div>
                      </div>

                      <div className="rounded-lg p-2" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <CreditCard className="h-3 w-3" style={{ color: '#10b981' }} />
                          <span className="text-[10px] font-semibold" style={{ color: '#10b981' }}>Tahmini Maliyet</span>
                        </div>
                        <p className="text-[10px]" style={{ color: 'var(--zet-text-muted)' }}>
                          {autoPages} sayfa x ~500 kelime = ~{Math.max(10, Math.floor((autoPages * 43) / 3) * 10)} kredi
                        </p>
                      </div>

                      {autoError && (
                        <div className="rounded-lg p-2 text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                          {autoError}
                        </div>
                      )}

                      <button
                        data-testid="auto-write-start-btn"
                        onClick={handleAutoWrite}
                        disabled={!autoPrompt.trim() || autoLoading}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] disabled:opacity-40 flex items-center justify-center gap-2"
                        style={{ background: '#10b981', color: 'white' }}
                      >
                        {autoLoading ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> ZETA yaziyor...</>) : (<><PenTool className="h-3.5 w-3.5" /> Yazmaya Başla</>)}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4" style={{ color: '#10b981' }} />
                          <span className="text-xs font-semibold" style={{ color: '#10b981' }}>Yazma Tamamlandı!</span>
                        </div>
                        <button onClick={() => { setAutoResult(null); setAutoPrompt(''); }} className="text-[10px] px-2 py-1 rounded hover:bg-white/10" style={{ color: 'var(--zet-text-muted)' }} data-testid="auto-write-new-btn">
                          Yeni Yaz
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(16,185,129,0.08)' }}>
                          <p className="text-sm font-bold" style={{ color: '#10b981' }}>{autoResult.pages?.length || 1}</p>
                          <p className="text-[9px]" style={{ color: 'var(--zet-text-muted)' }}>Sayfa</p>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(16,185,129,0.08)' }}>
                          <p className="text-sm font-bold" style={{ color: '#10b981' }}>{autoResult.lines || 0}</p>
                          <p className="text-[9px]" style={{ color: 'var(--zet-text-muted)' }}>Satir</p>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(16,185,129,0.08)' }}>
                          <p className="text-sm font-bold" style={{ color: '#10b981' }}>{autoResult.credits_spent || 0}</p>
                          <p className="text-[9px]" style={{ color: 'var(--zet-text-muted)' }}>Kredi</p>
                        </div>
                      </div>
                      <div className="rounded-lg p-2 text-xs max-h-48 overflow-y-auto whitespace-pre-wrap" style={{ background: 'var(--zet-bg-card)', color: 'var(--zet-text)', border: '1px solid var(--zet-border)' }}>
                        {autoResult.content?.substring(0, 600)}...
                      </div>
                      <button
                        onClick={() => { if (onAutoWriteContent) onAutoWriteContent(autoResult.pages || [autoResult.content], autoPages); }}
                        className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                        style={{ background: '#10b981', color: 'white' }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Belgeye Ekle
                      </button>
                      <p className="text-[10px] text-center" style={{ color: 'var(--zet-text-muted)' }}>
                        Kalan kredi: {autoResult.credits_remaining}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ZETA Deep Analysis Mode */}
            {zetaMode === 'deep' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header with back button */}
                <div className="flex items-center gap-2 p-2 border-b" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
                  <button data-testid="deep-back-btn" onClick={() => { setZetaMode('chat'); setDeepResult(null); }} className="p-1 rounded hover:bg-white/10">
                    <ArrowLeft className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
                  </button>
                  <Search className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
                  <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Derin Analiz</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>100 Kredi</span>
                </div>
                <div className="flex-1 p-3 overflow-y-auto">
                  {(userPlan !== 'pro' && userPlan !== 'ultra') ? (
                    <div className="rounded-xl p-4 text-center mt-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                      <Search className="h-8 w-8 mx-auto mb-2" style={{ color: '#f59e0b', opacity: 0.5 }} />
                      <p className="text-xs font-semibold mb-1" style={{ color: '#f59e0b' }}>Pro veya Ultra Plan Gerekli</p>
                      <p className="text-[10px]" style={{ color: 'var(--zet-text-muted)' }}>Derin Analiz sadece Pro ve Ultra aboneler için kullanılabilir.</p>
                      {onShowUpgrade && (
                        <button onClick={() => onShowUpgrade('Derin Analiz için Pro veya Ultra plana yükseltmeniz gerekiyor.')} className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: '#f59e0b', color: 'white' }}>
                          Plani Yükselt
                        </button>
                      )}
                    </div>
                  ) : !deepResult ? (
                    <div className="space-y-3">
                      <p className="text-[10px] text-center" style={{ color: 'var(--zet-text-muted)' }}>ZETA internette araştırma yaparak derinlemesine analiz yazar. Bu işlem 10 dakikaya kadar sürebilir.</p>

                      <div>
                        <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Araştırma Konusu</label>
                        <textarea
                          data-testid="deep-analysis-topic"
                          value={deepTopic}
                          onChange={e => setDeepTopic(e.target.value)}
                          placeholder="Ornegin: Turkiye'de yapay zeka sektoru ve gelecek projeksiyonlari..."
                          className="zet-input w-full text-xs resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="rounded-lg p-2" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <CreditCard className="h-3 w-3" style={{ color: '#f59e0b' }} />
                          <span className="text-[10px] font-semibold" style={{ color: '#f59e0b' }}>Maliyet: 100 Kredi</span>
                        </div>
                        <p className="text-[10px]" style={{ color: 'var(--zet-text-muted)' }}>Internette detaylı araştırma + AI analiz raporu</p>
                      </div>

                      {deepError && (
                        <div className="rounded-lg p-2 text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                          {deepError}
                        </div>
                      )}

                      <button
                        data-testid="deep-analysis-start-btn"
                        onClick={handleDeepAnalysis}
                        disabled={!deepTopic.trim() || deepLoading}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] disabled:opacity-40 flex items-center justify-center gap-2"
                        style={{ background: '#f59e0b', color: 'white' }}
                      >
                        {deepLoading ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Araştırılıyor...</>) : (<><Search className="h-3.5 w-3.5" /> Derin Analiz Başlat</>)}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Search className="h-4 w-4" style={{ color: '#f59e0b' }} />
                          <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Analiz Tamamlandı!</span>
                        </div>
                        <button onClick={() => { setDeepResult(null); setDeepTopic(''); }} className="text-[10px] px-2 py-1 rounded hover:bg-white/10" style={{ color: 'var(--zet-text-muted)' }} data-testid="deep-analysis-new-btn">
                          Yeni Analiz
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(245,158,11,0.08)' }}>
                          <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>{deepResult.sources_found || 0}</p>
                          <p className="text-[9px]" style={{ color: 'var(--zet-text-muted)' }}>Kaynak</p>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(245,158,11,0.08)' }}>
                          <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>{deepResult.credits_spent || 100}</p>
                          <p className="text-[9px]" style={{ color: 'var(--zet-text-muted)' }}>Kredi</p>
                        </div>
                      </div>
                      <div className="rounded-lg p-2 text-xs max-h-96 overflow-y-auto whitespace-pre-wrap" style={{ background: 'var(--zet-bg-card)', color: 'var(--zet-text)', border: '1px solid var(--zet-border)' }}>
                        {deepResult.analysis}
                      </div>
                      {/* Kaynak Linkleri */}
                      {deepResult.sources && deepResult.sources.length > 0 && (
                        <div className="rounded-lg p-2" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                          <p className="text-[10px] font-semibold mb-1.5" style={{ color: '#f59e0b' }}>Kaynaklar ({deepResult.sources.length})</p>
                          <div className="space-y-1">
                            {deepResult.sources.map((src, idx) => (
                              <a key={idx} href={src.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5 text-[10px] hover:bg-white/5 rounded p-1 transition-colors" style={{ color: 'var(--zet-text-muted)' }}>
                                <span className="font-mono flex-shrink-0" style={{ color: '#f59e0b' }}>[{idx + 1}]</span>
                                <span className="underline decoration-dotted hover:text-white truncate">{src.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-[10px] text-center" style={{ color: 'var(--zet-text-muted)' }}>
                        Arama sorguları: {deepResult.search_queries?.join(', ')}
                      </p>
                      {/* Belgeye Ekle Butonu */}
                      <button
                        data-testid="deep-add-to-doc-btn"
                        onClick={() => {
                          if (onAutoWriteContent) {
                            onAutoWriteContent([deepResult.analysis], 1);
                          }
                        }}
                        className="w-full py-2 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                        style={{ background: '#f59e0b', color: 'white' }}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Belgeye Ekle
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== JUDGE MINI TAB ===== */}
        {activeAI === 'judge' && (
          <>
            <div data-testid="judge-messages" className="flex-1 p-2 overflow-y-auto text-xs" style={{ background: 'linear-gradient(135deg, #4b0c37 0%, #1a0a14 100%)' }}>
              {userPlan === 'free' && judgeMessages.length === 0 && (
                <div className="text-center py-6" style={{ color: '#c8005a' }}>
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'rgba(200, 0, 90, 0.2)', border: '2px solid #c8005a' }}>
                    <Scale className="h-6 w-6" />
                  </div>
                  <p className="font-semibold text-sm">ZET Judge Mini</p>
                  <p className="text-xs mt-2 opacity-70">Free planda kullanılamaz</p>
                  <p className="text-xs mt-1 opacity-50 mb-3">Plus veya üzeri plana yükseltin</p>
                  {onShowUpgrade && (
                    <button onClick={() => onShowUpgrade('judge')} className="px-4 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105" style={{ background: '#c8005a', color: 'white' }}>
                      Plani Yükselt
                    </button>
                  )}
                </div>
              )}
              {userPlan !== 'free' && judgeMessages.length === 0 && (
                <div className="text-center py-6" style={{ color: '#c8005a' }}>
                  <Scale className="h-6 w-6 mx-auto mb-2 opacity-70" />
                  <p className="font-semibold">ZET Judge Mini</p>
                  <p className="text-xs mt-1 opacity-70">İş analizi - Vizyon - Strateji</p>
                  <p className="text-[10px] mt-2 opacity-50">Belgenizi otomatik olarak görüyorum.</p>
                  {userUsage && (
                    <p className="text-xs mt-2 opacity-50">
                      Kalan: {userUsage.remaining?.judge_basic || 0} temel, {userUsage.remaining?.judge_deep || 0} derin
                    </p>
                  )}
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
                    <div className="px-2.5 py-1.5 rounded-lg" style={{ background: msg.role === 'user' ? '#c8005a' : 'rgba(200, 0, 90, 0.2)', color: '#fff', border: msg.role === 'assistant' ? '1px solid rgba(200, 0, 90, 0.3)' : 'none' }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {judgeLoading && (
                <ZetaTypingIndicator isJudge className="py-1" />
              )}
              <div ref={judgeChatEndRef} />
            </div>
            <div className="p-2 border-t" style={{ borderColor: '#c8005a33', background: '#4b0c37' }}>
              {judgeImage && (
                <div className="mb-2 relative inline-block">
                  <img src={judgeImage} alt="To send" className="max-w-[80px] max-h-[60px] rounded" />
                  <button onClick={() => setJudgeImage(null)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">x</button>
                </div>
              )}
              {showJudgeSendMenu && (
                <div className="flex gap-1 mb-1.5">
                  <button
                    data-testid="judge-fast-send"
                    onClick={() => { setJudgeMode('fast'); setShowJudgeSendMenu(false); }}
                    className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-all"
                    style={{ background: judgeMode === 'fast' ? '#c8005a' : 'rgba(200,0,90,0.12)', color: '#fff', border: '1px solid #c8005a44' }}
                  >
                    <Sparkles className="h-2.5 w-2.5" /> Hızlı
                  </button>
                  <button
                    data-testid="judge-deep-send"
                    onClick={() => { setJudgeMode('deep'); setShowJudgeSendMenu(false); }}
                    className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-all"
                    style={{ background: judgeMode === 'deep' ? '#c8005a' : 'rgba(200,0,90,0.12)', color: '#fff', border: '1px solid #c8005a44' }}
                  >
                    <Search className="h-2.5 w-2.5" /> Derin
                  </button>
                </div>
              )}
              <div className="flex gap-1">
                <button
                  onClick={e => { e.stopPropagation(); setShowJudgeSendMenu(v => !v); }}
                  className="p-1.5 rounded-lg flex-shrink-0 transition-all"
                  style={{ background: showJudgeSendMenu ? '#c8005a' : 'rgba(200,0,90,0.15)', border: '1px solid #c8005a44', color: '#fff' }}
                  title="Mod seç"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                </button>
                <input
                  data-testid="judge-input"
                  placeholder={judgeMode === 'deep' ? 'Derin analiz için...' : 'Hızlı analiz için...'}
                  value={judgeInput}
                  onChange={e => setJudgeInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { setShowJudgeSendMenu(false); sendJudgeMessage(); } }}
                  className="flex-1 text-xs py-1.5 px-2 rounded"
                  style={{ background: 'rgba(200, 0, 90, 0.15)', border: '1px solid #c8005a33', color: '#fff' }}
                />
                <button
                  data-testid="judge-send-btn"
                  onClick={() => { setShowJudgeSendMenu(false); sendJudgeMessage(); }}
                  className="px-2 rounded flex items-center"
                  style={{ background: '#c8005a' }}
                >
                  <Send className="h-3 w-3 text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      )}

      {/* ===== ZETA TERMINAL CONSOLE ===== */}
      {showConsole && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowConsole(false); setConsoleStage('main'); } }}
        >
          <div
            className="flex flex-col rounded-lg overflow-hidden"
            style={{
              width: 'min(640px, 96vw)', height: 'min(480px, 80vh)',
              background: '#0d0d0d', border: '1px solid #333',
              fontFamily: "'Courier New', Courier, monospace",
              boxShadow: '0 0 40px rgba(0,255,70,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{ background: '#1a1a1a', borderBottom: '1px solid #333' }}>
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
              </div>
              <span className="text-xs" style={{ color: '#666' }}>zet-terminal — zsh</span>
              <button onClick={() => { setShowConsole(false); setConsoleStage('main'); }} style={{ color: '#666', fontSize: 16, lineHeight: 1 }}>×</button>
            </div>

            {/* Output area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-0.5" style={{ color: '#00e050' }}>
              {consoleLines.map((line, i) => (
                <div key={i} className="text-xs leading-relaxed whitespace-pre-wrap" style={{
                  color: line.type === 'error' ? '#ff4444'
                    : line.type === 'success' ? '#00ff88'
                    : line.type === 'input' ? '#ffffff'
                    : line.type === 'system' ? '#888'
                    : line.type === 'auth' ? 'transparent'
                    : '#00e050',
                  display: line.type === 'auth' ? 'block' : undefined,
                }}>
                  {line.type === 'auth' ? (
                    <div className="my-2">
                      <button
                        onClick={handleAdminGoogleAuth}
                        className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium transition-all"
                        style={{ background: '#fff', color: '#333', border: '1px solid #ccc' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Sign in with Google
                      </button>
                    </div>
                  ) : line.text}
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>

            {/* Autocomplete suggestions */}
            {consoleInput && getConsoleSuggestions(consoleInput).length > 0 && (
              <div className="flex-shrink-0 px-4 py-1.5 flex flex-wrap gap-1.5" style={{ background: '#0a0a0a', borderTop: '1px solid #1a1a1a' }}>
                {getConsoleSuggestions(consoleInput).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setConsoleInput(s.replace('(number)', '')); consoleInputRef.current?.focus(); }}
                    className="text-[10px] px-2 py-0.5 rounded font-mono"
                    style={{ background: '#1a2a1a', color: '#00e050', border: '1px solid #2a3a2a' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input area */}
            <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ background: '#111', borderTop: '1px solid #222' }}>
              <span className="text-xs" style={{ color: '#00e050' }}>{'>'}</span>
              <input
                ref={consoleInputRef}
                type={consoleStage === 'admin_pin' ? 'password' : 'text'}
                value={consoleInput}
                onChange={e => setConsoleInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { handleConsoleSubmit(); }
                  else if (e.key === 'Tab') {
                    e.preventDefault();
                    const suggestions = getConsoleSuggestions(consoleInput);
                    if (suggestions.length === 1) setConsoleInput(suggestions[0].replace('(number)', ''));
                  }
                }}
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: '#fff', caretColor: '#00e050' }}
                placeholder={consoleStage === 'admin_pin' ? 'PIN girin...' : 'komut girin...'}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                onClick={handleConsoleSubmit}
                className="text-xs px-2 py-1 rounded"
                style={{ background: '#1a3a1a', color: '#00e050', border: '1px solid #2a4a2a' }}
              >
                Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
