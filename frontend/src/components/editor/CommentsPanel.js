import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, CheckCircle2, Trash2, Reply } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function CommentsPanel({ docId, onClose, selectedElement, currentPage }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    loadComments();
  }, [docId]);

  const loadComments = async () => {
    try {
      const res = await axios.get(`${API}/api/documents/${docId}/comments`, { withCredentials: true });
      setComments(res.data);
    } catch {}
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(`${API}/api/documents/${docId}/comments`, {
        content: newComment, element_id: selectedElement || null,
        page_index: currentPage || 0
      }, { withCredentials: true });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {}
  };

  const addReply = async (commentId) => {
    if (!replyText.trim()) return;
    try {
      const res = await axios.post(`${API}/api/comments/${commentId}/reply`, {
        content: replyText
      }, { withCredentials: true });
      setComments(prev => prev.map(c => c.comment_id === commentId ? { ...c, replies: [...(c.replies || []), res.data] } : c));
      setReplyText('');
      setReplyingTo(null);
    } catch {}
  };

  const resolveComment = async (commentId) => {
    try {
      await axios.put(`${API}/api/comments/${commentId}/resolve`, {}, { withCredentials: true });
      setComments(prev => prev.map(c => c.comment_id === commentId ? { ...c, resolved: true } : c));
    } catch {}
  };

  const deleteComment = async (commentId) => {
    try {
      await axios.delete(`${API}/api/comments/${commentId}`, { withCredentials: true });
      setComments(prev => prev.filter(c => c.comment_id !== commentId));
    } catch {}
  };

  const activeComments = comments.filter(c => !c.resolved);
  const resolvedComments = comments.filter(c => c.resolved);

  return (
    <div data-testid="comments-panel" className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--zet-border)' }}>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" style={{ color: 'var(--zet-primary)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--zet-text)' }}>Yorumlar ({activeComments.length})</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeComments.length === 0 && (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--zet-text-muted)' }}>Henuz yorum yok. Belge uzerine yorum ekleyin.</div>
        )}
        {activeComments.map(c => (
          <div key={c.comment_id} data-testid={`comment-${c.comment_id}`} className="p-3 rounded-lg" style={{ background: 'var(--zet-bg)' }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: `hsl(${(c.user_name || '').charCodeAt(0) * 37 % 360}, 60%, 50%)`, color: '#fff' }}>
                  {(c.user_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-xs font-medium" style={{ color: 'var(--zet-text)' }}>{c.user_name}</span>
                  <span className="text-[10px] ml-2" style={{ color: 'var(--zet-text-muted)' }}>
                    {new Date(c.created_at).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => resolveComment(c.comment_id)} className="p-1 rounded hover:bg-white/10" title="Cozuldu"><CheckCircle2 className="h-3 w-3" style={{ color: '#22c55e' }} /></button>
                <button onClick={() => deleteComment(c.comment_id)} className="p-1 rounded hover:bg-red-500/20" title="Sil"><Trash2 className="h-3 w-3" style={{ color: '#f87171' }} /></button>
              </div>
            </div>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--zet-text)' }}>{c.content}</p>
            {c.element_id && <div className="text-[10px] mt-1" style={{ color: 'var(--zet-text-muted)' }}>Sayfa {(c.page_index || 0) + 1}</div>}
            
            {/* Replies */}
            {(c.replies || []).length > 0 && (
              <div className="mt-2 ml-4 space-y-2 border-l-2 pl-2" style={{ borderColor: 'var(--zet-border)' }}>
                {c.replies.map(r => (
                  <div key={r.reply_id} className="text-xs">
                    <span className="font-medium" style={{ color: 'var(--zet-primary)' }}>{r.user_name}</span>
                    <span className="ml-1" style={{ color: 'var(--zet-text)' }}>{r.content}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Reply input */}
            {replyingTo === c.comment_id ? (
              <div className="flex gap-1 mt-2">
                <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addReply(c.comment_id)} placeholder="Yanit yaz..." className="zet-input text-[10px] flex-1 py-1" />
                <button onClick={() => addReply(c.comment_id)} className="p-1 rounded" style={{ color: 'var(--zet-primary)' }}><Send className="h-3 w-3" /></button>
              </div>
            ) : (
              <button onClick={() => setReplyingTo(c.comment_id)} className="text-[10px] mt-1 flex items-center gap-1 hover:underline" style={{ color: 'var(--zet-text-muted)' }}>
                <Reply className="h-2.5 w-2.5" /> Yanitla
              </button>
            )}
          </div>
        ))}

        {resolvedComments.length > 0 && (
          <details className="mt-2">
            <summary className="text-[10px] cursor-pointer" style={{ color: 'var(--zet-text-muted)' }}>Cozulen Yorumlar ({resolvedComments.length})</summary>
            <div className="mt-2 space-y-2">
              {resolvedComments.map(c => (
                <div key={c.comment_id} className="p-2 rounded-lg opacity-50" style={{ background: 'var(--zet-bg)' }}>
                  <div className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>
                    <span className="font-medium">{c.user_name}</span>: {c.content}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
        <div ref={bottomRef} />
      </div>

      {/* New comment input */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--zet-border)' }}>
        <div className="flex gap-2">
          <input data-testid="comment-input" value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} placeholder="Yorum ekle..." className="zet-input text-xs flex-1" />
          <button data-testid="add-comment-btn" onClick={addComment} disabled={!newComment.trim()} className="zet-btn px-2">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
