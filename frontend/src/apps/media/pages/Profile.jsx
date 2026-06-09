import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProfile, getProfilePosts, followUser, unfollowUser, updateMyProfile, createConversation } from '../lib/mediaApi';
import { useMedia } from '../contexts/MediaContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { VerificationBadge } from '../components/ui/VerificationBadge';
import { PostCard } from '../components/feed/PostCard';

function BackSVG() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
}

function SettingsSVG() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>;
}

export default function ProfilePage() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mediaProfile, setMediaProfile, loadProfile } = useMedia();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  const isOwn = mediaProfile?.handle === handle;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getProfile(handle);
      setProfile(p);
    } catch {
      setProfile(null);
    }
    setLoading(false);
  }, [handle]);

  const loadPosts = useCallback(async () => {
    if (!profile) return;
    setPostsLoading(true);
    try {
      const data = await getProfilePosts(handle, { tab });
      setPosts(data.posts || []);
    } catch {}
    setPostsLoading(false);
  }, [handle, tab, profile]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleFollow = async () => {
    if (!profile) return;
    try {
      if (profile.is_following) {
        await unfollowUser(profile.user_id);
        setProfile(p => ({ ...p, is_following: false, followers_count: p.followers_count - 1 }));
      } else {
        await followUser(profile.user_id);
        setProfile(p => ({ ...p, is_following: true, followers_count: p.followers_count + 1 }));
      }
    } catch {}
  };

  const handleMessage = async () => {
    try {
      const conv = await createConversation({ type: 'dm', other_user_id: profile.user_id });
      navigate('/media/messages', { state: { openConv: conv } });
    } catch {}
  };

  const handleSaveEdit = async () => {
    try {
      const updated = await updateMyProfile(editData);
      setMediaProfile(updated);
      setProfile(prev => ({ ...prev, ...editData }));
      setEditMode(false);
      loadProfile();
    } catch {}
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--media-bg,#0f0f0f)' }}>
      <div style={{ color: '#555' }}>Yükleniyor…</div>
    </div>
  );

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#555', background: 'var(--media-bg,#0f0f0f)', minHeight: '100vh' }}>
      <p>Profil bulunamadı</p>
      <button onClick={() => navigate('/media')} style={{ marginTop: 12, background: '#292F91', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 20px', cursor: 'pointer' }}>Ana Sayfa</button>
    </div>
  );

  return (
    <div style={{ background: 'var(--media-bg,#0f0f0f)', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 14px',
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        background: 'var(--media-bg,#0f0f0f)', position: 'sticky', top: 0, zIndex: 10,
        borderBottom: '1px solid var(--media-border,#2a2a2a)',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', marginRight: 12 }}>
          <BackSVG />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', flex: 1 }}>@{handle}</span>
        {isOwn && (
          <button onClick={() => navigate('/media/settings')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
            <SettingsSVG />
          </button>
        )}
      </div>

      {/* Banner */}
      <div style={{ height: 120, background: profile.banner_photo ? `url(${profile.banner_photo}) center/cover` : 'linear-gradient(135deg,#1a1a2e,#292F91)', position: 'relative' }} />

      {/* Profile photo + actions */}
      <div style={{ padding: '0 16px', marginTop: -40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <Avatar src={profile.profile_photo} displayName={profile.display_name || handle} size={76} verification={profile.verification} />
        <div style={{ display: 'flex', gap: 8 }}>
          {isOwn ? (
            <button onClick={() => { setEditMode(true); setEditData({ display_name: profile.display_name, bio: profile.bio }); }}
              style={outlineBtn}>Profili Düzenle</button>
          ) : (
            <>
              <button onClick={handleMessage} style={outlineBtn}>Mesaj</button>
              <button onClick={handleFollow} style={{
                ...outlineBtn,
                background: profile.is_following ? 'transparent' : '#292F91',
                borderColor: profile.is_following ? '#444' : '#292F91',
                color: '#fff',
              }}>
                {profile.is_following ? 'Takip Ediliyor' : 'Takip Et'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{profile.display_name || handle}</span>
          {profile.verification && <VerificationBadge type={profile.verification.type} size={16} />}
        </div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>@{handle}</div>
        {profile.bio && <p style={{ fontSize: 14, color: 'var(--media-text,#ccc)', lineHeight: 1.5, marginBottom: 10 }}>{profile.bio}</p>}
        <div style={{ display: 'flex', gap: 20 }}>
          <button onClick={() => navigate(`/media/profile/${handle}/followers`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{profile.followers_count || 0}</span>
            <span style={{ fontSize: 12, color: '#666', marginLeft: 4 }}>Takipçi</span>
          </button>
          <button onClick={() => navigate(`/media/profile/${handle}/following`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{profile.following_count || 0}</span>
            <span style={{ fontSize: 12, color: '#666', marginLeft: 4 }}>Takip</span>
          </button>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{profile.post_count || 0}</span>
            <span style={{ fontSize: 12, color: '#666', marginLeft: 4 }}>Gönderi</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {!profile.is_private && (
        <>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--media-border,#2a2a2a)' }}>
            {[['posts', 'Gönderiler'], ['reels', 'Reels'], ['tagged', 'Etiketlendi']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: tab === key ? 700 : 400,
                color: tab === key ? '#fff' : '#555',
                borderBottom: tab === key ? '2px solid #fff' : '2px solid transparent',
              }}>{label}</button>
            ))}
          </div>

          {postsLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>Yükleniyor…</div>
          ) : tab === 'posts' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              {posts.map(p => (
                <button key={p.post_id} onClick={() => navigate(`/media/post/${p.post_id}`)}
                  style={{ aspectRatio: '1', overflow: 'hidden', background: '#111', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {p.media?.[0] ? (
                    p.type === 'video' || p.type === 'reel' ? (
                      <video src={p.media[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                    ) : (
                      <img src={p.media[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}>
                      <span style={{ fontSize: 11, color: '#555', padding: 4, textAlign: 'center', overflow: 'hidden' }}>{(p.content || '').slice(0, 40)}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            posts.map(p => <PostCard key={p.post_id} post={p} myUserId={user?.user_id} />)
          )}

          {!postsLoading && posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#555' }}>Henüz gönderi yok</div>
          )}
        </>
      )}

      {profile.is_private && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#555' }}>
          <p>Bu hesap gizli</p>
          {!profile.is_following && <p style={{ fontSize: 13, marginTop: 4 }}>İçerikleri görmek için takip et</p>}
        </div>
      )}

      {/* Edit modal */}
      {editMode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: 'var(--media-surface,#1a1a1a)', borderRadius: '20px 20px 0 0', width: '100%', padding: '24px 20px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
            <h3 style={{ color: '#fff', marginBottom: 16, fontSize: 17 }}>Profili Düzenle</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Ad Soyad</label>
              <input value={editData.display_name || ''} onChange={e => setEditData(d => ({ ...d, display_name: e.target.value }))}
                style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Biyografi</label>
              <textarea value={editData.bio || ''} onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))}
                rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditMode(false)} style={{ flex: 1, ...outlineBtn }}>İptal</button>
              <button onClick={handleSaveEdit} style={{ flex: 1, background: '#292F91', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 0', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const outlineBtn = {
  background: 'transparent', color: '#fff',
  border: '1px solid #444', borderRadius: 10, padding: '7px 14px',
  cursor: 'pointer', fontSize: 13, fontWeight: 600,
};

const inputStyle = {
  width: '100%', background: 'var(--media-surface2,#242424)',
  border: '1px solid #333', borderRadius: 10, padding: '10px 12px',
  color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
