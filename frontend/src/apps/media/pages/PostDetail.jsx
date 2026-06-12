import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost, getComments, addComment } from '../lib/mediaApi';
import { PostCard } from '../components/feed/PostCard';
import { Avatar } from '../components/ui/Avatar';
import { VerificationBadge } from '../components/ui/VerificationBadge';
import { useMedia } from '../contexts/MediaContext';
import { useAuth } from '../../../contexts/AuthContext';

function BackSVG() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
}

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'şimdi';
  if (secs < 3600) return `${Math.floor(secs / 60)}d`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}s`;
  return `${Math.floor(secs / 86400)}g`;
}

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mediaProfile } = useMedia();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    Promise.all([getPost(postId), getComments(postId, 1)]).then(([p, c]) => {
      setPost(p);
      setComments(c.comments || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [postId]);

  const handleComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    try {
      const c = await addComment(postId, { content: text, parent_comment_id: replyTo?.comment_id || null });
      setComments(prev => [...prev, c]);
      setPost(p => p ? { ...p, comment_count: p.comment_count + 1 } : p);
      setCommentText('');
      setReplyTo(null);
    } catch {}
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--media-bg,#0f0f0f)' }}>
      <div style={{ color: '#555' }}>Yükleniyor…</div>
    </div>
  );

  return (
    <div style={{ background: 'var(--media-bg,#0f0f0f)', minHeight: '100vh', paddingBottom: 80 }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        background: 'var(--media-surface,#1a1a1a)',
        borderBottom: '1px solid var(--media-border,#2a2a2a)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
          <BackSVG />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Gönderi</span>
      </header>

      {post && <PostCard post={post} myUserId={user?.user_id} onComment={() => inputRef.current?.focus()} />}

      {/* Comments */}
      <div style={{ padding: '14px 16px 8px', color: '#888', fontSize: 13, fontWeight: 600 }}>
        Yorumlar {comments.length > 0 && `(${comments.length})`}
      </div>

      {comments.map(c => (
        <div key={c.comment_id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--media-border,#1a1a1a)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Avatar src={c.author_photo} displayName={c.author_display_name || c.author_handle} size={32} verification={c.author_verification} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <button onClick={() => navigate(`/media/profile/${c.author_handle}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600, fontSize: 13, color: '#fff' }}>{c.author_handle}</button>
                {c.author_verification && <VerificationBadge type={c.author_verification.type} size={12} />}
                <span style={{ fontSize: 11, color: '#555' }}>{timeAgo(c.created_at)}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--media-text,#ccc)', margin: 0, lineHeight: 1.5 }}>{c.content}</p>
              <button onClick={() => { setReplyTo(c); inputRef.current?.focus(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 12, marginTop: 4, padding: 0 }}>Yanıtla</button>
            </div>
          </div>
        </div>
      ))}

      {comments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555', fontSize: 14 }}>Henüz yorum yok</div>
      )}

      {/* Comment input */}
      <div style={{
        position: 'fixed', bottom: 60, left: 0, right: 0,
        background: 'var(--media-surface,#1a1a1a)',
        borderTop: '1px solid var(--media-border,#2a2a2a)',
        padding: '8px 14px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
      }}>
        {replyTo && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 6 }}>
            <span style={{ fontSize: 12, color: '#666' }}>Yanıtlıyor: @{replyTo.author_handle}</span>
            <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 14 }}>×</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar src={mediaProfile?.profile_photo} displayName={mediaProfile?.display_name} size={32} />
          <input
            ref={inputRef}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
            placeholder="Yorum yaz…"
            style={{
              flex: 1, background: 'var(--media-surface2,#242424)',
              border: '1px solid #333', borderRadius: 20, padding: '8px 14px',
              color: '#fff', fontSize: 14, outline: 'none',
            }}
          />
          <button onClick={handleComment} disabled={!commentText.trim()} style={{
            background: commentText.trim() ? '#3a0ca3' : '#2a2a2a',
            color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: commentText.trim() ? 'pointer' : 'default',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
