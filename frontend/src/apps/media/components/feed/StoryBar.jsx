import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from '../ui/Avatar';
import { getStories, markStorySeen } from '../../lib/mediaApi';
import { useMedia } from '../../contexts/MediaContext';

export function StoryBar() {
  const [stories, setStories] = useState([]);
  const [viewerData, setViewerData] = useState(null);
  const { mediaProfile } = useMedia();

  useEffect(() => {
    getStories().then(setStories).catch(() => {});
  }, []);

  if (stories.length === 0) return null;

  return (
    <>
      <div style={{
        overflowX: 'auto', display: 'flex', gap: 12, padding: '12px 14px',
        borderBottom: '1px solid var(--media-border,#2a2a2a)',
        scrollbarWidth: 'none',
      }}>
        {stories.map((group) => (
          <button
            key={group.author_id}
            onClick={() => setViewerData({ group, idx: 0 })}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            <span style={{
              padding: 2, borderRadius: '50%',
              background: group.has_unseen ? 'linear-gradient(135deg,#f97316,#ec4899)' : '#333',
            }}>
              <Avatar
                src={group.author_photo}
                displayName={group.author_display_name}
                size={52}
              />
            </span>
            <span style={{ fontSize: 11, color: 'var(--media-text-muted,#888)', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {group.author_display_name || group.author_handle}
            </span>
          </button>
        ))}
      </div>

      {viewerData && (
        <StoryViewer
          group={viewerData.group}
          initialIdx={viewerData.idx}
          onClose={() => setViewerData(null)}
        />
      )}
    </>
  );
}

function StoryViewer({ group, initialIdx, onClose }) {
  const [idx, setIdx] = useState(initialIdx);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const story = group.stories[idx];
  const duration = 5000;

  useEffect(() => {
    if (!story) return;
    markStorySeen(story.post_id).catch(() => {});
    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        if (idx < group.stories.length - 1) {
          setIdx(i => i + 1);
        } else {
          onClose();
        }
      }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [idx, story, group.stories.length, onClose]);

  if (!story) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, background: '#000',
      display: 'flex', flexDirection: 'column',
    }}
      onClick={(e) => {
        const x = e.clientX;
        const third = window.innerWidth / 3;
        if (x < third) {
          if (idx > 0) setIdx(i => i - 1); else onClose();
        } else {
          if (idx < group.stories.length - 1) setIdx(i => i + 1); else onClose();
        }
      }}
    >
      {/* Progress bars */}
      <div style={{ display: 'flex', gap: 3, padding: '12px 10px 0', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}>
        {group.stories.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2, background: '#ffffff44', borderRadius: 1 }}>
            <div style={{ height: '100%', background: '#fff', borderRadius: 1, width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%', transition: 'none' }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ position: 'absolute', top: 24, left: 0, right: 0, zIndex: 1, display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 8 }}>
        <Avatar src={group.author_photo} displayName={group.author_display_name} size={36} />
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{group.author_display_name || group.author_handle}</span>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
      </div>

      {/* Story content */}
      {story.media?.[0]?.type?.startsWith('video') ? (
        <video src={story.media[0].url} autoPlay muted loop style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : story.media?.[0] ? (
        <img src={story.media[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <p style={{ color: '#fff', fontSize: 22, textAlign: 'center', lineHeight: 1.5 }}>{story.content}</p>
        </div>
      )}
    </div>
  );
}
