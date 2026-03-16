import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Eye, Edit3, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function SharedView() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadSharedDocument();
  }, [shareId]);

  const loadSharedDocument = async () => {
    try {
      const res = await axios.get(`${API}/api/shared/${shareId}`);
      setData(res.data);
      // If user has edit permission and is logged in, redirect to editor
      if (res.data.permission === 'edit' && res.data.viewer?.user_id && !res.data.viewer.user_id.startsWith('guest_')) {
        navigate(`/editor/${res.data.document.doc_id}?collab=true`);
        return;
      }
    } catch (err) {
      setError(err.response?.status === 404 ? 'Paylasim linki bulunamadi' : err.response?.status === 410 ? 'Paylasim linkinin suresi dolmus' : 'Bir hata olustu');
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}>
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--zet-primary)' }} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}>
      <div className="text-center p-8 rounded-xl" style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)' }}>
        <div className="text-4xl mb-4">:(</div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--zet-text)' }}>{error}</h2>
        <button onClick={() => navigate('/')} className="zet-btn mt-4 px-4 py-2">Ana Sayfaya Don</button>
      </div>
    </div>
  );

  if (!data) return null;

  const { document: doc, permission, viewer } = data;
  const pages = doc.pages || [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--zet-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--zet-bg-card)', borderColor: 'var(--zet-border)' }}>
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5" style={{ color: 'var(--zet-primary)' }} />
          <h1 className="text-sm font-semibold" style={{ color: 'var(--zet-text)' }}>{doc.title || 'Untitled'}</h1>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ background: permission === 'edit' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: permission === 'edit' ? '#22c55e' : '#f59e0b' }}>
            {permission === 'edit' ? <Edit3 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {permission === 'edit' ? 'Duzenleme' : 'Goruntuleme'}
          </div>
        </div>
        <div className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>
          {viewer.name} olarak goruntuleniyor
        </div>
      </div>

      {/* Document view */}
      <div className="flex flex-col items-center py-6 gap-4 overflow-auto">
        {pages.map((page, idx) => (
          <div key={page.page_id || idx} className="shadow-xl relative" style={{ width: 794, minHeight: 1123, background: '#fff', padding: 40 }}>
            <div className="text-[10px] absolute -top-5 left-0" style={{ color: 'var(--zet-text-muted)' }}>Sayfa {idx + 1}</div>
            {(page.elements || []).map(el => (
              <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.width || 'auto' }}>
                {el.type === 'text' && (
                  <div style={{ fontSize: el.fontSize || 12, fontFamily: el.fontFamily || el.font || 'Georgia', color: el.color || '#000', fontWeight: el.bold ? 'bold' : 'normal', fontStyle: el.italic ? 'italic' : 'normal', textDecoration: el.underline ? 'underline' : 'none', textAlign: el.textAlign || 'left', lineHeight: el.lineHeight || 1.5 }}
                    dangerouslySetInnerHTML={{ __html: el.htmlContent || el.content || '' }} />
                )}
                {el.type === 'image' && el.src && <img src={el.src} alt="" style={{ width: el.width || 200, height: el.height || 200, objectFit: 'contain' }} />}
                {el.type === 'table' && el.tableData && (
                  <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
                    <tbody>
                      {el.tableData.map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td key={ci} style={{ border: '1px solid #333', padding: '2px 4px', minWidth: 60 }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
