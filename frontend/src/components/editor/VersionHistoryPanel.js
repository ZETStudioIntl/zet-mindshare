import React, { useEffect, useState } from 'react';
import { History, RotateCcw } from 'lucide-react';
import { DraggablePanel } from './DraggablePanel';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatVersionTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const VersionHistoryPanel = ({ docId, onRestore, isMobile, onClose }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringIndex, setRestoringIndex] = useState(null);

  useEffect(() => {
    if (!docId) return;
    let cancelled = false;
    setLoading(true);
    axios.get(`${API}/documents/${docId}/history`, { withCredentials: true })
      .then(res => { if (!cancelled) setVersions(res.data || []); })
      .catch(() => { if (!cancelled) setVersions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [docId]);

  const handleRestore = async (index) => {
    if (!docId || restoringIndex !== null) return;
    setRestoringIndex(index);
    try {
      await axios.post(`${API}/documents/${docId}/restore/${index}`, {}, { withCredentials: true });
      onRestore?.();
    } catch {} finally {
      setRestoringIndex(null);
    }
  };

  return (
    <DraggablePanel title="Sürüm Geçmişi" onClose={onClose} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-72 max-h-96 overflow-y-auto space-y-1.5">
        {loading && (
          <p className="text-xs text-center py-4" style={{ color: 'var(--zet-text-muted)' }}>Yükleniyor...</p>
        )}
        {!loading && versions.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6">
            <History className="h-6 w-6" style={{ color: 'var(--zet-text-muted)' }} />
            <p className="text-xs text-center" style={{ color: 'var(--zet-text-muted)' }}>Henüz kayıtlı sürüm yok</p>
          </div>
        )}
        {!loading && versions.map((v, i) => (
          <div key={i} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg" style={{ background: 'var(--zet-bg-secondary)', border: '1px solid var(--zet-border)' }}>
            <span className="text-xs truncate" style={{ color: 'var(--zet-text)' }}>{formatVersionTime(v.saved_at)}</span>
            <button
              onClick={() => handleRestore(i)}
              disabled={restoringIndex !== null}
              className="zet-btn flex items-center gap-1 px-2 py-1 text-xs flex-shrink-0"
              title="Bu sürümü geri yükle"
            >
              <RotateCcw className="h-3 w-3" />
              {restoringIndex === i ? 'Geri yükleniyor...' : 'Geri Yükle'}
            </button>
          </div>
        ))}
      </div>
    </DraggablePanel>
  );
};

export default VersionHistoryPanel;
