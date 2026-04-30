import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, ChevronUp, Plus, Send, Download, Loader2, Volume2, Settings, Check, Zap, Brain, Star, MessageSquare, Wrench, Layers, Palette } from 'lucide-react';
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
  onAutoWriteContent,
  onRefreshCredits,
  onUpdateSettings,
  onTakeNote,
  onApplyEdit,
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

  // ZETA sub-mode: 'chat' | 'patch' | 'puzzle' | 'colors'
  const [zetaMode, setZetaMode] = useState('chat');
  const [prevModel, setPrevModel] = useState(null); // model saved before entering puzzle

  // Model selection
  const [zetaModel, setZetaModel] = useState('prime');
  const [showModelPicker, setShowModelPicker] = useState(false);

  // Zeta Colors (image generation) state
  const [colorPrompt, setColorPrompt] = useState('');
  const [colorPro, setColorPro] = useState(false);
  const [colorAspect, setColorAspect] = useState('16:9');
  const [colorLoading, setColorLoading] = useState(false);
  const [colorResult, setColorResult] = useState(null);
  const [colorError, setColorError] = useState('');

  useEffect(() => {
    if (docId) {
      setZetaMessages([]);
      setZetaSessionId(null);
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
      const res = await axios.get(`${API}/chat-history/${docId}?ai_type=zeta`, { withCredentials: true });
      const msgs = res.data.flatMap(h => [
        { role: 'user', content: h.user_message },
        { role: 'assistant', content: h.ai_response }
      ]);
      setZetaMessages(msgs);
      if (res.data.length) setZetaSessionId(res.data[res.data.length - 1].session_id);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'instant' }), 100);
    } catch {
      // no history yet
    }
  };

  useEffect(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [zetaMessages]);

  // Auto-detect CEO from email
  useEffect(() => {
    if (user?.email === CEO_EMAIL) {
      setIsCEO(true);
      localStorage.setItem('zet_ceo_mode', 'true');
    }
  }, [user]);

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

  const handleModeChange = (newMode) => {
    if (newMode === 'puzzle' && zetaMode !== 'puzzle') {
      setPrevModel(zetaModel);
      setZetaModel('aziz');
    } else if (zetaMode === 'puzzle' && newMode !== 'puzzle') {
      if (prevModel) setZetaModel(prevModel);
      setPrevModel(null);
    }
    setZetaMode(newMode);
  };

  const handleColorGenerate = async () => {
    if (!colorPrompt.trim() || colorLoading) return;
    setColorLoading(true);
    setColorError('');
    setColorResult(null);
    try {
      const res = await axios.post(`${API}/zeta/generate-image`, {
        prompt: colorPrompt, pro: colorPro, aspect_ratio: colorAspect,
      }, { withCredentials: true });
      if (res.data.images?.length) {
        const img = res.data.images[0];
        setColorResult(`data:${img.mime_type};base64,${img.data}`);
      } else {
        setColorError('Görsel oluşturulamadı');
      }
      if (onRefreshCredits) onRefreshCredits();
    } catch (err) {
      setColorError(err.response?.data?.detail || 'Görsel oluşturma hatası');
    }
    setColorLoading(false);
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
  const CEO_COMMANDS = ['/verify/@username/red/', '/verify/@username/gold/', '/verify/@username/blue/', '/verify/@username/remove/', '/data/', '/data/posts/', '/data/users/', '/data/documents/', '/data/comments/', '/data/notes/', '/data/analytics/', '/data/all/', '/data/last7/', '/data/last30/'];
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
    } else if (/^\/data(\/[\w]*\/?)?$/.test(normalized)) {
      if (!isCEO) { addConsoleLine('Permission denied. Sadece CEO veri dışa aktarabilir.', 'error'); return; }
      const VALID = ['posts', 'users', 'documents', 'comments', 'notes', 'analytics', 'all', 'last7', 'last30'];
      const typeMatch = normalized.match(/^\/data\/?([\w]*)\/?\s*$/);
      const exportType = typeMatch && typeMatch[1] ? typeMatch[1] : null;
      if (!exportType) {
        addConsoleLine('Kullanım: /data/posts/ | /data/users/ | /data/documents/ | /data/comments/ | /data/notes/ | /data/analytics/ | /data/all/ | /data/last7/ | /data/last30/', 'output');
        return;
      }
      if (!VALID.includes(exportType)) {
        addConsoleLine(`✗ Geçersiz tip: ${exportType}. Geçerli: ${VALID.join(', ')}`, 'error');
        return;
      }
      addConsoleLine(`"${exportType}" verisi hazırlanıyor ve CEO e-postasına gönderiliyor...`, 'output');
      try {
        const res = await axios.post(`${API}/admin/export-data`, { type: exportType }, { withCredentials: true });
        addConsoleLine(`✓ ${res.data.message}`, 'success');
      } catch (err) {
        addConsoleLine(`✗ ${err.response?.data?.detail || 'Dışa aktarma başarısız.'}`, 'error');
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
        custom_prompt: zetaCustomPrompt || '', is_ceo: isCEO,
        model: zetaMode === 'puzzle' ? 'aziz' : zetaModel,
        mode: zetaMode,
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
    <div data-testid="right-panel" className="w-full h-full border-l flex flex-col" style={{ borderColor: 'var(--zet-border)' }}>
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

      {/* AI — ZETA */}
      {showZeta && (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        {(() => {
          const MODELS = [
            { id: 'spark', label: 'Zeta Spark', desc: 'Günlük görevler için hızlı ve verimli', Icon: Zap, color: '#22c55e' },
            { id: 'prime', label: 'Zeta Prime', desc: 'Karmaşık görevler için güçlü ve dengeli', Icon: Brain, color: 'var(--zet-primary-light, #818cf8)' },
            { id: 'aziz', label: 'Zeta Aziz', desc: 'En üst düzey analiz ve yaratıcılık', Icon: Star, color: '#f59e0b' },
          ];
          const active = MODELS.find(m => m.id === zetaModel) || MODELS[1];
          return (
            <div className="border-b flex-shrink-0 relative" style={{ borderColor: 'var(--zet-border)' }}>
              <div className="flex items-center px-2 py-1.5 gap-1">
                <img src="/zeta-icon.svg" alt="ZETA" style={{ width: 14, height: 14, filter: 'invert(45%) sepia(80%) saturate(600%) hue-rotate(200deg) brightness(120%)' }} />
                <span className="font-semibold text-xs ml-0.5 flex-1" style={{ color: 'var(--zet-text)' }}>ZETA</span>
                {/* Model Picker Button */}
                <button
                  onClick={e => { e.stopPropagation(); setShowModelPicker(v => !v); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all hover:bg-white/10"
                  style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)', color: active.color }}
                >
                  <active.Icon className="h-3 w-3" />
                  {active.label}
                  <ChevronDown className="h-2.5 w-2.5 ml-0.5" style={{ color: 'var(--zet-text-muted)' }} />
                </button>
                {onShowChatSettings && (
                  <button onClick={onShowChatSettings} data-testid="chat-settings-btn" className="p-1 hover:bg-white/10 rounded" title="Chat Ayarları">
                    <Settings className="h-3.5 w-3.5" style={{ color: 'var(--zet-text-muted)' }} />
                  </button>
                )}
              </div>

              {/* Model Dropdown */}
              {showModelPicker && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowModelPicker(false)} />
                  <div
                    className="absolute right-2 top-full mt-1 z-[101] rounded-xl overflow-hidden shadow-2xl"
                    style={{ width: 260, background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)' }}
                    onClick={e => e.stopPropagation()}
                  >
                    {MODELS.map((m, idx) => {
                      const isActive = zetaModel === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => { setZetaModel(m.id); setShowModelPicker(false); }}
                          className="w-full flex items-start gap-3 px-3 py-2.5 transition-colors text-left hover:bg-white/5"
                          style={{ borderBottom: idx < MODELS.length - 1 ? '1px solid var(--zet-border)' : 'none' }}
                        >
                          <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: m.color + '20' }}>
                            <m.Icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold" style={{ color: isActive ? m.color : 'var(--zet-text)' }}>{m.label}</div>
                            <div className="text-[10px] mt-0.5 leading-snug" style={{ color: 'var(--zet-text-muted)' }}>{m.desc}</div>
                          </div>
                          {isActive && <Check className="h-3.5 w-3.5 flex-shrink-0 mt-1" style={{ color: m.color }} />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* ── Status banners ── */}
        {isCEO && (
          <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] font-semibold flex-shrink-0" style={{ background: 'rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
            👑 CEO MODU AKTİF
          </div>
        )}
        {!isCEO && isAdmin && (
          <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] font-semibold flex-shrink-0" style={{ background: 'rgba(99,102,241,0.15)', borderBottom: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
            🛡 ADMİN MODU AKTİF
          </div>
        )}

        {/* ── Vertical mode rail ── */}
        {(() => {
          const ZETA_MODES = [
            { id: 'chat',   label: 'Chat',        Icon: MessageSquare, color: 'var(--zet-primary)',  desc: 'Zeta ile konuş' },
            { id: 'patch',  label: 'Patch',       Icon: Wrench,        color: '#10b981',             desc: 'Belge tara & düzelt' },
            { id: 'puzzle', label: 'Puzzle',      Icon: Layers,        color: '#f59e0b',             desc: 'Derin problem çözme · Aziz' },
            { id: 'colors', label: 'Zeta Colors', Icon: Palette,       color: '#ec4899',             desc: 'AI görsel oluştur' },
          ];
          return (
            <div className="flex-shrink-0 border-b" style={{ borderColor: 'var(--zet-border)' }}>
              {ZETA_MODES.map(m => {
                const active = zetaMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModeChange(m.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-white/5"
                    style={{
                      borderLeft: `2px solid ${active ? m.color : 'transparent'}`,
                      background: active ? m.color + '12' : 'transparent',
                    }}
                  >
                    <m.Icon className="h-3 w-3 flex-shrink-0" style={{ color: m.color }} />
                    <span className="text-[11px] font-semibold flex-1" style={{ color: active ? m.color : 'var(--zet-text)' }}>{m.label}</span>
                    <span className="text-[9px]" style={{ color: 'var(--zet-text-muted)' }}>{m.desc}</span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* ── Chat / Patch / Puzzle: shared messages + input layout ── */}
        {(zetaMode === 'chat' || zetaMode === 'patch' || zetaMode === 'puzzle') && (
          <>
            {zetaMode === 'puzzle' && (
              <div className="flex-shrink-0 flex items-center justify-center gap-1.5 py-1 text-[10px] font-semibold" style={{ background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                <Star className="h-3 w-3" /> Zeta Aziz aktif — karmaşık problem modu
              </div>
            )}
            <div data-testid="zeta-messages" className="flex-1 p-2 overflow-y-auto text-xs" style={{ background: 'var(--zet-bg)' }}>
              {zetaMessages.length === 0 && (
                <div className="text-center py-6" style={{ color: 'var(--zet-text-muted)' }}>
                  <img src="/zeta-icon.svg" alt="ZETA" className="mx-auto mb-2" style={{ width: 28, height: 28, opacity: 0.6, filter: 'invert(45%) sepia(80%) saturate(600%) hue-rotate(200deg) brightness(120%)' }} />
                  {zetaMode === 'patch' ? (
                    <>
                      <p className="text-xs font-medium">Patch modu</p>
                      <p className="text-[10px] mt-2 opacity-70">Belgedeki sorunları tarar ve düzeltir. Örnek: "5. ve 6. sayfalardaki yazım hatalarını bul"</p>
                    </>
                  ) : zetaMode === 'puzzle' ? (
                    <>
                      <p className="text-xs font-medium">Puzzle modu</p>
                      <p className="text-[10px] mt-2 opacity-70">Karmaşık sorunlar için derin analiz. Zeta Aziz modeli kullanılıyor.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-medium">{t('askZetaAnything')}</p>
                      <p className="text-[10px] mt-2 opacity-70">Belgenizi otomatik olarak görüyorum.</p>
                    </>
                  )}
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
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button onClick={() => speakMessage(msg.content, i)} className={`p-1 rounded hover:bg-white/10 ${speakingMsg === i ? 'bg-white/10' : ''}`} title="Dinle">
                          <Volume2 className={`h-3 w-3 ${speakingMsg === i ? 'text-blue-400' : ''}`} style={{ color: speakingMsg === i ? undefined : 'var(--zet-text-muted)' }} />
                        </button>
                        {onApplyEdit && (
                          <button onClick={() => onApplyEdit(msg.content)} className="p-1 rounded hover:bg-white/10" title="Belgeye uygula">
                            <Check className="h-3 w-3" style={{ color: '#22c55e' }} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {zetaLoading && <ZetaTypingIndicator className="py-1" />}
              <div ref={chatEndRef} />
              <audio ref={audioRef} hidden />
            </div>
            {/* Input bar */}
            <div className="p-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
              {zetaImage && (
                <div className="mb-2 relative inline-block">
                  <img src={zetaImage} alt="To send" className="max-w-[80px] max-h-[60px] rounded" />
                  <button onClick={() => setZetaImage(null)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">x</button>
                </div>
              )}
              <div className="flex gap-1">
                <input
                  data-testid="zeta-input"
                  placeholder={
                    zetaMode === 'patch'  ? 'Örn: "5-6. sayfalardaki yazım hatalarını bul"' :
                    zetaMode === 'puzzle' ? 'Karmaşık sorununu yaz…' :
                    t('askZeta')
                  }
                  value={zetaInput}
                  onChange={e => setZetaInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendZetaMessage(); }}
                  className="zet-input flex-1 text-xs py-1.5"
                />
                <button data-testid="zeta-send-btn" onClick={sendZetaMessage} className="zet-btn px-2">
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Zeta Colors: image generation ── */}
        {zetaMode === 'colors' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              <p className="text-[10px] text-center" style={{ color: 'var(--zet-text-muted)' }}>Nano Banana ile AI görsel oluştur</p>

              <div>
                <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Prompt</label>
                <textarea
                  value={colorPrompt}
                  onChange={e => setColorPrompt(e.target.value)}
                  placeholder="Görsel açıklaması yaz…"
                  className="zet-input w-full text-xs resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Boyut</label>
                  <select value={colorAspect} onChange={e => setColorAspect(e.target.value)} className="zet-input w-full text-xs py-1">
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="1:1">1:1</option>
                    {(userPlan === 'pro' || userPlan === 'ultra') && <>
                      <option value="2.55:1">2.55:1</option>
                      <option value="2.39:1">2.39:1</option>
                    </>}
                  </select>
                </div>
                <div className="flex flex-col justify-end pb-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={colorPro} onChange={e => setColorPro(e.target.checked)} className="rounded" />
                    <span className="text-[10px] font-medium" style={{ color: colorPro ? '#ec4899' : 'var(--zet-text-muted)' }}>Pro (50 kredi)</span>
                  </label>
                </div>
              </div>

              <div className="rounded-lg p-2 text-[10px]" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', color: 'var(--zet-text-muted)' }}>
                Maliyet: <span style={{ color: '#ec4899', fontWeight: 600 }}>{colorPro ? '50' : '20'} kredi</span>
              </div>

              {colorError && (
                <div className="rounded-lg p-2 text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  {colorError}
                </div>
              )}

              <button
                onClick={handleColorGenerate}
                disabled={!colorPrompt.trim() || colorLoading}
                className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7)', color: 'white' }}
              >
                {colorLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Oluşturuluyor…</> : <><Palette className="h-3.5 w-3.5" /> Görsel Oluştur</>}
              </button>

              {colorResult && (
                <div className="space-y-2">
                  <img src={colorResult} alt="Generated" className="w-full rounded-xl" style={{ border: '1px solid rgba(236,72,153,0.3)' }} />
                  <a href={colorResult} download="zeta-colors.png" className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]" style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)' }}>
                    <Download className="h-3.5 w-3.5" /> İndir
                  </a>
                </div>
              )}
            </div>
          </div>
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
