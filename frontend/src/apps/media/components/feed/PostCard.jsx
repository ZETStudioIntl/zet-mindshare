import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { VerificationBadge } from '../ui/VerificationBadge';
import { toggleLike, toggleSave, reportContent } from '../../lib/mediaApi';

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'şimdi';
  if (secs < 3600) return `${Math.floor(secs / 60)}d`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}s`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}g`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function HeartSVG({ filled }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#ef4444' : 'none'} stroke={filled ? '#ef4444' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function CommentSVG() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function ShareSVG() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function BookmarkSVG({ filled }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
}

function MoreSVG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
    </svg>
  );
}

export function PostCard({ post: initialPost, onComment, myUserId }) {
  const [post, setPost] = useState(initialPost);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const navigate = useNavigate();

  const handleLike = async () => {
    try {
      const res = await toggleLike(post.post_id);
      setPost(p => ({ ...p, liked_by_me: res.liked, like_count: res.like_count }));
    } catch {}
  };

  const handleSave = async () => {
    try {
      const res = await toggleSave(post.post_id);
      setPost(p => ({ ...p, saved_by_me: res.saved }));
    } catch {}
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300 && !post.liked_by_me) {
      handleLike();
    }
    setLastTap(now);
  };

  const handleReport = async () => {
    setShowMenu(false);
    try { await reportContent({ type: 'post', target_id: post.post_id, reason: 'Uygunsuz içerik' }); } catch {}
    alert('Rapor gönderildi.');
  };

  const media = post.media || [];
  const hasMedia = media.length > 0;

  return (
    <article style={{
      background: 'var(--media-surface, #1a1a1a)',
      borderBottom: '1px solid var(--media-border, #2a2a2a)',
      color: 'var(--media-text, #e5e5e5)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 10 }}>
        <button onClick={() => navigate(`/media/profile/${post.author_handle}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Avatar src={post.author_photo} displayName={post.author_display_name || post.author_handle} size={38} verification={post.author_verification} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            onClick={() => navigate(`/media/profile/${post.author_handle}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--media-text, #e5e5e5)' }}>{post.author_display_name || post.author_handle}</span>
            {post.author_verification && <VerificationBadge type={post.author_verification.type} size={13} />}
          </button>
          <div style={{ fontSize: 12, color: '#666' }}>@{post.author_handle} · {timeAgo(post.created_at)}</div>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 4 }}>
            <MoreSVG />
          </button>
          {showMenu && (
            <div style={{
              position: 'absolute', right: 0, top: 28, background: 'var(--media-surface2,#242424)',
              border: '1px solid var(--media-border,#2a2a2a)', borderRadius: 10, zIndex: 50,
              minWidth: 160, overflow: 'hidden',
            }}>
              {post.author_id === myUserId ? (
                <button onClick={() => { /* silme işlemi parent'a devredilmeli */ setShowMenu(false); }} style={menuBtnStyle}>
                  Gönderiyi Sil
                </button>
              ) : (
                <>
                  <button onClick={handleReport} style={menuBtnStyle}>Şikayet Et</button>
                  <button onClick={() => setShowMenu(false)} style={menuBtnStyle}>İlgilenmiyor</button>
                </>
              )}
              <button onClick={() => setShowMenu(false)} style={{ ...menuBtnStyle, color: '#666' }}>Kapat</button>
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      {hasMedia && (
        <div style={{ position: 'relative', background: '#000' }} onClick={handleDoubleTap}>
          {post.type === 'video' || post.type === 'reel' ? (
            <video
              src={media[0]?.url}
              controls
              playsInline
              muted
              loop={post.type === 'reel'}
              style={{ width: '100%', maxHeight: post.type === 'reel' ? '80vh' : 400, objectFit: 'contain', display: 'block' }}
              poster={media[0]?.thumbnail}
            />
          ) : (
            <div style={{ position: 'relative' }}>
              <img
                src={media[carouselIdx]?.url}
                alt={`Medya ${carouselIdx + 1}`}
                style={{ width: '100%', maxHeight: 500, objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              {media.length > 1 && (
                <>
                  {carouselIdx > 0 && (
                    <button onClick={() => setCarouselIdx(i => i - 1)} style={{ ...carouselBtnStyle, left: 8 }}>‹</button>
                  )}
                  {carouselIdx < media.length - 1 && (
                    <button onClick={() => setCarouselIdx(i => i + 1)} style={{ ...carouselBtnStyle, right: 8 }}>›</button>
                  )}
                  <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
                    {media.map((_, i) => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === carouselIdx ? '#fff' : 'rgba(255,255,255,0.4)' }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {post.watermark && (
            <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 11, color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4 }}>
              {post.watermark}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', gap: 16 }}>
        <button onClick={handleLike} style={actionBtnStyle(post.liked_by_me ? '#ef4444' : undefined)}>
          <HeartSVG filled={post.liked_by_me} />
          {post.like_count > 0 && <span style={{ fontSize: 13 }}>{post.like_count}</span>}
        </button>
        <button onClick={() => onComment && onComment(post)} style={actionBtnStyle()}>
          <CommentSVG />
          {post.comment_count > 0 && <span style={{ fontSize: 13 }}>{post.comment_count}</span>}
        </button>
        <button onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/media/post/${post.post_id}`)} style={actionBtnStyle()}>
          <ShareSVG />
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={handleSave} style={actionBtnStyle(post.saved_by_me ? '#fff' : undefined)}>
          <BookmarkSVG filled={post.saved_by_me} />
        </button>
      </div>

      {/* Caption */}
      {post.content && (
        <div style={{ padding: '0 14px 12px', fontSize: 14, lineHeight: 1.5, color: 'var(--media-text,#e5e5e5)' }}>
          <span style={{ fontWeight: 600 }}>{post.author_handle}</span>{' '}
          <PostCaption text={post.content} />
        </div>
      )}
    </article>
  );
}

function PostCaption({ text }) {
  const navigate = useNavigate();
  const parts = text.split(/(#\w+|@\w+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          return <button key={i} onClick={() => navigate(`/media/hashtag/${part.slice(1)}`)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>{part}</button>;
        }
        if (part.startsWith('@')) {
          return <button key={i} onClick={() => navigate(`/media/profile/${part.slice(1)}`)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>{part}</button>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

const actionBtnStyle = (color) => ({
  background: 'none', border: 'none', cursor: 'pointer',
  color: color || 'var(--media-text-muted, #888)',
  display: 'flex', alignItems: 'center', gap: 4, padding: 4,
});

const menuBtnStyle = {
  display: 'block', width: '100%', padding: '10px 16px',
  background: 'none', border: 'none', cursor: 'pointer',
  textAlign: 'left', color: 'var(--media-text,#e5e5e5)', fontSize: 14,
};

const carouselBtnStyle = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
  borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
  fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
};
