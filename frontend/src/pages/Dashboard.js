import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { 
  Search, Settings, Plus, FileText, StickyNote, LogOut, 
  Clock, Trash2, Cloud, Globe, X, Keyboard, HardDrive, Link2, Check, Zap
} from 'lucide-react';
import { TOOLS, DEFAULT_SHORTCUTS } from '../lib/editorConstants';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PAGE_SIZES = [
  { name: 'A4', width: 595, height: 842 },
  { name: 'A5', width: 420, height: 595 },
  { name: 'Letter', width: 612, height: 792 },
  { name: 'Legal', width: 612, height: 1008 },
  { name: 'Square', width: 600, height: 600 },
];

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
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [selectedPageSize, setSelectedPageSize] = useState(PAGE_SIZES[0]);
  const [loading, setLoading] = useState(true);
  const [driveConnected, setDriveConnected] = useState(false);
  const [connectingDrive, setConnectingDrive] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showFastSelect, setShowFastSelect] = useState(false);
  const [shortcuts, setShortcuts] = useState(() => {
    const saved = localStorage.getItem('zet_shortcuts');
    return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
  });
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [fastSelectTools, setFastSelectTools] = useState(() => {
    const saved = localStorage.getItem('zet_fast_select');
    return saved ? JSON.parse(saved) : ['text', 'hand', 'draw', 'image'];
  });

  useEffect(() => {
    fetchData();
    checkDriveConnection();
    // Check if redirected from Drive OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get('drive_connected') === 'true') {
      setDriveConnected(true);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const checkDriveConnection = async () => {
    try {
      const res = await axios.get(`${API}/drive/status`, { withCredentials: true });
      setDriveConnected(res.data.connected);
    } catch { setDriveConnected(false); }
  };

  const connectGoogleDrive = async () => {
    setConnectingDrive(true);
    try {
      const res = await axios.get(`${API}/drive/connect`, { withCredentials: true });
      if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
      }
    } catch (err) {
      console.error('Failed to connect Drive:', err);
      setConnectingDrive(false);
    }
  };

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
    const title = newDocTitle.trim() || 'Untitled Document';
    try {
      const res = await axios.post(`${API}/documents`, {
        title: title,
        doc_type: 'document',
        pageSize: selectedPageSize
      }, { withCredentials: true });
      setShowNewDoc(false);
      setNewDocTitle('');
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
          <span className="text-xl font-semibold hidden sm:block" style={{ color: 'var(--zet-text)' }}>ZET Mindshare</span>
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

          {/* Google Drive Connection */}
          <div className="mb-4 pb-4 border-b" style={{ borderColor: 'var(--zet-border)' }}>
            <label className="flex items-center gap-2 mb-2" style={{ color: 'var(--zet-text-muted)' }}>
              <HardDrive className="h-4 w-4" /> Google Drive
            </label>
            {driveConnected ? (
              <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'var(--zet-bg)' }}>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">{t('connected') || 'Connected'}</span>
              </div>
            ) : (
              <button 
                onClick={connectGoogleDrive}
                disabled={connectingDrive}
                className="zet-btn w-full flex items-center justify-center gap-2 py-2"
              >
                <Link2 className="h-4 w-4" />
                {connectingDrive ? 'Connecting...' : (t('connectDrive') || 'Connect Drive')}
              </button>
            )}
          </div>

          {/* Shortcuts */}
          <button 
            onClick={() => { setShowShortcuts(true); setShowSettings(false); }}
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-white/5 mb-2" 
            style={{ color: 'var(--zet-text-muted)' }}
          >
            <Keyboard className="h-4 w-4" /> {t('shortcuts') || 'Shortcuts'}
          </button>

          {/* Fast Select */}
          <button 
            onClick={() => { setShowFastSelect(true); setShowSettings(false); }}
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-white/5 mb-2" 
            style={{ color: 'var(--zet-text-muted)' }}
          >
            <Zap className="h-4 w-4" /> {t('fastSelect') || 'Fast Select'}
          </button>

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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none" style={{ color: 'var(--zet-text-muted)' }} />
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
              onClick={() => setShowNewDoc(true)}
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
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <StickyNote className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--zet-primary-light)' }} />
                  <div className="min-w-0 flex-1">
                    <p className="break-words whitespace-pre-wrap" style={{ color: 'var(--zet-text)', wordBreak: 'break-word' }}>{note.content}</p>
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

      {/* New Document Modal */}
      {showNewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewDoc(false)}>
          <div className="zet-card p-6 max-w-sm w-full mx-4 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--zet-text)' }}>{t('newDocument')}</h3>
              <button onClick={() => setShowNewDoc(false)} className="p-1 rounded hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            
            {/* Document Title */}
            <div className="mb-4">
              <label className="text-xs mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Title</label>
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Untitled Document"
                className="zet-input"
                autoFocus
              />
            </div>

            {/* Page Size Selection */}
            <div className="mb-4">
              <label className="text-xs mb-2 block" style={{ color: 'var(--zet-text-muted)' }}>Page Size</label>
              <div className="grid grid-cols-2 gap-2">
                {PAGE_SIZES.map(size => (
                  <button
                    key={size.name}
                    onClick={() => setSelectedPageSize(size)}
                    className={`p-3 rounded-lg text-left ${selectedPageSize.name === size.name ? 'glow-sm' : ''}`}
                    style={{ 
                      background: selectedPageSize.name === size.name ? 'var(--zet-primary)' : 'var(--zet-bg)',
                      color: 'var(--zet-text)'
                    }}
                  >
                    <span className="block font-medium">{size.name}</span>
                    <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>
                      {size.width} × {size.height}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={createDocument} className="zet-btn w-full">
              Create Document
            </button>
          </div>
        </div>
      )}

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="zet-card p-6 max-w-md w-full mx-4 animate-fadeIn max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2" style={{ color: 'var(--zet-text)' }}>
                <Keyboard className="h-5 w-5" /> {t('shortcuts') || 'Keyboard Shortcuts'}
              </h3>
              <button onClick={() => setShowShortcuts(false)} className="p-1 rounded hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh] space-y-1">
              {TOOLS.map(tool => {
                const currentKey = Object.keys(shortcuts).find(k => shortcuts[k] === tool.id);
                return (
                  <div key={tool.id} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--zet-bg)' }}>
                    <div className="flex items-center gap-2">
                      <tool.icon className="h-4 w-4" style={{ color: 'var(--zet-text)' }} />
                      <span className="text-sm" style={{ color: 'var(--zet-text)' }}>{t(tool.nameKey) || tool.nameKey}</span>
                    </div>
                    {editingShortcut === tool.id ? (
                      <input 
                        autoFocus 
                        className="zet-input w-12 text-center text-xs font-mono" 
                        maxLength={1} 
                        onKeyDown={e => { 
                          if (e.key.length === 1) { 
                            const newShortcuts = { ...shortcuts };
                            Object.keys(newShortcuts).forEach(k => { if (newShortcuts[k] === tool.id) delete newShortcuts[k]; });
                            newShortcuts[e.key.toUpperCase()] = tool.id;
                            setShortcuts(newShortcuts);
                            localStorage.setItem('zet_shortcuts', JSON.stringify(newShortcuts));
                            setEditingShortcut(null);
                          } else if (e.key === 'Escape') setEditingShortcut(null); 
                        }} 
                        onBlur={() => setEditingShortcut(null)} 
                        placeholder="?" 
                      />
                    ) : (
                      <button 
                        onClick={() => setEditingShortcut(tool.id)} 
                        className="px-2 py-1 rounded text-xs font-mono" 
                        style={{ background: 'var(--zet-bg-card)', color: currentKey ? 'var(--zet-primary)' : 'var(--zet-text-muted)' }}
                      >
                        {currentKey || '—'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="pt-3 mt-3 border-t text-xs" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text-muted)' }}>
              <p>Click a key to edit. Press a new key to assign.</p>
              <p className="mt-1">Delete/Backspace: Delete selected</p>
              <p>Escape: Deselect</p>
            </div>
          </div>
        </div>
      )}

      {/* Fast Select Modal */}
      {showFastSelect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFastSelect(false)}>
          <div className="zet-card p-6 max-w-md w-full mx-4 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2" style={{ color: 'var(--zet-text)' }}>
                <Zap className="h-5 w-5" /> {t('fastSelect') || 'Fast Select'}
              </h3>
              <button onClick={() => setShowFastSelect(false)} className="p-1 rounded hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            
            <p className="text-sm mb-4" style={{ color: 'var(--zet-text-muted)' }}>
              {t('fastSelectDesc') || 'Select 4 favorite tools for quick access in the editor.'}
            </p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {fastSelectTools.map((toolId, idx) => {
                const tool = TOOLS.find(t => t.id === toolId);
                return (
                  <div key={idx} className="flex flex-col items-center p-3 rounded-lg" style={{ background: 'var(--zet-primary)', color: 'var(--zet-text)' }}>
                    {tool ? <tool.icon className="h-6 w-6 mb-1" /> : <Plus className="h-6 w-6 mb-1" />}
                    <span className="text-xs truncate w-full text-center">{tool ? (t(tool.nameKey) || tool.nameKey) : 'Empty'}</span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
              {TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => {
                    if (fastSelectTools.includes(tool.id)) {
                      const newTools = fastSelectTools.filter(t => t !== tool.id);
                      setFastSelectTools(newTools);
                      localStorage.setItem('zet_fast_select', JSON.stringify(newTools));
                    } else if (fastSelectTools.length < 4) {
                      const newTools = [...fastSelectTools, tool.id];
                      setFastSelectTools(newTools);
                      localStorage.setItem('zet_fast_select', JSON.stringify(newTools));
                    }
                  }}
                  className={`p-2 rounded flex flex-col items-center transition-all ${fastSelectTools.includes(tool.id) ? 'ring-2 ring-blue-500' : 'hover:bg-white/10'}`}
                  style={{ background: fastSelectTools.includes(tool.id) ? 'var(--zet-primary)' : 'var(--zet-bg)' }}
                  title={t(tool.nameKey) || tool.nameKey}
                >
                  <tool.icon className="h-4 w-4" style={{ color: 'var(--zet-text)' }} />
                </button>
              ))}
            </div>

            <p className="text-xs mt-3" style={{ color: 'var(--zet-text-muted)' }}>
              {fastSelectTools.length}/4 {t('selected') || 'selected'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
