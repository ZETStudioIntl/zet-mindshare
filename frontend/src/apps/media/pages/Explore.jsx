import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getExplore, search, getSuggestedUsers } from '../lib/mediaApi';
import { Avatar } from '../components/ui/Avatar';
import { PostCard } from '../components/feed/PostCard';
import { useAuth } from '../../../contexts/AuthContext';

const CATEGORIES = ['Teknoloji', 'Sanat', 'Müzik', 'Gaming', 'Eğitim', 'Haberler', 'Eğlence'];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [activeQ, setActiveQ] = useState('');
  const [tab, setTab] = useState('trending');
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadExplore = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExplore({ tab, page: 1 });
      setPosts(data.posts || []);
      setTrending(data.trending_hashtags || []);
    } catch {}
    setLoading(false);
  }, [tab]);

  useEffect(() => { loadExplore(); }, [loadExplore]);

  useEffect(() => {
    getSuggestedUsers().then(setSuggested).catch(() => {});
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!q.trim()) { setSearchResults(null); setActiveQ(''); return; }
    setActiveQ(q);
    setLoading(true);
    try {
      const res = await search(q, 'all', 1);
      setSearchResults(res);
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{ background: 'var(--media-bg,#0f0f0f)', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Search bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--media-bg,#0f0f0f)', padding: '12px 14px', paddingTop: 'calc(12px + env(safe-area-inset-top))', borderBottom: '1px solid var(--media-border,#2a2a2a)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            value={q}
            onChange={e => { setQ(e.target.value); if (!e.target.value) { setSearchResults(null); setActiveQ(''); } }}
            placeholder="Kişi, etiket veya içerik ara…"
            style={{ flex: 1, background: 'var(--media-surface2,#242424)', border: '1px solid #333', borderRadius: 20, padding: '9px 16px', color: '#fff', fontSize: 14, outline: 'none' }}
          />
          <button type="submit" style={{ background: '#3a0ca3', color: '#fff', border: 'none', borderRadius: 20, padding: '9px 16px', cursor: 'pointer', fontSize: 14 }}>Ara</button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults ? (
        <div style={{ padding: '12px 0' }}>
          {/* Users */}
          {searchResults.users?.length > 0 && (
            <div>
              <div style={{ padding: '8px 14px', fontSize: 13, color: '#666', fontWeight: 600 }}>Kişiler</div>
              {searchResults.users.map(u => (
                <button key={u.handle} onClick={() => navigate(`/media/profile/${u.handle}`)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #1a1a1a' }}>
                  <Avatar src={u.profile_photo} displayName={u.display_name} size={42} verification={u.verification} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{u.display_name || u.handle}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>@{u.handle} · {u.followers_count || 0} takipçi</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {/* Hashtags */}
          {searchResults.hashtags?.length > 0 && (
            <div>
              <div style={{ padding: '8px 14px', fontSize: 13, color: '#666', fontWeight: 600 }}>Etiketler</div>
              {searchResults.hashtags.map(h => (
                <button key={h.tag} onClick={() => navigate(`/media/hashtag/${h.tag}`)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span style={{ width: 42, height: 42, background: '#1a0a33', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>#</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, color: '#fff' }}>#{h.tag}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{h.count} gönderi</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {/* Posts */}
          {searchResults.posts?.length > 0 && (
            <div>
              <div style={{ padding: '8px 14px', fontSize: 13, color: '#666', fontWeight: 600 }}>Gönderiler</div>
              {searchResults.posts.map(p => <PostCard key={p.post_id} post={p} myUserId={user?.user_id} />)}
            </div>
          )}
          {!searchResults.users?.length && !searchResults.hashtags?.length && !searchResults.posts?.length && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#555' }}>"{activeQ}" için sonuç bulunamadı</div>
          )}
        </div>
      ) : (
        <>
          {/* Trending hashtags */}
          {trending.length > 0 && (
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--media-border,#2a2a2a)' }}>
              <div style={{ fontSize: 13, color: '#666', fontWeight: 600, marginBottom: 8 }}>Trend Etiketler</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {trending.map(t => (
                  <button key={t.tag} onClick={() => navigate(`/media/hashtag/${t.tag}`)} style={{
                    background: '#1a0a33', color: '#60a5fa', border: '1px solid #3a0ca3',
                    borderRadius: 20, padding: '4px 12px', fontSize: 13, cursor: 'pointer',
                  }}>#{t.tag}</button>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--media-border,#2a2a2a)' }}>
            <div style={{ fontSize: 13, color: '#666', fontWeight: 600, marginBottom: 8 }}>Kategoriler</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => navigate(`/media/hashtag/${cat.toLowerCase()}`)} style={{
                  background: 'var(--media-surface,#1a1a1a)', color: '#ccc',
                  border: '1px solid #333', borderRadius: 20, padding: '6px 14px',
                  fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{cat}</button>
              ))}
            </div>
          </div>

          {/* Suggested users */}
          {suggested.length > 0 && (
            <div style={{ padding: '12px 0', borderBottom: '1px solid var(--media-border,#2a2a2a)' }}>
              <div style={{ padding: '0 14px 8px', fontSize: 13, color: '#666', fontWeight: 600 }}>Önerilen Kişiler</div>
              <div style={{ display: 'flex', gap: 12, padding: '0 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {suggested.map(u => (
                  <button key={u.handle} onClick={() => navigate(`/media/profile/${u.handle}`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                    <Avatar src={u.profile_photo} displayName={u.display_name} size={52} verification={u.verification} />
                    <span style={{ fontSize: 12, color: '#ccc', maxWidth: 60, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{u.display_name || u.handle}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tabs + Posts grid */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--media-border,#2a2a2a)' }}>
            {[['trending', 'Trend'], ['recent', 'Son']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: tab === key ? 700 : 400, color: tab === key ? '#fff' : '#555',
                borderBottom: tab === key ? '2px solid #fff' : '2px solid transparent',
              }}>{label}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>Yükleniyor…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              {posts.map(p => (
                <button key={p.post_id} onClick={() => navigate(`/media/post/${p.post_id}`)}
                  style={{ aspectRatio: '1', overflow: 'hidden', background: '#111', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {p.media?.[0] ? (
                    <img src={p.media[0].thumbnail || p.media[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}>
                      <span style={{ fontSize: 10, color: '#555', padding: 4, textAlign: 'center', overflow: 'hidden' }}>{(p.content || '').slice(0, 30)}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
