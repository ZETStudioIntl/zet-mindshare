import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { EventSVGIcon, EVENT_SVGS, SVG_CATEGORIES } from '../../lib/eventSVGs';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const toLocalDT = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const REWARD_TYPES = [
  { id: 'zp',          label: 'ZP',           hasAmount: true,  hasMood: false },
  { id: 'credit',      label: 'Kredi',        hasAmount: true,  hasMood: false },
  { id: 'case',        label: 'Kasa',         hasAmount: false, hasMood: false },
  { id: 'wheel',       label: 'Çark',         hasAmount: false, hasMood: false },
  { id: 'mood_unlock', label: 'Mod Unlock',   hasAmount: false, hasMood: true  },
];

const MOOD_MODES = ['focus', 'creative', 'relax', 'study', 'energize', 'sleep'];

function newSlide() {
  return {
    slide_id: Math.random().toString(36).slice(2),
    svg_key: 'kupa',
    title: '',
    body: '',
    reward: null,
  };
}

function newEvent() {
  return {
    title: '',
    subtitle: '',
    start_at: '',
    end_at: '',
    accent_color: '#4ca8ad',
    slides: [newSlide()],
  };
}

function SVGPicker({ value, onChange, color }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState('odul');

  const catKeys = Object.keys(SVG_CATEGORIES);
  const filtered = Object.entries(EVENT_SVGS).filter(([, def]) => def.category === cat);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: '#e2e8f0',
        }}
      >
        <EventSVGIcon svgKey={value} color={color} size={32} />
        <span style={{ fontSize: 13 }}>{EVENT_SVGS[value]?.label || value}</span>
        {open ? <ChevronUp size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
               : <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
      </button>

      {open && (
        <div style={{ marginTop: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 8px 4px', overflowX: 'auto', flexWrap: 'nowrap' }}>
            {catKeys.map(k => (
              <button
                key={k}
                onClick={() => setCat(k)}
                style={{
                  flexShrink: 0, padding: '4px 10px', borderRadius: 20, fontSize: 11,
                  fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: cat === k ? color : 'rgba(255,255,255,0.06)',
                  color: cat === k ? '#fff' : '#94a3b8',
                  whiteSpace: 'nowrap',
                }}
              >
                {SVG_CATEGORIES[k]}
              </button>
            ))}
          </div>
          {/* SVG grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, padding: '8px', maxHeight: 200, overflowY: 'auto' }}>
            {filtered.map(([key, def]) => (
              <button
                key={key}
                onClick={() => { onChange(key); setOpen(false); }}
                title={def.label}
                style={{
                  background: value === key ? `${color}20` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${value === key ? color : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', position: 'relative',
                }}
              >
                <EventSVGIcon svgKey={key} color={color} size={36} />
                {value === key && (
                  <div style={{ position: 'absolute', top: 2, right: 2 }}>
                    <Check size={10} color={color} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SlideEditor({ slide, index, color, onChange, onDelete, total }) {
  const [open, setOpen] = useState(index === 0);
  const reward = slide.reward;

  const setRewardType = (type) => {
    if (!type) { onChange({ ...slide, reward: null }); return; }
    onChange({ ...slide, reward: { type, amount: type === 'zp' ? 100 : type === 'credit' ? 10 : undefined, mode: undefined } });
  };

  const rt = REWARD_TYPES.find(r => r.id === reward?.type);

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <EventSVGIcon svgKey={slide.svg_key} color={color} size={28} />
        <span style={{ fontSize: 13, color: '#e2e8f0', flex: 1 }}>
          Slayt {index + 1}{slide.title ? ` — ${slide.title}` : ''}
        </span>
        {total > 1 && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
          >
            <Trash2 size={14} />
          </button>
        )}
        {open ? <ChevronUp size={14} style={{ color: '#64748b' }} />
               : <ChevronDown size={14} style={{ color: '#64748b' }} />}
      </div>

      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>SVG</p>
            <SVGPicker value={slide.svg_key} onChange={v => onChange({ ...slide, svg_key: v })} color={color} />
          </div>

          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Başlık</p>
            <input
              value={slide.title}
              onChange={e => onChange({ ...slide, title: e.target.value })}
              placeholder="Slayt başlığı..."
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Açıklama</p>
            <textarea
              value={slide.body}
              onChange={e => onChange({ ...slide, body: e.target.value })}
              placeholder="Slayt açıklaması (opsiyonel)..."
              rows={2}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', padding: '8px 10px', fontSize: 13, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* Reward */}
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Ödül</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <button
                onClick={() => setRewardType(null)}
                style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: 'none', background: !reward ? color : 'rgba(255,255,255,0.06)', color: !reward ? '#fff' : '#94a3b8', fontWeight: 600 }}
              >
                Yok
              </button>
              {REWARD_TYPES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRewardType(r.id)}
                  style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: 'none', background: reward?.type === r.id ? color : 'rgba(255,255,255,0.06)', color: reward?.type === r.id ? '#fff' : '#94a3b8', fontWeight: 600 }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {rt?.hasAmount && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  value={reward?.amount || ''}
                  onChange={e => onChange({ ...slide, reward: { ...reward, amount: parseInt(e.target.value) || 0 } })}
                  placeholder="Miktar"
                  min={1}
                  style={{ width: 100, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', padding: '7px 10px', fontSize: 13 }}
                />
                <span style={{ fontSize: 12, color: '#64748b' }}>{rt.label}</span>
              </div>
            )}

            {rt?.hasMood && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {MOOD_MODES.map(m => (
                  <button
                    key={m}
                    onClick={() => onChange({ ...slide, reward: { ...reward, mode: m } })}
                    style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: 'none', background: reward?.mode === m ? '#a78bfa' : 'rgba(255,255,255,0.06)', color: reward?.mode === m ? '#fff' : '#94a3b8', fontWeight: 600 }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventCreatorPanel() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const showMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/events`, { withCredentials: true });
      setEvents(res.data.events || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadEvents(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.start_at || !form.end_at) {
      showMsg('Başlık, başlangıç ve bitiş tarihi zorunlu', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        slides: form.slides.map(s => ({ ...s, reward: s.reward?.type ? s.reward : null })),
      };
      if (editingId) {
        await axios.put(`${API}/admin/events/${editingId}`, payload, { withCredentials: true });
        showMsg('Etkinlik güncellendi');
      } else {
        await axios.post(`${API}/admin/events`, payload, { withCredentials: true });
        showMsg('Etkinlik oluşturuldu');
      }
      setForm(null);
      setEditingId(null);
      loadEvents();
    } catch (e) {
      showMsg(e?.response?.data?.detail || 'Hata oluştu', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API}/admin/events/${eventId}`, { withCredentials: true });
      showMsg('Silindi');
      loadEvents();
    } catch {
      showMsg('Silinemedi', 'error');
    }
  };

  const handleEdit = (ev) => {
    setEditingId(ev.event_id);
    setForm({ title: ev.title, subtitle: ev.subtitle || '', start_at: toLocalDT(ev.start_at), end_at: toLocalDT(ev.end_at), accent_color: ev.accent_color || '#4ca8ad', slides: ev.slides || [newSlide()] });
  };

  const now = new Date().toISOString();

  const statusOf = (ev) => {
    if (ev.end_at < now) return { label: 'Bitti', color: '#64748b' };
    if (ev.start_at <= now) return { label: 'Aktif', color: '#22c55e' };
    return { label: 'Planlı', color: '#f59e0b' };
  };

  const inputStyle = { width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' };
  const labelStyle = { fontSize: 10, color: '#64748b', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block' };

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? '#7f1d1d' : '#14532d', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
          Etkinlikler
        </p>
        {!form && (
          <button
            onClick={() => { setForm(newEvent()); setEditingId(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={14} /> Yeni Etkinlik
          </button>
        )}
      </div>

      {/* Form */}
      {form && (
        <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', margin: '0 0 14px' }}>
            {editingId ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}
          </p>

          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Başlık *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Etkinlik başlığı..." style={inputStyle}/>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Alt Başlık</label>
            <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Kısa açıklama..." style={inputStyle}/>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Başlangıç *</label>
              <input type="datetime-local" value={form.start_at} onChange={e => setForm(f => ({ ...f, start_at: e.target.value }))} style={inputStyle}/>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Bitiş *</label>
              <input type="datetime-local" value={form.end_at} onChange={e => setForm(f => ({ ...f, end_at: e.target.value }))} style={inputStyle}/>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Tema Rengi</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="color" value={form.accent_color} onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'none' }}/>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{form.accent_color}</span>
              {['#4ca8ad','#f59e0b','#a78bfa','#ef4444','#22c55e','#e11d48'].map(col => (
                <button key={col} onClick={() => setForm(f => ({ ...f, accent_color: col }))}
                  style={{ width: 22, height: 22, borderRadius: '50%', background: col, border: form.accent_color === col ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }}/>
              ))}
            </div>
          </div>

          {/* Slides */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ ...labelStyle, margin: 0 }}>Slaytlar ({form.slides.length})</label>
              <button
                onClick={() => setForm(f => ({ ...f, slides: [...f.slides, newSlide()] }))}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}
              >
                <Plus size={12} /> Slayt Ekle
              </button>
            </div>
            {form.slides.map((slide, i) => (
              <SlideEditor
                key={slide.slide_id}
                slide={slide}
                index={i}
                total={form.slides.length}
                color={form.accent_color}
                onChange={updated => setForm(f => ({ ...f, slides: f.slides.map((s, j) => j === i ? updated : s) }))}
                onDelete={() => setForm(f => ({ ...f, slides: f.slides.filter((_, j) => j !== i) }))}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setForm(null); setEditingId(null); }}
              style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 2, padding: '9px', borderRadius: 10, background: saving ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}
            >
              {saving ? 'Kaydediliyor...' : (editingId ? 'Güncelle' : 'Oluştur')}
            </button>
          </div>
        </div>
      )}

      {/* Event List */}
      {loading ? (
        <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '20px 0' }}>Yükleniyor...</p>
      ) : events.length === 0 ? (
        <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '20px 0' }}>Henüz etkinlik yok</p>
      ) : events.map(ev => {
        const st = statusOf(ev);
        return (
          <div key={ev.event_id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, flexShrink: 0 }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{ev.title}</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                {ev.slides?.length || 0} slayt — {st.label}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => handleEdit(ev)} style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Düzenle</button>
              <button onClick={() => handleDelete(ev.event_id)} style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>Sil</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
