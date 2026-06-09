import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { MediaProvider } from './contexts/MediaContext';
import { BottomNav } from './components/ui/BottomNav';
import { getHashtagPosts } from './lib/mediaApi';

import FeedPage from './pages/Feed';
import MessagesPage from './pages/Messages';
import ProfilePage from './pages/Profile';
import ExplorePage from './pages/Explore';
import NotificationsPage from './pages/Notifications';
import SettingsPage from './pages/Settings';
import CreatePostPage from './pages/CreatePost';
import PostDetailPage from './pages/PostDetail';

import './media.css';

function MediaApp() {
  return (
    <div className="media-app">
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/create" element={<CreatePostPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile/:handle" element={<ProfilePage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />
        <Route path="/hashtag/:tag" element={<HashtagPage />} />
        <Route path="*" element={<Navigate to="/media" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

function HashtagPage() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getHashtagPosts(tag, 1).then(d => setPosts(d.posts || [])).catch(() => {});
  }, [tag]);

  return (
    <div style={{ background: 'var(--media-bg,#0f0f0f)', minHeight: '100vh', paddingBottom: 80 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', paddingTop: 'calc(14px + env(safe-area-inset-top))', background: 'var(--media-surface,#1a1a1a)', borderBottom: '1px solid var(--media-border,#2a2a2a)', position: 'sticky', top: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>#{tag}</span>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        {posts.map(p => (
          <button key={p.post_id} onClick={() => navigate(`/media/post/${p.post_id}`)} style={{ aspectRatio: '1', overflow: 'hidden', background: '#111', border: 'none', cursor: 'pointer', padding: 0 }}>
            {p.media?.[0] ? <img src={p.media[0].thumbnail || p.media[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 10, color: '#555', padding: 4, textAlign: 'center' }}>{(p.content || '').slice(0, 30)}</span></div>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MediaAppWrapper() {
  return (
    <MediaProvider>
      <MediaApp />
    </MediaProvider>
  );
}
