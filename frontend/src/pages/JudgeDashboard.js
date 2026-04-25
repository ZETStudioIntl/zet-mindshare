import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../contexts/AppThemeContext';
import axios from 'axios';
import {
  Search, Plus, Settings, LogOut, ArrowLeft, Send, X, Loader,
  FileText, Globe, ChevronRight, Heart, MessageCircle,
  User, Scale
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const C = '#c8005a';
const C_LIGHT = '#e8337a';
const C_DIM = 'rgba(200,0,90,0.12)';
const C_BORDER = 'rgba(200,0,90,0.18)';
const BG = '#0a020a';
const BG_CARD = '#120510';
const BG_CARD2 = 'rgba(255,255,255,0.04)';

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

  // New analysis chat
  const [showChat, setShowChat] = useState(false);
  const [activeSession, setActiveSession] = useState(null); // null = new, else session object
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [judgeScores, setJudgeScores] = useState(null);
  const [mode, setMode] = useState('basic');
  const chatEndRef = useRef(null);

  // Settings
  const [showSettings, setShowSettings] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'info') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => { fetchSessions(); }, []);
  useEffect(() => {
    if (activeTab === 'media') loadPosts(true, mediaFeedTab);
  }, [activeTab, mediaFeedTab]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, chatLoading]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API}/judge/sessions`, { withCredentials: true });
      setSessions(res.data.sessions || []);
    } catch { setSessions([]); }
    finally { setSessionsLoading(false); }
  };

  const loadPosts = useCallback(async (reset = false, tab = mediaFeedTab) => {
    if (mediaLoading) return;
    setMediaLoading(true);
    try {
      const cursor = reset ? null : (mediaPosts[mediaPosts.length - 1]?.post_id);
      const endpoint = tab === 'explore' ? `${API}/media/explore` : `${API}/media/feed`;
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
    setShowChat(true);
  };

  const openSession = async (session) => {
    setActiveSession(session);
    setSessionId(session.session_id);
    setJudgeScores(session.risk_score != null ? { risk: session.risk_score, success: session.success_score } : null);
    // Load history
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

  const submitPost = async () => {
    if (!postContent.trim() || postSubmitting) return;
    setPostSubmitting(true);
    try {
      await axios.post(`${API}/media/posts`, { content: postContent, post_type: 'text' }, { withCredentials: true });
      setPostContent('');
      setShowCreatePost(false);
      loadPosts(true);
      showToast('Gönderi paylaşıldı', 'success');
    } catch (err) { showToast(err.response?.data?.detail || 'Hata oluştu', 'error'); }
    finally { setPostSubmitting(false); }
  };

  const likePost = async (postId) => {
    try {
      await axios.post(`${API}/media/posts/${postId}/like`, {}, { withCredentials: true });
      setMediaPosts(prev => prev.map(p => p.post_id === postId ? { ...p, liked: !p.liked, likes_count: p.liked ? p.likes_count - 1 : p.likes_count + 1 } : p));
    } catch { showToast('Beğeni gönderilemedi', 'error'); }
  };

  const goToMindshare = () => { switchApp('mindshare'); navigate('/dashboard'); };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const filteredSessions = sessions.filter(s =>
    !searchQuery || (s.first_message || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const groupedSessions = groupSessionsByMonth(filteredSessions);

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: "'DM Sans', -apple-system, sans-serif", display: 'flex' }}>

      {/* Sidebar */}
      <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 220, background: BG_CARD, borderRight: `1px solid ${C_BORDER}`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px', borderBottom: `1px solid ${C_BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo-judge.svg" alt="ZET Judge" style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1 }}>ZET Judge</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Analiz Platformu</div>
            </div>
          </div>
        </div>

        {/* New analysis button */}
        <div style={{ padding: '12px 12px 8px' }}>
          <button onClick={openNewAnalysis}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: C, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <Plus size={15} />
            Yeni Analiz
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { id: 'projects', label: 'Projeler', icon: FileText },
            { id: 'media', label: 'Media', icon: Globe },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: activeTab === id ? C_DIM : 'transparent', border: `1px solid ${activeTab === id ? C_BORDER : 'transparent'}`, color: activeTab === id ? C_LIGHT : 'rgba(255,255,255,0.5)', cursor: 'pointer', width: '100%', fontSize: 13, fontWeight: activeTab === id ? 600 : 400, transition: 'all 0.2s' }}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '8px 8px 16px', borderTop: `1px solid ${C_BORDER}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button onClick={() => setShowSettings(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', width: '100%', fontSize: 12 }}>
            <Settings size={14} /> Ayarlar
          </button>
          <button onClick={goToMindshare}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', width: '100%', fontSize: 12 }}>
            <ArrowLeft size={14} /> ZET Mindshare
          </button>
          <button onClick={() => navigate('/app-select')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', width: '100%', fontSize: 12 }}>
            <Settings size={14} /> Uygulama Seç
          </button>
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', width: '100%', fontSize: 12 }}>
            <LogOut size={14} /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Search bar */}
        <div style={{ padding: '20px 28px 0', maxWidth: 860, width: '100%', margin: '0 auto' }}>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder={activeTab === 'projects' ? 'Analizlerde ara...' : 'Gönderilerde ara...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: BG_CARD2, border: `1px solid ${C_BORDER}`, borderRadius: 12, padding: '10px 16px 10px 40px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '0 28px 100px', maxWidth: 860, width: '100%', margin: '0 auto' }}>

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
                        {group.items.map(s => (
                          <div key={s.session_id}
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
                              </div>
                            </div>
                            {s.risk_score != null ? (
                              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                                <CircleScore label="Risk" value={s.risk_score} color="#ef4444" />
                                <CircleScore label="Potansiyel" value={s.success_score} color="#22c55e" />
                              </div>
                            ) : (
                              <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
                            )}
                          </div>
                        ))}
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
              {/* Feed / Explore tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: BG_CARD2, borderRadius: 10, padding: 4, border: `1px solid ${C_BORDER}` }}>
                {['feed', 'explore'].map(t => (
                  <button key={t} onClick={() => setMediaFeedTab(t)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: mediaFeedTab === t ? 600 : 400, background: mediaFeedTab === t ? C : 'transparent', color: mediaFeedTab === t ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
                    {t === 'feed' ? 'Takip Edilenler' : 'Keşfet'}
                  </button>
                ))}
              </div>

              {/* Create post */}
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
                      style={{ padding: '8px 16px', borderRadius: 9, background: 'transparent', border: `1px solid rgba(255,255,255,0.15)`, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13 }}>
                      Vazgeç
                    </button>
                    <button onClick={submitPost} disabled={!postContent.trim() || postSubmitting}
                      style={{ padding: '8px 18px', borderRadius: 9, background: postContent.trim() ? C : 'rgba(200,0,90,0.3)', border: 'none', color: '#fff', cursor: postContent.trim() ? 'pointer' : 'default', fontSize: 13, fontWeight: 600, transition: 'background 0.2s' }}>
                      {postSubmitting ? 'Paylaşılıyor...' : 'Paylaş'}
                    </button>
                  </div>
                </div>
              )}

              {/* Posts */}
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
                    <div key={post.post_id}
                      style={{ background: BG_CARD2, border: `1px solid ${C_BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
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
        </div>

        {/* Bottom Tab Bar */}
        <div style={{ position: 'fixed', bottom: 0, left: 220, right: 0, padding: '12px 20px', background: BG, borderTop: `1px solid ${C_BORDER}`, zIndex: 40 }}>
          <div style={{ maxWidth: 400, margin: '0 auto', display: 'flex', background: BG_CARD2, borderRadius: 12, padding: 4, border: `1px solid ${C_BORDER}` }}>
            {[
              { id: 'projects', label: 'Projeler', icon: FileText },
              { id: 'media', label: 'Media', icon: Globe },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === id ? 600 : 400, background: activeTab === id ? `linear-gradient(135deg, #4b0c37, ${C})` : 'transparent', color: activeTab === id ? '#fff' : 'rgba(255,255,255,0.45)', transition: 'all 0.2s' }}>
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Floating New Analysis Button (only on projects tab) */}
        {activeTab === 'projects' && !showChat && (
          <button onClick={openNewAnalysis}
            style={{ position: 'fixed', bottom: 80, right: 32, width: 52, height: 52, borderRadius: '50%', background: C, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 45, boxShadow: `0 4px 20px rgba(200,0,90,0.5)`, transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = `0 6px 28px rgba(200,0,90,0.7)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 20px rgba(200,0,90,0.5)`; }}>
            <Plus size={22} />
          </button>
        )}
      </main>

      {/* Chat Panel (right slide-in) */}
      {showChat && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
          {/* Backdrop */}
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowChat(false)} />
          {/* Panel */}
          <div style={{ width: 480, background: BG_CARD, borderLeft: `1px solid ${C_BORDER}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Scale size={18} color={C} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  {activeSession ? (activeSession.first_message?.slice(0, 30) + '...') : 'Yeni Analiz'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 3, gap: 2 }}>
                  {['basic', 'deep'].map(m => (
                    <button key={m} onClick={() => setMode(m)}
                      style={{ padding: '4px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: mode === m ? C : 'transparent', color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>
                      {m === 'basic' ? 'Temel' : 'Derin'}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowChat(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4, display: 'flex' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scores */}
            {judgeScores && (
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', padding: '12px 20px', borderBottom: `1px solid rgba(200,0,90,0.1)`, background: 'rgba(200,0,90,0.05)', flexShrink: 0 }}>
                <CircleScore label="Risk Skoru" value={judgeScores.risk} color="#ef4444" />
                <CircleScore label="Başarı Potansiyeli" value={judgeScores.success} color="#22c55e" />
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0, alignSelf: 'flex-end' }}>
                      <Scale size={13} color={C_LIGHT} />
                    </div>
                  )}
                  <div style={{ maxWidth: '78%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? C : 'rgba(255,255,255,0.07)', fontSize: 13, lineHeight: 1.6, color: '#fff', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Scale size={13} color={C_LIGHT} />
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.07)', display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: C_LIGHT, display: 'inline-block', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${C_BORDER}`, display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="İş planınızı veya sorunuzu yazın..."
                rows={2}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C_BORDER}`, borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
              />
              <button onClick={sendMessage} disabled={!chatInput.trim() || chatLoading}
                style={{ padding: '10px 14px', borderRadius: 10, background: chatInput.trim() && !chatLoading ? C : 'rgba(200,0,90,0.25)', border: 'none', color: '#fff', cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'default', flexShrink: 0, transition: 'background 0.2s', display: 'flex', alignItems: 'center' }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }} onClick={() => setShowSettings(false)}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 340, background: BG_CARD, borderLeft: `1px solid ${C_BORDER}`, overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${C_BORDER}` }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Ayarlar</span>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Hesap</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: BG_CARD2, border: `1px solid ${C_BORDER}` }}>
                  {user?.picture ? <img src={user.picture} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} /> : <div style={{ width: 40, height: 40, borderRadius: '50%', background: C_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={18} color={C_LIGHT} /></div>}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name || 'Kullanıcı'}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{user?.email}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Uygulama</h3>
                <button onClick={() => { goToMindshare(); setShowSettings(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: BG_CARD2, border: `1px solid ${C_BORDER}`, color: '#fff', cursor: 'pointer', fontSize: 13, marginBottom: 8 }}>
                  <ArrowLeft size={15} /> ZET Mindshare'e Geç
                </button>
                <button onClick={() => { navigate('/app-select'); setShowSettings(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: BG_CARD2, border: `1px solid ${C_BORDER}`, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                  <Settings size={15} /> Uygulama Seçici
                </button>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <LogOut size={15} /> Çıkış Yap
              </button>
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
      `}</style>
    </div>
  );
};

export default JudgeDashboard;
