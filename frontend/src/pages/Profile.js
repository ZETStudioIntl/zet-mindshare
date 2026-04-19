import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { ArrowLeft, FileText, Globe } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VERIFIED_COLORS = { red: '#ef4444', gold: '#f59e0b', blue: '#3b82f6' };

const VerifiedBadge = ({ type }) => {
  if (!type) return null;
  return (
    <svg viewBox="0 0 24 24" fill={VERIFIED_COLORS[type]} style={{ width: 16, height: 16, display: 'inline', flexShrink: 0 }}>
      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
    </svg>
  );
};

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, postsRes] = await Promise.all([
          axios.get(`${API}/users/${username}`, { withCredentials: true }),
          axios.get(`${API}/users/${username}/posts?limit=30`, { withCredentials: true }),
        ]);
        setProfile(profileRes.data);
        setIsFollowing(profileRes.data.is_following || false);
        setPosts(postsRes.data.posts || []);
      } catch {
        setProfile(null);
      }
      setLoading(false);
    };
    load();
  }, [username]);

  const toggleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await axios.delete(`${API}/users/${username}/follow`, { withCredentials: true });
        setIsFollowing(false);
        setProfile(p => ({ ...p, followers_count: Math.max(0, (p.followers_count || 1) - 1) }));
      } else {
        await axios.post(`${API}/users/${username}/follow`, {}, { withCredentials: true });
        setIsFollowing(true);
        setProfile(p => ({ ...p, followers_count: (p.followers_count || 0) + 1 }));
      }
    } catch {}
    setFollowLoading(false);
  };

  const isOwn = me?.username === username || me?.user_id === profile?.user_id;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}>
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--zet-primary)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)' }}>
      <p className="text-lg font-semibold">Kullanıcı bulunamadı</p>
      <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl text-sm" style={{ background: 'var(--zet-primary)', color: '#fff' }}>Geri Dön</button>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--zet-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b" style={{ background: 'var(--zet-bg)', borderColor: 'var(--zet-border)' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
        </button>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--zet-text)' }}>{profile.display_name || profile.name}</p>
          <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{posts.length} gönderi</p>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Profile info */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2" style={{ background: 'var(--zet-primary)', borderColor: 'var(--zet-primary)' }}>
            {profile.picture
              ? <img src={profile.picture} alt="" className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">{(profile.display_name || profile.name || 'U')[0]}</span>
            }
          </div>
          {!isOwn && (
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                background: isFollowing ? 'transparent' : 'var(--zet-primary)',
                color: isFollowing ? 'var(--zet-text)' : '#fff',
                border: isFollowing ? '1px solid var(--zet-border)' : 'none',
              }}
            >
              {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
            </button>
          )}
        </div>

        {/* Name + verified */}
        <div className="mb-1 flex items-center gap-1.5 flex-wrap">
          <span className="text-xl font-bold" style={{ color: 'var(--zet-text)' }}>{profile.display_name || profile.name}</span>
          <VerifiedBadge type={profile.verified_type} />
        </div>
        <p className="text-sm mb-2" style={{ color: 'var(--zet-text-muted)' }}>@{profile.username}</p>
        {profile.bio && <p className="text-sm mb-4 whitespace-pre-wrap" style={{ color: 'var(--zet-text)' }}>{profile.bio}</p>}

        {/* Stats */}
        <div className="flex gap-6 mb-6 text-sm">
          <div className="text-center">
            <p className="font-bold text-base" style={{ color: 'var(--zet-text)' }}>{posts.length}</p>
            <p style={{ color: 'var(--zet-text-muted)' }}>gönderi</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-base" style={{ color: 'var(--zet-text)' }}>{profile.followers_count || 0}</p>
            <p style={{ color: 'var(--zet-text-muted)' }}>takipçi</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-base" style={{ color: 'var(--zet-text)' }}>{profile.following_count || 0}</p>
            <p style={{ color: 'var(--zet-text-muted)' }}>takip</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t mb-4" style={{ borderColor: 'var(--zet-border)' }} />

        {/* Posts */}
        {posts.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: 'var(--zet-text-muted)' }}>Henüz gönderi yok</p>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.post_id} className="rounded-xl overflow-hidden" style={{ background: 'var(--zet-bg-card)', border: post.boost?.active ? '1px solid #f59e0b60' : '1px solid var(--zet-border)' }}>
                {post.boost?.active && (
                  <div className="px-4 pt-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#f59e0b20', color: '#f59e0b' }}>🚀 Öne Çıkarılmış</span>
                  </div>
                )}
                {post.content && <p className="px-4 py-3 text-sm whitespace-pre-wrap" style={{ color: 'var(--zet-text)' }}>{post.content}</p>}
                {post.type === 'image' && post.media_data && <img src={post.media_data} alt="" className="w-full max-h-80 object-cover" />}
                {post.type === 'video' && post.media_url && (
                  <div className="px-4 pb-3">
                    <a href={post.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--zet-bg)', color: 'var(--zet-primary-light)', border: '1px solid var(--zet-border)' }}>
                      <Globe className="h-4 w-4 flex-shrink-0" /> <span className="truncate">{post.media_url}</span>
                    </a>
                  </div>
                )}
                {post.type === 'document' && post.doc_id && (
                  <div className="px-4 pb-3">
                    <button onClick={() => navigate(`/editor/${post.doc_id}`)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full text-left" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)', border: '1px solid var(--zet-border)' }}>
                      <FileText className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--zet-primary-light)' }} />
                      <span className="truncate">{post.doc_title || 'Belge'}</span>
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3 px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text-muted)' }}>
                  <span>❤️ {post.like_count || 0}</span>
                  <span>💬 {post.comment_count || 0}</span>
                  <span className="ml-auto">{new Date(post.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
