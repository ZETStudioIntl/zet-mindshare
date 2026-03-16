import React, { useState, useEffect } from 'react';
import { X, Copy, Link, Trash2, Users, Globe, Lock, Check } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function ShareDialog({ docId, onClose }) {
  const [shares, setShares] = useState([]);
  const [permission, setPermission] = useState('view');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    loadShares();
  }, [docId]);

  const loadShares = async () => {
    try {
      const res = await axios.get(`${API}/api/documents/${docId}/shares`, { withCredentials: true });
      setShares(res.data);
    } catch {}
  };

  const createLink = async () => {
    setCreating(true);
    try {
      const res = await axios.post(`${API}/api/documents/${docId}/share`, { permission }, { withCredentials: true });
      setShares(prev => [...prev, { ...res.data, doc_id: docId, active: true }]);
    } catch {}
    setCreating(false);
  };

  const revokeLink = async (shareId) => {
    try {
      await axios.delete(`${API}/api/share/${shareId}`, { withCredentials: true });
      setShares(prev => prev.filter(s => s.share_id !== shareId));
    } catch {}
  };

  const copyLink = (shareId) => {
    const url = `${window.location.origin}/shared/${shareId}`;
    navigator.clipboard.writeText(url);
    setCopied(shareId);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div data-testid="share-dialog" className="rounded-xl p-6 w-full max-w-md shadow-2xl" style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" style={{ color: 'var(--zet-primary)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--zet-text)' }}>Belge Paylas</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>
        </div>

        {/* Create new link */}
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--zet-bg)' }}>
          <label className="text-xs block mb-2" style={{ color: 'var(--zet-text-muted)' }}>Yeni paylasim linki olustur</label>
          <div className="flex gap-2">
            <select data-testid="share-permission-select" value={permission} onChange={e => setPermission(e.target.value)} className="zet-input text-xs flex-1">
              <option value="view">Salt Okunur</option>
              <option value="edit">Duzenlenebilir</option>
            </select>
            <button data-testid="create-share-btn" onClick={createLink} disabled={creating} className="zet-btn px-3 py-1.5 text-xs flex items-center gap-1">
              <Link className="h-3 w-3" />{creating ? '...' : 'Olustur'}
            </button>
          </div>
        </div>

        {/* Existing links */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {shares.length === 0 && (
            <div className="text-center py-4 text-xs" style={{ color: 'var(--zet-text-muted)' }}>Henuz paylasim linki yok</div>
          )}
          {shares.map(s => (
            <div key={s.share_id} data-testid={`share-item-${s.share_id}`} className="flex items-center justify-between p-2 rounded-lg text-xs" style={{ background: 'var(--zet-bg)' }}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {s.permission === 'edit' ? <Globe className="h-3.5 w-3.5 shrink-0" style={{ color: '#22c55e' }} /> : <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: '#f59e0b' }} />}
                <div className="truncate" style={{ color: 'var(--zet-text)' }}>
                  {s.permission === 'edit' ? 'Duzenlenebilir' : 'Salt Okunur'}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button data-testid={`copy-link-${s.share_id}`} onClick={() => copyLink(s.share_id)} className="p-1.5 rounded hover:bg-white/10" title="Linki Kopyala">
                  {copied === s.share_id ? <Check className="h-3 w-3" style={{ color: '#22c55e' }} /> : <Copy className="h-3 w-3" style={{ color: 'var(--zet-text)' }} />}
                </button>
                <button data-testid={`revoke-link-${s.share_id}`} onClick={() => revokeLink(s.share_id)} className="p-1.5 rounded hover:bg-red-500/20" title="Iptal Et">
                  <Trash2 className="h-3 w-3" style={{ color: '#f87171' }} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t text-xs text-center" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text-muted)' }}>
          Paylasim linkleri olan herkes belgeye erisebilir
        </div>
      </div>
    </div>
  );
}
