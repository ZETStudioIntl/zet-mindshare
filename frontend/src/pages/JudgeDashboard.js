import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../contexts/AppThemeContext';
import axios from 'axios';
import { BarChart2, Plus, ChevronRight, LogOut, Settings, ArrowLeft, Send, X, Loader } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CircleScore = ({ label, value, color }) => {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
        <circle
          cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round" transform="rotate(-90 30 30)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x="30" y="35" textAnchor="middle" fontSize="13" fill="#fff" fontWeight="700">{pct}</text>
      </svg>
      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{label}</span>
    </div>
  );
};

const JudgeDashboard = () => {
  const { user, logout } = useAuth();
  const { switchApp } = useAppTheme();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // New analysis modal
  const [showModal, setShowModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [judgeScores, setJudgeScores] = useState(null);
  const [mode, setMode] = useState('basic');
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API}/judge/sessions`, { withCredentials: true });
      setSessions(res.data.sessions || []);
      setStats(res.data.stats || null);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const openNewAnalysis = () => {
    setChatMessages([{
      role: 'assistant',
      content: 'Merhaba! Ben ZET Judge. İş planınızı, projenizi veya fikrinizi analiz etmek için hazırım. Ne üzerine çalışıyorsunuz?',
    }]);
    setChatInput('');
    setSessionId(null);
    setJudgeScores(null);
    setShowModal(true);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const res = await axios.post(`${API}/judge/chat`, {
        message: msg,
        session_id: sessionId,
        mode,
      }, { withCredentials: true });
      const newSid = res.data.session_id || sessionId;
      setSessionId(newSid);
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
      if (res.data.risk_score != null && res.data.success_score != null) {
        setJudgeScores({ risk: res.data.risk_score, success: res.data.success_score });
      }
      fetchSessions();
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: err.response?.data?.detail || 'Bir hata oluştu. Lütfen tekrar deneyin.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goToMindshare = () => {
    switchApp('mindshare');
    navigate('/dashboard');
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const crimson = '#c8005a';
  const crimsonLight = '#e8337a';

  return (
    <div style={{ minHeight: '100vh', background: '#0a020a', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 220, background: '#120510', borderRight: '1px solid rgba(200,0,90,0.12)', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(200,0,90,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #4b0c37, #c8005a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>ZET Judge</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={openNewAnalysis}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: crimson, border: 'none', color: '#fff', cursor: 'pointer', width: '100%', fontSize: 13, fontWeight: 600 }}
          >
            <Plus size={15} />
            Yeni Analiz
          </button>
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(200,0,90,0.12)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            onClick={goToMindshare}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', width: '100%', fontSize: 12 }}
          >
            <ArrowLeft size={14} />
            ZET Mindshare'e Dön
          </button>
          <button
            onClick={() => navigate('/app-select')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', width: '100%', fontSize: 12 }}
          >
            <Settings size={14} />
            Uygulama Seç
          </button>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', width: '100%', fontSize: 12 }}
          >
            <LogOut size={14} />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, padding: '32px 28px', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Analizlerim</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>İş planı ve fikir analizlerinizi buradan yönetebilirsiniz</p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'Toplam Analiz', value: stats.total_sessions },
              { label: 'Ortalama Risk', value: stats.avg_risk != null ? `${Math.round(stats.avg_risk)}/100` : '—' },
              { label: 'Ortalama Potansiyel', value: stats.avg_success != null ? `${Math.round(stats.avg_success)}/100` : '—' },
            ].map(s => (
              <div key={s.label} style={{ flex: '1 1 160px', background: 'rgba(200,0,90,0.08)', border: '1px solid rgba(200,0,90,0.15)', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sessions list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
            <Loader size={24} style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite' }} />
            Analizler yükleniyor...
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <BarChart2 size={48} style={{ margin: '0 auto 16px', color: 'rgba(200,0,90,0.3)' }} />
            <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 8 }}>Henüz analiz yok</h3>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 24 }}>
              İş planınızı veya fikrinizi analiz ettirmek için başlayın
            </p>
            <button
              onClick={openNewAnalysis}
              style={{ padding: '12px 28px', borderRadius: 12, background: crimson, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              İlk Analizi Başlat
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.map((s) => (
              <div
                key={s.session_id}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,0,90,0.1)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'default', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,0,90,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(200,0,90,0.1)'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.first_message || 'Analiz'}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>{formatDate(s.created_at)}</span>
                    <span>·</span>
                    <span>{s.message_count} mesaj</span>
                  </div>
                </div>
                {s.risk_score != null && (
                  <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                    <CircleScore label="Risk" value={s.risk_score} color="#ef4444" />
                    <CircleScore label="Potansiyel" value={s.success_score} color="#22c55e" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Analysis Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#120510', borderRadius: 20, border: '1px solid rgba(200,0,90,0.2)', width: '100%', maxWidth: 640, height: 580, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(200,0,90,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BarChart2 size={18} color={crimson} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>ZET Judge Analizi</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Mode toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 2, gap: 2 }}>
                  {['basic', 'deep'].map(m => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: mode === m ? crimson : 'transparent', color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}
                    >
                      {m === 'basic' ? 'Temel' : 'Derin'}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Score display */}
            {judgeScores && (
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', padding: '12px 20px', borderBottom: '1px solid rgba(200,0,90,0.1)', background: 'rgba(200,0,90,0.05)' }}>
                <CircleScore label="Risk Skoru" value={judgeScores.risk} color="#ef4444" />
                <CircleScore label="Başarı Potansiyeli" value={judgeScores.success} color="#22c55e" />
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? crimson : 'rgba(255,255,255,0.07)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: '#fff',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.07)', display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: crimsonLight, display: 'inline-block', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(200,0,90,0.15)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="İş planınızı veya sorunuzu yazın..."
                rows={2}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(200,0,90,0.2)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim() || chatLoading}
                style={{ padding: '10px 16px', borderRadius: 10, background: chatInput.trim() && !chatLoading ? crimson : 'rgba(200,0,90,0.25)', border: 'none', color: '#fff', cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'default', flexShrink: 0, transition: 'background 0.2s' }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default JudgeDashboard;
