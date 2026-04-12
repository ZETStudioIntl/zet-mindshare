import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import {
  Search, Settings, Plus, FileText, StickyNote, LogOut,
  Clock, Trash2, Cloud, Globe, X, Keyboard, HardDrive, Check, Zap, CreditCard, ChevronLeft, ChevronRight,
  Bell, BellRing, Upload, FileEdit, Sparkles, Scale, Award, Map, Star, Copy, User,
  MoreVertical, ArrowUp, ArrowDown, Pin, UserCheck
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

const ZetaIcon = ({ size = 14, color = '#4ca8ad' }) => (
  <svg width={size} height={size} viewBox="0 0 119.3 121.6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill={color} d="M100,121.7H.4v-35.6L77.3,28.1H3.6C3.6,12.6,14.1,0,27.2,0h92.4v30l-84,63.6h2.2l80.8.4v7.6c0,11.1-8.3,20.1-18.6,20.1h0Z"/>
  </svg>
);

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
  const [settingsTab, setSettingsTab] = useState('general');
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
  const [userSP, setUserSP] = useState(0);
  const [activeTimeSeconds, setActiveTimeSeconds] = useState(0);
  const [completedQuestCount, setCompletedQuestCount] = useState(0);
  const [showRankBadge, setShowRankBadge] = useState(() => localStorage.getItem('zet_show_rank') !== 'false');
  
  // New Settings states
  const [showAISettings, setShowAISettings] = useState(false);
  const [showRanks, setShowRanks] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [creditPackages, setCreditPackages] = useState([]);
  const [buyingCredits, setBuyingCredits] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [firedAlarms, setFiredAlarms] = useState([]);
  const [alarmTick, setAlarmTick] = useState(0);
  const [notebooks, setNotebooks] = useState([]);
  const [activeNotebook, setActiveNotebook] = useState(null);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [showNewNotebook, setShowNewNotebook] = useState(false);
  const [notebookNote, setNotebookNote] = useState('');
  const [notebookSearch, setNotebookSearch] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [openMenuNoteId, setOpenMenuNoteId] = useState(null);
  const [noteMenuPos, setNoteMenuPos] = useState({ top: 0, right: 0 });
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState(null);
  const [openMenuDocId, setOpenMenuDocId] = useState(null);
  const [docMenuPos, setDocMenuPos] = useState({ top: 0, right: 0 });
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState(null);
  const [confirmDeleteNotebookId, setConfirmDeleteNotebookId] = useState(null);
  const [renamingDocId, setRenamingDocId] = useState(null);
  const [renamingDocTitle, setRenamingDocTitle] = useState('');
  const [zetaDocAnalysis, setZetaDocAnalysis] = useState({ docId: null, loading: false, result: null });
  const [rankTab, setRankTab] = useState('requirements');
  const [zetaSearch, setZetaSearch] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type: 'success'|'error'|'info' }
  const [confirmModal, setConfirmModal] = useState(null); // { title, msg, onConfirm, danger }
  const showToast = (msg, type = 'info') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };
  const showConfirm = (title, msg, onConfirm, danger = false) => setConfirmModal({ title, msg, onConfirm, danger });
  const [zetaSearchQuery, setZetaSearchQuery] = useState('');
  const [zetaSearchLoading, setZetaSearchLoading] = useState(false);
  const [zetaSearchResults, setZetaSearchResults] = useState(null);
  const [zetaAnalysis, setZetaAnalysis] = useState({ noteId: null, loading: false, result: null });
  const [editName, setEditName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // AI Settings states (shared with Editor)
  const [zetaMood, setZetaMood] = useState(() => localStorage.getItem('zet_zeta_mood') || 'professional');
  const [zetaEmoji, setZetaEmoji] = useState(() => localStorage.getItem('zet_zeta_emoji') || 'medium');
  const [zetaCustomPrompt, setZetaCustomPrompt] = useState(() => localStorage.getItem('zet_zeta_custom') || '');
  const [judgeMood, setJudgeMood] = useState(() => localStorage.getItem('zet_judge_mood') || 'normal');

  // Rank system
  const RANKS = [
    { name: 'Demir',   xp: 0,     color: '#9ca3af', level: 1, next: 100   },
    { name: 'Gümüş',  xp: 100,   color: '#22c55e', level: 2, next: 500   },
    { name: 'Altın',  xp: 500,   color: '#3b82f6', level: 3, next: 1500  },
    { name: 'Elmas',  xp: 1500,  color: '#8b5cf6', level: 4, next: 5000  },
    { name: 'Zümrüt', xp: 5000,  color: '#f59e0b', level: 5, next: 15000 },
    { name: 'Endless', xp: 15000, color: '#ef4444', level: 6, next: null  },
  ];
  const getCurrentRank = (xp) => {
    let rank = RANKS[0];
    for (const r of RANKS) { if (xp >= r.xp) rank = r; }
    return rank;
  };
  const currentRank = getCurrentRank(userSP);
  const nextRank = RANKS.find(r => r.xp > userSP) || null;
  const rankProgress = nextRank
    ? Math.min(100, Math.round(((userSP - currentRank.xp) / (nextRank.xp - currentRank.xp)) * 100))
    : 100;

  // Fast select limits based on subscription
  const FAST_SELECT_LIMITS = { free: 3, plus: 5, pro: 8, ultra: 8 };
  const fastSelectLimit = FAST_SELECT_LIMITS[userSubscription] || 3;

  // Enforce FastSelect limit when plan changes (downgrade)
  useEffect(() => {
    const limit = FAST_SELECT_LIMITS[userSubscription] || 3;
    if (fastSelectTools.length > limit) {
      const trimmed = fastSelectTools.slice(0, limit);
      setFastSelectTools(trimmed);
      localStorage.setItem('zet_fast_select', JSON.stringify(trimmed));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSubscription, fastSelectTools.length]);

  // Subscription plans data - ordered from biggest to smallest
  const SP_PLAN_COSTS = { plus: 10000, pro: 30000, ultra: 50000 };
  const SUBSCRIPTION_PLANS = [
    {
      id: 'ultra',
      name: 'ZET Creative Station',
      monthlyPrice: 40,
      yearlyPrice: 400,
      spCost: 50000,
      features: [
        '1200 Kredi/gün',
        'ZETA Sınırsız',
        'ZET Judge Sınırsız (Derin Analiz dahil)',
        'Nano Banana Pro',
        'Tüm Görsel Boyutları (7 boyut)',
        'Katmanlar, İmza, Filigran, Sayfa Rengi, Grafikler',
        'Sınırsız Fast Select',
        '7/24 Öncelikli Destek + API Erişimi',
      ],
      color: '#f59e0b',
      recommended: false
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 25,
      yearlyPrice: 250,
      spCost: 30000,
      features: [
        '130 Kredi/gün',
        'ZETA Sınırsız',
        'ZET Judge 600 harf (Derin Analiz dahil)',
        'Nano Banana Pro',
        '7 Görsel Boyutu',
        'Katmanlar, İmza, Filigran, Sayfa Rengi, Grafikler',
        'Sınırsız Fast Select',
        'Öncelikli Destek',
      ],
      color: '#8b5cf6',
      recommended: true
    },
    {
      id: 'plus',
      name: 'Plus',
      monthlyPrice: 10,
      yearlyPrice: 100,
      spCost: 10000,
      features: [
        '40 Kredi/gün',
        'ZETA 500 harf',
        'ZET Judge Mini 200 harf (Derin Analiz yok)',
        '3 Görsel Boyutu (16:9, 9:16, 1:1)',
        'Katmanlar, Sayfa Rengi, Grafikler',
        'Sınırsız Fast Select',
        'E-posta Desteği',
      ],
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
      return;
    }
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
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
    if (params.get('showCredits') === 'true') {
      fetchCreditPackages();
      setShowCredits(true);
      window.history.replaceState({}, '', '/dashboard');
    }
    // Her 30sn notları yeniden çek (alarm kontrolü için)
    const fetchNotes = async () => {
      try {
        const res = await axios.get(`${API}/notes`, { withCredentials: true });
        setNotes(res.data);
      } catch {}
    };
    const interval = setInterval(fetchNotes, 30000);
    return () => clearInterval(interval);
  }, []);

  // Not menüsünü dışarı tıklayınca kapat
  useEffect(() => {
    const handler = () => setOpenMenuNoteId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Her 10sn tick at
  useEffect(() => {
    const i = setInterval(() => setAlarmTick(t => t + 1), 10000);
    return () => clearInterval(i);
  }, []);

  // Heartbeat global olarak App.js'de yönetilir.
  // activeTimeSeconds her 60sn'de sunucudan çekilir (canlı saat için)
  useEffect(() => {
    const refresh = () => {
      axios.get(`${API}/quests/progress`, { withCredentials: true })
        .then(res => {
          setActiveTimeSeconds(res.data.active_time_seconds || 0);
        }).catch(() => {});
    };
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, []);

  // notes veya tick değişince alarm kontrol et
  useEffect(() => {
    if (notes.length === 0) return;
    const now = new Date();
    const due = notes.filter(n => n.reminder_time && !n.reminder_sent && new Date(n.reminder_time) <= now);
    if (due.length === 0) return;
    setFiredAlarms(prev => {
      const existing = new Set(prev.map(a => a.note_id));
      return [...prev, ...due.filter(n => !existing.has(n.note_id))];
    });
    due.forEach(n => {
      setNotes(prev => prev.map(note => note.note_id === n.note_id ? { ...note, reminder_sent: true } : note));
      axios.put(`${API}/notes/${n.note_id}/reminder-sent`, {}, { withCredentials: true }).catch(() => {});
      // Browser / in-app notification
      showNotification('🔔 ZET Hatırlatıcı', n.content?.slice(0, 100) || 'Bir hatırlatıcınız var');
    });
  }, [notes, alarmTick]);

  const fetchSubscription = async () => {
    try {
      const res = await axios.get(`${API}/subscription`, { withCredentials: true });
      setUserSubscription(res.data.plan || 'free');
    } catch { setUserSubscription('free'); }
    try {
      const spRes = await axios.get(`${API}/quests/progress`, { withCredentials: true });
      setUserSP(spRes.data.quest_xp || 0);
      setActiveTimeSeconds(spRes.data.active_time_seconds || 0);
      setCompletedQuestCount((spRes.data.completed_quests || []).length);
    } catch { /* ignore */ }
  };

  const handleSubscribe = async (planId) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    showConfirm(
      'Abonelik Onayı',
      `${plan?.name || planId.toUpperCase()} planına abone olmak istiyor musunuz?`,
      async () => {
        setSubscribing(true);
        try {
          const res = await axios.post(`${API}/subscription`, { plan: planId, action: 'subscribe' }, { withCredentials: true });
          setUserSubscription(res.data.plan);
          showToast(`${plan?.name || planId.toUpperCase()} planına başarıyla abone oldunuz!`, 'success');
        } catch {
          showToast('Abonelik başarısız', 'error');
        }
        setSubscribing(false);
      }
    );
  };

  useEffect(() => {
    if (showSettings && settingsTab === 'credits' && creditPackages.length === 0) {
      fetchCreditPackages();
    }
  }, [showSettings, settingsTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCreditPackages = async () => {
    try {
      const res = await axios.get(`${API}/credits/packages`, { withCredentials: true });
      setCreditPackages(res.data.packages || []);
    } catch { /* ignore */ }
  };

  const handleBuyCredits = async (packageId) => {
    const pkg = creditPackages.find(p => p.id === packageId);
    if (!pkg) return;
    showConfirm(
      'Kredi Satın Al',
      `${pkg.credits} kredi satın almak istiyor musunuz?\nFiyat: $${pkg.discounted_price}`,
      async () => {
        setBuyingCredits(true);
        try {
          const res = await axios.post(`${API}/credits/buy`, { package_id: packageId }, { withCredentials: true });
          if (res.data.needs_confirmation) {
            showConfirm(
              'Kredi Limiti Aşılıyor',
              res.data.message + '\n\nDevam etmek istiyor musunuz?',
              async () => {
                const res2 = await axios.post(`${API}/credits/buy`, { package_id: packageId, confirm_overflow: true }, { withCredentials: true });
                showToast(res2.data.message, 'success');
                fetchSubscription();
              }
            );
          } else {
            showToast(res.data.message, 'success');
            fetchSubscription();
          }
        } catch (err) {
          showToast(err.response?.data?.detail || 'Satın alma başarısız', 'error');
        }
        setBuyingCredits(false);
      }
    );
  };


  const handleBuyWithSP = async (planId) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return;
    if (userSP < plan.spCost) {
      showToast(`Yetersiz SP! Gerekli: ${plan.spCost.toLocaleString()} SP, Mevcut: ${userSP.toLocaleString()} SP`, 'error');
      return;
    }
    showConfirm(
      'SP ile Satın Al',
      `${plan.spCost.toLocaleString()} SP harcayarak ${plan.name} planına yükselmek istiyor musunuz?\n\nMevcut SP: ${userSP.toLocaleString()}\nKalan SP: ${(userSP - plan.spCost).toLocaleString()}`,
      async () => {
        setSubscribing(true);
        try {
          const res = await axios.post(`${API}/subscription/buy-with-sp`, { plan: planId }, { withCredentials: true });
          setUserSubscription(res.data.plan);
          setUserSP(res.data.remaining_sp);
          showToast(`${plan.name} planına ${plan.spCost.toLocaleString()} SP ile yükseltildiniz!`, 'success');
        } catch (err) {
          showToast(err.response?.data?.detail || 'SP ile satın alma başarısız', 'error');
        }
        setSubscribing(false);
      }
    );
  };

  const handleCancelSubscription = async () => {
    const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === userSubscription);
    const featuresList = currentPlan ? currentPlan.features.slice(0, 4).join(', ') : '';
    showConfirm(
      '⚠️ Abonelik İptali',
      `${currentPlan?.name || userSubscription.toUpperCase()} planını iptal etmek istediğinizden emin misiniz?\n\nKaybedecekleriniz: ${featuresList}\n\nOnayladığınızda e-posta adresinize iptal onay linki gönderilecektir.`,
      async () => {
        setSubscribing(true);
        try {
          const res = await axios.post(`${API}/subscription`, { plan: 'free', action: 'cancel' }, { withCredentials: true });
          if (res.data.cancel_pending) {
            showToast('📧 İptal onay e-postası gönderildi! E-postanızdaki linke tıklayın.', 'info');
          } else {
            setUserSubscription('free');
            const newTools = fastSelectTools.slice(0, 3);
            setFastSelectTools(newTools);
            localStorage.setItem('zet_fast_select', JSON.stringify(newTools));
            showToast('Aboneliğiniz iptal edildi.', 'info');
          }
        } catch {
          showToast('İptal başarısız', 'error');
        }
        setSubscribing(false);
      },
      true // danger
    );
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
    try {
      const notebooksRes = await axios.get(`${API}/notebooks`, { withCredentials: true });
      setNotebooks(notebooksRes.data);
    } catch (error) {
      console.error('Error fetching notebooks:', error);
    }
  };

  const createNotebook = async () => {
    if (!newNotebookName.trim()) return;
    try {
      const res = await axios.post(`${API}/notebooks`, { name: newNotebookName }, { withCredentials: true });
      setNotebooks(prev => [res.data, ...prev]);
      setNewNotebookName('');
      setShowNewNotebook(false);
    } catch (error) {
      console.error('Error creating notebook:', error);
      showToast(error.response?.data?.detail || `Defter oluşturulamadı (${error.response?.status || 'bağlantı hatası'})`, 'error');
    }
  };

  const deleteNotebook = async (notebookId) => {
    try {
      await axios.delete(`${API}/notebooks/${notebookId}`, { withCredentials: true });
      setNotebooks(prev => prev.filter(n => n.notebook_id !== notebookId));
      setNotes(prev => prev.filter(n => n.notebook_id !== notebookId));
      if (activeNotebook?.notebook_id === notebookId) setActiveNotebook(null);
    } catch (error) {
      console.error('Error deleting notebook:', error);
    }
  };

  const pinNote = async (note) => {
    const newPinned = !note.pinned;
    try {
      await axios.put(`${API}/notes/${note.note_id}/pin`, { pinned: newPinned }, { withCredentials: true });
      setNotes(prev => prev.map(n => n.note_id === note.note_id ? { ...n, pinned: newPinned } : n));
    } catch (error) {
      console.error('Error pinning note:', error);
    }
  };

  const moveNote = (noteId, direction) => {
    setNotes(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(n => n.note_id === noteId);
      if (idx === -1) return prev;
      const [item] = arr.splice(idx, 1);
      if (direction === 'top') arr.unshift(item);
      else arr.push(item);
      return arr;
    });
  };

  const analyzeWithZeta = async (note) => {
    setZetaAnalysis({ noteId: note.note_id, loading: true, result: null });
    setOpenMenuNoteId(null);
    try {
      const res = await axios.post(`${API}/zeta/chat`, {
        message: `Bu notu kısaca özetle ve önemli noktaları belirt: "${note.content}"`
      }, { withCredentials: true });
      setZetaAnalysis({ noteId: note.note_id, loading: false, result: res.data.response });
    } catch (error) {
      setZetaAnalysis({ noteId: note.note_id, loading: false, result: 'Analiz başarısız oldu.' });
    }
  };

  const updateNote = async (noteId, newContent) => {
    if (!newContent.trim()) return;
    try {
      await axios.put(`${API}/notes/${noteId}`, { content: newContent }, { withCredentials: true });
      setNotes(prev => prev.map(n => n.note_id === noteId ? { ...n, content: newContent } : n));
      setEditingNoteId(null);
      setEditingNoteContent('');
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const addNoteToNotebook = async () => {
    if (!notebookNote.trim() || !activeNotebook) return;
    try {
      const res = await axios.post(`${API}/notes`, {
        content: notebookNote,
        notebook_id: activeNotebook.notebook_id
      }, { withCredentials: true });
      setNotes(prev => [res.data, ...prev]);
      setNotebookNote('');
    } catch (error) {
      console.error('Error adding note to notebook:', error);
    }
  };

  const createDocument = async () => {
    const title = newDocTitle.trim() || 'İsimsiz Belge';
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

  const renameDocument = async (docId, newTitle) => {
    if (!newTitle.trim()) return;
    try {
      await axios.put(`${API}/documents/${docId}`, { title: newTitle.trim() }, { withCredentials: true });
      setDocuments(docs => docs.map(d => d.doc_id === docId ? { ...d, title: newTitle.trim() } : d));
      setRenamingDocId(null);
      setRenamingDocTitle('');
    } catch (error) {
      console.error('Error renaming document:', error);
    }
  };

  const pinDocument = async (doc) => {
    const newPinned = !doc.pinned;
    try {
      await axios.put(`${API}/documents/${doc.doc_id}`, { pinned: newPinned }, { withCredentials: true });
      setDocuments(prev => {
        const updated = prev.map(d => d.doc_id === doc.doc_id ? { ...d, pinned: newPinned } : d);
        return [...updated].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
      });
    } catch (error) {
      console.error('Error pinning document:', error);
    }
    setOpenMenuDocId(null);
  };

  const analyzeDocWithZeta = async (doc) => {
    setZetaDocAnalysis({ docId: doc.doc_id, loading: true, result: null });
    setOpenMenuDocId(null);
    try {
      const res = await axios.get(`${API}/documents/${doc.doc_id}`, { withCredentials: true });
      const pages = res.data.pages || [];
      const text = pages.map(p => {
        const ops = p.content?.ops || [];
        return ops.map(op => (typeof op.insert === 'string' ? op.insert : '')).join('');
      }).join('\n').trim();
      if (!text) {
        setZetaDocAnalysis({ docId: doc.doc_id, loading: false, result: 'Belge boş.' });
        return;
      }
      const chatRes = await axios.post(`${API}/zeta/chat`, {
        message: `Bu belgeyi kısaca özetle ve önemli noktaları belirt:\n\n${text.slice(0, 3000)}`
      }, { withCredentials: true });
      setZetaDocAnalysis({ docId: doc.doc_id, loading: false, result: chatRes.data.response });
    } catch {
      setZetaDocAnalysis({ docId: doc.doc_id, loading: false, result: 'Analiz başarısız oldu.' });
    }
  };

  const handleZetaSearch = async () => {
    if (!zetaSearchQuery.trim()) return;
    setZetaSearchLoading(true);
    setZetaSearchResults(null);
    try {
      // Belgeler için içerik çek
      let context = '';
      if (activeTab === 'documents') {
        // Tüm belgelerin başlıklarını ver, içerik için top 5'i çek
        const titles = documents.map((d, i) => `[${i + 1}] "${d.title}" (id:${d.doc_id})`).join('\n');
        // İlgili belgelerin içeriğini çek (paralel, max 8)
        const topDocs = documents.slice(0, 8);
        const contents = await Promise.allSettled(
          topDocs.map(d => axios.get(`${API}/documents/${d.doc_id}`, { withCredentials: true }))
        );
        const docTexts = topDocs.map((d, i) => {
          const res = contents[i];
          if (res.status !== 'fulfilled') return '';
          const pages = res.value.data.pages || [];
          const text = pages.map(p => (p.content?.ops || []).map(op => typeof op.insert === 'string' ? op.insert : '').join('')).join(' ').trim().slice(0, 800);
          return `[${i + 1}] "${d.title}": ${text}`;
        }).filter(Boolean).join('\n\n');
        context = `Kullanıcının belgeleri:\n${docTexts}\n\nTüm belge başlıkları:\n${titles}`;
      } else {
        // Notlar
        const noteTexts = notes.slice(0, 30).map((n, i) => `[${i + 1}] "${n.content.slice(0, 200)}"`).join('\n');
        context = `Kullanıcının notları:\n${noteTexts}`;
      }
      const prompt = `Kullanıcı şunu arıyor: "${zetaSearchQuery}"\n\n${context}\n\nYukarıdaki ${activeTab === 'documents' ? 'belgeler' : 'notlar'} arasında bu aramayla en çok eşleşen ${activeTab === 'documents' ? 'belgeleri' : 'notları'} bul. Kısa ve net cevap ver, hangi ${activeTab === 'documents' ? 'belge' : 'not'} ve neden eşleştiğini söyle.`;
      const res = await axios.post(`${API}/zeta/chat`, { message: prompt }, { withCredentials: true });
      setZetaSearchResults(res.data.response);
    } catch {
      setZetaSearchResults('Arama sırasında bir hata oluştu.');
    }
    setZetaSearchLoading(false);
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

  const handleLogout = () => {
    showConfirm('Çıkış Yap', 'Oturumu kapatmak istediğinizden emin misiniz?', async () => {
      await logout();
      navigate('/login');
    });
  };

  const handleDeleteAccount = () => {
    showConfirm(
      'Hesabı Sil',
      'Hesabınızı silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz. Tüm notlarınız ve verileriniz kalıcı olarak silinecektir.',
      async () => {
        try {
          await axios.post(`${API}/auth/delete-account/request`, {}, { withCredentials: true });
          showToast('Onay e-postası gönderildi. E-postanızdaki bağlantıya tıklayın.', 'info');
        } catch {
          showToast('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
        }
      },
      true // danger
    );
  };

  const visibleNotes = [...notes.filter(n => !n.notebook_id && (!searchQuery || n.content.toLowerCase().includes(searchQuery.toLowerCase())))]
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const NOTE_MENU = (note) => {
    const idx = visibleNotes.findIndex(n => n.note_id === note.note_id);
    const isFirst = idx === 0;
    const isLast = idx === visibleNotes.length - 1;
    return [
      { icon: <Trash2 className="h-4 w-4" />, label: t('noteMenuDelete'), color: '#ef4444', action: () => { setConfirmDeleteNoteId(note.note_id); setOpenMenuNoteId(null); } },
      { icon: <FileEdit className="h-4 w-4" />, label: t('noteMenuEdit'), action: () => { setEditingNoteId(note.note_id); setEditingNoteContent(note.content); setOpenMenuNoteId(null); } },
      { icon: <Copy className="h-4 w-4" />, label: t('noteMenuCopy'), action: () => { navigator.clipboard.writeText(note.content); setOpenMenuNoteId(null); } },
      { icon: <ArrowDown className="h-4 w-4" />, label: t('noteMenuSendDown'), disabled: isLast, action: () => { if (!isLast) { moveNote(note.note_id, 'bottom'); setOpenMenuNoteId(null); } } },
      { icon: <ZetaIcon size={14} color="#4ca8ad" />, label: t('zetaSummary'), action: () => analyzeWithZeta(note) },
      { icon: <ArrowUp className="h-4 w-4" />, label: t('noteMenuSendUp'), disabled: isFirst, action: () => { if (!isFirst) { moveNote(note.note_id, 'top'); setOpenMenuNoteId(null); } } },
      { icon: <Pin className="h-4 w-4" style={{ color: note.pinned ? '#f59e0b' : 'inherit' }} />, label: note.pinned ? t('noteMenuUnpin') : t('noteMenuPin'), action: () => { pinNote(note); setOpenMenuNoteId(null); } },
    ];
  };

  const renderNoteCard = (note) => (
    <div
      key={note.note_id}
      className="zet-card p-4"
      style={{ border: note.pinned ? '1px solid rgba(245,158,11,0.4)' : undefined }}
      data-testid={`note-card-${note.note_id}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 relative">
          <StickyNote className="h-5 w-5" style={{ color: 'var(--zet-primary-light)' }} />
          {note.pinned && <Pin className="h-3 w-3 absolute -top-1 -right-1" style={{ color: '#f59e0b' }} />}
        </div>
        <div className="min-w-0 flex-1">
          {editingNoteId === note.note_id ? (
            <div className="flex gap-2">
              <input
                className="zet-input flex-1 text-sm"
                value={editingNoteContent}
                onChange={(e) => setEditingNoteContent(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') updateNote(note.note_id, editingNoteContent); if (e.key === 'Escape') { setEditingNoteId(null); setEditingNoteContent(''); } }}
                autoFocus
              />
              <button onClick={() => updateNote(note.note_id, editingNoteContent)} className="p-1 rounded hover:bg-white/10">
                <Check className="h-4 w-4" style={{ color: '#22c55e' }} />
              </button>
              <button onClick={() => { setEditingNoteId(null); setEditingNoteContent(''); }} className="p-1 rounded hover:bg-white/10">
                <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
          ) : (
            <p className="break-words whitespace-pre-wrap" style={{ color: 'var(--zet-text)', wordBreak: 'break-word' }}>{note.content}</p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{formatTime(note.created_at)}</p>
            {note.reminder_time && (
              <span className="text-xs flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: note.reminder_sent ? 'var(--zet-bg)' : 'rgba(234,179,8,0.2)', color: note.reminder_sent ? 'var(--zet-text-muted)' : '#eab308' }}>
                {note.reminder_sent ? <Bell className="h-3 w-3" /> : <BellRing className="h-3 w-3" />}
                {new Date(note.reminder_time).toLocaleString()}
              </span>
            )}
          </div>
          {zetaAnalysis.noteId === note.note_id && (
            <div className="mt-2 p-3 rounded-lg text-sm" style={{ background: 'rgba(76,168,173,0.1)', border: '1px solid rgba(76,168,173,0.3)' }}>
              {zetaAnalysis.loading ? (
                <div className="flex items-center gap-2" style={{ color: 'var(--zet-text-muted)' }}>
                  <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4ca8ad', borderTopColor: 'transparent' }} />
                  {t('analyzing')}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#4ca8ad' }}><ZetaIcon size={12} color="#4ca8ad" /> {t('zetaSummary')}</span>
                    <button onClick={() => setZetaAnalysis({ noteId: null, loading: false, result: null })} className="p-0.5 rounded hover:bg-white/10">
                      <X className="h-3 w-3" style={{ color: 'var(--zet-text-muted)' }} />
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap break-words" style={{ color: 'var(--zet-text)' }}>{zetaAnalysis.result}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setNoteMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right }); setOpenMenuNoteId(openMenuNoteId === note.note_id ? null : note.note_id); }}
            className="p-1 rounded hover:bg-white/10 transition-all"
            style={{ color: 'var(--zet-text-muted)' }}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {openMenuNoteId === note.note_id && (
            <div
              className="fixed z-50 py-1 rounded-xl min-w-[168px] animate-fadeIn"
              style={{ top: noteMenuPos.top, right: noteMenuPos.right, background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {NOTE_MENU(note).map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  disabled={item.disabled}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-all text-left"
                  style={{
                    color: item.disabled ? 'var(--zet-text-muted)' : (item.color || 'var(--zet-text)'),
                    opacity: item.disabled ? 0.4 : 1,
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--zet-primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--zet-bg)' }}>
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--zet-border)' }}>
        <div className="flex items-center gap-3">
          <img 
            src="/logo.svg" 
            alt="ZET" 
            className="h-10 w-10"
          />
          <span className="text-xl font-semibold hidden sm:block" style={{ color: 'var(--zet-text)' }}>ZET Mindshare</span>
          {showRankBadge && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${currentRank.color}25`, color: currentRank.color, border: `1px solid ${currentRank.color}50` }} data-testid="header-rank-badge">
              <Award className="h-3 w-3" /> {currentRank.name}
            </span>
          )}
          {user?.name && (
            <span className="hidden sm:block" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.25rem', fontWeight: 700, color: '#4ca8ad', letterSpacing: '0.01em' }}>
              Merhaba, {user.name.split(' ')[0]} 👋
            </span>
          )}
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
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--zet-bg)' }} data-testid="settings-menu">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--zet-border)' }}>
            <button onClick={() => setShowSettings(false)} className="p-2 rounded-lg hover:bg-white/10 transition-all mr-2" style={{ color: 'var(--zet-text-muted)' }}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-xl font-bold" style={{ color: 'var(--zet-text)' }}>{t('settings')}</span>
          </div>

          {/* Body: sidebar + content */}
          <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <div className="w-56 flex-shrink-0 border-r overflow-y-auto py-4 px-3" style={{ borderColor: 'var(--zet-border)' }}>
              {/* Profil özeti */}
              <div className="flex items-center gap-3 px-3 pb-4 mb-2 border-b" style={{ borderColor: 'var(--zet-border)' }}>
                <img src={user?.picture || 'https://via.placeholder.com/36'} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--zet-text)' }}>{user?.name}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${currentRank.color}25`, color: currentRank.color }}>
                    {currentRank.name}
                  </span>
                </div>
              </div>

              {[
                { id: 'general',      icon: <User className="h-4 w-4" />,       label: t('general') },
                { id: 'profile',      icon: <UserCheck className="h-4 w-4" />,  label: t('profile') },
                { id: 'ai',           icon: <Sparkles className="h-4 w-4" />,   label: t('aiSettings'),    color: '#4ca8ad' },
                { id: 'ranks',        icon: <Award className="h-4 w-4" />,      label: t('ranks'),         color: '#f59e0b' },
                { id: 'quests',       icon: <Map className="h-4 w-4" />,        label: t('questMap'),      color: '#4ca8ad' },
                { id: 'subscription', icon: <CreditCard className="h-4 w-4" />, label: t('subscription'),  color: 'var(--zet-primary-light)' },
                { id: 'credits',      icon: <Zap className="h-4 w-4" />,        label: t('buyCredits'),    color: '#fbbf24' },
                { id: 'shortcuts',    icon: <Keyboard className="h-4 w-4" />,   label: t('shortcuts') },
                { id: 'fastselect',   icon: <Star className="h-4 w-4" />,       label: 'Fast Select' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { if (item.id === 'quests') { navigate('/quest-map'); setShowSettings(false); } else setSettingsTab(item.id); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all"
                  style={{
                    background: settingsTab === item.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: settingsTab === item.id ? (item.color || 'var(--zet-text)') : (item.color || 'var(--zet-text-muted)'),
                    fontWeight: settingsTab === item.id ? 600 : 400,
                  }}
                >
                  {item.icon} {item.label}
                </button>
              ))}

              {/* Çıkış */}
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--zet-border)' }}>
                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all" data-testid="logout-btn">
                  <LogOut className="h-4 w-4" /> {t('logoutBtn')}
                </button>
                <button onClick={handleDeleteAccount} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-500/10 transition-all mt-0.5">
                  <Trash2 className="h-4 w-4" /> Hesabı Sil
                </button>
              </div>
            </div>

            {/* Right content */}
            <div className="flex-1 overflow-y-auto p-8">

              {settingsTab === 'general' && (
                <div className="max-w-lg">
                  <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--zet-text)' }}>{t('general')}</h2>

                  {/* Profil */}
                  <div className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--zet-text-muted)' }}>{t('profile')}</p>
                    <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--zet-bg-card)' }}>
                      <img src={user?.picture || 'https://via.placeholder.com/56'} alt="" className="w-14 h-14 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" style={{ color: 'var(--zet-text)' }}>{user?.name}</p>
                        <p className="text-sm truncate" style={{ color: 'var(--zet-text-muted)' }}>{user?.email}</p>
                      </div>
                      <button
                        onClick={() => { setEditName(user?.name || ''); setSettingsTab('profile'); }}
                        className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-all flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--zet-text)' }}
                        data-testid="profile-edit-btn"
                      >
                        {t('edit')}
                      </button>
                    </div>
                  </div>

                  {/* Dil */}
                  <div className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--zet-text-muted)' }}>{t('language')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className="flex items-center gap-2 p-3 rounded-xl text-sm transition-all"
                          style={{ background: language === lang.code ? 'var(--zet-primary)' : 'var(--zet-bg-card)', color: 'var(--zet-text)', border: language === lang.code ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent' }}
                        >
                          <span>{lang.flag}</span><span>{lang.name}</span>
                          {language === lang.code && <Check className="h-3 w-3 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Plan */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--zet-text-muted)' }}>{t('plan')}</p>
                    <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'var(--zet-bg-card)' }}>
                      <span style={{ color: 'var(--zet-text)' }}>{t('currentPlan')}</span>
                      <span className="font-bold text-lg" style={{ color: userSubscription === 'ultra' ? '#f59e0b' : userSubscription === 'pro' ? '#8b5cf6' : userSubscription === 'plus' ? '#3b82f6' : 'var(--zet-text-muted)' }}>
                        {userSubscription === 'ultra' ? 'ZET Creative Station' : userSubscription === 'free' ? 'Ücretsiz' : userSubscription.charAt(0).toUpperCase() + userSubscription.slice(1)}
                      </span>
                    </div>
                    {userSubscription !== 'free' && (
                      <button onClick={handleCancelSubscription} disabled={subscribing} className="mt-2 text-sm text-red-400 hover:text-red-300 w-full text-center py-2">
                        {t('cancelSubscription')}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {settingsTab === 'profile' && (
                <div className="max-w-md">
                  <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--zet-text)' }}>{t('profile')}</h2>
                  <div className="space-y-6">
                    {/* Fotoğraf */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative group">
                        <img
                          src={profilePhotoPreview || user?.picture || 'https://via.placeholder.com/96'}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-2"
                          style={{ borderColor: 'var(--zet-primary)' }}
                        />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload className="h-6 w-6 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setProfilePhoto(file);
                                setProfilePhotoPreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                        </label>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Fotoğrafı değiştirmek için tıklayın</span>
                    </div>
                    {/* İsim */}
                    <div>
                      <label className="text-sm block mb-1" style={{ color: 'var(--zet-text-muted)' }}>İsim</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="zet-input w-full"
                        placeholder="Adınız"
                      />
                    </div>
                    {/* E-posta değiştir */}
                    <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--zet-bg-card)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium" style={{ color: 'var(--zet-text)' }}>E-posta</label>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(76,168,173,0.15)', color: '#4ca8ad' }}>Mevcut: {user?.email}</span>
                      </div>
                      {emailSent ? (
                        <p className="text-sm text-green-400">✅ Onay e-postası gönderildi. Gelen kutunuzu kontrol edin.</p>
                      ) : (
                        <>
                          <input
                            type="email"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            className="zet-input w-full"
                            placeholder="Yeni e-posta adresi"
                          />
                          <button
                            disabled={emailSending || !newEmail || newEmail === user?.email}
                            onClick={async () => {
                              setEmailSending(true);
                              try {
                                await axios.post(`${API}/auth/change-email/request`, { new_email: newEmail }, { withCredentials: true });
                                setEmailSent(true);
                              } catch (err) {
                                showToast(err.response?.data?.detail || 'Bir hata oluştu', 'error');
                              }
                              setEmailSending(false);
                            }}
                            className="w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                            style={{ background: 'var(--zet-primary)', color: '#fff' }}
                          >
                            {emailSending ? 'Gönderiliyor...' : 'Onay E-postası Gönder'}
                          </button>
                        </>
                      )}
                    </div>
                    {/* Kaydet */}
                    <button
                      disabled={uploadingPhoto}
                      onClick={async () => {
                        setUploadingPhoto(true);
                        try {
                          let pictureUrl = user?.picture;
                          if (profilePhoto) {
                            const reader = new FileReader();
                            const base64 = await new Promise((resolve) => {
                              reader.onload = (ev) => resolve(ev.target.result);
                              reader.readAsDataURL(profilePhoto);
                            });
                            const photoRes = await axios.post(`${API}/auth/profile-picture`, { image_data: base64 }, { withCredentials: true });
                            pictureUrl = photoRes.data.picture_url;
                          }
                          await axios.put(`${API}/auth/profile`, { name: editName }, { withCredentials: true });
                          if (updateUser) updateUser({ ...user, name: editName, picture: pictureUrl });
                          setProfilePhoto(null);
                          setProfilePhotoPreview(null);
                          showToast('Profil güncellendi!', 'success');
                        } catch {
                          showToast('Güncelleme başarısız', 'error');
                        }
                        setUploadingPhoto(false);
                      }}
                      className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
                      style={{ background: 'var(--zet-primary)' }}
                    >
                      {uploadingPhoto ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'ai' && (
                <div className="max-w-lg">
                  <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--zet-text)' }}>{t('aiSettings')}</h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(76, 168, 173, 0.1)', border: '1px solid rgba(76, 168, 173, 0.3)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-5 w-5" style={{ color: '#4ca8ad' }} />
                        <h3 className="font-semibold" style={{ color: '#4ca8ad' }}>ZETA Özelleştirme</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Mod</label>
                          <select value={zetaMood} onChange={e => { setZetaMood(e.target.value); localStorage.setItem('zet_zeta_mood', e.target.value); }} className="zet-input text-sm w-full">
                            <option value="cheerful">🎉 Neşeli</option>
                            <option value="professional">💼 Profesyonel</option>
                            <option value="curious">🔍 Meraklı</option>
                            <option value="custom">✨ Özel</option>
                          </select>
                        </div>
                        {zetaMood === 'custom' && (
                          <div>
                            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Özel Prompt</label>
                            <textarea value={zetaCustomPrompt} onChange={e => { setZetaCustomPrompt(e.target.value); localStorage.setItem('zet_zeta_custom', e.target.value); }} placeholder="ZETA nasıl davransın?" className="zet-input text-sm w-full h-20 resize-none" />
                          </div>
                        )}
                        <div>
                          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Emoji Kullanımı</label>
                          <select value={zetaEmoji} onChange={e => { setZetaEmoji(e.target.value); localStorage.setItem('zet_zeta_emoji', e.target.value); }} className="zet-input text-sm w-full">
                            <option value="none">❌ Kullanma</option>
                            <option value="low">📍 Az Kullan</option>
                            <option value="medium">📌 Orta</option>
                            <option value="high">🎯 Çok Kullan</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(200, 0, 90, 0.1)', border: '1px solid rgba(200, 0, 90, 0.3)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Scale className="h-5 w-5" style={{ color: '#c8005a' }} />
                        <h3 className="font-semibold" style={{ color: '#c8005a' }}>ZET Judge Mini Özelleştirme</h3>
                      </div>
                      <div>
                        <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Mod</label>
                        <select value={judgeMood} onChange={e => { setJudgeMood(e.target.value); localStorage.setItem('zet_judge_mood', e.target.value); }} className="zet-input text-sm w-full">
                          <option value="normal">⚖️ Normal (Yapıcı eleştiri)</option>
                          <option value="harsh">🔥 Sert (Esprili dalga geçme)</option>
                        </select>
                        <p className="text-xs mt-2" style={{ color: 'var(--zet-text-muted)' }}>
                          {judgeMood === 'harsh' ? '😈 Judge sizi esprilerle "kavuracak"!' : '🤝 Judge yapıcı ve profesyonel olacak.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'ranks' && (() => {
                const RANK_REQUIREMENTS = {
                  'Gümüş':  { hours: 10,  quests: 70 },
                  'Altın':  { hours: 25,  quests: 130 },
                  'Elmas':  { hours: 60,  quests: 200 },
                  'Zümrüt': { hours: 90,  quests: 300 },
                  'Endless':{ hours: 200, quests: 500 },
                };
                const RANK_REWARDS = {
                  'Demir':   { credits: 30,   sp: 50   },
                  'Gümüş':   { credits: 200,  sp: 400  },
                  'Altın':   { credits: 500,  sp: 1000 },
                  'Elmas':   { credits: 800,  sp: 1600 },
                  'Zümrüt':  { credits: 1000, sp: 2400 },
                  'Endless': { credits: 2000, sp: 3000 },
                };
                const activeHours = activeTimeSeconds / 3600;
                return (
                <div className="max-w-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--zet-text)' }}>{t('ranks')}</h2>
                    <button
                      onClick={() => {
                        const next = !showRankBadge;
                        setShowRankBadge(next);
                        localStorage.setItem('zet_show_rank', String(next));
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: showRankBadge ? `${currentRank.color}20` : 'rgba(255,255,255,0.06)', color: showRankBadge ? currentRank.color : 'var(--zet-text-muted)', border: `1px solid ${showRankBadge ? currentRank.color + '40' : 'transparent'}` }}
                    >
                      <Award className="h-3 w-3" />
                      {showRankBadge ? 'Profilde göster ✓' : 'Profilde gizle'}
                    </button>
                  </div>

                  {/* Tab buttons */}
                  <div className="flex gap-2 mb-5">
                    {['requirements', 'rewards'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setRankTab(tab)}
                        className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: rankTab === tab ? 'var(--zet-primary)' : 'var(--zet-bg-card)',
                          color: rankTab === tab ? 'white' : 'var(--zet-text-muted)',
                          border: rankTab === tab ? 'none' : '1px solid var(--zet-border)',
                        }}
                      >
                        {tab === 'requirements' ? 'Gereksinimler' : 'Ödüller'}
                      </button>
                    ))}
                  </div>

                  {rankTab === 'requirements' ? (
                    <div className="space-y-3">
                      {RANKS.map(r => {
                        const req = RANK_REQUIREMENTS[r.name];
                        const isCurrent = currentRank.name === r.name;
                        return (
                        <div key={r.name} className="p-4 rounded-xl" style={{ background: 'var(--zet-bg-card)', border: isCurrent ? `1px solid ${r.color}60` : '1px solid transparent' }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: r.color }} />
                              <span className="font-medium" style={{ color: r.color }}>{r.name}</span>
                              {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${r.color}20`, color: r.color }}>{t('currentBadge')}</span>}
                            </div>
                            <span className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{r.xp.toLocaleString()} XP</span>
                          </div>
                          {req ? (
                            <div className="mt-2 space-y-1.5">
                              <div>
                                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--zet-text-muted)' }}>
                                  <span>⏱ {Math.floor(activeHours)}h / {req.hours}h</span>
                                  <span>{Math.min(100, Math.round((activeHours / req.hours) * 100))}%</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (activeHours / req.hours) * 100)}%`, background: activeHours >= req.hours ? r.color : 'rgba(255,255,255,0.3)' }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--zet-text-muted)' }}>
                                  <span>🎯 {completedQuestCount} / {req.quests} {t('questMap')}</span>
                                  <span>{Math.min(100, Math.round((completedQuestCount / req.quests) * 100))}%</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (completedQuestCount / req.quests) * 100)}%`, background: completedQuestCount >= req.quests ? r.color : 'rgba(255,255,255,0.3)' }} />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs mt-1" style={{ color: 'var(--zet-text-muted)' }}>Başlangıç rankı — gereksinim yok</p>
                          )}
                        </div>
                      );})}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl text-xs mb-2" style={{ background: 'rgba(76,168,173,0.1)', border: '1px solid rgba(76,168,173,0.3)', color: 'var(--zet-text-muted)' }}>
                        🏆 Ödüller <strong style={{ color: 'var(--zet-text)' }}>sezon sonunda</strong> verilir. Sezon bittiğinde hangi rankta olursan o rankın ödülünü alırsın. Rank kredileri <strong style={{ color: 'var(--zet-text)' }}>1 ay</strong> boyunca geçerlidir.
                      </div>
                      {RANKS.map(r => {
                        const reward = RANK_REWARDS[r.name];
                        const isCurrent = currentRank.name === r.name;
                        return (
                        <div key={r.name} className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'var(--zet-bg-card)', border: isCurrent ? `1px solid ${r.color}60` : '1px solid transparent' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: r.color }} />
                            <span className="font-medium" style={{ color: r.color }}>{r.name}</span>
                            {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${r.color}20`, color: r.color }}>{t('currentBadge')}</span>}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1" style={{ color: '#fbbf24' }}>
                              <Zap className="h-3.5 w-3.5" />{reward.credits} kredi
                            </span>
                            <span style={{ color: 'var(--zet-text-muted)' }}>+</span>
                            <span className="flex items-center gap-1" style={{ color: '#f59e0b' }}>
                              <Star className="h-3.5 w-3.5" />{reward.sp.toLocaleString()} SP
                            </span>
                          </div>
                        </div>
                      );})}
                    </div>
                  )}

                  <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--zet-bg-card)' }}>
                    <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--zet-text-muted)' }}>
                      <span>{currentRank.name}</span>
                      {nextRank && <span>{nextRank.name}</span>}
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${rankProgress}%`, background: currentRank.color }} />
                    </div>
                    <p className="text-xs mt-2 text-center" style={{ color: 'var(--zet-text-muted)' }}>{userSP.toLocaleString()} / {nextRank ? nextRank.xp.toLocaleString() : '∞'} XP</p>
                  </div>
                </div>
                );
              })()}

              {settingsTab === 'subscription' && (
                <div className="max-w-lg">
                  <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--zet-text)' }}>{t('subscription')}</h2>
                  <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-xl" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <Star className="h-4 w-4" style={{ color: '#fbbf24' }} />
                    <span className="text-sm font-bold" style={{ color: '#fbbf24' }}>{userSP.toLocaleString()} SP</span>
                    <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>- SP ile de plan alabilirsiniz</span>
                  </div>
                  <div className="flex justify-center mb-6">
                    <div className="flex rounded-lg p-1" style={{ background: 'var(--zet-bg)' }}>
                      <button onClick={() => setBillingCycle('monthly')} className="px-4 py-2 rounded-md text-sm font-medium transition-all" style={{ background: billingCycle === 'monthly' ? 'var(--zet-primary)' : 'transparent', color: billingCycle === 'monthly' ? 'white' : 'var(--zet-text-muted)' }}>{t('monthly')}</button>
                      <button onClick={() => setBillingCycle('yearly')} className="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1" style={{ background: billingCycle === 'yearly' ? 'var(--zet-primary)' : 'transparent', color: billingCycle === 'yearly' ? 'white' : 'var(--zet-text-muted)' }}>
                        {t('yearly')}
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <button onClick={() => setCurrentPlanIndex(Math.max(0, currentPlanIndex - 1))} disabled={currentPlanIndex === 0} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30" style={{ background: 'var(--zet-bg-card)' }}>
                      <ChevronLeft className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
                    </button>
                    <button onClick={() => setCurrentPlanIndex(Math.min(SUBSCRIPTION_PLANS.length - 1, currentPlanIndex + 1))} disabled={currentPlanIndex === SUBSCRIPTION_PLANS.length - 1} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30" style={{ background: 'var(--zet-bg-card)' }}>
                      <ChevronRight className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
                    </button>
                    <div className="overflow-hidden">
                      <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${currentPlanIndex * 100}%)` }}>
                        {SUBSCRIPTION_PLANS.map((plan) => {
                          const isYearly = billingCycle === 'yearly';
                          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                          const fullYearlyPrice = plan.monthlyPrice * 12;
                          const period = isYearly ? '/yr' : '/mo';
                          return (
                            <div key={plan.id} className="w-full flex-shrink-0 px-2">
                              <div className={`relative rounded-2xl p-6 transition-all ${plan.recommended ? 'ring-2' : ''}`} style={{ background: `linear-gradient(135deg, ${plan.color}15 0%, ${plan.color}05 100%)`, border: `1px solid ${plan.color}30` }}>
                                {plan.recommended && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: plan.color }}>{t('recommended')}</div>}
                                <div className="text-center mb-6 pt-2">
                                  <h3 className="text-2xl font-bold mb-2" style={{ color: plan.color }}>{plan.name}</h3>
                                  {isYearly ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <span className="text-sm line-through" style={{ color: 'var(--zet-text-muted)' }}>${fullYearlyPrice}/yr</span>
                                      <div><span className="text-4xl font-bold" style={{ color: 'var(--zet-text)' }}>${price}</span><span className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>/yr</span></div>
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">%{Math.round((1 - price / fullYearlyPrice) * 100)} tasarruf</span>
                                    </div>
                                  ) : (
                                    <div><span className="text-4xl font-bold" style={{ color: 'var(--zet-text)' }}>${price}</span><span className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>/mo</span></div>
                                  )}
                                </div>
                                <ul className="space-y-3 mb-6">
                                  {plan.features.map((feature, fidx) => (<li key={fidx} className="flex items-center gap-2 text-sm" style={{ color: 'var(--zet-text)' }}><Check className="h-4 w-4 flex-shrink-0" style={{ color: plan.color }} />{feature}</li>))}
                                </ul>
                                <div className="space-y-2">
                                  <button onClick={() => handleSubscribe(plan.id)} disabled={subscribing || userSubscription === plan.id} className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50" style={{ background: userSubscription === plan.id ? 'var(--zet-bg)' : plan.color, color: userSubscription === plan.id ? plan.color : 'white', border: userSubscription === plan.id ? `2px solid ${plan.color}` : 'none' }} data-testid={`select-plan-${plan.id}`}>
                                    {userSubscription === plan.id ? t('currentPlan') : `$${price}${period} ile Al`}
                                  </button>
                                  {userSubscription !== plan.id && (
                                    <button onClick={() => handleBuyWithSP(plan.id)} disabled={subscribing || userSP < plan.spCost} className="w-full py-2.5 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: userSP >= plan.spCost ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.03)', color: userSP >= plan.spCost ? '#fbbf24' : 'var(--zet-text-muted)', border: `1px solid ${userSP >= plan.spCost ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)'}` }}>
                                      <Star className="h-4 w-4" />{plan.spCost.toLocaleString()} SP ile Al
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex justify-center gap-2 mt-4">
                      {SUBSCRIPTION_PLANS.map((_, idx) => (<button key={idx} onClick={() => setCurrentPlanIndex(idx)} className={`w-2 h-2 rounded-full transition-all ${currentPlanIndex === idx ? 'w-6' : ''}`} style={{ background: currentPlanIndex === idx ? SUBSCRIPTION_PLANS[idx].color : 'var(--zet-text-muted)' }} />))}
                    </div>
                  </div>
                  <p className="text-center text-xs mt-4" style={{ color: 'var(--zet-text-muted)' }}>{t('subscriptionNote')}</p>
                </div>
              )}

              {settingsTab === 'credits' && (
                <div className="max-w-lg">
                  <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--zet-text)' }}>{t('buyCredits')}</h2>
                  {creditPackages.length > 0 && creditPackages[0].discounted_price !== creditPackages[0].price && (
                    <div className="mb-3 px-3 py-2 rounded-lg text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                      <span className="text-xs font-bold" style={{ color: '#10b981' }}>%15 Abone İndirimi Uygulandı!</span>
                    </div>
                  )}
                  <div className="space-y-2.5">
                    {creditPackages.length === 0 ? (
                      <div className="text-center py-8" style={{ color: 'var(--zet-text-muted)' }}>
                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--zet-primary)', borderTopColor: 'transparent' }} />
                      </div>
                    ) : creditPackages.map(pkg => {
                      const hasDiscount = pkg.discounted_price !== pkg.price;
                      return (
                        <div key={pkg.id} className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.01]" style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }} data-testid={`credit-pack-${pkg.credits}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: pkg.credits >= 1000 ? 'rgba(251,191,36,0.15)' : pkg.credits >= 700 ? 'rgba(139,92,246,0.15)' : pkg.credits >= 350 ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)' }}>
                              <Zap className="h-5 w-5" style={{ color: pkg.credits >= 1000 ? '#fbbf24' : pkg.credits >= 700 ? '#8b5cf6' : pkg.credits >= 350 ? '#3b82f6' : '#10b981' }} />
                            </div>
                            <div>
                              <p className="text-sm font-bold" style={{ color: 'var(--zet-text)' }}>{pkg.credits} Kredi</p>
                              <p className="text-[10px]" style={{ color: 'var(--zet-text-muted)' }}>{pkg.credits >= 1000 ? 'En Avantajlı' : pkg.credits >= 700 ? 'Popüler' : pkg.credits >= 350 ? 'Standart' : 'Başlangıç'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="text-right">
                              {hasDiscount && <p className="text-[10px] line-through" style={{ color: 'var(--zet-text-muted)' }}>${pkg.price}</p>}
                              <p className="text-sm font-bold" style={{ color: hasDiscount ? '#10b981' : 'var(--zet-text)' }}>${pkg.discounted_price}</p>
                            </div>
                            <button onClick={() => handleBuyCredits(pkg.id)} disabled={buyingCredits} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 disabled:opacity-40" style={{ background: 'var(--zet-primary)', color: 'white' }} data-testid={`buy-credit-${pkg.credits}`}>
                              {buyingCredits ? '...' : 'Satın Al'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-center mt-3" style={{ color: 'var(--zet-text-muted)' }}>
                    Kredi paketleri anında hesabınıza eklenir. Free dışındaki planlara %15 indirim uygulanır.<br />Maksimum kredi bakiyesi: 1000. Limit aşıldığında fazla krediler silinir.
                  </p>
                </div>
              )}

              {settingsTab === 'shortcuts' && (
                <div className="max-w-lg">
                  <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--zet-text)' }}>{t('shortcuts')}</h2>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
                    <input placeholder="Search tools..." value={shortcutSearch} onChange={(e) => setShortcutSearch(e.target.value)} className="zet-input pl-9 w-full" />
                  </div>
                  <div className="space-y-1">
                    {TOOLS.filter(tool => !shortcutSearch || (t(tool.nameKey) || tool.nameKey).toLowerCase().includes(shortcutSearch.toLowerCase()) || tool.id.toLowerCase().includes(shortcutSearch.toLowerCase())).map(tool => {
                      const currentKey = Object.keys(shortcuts).find(k => shortcuts[k] === tool.id);
                      return (
                        <div key={tool.id} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--zet-bg)' }}>
                          <div className="flex items-center gap-2">
                            <tool.icon className="h-4 w-4" style={{ color: 'var(--zet-text)' }} />
                            <span className="text-sm" style={{ color: 'var(--zet-text)' }}>{t(tool.nameKey) || tool.nameKey}</span>
                          </div>
                          {editingShortcut === tool.id ? (
                            <input autoFocus className="zet-input w-12 text-center text-xs font-mono" maxLength={1} onKeyDown={e => { if (e.key.length === 1) { const ns = { ...shortcuts }; Object.keys(ns).forEach(k => { if (ns[k] === tool.id) delete ns[k]; }); ns[e.key.toUpperCase()] = tool.id; setShortcuts(ns); localStorage.setItem('zet_shortcuts', JSON.stringify(ns)); setEditingShortcut(null); } else if (e.key === 'Escape') setEditingShortcut(null); }} onBlur={() => setEditingShortcut(null)} placeholder="?" />
                          ) : (
                            <button onClick={() => setEditingShortcut(tool.id)} className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'var(--zet-bg-card)', color: currentKey ? 'var(--zet-primary)' : 'var(--zet-text-muted)' }}>{currentKey || '—'}</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-3 mt-3 border-t text-xs" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text-muted)' }}>
                    <p>Click a key to edit. Press a new key to assign.</p>
                  </div>
                </div>
              )}

              {settingsTab === 'fastselect' && (
                <div className="max-w-lg">
                  <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--zet-text)' }}>Fast Select</h2>
                  <p className="text-sm mb-3" style={{ color: 'var(--zet-text-muted)' }}>{t('fastSelectActive')} {fastSelectTools.length}/{fastSelectLimit}</p>
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
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
                    <input placeholder="Search tools..." value={fastSelectSearch} onChange={(e) => setFastSelectSearch(e.target.value)} className="zet-input pl-9 w-full" />
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {TOOLS.filter(tool => !fastSelectSearch || (t(tool.nameKey) || tool.nameKey).toLowerCase().includes(fastSelectSearch.toLowerCase()) || tool.id.toLowerCase().includes(fastSelectSearch.toLowerCase())).map(tool => (
                      <button key={tool.id} onClick={() => { if (fastSelectTools.includes(tool.id)) { const nt = fastSelectTools.filter(t => t !== tool.id); setFastSelectTools(nt); localStorage.setItem('zet_fast_select', JSON.stringify(nt)); } else if (fastSelectTools.length < fastSelectLimit) { const nt = [...fastSelectTools, tool.id]; setFastSelectTools(nt); localStorage.setItem('zet_fast_select', JSON.stringify(nt)); } }} className={`p-2 rounded flex flex-col items-center transition-all ${fastSelectTools.includes(tool.id) ? 'ring-2 ring-blue-500' : 'hover:bg-white/10'}`} style={{ background: fastSelectTools.includes(tool.id) ? 'var(--zet-primary)' : 'var(--zet-bg)' }} title={t(tool.nameKey) || tool.nameKey}>
                        <tool.icon className="h-4 w-4" style={{ color: 'var(--zet-text)' }} />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs mt-3" style={{ color: 'var(--zet-text-muted)' }}>
                    {fastSelectTools.length}/{fastSelectLimit} {t('selected')}
                    {userSubscription === 'free' && <span className="ml-1 text-blue-400">(Daha fazlası için yükselt)</span>}
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col p-4 w-full" style={{ maxWidth: 896, margin: '0 auto' }}>
        {/* Search */}
        <div className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none z-10" style={{ color: 'var(--zet-text-muted)' }} />
              <input
                type="text"
                placeholder={activeTab === 'notes' ? t('searchNotes') : activeTab === 'media' ? t('searchMedia') : t('searchDocuments')}
                value={zetaSearch ? zetaSearchQuery : searchQuery}
                onChange={e => zetaSearch ? setZetaSearchQuery(e.target.value) : setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && zetaSearch) handleZetaSearch(); }}
                className="zet-input w-full"
                style={{ paddingLeft: '2.75rem', paddingRight: zetaSearch ? '2.75rem' : undefined }}
                data-testid="search-input"
              />
              {zetaSearch && zetaSearchQuery && (
                <button onClick={() => { setZetaSearchQuery(''); setZetaSearchResults(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/10">
                  <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
                </button>
              )}
            </div>
            {activeTab !== 'media' && (
              <button
                onClick={() => { setZetaSearch(v => !v); setZetaSearchQuery(''); setSearchQuery(''); setZetaSearchResults(null); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0"
                style={{
                  background: zetaSearch ? 'rgba(76,168,173,0.2)' : 'var(--zet-bg-card)',
                  border: `1px solid ${zetaSearch ? 'rgba(76,168,173,0.6)' : 'var(--zet-border)'}`,
                  color: zetaSearch ? '#4ca8ad' : 'var(--zet-text-muted)',
                }}
                title="Zeta ile semantik arama"
              >
                <ZetaIcon size={15} color={zetaSearch ? '#4ca8ad' : 'currentColor'} />
                <span>Zeta</span>
              </button>
            )}
            {zetaSearch && zetaSearchQuery.trim() && (
              <button
                onClick={handleZetaSearch}
                disabled={zetaSearchLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 disabled:opacity-50"
                style={{ background: 'rgba(76,168,173,0.9)', color: '#fff' }}
              >
                {zetaSearchLoading ? '...' : 'Ara'}
              </button>
            )}
          </div>

          {/* Zeta arama sonuçları */}
          {zetaSearch && (zetaSearchLoading || zetaSearchResults) && (
            <div className="mt-3 p-4 rounded-xl animate-fadeIn" style={{ background: 'rgba(76,168,173,0.08)', border: '1px solid rgba(76,168,173,0.3)' }}>
              {zetaSearchLoading ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--zet-text-muted)' }}>
                  <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0" style={{ borderColor: '#4ca8ad', borderTopColor: 'transparent' }} />
                  Zeta belgelerini tarayarak arıyor...
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#4ca8ad' }}>
                      <ZetaIcon size={12} color="#4ca8ad" /> Zeta Arama Sonucu
                    </span>
                    <button onClick={() => setZetaSearchResults(null)} className="p-0.5 rounded hover:bg-white/10">
                      <X className="h-3.5 w-3.5" style={{ color: 'var(--zet-text-muted)' }} />
                    </button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--zet-text)' }}>{zetaSearchResults}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Documents/Notes/Media Grid */}
        {activeTab === 'media' ? (
          <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--zet-text-muted)' }}>
            Media coming soon
          </div>
        ) : activeTab === 'documents' ? (
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
                style={{ border: doc.pinned ? '1px solid rgba(245,158,11,0.4)' : undefined }}
                onClick={() => { if (renamingDocId !== doc.doc_id) navigate(`/editor/${doc.doc_id}`); }}
                data-testid={`doc-card-${doc.doc_id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, var(--zet-primary), var(--zet-primary-light))' }}>
                    <FileText className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
                    {doc.pinned && <Pin className="h-3 w-3 absolute -top-1 -right-1" style={{ color: '#f59e0b' }} />}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setDocMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right }); setOpenMenuDocId(openMenuDocId === doc.doc_id ? null : doc.doc_id); }}
                    className="p-1 rounded hover:bg-white/10 transition-all"
                    style={{ color: 'var(--zet-text-muted)' }}
                    data-testid={`doc-menu-btn-${doc.doc_id}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                {renamingDocId === doc.doc_id ? (
                  <div className="flex gap-1 mb-1" onClick={e => e.stopPropagation()}>
                    <input
                      className="zet-input flex-1 text-sm font-medium"
                      value={renamingDocTitle}
                      onChange={e => setRenamingDocTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') renameDocument(doc.doc_id, renamingDocTitle); if (e.key === 'Escape') { setRenamingDocId(null); setRenamingDocTitle(''); } }}
                      autoFocus
                    />
                    <button onClick={() => renameDocument(doc.doc_id, renamingDocTitle)} className="p-1 rounded hover:bg-white/10"><Check className="h-4 w-4" style={{ color: '#22c55e' }} /></button>
                    <button onClick={() => { setRenamingDocId(null); setRenamingDocTitle(''); }} className="p-1 rounded hover:bg-white/10"><X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>
                  </div>
                ) : (
                  <h3 className="font-medium mb-1 truncate" style={{ color: 'var(--zet-text)' }}>{doc.title}</h3>
                )}
                <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{t('document')}</p>
                <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: 'var(--zet-text-muted)' }}>
                  <Clock className="h-3 w-3" />
                  {formatTime(doc.updated_at || doc.created_at)}
                </div>
                {zetaDocAnalysis.docId === doc.doc_id && (
                  <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: 'rgba(76,168,173,0.1)', border: '1px solid rgba(76,168,173,0.3)' }} onClick={e => e.stopPropagation()}>
                    {zetaDocAnalysis.loading ? (
                      <div className="flex items-center gap-1" style={{ color: 'var(--zet-text-muted)' }}>
                        <div className="w-2.5 h-2.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4ca8ad', borderTopColor: 'transparent' }} />
                        {t('analyzing')}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1 font-medium" style={{ color: '#4ca8ad' }}><ZetaIcon size={10} color="#4ca8ad" /> {t('zetaSummary')}</span>
                          <button onClick={() => setZetaDocAnalysis({ docId: null, loading: false, result: null })} className="p-0.5 rounded hover:bg-white/10"><X className="h-3 w-3" style={{ color: 'var(--zet-text-muted)' }} /></button>
                        </div>
                        <p className="whitespace-pre-wrap break-words" style={{ color: 'var(--zet-text)' }}>{zetaDocAnalysis.result}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Document menu dropdown (fixed, not clipped) */}
            {openMenuDocId && (
              <div
                className="fixed z-50 py-1 rounded-xl min-w-[160px] animate-fadeIn"
                style={{ top: docMenuPos.top, right: docMenuPos.right, background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                onClick={e => e.stopPropagation()}
              >
                {(() => { const doc = filteredDocs.find(d => d.doc_id === openMenuDocId); return [
                  { icon: <Pin className="h-4 w-4" style={{ color: doc?.pinned ? '#f59e0b' : 'inherit' }} />, label: doc?.pinned ? t('noteMenuUnpin') : t('noteMenuPin'), action: () => { if (doc) pinDocument(doc); } },
                  { icon: <ZetaIcon size={14} color="#4ca8ad" />, label: t('zetaSummary'), action: () => { if (doc) analyzeDocWithZeta(doc); } },
                  { icon: <FileEdit className="h-4 w-4" />, label: t('noteMenuEdit'), action: () => { if (doc) { setRenamingDocId(doc.doc_id); setRenamingDocTitle(doc.title); } setOpenMenuDocId(null); } },
                  { icon: <Trash2 className="h-4 w-4" />, label: t('noteMenuDelete'), color: '#ef4444', action: () => { setConfirmDeleteDocId(openMenuDocId); setOpenMenuDocId(null); } },
                ]; })().map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-all text-left hover:bg-white/5"
                    style={{ color: item.color || 'var(--zet-text)' }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : activeNotebook ? (
          /* ── Defter İçi Görünüm ── */
          <div className="flex flex-col flex-1 min-h-0">
            {/* Defter başlığı + geri butonu */}
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <button
                onClick={() => { setActiveNotebook(null); setNotebookSearch(''); }}
                className="p-2 rounded-lg hover:bg-white/10 transition-all"
                style={{ color: 'var(--zet-text-muted)' }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                style={{ background: `${activeNotebook.color}25`, border: `1px solid ${activeNotebook.color}50` }}>
                📓
              </div>
              <span className="font-semibold text-lg truncate" style={{ color: 'var(--zet-text)' }}>{activeNotebook.name}</span>
            </div>

            {/* Defter içi arama */}
            <div className="zet-card p-3 mb-3 flex-shrink-0" style={{ background: 'var(--zet-bg-card)' }}>
              <input
                type="text"
                placeholder={t('searchInNotebook')}
                value={notebookSearch}
                onChange={(e) => setNotebookSearch(e.target.value)}
                className="zet-input w-full text-sm"
                style={{ background: 'var(--zet-bg)' }}
              />
            </div>

            {/* Bu deftere not ekle */}
            <div className="zet-card p-3 mb-4 flex-shrink-0" style={{ background: 'var(--zet-bg-card)' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('addNoteToNotebook')}
                  value={notebookNote}
                  onChange={(e) => setNotebookNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNoteToNotebook()}
                  className="zet-input flex-1"
                  data-testid="notebook-note-input"
                />
                <button
                  onClick={addNoteToNotebook}
                  className="zet-btn px-4"
                  data-testid="add-notebook-note-btn"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Defterdeki notlar */}
            <div className="overflow-y-auto space-y-3 pb-20" style={{ maxHeight: 'calc(100vh - 400px)' }}>
              {notes
                .filter(n => n.notebook_id === activeNotebook.notebook_id &&
                  (!notebookSearch || n.content.toLowerCase().includes(notebookSearch.toLowerCase())))
                .map(note => renderNoteCard(note))}
              {notes.filter(n => n.notebook_id === activeNotebook.notebook_id).length === 0 && (
                <div className="text-center py-8" style={{ color: 'var(--zet-text-muted)' }}>
                  {t('noNotesInNotebook')}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Ana Notlar Görünümü ── */
          <div className="flex flex-col flex-1 min-h-0">

            {/* Hızlı not input + Yeni Defter butonu */}
            <div className="zet-card p-4 mb-4 flex-shrink-0" style={{ background: 'var(--zet-bg-card)' }}>
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
                <button onClick={addQuickNote} className="zet-btn px-4" data-testid="add-note-btn">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--zet-text-muted)' }} />
                <input
                  type="datetime-local"
                  value={noteReminder}
                  onChange={(e) => setNoteReminder(e.target.value)}
                  className="zet-input flex-1 text-xs"
                  style={{ background: 'var(--zet-bg)' }}
                />
                {noteReminder && (
                  <button onClick={() => setNoteReminder('')} className="p-1 rounded hover:bg-white/10 flex-shrink-0">
                    <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
                  </button>
                )}
                <button
                  onClick={() => setShowNewNotebook(v => !v)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
                  style={{ background: showNewNotebook ? 'var(--zet-primary)' : 'rgba(41,47,145,0.3)', border: '1px solid rgba(41,47,145,0.6)', color: 'var(--zet-text)' }}
                  data-testid="new-notebook-btn"
                >
                  <span>📓</span>
                  <span>{t('newNotebook')}</span>
                </button>
              </div>

              {/* Yeni Defter inline formu */}
              {showNewNotebook && (
                <div className="flex gap-2 mt-3 animate-fadeIn">
                  <input
                    type="text"
                    placeholder={t('notebookNamePlaceholder')}
                    value={newNotebookName}
                    onChange={(e) => setNewNotebookName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') createNotebook(); if (e.key === 'Escape') { setShowNewNotebook(false); setNewNotebookName(''); } }}
                    className="zet-input flex-1 text-sm"
                    autoFocus
                    data-testid="new-notebook-input"
                  />
                  <button onClick={createNotebook} className="zet-btn px-3" data-testid="create-notebook-btn">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setShowNewNotebook(false); setNewNotebookName(''); }} className="p-2 rounded hover:bg-white/10">
                    <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-y-auto space-y-3 pb-20" style={{ maxHeight: 'calc(100vh - 420px)' }}>
              {/* Defterler */}
              {notebooks.filter(nb => !searchQuery || nb.name.toLowerCase().includes(searchQuery.toLowerCase())).map(nb => (
                <div
                  key={nb.notebook_id}
                  className="zet-card p-4 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all"
                  onClick={() => setActiveNotebook(nb)}
                  data-testid={`notebook-card-${nb.notebook_id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: `${nb.color || '#292F91'}25`, border: `1px solid ${nb.color || '#292F91'}50` }}>
                      📓
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--zet-text)' }}>{nb.name}</p>
                      <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>
                        {notes.filter(n => n.notebook_id === nb.notebook_id).length} {t('notesCount')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--zet-text-muted)' }} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteNotebookId(nb.notebook_id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                      data-testid={`delete-notebook-${nb.notebook_id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Düz notlar (notebook_id yok) — sabitliler önce */}
              {visibleNotes.map(note => renderNoteCard(note))}

              {notebooks.length === 0 && notes.filter(n => !n.notebook_id).length === 0 && (
                <div className="text-center py-8" style={{ color: 'var(--zet-text-muted)' }}>
                  {t('noNotesYet')}
                </div>
              )}
            </div>
          </div>
        )}
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
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${activeTab === 'media' ? 'glow-sm' : ''}`}
            style={{
              background: activeTab === 'media' ? 'linear-gradient(135deg, var(--zet-primary), var(--zet-primary-light))' : 'transparent',
              color: activeTab === 'media' ? 'var(--zet-text)' : 'var(--zet-text-muted)'
            }}
            data-testid="tab-media"
          >
            Media
          </button>
        </div>
      </div>

      {/* Delete Note Confirmation */}
      {confirmDeleteNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setConfirmDeleteNoteId(null)}>
          <div className="zet-card p-6 mx-4 w-full max-w-sm animate-fadeIn" onClick={e => e.stopPropagation()}
            style={{ border: '1px solid rgba(239,68,68,0.4)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <Trash2 className="h-5 w-5" style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--zet-text)' }}>{t('deleteNote')}</p>
                <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{t('cannotUndo')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteNoteId(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
                style={{ color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => { deleteNote(confirmDeleteNoteId); setConfirmDeleteNoteId(null); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444' }}
              >
                {t('yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close floating menus */}
      {(openMenuNoteId || openMenuDocId) && (
        <div className="fixed inset-0 z-40" onClick={() => { setOpenMenuNoteId(null); setOpenMenuDocId(null); }} />
      )}

      {/* Delete Document Confirmation */}
      {confirmDeleteDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setConfirmDeleteDocId(null)}>
          <div className="zet-card p-6 mx-4 w-full max-w-sm animate-fadeIn" onClick={e => e.stopPropagation()}
            style={{ border: '1px solid rgba(239,68,68,0.4)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <Trash2 className="h-5 w-5" style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--zet-text)' }}>{t('deleteNote')}</p>
                <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{t('cannotUndo')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteDocId(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
                style={{ color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => { deleteDocument(confirmDeleteDocId); setConfirmDeleteDocId(null); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444' }}
              >
                {t('yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Notebook Confirmation */}
      {confirmDeleteNotebookId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setConfirmDeleteNotebookId(null)}>
          <div className="zet-card p-6 mx-4 w-full max-w-sm animate-fadeIn" onClick={e => e.stopPropagation()}
            style={{ border: '1px solid rgba(239,68,68,0.4)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <Trash2 className="h-5 w-5" style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--zet-text)' }}>{t('deleteNotebook')}</p>
                <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{t('cannotUndo')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteNotebookId(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
                style={{ color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => { deleteNotebook(confirmDeleteNotebookId); setConfirmDeleteNotebookId(null); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444' }}
              >
                {t('yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-medium animate-fadeIn flex items-center gap-2 shadow-lg"
          style={{
            background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(76,168,173,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.5)' : toast.type === 'error' ? 'rgba(239,68,68,0.5)' : 'rgba(76,168,173,0.5)'}`,
            color: toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ef4444' : '#4ca8ad',
            backdropFilter: 'blur(10px)',
            maxWidth: 360,
          }}
        >
          <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
          <span style={{ color: 'var(--zet-text)' }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setConfirmModal(null)}>
          <div className="zet-card p-6 mx-4 w-full max-w-sm animate-fadeIn" onClick={e => e.stopPropagation()}
            style={{ border: `1px solid ${confirmModal.danger ? 'rgba(239,68,68,0.4)' : 'rgba(76,168,173,0.3)'}` }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: confirmModal.danger ? 'rgba(239,68,68,0.15)' : 'rgba(76,168,173,0.15)' }}>
                {confirmModal.danger
                  ? <Trash2 className="h-5 w-5" style={{ color: '#ef4444' }} />
                  : <Check className="h-5 w-5" style={{ color: '#4ca8ad' }} />}
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: 'var(--zet-text)' }}>{confirmModal.title}</p>
                <p className="text-sm whitespace-pre-line" style={{ color: 'var(--zet-text-muted)' }}>{confirmModal.msg}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
                style={{ color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}
              >
                İptal
              </button>
              <button
                onClick={() => { const fn = confirmModal.onConfirm; setConfirmModal(null); fn(); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={confirmModal.danger
                  ? { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444' }
                  : { background: 'rgba(76,168,173,0.2)', border: '1px solid rgba(76,168,173,0.5)', color: '#4ca8ad' }}
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Alarm Notifications */}
      {firedAlarms.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2" style={{ maxWidth: 320 }}>
          {firedAlarms.map(alarm => (
            <div key={alarm.note_id} className="zet-card p-4 animate-fadeIn flex items-start gap-3"
              style={{ background: 'var(--zet-bg-card)', border: '1px solid #eab308', boxShadow: '0 0 20px rgba(234,179,8,0.3)' }}>
              <BellRing className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#eab308' }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm mb-1" style={{ color: '#eab308' }}>{t('reminder')}</p>
                <p className="text-sm break-words" style={{ color: 'var(--zet-text)' }}>{alarm.content}</p>
              </div>
              <button onClick={() => setFiredAlarms(prev => prev.filter(a => a.note_id !== alarm.note_id))}
                className="p-1 rounded hover:bg-white/10 flex-shrink-0">
                <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
          ))}
        </div>
      )}

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
                <span className="block text-sm font-medium" style={{ color: 'var(--zet-text)' }}>{t('newDocument') || 'Yeni Belge'}</span>
              </button>
              <button
                onClick={() => setNewDocType('pdf')}
                className={`p-4 rounded-lg text-center transition-all ${newDocType === 'pdf' ? 'ring-2 ring-blue-500' : ''}`}
                style={{ background: newDocType === 'pdf' ? 'var(--zet-primary)' : 'var(--zet-bg)' }}
              >
                <FileEdit className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--zet-text)' }} />
                <span className="block text-sm font-medium" style={{ color: 'var(--zet-text)' }}>{t('editPDF')}</span>
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
                      <span className="text-sm">{t('clickToUpload')}</span>
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
              {newDocType === 'pdf' ? t('openPDF') : t('createDocument')}
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
                <Keyboard className="h-5 w-5" /> {t('shortcuts') || 'Klavye Kısayollari'}
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
                <Zap className="h-5 w-5" /> {t('fastSelect') || 'Hızlı Seçim'}
              </h3>
              <button onClick={() => { setShowFastSelect(false); setFastSelectSearch(''); }} className="p-1 rounded hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            
            <p className="text-sm mb-3" style={{ color: 'var(--zet-text-muted)' }}>
              {t('fastSelectDesc') || 'Editorde hızlı erişim için 4 favori araçınizi seçin.'}
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
              {fastSelectTools.length}/{fastSelectLimit} {t('selected') || 'seçili'}
              {userSubscription === 'free' && <span className="ml-1 text-blue-400">({t('upgradePlan') || 'Daha fazlasi için yükselt'})</span>}
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
                {t('choosePlan') || 'Planını Seç'}
              </h2>
              <button onClick={() => setShowSubscription(false)} className="p-2 rounded-lg hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>

            {/* SP Balance */}
            <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-xl" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }} data-testid="sp-balance-banner">
              <Star className="h-4 w-4" style={{ color: '#fbbf24' }} />
              <span className="text-sm font-bold" style={{ color: '#fbbf24' }}>{userSP.toLocaleString()} SP</span>
              <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>- SP ile de plan alabilirsiniz</span>
            </div>
            
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-6">
              <div className="flex rounded-lg p-1" style={{ background: 'var(--zet-bg)' }}>
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'text-white' : ''}`}
                  style={{ background: billingCycle === 'monthly' ? 'var(--zet-primary)' : 'transparent', color: billingCycle === 'monthly' ? 'white' : 'var(--zet-text-muted)' }}
                >
                  {t('monthly') || 'Aylik'}
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${billingCycle === 'yearly' ? 'text-white' : ''}`}
                  style={{ background: billingCycle === 'yearly' ? 'var(--zet-primary)' : 'transparent', color: billingCycle === 'yearly' ? 'white' : 'var(--zet-text-muted)' }}
                >
                  {t('yearly') || 'Yillik'}
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
                              {t('recommended') || 'ONERILEN'}
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
                          
                          <div className="space-y-2">
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
                              {userSubscription === plan.id ? (t('currentPlan') || 'Mevcut Plan') : `$${price}${period} ile Al`}
                            </button>
                            {userSubscription !== plan.id && (
                              <button
                                onClick={() => handleBuyWithSP(plan.id)}
                                disabled={subscribing || userSP < plan.spCost}
                                className="w-full py-2.5 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-40 flex items-center justify-center gap-2"
                                style={{
                                  background: userSP >= plan.spCost ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.03)',
                                  color: userSP >= plan.spCost ? '#fbbf24' : 'var(--zet-text-muted)',
                                  border: `1px solid ${userSP >= plan.spCost ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)'}`
                                }}
                                data-testid={`buy-sp-${plan.id}`}
                              >
                                <Star className="h-4 w-4" />
                                {plan.spCost.toLocaleString()} SP ile Al
                              </button>
                            )}
                          </div>
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
              {t('subscriptionNote') || 'Tüm planlar 7 gunluk ücretsiz deneme içerir. Istediginiz zaman iptal edebilirsiniz.'}
            </p>
          </div>
        </div>
      )}


      {/* AI Settings Modal */}
      {showAISettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAISettings(false)}>
          <div className="zet-card p-6 w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--zet-text)' }}>AI Ayarları</h2>
              <button onClick={() => setShowAISettings(false)} className="p-1 rounded hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* ZETA Settings */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(76, 168, 173, 0.1)', border: '1px solid rgba(76, 168, 173, 0.3)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5" style={{ color: '#4ca8ad' }} />
                  <h3 className="font-semibold" style={{ color: '#4ca8ad' }}>ZETA Özelleştirme</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Mod</label>
                    <select 
                      value={zetaMood} 
                      onChange={e => { setZetaMood(e.target.value); localStorage.setItem('zet_zeta_mood', e.target.value); }}
                      className="zet-input text-sm w-full"
                    >
                      <option value="cheerful">🎉 Neşeli</option>
                      <option value="professional">💼 Profesyonel</option>
                      <option value="curious">🔍 Meraklı</option>
                      <option value="custom">✨ Özel</option>
                    </select>
                  </div>
                  {zetaMood === 'custom' && (
                    <div>
                      <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Özel Prompt</label>
                      <textarea 
                        value={zetaCustomPrompt} 
                        onChange={e => { setZetaCustomPrompt(e.target.value); localStorage.setItem('zet_zeta_custom', e.target.value); }}
                        placeholder="ZETA nasıl davransın?"
                        className="zet-input text-sm w-full h-20 resize-none"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Emoji Kullanımı</label>
                    <select 
                      value={zetaEmoji} 
                      onChange={e => { setZetaEmoji(e.target.value); localStorage.setItem('zet_zeta_emoji', e.target.value); }}
                      className="zet-input text-sm w-full"
                    >
                      <option value="none">❌ Kullanma</option>
                      <option value="low">📍 Az Kullan</option>
                      <option value="medium">📌 Orta</option>
                      <option value="high">🎯 Çok Kullan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Judge Settings */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(200, 0, 90, 0.1)', border: '1px solid rgba(200, 0, 90, 0.3)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="h-5 w-5" style={{ color: '#c8005a' }} />
                  <h3 className="font-semibold" style={{ color: '#c8005a' }}>ZET Judge Mini Özelleştirme</h3>
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Mod</label>
                  <select 
                    value={judgeMood} 
                    onChange={e => { setJudgeMood(e.target.value); localStorage.setItem('zet_judge_mood', e.target.value); }}
                    className="zet-input text-sm w-full"
                  >
                    <option value="normal">⚖️ Normal (Yapıcı eleştiri)</option>
                    <option value="harsh">🔥 Sert (Esprili dalga geçme)</option>
                  </select>
                  <p className="text-xs mt-2" style={{ color: 'var(--zet-text-muted)' }}>
                    {judgeMood === 'harsh' ? '😈 Judge sizi esprilerle "kavuracak"!' : '🤝 Judge yapıcı ve profesyonel olacak.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Credits Purchase Modal */}
      {showCredits && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowCredits(false)}>
          <div className="zet-card p-5 w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" style={{ color: '#fbbf24' }} />
                <h2 className="text-lg font-bold" style={{ color: 'var(--zet-text)' }}>Kredi Satin Al</h2>
              </div>
              <button onClick={() => setShowCredits(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>

            {creditPackages.length > 0 && creditPackages[0].discounted_price !== creditPackages[0].price && (
              <div className="mb-3 px-3 py-2 rounded-lg text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <span className="text-xs font-bold" style={{ color: '#10b981' }}>%15 Abone Indirimi Uygulandi!</span>
              </div>
            )}

            <div className="space-y-2.5">
              {creditPackages.map(pkg => {
                const hasDiscount = pkg.discounted_price !== pkg.price;
                return (
                  <div key={pkg.id} className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.01]"
                    style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }}
                    data-testid={`credit-pack-${pkg.credits}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                        background: pkg.credits >= 1000 ? 'rgba(251,191,36,0.15)' : pkg.credits >= 700 ? 'rgba(139,92,246,0.15)' : pkg.credits >= 350 ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)'
                      }}>
                        <Zap className="h-5 w-5" style={{
                          color: pkg.credits >= 1000 ? '#fbbf24' : pkg.credits >= 700 ? '#8b5cf6' : pkg.credits >= 350 ? '#3b82f6' : '#10b981'
                        }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--zet-text)' }}>{pkg.credits} Kredi</p>
                        <p className="text-[10px]" style={{ color: 'var(--zet-text-muted)' }}>
                          {pkg.credits >= 1000 ? 'En Avantajlı' : pkg.credits >= 700 ? 'Popüler' : pkg.credits >= 350 ? 'Standart' : 'Başlangıç'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        {hasDiscount && (
                          <p className="text-[10px] line-through" style={{ color: 'var(--zet-text-muted)' }}>${pkg.price}</p>
                        )}
                        <p className="text-sm font-bold" style={{ color: hasDiscount ? '#10b981' : 'var(--zet-text)' }}>
                          ${pkg.discounted_price}
                        </p>
                      </div>
                      <button
                        onClick={() => handleBuyCredits(pkg.id)}
                        disabled={buyingCredits}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 disabled:opacity-40"
                        style={{ background: 'var(--zet-primary)', color: 'white' }}
                        data-testid={`buy-credit-${pkg.credits}`}
                      >
                        {buyingCredits ? '...' : 'Satin Al'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-center mt-3" style={{ color: 'var(--zet-text-muted)' }}>
              Kredi paketleri aninda hesabiniza eklenir. Free dışındaki planlara %15 indirim uygulanir.
              <br />Maksimum kredi bakiyesi: 1000. Limit asildiginda fazla krediler silinir.
            </p>
          </div>
        </div>
      )}

      {/* Ranks Modal */}
      {showRanks && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowRanks(false)}>
          <div className="zet-card p-6 w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--zet-text)' }}>Rütbe</h2>
              <button onClick={() => setShowRanks(false)} className="p-1 rounded hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            
            {/* Current Rank */}
            <div className="p-4 rounded-xl mb-6 text-center" style={{ background: `linear-gradient(135deg, ${currentRank.color}33 0%, rgba(139,92,246,0.2) 100%)`, border: `1px solid ${currentRank.color}50` }}>
              <Award className="h-12 w-12 mx-auto mb-2" style={{ color: currentRank.color }} />
              <h3 className="text-lg font-bold" style={{ color: currentRank.color }}>{currentRank.name}</h3>
              <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>
                Seviye {currentRank.level} • {userSP.toLocaleString()} XP {nextRank ? `/ ${nextRank.xp.toLocaleString()} XP` : '(Maksimum)'}
              </p>
              <div className="w-full h-2 rounded-full mt-2" style={{ background: 'var(--zet-bg)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${rankProgress}%`, background: `linear-gradient(90deg, ${currentRank.color}, #8b5cf6)` }} />
              </div>
            </div>

            {/* Ranks List */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--zet-text)' }}>Tüm Rütbeler</h4>
              <div className="space-y-2">
                {RANKS.map((rank, i) => {
                  const isCurrent = rank.name === currentRank.name;
                  return (
                    <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${isCurrent ? 'ring-2' : ''}`} style={{ background: isCurrent ? `${rank.color}1a` : 'var(--zet-bg)', outline: isCurrent ? `2px solid ${rank.color}` : undefined }}>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" style={{ color: rank.color }} />
                        <span className="text-sm" style={{ color: isCurrent ? rank.color : 'var(--zet-text)' }}>{rank.name}</span>
                        {isCurrent && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${rank.color}33`, color: rank.color }}>Mevcut</span>}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{rank.xp.toLocaleString()} XP</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Missions Modal */}
      {showMissions && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowMissions(false)}>
          <div className="zet-card p-6 w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--zet-text)' }}>Görevler</h2>
              <button onClick={() => setShowMissions(false)} className="p-1 rounded hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            
            {/* Active Missions */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--zet-text)' }}>Aktif Görevler</h4>
              <div className="space-y-2">
                {[
                  { title: 'İlk Belge', desc: 'İlk belgenizi oluşturun', xp: 10, progress: 100, done: true },
                  { title: 'AI Keşifçisi', desc: 'ZETA ile 5 sohbet yapın', xp: 25, progress: 40 },
                  { title: 'Renk Ustası', desc: 'Gradient kullanın', xp: 15, progress: 0 },
                  { title: 'Grafik Sihirbazı', desc: '3 grafik oluşturun', xp: 30, progress: 33 },
                  { title: 'Şablon Uzmanı', desc: '5 farklı şablon kullanın', xp: 20, progress: 0 },
                  { title: 'Organizatör', desc: '10 not oluşturun', xp: 15, progress: 0 },
                ].map((mission, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: mission.done ? 'rgba(34, 197, 94, 0.1)' : 'var(--zet-bg)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: mission.done ? '#22c55e' : 'var(--zet-text)' }}>
                        {mission.done && <Check className="h-3 w-3 inline mr-1" />}
                        {mission.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#f59e0b', color: 'white' }}>+{mission.xp} XP</span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: 'var(--zet-text-muted)' }}>{mission.desc}</p>
                    {!mission.done && (
                      <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--zet-border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${mission.progress}%`, background: '#4ca8ad' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
