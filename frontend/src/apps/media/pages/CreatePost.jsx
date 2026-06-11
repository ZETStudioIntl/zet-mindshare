import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../lib/mediaApi';
import { useMedia } from '../contexts/MediaContext';

const POST_TYPES = [
  { key: 'text', label: 'Metin', icon: '✏️' },
  { key: 'photo', label: 'Fotoğraf', icon: '📷' },
  { key: 'reel', label: 'Reel', icon: '🎬' },
  { key: 'story', label: 'Hikaye', icon: '⏱️' },
];

function CloseSVG() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { mediaProfile } = useMedia();
  const [type, setType] = useState('text');
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [allowDownload, setAllowDownload] = useState(true);
  const [addWatermark, setAddWatermark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const isStory = type === 'story';
  const actualType = isStory ? 'photo' : type;

  const MAX_TOTAL_SIZE = 9 * 1024 * 1024; // ~9MB toplam (DB doküman limiti)

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleFile = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, isStory ? 1 : 10);
    if (files.length === 0) return;
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      setError('Medya boyutu çok büyük (maks. 9MB)');
      return;
    }
    setError('');
    try {
      const urls = await Promise.all(files.map(fileToDataUrl));
      setMediaFiles(files);
      setMediaUrls(urls);
    } catch {
      setError('Dosya okunamadı');
    }
  };

  const removeMedia = (idx) => {
    const nf = [...mediaFiles]; nf.splice(idx, 1);
    const nu = [...mediaUrls]; nu.splice(idx, 1);
    setMediaFiles(nf);
    setMediaUrls(nu);
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaUrls.length === 0) {
      setError('İçerik veya medya ekle'); return;
    }
    setLoading(true);
    setError('');
    try {
      const media = mediaUrls.map((url, i) => ({
        url,
        type: mediaFiles[i]?.type?.startsWith('video') ? 'video' : 'image',
      }));
      await createPost({
        type: actualType,
        content,
        media,
        allows_download: allowDownload,
        watermark: addWatermark ? 'Made with ZET Mindshare' : null,
        story: isStory,
      });
      navigate(-1);
    } catch {
      setError('Gönderi oluşturulamadı');
    }
    setLoading(false);
  };

  return (
    <div style={{ background: 'var(--media-bg,#0f0f0f)', minHeight: '100vh', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', paddingTop: 'calc(14px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--media-border,#2a2a2a)',
        background: 'var(--media-surface,#1a1a1a)',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
          <CloseSVG />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Yeni Gönderi</span>
        <button onClick={handleSubmit} disabled={loading} style={{
          background: '#292F91', color: '#fff', border: 'none', borderRadius: 20,
          padding: '7px 16px', cursor: loading ? 'default' : 'pointer', fontSize: 14, fontWeight: 600,
          opacity: loading ? 0.6 : 1,
        }}>
          {isStory ? 'Paylaş' : loading ? 'Gönderiliyor…' : 'Paylaş'}
        </button>
      </div>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--media-border,#2a2a2a)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {POST_TYPES.map(pt => (
          <button key={pt.key} onClick={() => setType(pt.key)} style={{
            background: type === pt.key ? '#292F91' : 'var(--media-surface,#1a1a1a)',
            color: type === pt.key ? '#fff' : '#888',
            border: '1px solid ' + (type === pt.key ? '#292F91' : '#333'),
            borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontSize: 13,
            whiteSpace: 'nowrap',
          }}>
            {pt.icon} {pt.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px' }}>
        {/* Text area */}
        {(type === 'text' || type === 'photo' || type === 'reel' || type === 'story') && (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, 2200))}
            placeholder={isStory ? 'Hikaye başlığı (opsiyonel)…' : 'Ne paylaşmak istiyorsun? #etiket @kişi'}
            rows={isStory ? 2 : 5}
            style={{
              width: '100%', background: 'transparent', border: 'none', color: '#fff',
              fontSize: 16, resize: 'none', outline: 'none', fontFamily: 'inherit',
              lineHeight: 1.5, boxSizing: 'border-box',
            }}
          />
        )}

        <div style={{ fontSize: 12, color: '#444', textAlign: 'right', marginBottom: 12 }}>{content.length}/2200</div>

        {/* Media upload */}
        {type !== 'text' && (
          <>
            <button onClick={() => fileRef.current?.click()} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              background: 'var(--media-surface,#1a1a1a)', border: '1px dashed #333',
              borderRadius: 12, padding: '14px 0', justifyContent: 'center',
              cursor: 'pointer', color: '#888', fontSize: 14, marginBottom: 12,
            }}>
              <span style={{ fontSize: 20 }}>{type === 'reel' ? '🎬' : '📷'}</span>
              {type === 'reel' ? 'Video yükle' : isStory ? 'Fotoğraf/Video seç' : 'Fotoğraf yükle (maks. 10)'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={type === 'reel' ? 'video/*' : isStory ? 'image/*,video/*' : 'image/*'}
              multiple={!isStory && type !== 'reel'}
              onChange={handleFile}
              style={{ display: 'none' }}
            />

            {mediaUrls.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {mediaUrls.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    {mediaFiles[i]?.type?.startsWith('video') ? (
                      <video src={url} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} muted />
                    ) : (
                      <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                    )}
                    <button onClick={() => removeMedia(i)} style={{
                      position: 'absolute', top: -6, right: -6, background: '#ef4444',
                      color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20,
                      cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Options */}
        {!isStory && (
          <div style={{ borderTop: '1px solid var(--media-border,#2a2a2a)', paddingTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 14, color: '#ccc' }}>İndirmeye izin ver</span>
              <Toggle checked={allowDownload} onChange={setAllowDownload} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: '#ccc' }}>ZET Mindshare filigranı ekle</span>
              <Toggle checked={addWatermark} onChange={setAddWatermark} />
            </label>
          </div>
        )}

        {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, padding: 2,
        background: checked ? '#292F91' : '#333',
        border: 'none', cursor: 'pointer', transition: 'background .15s', position: 'relative',
      }}
    >
      <span style={{
        display: 'block', width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transform: checked ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform .15s',
      }} />
    </button>
  );
}
