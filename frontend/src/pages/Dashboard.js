import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { 
  Search, Settings, Plus, FileText, StickyNote, LogOut, 
  Clock, Trash2, Cloud, Globe, X, Keyboard, HardDrive, Link2, Check, Zap, CreditCard, ChevronLeft, ChevronRight,
  Bell, BellRing, Upload, FileEdit, Crown
} from 'lucide-react';
import { TOOLS, DEFAULT_SHORTCUTS } from '../lib/editorConstants';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Available languages
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

const PAGE_SIZES = [
  { name: 'A4', width: 595, height: 842 },
  { name: 'A5', width: 420, height: 595 },
  { name: 'Letter', width: 612, height: 792 },
  { name: 'Legal', width: 612, height: 1008 },
  { name: 'Square', width: 600, height: 600 },
];

const Dashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [noteReminder, setNoteReminder] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState('new'); // 'new' or 'pdf'
  const [pdfFile, setPdfFile] = useState(null);
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
  const [shortcutSearch, setShortcutSearch] = useState('');
  const [fastSelectSearch, setFastSelectSearch] = useState('');
  const [fastSelectTools, setFastSelectTools] = useState(() => {
    const saved = localStorage.getItem('zet_fast_select');
    return saved ? JSON.parse(saved) : ['text', 'hand', 'draw', 'image'];
  });
  const [showSubscription, setShowSubscription] = useState(false);
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [currentPlanIndex, setCurrentPlanIndex] = useState(2);
  const [userSubscription, setUserSubscription] = useState('free');
  const [subscribing, setSubscribing] = useState(false);

  // Fast select limits based on subscription
  const FAST_SELECT_LIMITS = { free: 3, plus: 5, pro: 8, ultra: 8 };
  const fastSelectLimit = FAST_SELECT_LIMITS[userSubscription] || 3;

  // Subscription plans data - ordered from biggest to smallest
  const SUBSCRIPTION_PLANS = [
    {
      id: 'ultra',
      name: 'Ultra',
      monthlyPrice: 39.99,
      yearlyPrice: 399.99,
      features: ['Sınırsız Depolama', '50 AI Görsel/gün', 'Tüm Şablonlar', '7/24 Destek', 'API Erişimi', 'Takım İşbirliği', 'White Label', 'ZET Judge Pro (12 temel + 5 derin/gün)', 'Fast Select: 8 araç'],
      color: '#f59e0b',
      recommended: false
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      features: ['25GB Depolama', '30 AI Görsel/gün', 'Tüm Şablonlar', 'Öncelikli Destek', 'Özel Fontlar', 'Filigransız', 'ZET Judge Mini (7 temel + 1 derin/gün)', 'Fast Select: 8 araç'],
      color: '#8b5cf6',
      recommended: true
    },
    {
      id: 'plus',
      name: 'Plus',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      features: ['5GB Depolama', '5 AI Görsel/gün', 'Temel Şablonlar', 'E-posta Desteği', 'ZET Judge Mini (3 temel/gün)', 'Fast Select: 5 araç'],
      color: '#3b82f6',
      recommended: false
    }
  ];

  // Notification helper function - defined before useEffects that use it
  const showNotification = useCallback((title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, { 
        body: message, 
        icon: '/logo192.png',
        tag: 'zet-reminder',
        requireInteraction: true
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } else {
      // Fallback to alert
      alert(`🔔 ${title}\n${message}`);
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
    }
  }, []);

  useEffect(() => {
    fetchData();
    checkDriveConnection();
    fetchSubscription();
    requestNotificationPermission();
    // Check if redirected from Drive OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get('drive_connected') === 'true') {
      setDriveConnected(true);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  // Check for due reminders every 30 seconds
  useEffect(() => {
    const checkReminders = async () => {
      try {
        const res = await axios.get(`${API}/notes/reminders`, { withCredentials: true });
        if (res.data && res.data.length > 0) {
          res.data.forEach(note => {
            showNotification('ZET Mindshare Hatırlatıcı', note.content);
            axios.put(`${API}/notes/${note.note_id}/reminder-sent`, {}, { withCredentials: true });
          });
        }
      } catch (err) { 
        console.log('Reminder check error:', err);
      }
    };
    const interval = setInterval(checkReminders, 30000);
    checkReminders(); // Check immediately on load
    return () => clearInterval(interval);
  }, [showNotification]);

  const fetchSubscription = async () => {
    try {
      const res = await axios.get(`${API}/subscription`, { withCredentials: true });
      setUserSubscription(res.data.plan || 'free');
    } catch { setUserSubscription('free'); }
  };

  const handleSubscribe = async (planId) => {
    setSubscribing(true);
    try {
      const res = await axios.post(`${API}/subscription`, { plan: planId, action: 'subscribe' }, { withCredentials: true });
      setUserSubscription(res.data.plan);
      setShowSubscription(false);
      alert(`${planId.toUpperCase()} planına başarıyla abone oldunuz! (Demo)`);
    } catch (err) {
      alert('Subscription failed');
    }
    setSubscribing(false);
  };

  const handleCancelSubscription = async () => {
    // Get features user will lose
    const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === userSubscription);
    const featuresList = currentPlan ? currentPlan.features.join('\n• ') : '';
    
    const confirmMsg = `⚠️ ABONELİK İPTALİ

Emin misiniz? ${userSubscription.toUpperCase()} planını iptal ettiğinizde şu özellikleri kaybedeceksiniz:

• ${featuresList}

Bu işlem geri alınabilir ancak şu anki faturalandırma döneminin sonuna kadar geçerlidir.

Devam etmek istiyor musunuz?`;
    
    if (!window.confirm(confirmMsg)) return;
    
    // Second confirmation
    const secondConfirm = window.confirm('Son kez onaylıyor musunuz?\n\nOnayladığınızda e-posta adresinize bir iptal onay linki gönderilecektir.');
    if (!secondConfirm) return;
    
    setSubscribing(true);
    try {
      const res = await axios.post(`${API}/subscription`, { plan: 'free', action: 'cancel' }, { withCredentials: true });
      if (res.data.cancel_pending) {
        alert('📧 İptal onay e-postası gönderildi!\n\nAboneliğinizi iptal etmek için e-postanızdaki linke tıklayın.');
      } else {
        setUserSubscription('free');
        const newTools = fastSelectTools.slice(0, 3);
        setFastSelectTools(newTools);
        localStorage.setItem('zet_fast_select', JSON.stringify(newTools));
        alert('Aboneliğiniz iptal edildi. FREE plana düştünüz.');
      }
    } catch (err) {
      alert('Cancel failed');
    }
    setSubscribing(false);
  };

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
      const payload = {
        title: title,
        doc_type: newDocType === 'pdf' ? 'pdf_edit' : 'document',
        pageSize: selectedPageSize
      };
      // If PDF file is selected, add file_data
      if (newDocType === 'pdf' && pdfFile) {
        payload.file_data = pdfFile;
      }
      const res = await axios.post(`${API}/documents`, payload, { withCredentials: true });
      setShowNewDoc(false);
      setNewDocTitle('');
      setNewDocType('new');
      setPdfFile(null);
      navigate(`/editor/${res.data.doc_id}`);
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPdfFile(ev.target.result);
        setNewDocTitle(file.name.replace('.pdf', ''));
      };
      reader.readAsDataURL(file);
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
      const res = await axios.post(`${API}/notes`, { 
        content: quickNote,
        reminder_time: noteReminder || null
      }, { withCredentials: true });
      setNotes([res.data, ...notes]);
      setQuickNote('');
      setNoteReminder('');
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
            <button 
              onClick={() => setShowLanguages(!showLanguages)}
              className="flex items-center justify-between w-full p-2 rounded hover:bg-white/5"
            >
              <span className="flex items-center gap-2" style={{ color: 'var(--zet-text-muted)' }}>
                <Globe className="h-4 w-4" /> {t('language') || 'Language'}
              </span>
              <span className="text-sm" style={{ color: 'var(--zet-text)' }}>
                {LANGUAGES.find(l => l.code === language)?.flag} {LANGUAGES.find(l => l.code === language)?.name}
              </span>
            </button>
            {showLanguages && (
              <div className="grid grid-cols-2 gap-1 mt-2 max-h-48 overflow-y-auto">
                {LANGUAGES.map(lang => (
                  <button 
                    key={lang.code}
                    onClick={() => { changeLanguage(lang.code); setShowLanguages(false); }}
                    className={`flex items-center gap-2 p-2 rounded text-sm transition-all ${language === lang.code ? 'ring-1 ring-blue-500' : 'hover:bg-white/5'}`}
                    style={{ background: language === lang.code ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}
                  >
                    <span>{lang.flag}</span>
                    <span className="truncate">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current Subscription Status */}
          <div className="mb-4 pb-4 border-b" style={{ borderColor: 'var(--zet-border)' }}>
            <div className="flex items-center justify-between p-2 rounded" style={{ background: userSubscription !== 'free' ? 'linear-gradient(135deg, #8b5cf620, #f59e0b20)' : 'var(--zet-bg)' }}>
              <div className="flex items-center gap-2">
                {userSubscription !== 'free' && <Crown className="h-4 w-4 text-yellow-500" />}
                <span style={{ color: 'var(--zet-text)' }}>{t('currentPlan') || 'Current Plan'}</span>
              </div>
              <span className="font-bold" style={{ 
                color: userSubscription === 'ultra' ? '#f59e0b' : 
                       userSubscription === 'pro' ? '#8b5cf6' : 
                       userSubscription === 'plus' ? '#3b82f6' : 'var(--zet-text-muted)'
              }}>
                {userSubscription.toUpperCase()}
              </span>
            </div>
            {userSubscription !== 'free' && (
              <button 
                onClick={handleCancelSubscription}
                disabled={subscribing}
                className="text-xs text-red-400 hover:text-red-300 mt-2 w-full text-center"
              >
                {t('cancelSubscription') || 'Cancel Subscription'}
              </button>
            )}
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
            <Zap className="h-4 w-4" /> {t('fastSelect') || 'Fast Select'} ({fastSelectTools.length}/{fastSelectLimit})
          </button>

          {/* Subscription */}
          <button 
            onClick={() => { setShowSubscription(true); setShowSettings(false); }}
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-white/5 mb-2" 
            style={{ color: 'var(--zet-primary-light)' }}
            data-testid="subscription-btn"
          >
            <CreditCard className="h-4 w-4" /> {t('subscription') || 'Subscription'}
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
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{formatTime(note.created_at)}</p>
                      {note.reminder_time && (
                        <span className="text-xs flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: note.reminder_sent ? 'var(--zet-bg)' : 'rgba(234, 179, 8, 0.2)', color: note.reminder_sent ? 'var(--zet-text-muted)' : '#eab308' }}>
                          {note.reminder_sent ? <Bell className="h-3 w-3" /> : <BellRing className="h-3 w-3" />}
                          {new Date(note.reminder_time).toLocaleString()}
                        </span>
                      )}
                    </div>
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
          <div className="flex gap-2 mb-2">
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
          {/* Reminder time input */}
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
            <input
              type="datetime-local"
              value={noteReminder}
              onChange={(e) => setNoteReminder(e.target.value)}
              className="zet-input flex-1 text-xs"
              style={{ background: 'var(--zet-bg)' }}
            />
            {noteReminder && (
              <button onClick={() => setNoteReminder('')} className="p-1 rounded hover:bg-white/10">
                <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--zet-text-muted)' }}>
            {t('setReminder') || 'Set a reminder to get notified'}
          </p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowNewDoc(false); setNewDocType('new'); setPdfFile(null); }}>
          <div className="zet-card p-6 max-w-md w-full mx-4 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--zet-text)' }}>{t('newDocument')}</h3>
              <button onClick={() => { setShowNewDoc(false); setNewDocType('new'); setPdfFile(null); }} className="p-1 rounded hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            
            {/* Document Type Selection */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => { setNewDocType('new'); setPdfFile(null); }}
                className={`p-4 rounded-lg text-center transition-all ${newDocType === 'new' ? 'ring-2 ring-blue-500' : ''}`}
                style={{ background: newDocType === 'new' ? 'var(--zet-primary)' : 'var(--zet-bg)' }}
              >
                <Plus className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--zet-text)' }} />
                <span className="block text-sm font-medium" style={{ color: 'var(--zet-text)' }}>{t('newDocument') || 'New Document'}</span>
              </button>
              <button
                onClick={() => setNewDocType('pdf')}
                className={`p-4 rounded-lg text-center transition-all ${newDocType === 'pdf' ? 'ring-2 ring-blue-500' : ''}`}
                style={{ background: newDocType === 'pdf' ? 'var(--zet-primary)' : 'var(--zet-bg)' }}
              >
                <FileEdit className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--zet-text)' }} />
                <span className="block text-sm font-medium" style={{ color: 'var(--zet-text)' }}>{t('editPDF') || 'Edit PDF'}</span>
              </button>
            </div>

            {/* PDF Upload (if PDF mode) */}
            {newDocType === 'pdf' && (
              <div className="mb-4">
                <label className="text-xs mb-2 block" style={{ color: 'var(--zet-text-muted)' }}>Select PDF File</label>
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-white/5 transition-all"
                  style={{ borderColor: pdfFile ? 'var(--zet-primary)' : 'var(--zet-border)' }}
                  onClick={() => document.getElementById('pdf-upload').click()}
                >
                  <input 
                    id="pdf-upload" 
                    type="file" 
                    accept=".pdf" 
                    className="hidden" 
                    onChange={handlePdfUpload} 
                  />
                  {pdfFile ? (
                    <div className="flex items-center justify-center gap-2" style={{ color: 'var(--zet-primary-light)' }}>
                      <Check className="h-5 w-5" />
                      <span>{newDocTitle}.pdf</span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--zet-text-muted)' }}>
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <span className="text-sm">{t('clickToUpload') || 'Click to upload PDF'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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

            {/* Page Size Selection (only for new documents) */}
            {newDocType === 'new' && (
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
            )}

            <button 
              onClick={createDocument} 
              disabled={newDocType === 'pdf' && !pdfFile}
              className="zet-btn w-full disabled:opacity-50"
            >
              {newDocType === 'pdf' ? (t('openPDF') || 'Open & Edit PDF') : 'Create Document'}
            </button>
          </div>
        </div>
      )}

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowShortcuts(false); setShortcutSearch(''); }}>
          <div className="zet-card p-6 max-w-md w-full mx-4 animate-fadeIn max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2" style={{ color: 'var(--zet-text)' }}>
                <Keyboard className="h-5 w-5" /> {t('shortcuts') || 'Keyboard Shortcuts'}
              </h3>
              <button onClick={() => { setShowShortcuts(false); setShortcutSearch(''); }} className="p-1 rounded hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
              <input
                placeholder="Search tools..."
                value={shortcutSearch}
                onChange={(e) => setShortcutSearch(e.target.value)}
                className="zet-input pl-9 w-full"
              />
            </div>
            
            <div className="overflow-y-auto max-h-[50vh] space-y-1">
              {TOOLS.filter(tool => 
                !shortcutSearch || 
                (t(tool.nameKey) || tool.nameKey).toLowerCase().includes(shortcutSearch.toLowerCase()) ||
                tool.id.toLowerCase().includes(shortcutSearch.toLowerCase())
              ).map(tool => {
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowFastSelect(false); setFastSelectSearch(''); }}>
          <div className="zet-card p-6 max-w-md w-full mx-4 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2" style={{ color: 'var(--zet-text)' }}>
                <Zap className="h-5 w-5" /> {t('fastSelect') || 'Fast Select'}
              </h3>
              <button onClick={() => { setShowFastSelect(false); setFastSelectSearch(''); }} className="p-1 rounded hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            
            <p className="text-sm mb-3" style={{ color: 'var(--zet-text-muted)' }}>
              {t('fastSelectDesc') || 'Select 4 favorite tools for quick access in the editor.'}
            </p>

            {/* Selected Tools */}
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

            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
              <input
                placeholder="Search tools..."
                value={fastSelectSearch}
                onChange={(e) => setFastSelectSearch(e.target.value)}
                className="zet-input pl-9 w-full"
              />
            </div>

            <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
              {TOOLS.filter(tool => 
                !fastSelectSearch || 
                (t(tool.nameKey) || tool.nameKey).toLowerCase().includes(fastSelectSearch.toLowerCase()) ||
                tool.id.toLowerCase().includes(fastSelectSearch.toLowerCase())
              ).map(tool => (
                <button
                  key={tool.id}
                  onClick={() => {
                    if (fastSelectTools.includes(tool.id)) {
                      const newTools = fastSelectTools.filter(t => t !== tool.id);
                      setFastSelectTools(newTools);
                      localStorage.setItem('zet_fast_select', JSON.stringify(newTools));
                    } else if (fastSelectTools.length < fastSelectLimit) {
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
              {fastSelectTools.length}/{fastSelectLimit} {t('selected') || 'selected'}
              {userSubscription === 'free' && <span className="ml-1 text-blue-400">({t('upgradePlan') || 'Upgrade for more'})</span>}
            </p>
          </div>
        </div>
      )}

      {/* Subscription Modal - Carousel */}
      {showSubscription && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSubscription(false)}>
          <div className="zet-card p-6 max-w-md w-full mx-4 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--zet-text)' }}>
                {t('choosePlan') || 'Choose Your Plan'}
              </h2>
              <button onClick={() => setShowSubscription(false)} className="p-2 rounded-lg hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-6">
              <div className="flex rounded-lg p-1" style={{ background: 'var(--zet-bg)' }}>
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'text-white' : ''}`}
                  style={{ background: billingCycle === 'monthly' ? 'var(--zet-primary)' : 'transparent', color: billingCycle === 'monthly' ? 'white' : 'var(--zet-text-muted)' }}
                >
                  {t('monthly') || 'Monthly'}
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${billingCycle === 'yearly' ? 'text-white' : ''}`}
                  style={{ background: billingCycle === 'yearly' ? 'var(--zet-primary)' : 'transparent', color: billingCycle === 'yearly' ? 'white' : 'var(--zet-text-muted)' }}
                >
                  {t('yearly') || 'Yearly'}
                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-500 text-white">-17%</span>
                </button>
              </div>
            </div>

            {/* Carousel */}
            <div className="relative">
              {/* Navigation Arrows */}
              <button 
                onClick={() => setCurrentPlanIndex(Math.max(0, currentPlanIndex - 1))}
                disabled={currentPlanIndex === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: 'var(--zet-bg-card)' }}
              >
                <ChevronLeft className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
              </button>
              <button 
                onClick={() => setCurrentPlanIndex(Math.min(SUBSCRIPTION_PLANS.length - 1, currentPlanIndex + 1))}
                disabled={currentPlanIndex === SUBSCRIPTION_PLANS.length - 1}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: 'var(--zet-bg-card)' }}
              >
                <ChevronRight className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
              </button>

              {/* Plan Card */}
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-300"
                  style={{ transform: `translateX(-${currentPlanIndex * 100}%)` }}
                >
                  {SUBSCRIPTION_PLANS.map((plan, idx) => {
                    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                    const period = billingCycle === 'monthly' ? '/mo' : '/yr';
                    return (
                      <div 
                        key={plan.id}
                        className="w-full flex-shrink-0 px-2"
                      >
                        <div 
                          className={`relative rounded-2xl p-6 transition-all ${plan.recommended ? 'ring-2' : ''}`}
                          style={{ 
                            background: `linear-gradient(135deg, ${plan.color}15 0%, ${plan.color}05 100%)`,
                            ringColor: plan.color,
                            border: `1px solid ${plan.color}30`
                          }}
                          data-testid={`plan-${plan.id}`}
                        >
                          {plan.recommended && (
                            <div 
                              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                              style={{ background: plan.color }}
                            >
                              {t('recommended') || 'RECOMMENDED'}
                            </div>
                          )}
                          
                          <div className="text-center mb-6 pt-2">
                            <h3 className="text-2xl font-bold mb-2" style={{ color: plan.color }}>
                              {plan.name}
                            </h3>
                            <div>
                              <span className="text-4xl font-bold" style={{ color: 'var(--zet-text)' }}>
                                ${price}
                              </span>
                              <span className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>
                                {period}
                              </span>
                            </div>
                            {billingCycle === 'yearly' && (
                              <p className="text-xs mt-1 text-green-400">
                                {t('saveYearly') || `Save $${((plan.monthlyPrice * 12) - plan.yearlyPrice).toFixed(2)}/year`}
                              </p>
                            )}
                          </div>
                          
                          <ul className="space-y-3 mb-6">
                            {plan.features.map((feature, fidx) => (
                              <li key={fidx} className="flex items-center gap-2 text-sm" style={{ color: 'var(--zet-text)' }}>
                                <Check className="h-4 w-4 flex-shrink-0" style={{ color: plan.color }} />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          
                          <button 
                            onClick={() => handleSubscribe(plan.id)}
                            disabled={subscribing || userSubscription === plan.id}
                            className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50"
                            style={{ 
                              background: userSubscription === plan.id ? 'var(--zet-bg)' : plan.color,
                              color: userSubscription === plan.id ? plan.color : 'white',
                              border: userSubscription === plan.id ? `2px solid ${plan.color}` : 'none'
                            }}
                            data-testid={`select-plan-${plan.id}`}
                          >
                            {userSubscription === plan.id ? (t('currentPlan') || 'Current Plan') : (t('selectPlan') || 'Select Plan')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {SUBSCRIPTION_PLANS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPlanIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${currentPlanIndex === idx ? 'w-6' : ''}`}
                    style={{ background: currentPlanIndex === idx ? SUBSCRIPTION_PLANS[idx].color : 'var(--zet-text-muted)' }}
                  />
                ))}
              </div>
            </div>
            
            <p className="text-center text-xs mt-4" style={{ color: 'var(--zet-text-muted)' }}>
              {t('subscriptionNote') || 'All plans include 7-day free trial. Cancel anytime.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
