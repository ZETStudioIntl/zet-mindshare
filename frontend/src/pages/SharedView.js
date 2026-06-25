import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Eye, Edit3, MessageSquare, X } from 'lucide-react';
import { A4LoadingScreen } from '../components/LoadingScreens';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function SharedView() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    loadSharedDocument();
  }, [shareId]);

  const loadSharedDocument = async () => {
    try {
      const res = await axios.get(`${API}/api/shared/${shareId}`);
      setData(res.data);
      if (res.data.permission === 'edit' && res.data.viewer?.user_id && !res.data.viewer.user_id.startsWith('guest_')) {
        navigate(`/editor/${res.data.document.doc_id}?collab=true`);
        return;
      }
    } catch (err) {
      setError(err.response?.status === 404 ? 'Paylasim linki bulunamadi' : err.response?.status === 410 ? 'Paylasim linkinin suresi dolmus' : 'Bir hata olustu');
    }
    setLoading(false);
  };

  const loadComments = async () => {
    if (commentsLoading) return;
    setCommentsLoading(true);
    try {
      const res = await axios.get(`${API}/api/shared/${shareId}/comments`);
      setComments(res.data || []);
    } catch {}
    setCommentsLoading(false);
  };

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments(v => !v);
  };

  if (loading) return <A4LoadingScreen playSound={false} />;

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}>
      <div className="text-center p-8 rounded-xl" style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)' }}>
        <div className="text-4xl mb-4">:(</div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--zet-text)' }}>{error}</h2>
        <button onClick={() => navigate('/')} className="zet-btn mt-4 px-4 py-2">Ana Sayfaya Don</button>
      </div>
    </div>
  );

  if (!data) return null;

  const { document: doc, permission, viewer } = data;
  const pages = doc.pages || [];

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--zet-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ background: 'var(--zet-bg-card)', borderColor: 'var(--zet-border)' }}>
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5" style={{ color: 'var(--zet-primary)' }} />
          <h1 className="text-sm font-semibold" style={{ color: 'var(--zet-text)' }}>{doc.title || 'Untitled'}</h1>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ background: permission === 'edit' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: permission === 'edit' ? '#22c55e' : '#f59e0b' }}>
            {permission === 'edit' ? <Edit3 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {permission === 'edit' ? 'Duzenleme' : 'Goruntuleme'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleComments}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${showComments ? 'ring-1 ring-blue-500' : ''}`}
            style={{ background: showComments ? 'rgba(59,130,246,0.15)' : 'var(--zet-bg)', color: showComments ? '#60a5fa' : 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Yorumlar
          </button>
          <div className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{viewer.name} olarak goruntuleniyor</div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document view */}
        <div className="flex-1 flex flex-col items-center py-6 gap-4 overflow-auto">
          {pages.map((page, idx) => (
            <div key={page.page_id || idx} className="shadow-xl relative" style={{ width: 794, minHeight: 1123, background: '#fff', padding: 40 }}>
              <div className="text-[10px] absolute -top-5 left-0" style={{ color: 'var(--zet-text-muted)' }}>Sayfa {idx + 1}</div>
              {(page.elements || []).map(el => (
                <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.width || 'auto' }}>
                  {el.type === 'text' && (
                    <div style={{ fontSize: el.fontSize || 12, fontFamily: el.fontFamily || el.font || 'Georgia', color: el.color || '#000', fontWeight: el.bold ? 'bold' : 'normal', fontStyle: el.italic ? 'italic' : 'normal', textDecoration: el.underline ? 'underline' : 'none', textAlign: el.textAlign || 'left', lineHeight: el.lineHeight || 1.5 }}
                      dangerouslySetInnerHTML={{ __html: el.htmlContent || el.content || '' }} />
                  )}
                  {el.type === 'image' && el.src && <img src={el.src} alt="" style={{ width: el.width || 200, height: el.height || 200, objectFit: 'contain' }} />}
                  {el.type === 'table' && el.tableData && (
                    <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
                      <tbody>
                        {el.tableData.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci} style={{ border: '1px solid #333', padding: '2px 4px', minWidth: 60 }}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Comments sidebar */}
        {showComments && (
          <div className="flex-shrink-0 border-l flex flex-col" style={{ width: 300, background: 'var(--zet-bg-card)', borderColor: 'var(--zet-border)' }}>
            <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--zet-border)' }}>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" style={{ color: 'var(--zet-primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--zet-text)' }}>
                  Yorumlar {comments.length > 0 ? `(${comments.length})` : ''}
                </span>
              </div>
              <button onClick={() => setShowComments(false)} className="p-1 rounded hover:bg-white/10">
                <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {commentsLoading && (
                <p className="text-xs text-center py-4" style={{ color: 'var(--zet-text-muted)' }}>Yükleniyor...</p>
              )}
              {!commentsLoading && comments.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8">
                  <MessageSquare className="h-6 w-6" style={{ color: 'var(--zet-text-muted)' }} />
                  <p className="text-xs text-center" style={{ color: 'var(--zet-text-muted)' }}>Henüz yorum yok</p>
                </div>
              )}
              {comments.map(c => (
                <div key={c.comment_id} className="rounded-lg p-3" style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium" style={{ color: 'var(--zet-text)' }}>{c.user_name || 'Kullanıcı'}</span>
                    <span className="text-[10px]" style={{ color: 'var(--zet-text-muted)' }}>{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--zet-text)' }}>{c.content}</p>
                  {(c.replies || []).length > 0 && (
                    <div className="mt-2 pl-2 border-l space-y-1.5" style={{ borderColor: 'var(--zet-border)' }}>
                      {c.replies.map((r, ri) => (
                        <div key={ri}>
                          <span className="text-[10px] font-medium" style={{ color: 'var(--zet-primary)' }}>{r.user_name || 'Kullanıcı'}</span>
                          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--zet-text)' }}>{r.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
