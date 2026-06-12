import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeed } from '../lib/mediaApi';
import { PostCard } from '../components/feed/PostCard';
import { StoryBar } from '../components/feed/StoryBar';
import { useMedia } from '../contexts/MediaContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loaderRef = useRef(null);
  const { mediaProfile } = useMedia();
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadPage = useCallback(async (p, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await getFeed(p);
      if (reset) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      setHasMore(data.has_more);
      setPage(p + 1);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [loading]);

  useEffect(() => { loadPage(1, true); }, []);

  // Infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadPage(page);
      }
    }, { rootMargin: '200px' });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [page, hasMore, loading, loadPage]);

  // Pull to refresh (touch)
  const touchStartY = useRef(0);
  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    if (diff > 80 && window.scrollY === 0 && !refreshing) {
      setRefreshing(true);
      setPosts([]);
      setPage(1);
      loadPage(1, true);
    }
  };

  return (
    <div
      style={{ paddingBottom: 80, minHeight: '100vh', background: 'var(--media-bg,#0f0f0f)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--media-bg,#0f0f0f)',
        borderBottom: '1px solid var(--media-border,#2a2a2a)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', height: 52,
      }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>ZET Media</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/media/notifications')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>
        </div>
      </header>

      {refreshing && (
        <div style={{ textAlign: 'center', padding: 12, color: '#666', fontSize: 13 }}>Yenileniyor…</div>
      )}

      <StoryBar />

      {posts.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          <p style={{ fontSize: 16, marginBottom: 8 }}>Henüz gönderi yok</p>
          <p style={{ fontSize: 13 }}>Birilerini takip ederek feed'ini doldur</p>
          <button
            onClick={() => navigate('/media/explore')}
            style={{ marginTop: 16, background: '#3a0ca3', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 20px', cursor: 'pointer', fontSize: 14 }}
          >
            Kişileri Keşfet
          </button>
        </div>
      )}

      {posts.map(post => (
        <PostCard key={post.post_id} post={post} myUserId={user?.user_id} onComment={() => navigate(`/media/post/${post.post_id}`)} />
      ))}

      {loading && (
        <div style={{ textAlign: 'center', padding: 24, color: '#666' }}>
          <LoadingDots />
        </div>
      )}

      <div ref={loaderRef} style={{ height: 1 }} />
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: '#555',
          animation: `blink 1.2s ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }`}</style>
    </div>
  );
}
