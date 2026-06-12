import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateMyProfile } from '../lib/mediaApi';
import { useMedia } from '../contexts/MediaContext';

function BackSVG() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width: 44, height: 24, borderRadius: 12, padding: 2,
      background: checked ? '#3a0ca3' : '#333', border: 'none', cursor: 'pointer',
      transition: 'background .15s', position: 'relative', flexShrink: 0,
    }}>
      <span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%', background: '#fff', transform: checked ? 'translateX(20px)' : 'translateX(0)', transition: 'transform .15s' }} />
    </button>
  );
}

function RowToggle({ label, desc, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--media-border,#1a1a1a)' }}>
      <div>
        <div style={{ fontSize: 15, color: '#fff' }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{desc}</div>}
      </div>
      <Toggle checked={value} onChange={onChange} />
    </div>
  );
}

function SectionHeader({ title }) {
  return <div style={{ padding: '16px 16px 6px', fontSize: 12, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { mediaProfile, setMediaProfile } = useMedia();
  const [settings, setSettings] = useState(mediaProfile?.settings || {
    hide_likes: false,
    hide_follower_count: false,
    hide_online_status: false,
    allow_dms: 'everyone',
    read_receipts: true,
  });
  const [privacy, setPrivacy] = useState(mediaProfile?.privacy || 'public');
  const [saved, setSaved] = useState(false);

  const save = async (updates) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    try {
      const updated = await updateMyProfile({ settings: newSettings, privacy });
      setMediaProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const savePrivacy = async (val) => {
    setPrivacy(val);
    try {
      const updated = await updateMyProfile({ privacy: val });
      setMediaProfile(updated);
    } catch {}
  };

  return (
    <div style={{ background: 'var(--media-bg,#0f0f0f)', minHeight: '100vh', paddingBottom: 80 }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        paddingTop: 'calc(14px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--media-border,#2a2a2a)',
        background: 'var(--media-surface,#1a1a1a)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
          <BackSVG />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#fff', flex: 1 }}>ZET Media Ayarları</span>
        {saved && <span style={{ fontSize: 13, color: '#22c55e' }}>Kaydedildi</span>}
      </header>

      <SectionHeader title="Hesap Gizliliği" />
      <div style={{ padding: '0 16px 14px', background: 'var(--media-surface,#1a1a1a)', marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Hesap görünürlüğü</div>
        {[['public', 'Herkese Açık'], ['private', 'Gizli'], ['friends', 'Sadece Arkadaşlar']].map(([val, label]) => (
          <button key={val} onClick={() => savePrivacy(val)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
          }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + (privacy === val ? '#3a0ca3' : '#444'), background: privacy === val ? '#3a0ca3' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {privacy === val && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
            </span>
            <span style={{ fontSize: 14, color: '#fff' }}>{label}</span>
          </button>
        ))}
      </div>

      <SectionHeader title="Etkileşim" />
      <RowToggle label="Beğeni sayısını gizle" desc="Gönderilerinizdeki beğeni sayısını sakla" value={settings.hide_likes} onChange={(v) => save({ hide_likes: v })} />
      <RowToggle label="Takipçi sayısını gizle" value={settings.hide_follower_count} onChange={(v) => save({ hide_follower_count: v })} />
      <RowToggle label="Çevrimiçi durumunu gizle" value={settings.hide_online_status} onChange={(v) => save({ hide_online_status: v })} />
      <RowToggle label="Okundu bilgisi" desc="Mesajlarını okuduğunda karşı tarafa göster" value={settings.read_receipts} onChange={(v) => save({ read_receipts: v })} />

      <SectionHeader title="Mesajlaşma" />
      <div style={{ padding: '14px 16px', background: 'var(--media-surface,#1a1a1a)', marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Kimlere DM'e izin ver</div>
        {[['everyone', 'Herkes'], ['followers', 'Takipçilerim'], ['none', 'Kimse']].map(([val, label]) => (
          <button key={val} onClick={() => save({ allow_dms: val })} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
          }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + (settings.allow_dms === val ? '#3a0ca3' : '#444'), background: settings.allow_dms === val ? '#3a0ca3' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {settings.allow_dms === val && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
            </span>
            <span style={{ fontSize: 14, color: '#fff' }}>{label}</span>
          </button>
        ))}
      </div>

      <SectionHeader title="Hakkında" />
      <div style={{ padding: '0 16px', background: 'var(--media-surface,#1a1a1a)' }}>
        <div style={{ padding: '14px 0', borderBottom: '1px solid #1a1a1a', fontSize: 14, color: '#888' }}>ZET Media v1.0.0</div>
        <div style={{ padding: '14px 0', borderBottom: '1px solid #1a1a1a', fontSize: 14, color: '#888' }}>Gizlilik Politikası</div>
        <div style={{ padding: '14px 0', fontSize: 14, color: '#888' }}>Kullanım Koşulları</div>
      </div>
    </div>
  );
}
