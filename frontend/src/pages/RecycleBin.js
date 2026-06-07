import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Trash2, RotateCcw, X } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (hours < 1) return 'az önce';
  if (hours < 24) return `${hours} saat önce`;
  return `${days} gün önce`;
};

const daysRemaining = (deletedAt) => {
  const deleted = new Date(deletedAt);
  const expiresAt = deleted.getTime() + 30 * 24 * 60 * 60 * 1000;
  const remaining = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
};

export default function RecycleBin() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/trash`, { withCredentials: true });
      setDocs(res.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchTrash(); }, []);

  const restoreDocument = async (docId) => {
    try {
      await axios.post(`${API}/trash/${docId}/restore`, {}, { withCredentials: true });
      setDocs(prev => prev.filter(d => d.doc_id !== docId));
    } catch {}
  };

  const permanentDelete = async (docId) => {
    try {
      await axios.delete(`${API}/trash/${docId}`, { withCredentials: true });
      setDocs(prev => prev.filter(d => d.doc_id !== docId));
    } catch {}
  };

  const emptyTrash = async () => {
    try {
      await axios.delete(`${API}/trash`, { withCredentials: true });
      setDocs([]);
    } catch {}
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--zet-bg)' }}>
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b" style={{ background: 'var(--zet-bg)', borderColor: 'var(--zet-border)' }}>
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
        </button>
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" style={{ color: '#ef4444' }} />
          <h1 className="font-semibold text-sm" style={{ color: 'var(--zet-text)' }}>Çöp Kutusu</h1>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{docs.length}</span>
        </div>
        {docs.length > 0 && (
          <button onClick={emptyTrash} className="ml-auto text-xs px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all" style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>Tümünü Sil</button>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-xs mb-4" style={{ color: 'var(--zet-text-muted)' }}>Silinen belgeler 30 gün boyunca burada tutulur, ardından kalıcı olarak silinir.</p>
        {loading ? (
          <p className="text-sm text-center py-12" style={{ color: 'var(--zet-text-muted)' }}>Yükleniyor...</p>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <Trash2 className="h-8 w-8" style={{ color: 'var(--zet-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>Çöp kutusu boş</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {docs.map(doc => (
              <div key={doc.doc_id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--zet-text)' }}>{doc.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--zet-text-muted)' }}>
                    {formatTime(doc.deleted_at)} · <span style={{ color: '#f59e0b' }}>{daysRemaining(doc.deleted_at)} gün kaldı</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <button onClick={() => restoreDocument(doc.doc_id)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all" style={{ color: '#4ca8ad', border: '1px solid rgba(76,168,173,0.3)' }}>
                    <RotateCcw className="h-3 w-3" /> Geri Al
                  </button>
                  <button onClick={() => permanentDelete(doc.doc_id)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 transition-all" style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <X className="h-3 w-3" /> Kalıcı Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
