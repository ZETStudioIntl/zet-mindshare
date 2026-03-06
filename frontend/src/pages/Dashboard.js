import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { 
  Search, Settings, Plus, FileText, StickyNote, LogOut, 
  Clock, Trash2, Cloud, Globe, X
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, notesRes] = await Promise.all([
        axios.get(`${API}/documents`, { withCredentials: true }),
        axios.get(`${API}/notes`, { withCredentials: true })
      ]);
      setDocuments(docsRes.data);
      setNotes(notesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    try {
      const res = await axios.post(`${API}/documents`, {
        title: 'Untitled Document',
        doc_type: 'document'
      }, { withCredentials: true });
      navigate(`/editor/${res.data.doc_id}`);
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const deleteDocument = async (docId) => {
    try {
      await axios.delete(`${API}/documents/${docId}`, { withCredentials: true });
      setDocuments(docs => docs.filter(d => d.doc_id !== docId));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const addQuickNote = async () => {
    if (!quickNote.trim()) return;
    try {
      const res = await axios.post(`${API}/notes`, { content: quickNote }, { withCredentials: true });
      setNotes([res.data, ...notes]);
      setQuickNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      await axios.delete(`${API}/notes/${noteId}`, { withCredentials: true });
      setNotes(notes => notes.filter(n => n.note_id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (hours < 1) return t('justNow');
    if (hours < 24) return `${hours}${t('hoursAgo')}`;
    return `${days}${t('daysAgo')}`;
  };

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNotes = notes.filter(n => 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--zet-primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--zet-bg)' }}>
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--zet-border)' }}>
        <div className="flex items-center gap-3">
          <img 
            src="https://customer-assets.emergentagent.com/job_unified-device-app-1/artifacts/92d5edoi_ZET%20M%C4%B0NDSHARE%20LOGO%20SVG_1.svg" 
            alt="ZET" 
            className="h-10 w-10"
          />
          <span className="text-xl font-semibold hidden sm:block" style={{ color: 'var(--zet-text)' }}>ZET Notes</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="tool-btn"
            data-testid="settings-btn"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Settings Dropdown */}
      {showSettings && (
        <div className="absolute right-4 top-16 zet-card p-4 z-50 min-w-[240px] animate-fadeIn" data-testid="settings-menu">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium" style={{ color: 'var(--zet-text)' }}>{t('settings')}</span>
            <button onClick={() => setShowSettings(false)} className="p-1 rounded hover:bg-white/10">
              <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 mb-4 pb-4 border-b" style={{ borderColor: 'var(--zet-border)' }}>
            <img src={user?.picture || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full" />
            <div>
              <p className="font-medium" style={{ color: 'var(--zet-text)' }}>{user?.name}</p>
              <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{user?.email}</p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="mb-4 pb-4 border-b" style={{ borderColor: 'var(--zet-border)' }}>
            <label className="flex items-center gap-2 mb-2" style={{ color: 'var(--zet-text-muted)' }}>
              <Globe className="h-4 w-4" /> {t('language')}
            </label>
            <div className="flex gap-2">
              <button 
                onClick={() => changeLanguage('en')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${language === 'en' ? 'glow-sm' : ''}`}
                style={{ 
                  background: language === 'en' ? 'var(--zet-primary)' : 'var(--zet-bg)',
                  color: 'var(--zet-text)'
                }}
              >
                English
              </button>
              <button 
                onClick={() => changeLanguage('tr')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${language === 'tr' ? 'glow-sm' : ''}`}
                style={{ 
                  background: language === 'tr' ? 'var(--zet-primary)' : 'var(--zet-bg)',
                  color: 'var(--zet-text)'
                }}
              >
                Türkçe
              </button>
            </div>
          </div>

          <button className="flex items-center gap-2 w-full p-2 rounded hover:bg-white/5 mb-2" style={{ color: 'var(--zet-text-muted)' }}>
            <Cloud className="h-4 w-4" /> {t('cloudStorage')}
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-white/5 text-red-400"
            data-testid="logout-btn"
          >
            <LogOut className="h-4 w-4" /> {t('logout')}
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
          <input
            type="text"
            placeholder={t('searchDocuments')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="zet-input pl-12"
            data-testid="search-input"
          />
        </div>

        {/* Documents/Notes Grid */}
        {activeTab === 'documents' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {/* New Document Card */}
            <button 
              onClick={createDocument}
              className="zet-card p-4 flex flex-col items-center justify-center min-h-[120px] hover:bg-white/5"
              data-testid="new-document-btn"
            >
              <Plus className="h-8 w-8 mb-2" style={{ color: 'var(--zet-primary-light)' }} />
              <span style={{ color: 'var(--zet-text-muted)' }}>{t('newDocument')}</span>
            </button>

            {/* Document Cards */}
            {filteredDocs.map(doc => (
              <div 
                key={doc.doc_id} 
                className="zet-card p-4 cursor-pointer group relative"
                onClick={() => navigate(`/editor/${doc.doc_id}`)}
                data-testid={`doc-card-${doc.doc_id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--zet-primary), var(--zet-primary-light))' }}>
                    <FileText className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteDocument(doc.doc_id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                    data-testid={`delete-doc-${doc.doc_id}`}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
                <h3 className="font-medium mb-1 truncate" style={{ color: 'var(--zet-text)' }}>{doc.title}</h3>
                <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>Document</p>
                <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: 'var(--zet-text-muted)' }}>
                  <Clock className="h-3 w-3" />
                  {formatTime(doc.updated_at || doc.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {filteredNotes.map(note => (
              <div 
                key={note.note_id} 
                className="zet-card p-4 flex items-start justify-between group"
                data-testid={`note-card-${note.note_id}`}
              >
                <div className="flex items-start gap-3">
                  <StickyNote className="h-5 w-5 mt-0.5" style={{ color: 'var(--zet-primary-light)' }} />
                  <div>
                    <p style={{ color: 'var(--zet-text)' }}>{note.content}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--zet-text-muted)' }}>{formatTime(note.created_at)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => deleteNote(note.note_id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                  data-testid={`delete-note-${note.note_id}`}
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>
            ))}
            {filteredNotes.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--zet-text-muted)' }}>
                {t('noNotesYet')}
              </div>
            )}
          </div>
        )}

        {/* Quick Note Input */}
        <div className="zet-card p-4 mb-20">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('quickNote')}
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addQuickNote()}
              className="zet-input flex-1"
              data-testid="quick-note-input"
            />
            <button 
              onClick={addQuickNote}
              className="zet-btn px-4"
              data-testid="add-note-btn"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Tabs */}
      <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: 'var(--zet-bg)' }}>
        <div className="max-w-md mx-auto zet-card p-1 flex">
          <button 
            onClick={() => setActiveTab('documents')}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${activeTab === 'documents' ? 'glow-sm' : ''}`}
            style={{ 
              background: activeTab === 'documents' ? 'linear-gradient(135deg, var(--zet-primary), var(--zet-primary-light))' : 'transparent',
              color: activeTab === 'documents' ? 'var(--zet-text)' : 'var(--zet-text-muted)'
            }}
            data-testid="tab-documents"
          >
            {t('documents')}
          </button>
          <button 
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${activeTab === 'notes' ? 'glow-sm' : ''}`}
            style={{ 
              background: activeTab === 'notes' ? 'linear-gradient(135deg, var(--zet-primary), var(--zet-primary-light))' : 'transparent',
              color: activeTab === 'notes' ? 'var(--zet-text)' : 'var(--zet-text-muted)'
            }}
            data-testid="tab-notes"
          >
            {t('notes')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
