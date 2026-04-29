import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../contexts/AppThemeContext';
import axios from 'axios';
import {
  Search, Plus, Settings, LogOut, ArrowLeft, Send, X, Loader,
  FileText, Globe, Heart, MessageCircle,
  User, Scale, ChevronLeft, Brain, CreditCard, Zap, Map, Award,
  Check, Sparkles, HardDrive
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const C = '#c8005a';
const C_LIGHT = '#e8337a';
const C_DIM = 'rgba(200,0,90,0.12)';
const C_BORDER = 'rgba(200,0,90,0.18)';
const BG = '#0a020a';
const BG_CARD = '#120510';
const BG_CARD2 = 'rgba(255,255,255,0.04)';

const RANKS = [
  { name: 'Demir',   xp: 0,    color: '#94a3b8' },
  { name: 'Gümüş',  xp: 500,  color: '#cbd5e1' },
  { name: 'Altın',  xp: 2000, color: '#fbbf24' },
  { name: 'Elmas',  xp: 5000, color: '#60a5fa' },
  { name: 'Zümrüt', xp: 10000,color: '#34d399' },
  { name: 'Endless',xp: 25000,color: '#a78bfa' },
];

const SUBSCRIPTION_PLANS = [
  {
    id: 'plus',
    name: 'Plus',
    color: '#3b82f6',
    monthlyPrice: 10,
    yearlyPrice: 100,
    zpCost: 10000,
    scope: 'judge',
    scopeLabel: 'Sadece ZET Judge',
    recommended: false,
    features: [
      '30 Analiz/gün',
      'Temel Analiz modu',
      'Risk & Potansiyel Skoru',
      'Geçmiş analizler',
      'E-posta Desteği',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    color: C,
    monthlyPrice: 25,
    yearlyPrice: 250,
    zpCost: 30000,
    scope: 'judge',
    scopeLabel: 'Sadece ZET Judge',
    recommended: true,
    features: [
      'Sınırsız Analiz',
      'Temel + Derin Analiz modu',
      'Gelişmiş Risk & Potansiyel Analizi',
      'Detaylı rapor çıktısı',
      'Öncelikli Destek',
    ],
  },
  {
    id: 'ultra',
    name: 'Creative Station',
    color: '#f59e0b',
    monthlyPrice: 40,
    yearlyPrice: 400,
    zpCost: 50000,
    scope: 'both',
    scopeLabel: 'ZET Mindshare + ZET Judge',
    recommended: false,
    features: [
      'Sınırsız Analiz + Derin Analiz',
      'Tüm Judge özellikleri',
      'ZET Mindshare Pro tam erişim',
      '1200 Kredi/gün (Mindshare)',
      '7/24 Öncelikli Destek + API Erişimi',
    ],
  },
];

const CircleScore = ({ label, value, color }) => {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round" transform="rotate(-90 26 26)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x="26" y="30" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">{pct}</text>
      </svg>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{label}</span>
    </div>
  );
};

const MONTH_NAMES = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const groupSessionsByMonth = (sessions) => {
  const groups = {};
  sessions.forEach(s => {
    const d = new Date(s.created_at || Date.now());
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    if (!groups[key]) groups[key] = { label, items: [] };
    groups[key].items.push(s);
  });
  return Object.values(groups);
};

const JudgeDashboard = () => {
  const { user, logout } = useAuth();
  const { switchApp } = useAppTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('projects');
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Media feed
  const [mediaPosts, setMediaPosts] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaFeedTab, setMediaFeedTab] = useState('feed');
  const [mediaHasMore, setMediaHasMore] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Analysis chat
  const [showChat, setShowChat] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [judgeScores, setJudgeScores] = useState(null);
  const [mode, setMode] = useState('basic');
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [sessionFiles, setSessionFiles] = useState([]);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mobileProjectTab, setMobileProjectTab] = useState('chat');

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');
  const [mobileSettingsSidebar, setMobileSettingsSidebar] = useState(true);

  // Credits
  const [primeDriveDocs, setPrimeDriveDocs] = useState(() => JSON.parse(localStorage.getItem('prime_drive_docs') || '[]'));
  const [creditPackages, setCreditPackages] = useState([]);
  const [buyingCredits, setBuyingCredits] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [subscribing, setSubscribing] = useState(false);
  const [userSubscription, setUserSubscription] = useState(user?.subscription || 'free');
  const [defaultMode, setDefaultMode] = useState(() => localStorage.getItem('judge_default_mode') || 'basic');

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'info') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => { fetchSessions(); fetchSubscription(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === 'media') loadPosts(true, mediaFeedTab);
  }, [activeTab, mediaFeedTab]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (showSettings && settingsTab === 'credits' && creditPackages.length === 0) {
      fetchCreditPackages();
    }
  }, [showSettings, settingsTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await axios.get(`${API}/subscription`, { withCredentials: true });
      if (res.data.plan) setUserSubscription(res.data.plan);
    } catch { /* keep default */ }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API}/judge/sessions`, { withCredentials: true });
      setSessions(res.data.sessions || []);
    } catch { setSessions([]); }
    finally { setSessionsLoading(false); }
  };

  const fetchCreditPackages = async () => {
    try {
      const res = await axios.get(`${API}/credits/packages`, { withCredentials: true });
      setCreditPackages(res.data.packages || []);
    } catch { setCreditPackages([]); }
  };

  const handleBuyCredits = async (pkgId) => {
    setBuyingCredits(true);
    try {
      await axios.post(`${API}/credits/buy`, { package_id: pkgId }, { withCredentials: true });
      showToast('Kredi başarıyla satın alındı!', 'success');
    } catch (err) { showToast(err.response?.data?.detail || 'Satın alma hatası', 'error'); }
    finally { setBuyingCredits(false); }
  };

  const handleSubscribe = async (planId) => {
    setSubscribing(true);
    try {
      await axios.post(`${API}/subscribe`, { plan: planId, billing_cycle: billingCycle }, { withCredentials: true });
      setUserSubscription(planId);
      showToast('Abonelik başarıyla güncellendi!', 'success');
    } catch (err) { showToast(err.response?.data?.detail || 'Abonelik hatası', 'error'); }
    finally { setSubscribing(false); }
  };

  const loadPosts = useCallback(async (reset = false, tab = mediaFeedTab) => {
    if (mediaLoading) return;
    setMediaLoading(true);
    try {
      const cursor = reset ? null : (mediaPosts[mediaPosts.length - 1]?.post_id);
      const endpoint = tab === 'explore' ? `${API}/posts` : `${API}/feed`;
      const params = cursor ? { cursor } : {};
      const res = await axios.get(endpoint, { params, withCredentials: true });
      const newPosts = res.data.posts || [];
      setMediaPosts(reset ? newPosts : prev => [...prev, ...newPosts]);
      setMediaHasMore(newPosts.length >= 20);
    } catch { if (reset) setMediaPosts([]); }
    finally { setMediaLoading(false); }
  }, [mediaLoading, mediaPosts, mediaFeedTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const openNewAnalysis = () => {
    setActiveSession(null);
    setChatMessages([{ role: 'assistant', content: 'Merhaba! Ben ZET Judge. İş planınızı, projenizi veya fikrinizi analiz etmek için hazırım. Ne üzerine çalışıyorsunuz?' }]);
    setChatInput('');
    setSessionId(null);
    setJudgeScores(null);
    setMode(defaultMode);
    setShowChat(true);
  };

  const openSession = async (session) => {
    setActiveSession(session);
    setSessionId(session.session_id);
    setJudgeScores(session.risk_score != null ? { risk: session.risk_score, success: session.success_score } : null);
    setChatMessages([]);
    setShowChat(true);
    try {
      const res = await axios.get(`${API}/judge/sessions/${session.session_id}/messages`, { withCredentials: true });
      const msgs = (res.data.messages || []).map(m => ({ role: m.role, content: m.content || m.user_message || m.ai_response }));
      if (msgs.length) setChatMessages(msgs);
      else setChatMessages([{ role: 'assistant', content: session.first_message || 'Bu analiz devam ediyor.' }]);
    } catch {
      setChatMessages([{ role: 'assistant', content: session.first_message || 'Bu analiz devam ediyor.' }]);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const res = await axios.post(`${API}/judge/chat`, { message: msg, session_id: sessionId, mode }, { withCredentials: true });
      const newSid = res.data.session_id || sessionId;
      setSessionId(newSid);
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
      if (res.data.risk_score != null) setJudgeScores({ risk: res.data.risk_score, success: res.data.success_score });
      fetchSessions();
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: err.response?.data?.detail || 'Bir hata oluştu.' }]);
    } finally { setChatLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(f => {
      setSessionFiles(prev => [...prev, { name: f.name, size: f.size, type: f.type, id: Date.now() + Math.random() }]);
    });
    e.target.value = '';
  };

  const submitPost = async () => {
    if (!postContent.trim() || postSubmitting) return;
    setPostSubmitting(true);
    try {
      await axios.post(`${API}/posts`, { content: postContent, post_type: 'text' }, { withCredentials: true });
      setPostContent('');
      setShowCreatePost(false);
      loadPosts(true);
      showToast('Gönderi paylaşıldı', 'success');
    } catch (err) { showToast(err.response?.data?.detail || 'Hata oluştu', 'error'); }
    finally { setPostSubmitting(false); }
  };

  const likePost = async (postId) => {
    try {
      await axios.post(`${API}/posts/${postId}/like`, {}, { withCredentials: true });
      setMediaPosts(prev => prev.map(p => p.post_id === postId ? { ...p, liked: !p.liked, likes_count: p.liked ? p.likes_count - 1 : p.likes_count + 1 } : p));
    } catch { showToast('Beğeni gönderilemedi', 'error'); }
  };

  const goToMindshare = () => { switchApp('mindshare'); navigate('/dashboard'); };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const currentRank = RANKS.reduce((best, r) => ((user?.xp || 0) >= r.xp ? r : best), RANKS[0]);

  const filteredSessions = sessions.filter(s =>
    !searchQuery || (s.first_message || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const groupedSessions = groupSessionsByMonth(filteredSessions);

  const SETTINGS_ITEMS = [
    { id: 'profile',      label: 'Profil',            icon: User },
    { id: 'general',      label: 'Genel',              icon: Settings },
    { id: 'subscription', label: 'Abonelikler',        icon: CreditCard, color: C_LIGHT },
    { id: 'ai',           label: 'Judge AI Ayarları',  icon: Brain,      color: '#4ca8ad' },
    { id: 'primedrive',   label: 'Prime Drive',        icon: HardDrive,  color: '#6366f1' },
    { id: 'credits',      label: 'Kredi Al',           icon: Zap,        color: '#fbbf24' },
    { id: 'quests',       label: 'Görev Haritası',     icon: Map,        color: '#34d399' },
    { id: 'ranks',        label: 'Ranklar',            icon: Award,      color: currentRank.color },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>

      {/* Header */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: BG_CARD, borderBottom: `1px solid ${C_BORDER}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <img src="/logo-judge.svg" alt="ZET Judge" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>ZET Judge</span>
        </div>

        {/* Search bar */}
        <div style={{ flex: 1, maxWidth: 480, position: 'relative', margin: '0 16px' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder={activeTab === 'projects' ? 'Analizlerde ara...' : 'Gönderilerde ara...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: BG_CARD2, border: `1px solid ${C_BORDER}`, borderRadius: 10, padding: '7px 14px 7px 36px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <button onClick={openNewAnalysis}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: C, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
            <Plus size={15} /> Yeni Analiz
          </button>
          <button onClick={() => { setShowSettings(true); setMobileSettingsSidebar(true); }}
            style={{ width: 36, height: 36, borderRadius: 9, background: BG_CARD2, border: `1px solid ${C_BORDER}`, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Settings size={17} />
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ paddingTop: 76, paddingBottom: 80, maxWidth: 860, margin: '0 auto', padding: '76px 24px 80px' }}>

        {/* PROJELER TAB */}
        {activeTab === 'projects' && (
          <div>
            {sessionsLoading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
                <Loader size={24} style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite' }} />
                Analizler yükleniyor...
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Scale size={32} color={C} />
                </div>
                <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, marginBottom: 8, fontWeight: 600 }}>Henüz analiz yok</h3>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 24 }}>
                  İş planınızı veya fikrinizi analiz ettirmek için başlayın
                </p>
                <button onClick={openNewAnalysis}
                  style={{ padding: '12px 28px', borderRadius: 12, background: C, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  İlk Analizi Başlat
                </button>
              </div>
            ) : (
              <div>
                {groupedSessions.map(group => (
                  <div key={group.label} style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      {group.label}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {group.items.map(s => {
                        const inDrive = primeDriveDocs.some(d => d.id === s.session_id);
                        return (
                        <div key={s.session_id} style={{ position: 'relative' }}>
                          <div
                            onClick={() => openSession(s)}
                            style={{ background: BG_CARD2, border: `1px solid ${C_BORDER}`, borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,0,90,0.07)'; e.currentTarget.style.borderColor = 'rgba(200,0,90,0.35)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = BG_CARD2; e.currentTarget.style.borderColor = C_BORDER; }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Scale size={18} color={C_LIGHT} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.first_message || 'Analiz'}
                              </div>
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', gap: 8 }}>
                                <span>{formatDate(s.created_at)}</span>
                                <span>·</span>
                                <span>{s.message_count} mesaj</span>
                                {inDrive && <span style={{ color: '#6366f1' }}>· Drive'da</span>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                              {s.risk_score != null && (
                                <div style={{ display: 'flex', gap: 10 }}>
                                  <CircleScore label="Risk" value={s.risk_score} color="#ef4444" />
                                  <CircleScore label="Potansiyel" value={s.success_score} color="#22c55e" />
                                </div>
                              )}
                              <button
                                onClick={e => { e.stopPropagation(); if (!inDrive) { const size = Math.max(30 * 1024, (s.first_message?.length || 100) * 50); const updated = [...primeDriveDocs, { id: s.session_id, title: s.first_message?.slice(0, 40) || 'Analiz', size, addedAt: Date.now(), type: 'session' }]; setPrimeDriveDocs(updated); localStorage.setItem('prime_drive_docs', JSON.stringify(updated)); showToast('Prime Drive\'a eklendi', 'success'); } }}
                                style={{ padding: 6, borderRadius: 8, background: inDrive ? 'rgba(99,102,241,0.15)' : BG_CARD2, border: `1px solid ${inDrive ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`, color: inDrive ? '#6366f1' : 'rgba(255,255,255,0.3)', cursor: inDrive ? 'default' : 'pointer' }}
                                title={inDrive ? 'Prime Drive\'da' : 'Prime Drive\'a At'}>
                                <HardDrive size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: BG_CARD2, borderRadius: 10, padding: 4, border: `1px solid ${C_BORDER}` }}>
              {['feed', 'explore'].map(t => (
                <button key={t} onClick={() => setMediaFeedTab(t)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: mediaFeedTab === t ? 600 : 400, background: mediaFeedTab === t ? C : 'transparent', color: mediaFeedTab === t ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
                  {t === 'feed' ? 'Takip Edilenler' : 'Keşfet'}
                </button>
              ))}
            </div>

            {!showCreatePost ? (
              <button onClick={() => setShowCreatePost(true)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14, background: BG_CARD2, border: `1px solid ${C_BORDER}`, cursor: 'pointer', marginBottom: 16, color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: 'inherit' }}>
                {user?.picture ? <img src={user.picture} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 32, height: 32, borderRadius: '50%', background: C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={14} color={C_LIGHT} /></div>}
                Bir şeyler paylaş...
              </button>
            ) : (
              <div style={{ background: BG_CARD, border: `1px solid ${C_BORDER}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
                <textarea
                  autoFocus
                  placeholder="Ne düşünüyorsun?"
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, minHeight: 80, boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                  <button onClick={() => { setShowCreatePost(false); setPostContent(''); }}
                    style={{ padding: '8px 16px', borderRadius: 9, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13 }}>
                    Vazgeç
                  </button>
                  <button onClick={submitPost} disabled={!postContent.trim() || postSubmitting}
                    style={{ padding: '8px 18px', borderRadius: 9, background: postContent.trim() ? C : 'rgba(200,0,90,0.3)', border: 'none', color: '#fff', cursor: postContent.trim() ? 'pointer' : 'default', fontSize: 13, fontWeight: 600, transition: 'background 0.2s' }}>
                    {postSubmitting ? 'Paylaşılıyor...' : 'Paylaş'}
                  </button>
                </div>
              </div>
            )}

            {mediaLoading && mediaPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
                <Loader size={24} style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : mediaPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
                {mediaFeedTab === 'feed' ? 'Takip ettiğin kimse yok henüz.' : 'Gönderi bulunamadı.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {mediaPosts.map(post => (
                  <div key={post.post_id} style={{ background: BG_CARD2, border: `1px solid ${C_BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      {post.user_picture ? <img src={post.user_picture} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 36, height: 36, borderRadius: '50%', background: C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} color={C_LIGHT} /></div>}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{post.user_display_name || post.username || 'Kullanıcı'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{formatDate(post.created_at)}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: 0, whiteSpace: 'pre-wrap' }}>{post.content}</p>
                    <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                      <button onClick={() => likePost(post.post_id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: post.liked ? C_LIGHT : 'rgba(255,255,255,0.4)', fontSize: 13, padding: 0, transition: 'color 0.2s' }}>
                        <Heart size={15} fill={post.liked ? C_LIGHT : 'none'} />
                        {post.likes_count || 0}
                      </button>
                      <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 13, padding: 0 }}>
                        <MessageCircle size={15} />
                        {post.comments_count || 0}
                      </button>
                    </div>
                  </div>
                ))}
                {mediaHasMore && (
                  <button onClick={() => loadPosts(false)}
                    style={{ padding: '10px', borderRadius: 10, background: 'transparent', border: `1px solid ${C_BORDER}`, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13, width: '100%' }}>
                    Daha fazla yükle
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '10px 20px', background: BG, borderTop: `1px solid ${C_BORDER}`, zIndex: 40 }}>
        <div style={{ maxWidth: 400, margin: '0 auto', display: 'flex', background: BG_CARD2, borderRadius: 12, padding: 4, border: `1px solid ${C_BORDER}` }}>
          {[
            { id: 'projects', label: 'Projeler', icon: FileText },
            { id: 'media',    label: 'Media',    icon: Globe },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === id ? 600 : 400, background: activeTab === id ? `linear-gradient(135deg, #4b0c37, ${C})` : 'transparent', color: activeTab === id ? '#fff' : 'rgba(255,255,255,0.45)', transition: 'all 0.2s' }}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Floating New Analysis Button (projects tab only) */}
      {activeTab === 'projects' && !showChat && !showSettings && (
        <button onClick={openNewAnalysis}
          style={{ position: 'fixed', bottom: 80, right: 24, width: 52, height: 52, borderRadius: '50%', background: C, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 45, boxShadow: '0 4px 20px rgba(200,0,90,0.5)', transition: 'transform 0.2s, box-shadow 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
          <Plus size={22} />
        </button>
      )}

      {/* Project View (full screen) */}
      {showChat && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: BG, display: 'flex', flexDirection: 'column' }}>

          {/* Top bar */}
          <div style={{ height: 52, background: BG_CARD, borderBottom: `1px solid ${C_BORDER}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', flexShrink: 0 }}>
            <button onClick={() => setShowChat(false)}
              style={{ padding: 7, borderRadius: 8, background: BG_CARD2, border: `1px solid ${C_BORDER}`, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
              <ArrowLeft size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
              <img src="/logo-judge.svg" alt="" style={{ width: 22, height: 22, flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeSession ? (activeSession.first_message?.slice(0, 36) + (activeSession.first_message?.length > 36 ? '…' : '')) : 'Yeni Analiz'}
              </span>
            </div>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 3, gap: 2, flexShrink: 0 }}>
              {['basic', 'deep'].map(m => (
                <button key={m} onClick={() => setMode(m)}
                  style={{ padding: '4px 11px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: mode === m ? C : 'transparent', color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>
                  {m === 'basic' ? 'Temel' : 'Derin'}
                </button>
              ))}
            </div>
          </div>

          {/* ── DESKTOP 3-COLUMN ── */}
          {!isMobile && (
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

              {/* Left col — chart + sources */}
              <div style={{ width: 260, flexShrink: 0, borderRight: `1px solid ${C_BORDER}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Chart */}
                <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Analiz Grafiği</div>
                  <svg width="100%" height="80" viewBox="0 0 228 80" style={{ display: 'block' }}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={C} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0,1,2].map(i => <line key={i} x1="0" y1={15 + i*22} x2="228" y2={15 + i*22} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
                    <polygon
                      points={judgeScores
                        ? `0,75 40,68 80,56 120,${80 - judgeScores.success * 0.55} 170,${80 - judgeScores.success * 0.6} 228,${80 - judgeScores.success * 0.65} 228,80 0,80`
                        : "0,75 40,68 80,60 120,50 170,45 228,40 228,80 0,80"
                      }
                      fill="url(#cg)"
                    />
                    <polyline
                      points={judgeScores
                        ? `0,75 40,68 80,56 120,${80 - judgeScores.success * 0.55} 170,${80 - judgeScores.success * 0.6} 228,${80 - judgeScores.success * 0.65}`
                        : "0,75 40,68 80,60 120,50 170,45 228,40"
                      }
                      fill="none" stroke={C} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
                    />
                  </svg>
                  {judgeScores && (
                    <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                      <CircleScore label="Risk" value={judgeScores.risk} color="#ef4444" />
                      <CircleScore label="Potansiyel" value={judgeScores.success} color="#22c55e" />
                    </div>
                  )}
                </div>

                {/* Sources / files */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kaynaklar</span>
                    <label style={{ padding: '3px 10px', borderRadius: 6, background: C_DIM, border: `1px solid ${C_BORDER}`, color: C_LIGHT, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                      + Dosya
                      <input ref={fileInputRef} type="file" onChange={handleFileUpload} multiple accept="image/*,.pdf,.doc,.docx,.txt,.mp4,.mov" style={{ display: 'none' }} />
                    </label>
                  </div>
                  {sessionFiles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Kaynak eklenmedi</div>
                  ) : sessionFiles.map(f => {
                    const isImg = f.type.startsWith('image/');
                    const isVid = f.type.startsWith('video/');
                    const sz = f.size < 1048576 ? `${(f.size/1024).toFixed(0)} KB` : `${(f.size/1048576).toFixed(1)} MB`;
                    return (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: BG_CARD2, border: `1px solid ${C_BORDER}`, marginBottom: 6 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: isImg ? 'rgba(251,191,36,0.15)' : isVid ? 'rgba(168,85,247,0.15)' : C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>
                          {isImg ? '🖼' : isVid ? '🎬' : '📄'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{sz}</div>
                        </div>
                        <button onClick={() => setSessionFiles(prev => prev.filter(x => x.id !== f.id))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 2, display: 'flex' }}><X size={13} /></button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Middle col — all messages */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ padding: '14px 22px 12px', borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                    {activeSession ? `Dosya No: ${activeSession.session_id?.slice(-6).toUpperCase()}` : 'Yeni Analiz'}
                  </div>
                  <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {activeSession?.first_message || 'Analizinizi başlatın'}
                  </h1>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      {msg.role === 'assistant' && (
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0, alignSelf: 'flex-end' }}>
                          <Scale size={13} color={C_LIGHT} />
                        </div>
                      )}
                      <div style={{ maxWidth: '80%', padding: '11px 15px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px', background: msg.role === 'user' ? `linear-gradient(135deg,#7b0035,${C})` : 'rgba(255,255,255,0.06)', fontSize: 14, lineHeight: 1.65, color: '#fff', whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Scale size={13} color={C_LIGHT} />
                      </div>
                      <div style={{ padding: '11px 15px', borderRadius: '4px 18px 18px 18px', background: 'rgba(255,255,255,0.06)', display: 'flex', gap: 5, alignItems: 'center' }}>
                        {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C_LIGHT, display: 'inline-block', animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Right col — YARGI + context + input */}
              <div style={{ width: 300, flexShrink: 0, borderLeft: `1px solid ${C_BORDER}`, display: 'flex', flexDirection: 'column' }}>
                {/* YARGI + context */}
                <div style={{ padding: 16, borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
                  <button onClick={sendMessage} disabled={!chatInput.trim() || chatLoading}
                    style={{ width: '100%', padding: '13px', borderRadius: 14, background: `linear-gradient(135deg,#7b0035,${C},#e8337a)`, border: 'none', color: '#fff', cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'default', fontSize: 16, fontWeight: 800, letterSpacing: '0.07em', marginBottom: 14, opacity: chatInput.trim() && !chatLoading ? 1 : 0.45, boxShadow: '0 4px 22px rgba(200,0,90,0.45)', transition: 'opacity 0.2s' }}>
                    YARGI
                  </button>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Judge Ne Analiz Ediyor</div>
                  <div style={{ padding: '9px 12px', borderRadius: 10, background: BG_CARD2, border: `1px solid ${C_BORDER}`, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, minHeight: 36 }}>
                    {chatLoading
                      ? 'Analiz işleniyor...'
                      : (() => { const last = chatMessages.filter(m => m.role === 'user').slice(-1)[0]?.content; return last ? last.slice(0, 90) + (last.length > 90 ? '…' : '') : 'Henüz veri girilmedi'; })()
                    }
                  </div>
                  {sessionFiles.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {sessionFiles.slice(0, 3).map(f => (
                        <span key={f.id} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: C_DIM, color: C_LIGHT, maxWidth: 86, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      ))}
                      {sessionFiles.length > 3 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>+{sessionFiles.length - 3}</span>}
                    </div>
                  )}
                </div>
                {/* Input area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 14px', gap: 10 }}>
                  <textarea
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="İş planınızı veya sorunuzu yazın..."
                    style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C_BORDER}`, borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, minHeight: 100 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label style={{ padding: '9px 12px', borderRadius: 10, background: BG_CARD2, border: `1px solid ${C_BORDER}`, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Plus size={15} />
                      <input type="file" onChange={handleFileUpload} multiple accept="image/*,.pdf,.doc,.docx,.txt,.mp4,.mov" style={{ display: 'none' }} />
                    </label>
                    <button onClick={sendMessage} disabled={!chatInput.trim() || chatLoading}
                      style={{ flex: 1, padding: '9px', borderRadius: 10, background: chatInput.trim() && !chatLoading ? C : 'rgba(200,0,90,0.2)', border: 'none', color: '#fff', cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'default', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.2s' }}>
                      <Send size={14} /> Gönder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MOBILE LAYOUT ── */}
          {isMobile && (
            <>
              {/* Tab content */}
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                {/* Dosyalar */}
                {mobileProjectTab === 'files' && (
                  <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>Kaynaklar</span>
                      <label style={{ padding: '7px 14px', borderRadius: 9, background: C, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        + Dosya Ekle
                        <input type="file" onChange={handleFileUpload} multiple accept="image/*,.pdf,.doc,.docx,.txt,.mp4,.mov" style={{ display: 'none' }} />
                      </label>
                    </div>
                    {sessionFiles.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
                        <FileText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                        <p style={{ fontSize: 13 }}>Henüz kaynak eklenmedi</p>
                      </div>
                    ) : sessionFiles.map(f => {
                      const sz = f.size < 1048576 ? `${(f.size/1024).toFixed(0)} KB` : `${(f.size/1048576).toFixed(1)} MB`;
                      return (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: BG_CARD2, border: `1px solid ${C_BORDER}`, marginBottom: 8 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                            {f.type.startsWith('image/') ? '🖼' : f.type.startsWith('video/') ? '🎬' : '📄'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{sz}</div>
                          </div>
                          <button onClick={() => setSessionFiles(prev => prev.filter(x => x.id !== f.id))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4 }}><X size={16} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Analiz */}
                {mobileProjectTab === 'analysis' && (
                  <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      {activeSession ? `Dosya No: ${activeSession.session_id?.slice(-6).toUpperCase()}` : 'Yeni Analiz'}
                    </div>
                    <h2 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>
                      {activeSession?.first_message || 'Analizinizi başlatın'}
                    </h2>
                    {judgeScores && (
                      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                        <CircleScore label="Risk" value={judgeScores.risk} color="#ef4444" />
                        <CircleScore label="Potansiyel" value={judgeScores.success} color="#22c55e" />
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {chatMessages.filter(m => m.role === 'assistant').map((msg, i) => (
                        <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C_BORDER}`, fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap' }}>
                          {msg.content}
                        </div>
                      ))}
                      {chatMessages.filter(m => m.role === 'assistant').length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
                          <Scale size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                          <p style={{ fontSize: 13 }}>Henüz analiz yok</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Chat */}
                {mobileProjectTab === 'chat' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {chatMessages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                          {msg.role === 'assistant' && (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0, alignSelf: 'flex-end' }}>
                              <Scale size={13} color={C_LIGHT} />
                            </div>
                          )}
                          <div style={{ maxWidth: '82%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px', background: msg.role === 'user' ? `linear-gradient(135deg,#7b0035,${C})` : 'rgba(255,255,255,0.06)', fontSize: 13, lineHeight: 1.6, color: '#fff', whiteSpace: 'pre-wrap' }}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Scale size={13} color={C_LIGHT} />
                          </div>
                          <div style={{ padding: '10px 14px', borderRadius: '4px 18px 18px 18px', background: 'rgba(255,255,255,0.06)', display: 'flex', gap: 5, alignItems: 'center' }}>
                            {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: C_LIGHT, display: 'inline-block', animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div style={{ padding: '10px 14px', borderTop: `1px solid ${C_BORDER}`, display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0, background: BG_CARD }}>
                      <textarea
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Mesajınızı yazın..."
                        rows={2}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C_BORDER}`, borderRadius: 10, padding: '9px 13px', color: '#fff', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
                      />
                      <button onClick={sendMessage} disabled={!chatInput.trim() || chatLoading}
                        style={{ padding: '10px 13px', borderRadius: 10, background: chatInput.trim() && !chatLoading ? C : 'rgba(200,0,90,0.25)', border: 'none', color: '#fff', cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'default', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile bottom tabs */}
              <div style={{ display: 'flex', background: BG_CARD, borderTop: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
                {[
                  { id: 'files',    label: 'Dosyalar', icon: FileText },
                  { id: 'analysis', label: 'Analiz',   icon: Scale },
                  { id: 'chat',     label: 'Chat',      icon: MessageCircle },
                ].map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setMobileProjectTab(id)}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0 8px', border: 'none', background: 'transparent', color: mobileProjectTab === id ? C_LIGHT : 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 11, fontWeight: mobileProjectTab === id ? 700 : 400, borderTop: `2px solid ${mobileProjectTab === id ? C : 'transparent'}`, transition: 'all 0.2s' }}>
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Settings Panel (full screen) */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: BG, display: 'flex', flexDirection: 'column' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
            <button onClick={() => setShowSettings(false)}
              style={{ padding: 8, borderRadius: 8, background: BG_CARD2, border: `1px solid ${C_BORDER}`, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', marginRight: 4 }}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>Ayarlar</span>
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {/* Sidebar */}
            <div style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${C_BORDER}`, overflowY: 'auto', padding: '16px 12px', display: mobileSettingsSidebar ? 'flex' : 'none', flexDirection: 'column' }}
              className="md-settings-sidebar">
              {/* User summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 16px', marginBottom: 8, borderBottom: `1px solid ${C_BORDER}` }}>
                {user?.picture
                  ? <img src={user.picture} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><User size={16} color={C_LIGHT} /></div>
                }
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Kullanıcı'}</div>
                  <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: `${currentRank.color}25`, color: currentRank.color, fontWeight: 600 }}>{currentRank.name}</span>
                </div>
              </div>

              {SETTINGS_ITEMS.map(item => (
                <button key={item.id}
                  onClick={() => {
                    if (item.id === 'quests') { navigate('/quest-map'); setShowSettings(false); }
                    else { setSettingsTab(item.id); setMobileSettingsSidebar(false); }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: settingsTab === item.id ? 600 : 400, background: settingsTab === item.id ? C_DIM : 'transparent', color: settingsTab === item.id ? (item.color || '#fff') : (item.color || 'rgba(255,255,255,0.55)'), marginBottom: 2, transition: 'all 0.15s' }}>
                  <item.icon size={15} />
                  {item.label}
                </button>
              ))}

              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C_BORDER}` }}>
                <button onClick={() => { goToMindshare(); setShowSettings(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, background: 'transparent', color: 'rgba(76,168,173,0.8)', marginBottom: 2 }}>
                  <ArrowLeft size={15} /> ZET Mindshare'e Geç
                </button>
              </div>

              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C_BORDER}` }}>
                <button onClick={() => { logout(); navigate('/login'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, background: 'transparent', color: 'rgba(239,68,68,0.7)' }}>
                  <LogOut size={15} /> Çıkış Yap
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 32, display: mobileSettingsSidebar ? 'none' : 'block' }}>
              {/* Mobile back */}
              <button onClick={() => setMobileSettingsSidebar(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13 }}>
                <ChevronLeft size={15} /> Geri
              </button>

              {/* PROFIL */}
              {settingsTab === 'profile' && (
                <div style={{ maxWidth: 480 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: '#fff' }}>Profil</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 16, background: BG_CARD, border: `1px solid ${C_BORDER}`, marginBottom: 16 }}>
                    {user?.picture
                      ? <img src={user.picture} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 56, height: 56, borderRadius: '50%', background: C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><User size={24} color={C_LIGHT} /></div>
                    }
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{user?.name || 'Kullanıcı'}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{user?.email}</div>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${currentRank.color}25`, color: currentRank.color, fontWeight: 600 }}>{currentRank.name}</span>
                    </div>
                  </div>
                  <div style={{ padding: 20, borderRadius: 16, background: BG_CARD, border: `1px solid ${C_BORDER}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Hesap Bilgileri</div>
                    {[
                      { label: 'Ad Soyad', value: user?.name },
                      { label: 'E-posta', value: user?.email },
                      { label: 'Kullanıcı Adı', value: user?.username || '@' + (user?.name?.toLowerCase().replace(/\s/g, '') || 'kullanici') },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                        <span style={{ fontSize: 13, color: '#fff' }}>{row.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GENEL */}
              {settingsTab === 'general' && (
                <div style={{ maxWidth: 480 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: '#fff' }}>Genel</h2>
                  <div style={{ padding: 20, borderRadius: 16, background: BG_CARD, border: `1px solid ${C_BORDER}`, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Uygulama</div>
                    <button onClick={() => { goToMindshare(); setShowSettings(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: BG_CARD2, border: `1px solid ${C_BORDER}`, color: '#fff', cursor: 'pointer', fontSize: 13, marginBottom: 8 }}>
                      <ArrowLeft size={15} /> ZET Mindshare'e Geç
                    </button>
                    <button onClick={() => { navigate('/app-select'); setShowSettings(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: BG_CARD2, border: `1px solid ${C_BORDER}`, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                      <Settings size={15} /> Uygulama Seçici
                    </button>
                  </div>
                  <button onClick={() => { logout(); navigate('/login'); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <LogOut size={15} /> Çıkış Yap
                  </button>
                </div>
              )}

              {/* ABONELİKLER */}
              {settingsTab === 'subscription' && (
                <div style={{ maxWidth: 480 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: '#fff' }}>Abonelikler</h2>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: BG_CARD2, borderRadius: 10, padding: 4, border: `1px solid ${C_BORDER}` }}>
                    {['monthly', 'yearly'].map(cycle => (
                      <button key={cycle} onClick={() => setBillingCycle(cycle)}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: billingCycle === cycle ? 600 : 400, background: billingCycle === cycle ? C : 'transparent', color: billingCycle === cycle ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
                        {cycle === 'monthly' ? 'Aylık' : 'Yıllık'}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {SUBSCRIPTION_PLANS.map((plan) => {
                      const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
                      const fullYearly = plan.monthlyPrice * 12;
                      const period = billingCycle === 'yearly' ? '/yıl' : '/ay';
                      const isCurrent = userSubscription === plan.id;
                      return (
                        <div key={plan.id} style={{ padding: 20, borderRadius: 16, background: BG_CARD, border: `1px solid ${isCurrent ? plan.color + '60' : C_BORDER}`, position: 'relative' }}>
                          {plan.recommended && <div style={{ position: 'absolute', top: -10, left: 20, padding: '2px 12px', borderRadius: 20, background: plan.color, fontSize: 11, fontWeight: 700, color: '#fff' }}>Önerilen</div>}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 16, color: plan.color, marginBottom: 4 }}>{plan.name}</div>
                              {plan.scopeLabel && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 20, marginBottom: 6, background: plan.scope === 'both' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)', color: plan.scope === 'both' ? '#f59e0b' : 'rgba(255,255,255,0.45)', border: plan.scope === 'both' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
                                  {plan.scope === 'both' ? '✦ ' : ''}{plan.scopeLabel}
                                </span>
                              )}
                              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                                ${price}<span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>{period}</span>
                                {billingCycle === 'yearly' && <span style={{ fontSize: 11, marginLeft: 6, color: '#22c55e', fontWeight: 600 }}>%{Math.round((1 - price / fullYearly) * 100)} tasarruf</span>}
                              </div>
                            </div>
                            {isCurrent && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${plan.color}25`, color: plan.color, fontWeight: 600, flexShrink: 0 }}>Mevcut Plan</span>}
                          </div>
                          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {plan.features.map((f, fi) => (
                              <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                                <Check size={13} style={{ color: plan.color, flexShrink: 0 }} /> {f}
                              </li>
                            ))}
                          </ul>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button onClick={() => handleSubscribe(plan.id)} disabled={subscribing || isCurrent}
                              style={{ width: '100%', padding: '10px', borderRadius: 10, background: isCurrent ? 'transparent' : plan.color, border: isCurrent ? `1px solid ${plan.color}` : 'none', color: isCurrent ? plan.color : '#fff', cursor: isCurrent ? 'default' : 'pointer', fontSize: 13, fontWeight: 600 }}>
                              {isCurrent ? 'Mevcut Plan' : `$${price}${period} ile Al`}
                            </button>
                            {!isCurrent && plan.zpCost && (
                              <button onClick={() => handleSubscribe(plan.id)} disabled={subscribing}
                                style={{ width: '100%', padding: '8px', borderRadius: 10, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <Zap size={13} /> {plan.zpCost.toLocaleString()} ZP ile Al
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ textAlign: 'center', fontSize: 11, marginTop: 16, color: 'rgba(255,255,255,0.3)' }}>
                    Creative Station her iki uygulamada tam erişim sağlar.
                  </p>
                </div>
              )}

              {/* JUDGE AI AYARLARI */}
              {settingsTab === 'ai' && (
                <div style={{ maxWidth: 480 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: '#fff' }}>Judge AI Ayarları</h2>
                  <div style={{ padding: 20, borderRadius: 16, background: BG_CARD, border: `1px solid ${C_BORDER}`, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Varsayılan Analiz Modu</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { id: 'basic', label: 'Temel Analiz', desc: 'Hızlı ve özet değerlendirme', icon: Zap },
                        { id: 'deep',  label: 'Derin Analiz',  desc: 'Kapsamlı ve detaylı analiz', icon: Sparkles },
                      ].map(opt => (
                        <button key={opt.id}
                          onClick={() => { setDefaultMode(opt.id); localStorage.setItem('judge_default_mode', opt.id); }}
                          style={{ flex: 1, padding: 16, borderRadius: 12, border: `1px solid ${defaultMode === opt.id ? C : 'rgba(255,255,255,0.1)'}`, background: defaultMode === opt.id ? C_DIM : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                          <opt.icon size={18} style={{ color: defaultMode === opt.id ? C_LIGHT : 'rgba(255,255,255,0.4)', marginBottom: 8 }} />
                          <div style={{ fontWeight: 600, fontSize: 13, color: defaultMode === opt.id ? '#fff' : 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: 20, borderRadius: 16, background: BG_CARD, border: `1px solid ${C_BORDER}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>AI Modeli Hakkında</div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 10, background: BG_CARD2 }}>
                      <Brain size={18} style={{ color: '#4ca8ad', marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>ZET Judge AI</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                          İş planlarını, projeleri ve fikirleri analiz eden özel bir yapay zeka modeli. Risk skoru ve başarı potansiyelini hesaplar.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* KREDİ AL */}
              {settingsTab === 'credits' && (
                <div style={{ maxWidth: 480 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: '#fff' }}>Kredi Al</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {creditPackages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.35)' }}>
                        <Loader size={22} style={{ margin: '0 auto 10px', display: 'block', animation: 'spin 1s linear infinite' }} />
                        Yükleniyor...
                      </div>
                    ) : creditPackages.map(pkg => {
                      const hasDiscount = pkg.discounted_price !== pkg.price;
                      return (
                        <div key={pkg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 14, background: BG_CARD, border: `1px solid ${C_BORDER}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: pkg.credits >= 1000 ? 'rgba(251,191,36,0.15)' : pkg.credits >= 500 ? 'rgba(200,0,90,0.15)' : 'rgba(76,168,173,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Zap size={18} style={{ color: pkg.credits >= 1000 ? '#fbbf24' : pkg.credits >= 500 ? C_LIGHT : '#4ca8ad' }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{pkg.credits} Kredi</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{pkg.credits >= 1000 ? 'En Avantajlı' : pkg.credits >= 500 ? 'Popüler' : 'Başlangıç'}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ textAlign: 'right' }}>
                              {hasDiscount && <div style={{ fontSize: 11, textDecoration: 'line-through', color: 'rgba(255,255,255,0.35)' }}>${pkg.price}</div>}
                              <div style={{ fontWeight: 700, fontSize: 14, color: hasDiscount ? '#10b981' : '#fff' }}>${pkg.discounted_price}</div>
                            </div>
                            <button onClick={() => handleBuyCredits(pkg.id)} disabled={buyingCredits}
                              style={{ padding: '8px 16px', borderRadius: 9, background: C, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: buyingCredits ? 0.5 : 1 }}>
                              {buyingCredits ? '...' : 'Al'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PRIME DRIVE */}
              {settingsTab === 'primedrive' && (() => {
                const QUOTA_MAP = { free: 1, plus: 10, pro: 30, ultra: 1024 };
                const quotaGB = QUOTA_MAP[userSubscription] || 1;
                const usedBytes = primeDriveDocs.reduce((sum, d) => sum + (d.size || 0), 0);
                const usedGB = usedBytes / (1024 * 1024 * 1024);
                const usedPct = Math.min(100, (usedGB / quotaGB) * 100);
                const fmtSize = (bytes) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
                return (
                  <div style={{ maxWidth: 480 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                      <HardDrive size={22} style={{ color: '#6366f1' }} />
                      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Prime Drive</h2>
                    </div>
                    {/* Quota bar */}
                    <div style={{ padding: 20, borderRadius: 16, background: BG_CARD, border: `1px solid ${C_BORDER}`, marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Depolama Alanı</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                          {userSubscription === 'ultra' ? '1 TB — Creative Station' : userSubscription === 'pro' ? '30 GB — Pro' : userSubscription === 'plus' ? '10 GB — Plus' : '1 GB — Free'}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ height: '100%', borderRadius: 5, background: usedPct > 80 ? '#ef4444' : '#6366f1', width: `${usedPct}%`, transition: 'width 0.5s ease' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        <span>{usedGB < 0.001 ? '0 MB' : `${(usedGB * 1024).toFixed(1)} MB`} kullanıldı</span>
                        <span>{quotaGB < 1024 ? `${quotaGB} GB` : '1 TB'} toplam</span>
                      </div>
                    </div>
                    {userSubscription === 'ultra' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 16 }}>
                        <span style={{ color: '#f59e0b' }}>✦</span>
                        <span style={{ fontSize: 13, color: '#f59e0b' }}>ZET Mindshare ve ZET Judge için ortak 1 TB havuz</span>
                      </div>
                    )}
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      Dosyalar ({primeDriveDocs.length})
                    </div>
                    {primeDriveDocs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '48px 0', borderRadius: 16, background: BG_CARD, border: `1px solid ${C_BORDER}` }}>
                        <HardDrive size={36} style={{ color: '#6366f1', opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Henüz Prime Drive'a dosya eklenmedi.</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Analizlerin üç nokta menüsünden ekleyebilirsin.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {primeDriveDocs.map(item => (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: BG_CARD, border: `1px solid ${C_BORDER}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 9, background: item.type === 'session' ? C_DIM : 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.type === 'session' ? <Scale size={16} style={{ color: C_LIGHT }} /> : <FileText size={16} style={{ color: '#6366f1' }} />}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{fmtSize(item.size || 0)} · {new Date(item.addedAt).toLocaleDateString('tr-TR')}</div>
                              </div>
                            </div>
                            <button onClick={() => {
                              const updated = primeDriveDocs.filter(d => d.id !== item.id);
                              setPrimeDriveDocs(updated);
                              localStorage.setItem('prime_drive_docs', JSON.stringify(updated));
                            }} style={{ padding: 6, borderRadius: 7, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                              <X size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {userSubscription === 'free' && (
                      <p style={{ textAlign: 'center', fontSize: 11, marginTop: 16, color: 'rgba(255,255,255,0.3)' }}>
                        Plus ile 10 GB, Pro ile 30 GB, Creative Station ile 1 TB alana sahip olun.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* RANKLAR */}
              {settingsTab === 'ranks' && (
                <div style={{ maxWidth: 480 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: '#fff' }}>Ranklar</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {RANKS.map(r => {
                      const isCurrent = currentRank.name === r.name;
                      const userXP = user?.xp || 0;
                      const progress = r.xp === 0 ? 100 : Math.min(100, Math.round((userXP / r.xp) * 100));
                      return (
                        <div key={r.name} style={{ padding: '16px 18px', borderRadius: 14, background: BG_CARD, border: `1px solid ${isCurrent ? r.color + '60' : C_BORDER}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: r.xp > 0 ? 10 : 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Award size={20} style={{ color: r.color }} />
                              <span style={{ fontWeight: 600, fontSize: 14, color: r.color }}>{r.name}</span>
                              {isCurrent && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: `${r.color}25`, color: r.color, fontWeight: 600 }}>Mevcut</span>}
                            </div>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{r.xp.toLocaleString()} XP</span>
                          </div>
                          {r.xp > 0 && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{userXP.toLocaleString()} / {r.xp.toLocaleString()} XP</span>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{progress}%</span>
                              </div>
                              <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 3, background: userXP >= r.xp ? r.color : 'rgba(255,255,255,0.25)', width: `${progress}%`, transition: 'width 0.5s ease' }} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 300, padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500, background: toast.type === 'success' ? '#065a10' : toast.type === 'error' ? '#7f1d1d' : '#1e293b', color: '#fff', border: `1px solid ${toast.type === 'success' ? '#22c55e50' : toast.type === 'error' ? '#ef444450' : '#ffffff20'}`, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.6; } 40% { transform: translateY(-6px); opacity: 1; } }
        @media (min-width: 768px) {
          .md-settings-sidebar { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default JudgeDashboard;
