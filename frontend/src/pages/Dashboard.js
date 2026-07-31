import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { A4LoadingScreen, MiniDocLoader } from '../components/LoadingScreens';
import QuestNotification from '../components/QuestNotification';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppTheme } from '../contexts/AppThemeContext';
import axios from 'axios';
import { savePreference } from '../lib/preferences';
import { saveDoc, getAllDocs, deleteDoc, updateDocField, generateDocId } from '../lib/localDocDB';
import { questService } from '../lib/questService';
import { openCheckoutOverlay } from '../lib/lemonSqueezy';
import { openPaddleCheckout } from '../lib/paddle';
import ZetaTypingIndicator from '../components/ZetaTypingIndicator';
import CaseOpenModal, { ZPIcon, CreditIcon } from '../components/dashboard/CaseOpenModal';
import WheelModal from '../components/dashboard/WheelModal';
import PackOpenModal from '../components/dashboard/PackOpenModal';
import OnboardingModal from '../components/dashboard/OnboardingModal';
import AISettingsModal from '../components/dashboard/AISettingsModal';
import CreditsModal from '../components/dashboard/CreditsModal';
import RanksModal from '../components/dashboard/RanksModal';
import NotebookPasswordModal from '../components/dashboard/NotebookPasswordModal';
import MissionsModal from '../components/dashboard/MissionsModal';
import SubscriptionModal from '../components/dashboard/SubscriptionModal';
import UpgradePromptModal from '../components/dashboard/UpgradePromptModal';
import DeleteConfirmModal from '../components/dashboard/DeleteConfirmModal';
import PlanFeaturesModal from '../components/dashboard/PlanFeaturesModal';
import SeasonEndModal from '../components/dashboard/SeasonEndModal';
import ConfirmModal from '../components/dashboard/ConfirmModal';
import WarningPopup from '../components/dashboard/WarningPopup';
import ironRankImg from '../assets/rank-iron.svg';
import silverRankImg from '../assets/rank-silver.svg';
import goldRankImg from '../assets/rank-gold.svg';
import diamondRankImg from '../assets/rank-diamond.svg';
import emeraldRankImg from '../assets/rank-emerald.svg';
import endlessRankImg from '../assets/rank-endless.svg';
import {
  Search, Settings, Plus, FileText, StickyNote, LogOut, Package,
  Clock, Trash2, Cloud, X, Keyboard, HardDrive, Check, Zap, CreditCard, ChevronLeft, ChevronRight,
  Bell, BellRing, Upload, FileEdit, Sparkles, Scale, Award, Map, Star, Copy, User,
  MoreVertical, ArrowUp, ArrowDown, Pin, UserCheck, BookOpen, Lock, Brain, ExternalLink,
  Folder, FolderOpen, FolderInput, LayoutGrid
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


function scatterFromCenter(gridEl) {
  if (!gridEl) return;
  const cards = Array.from(gridEl.children);
  if (cards.length < 2) return;
  const gridRect = gridEl.getBoundingClientRect();
  const cx = gridRect.width / 2;
  const cy = gridRect.height / 2;
  const offsets = cards.map(card => {
    const r = card.getBoundingClientRect();
    return {
      dx: cx - (r.left - gridRect.left + r.width / 2),
      dy: cy - (r.top - gridRect.top + r.height / 2),
    };
  });
  cards.forEach((card, i) => {
    card.style.transition = 'none';
    card.style.willChange = 'transform, opacity';
    card.style.transform = `translate(${offsets[i].dx}px, ${offsets[i].dy}px) scale(0.84)`;
    card.style.opacity = '0';
  });
  gridEl.offsetHeight;
  cards.forEach((card, i) => {
    setTimeout(() => {
      card.style.transition = 'transform 0.48s cubic-bezier(0.22,1,0.36,1), opacity 0.32s ease';
      card.style.transform = '';
      card.style.opacity = '';
    }, i * 28);
  });
  const cleanup = cards.length * 28 + 530;
  setTimeout(() => {
    cards.forEach(card => { card.style.willChange = ''; });
  }, cleanup);
}

const Dashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  const { switchApp } = useAppTheme();
  useEffect(() => { switchApp('mindshare'); }, []); // always enforce mindshare theme in dashboard
  const navigate = useNavigate();

  // Quest pending check + listener
  useEffect(() => {
    axios.get(`${API}/quests/status`, { withCredentials: true })
      .then(r => { setHasPendingQuests((r.data.quests || []).some(q => q.status === 'pending')); })
      .catch(() => {});
    const handler = (e) => {
      if (e.detail?.length > 0) {
        setQuestNotification(e.detail[0]);
        setHasPendingQuests(true);
      }
    };
    window.addEventListener('quest-completed', handler);
    return () => window.removeEventListener('quest-completed', handler);
  }, []);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => setIsOnline(true);
    const dn = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', dn);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', dn); };
  }, []);
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState(() => { try { return JSON.parse(localStorage.getItem('zet_docs_cache') || '[]'); } catch { return []; } });
  const [notes, setNotes] = useState(() => { try { return JSON.parse(localStorage.getItem('zet_notes_cache') || '[]'); } catch { return []; } });
  const [searchQuery, setSearchQuery] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [noteReminder, setNoteReminder] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  const [hasPendingQuests, setHasPendingQuests] = useState(false);
  const [questNotification, setQuestNotification] = useState(null);
  const [sfxEnabled, setSfxEnabled] = useState(() => localStorage.getItem('zet_sfx_enabled') !== 'false');
  const [sfxVolume, setSfxVolume] = useState(() => parseFloat(localStorage.getItem('zet_sfx_volume') || '0.35'));
  const [gradientAnimEnabled, setGradientAnimEnabled] = useState(() => localStorage.getItem('zet_gradient_anim') === 'true');
  const isCEO = localStorage.getItem('zet_ceo_mode') === 'true' || user?.email === 'muhammadbahaddinyilmaz@gmail.com';
  const isAdminMode = localStorage.getItem('zet_admin_mode') === 'true';
  const isPrivileged = isCEO || isAdminMode;
  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [obUsername, setObUsername] = useState('');
  const [obDisplayName, setObDisplayName] = useState('');
  const [obSubmitting, setObSubmitting] = useState(false);
  const [obError, setObError] = useState('');
  const [identityStatus, setIdentityStatus] = useState(null); // null | 'none' | 'pending' | 'approved' | 'rejected'
  const [identityForm, setIdentityForm] = useState({ full_name: '', id_type: 'tc_kimlik', id_number: '', front_image: null, back_image: null, selfie_image: null });
  const [identitySubmitting, setIdentitySubmitting] = useState(false);
  const [identityError, setIdentityError] = useState('');
  const [mobileSettingsSidebar, setMobileSettingsSidebar] = useState(true);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState('new'); // 'new' or 'pdf'
  const [pdfFile, setPdfFile] = useState(null);
  const [creatingDoc, setCreatingDoc] = useState(false);
  const [selectedPageSize, setSelectedPageSize] = useState(PAGE_SIZES[0]);
  const [loading, setLoading] = useState(() => !localStorage.getItem('zet_docs_cache'));
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
  // Gerçek abonelik planı sunucudan yüklenene kadar limit zorlaması ertelenir
  const subscriptionLoadedRef = useRef(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [subscriptionInitSlide, setSubscriptionInitSlide] = useState(null);
  const [showPlanFeatures, setShowPlanFeatures] = useState(false);
  const [upgradePrompt, setUpgradePrompt] = useState(null); // { featureName, requiredPlan }
  const showUpgradePrompt = (featureName, requiredPlan) => setUpgradePrompt({ featureName, requiredPlan });
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [currentPlanIndex, setCurrentPlanIndex] = useState(2);
  const [currentCreditIndex, setCurrentCreditIndex] = useState(0);
  const [userSubscription, setUserSubscription] = useState('free');
  const isFreeOffline = !isOnline && userSubscription === 'free';
  const [subscribing, setSubscribing] = useState(false);
  const [userZP, setUserZP] = useState(0);
  const [activeTimeSeconds, setActiveTimeSeconds] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionSecondsRef = useRef(0);
  const [docsHasMore, setDocsHasMore] = useState(true);
  const [showTrash, setShowTrash] = useState(false);
  const [trashDocs, setTrashDocs] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const docsSkipRef = useRef(0);
  const docsLoadingMoreRef = useRef(false);
  const docsBottomRef = useRef(null);
  const docsGridRef = useRef(null);
  const docsAnimatedRef = useRef(false);
  const notesListRef = useRef(null);
  const notesAnimatedRef = useRef(false);
  const settingsSidebarRef = useRef(null);
  const settingsAnimatedRef = useRef(false);
  const [completedQuestCount, setCompletedQuestCount] = useState(0);
  const [showRankBadge, setShowRankBadge] = useState(() => localStorage.getItem('zet_show_rank') !== 'false');
  
  // New Settings states
  const [showAISettings, setShowAISettings] = useState(false);
  const [showRanks, setShowRanks] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [creditPackages, setCreditPackages] = useState([]);
  const [buyingCredits, setBuyingCredits] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [openingCaseId, setOpeningCaseId] = useState(null);
  const [openingWheelId, setOpeningWheelId] = useState(null);
  const [openingPackId, setOpeningPackId] = useState(null);
  const [seasonData, setSeasonData] = useState(null);
  const [seasonForm, setSeasonForm] = useState({ start: '', end: '', loading: false });
  const [seasonResult, setSeasonResult] = useState(null);
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
  const [primeDriveDocs, setPrimeDriveDocs] = useState(() => JSON.parse(localStorage.getItem('prime_drive_docs') || '[]'));
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveUploading, setDriveUploading] = useState(false);
  const [driveUsed, setDriveUsed] = useState(0);
  const [docMenuPos, setDocMenuPos] = useState({ top: 0, right: 0 });
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState(null);
  const [confirmDeleteNotebookId, setConfirmDeleteNotebookId] = useState(null);
  // Notebook three-dot menu
  const [openMenuNotebookId, setOpenMenuNotebookId] = useState(null);
  const [notebookMenuPos, setNotebookMenuPos] = useState({ top: 0, right: 0 });
  const [renamingNotebookId, setRenamingNotebookId] = useState(null);
  const [renamingNotebookName, setRenamingNotebookName] = useState('');
  // Notebook password system
  const [notebookPasswordModal, setNotebookPasswordModal] = useState(null); // { mode: 'set'|'remove'|'unlock', notebookId, notebookName }
  const [nbPwInput, setNbPwInput] = useState('');
  const [nbPwConfirm, setNbPwConfirm] = useState('');
  const [nbPwError, setNbPwError] = useState('');
  const [nbPwLoading, setNbPwLoading] = useState(false);
  const [unlockedNotebooks, setUnlockedNotebooks] = useState({}); // notebookId -> true
  const [nbFailedAttempts, setNbFailedAttempts] = useState({}); // notebookId -> count
  const [nbLockoutUntil, setNbLockoutUntil] = useState({}); // notebookId -> timestamp ms
  const [nbLockoutTick, setNbLockoutTick] = useState(0);
  // AI Memories in settings
  const [zetaMemories, setZetaMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [newMemoryInput, setNewMemoryInput] = useState('');
  // Doc Files (Dosya) state
  const [docFiles, setDocFiles] = useState([]);
  const [activeDocFile, setActiveDocFile] = useState(null); // file object or null
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [openMenuFileId, setOpenMenuFileId] = useState(null);
  const [fileMenuPos, setFileMenuPos] = useState({ top: 0, right: 0 });
  const [openFolderDocMenuId, setOpenFolderDocMenuId] = useState(null);
  const [folderDocMenuPos, setFolderDocMenuPos] = useState({ top: 0, right: 0 });
  const [folderFileSheet, setFolderFileSheet] = useState(null);
  const [renamingFileId, setRenamingFileId] = useState(null);
  const [renamingFileName, setRenamingFileName] = useState('');
  const [importMode, setImportMode] = useState(null); // { fileId, selectedDocIds: Set }
  const [importProgress, setImportProgress] = useState(null); // { current, total } or null
  const [renamingDocId, setRenamingDocId] = useState(null);
  const [renamingDocTitle, setRenamingDocTitle] = useState('');
  const [zetaDocAnalysis, setZetaDocAnalysis] = useState({ docId: null, loading: false, result: null });
  const [rankTab, setRankTab] = useState('requirements');
  const [zetaSearch, setZetaSearch] = useState(false);
  const [activeWarnings, setActiveWarnings] = useState([]);
  const [toast, setToast] = useState(null); // { msg, type: 'success'|'error'|'info' }
  const [confirmModal, setConfirmModal] = useState(null); // { title, msg, onConfirm, danger }
  const showToast = (msg, type = 'info') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };
  const showConfirm = (title, msg, onConfirm, danger = false) => setConfirmModal({ title, msg, onConfirm, danger });
  const [zetaSearchQuery, setZetaSearchQuery] = useState('');
  const [zetaSearchLoading, setZetaSearchLoading] = useState(false);
  const [zetaSearchResults, setZetaSearchResults] = useState(null); // { text, matches: [{id, title, type}] }
  const [docContentsCache, setDocContentsCache] = useState({}); // docId -> text
  const [docSearchLoading, setDocSearchLoading] = useState(false);
  const [zetaAnalysis, setZetaAnalysis] = useState({ noteId: null, loading: false, result: null });
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
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

  // Troll mod popup state
  const [moodPending, setMoodPending] = useState(null);
  const [moodLocked,  setMoodLocked]  = useState(null);
  const [showMoodInfo, setShowMoodInfo] = useState(false);
  const [moodInfoSlide, setMoodInfoSlide] = useState(0);
  const [showMoodDrop, setShowMoodDrop] = useState(false);
  const [dUnlockedModes, setDUnlockedModes] = useState(() => { try { return JSON.parse(localStorage.getItem('zet_unlocked_modes') || '[]'); } catch { return []; } });
  const RARITY_COL = { nadir: '#60a5fa', epik: '#a78bfa', lore: '#f87171' };
  const DASH_MODES_DEF = [
    { value: 'cheerful',     label: 'Neşeli',      labelKey: 'modeCheerful',     rarity: 'nadir', troll: false },
    { value: 'curious',      label: 'Meraklı',     labelKey: 'modeCurious',      rarity: 'nadir', troll: false },
    { value: 'professional', label: 'Profesyonel', labelKey: 'modeProfessional', rarity: 'nadir', troll: false },
    { value: 'custom',       label: 'Özel',        labelKey: 'modeCustom',       rarity: 'nadir', troll: false },
    { value: 'agresif',      label: 'Agresif',     labelKey: 'modeAgresif',      rarity: 'epik',  troll: true  },
    { value: 'robot',        label: 'Robot',       labelKey: 'modeRobot',        rarity: 'nadir', troll: true  },
    { value: 'yorgun',       label: 'Yorgun',      labelKey: 'modeYorgun',       rarity: 'nadir', troll: true  },
    { value: 'dedektif',     label: 'Dedektif',    labelKey: 'modeDedektif',     rarity: 'epik',  troll: true  },
    { value: 'felsefi',      label: 'Felsefi',     labelKey: 'modeFelsefi',      rarity: 'epik',  troll: true  },
  ];
  const sortedDashModes = useMemo(() => {
    const withLocked = DASH_MODES_DEF.map(m => ({ ...m, locked: m.troll && !dUnlockedModes.includes(m.value) }));
    return [
      ...withLocked.filter(m => !m.locked).sort((a, b) => a.label.localeCompare(b.label, 'tr')),
      ...withLocked.filter(m => m.locked).sort((a, b) => a.label.localeCompare(b.label, 'tr')),
    ];
  }, [dUnlockedModes]);
  const DASH_TROLL = {
    agresif: { label: 'Agresif', color: '#a78bfa', warn: '"Kanka malmısın" düzeyinde davranabilir. Hassas yapılar için önerilmez.', hasWarn: true },
    robot:   { label: 'Robot',   color: '#60a5fa', hasWarn: false },
    yorgun:  { label: 'Yorgun',  color: '#60a5fa', hasWarn: false },
  };
  const handleDashMoodChange = (val) => {
    setShowMoodDrop(false);
    const mode = DASH_MODES_DEF.find(m => m.value === val);
    if (mode?.troll && !dUnlockedModes.includes(val)) {
      setMoodLocked(val);
    } else if (mode?.troll) {
      setMoodPending(val);
    } else {
      setZetaMood(val);
      localStorage.setItem('zet_zeta_mood', val);
    }
  };

  // Rank system
  const RANKS = [
    { name: 'Demir',   xp: 0,   color: '#9ca3af', level: 1, next: 40  },
    { name: 'Gümüş',  xp: 40,  color: '#cdd2d6', level: 2, next: 75  },
    { name: 'Altın',  xp: 75,  color: '#ecca66', level: 3, next: 130 },
    { name: 'Elmas',  xp: 130, color: '#250b62', level: 4, next: 230 },
    { name: 'Zümrüt', xp: 230, color: '#065a10', level: 5, next: 500 },
    { name: 'Endless', xp: 400, color: '#ef4444', level: 6, next: null },
  ];
  const getCurrentRank = (hours) => {
    let rank = RANKS[0];
    for (const r of RANKS) { if (hours >= r.xp) rank = r; }
    return rank;
  };
  // Rank tamamen saat bazlı — quest veya ZP gerektirmez
  const rankActiveHours = (activeTimeSeconds + sessionSeconds) / 3600;
  const currentRank = getCurrentRank(rankActiveHours);
  const nextRank = RANKS.find(r => r.xp > rankActiveHours) || null;
  const rankProgress = nextRank
    ? Math.min(100, Math.round(((rankActiveHours - currentRank.xp) / (nextRank.xp - currentRank.xp)) * 100))
    : 100;

  const RANK_LOGOS = { 'Demir': ironRankImg, 'Gümüş': silverRankImg, 'Altın': goldRankImg, 'Elmas': diamondRankImg, 'Zümrüt': emeraldRankImg, 'Endless': endlessRankImg };
  const RankIcon = ({ rank, size = 16, className = '' }) => {
    const src = RANK_LOGOS[rank?.name];
    if (src) return <img src={src} alt={rank.name} style={{ height: size, width: 'auto', display: 'inline-block', verticalAlign: 'middle' }} className={className} />;
    return <Award style={{ width: size, height: size, color: rank?.color }} className={className} />;
  };

  // Fast select limits based on subscription
  const FAST_SELECT_LIMITS = { free: 3, plus: 5, pro: 8, creative_station: 8 };
  const fastSelectLimit = FAST_SELECT_LIMITS[userSubscription] || 3;

  // Enforce FastSelect limit when plan changes (downgrade) — gerçek abonelik
  // sunucudan gelmeden (userSubscription hâlâ varsayılan 'free') tetiklenirse
  // ücretli kullanıcının seçimleri yanlışlıkla 3'e düşürülüp kaydediliyordu
  useEffect(() => {
    if (!subscriptionLoadedRef.current) return;
    const limit = FAST_SELECT_LIMITS[userSubscription] || 3;
    if (fastSelectTools.length > limit) {
      const trimmed = fastSelectTools.slice(0, limit);
      setFastSelectTools(trimmed);
      savePreference('zet_fast_select', JSON.stringify(trimmed));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSubscription, fastSelectTools.length]);

  // Auth sonrası server'dan gelen tercihler (FastSelect, kısayollar) state'e işlenir
  useEffect(() => {
    const onPrefsLoaded = (e) => {
      if (e.detail['zet_fast_select']) {
        try { setFastSelectTools(JSON.parse(e.detail['zet_fast_select'])); } catch {}
      }
      if (e.detail['zet_shortcuts']) {
        try { setShortcuts(JSON.parse(e.detail['zet_shortcuts'])); } catch {}
      }
    };
    window.addEventListener('zet:preferences-loaded', onPrefsLoaded);
    return () => window.removeEventListener('zet:preferences-loaded', onPrefsLoaded);
  }, []);

  // Subscription plans data - ordered from biggest to smallest
  const ZP_PLAN_COSTS = { plus: 10000, pro: 30000, creative_station: 50000 };
  const SUBSCRIPTION_PLANS = [
    {
      id: 'plus',
      name: 'Plus',
      monthlyPrice: 9.99,
      yearlyPrice: 99,
      zpCost: 10000,
      scope: 'mindshare',
      scopeLabel: 'scopeOnlyMindshare',
      features: [
        'feat250Credits',
        'feat480kToken',
        'featAllToolsOpen',
        'feat10nb5fs',
        'featJudgeAzizModel',
        'feat20GBDrive',
        'feat40pctCase10',
      ],
      color: '#3b82f6',
      recommended: false
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 19.99,
      yearlyPrice: 199,
      zpCost: 30000,
      scope: 'mindshare',
      scopeLabel: 'scopeOnlyMindshare',
      features: [
        'feat500Credits',
        'feat1300kToken',
        'featNanoBananaPro',
        'feat8fs50GBDrive',
        'featNoWatermark',
        'feat60pctCase20',
        'featPrioritySupport',
      ],
      color: '#8b5cf6',
      recommended: true
    },
    {
      id: 'creative_station',
      name: 'Creative Station',
      monthlyPrice: 49,
      yearlyPrice: 490,
      zpCost: 50000,
      scope: 'both',
      scopeLabel: 'scopeFullCoverage',
      features: [
        'feat4000Credits',
        'feat4800kToken',
        'feat1TBDrive',
        'featGuaranteedCase30',
        'featPrioritySupport',
      ],
      color: '#f59e0b',
      recommended: false
    },
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
      alert(`${title}\n${message}`);
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
    // Sezon bilgisi çek + gösterilmemiş sezon sonucu var mı kontrol et
    axios.get(`${API}/season`, { withCredentials: true })
      .then(res => setSeasonData(res.data)).catch(() => {});
    axios.get(`${API}/season/my-result`, { withCredentials: true })
      .then(res => { if (res.data.has_result) setSeasonResult(res.data); })
      .catch(() => {});
    // Envanter yükle + günlük kasayı al
    axios.get(`${API}/inventory`, { withCredentials: true })
      .then(res => setInventory(res.data.cases || [])).catch(() => {});
    axios.post(`${API}/inventory/claim-daily`, {}, { withCredentials: true })
      .then(res => {
        if (res.data.claimed) {
          setInventory(prev => [...prev, res.data.case]);
          const isWheel = res.data.case?.type === 'daily_wheel';
          showToast(isWheel ? t('wheelReady') : t('caseReady'), 'success');
        }
      }).catch(() => {});
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
    const interval = setInterval(fetchNotes, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (documents.length > 0 && !docsAnimatedRef.current) {
      docsAnimatedRef.current = true;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        scatterFromCenter(docsGridRef.current);
      }));
    }
  }, [documents.length]);

  useEffect(() => {
    if (activeTab === 'notes' && !notesAnimatedRef.current) {
      notesAnimatedRef.current = true;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const el = notesListRef.current;
        if (!el) return;
        const items = Array.from(el.children);
        if (items.length === 0) return;
        items.forEach(item => {
          item.style.transition = 'none';
          item.style.transform = 'translateY(48px)';
          item.style.opacity = '0';
          item.style.willChange = 'transform,opacity';
        });
        el.offsetHeight;
        items.forEach((item, i) => {
          setTimeout(() => {
            item.style.transition = 'transform 0.44s cubic-bezier(0.22,1,0.36,1), opacity 0.28s ease';
            item.style.transform = '';
            item.style.opacity = '';
          }, i * 68);
        });
        setTimeout(() => items.forEach(item => { item.style.willChange = ''; }), items.length * 68 + 480);
      }));
    }
    if (activeTab !== 'notes') notesAnimatedRef.current = false;
  }, [activeTab]);

  useEffect(() => {
    if (showSettings && !settingsAnimatedRef.current) {
      settingsAnimatedRef.current = true;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const el = settingsSidebarRef.current;
        if (!el) return;
        const items = Array.from(el.children);
        if (items.length === 0) return;
        items.forEach(item => {
          item.style.transition = 'none';
          item.style.transform = 'translateX(52px)';
          item.style.opacity = '0';
          item.style.willChange = 'transform,opacity';
        });
        el.offsetHeight;
        items.forEach((item, i) => {
          setTimeout(() => {
            item.style.transition = 'transform 0.38s cubic-bezier(0.22,1,0.36,1), opacity 0.22s ease';
            item.style.transform = '';
            item.style.opacity = '';
          }, i * 44);
        });
        setTimeout(() => items.forEach(item => { item.style.willChange = ''; }), items.length * 44 + 420);
      }));
    }
    if (!showSettings) settingsAnimatedRef.current = false;
  }, [showSettings]);

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

  // Her 60sn'de sunucudan doğru active_time_seconds çek
  useEffect(() => {
    const tick = () => {
      if (document.hidden) return;
      axios.get(`${API}/quests/progress`, { withCredentials: true })
        .then(res => { setActiveTimeSeconds(res.data.active_time_seconds || 0); })
        .catch(() => {});
    };
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  // Yerel session sayacı — ref her saniye artar, state dakikada bir güncellenir
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) {
        sessionSecondsRef.current += 1;
        if (sessionSecondsRef.current % 60 === 0) {
          setSessionSeconds(sessionSecondsRef.current);
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Infinite scroll — belgeler için
  useEffect(() => {
    const el = docsBottomRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMoreDocs();
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [docsHasMore]);

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
      showNotification('ZET Hatırlatıcı', n.content?.slice(0, 100) || 'Bir hatırlatıcınız var');
    });
  }, [notes, alarmTick]);

  const fetchSubscription = async () => {
    const [subRes, spRes] = await Promise.allSettled([
      axios.get(`${API}/subscription`, { withCredentials: true }),
      axios.get(`${API}/quests/progress`, { withCredentials: true }),
    ]);
    if (subRes.status === 'fulfilled') setUserSubscription(subRes.value.data.plan || 'free');
    else setUserSubscription('free');
    subscriptionLoadedRef.current = true;
    if (spRes.status === 'fulfilled') {
      setUserZP(spRes.value.data.quest_xp || 0);
      setActiveTimeSeconds(spRes.value.data.active_time_seconds || 0);
      setCompletedQuestCount((spRes.value.data.completed_quests || []).length);
    }
  };

  const handleSubscribe = async (planId) => {
    setSubscribing(true);
    try {
      const ok = openPaddleCheckout({ plan: planId, billingCycle, userEmail: user?.email, userId: user?.user_id });
      if (!ok) throw new Error('Paddle yüklenemedi. Sayfayı yenileyip tekrar deneyin.');
    } catch (err) {
      showToast(err?.message || 'Ödeme sayfası açılamadı', 'error');
    } finally {
      setSubscribing(false);
    }
  };

  useEffect(() => {
    if (showSettings && (settingsTab === 'credits' || settingsTab === 'magaza') && creditPackages.length === 0) {
      fetchCreditPackages();
    }
    if (showSettings && settingsTab === 'ai') {
      loadZetaMemories();
    }
    if (showSettings && settingsTab === 'primedrive') {
      loadDriveFiles();
    }
  }, [showSettings, settingsTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hafizz uyarıları — kullanıcıya gösterilmemiş uyarılar
  useEffect(() => {
    if (!user) return;
    axios.get(`${API}/me/warnings`, { withCredentials: true })
      .then(r => { if (r.data.warnings?.length) setActiveWarnings(r.data.warnings); })
      .catch(() => {});
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Onboarding — yeni kullanıcı için zorunlu bilgi ekranı
  useEffect(() => {
    if (user && user.needs_onboarding) {
      setObUsername(user.username || '');
      setObDisplayName(user.name || '');
      setShowOnboarding(true);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitOnboarding = async () => {
    if (!obUsername.trim() || !obDisplayName.trim()) {
      setObError('Kullanıcı adı ve görünen isim zorunludur.');
      return;
    }
    setObSubmitting(true);
    setObError('');
    try {
      await axios.patch(`${API}/users/me`, {
        username: obUsername.trim(),
        display_name: obDisplayName.trim(),
        complete_onboarding: true,
      }, { withCredentials: true });
      updateUser({ needs_onboarding: false, username: obUsername.trim(), display_name: obDisplayName.trim() });
      setShowOnboarding(false);
    } catch (err) {
      setObError(err.response?.data?.detail || 'Bir hata oluştu, tekrar deneyin.');
    }
    setObSubmitting(false);
  };

  const fetchCreditPackages = async () => {
    try {
      const res = await axios.get(`${API}/credits/packages`, { withCredentials: true });
      setCreditPackages(res.data.packages || []);
    } catch { /* ignore */ }
  };

  const handleBuyCredits = async (packageId) => {
    setBuyingCredits(true);
    try {
      const res = await axios.post(`${API}/credits/checkout`, { package_id: packageId }, { withCredentials: true });
      openCheckoutOverlay(res.data.checkout_url);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Ödeme sayfası açılamadı', 'error');
    }
    setBuyingCredits(false);
  };


  const handleBuyWithSP = async (planId) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return;
    if (userZP < plan.zpCost) {
      showToast(`Yetersiz ZP! Gerekli: ${plan.zpCost.toLocaleString()} ZP, Mevcut: ${userZP.toLocaleString()} ZP`, 'error');
      return;
    }
    showConfirm(
      t('zpBuyTitle'),
      `${plan.zpCost.toLocaleString()} ZP harcayarak ${plan.name} planına yükselmek istiyor musunuz?\n\nMevcut ZP: ${userZP.toLocaleString()}\nKalan ZP: ${(userZP - plan.zpCost).toLocaleString()}`,
      async () => {
        setSubscribing(true);
        try {
          const res = await axios.post(`${API}/subscription/buy-with-sp`, { plan: planId }, { withCredentials: true });
          setUserSubscription(res.data.plan);
          setUserZP(res.data.remaining_sp);
          showToast(`${plan.name} planına ${plan.zpCost.toLocaleString()} ZP ile yükseltildiniz!`, 'success');
        } catch (err) {
          showToast(err.response?.data?.detail || 'ZP ile satın alma başarısız', 'error');
        }
        setSubscribing(false);
      }
    );
  };

  const playSfx = (file) => {
    if (!sfxEnabled) return;
    try { const a = new Audio(`/sounds/${file}`); a.volume = sfxVolume; a.play().catch(() => {}); } catch (_) {}
  };

  const handleCancelSubscription = async () => {
    const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === userSubscription);
    const featuresList = currentPlan ? currentPlan.features.slice(0, 4).map(f => t(f)).join(', ') : '';
    showConfirm(
      t('cancelPlanTitle'),
      t('cancelPlanMsg').replace('{plan}', currentPlan?.name || userSubscription.toUpperCase()).replace('{features}', featuresList),
      async () => {
        setSubscribing(true);
        try {
          const res = await axios.post(`${API}/subscription`, { plan: 'free', action: 'cancel' }, { withCredentials: true });
          if (res.data.cancel_pending) {
            showToast(t('cancelEmailSent'), 'info');
          } else {
            setUserSubscription('free');
            const newTools = fastSelectTools.slice(0, 3);
            setFastSelectTools(newTools);
            savePreference('zet_fast_select', JSON.stringify(newTools));
            showToast(t('subscriptionCancelled'), 'info');
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

  const migrateDocsFromServer = async () => {
    if (localStorage.getItem('zet_local_migration_done')) return;
    try {
      const res = await axios.get(`${API}/documents?skip=0&limit=500`, { withCredentials: true });
      if (res.data && res.data.length > 0) {
        for (const doc of res.data) {
          // Liste endpoint'i pages'i döndürmüyor — sadece metadata kaydet, pages'e dokunma
          await saveDoc({ ...doc, pages: undefined, updated_at: doc.updated_at || new Date().toISOString() });
        }
      }
      localStorage.setItem('zet_local_migration_done', '1');
    } catch {}
  };

  const fetchData = async () => {
    await migrateDocsFromServer();
    try {
      const [localDocs, notesRes] = await Promise.all([
        getAllDocs(),
        axios.get(`${API}/notes`, { withCredentials: true })
      ]);
      setDocuments(localDocs);
      setDocsHasMore(false);
      setNotes(notesRes.data);
      try {
        const notesMeta = notesRes.data.map(({ note_id, content, updated_at, reminder_time, reminder_sent, notebook_id }) => ({ note_id, content: (content || '').slice(0, 200), updated_at, reminder_time, reminder_sent, notebook_id }));
        localStorage.setItem('zet_notes_cache', JSON.stringify(notesMeta));
      } catch {}
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
    try {
      const notebooksRes = await axios.get(`${API}/notebooks`, { withCredentials: true });
      const nbs = notebooksRes.data.map(nb => ({ ...nb, has_password: !!nb.password_hash }));
      setNotebooks(nbs);
    } catch (error) {
      console.error('Error fetching notebooks:', error);
    }
    try {
      const filesRes = await axios.get(`${API}/doc-files`, { withCredentials: true });
      setDocFiles(filesRes.data);
    } catch (error) {
      console.error('Error fetching doc files:', error);
    }
  };

  const loadMoreDocs = async () => {
    // Tüm belgeler IndexedDB'den zaten yüklendi, pagination yok
    if (docsLoadingMoreRef.current) return;
    docsLoadingMoreRef.current = false;
  };

  const createDocFile = async () => {
    if (!newFileName.trim()) return;
    try {
      const res = await axios.post(`${API}/doc-files`, { name: newFileName.trim() }, { withCredentials: true });
      setDocFiles(prev => [res.data, ...prev]);
      setNewFileName('');
      setShowNewFile(false);
    } catch (error) {
      showToast('Dosya oluşturulamadı', 'error');
    }
  };

  const deleteDocFile = async (fileId) => {
    try {
      await axios.delete(`${API}/doc-files/${fileId}`, { withCredentials: true });
      setDocFiles(prev => prev.filter(f => f.file_id !== fileId));
      setDocuments(prev => prev.map(d => d.file_id === fileId ? { ...d, file_id: undefined } : d));
      if (activeDocFile?.file_id === fileId) setActiveDocFile(null);
    } catch {
      showToast('Dosya silinemedi', 'error');
    }
  };

  const renameDocFile = async (fileId, name) => {
    if (!name.trim()) return;
    try {
      await axios.put(`${API}/doc-files/${fileId}`, { name: name.trim() }, { withCredentials: true });
      setDocFiles(prev => prev.map(f => f.file_id === fileId ? { ...f, name: name.trim() } : f));
      if (activeDocFile?.file_id === fileId) setActiveDocFile(prev => ({ ...prev, name: name.trim() }));
    } catch {
      showToast('Yeniden adlandırılamadı', 'error');
    }
    setRenamingFileId(null);
    setRenamingFileName('');
  };

  const executeImport = async () => {
    if (!importMode || importMode.selectedDocIds.size === 0) return;
    const { fileId, selectedDocIds } = importMode;
    const docIdList = Array.from(selectedDocIds);
    setImportProgress({ current: 0, total: docIdList.length });

    try {
      let completed = 0;
      for (const docId of docIdList) {
        await updateDocField(docId, { file_id: fileId });
        completed++;
        setImportProgress({ current: completed, total: docIdList.length });
      }
      setDocuments(prev => prev.map(d => selectedDocIds.has(d.doc_id) ? { ...d, file_id: fileId } : d));
      setDocFiles(prev => prev.map(f => {
        if (f.file_id !== fileId) return f;
        const newIds = Array.from(new Set([...(f.document_ids || []), ...docIdList]));
        return { ...f, document_ids: newIds };
      }));
      showToast(`${completed} belge aktarıldı`, 'success');
    } catch (e) {
      const msg = e.response?.data?.detail || 'Aktarım başarısız';
      showToast(msg, 'error');
    }

    setImportProgress(null);
    setImportMode(null);
  };

  const removeDocFromFile = async (docId, fileId) => {
    try {
      await axios.post(`${API}/doc-files/${fileId}/remove-doc`, { doc_id: docId }, { withCredentials: true });
      setDocuments(prev => prev.map(d => d.doc_id === docId ? { ...d, file_id: undefined } : d));
      setDocFiles(prev => prev.map(f => f.file_id !== fileId ? f : { ...f, document_ids: (f.document_ids || []).filter(id => id !== docId) }));
    } catch {
      showToast('Belgeden çıkarılamadı', 'error');
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

  const pinNotebook = async (nb) => {
    const newPinned = !nb.pinned;
    try {
      await axios.put(`${API}/notebooks/${nb.notebook_id}`, { pinned: newPinned }, { withCredentials: true });
      setNotebooks(prev => {
        const updated = prev.map(n => n.notebook_id === nb.notebook_id ? { ...n, pinned: newPinned } : n);
        return sortNotebooks(updated);
      });
    } catch (err) {
      console.error('Sabitleme hatası:', err?.response?.data?.detail || err.message);
    }
    setOpenMenuNotebookId(null);
  };

  const sortNotebooks = (arr) => {
    const pinned = arr.filter(n => n.pinned).sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    const normal = arr.filter(n => !n.pinned).sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    return [...pinned, ...normal];
  };

  const moveNotebook = async (notebookId, direction) => {
    setNotebooks(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(n => n.notebook_id === notebookId);
      if (idx === -1) return prev;
      const item = arr[idx];
      const isPinned = item.pinned;
      // Only move within same pinned group
      const groupIndices = arr.reduce((acc, n, i) => { if (!!n.pinned === isPinned) acc.push(i); return acc; }, []);
      const posInGroup = groupIndices.indexOf(idx);
      if (direction === 'up' && posInGroup === 0) return prev;
      if (direction === 'down' && posInGroup === groupIndices.length - 1) return prev;
      const swapIdx = direction === 'up' ? groupIndices[posInGroup - 1] : groupIndices[posInGroup + 1];
      [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
      // Persist new order for both swapped items
      const newOrder = idx + 1;
      const swapOrder = swapIdx + 1;
      axios.put(`${API}/notebooks/${arr[idx].notebook_id}`, { order: newOrder }, { withCredentials: true }).catch(() => {});
      axios.put(`${API}/notebooks/${arr[swapIdx].notebook_id}`, { order: swapOrder }, { withCredentials: true }).catch(() => {});
      return arr;
    });
    setOpenMenuNotebookId(null);
  };

  const renameNotebook = async (notebookId, newName) => {
    if (!newName.trim()) return;
    try {
      await axios.put(`${API}/notebooks/${notebookId}`, { name: newName.trim() }, { withCredentials: true });
      setNotebooks(prev => prev.map(n => n.notebook_id === notebookId ? { ...n, name: newName.trim() } : n));
      if (activeNotebook?.notebook_id === notebookId) setActiveNotebook(prev => ({ ...prev, name: newName.trim() }));
    } catch {}
    setRenamingNotebookId(null);
    setRenamingNotebookName('');
  };

  const getLockoutTime = (failed) => {
    if (failed < 3) return 0;
    return 30 * Math.pow(2, failed - 3);
  };

  const handleNotebookPasswordSubmit = async () => {
    if (!notebookPasswordModal) return;
    const { mode, notebookId } = notebookPasswordModal;
    setNbPwError('');

    // Check lockout
    const lockUntil = nbLockoutUntil[notebookId] || 0;
    if (Date.now() < lockUntil) {
      setNbPwError(`Lütfen bekleyin...`);
      return;
    }

    const getErrorMsg = (err) => {
      const detail = err.response?.data?.detail;
      console.error('[NB-PW] Hata:', err.response?.status, detail, err.message);
      if (!err.response) return 'Sunucuya ulaşılamıyor. Backend çalışıyor mu?';
      if (err.response.status === 401) return 'Oturum süresi dolmuş. Sayfayı yenile.';
      if (err.response.status === 404) return 'Defter bulunamadı (404).';
      if (err.response.status === 403) return detail === 'Wrong password' ? 'Yanlış şifre' : `Erişim reddedildi: ${detail || ''}`;
      return detail ? `Hata: ${detail}` : `Sunucu hatası (${err.response.status})`;
    };

    if (mode === 'set') {
      if (nbPwInput.length < 4) { setNbPwError('Şifre en az 4 karakter olmalı'); return; }
      if (nbPwInput !== nbPwConfirm) { setNbPwError('Şifreler eşleşmiyor'); return; }
      setNbPwLoading(true);
      try {
        await axios.put(`${API}/notebooks/${notebookId}/password`, { password: nbPwInput }, { withCredentials: true });
        setNotebooks(prev => prev.map(n => n.notebook_id === notebookId ? { ...n, has_password: true } : n));
        showToast('Şifre başarıyla eklendi', 'success');
        setNotebookPasswordModal(null);
        setNbPwInput(''); setNbPwConfirm('');
      } catch (err) { setNbPwError(getErrorMsg(err)); }
      setNbPwLoading(false);
    } else if (mode === 'remove') {
      setNbPwLoading(true);
      try {
        await axios.delete(`${API}/notebooks/${notebookId}/password`, { data: { password: nbPwInput }, withCredentials: true });
        setNotebooks(prev => prev.map(n => n.notebook_id === notebookId ? { ...n, has_password: false, password_hash: undefined } : n));
        showToast('Şifre kaldırıldı', 'success');
        setNotebookPasswordModal(null);
        setNbPwInput('');
        setNbFailedAttempts(prev => ({ ...prev, [notebookId]: 0 }));
      } catch (err) {
        const failed = (nbFailedAttempts[notebookId] || 0) + 1;
        setNbFailedAttempts(prev => ({ ...prev, [notebookId]: failed }));
        const wait = getLockoutTime(failed);
        if (wait > 0) setNbLockoutUntil(prev => ({ ...prev, [notebookId]: Date.now() + wait * 1000 }));
        setNbPwError(getErrorMsg(err));
      }
      setNbPwLoading(false);
    } else if (mode === 'unlock') {
      setNbPwLoading(true);
      try {
        await axios.post(`${API}/notebooks/${notebookId}/verify-password`, { password: nbPwInput }, { withCredentials: true });
        setUnlockedNotebooks(prev => ({ ...prev, [notebookId]: true }));
        setNbFailedAttempts(prev => ({ ...prev, [notebookId]: 0 }));
        setNotebookPasswordModal(null);
        setNbPwInput('');
        // Open notebook after unlock
        const nb = notebooks.find(n => n.notebook_id === notebookId);
        if (nb) setActiveNotebook(nb);
      } catch (err) {
        const failed = (nbFailedAttempts[notebookId] || 0) + 1;
        setNbFailedAttempts(prev => ({ ...prev, [notebookId]: failed }));
        const wait = getLockoutTime(failed);
        if (wait > 0) setNbLockoutUntil(prev => ({ ...prev, [notebookId]: Date.now() + wait * 1000 }));
        setNbPwError(getErrorMsg(err));
      }
      setNbPwLoading(false);
    }
  };

  // Lockout countdown tick
  useEffect(() => {
    const i = setInterval(() => setNbLockoutTick(t => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const loadZetaMemories = async () => {
    setMemoriesLoading(true);
    try {
      const res = await axios.get(`${API}/zeta/memory`, { withCredentials: true });
      setZetaMemories(res.data || []);
    } catch {}
    setMemoriesLoading(false);
  };

  const deleteZetaMemory = async (memoryId) => {
    try {
      await axios.delete(`${API}/zeta/memory/${memoryId}`, { withCredentials: true });
      setZetaMemories(prev => prev.filter(m => m.memory_id !== memoryId));
    } catch {}
  };

  const deleteAllZetaMemories = async () => {
    showConfirm(t('clearMemoriesTitle'), t('clearMemoriesMsg'), async () => {
      try {
        await Promise.all(zetaMemories.map(m => axios.delete(`${API}/zeta/memory/${m.memory_id}`, { withCredentials: true })));
        setZetaMemories([]);
        showToast(t('memoriesCleared'), 'success');
      } catch { showToast('Hata oluştu', 'error'); }
    }, true);
  };

  const addZetaMemory = async () => {
    if (!newMemoryInput.trim()) return;
    try {
      const res = await axios.post(`${API}/zeta/memory`, { content: newMemoryInput.trim() }, { withCredentials: true });
      setZetaMemories(prev => [res.data, ...prev]);
      setNewMemoryInput('');
      questService.fireCounter('memories_added', 1);
      showToast('Bellek eklendi', 'success');
    } catch (err) {
      const msg = err?.response?.data?.detail;
      showToast(msg || 'Bellek eklenemedi', 'error');
    }
  };

  const loadDriveFiles = async () => {
    setDriveLoading(true);
    try {
      const res = await axios.get(`${API}/drive/files`, { withCredentials: true });
      setDriveFiles(res.data.files || []);
      setDriveUsed(res.data.used_bytes || 0);
    } catch {}
    setDriveLoading(false);
  };

  const uploadDriveFile = async (file) => {
    setDriveUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API}/drive/upload`, formData, { withCredentials: true });
      setDriveFiles(prev => [res.data, ...prev]);
      setDriveUsed(prev => prev + res.data.size);
      showToast(`${file.name} yüklendi`, 'success');
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Yükleme başarısız', 'error');
    }
    setDriveUploading(false);
  };

  const deleteDriveFile = async (fileId, size) => {
    try {
      await axios.delete(`${API}/drive/files/${fileId}`, { withCredentials: true });
      setDriveFiles(prev => prev.filter(f => f.file_id !== fileId));
      setDriveUsed(prev => Math.max(0, prev - size));
      showToast('Dosya silindi', 'success');
    } catch { showToast('Silinemedi', 'error'); }
  };

  const downloadDriveFile = async (fileId, name) => {
    try {
      const res = await axios.get(`${API}/drive/files/${fileId}/url`, { withCredentials: true });
      const a = document.createElement('a');
      a.href = res.data.url;
      a.download = name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch { showToast('İndirme başarısız', 'error'); }
  };

  const uploadDocToDrive = async (doc) => {
    try {
      showToast('Drive\'a yükleniyor...', 'info');
      let jsonStr;
      try { jsonStr = JSON.stringify(doc); } catch { showToast('Belge serileştirilemedi', 'error'); return; }
      const blob = new Blob([jsonStr], { type: 'application/json' });
      if (blob.size > 200 * 1024 * 1024) { showToast('Belge 200 MB sınırını aşıyor, yüklenemiyor', 'error'); return; }
      const file = new File([blob], `${doc.doc_id}.zetdoc`, { type: 'application/json' });
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API}/drive/upload`, formData, { withCredentials: true });
      setDriveFiles(prev => [res.data, ...prev.filter(f => f.name !== `${doc.doc_id}.zetdoc`)]);
      setDriveUsed(prev => prev + res.data.size);
      const updated = [...primeDriveDocs.filter(d => d.id !== doc.doc_id), { id: doc.doc_id, title: doc.title, size: res.data.size, addedAt: Date.now(), type: 'document' }];
      setPrimeDriveDocs(updated);
      localStorage.setItem('prime_drive_docs', JSON.stringify(updated));
      showToast(t('primeDriveAdded'), 'success');
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Drive yükleme başarısız', 'error');
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
      setZetaAnalysis({ noteId: note.note_id, loading: false, result: res.data.response, sources: res.data.sources || [] });
      try { const a = new Audio('/sounds/confirm.wav'); a.volume = 0.5; a.play().catch(() => {}); } catch (_) {}
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
    setCreatingDoc(true);
    try {
      const docId = generateDocId();
      const now = new Date().toISOString();
      const newDoc = {
        doc_id: docId,
        user_id: user?.user_id || 'local',
        title,
        subtitle: null,
        content: null,
        pages: [{ page_id: 'page_1', elements: [], drawPaths: [] }],
        settings: null,
        mindmap: null,
        doc_type: newDocType === 'pdf' ? 'pdf_edit' : 'document',
        created_at: now,
        updated_at: now,
        pinned: false,
        tags: [],
        file_id: null,
      };
      await saveDoc(newDoc);
      setDocuments(prev => [newDoc, ...prev]);
      questService.fireCounter('notes_created', 1);

      // PDF: extract text client-side and save pages before navigating
      if (newDocType === 'pdf' && window.__zetPdfFile) {
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

          // CEO/admin get unlimited pages, otherwise plan-based limits
          const isCEO = localStorage.getItem('zet_ceo_mode') === 'true';
          const isAdmin = localStorage.getItem('zet_admin_mode') === 'true';
          const PDF_PAGE_LIMITS = { free: 20, plus: 50, pro: 100, creative_station: Infinity };
          const pageLimit = (isCEO || isAdmin) ? Infinity : (PDF_PAGE_LIMITS[userSubscription] ?? 20);

          const arrayBuffer = await window.__zetPdfFile.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const numPages = Math.min(pdf.numPages, pageLimit);
          const canvasPages = [];
          const t = Date.now();
          const { OPS, Util, ImageKind } = pdfjsLib;
          const MAX_IMG_DIM = 1600;

          const escapePdfHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

          // PDF font adını web-safe bir aileye eşler (Editor.js importPDF ile aynı mantık)
          const resolvePdfFont = (fontName) => {
            if (!fontName) return 'Arial';
            const fn = fontName.toLowerCase();
            if (fn.includes('courier')) return 'Courier New';
            if (fn.includes('times')) return 'Times New Roman';
            if (fn.includes('helvetica') || fn.includes('arial')) return 'Arial';
            if (fn.includes('calibri')) return 'Calibri';
            if (fn.includes('georgia')) return 'Georgia';
            return 'Arial';
          };

          // Bir XObject resmini page.objs'tan PNG/JPEG data URL'e çevirir (boyutu sınırlar)
          const decodeImageObj = async (page, objId) => {
            const imgData = await new Promise((resolve) => {
              let settled = false;
              const timer = setTimeout(() => { if (!settled) { settled = true; resolve(null); } }, 2500);
              try {
                page.objs.get(objId, (data) => {
                  if (!settled) { settled = true; clearTimeout(timer); resolve(data); }
                });
              } catch { if (!settled) { settled = true; clearTimeout(timer); resolve(null); } }
            });
            if (!imgData || !imgData.width || !imgData.height) return null;

            const srcCanvas = window.document.createElement('canvas');
            srcCanvas.width = imgData.width;
            srcCanvas.height = imgData.height;
            const sctx = srcCanvas.getContext('2d');
            if (imgData.bitmap) {
              sctx.drawImage(imgData.bitmap, 0, 0);
            } else if (imgData.data) {
              const out = sctx.createImageData(imgData.width, imgData.height);
              const src = imgData.data;
              if (imgData.kind === ImageKind.RGBA_32BPP || src.length === imgData.width * imgData.height * 4) {
                out.data.set(src);
              } else if (imgData.kind === ImageKind.RGB_24BPP || src.length === imgData.width * imgData.height * 3) {
                for (let p = 0, q = 0; p < src.length; p += 3, q += 4) {
                  out.data[q] = src[p]; out.data[q + 1] = src[p + 1]; out.data[q + 2] = src[p + 2]; out.data[q + 3] = 255;
                }
              } else {
                return null;
              }
              sctx.putImageData(out, 0, 0);
            } else {
              return null;
            }

            let outW = imgData.width;
            let outH = imgData.height;
            if (outW > MAX_IMG_DIM || outH > MAX_IMG_DIM) {
              const ratio = Math.min(MAX_IMG_DIM / outW, MAX_IMG_DIM / outH);
              outW = Math.round(outW * ratio);
              outH = Math.round(outH * ratio);
            }
            const outCanvas = window.document.createElement('canvas');
            outCanvas.width = outW;
            outCanvas.height = outH;
            outCanvas.getContext('2d').drawImage(srcCanvas, 0, 0, outW, outH);
            return outCanvas.toDataURL('image/jpeg', 0.85);
          };

          for (let i = 1; i <= numPages; i++) {
            try {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 1 });
              const renderScale = Math.min(794 / viewport.width, 1123 / viewport.height);
              const pageHeightPts = viewport.height;

              const textContent = await page.getTextContent();

              // Metni satır satır işle — her satırın font ailesi, punto boyutu ve x konumu (girinti) korunur
              const pdfLines = [];
              let curLine = null;
              for (const item of textContent.items) {
                if (!('str' in item)) continue;
                const x = item.transform[4];
                const y = item.transform[5];
                const sizePts = Math.hypot(item.transform[2], item.transform[3]) || 10;
                const fontName = textContent.styles?.[item.fontName]?.fontFamily || item.fontName || null;
                if (!curLine || Math.abs(y - curLine.y) > 2) {
                  curLine = { text: '', x, y, sizePts, fontName };
                  pdfLines.push(curLine);
                }
                curLine.text += item.str;
                if (item.hasEOL && curLine.text && !curLine.text.endsWith(' ')) curLine.text += ' ';
              }
              const nonEmptyLines = pdfLines.map(l => ({ ...l, text: l.text.trim() })).filter(l => l.text);
              const pageText = nonEmptyLines.map(l => l.text).join('\n');

              // Baskın font/punto (eleman varsayılanı için ilk satırdan)
              const pdfFont = resolvePdfFont(nonEmptyLines[0]?.fontName);
              const pdfFontSize = nonEmptyLines.length ? Math.max(8, Math.round(nonEmptyLines[0].sizePts * renderScale)) : 14;

              // Satır satır stilli HTML — font ailesi, punto, girinti (x farkı) ve paragraf boşluğu korunur
              const baseX = nonEmptyLines.length ? Math.min(...nonEmptyLines.map(l => l.x)) : 0;
              let prevLine = null;
              let richHtml = '';
              for (const line of nonEmptyLines) {
                const sizePx = Math.max(8, Math.round(line.sizePts * renderScale));
                const indentPx = Math.max(0, Math.round((line.x - baseX) * renderScale));
                const fam = resolvePdfFont(line.fontName);
                const gap = prevLine ? Math.abs(line.y - prevLine.y) : 0;
                const isNewParagraph = prevLine && gap > line.sizePts * 1.6;
                const marginTop = isNewParagraph ? Math.round(sizePx * 0.6) : 0;
                richHtml += `<div style="font-family:'${fam}';font-size:${sizePx}px;margin:${marginTop}px 0 0 ${indentPx}px">${escapePdfHtml(line.text)}</div>`;
                prevLine = line;
              }

              // Sayfadaki gömülü resimleri (XObject) konumlarıyla birlikte tespit et
              const opList = await page.getOperatorList();
              let curMatrix = [1, 0, 0, 1, 0, 0];
              const matrixStack = [];
              const foundImages = [];
              for (let k = 0; k < opList.fnArray.length; k++) {
                const fn = opList.fnArray[k];
                const args = opList.argsArray[k];
                if (fn === OPS.save) {
                  matrixStack.push(curMatrix);
                } else if (fn === OPS.restore) {
                  curMatrix = matrixStack.pop() || [1, 0, 0, 1, 0, 0];
                } else if (fn === OPS.transform) {
                  curMatrix = Util.transform(curMatrix, args);
                } else if (fn === OPS.paintImageXObject && typeof args[0] === 'string') {
                  foundImages.push({ objId: args[0], matrix: curMatrix });
                }
              }

              const imageEls = [];
              for (let imgIdx = 0; imgIdx < foundImages.length; imgIdx++) {
                const { objId, matrix: m } = foundImages[imgIdx];
                try {
                  const dataUrl = await decodeImageObj(page, objId);
                  if (!dataUrl) continue;
                  const corners = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => [
                    m[0] * x + m[2] * y + m[4],
                    m[1] * x + m[3] * y + m[5],
                  ]);
                  const xs = corners.map(c => c[0]);
                  const ys = corners.map(c => c[1]);
                  const minX = Math.min(...xs), maxX = Math.max(...xs);
                  const minY = Math.min(...ys), maxY = Math.max(...ys);
                  imageEls.push({
                    id: `el_pdf_${t}_${i}_img${imgIdx}`,
                    type: 'image',
                    x: Math.round(minX * renderScale),
                    y: Math.round((pageHeightPts - maxY) * renderScale),
                    width: Math.max(1, Math.round((maxX - minX) * renderScale)),
                    height: Math.max(1, Math.round((maxY - minY) * renderScale)),
                    src: dataUrl,
                  });
                } catch (imgErr) {
                  console.warn(`PDF page ${i} image ${imgIdx} extraction failed:`, imgErr);
                }
              }

              const textEls = pageText ? [{
                id: `el_pdf_${t}_${i}`,
                type: 'text', x: 40, y: 40,
                content: pageText,
                htmlContent: richHtml || pageText.replace(/\n/g, '<br>'),
                fontSize: pdfFontSize,
                fontFamily: pdfFont,
                color: '#000000',
                width: 714,
                lineHeight: 1.5,
                textAlign: 'left', bold: false, italic: false, underline: false,
              }] : [];

              canvasPages.push({
                page_id: i === 1 ? 'page_1' : `page_pdf_${t}_${i}`,
                elements: [...imageEls, ...textEls],
                drawPaths: [],
              });
            } catch (pageErr) {
              console.warn(`PDF page ${i} extraction failed:`, pageErr);
              canvasPages.push({ page_id: i === 1 ? 'page_1' : `page_pdf_${t}_${i}`, elements: [], drawPaths: [] });
            }
          }

          if (canvasPages.some(p => p.elements.length > 0)) {
            await saveDoc({ ...newDoc, pages: canvasPages, updated_at: new Date().toISOString() });
            setDocuments(prev => prev.map(d => d.doc_id === docId ? { ...d, pages: canvasPages } : d));
          }
        } catch (pdfErr) {
          console.error('PDF extraction failed:', pdfErr);
        }
        window.__zetPdfFile = null;
      }

      setShowNewDoc(false);
      setNewDocTitle('');
      setNewDocType('new');
      setPdfFile(null);
      axios.post(`${API}/quests/auto-check`, {}, { withCredentials: true }).then(r => {
        if (r.data.newly_pending?.length > 0) window.dispatchEvent(new CustomEvent('quest-completed', { detail: r.data.newly_pending }));
      }).catch(() => {});
      navigate(`/editor/${docId}`);
    } catch (error) {
      console.error('Error creating document:', error);
    } finally {
      setCreatingDoc(false);
    }
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      window.__zetPdfFile = file; // keep original File for later Editor import
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
      await deleteDoc(docId);
      setDocuments(docs => docs.filter(d => d.doc_id !== docId));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const fetchTrash = async () => {
    setTrashLoading(true);
    try {
      const res = await axios.get(`${API}/trash`, { withCredentials: true });
      setTrashDocs(res.data);
    } catch {}
    setTrashLoading(false);
  };

  const restoreDocument = async (docId) => {
    try {
      await axios.post(`${API}/trash/${docId}/restore`, {}, { withCredentials: true });
      setTrashDocs(prev => prev.filter(d => d.doc_id !== docId));
      fetchData();
    } catch {}
  };

  const permanentDelete = async (docId) => {
    try {
      await axios.delete(`${API}/trash/${docId}`, { withCredentials: true });
      setTrashDocs(prev => prev.filter(d => d.doc_id !== docId));
    } catch {}
  };

  const emptyTrash = async () => {
    try {
      await axios.delete(`${API}/trash`, { withCredentials: true });
      setTrashDocs([]);
    } catch {}
  };

  const renameDocument = async (docId, newTitle) => {
    if (!newTitle.trim()) return;
    try {
      await updateDocField(docId, { title: newTitle.trim() });
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
      await updateDocField(doc.doc_id, { pinned: newPinned });
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
        // Quill delta format (normal belgeler)
        const quillText = (p.content?.ops || []).map(op => (typeof op.insert === 'string' ? op.insert : '')).join('');
        if (quillText.trim()) return quillText;
        // PDF import: pageText alanı
        if (p.pageText) return p.pageText;
        // Canvas elements (tip=text)
        return (p.elements || []).filter(el => el.type === 'text').map(el => el.content || '').join('\n');
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

  const extractDocText = (docData) => {
    const pages = docData.pages || [];
    return pages.map(p => {
      const quillText = (p.content?.ops || []).map(op => typeof op.insert === 'string' ? op.insert : '').join('');
      if (quillText.trim()) return quillText;
      if (p.pageText) return p.pageText;
      return (p.elements || []).filter(el => el.type === 'text').map(el => el.content || '').join(' ');
    }).join(' ').trim();
  };

  const handleZetaSearch = async () => {
    if (!zetaSearchQuery.trim()) return;
    setZetaSearchLoading(true);
    setZetaSearchResults(null);
    try {
      let items = []; // [{index, id, title, type, snippet}]
      let context = '';

      if (activeTab === 'documents') {
        // Tüm belgelerin içeriğini çek (cache'den veya API'den)
        const allDocs = documents;
        const fetchResults = await Promise.allSettled(
          allDocs.map(d =>
            docContentsCache[d.doc_id]
              ? Promise.resolve({ data: { pages: [], _cached: docContentsCache[d.doc_id] } })
              : axios.get(`${API}/documents/${d.doc_id}`, { withCredentials: true })
          )
        );
        const newCache = { ...docContentsCache };
        items = allDocs.map((d, i) => {
          const res = fetchResults[i];
          let text = '';
          if (res.status === 'fulfilled') {
            if (res.value.data._cached) {
              text = res.value.data._cached;
            } else {
              text = extractDocText(res.value.data);
              newCache[d.doc_id] = text;
            }
          }
          return { index: i + 1, id: d.doc_id, title: d.title, type: 'document', snippet: text };
        });
        setDocContentsCache(newCache);
        context = items.map(it => `[${it.index}] "${it.title}": ${it.snippet.slice(0, 600)}`).join('\n\n');
      } else {
        const allNotes = notes.slice(0, 50);
        items = allNotes.map((n, i) => ({ index: i + 1, id: n.note_id, title: n.content.slice(0, 60), type: 'note', snippet: n.content }));
        context = items.map(it => `[${it.index}] ${it.snippet.slice(0, 200)}`).join('\n');
      }

      const prompt = `Kullanıcı şunu arıyor: "${zetaSearchQuery}"

${activeTab === 'documents' ? 'Belgeler' : 'Notlar'}:
${context}

En çok eşleşen sonuçları bul. Her eşleşme için "[N]" numarasını kullan. Kısa açıkla ve neden eşleştiğini belirt. Cevabın sonuna şu formatta bir JSON satırı ekle (başka yere koyma):
MATCHES:[1,3,5]`;

      const res = await axios.post(`${API}/zeta/chat`, { message: prompt }, { withCredentials: true });
      const raw = res.data.response || '';

      // Parse MATCHES:[...] satırını ayır
      const matchLine = raw.match(/MATCHES:\[([^\]]*)\]/);
      let matchedIndices = [];
      if (matchLine) {
        matchedIndices = matchLine[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      }
      const cleanText = raw.replace(/MATCHES:\[[^\]]*\]/, '').trim();
      const matches = matchedIndices
        .map(idx => items.find(it => it.index === idx))
        .filter(Boolean)
        .map(it => ({ id: it.id, title: it.title, type: it.type }));

      setZetaSearchResults({ text: cleanText, matches });
    } catch {
      setZetaSearchResults({ text: 'Arama sırasında bir hata oluştu.', matches: [] });
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

  const trashDaysRemaining = (deletedAt) => {
    const deleted = new Date(deletedAt);
    const expiresAt = deleted.getTime() + 30 * 24 * 60 * 60 * 1000;
    const remaining = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  };

  const filteredDocs = documents.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (d.title.toLowerCase().includes(q)) return true;
    const cached = docContentsCache[d.doc_id];
    if (cached && cached.toLowerCase().includes(q)) return true;
    return false;
  });

  // Belge içeriklerini arka planda yükle (normal arama için)
  useEffect(() => {
    if (activeTab !== 'documents' || !searchQuery || zetaSearch) return;
    const uncached = documents.filter(d => !docContentsCache[d.doc_id]);
    if (uncached.length === 0) return;
    setDocSearchLoading(true);
    Promise.allSettled(uncached.map(d => axios.get(`${API}/documents/${d.doc_id}`, { withCredentials: true })))
      .then(results => {
        setDocContentsCache(prev => {
          const next = { ...prev };
          uncached.forEach((d, i) => {
            if (results[i].status === 'fulfilled') next[d.doc_id] = extractDocText(results[i].value.data);
          });
          return next;
        });
      })
      .finally(() => setDocSearchLoading(false));
  }, [searchQuery, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    showConfirm(t('signOutTitle'), t('signOutMsg'), async () => {
      await logout();
      navigate('/login');
    });
  };

  const handleDeleteAccount = () => {
    showConfirm(
      t('deleteAccount'),
      t('deleteAccountMsg'),
      async () => {
        try {
          await axios.post(`${API}/auth/delete-account/request`, {}, { withCredentials: true });
          showToast(t('cancelEmailSent'), 'info');
        } catch {
          showToast('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
        }
      },
      true // danger
    );
  };

  const visibleNotes = [...notes.filter(n => !n.notebook_id && (!searchQuery || n.content.toLowerCase().includes(searchQuery.toLowerCase())))]
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const NOTEBOOK_MENU = (nb) => {
    const arr = notebooks.filter(n => !searchQuery || n.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const idx = arr.findIndex(n => n.notebook_id === nb.notebook_id);
    const isPinned = nb.pinned;
    const group = arr.filter(n => !!n.pinned === isPinned);
    const posInGroup = group.findIndex(n => n.notebook_id === nb.notebook_id);
    const isFirst = posInGroup === 0;
    const isLast = posInGroup === group.length - 1;
    const hasPassword = !!(nb.password_hash || nb.has_password);
    return [
      { icon: <ArrowUp className="h-4 w-4" />, label: t('moveUp'), disabled: isFirst, action: () => moveNotebook(nb.notebook_id, 'up') },
      { icon: <ArrowDown className="h-4 w-4" />, label: t('moveDown'), disabled: isLast, action: () => moveNotebook(nb.notebook_id, 'down') },
      { icon: <Pin className="h-4 w-4" style={{ color: isPinned ? '#f59e0b' : 'inherit' }} />, label: isPinned ? t('noteMenuUnpin') : t('noteMenuPin'), action: () => pinNotebook(nb) },
      { icon: <FileEdit className="h-4 w-4" />, label: t('renameItem'), action: () => { setRenamingNotebookId(nb.notebook_id); setRenamingNotebookName(nb.name); setOpenMenuNotebookId(null); } },
      { icon: <Lock className="h-4 w-4" />, label: hasPassword ? t('removePassword') : t('addPassword'), action: () => { setNotebookPasswordModal({ mode: hasPassword ? 'remove' : 'set', notebookId: nb.notebook_id, notebookName: nb.name }); setNbPwInput(''); setNbPwConfirm(''); setNbPwError(''); setOpenMenuNotebookId(null); } },
      { icon: <Trash2 className="h-4 w-4" />, label: t('deleteItem'), color: '#ef4444', action: () => { setConfirmDeleteNotebookId(nb.notebook_id); setOpenMenuNotebookId(null); } },
    ];
  };

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
                <ZetaTypingIndicator />
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#4ca8ad' }}><ZetaIcon size={12} color="#4ca8ad" /> {t('zetaSummary')}</span>
                    <button onClick={() => setZetaAnalysis({ noteId: null, loading: false, result: null })} className="p-0.5 rounded hover:bg-white/10">
                      <X className="h-3 w-3" style={{ color: 'var(--zet-text-muted)' }} />
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap break-words" style={{ color: 'var(--zet-text)' }}>{zetaAnalysis.result}</p>
                  {zetaAnalysis.sources && zetaAnalysis.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
                      <p className="text-xs mb-1" style={{ color: 'var(--zet-text-muted)' }}>Kaynaklar</p>
                      {zetaAnalysis.sources.map((s, si) => (
                        <a key={si} href={s.url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#4ca8ad', marginBottom: 3, textDecoration: 'none', cursor: 'pointer' }}>
                          <ExternalLink size={10} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title || s.url}</span>
                        </a>
                      ))}
                    </div>
                  )}
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

  if (loading) return <A4LoadingScreen />;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--zet-bg)' }}>
      <span className="fixed bottom-2 left-2 text-xs pointer-events-none select-none z-10" style={{ color: 'var(--zet-text-muted)', opacity: 0.4 }}>v26.07.25</span>
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed bottom-4 left-1/2 z-[500] -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-lg"
          style={{ background: isFreeOffline ? '#ef4444' : '#f59e0b', color: '#fff' }}>
          <span>📴</span>
          {isFreeOffline
            ? t('offlineFreePlan')
            : t('offlineWarning')}
        </div>
      )}
      {/* Onboarding Modal — zorunlu, kapatılamaz */}
      {showOnboarding && (
        <OnboardingModal
          obUsername={obUsername} setObUsername={setObUsername}
          obDisplayName={obDisplayName} setObDisplayName={setObDisplayName}
          obError={obError} obSubmitting={obSubmitting}
          submitOnboarding={submitOnboarding}
        />
      )}

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
            <span className="flex items-center px-1.5 py-0.5 rounded-full" style={{ background: `${currentRank.color}25`, border: `1px solid ${currentRank.color}50` }} data-testid="header-rank-badge">
              <RankIcon rank={currentRank} size={18} />
            </span>
          )}
          {user?.name && (
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: '1.25rem', fontWeight: 700, color: '#4ca8ad', letterSpacing: '0.01em' }}>
              Merhaba, {user.name.split(' ')[0]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowSettings(!showSettings); setMobileSettingsSidebar(true); }}
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
            {/* Left sidebar - full screen on mobile when sidebar open, hidden when content shown */}
            <div ref={settingsSidebarRef} className={`${mobileSettingsSidebar ? 'flex flex-col' : 'hidden'} md:flex md:flex-col w-full md:w-56 flex-shrink-0 border-r overflow-y-auto py-4 px-3`} style={{ borderColor: 'var(--zet-border)' }}>
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
                { id: 'primedrive',   icon: <HardDrive className="h-4 w-4" />,  label: 'Prime Drive',     color: '#6366f1' },
                { id: 'ranks',        icon: <RankIcon rank={currentRank} size={16} />, label: t('ranks'),         color: '#f59e0b' },
                { id: 'quests',       icon: <span className="relative inline-flex"><Map className="h-4 w-4" />{hasPendingQuests && <span style={{ position:'absolute', top:-3, right:-3, width:7, height:7, borderRadius:'50%', background:'#ef4444', border:'1.5px solid var(--zet-bg-card)' }} />}</span>, label: t('questMap'), color: '#4ca8ad' },
                { id: 'magaza',       icon: <CreditCard className="h-4 w-4" />, label: t('store'),         color: '#a78bfa' },
                { id: 'inventory',    icon: <Package className="h-4 w-4" />,    label: t('inventory'),     color: '#60a5fa' },
                { id: 'shortcuts',    icon: <Keyboard className="h-4 w-4" />,   label: t('shortcuts') },
                { id: 'fastselect',   icon: <Star className="h-4 w-4" />,       label: t('fastSelect') },
                { id: 'appswitcher',  icon: <LayoutGrid className="h-4 w-4" />, label: t('appSwitcher') },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { if (item.id === 'quests') { navigate('/quest-map'); setShowSettings(false); } else if (item.id === 'appswitcher') { navigate('/'); setShowSettings(false); } else { setSettingsTab(item.id); setMobileSettingsSidebar(false); } }}
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
                  <Trash2 className="h-4 w-4" /> {t('deleteAccount')}
                </button>
              </div>

              {/* Versiyon */}
              <div className="mt-auto pt-4 px-3">
                <span className="text-xs" style={{ color: 'var(--zet-text-muted)', opacity: 0.5 }}>v26.07.27</span>
              </div>
            </div>

            {/* Right content - hidden on mobile when sidebar shown */}
            <div className={`${mobileSettingsSidebar ? 'hidden' : 'flex flex-col'} md:flex md:flex-col flex-1 overflow-y-auto p-4 md:p-8`}>

              {/* Mobile back button */}
              <button
                className="md:hidden flex items-center gap-2 mb-4 text-sm font-medium"
                style={{ color: 'var(--zet-text-muted)' }}
                onClick={() => setMobileSettingsSidebar(true)}
              >
                <ChevronLeft className="h-4 w-4" /> Geri
              </button>

              <div key={settingsTab} className="animate-slideIn flex-1">
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
                        onClick={() => { setEditName(user?.name || ''); setEditUsername(user?.username || ''); setEditBio(user?.bio || ''); setSettingsTab('profile'); }}
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

                  {/* Ses Efektleri */}
                  <div className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--zet-text-muted)' }}>Ses Efektleri</p>
                    <div className="p-4 rounded-xl" style={{ background: 'var(--zet-bg-card)' }}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm" style={{ color: 'var(--zet-text)' }}>Ses efektleri</span>
                        <button
                          onClick={() => { const v = !sfxEnabled; setSfxEnabled(v); localStorage.setItem('zet_sfx_enabled', v); }}
                          className="relative w-10 h-5 rounded-full transition-colors"
                          style={{ background: sfxEnabled ? 'var(--zet-primary)' : 'rgba(255,255,255,0.15)' }}
                        >
                          <span className="absolute top-0.5 transition-all w-4 h-4 rounded-full bg-white" style={{ left: sfxEnabled ? '1.25rem' : '0.125rem' }} />
                        </button>
                      </div>
                      {sfxEnabled && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs w-12" style={{ color: 'var(--zet-text-muted)' }}>Ses: {Math.round(sfxVolume * 100)}%</span>
                          <input
                            type="range" min="0" max="1" step="0.05" value={sfxVolume}
                            onChange={(e) => { const v = parseFloat(e.target.value); setSfxVolume(v); localStorage.setItem('zet_sfx_volume', v); }}
                            className="flex-1 accent-[var(--zet-primary)]"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Görsel Efektler */}
                  {userSubscription !== 'free' && (
                    <div className="mb-8">
                      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--zet-text-muted)' }}>{t('visualEffects')}</p>
                      <div className="p-4 rounded-xl" style={{ background: 'var(--zet-bg-card)' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: 'var(--zet-text)' }}>{t('hoverGradientAnim')}</span>
                          <button
                            onClick={() => { const v = !gradientAnimEnabled; setGradientAnimEnabled(v); localStorage.setItem('zet_gradient_anim', v); localStorage.setItem('zet_gradient_anim_plan', userSubscription); }}
                            className="relative w-10 h-5 rounded-full transition-colors"
                            style={{ background: gradientAnimEnabled ? 'var(--zet-primary)' : 'rgba(255,255,255,0.15)' }}
                          >
                            <span className="absolute top-0.5 transition-all w-4 h-4 rounded-full bg-white" style={{ left: gradientAnimEnabled ? '1.25rem' : '0.125rem' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Plan */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--zet-text-muted)' }}>{t('plan')}</p>
                    <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'var(--zet-bg-card)' }}>
                      <span style={{ color: 'var(--zet-text)' }}>{t('currentPlan')}</span>
                      <span className="font-bold text-lg" style={{ color: userSubscription === 'creative_station' ? '#f59e0b' : userSubscription === 'pro' ? '#8b5cf6' : userSubscription === 'plus' ? '#3b82f6' : 'var(--zet-text-muted)' }}>
                        {userSubscription === 'creative_station' ? 'ZET Creative Station' : userSubscription === 'free' ? t('freePrice') : userSubscription.charAt(0).toUpperCase() + userSubscription.slice(1)}
                      </span>
                    </div>
                    {userSubscription !== 'free' && (
                      <>
                        <button
                          onClick={() => setShowPlanFeatures(true)}
                          className="mt-2 w-full py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                          style={{ background: userSubscription === 'creative_station' ? 'rgba(245,158,11,0.1)' : userSubscription === 'pro' ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)', color: userSubscription === 'creative_station' ? '#f59e0b' : userSubscription === 'pro' ? '#8b5cf6' : '#3b82f6', border: '1px solid currentColor', borderColor: userSubscription === 'creative_station' ? 'rgba(245,158,11,0.25)' : userSubscription === 'pro' ? 'rgba(139,92,246,0.25)' : 'rgba(59,130,246,0.25)' }}
                        >
                          {t('whatDoIGet')}
                        </button>
                        <button onClick={handleCancelSubscription} disabled={subscribing} className="mt-1 text-sm text-red-400 hover:text-red-300 w-full text-center py-2">
                          {t('cancelSubscription')}
                        </button>
                      </>
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
                      <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{t('changePhoto')}</span>
                    </div>
                    {/* Görünen İsim */}
                    <div>
                      <label className="text-sm block mb-1" style={{ color: 'var(--zet-text-muted)' }}>{t('displayName')}</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="zet-input w-full"
                        placeholder={t('namePlaceholder')}
                      />
                    </div>
                    {/* Kullanıcı Adı */}
                    <div>
                      <label className="text-sm block mb-1" style={{ color: 'var(--zet-text-muted)' }}>{t('username')}</label>
                      <div className="flex items-center rounded-xl px-3 py-2.5" style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }}>
                        <span className="text-sm mr-1" style={{ color: 'var(--zet-text-muted)' }}>@</span>
                        <input
                          type="text"
                          value={editUsername}
                          onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
                          className="flex-1 bg-transparent text-sm outline-none"
                          style={{ color: 'var(--zet-text)' }}
                          placeholder="kullanici_adi"
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--zet-text-muted)' }}>{t('usernameHint')}</p>
                    </div>
                    {/* Bio */}
                    <div>
                      <label className="text-sm block mb-1" style={{ color: 'var(--zet-text-muted)' }}>{t('bio')}</label>
                      <textarea
                        value={editBio}
                        onChange={e => setEditBio(e.target.value.slice(0, 200))}
                        className="zet-input w-full resize-none"
                        rows={3}
                        placeholder={t('bioPlaceholder')}
                      />
                      <p className="text-xs mt-1 text-right" style={{ color: 'var(--zet-text-muted)' }}>{editBio.length}/200</p>
                    </div>
                    {/* E-posta değiştir */}
                    <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--zet-bg-card)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium" style={{ color: 'var(--zet-text)' }}>E-posta</label>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(76,168,173,0.15)', color: '#4ca8ad' }}>Mevcut: {user?.email}</span>
                      </div>
                      {emailSent ? (
                        <p className="text-sm text-green-400">{t('emailConfirmSent')}</p>
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
                            {emailSending ? t('sending') : t('sendConfirmEmail')}
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
                          await axios.patch(`${API}/users/me`, { username: editUsername, display_name: editName, bio: editBio }, { withCredentials: true });
                          if (updateUser) updateUser({ ...user, name: editName, username: editUsername, bio: editBio, picture: pictureUrl });
                          setProfilePhoto(null);
                          setProfilePhotoPreview(null);
                          showToast(t('profileUpdated'), 'success');
                        } catch (err) {
                          const msg = err?.response?.data?.detail || 'Güncelleme başarısız';
                          showToast(msg, 'error');
                        }
                        setUploadingPhoto(false);
                      }}
                      className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
                      style={{ background: 'var(--zet-primary)' }}
                    >
                      {uploadingPhoto ? t('saving') : t('save')}
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'ai' && (
                <div className="max-w-lg">
                  <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--zet-text)' }}>{t('aiSettings')}</h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(76, 168, 173, 0.1)', border: '1px solid rgba(76, 168, 173, 0.3)' }}>
                      <div className="flex items-center gap-2 mb-3" style={{ justifyContent: 'space-between' }}>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5" style={{ color: '#4ca8ad' }} />
                          <h3 className="font-semibold" style={{ color: '#4ca8ad' }}>{t('zetaCustomize')}</h3>
                        </div>
                        <button onClick={() => { setShowMoodInfo(true); setMoodInfoSlide(0); }} style={{ display:'flex',alignItems:'center',justifyContent:'center',width:22,height:22,borderRadius:'50%',border:'1px solid rgba(76,168,173,0.4)',background:'rgba(76,168,173,0.08)',color:'#4ca8ad',cursor:'pointer',flexShrink:0 }} title="Modlar hakkında bilgi">
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="5.5" r="1" fill="currentColor"/><path d="M8 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Mod</label>
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => setShowMoodDrop(p => !p)}
                              className="zet-input text-sm w-full"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', gap: 8 }}
                            >
                              {(() => {
                                const cur = sortedDashModes.find(m => m.value === zetaMood);
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {cur && <span style={{ width: 8, height: 8, borderRadius: '50%', background: RARITY_COL[cur.rarity], flexShrink: 0, display: 'inline-block' }} />}
                                    <span>{cur ? t(cur.labelKey) : t('selectMode')}</span>
                                  </div>
                                );
                              })()}
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            {showMoodDrop && (
                              <>
                                <div onClick={() => setShowMoodDrop(false)} style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 201, background: '#0d1117', border: '1px solid #252545', borderRadius: 10, marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                                  {sortedDashModes.map((m, i) => (
                                    <React.Fragment key={m.value}>
                                      {i > 0 && m.locked && !sortedDashModes[i - 1].locked && (
                                        <div style={{ height: 1, background: '#1e293b' }} />
                                      )}
                                      <button
                                        onClick={() => handleDashMoodChange(m.value)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: zetaMood === m.value ? 'rgba(76,168,173,0.12)' : 'transparent', border: 'none', cursor: 'pointer', color: m.locked ? '#64748b' : '#e2e8f0', fontSize: 13, textAlign: 'left' }}
                                      >
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: RARITY_COL[m.rarity], flexShrink: 0 }} />
                                        <span style={{ flex: 1 }}>{t(m.labelKey)}</span>
                                        {m.locked && (
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                          </svg>
                                        )}
                                      </button>
                                    </React.Fragment>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        {zetaMood === 'custom' && (
                          <div>
                            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>{t('customPromptLabel')}</label>
                            <textarea value={zetaCustomPrompt} onChange={e => { setZetaCustomPrompt(e.target.value); localStorage.setItem('zet_zeta_custom', e.target.value); }} placeholder={t('customPromptPlaceholder')} className="zet-input text-sm w-full h-20 resize-none" />
                          </div>
                        )}
                        <div>
                          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>{t('emojiUsage')}</label>
                          <select value={zetaEmoji} onChange={e => { setZetaEmoji(e.target.value); localStorage.setItem('zet_zeta_emoji', e.target.value); }} className="zet-input text-sm w-full">
                            <option value="none">{t('emojiNone')}</option>
                            <option value="low">{t('emojiLow')}</option>
                            <option value="medium">{t('emojiMedium')}</option>
                            <option value="high">{t('emojiHigh')}</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* AI Memories */}
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(76, 168, 173, 0.06)', border: '1px solid rgba(76, 168, 173, 0.2)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5" style={{ color: '#4ca8ad' }} />
                          <h3 className="font-semibold" style={{ color: '#4ca8ad' }}>{t('zetaMemoriesTitle')}</h3>
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(76,168,173,0.2)', color: '#4ca8ad' }}>{zetaMemories.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={loadZetaMemories} className="text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition-all" style={{ color: 'var(--zet-text-muted)' }}>
                            {t('refresh')}
                          </button>
                          {zetaMemories.length > 0 && (
                            <button onClick={deleteAllZetaMemories} className="text-xs px-2 py-1 rounded-lg transition-all" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                              {t('clearMemoriesTitle')}
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Manuel bellek ekle */}
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={newMemoryInput}
                          onChange={e => setNewMemoryInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addZetaMemory()}
                          placeholder="Yeni bellek ekle..."
                          className="zet-input flex-1 text-sm"
                        />
                        <button
                          onClick={addZetaMemory}
                          disabled={!newMemoryInput.trim()}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0"
                          style={{ background: 'rgba(76,168,173,0.2)', border: '1px solid rgba(76,168,173,0.4)', color: '#4ca8ad', opacity: newMemoryInput.trim() ? 1 : 0.4 }}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {memoriesLoading ? (
                        <p className="text-xs text-center py-4" style={{ color: 'var(--zet-text-muted)' }}>{t('loading')}</p>
                      ) : zetaMemories.length === 0 ? (
                        <p className="text-xs py-2" style={{ color: 'var(--zet-text-muted)' }}>
                          {t('noMemories')}
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-52 overflow-y-auto">
                          {zetaMemories.map(m => (
                            <div key={m.memory_id} className="flex items-start justify-between gap-2 p-2.5 rounded-lg" style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }}>
                              <p className="text-sm flex-1" style={{ color: 'var(--zet-text)' }}>{m.content}</p>
                              <button onClick={() => deleteZetaMemory(m.memory_id)} className="flex-shrink-0 mt-0.5 p-1 rounded hover:bg-red-500/20 transition-colors" style={{ color: 'var(--zet-text-muted)' }}>
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'ranks' && (() => {
                const RANK_REQUIREMENTS = {
                  'Gümüş':  { hours: 40  },
                  'Altın':  { hours: 75  },
                  'Elmas':  { hours: 130 },
                  'Zümrüt': { hours: 230 },
                  'Endless':{ hours: 400 },
                };
                const RANK_REWARDS = {
                  'Demir':   { credits: 30,   zp: 50,   wheels: 2 },
                  'Gümüş':   { credits: 200,  zp: 400,  cases: 2,  wheels: 2 },
                  'Altın':   { credits: 500,  zp: 1000, cases: 4,  wheels: 2 },
                  'Elmas':   { credits: 800,  zp: 1600, cases: 7,  wheels: 4 },
                  'Zümrüt':  { credits: 1000, zp: 2400, cases: 10, wheels: 5 },
                  'Endless': { credits: 2000, zp: 3000, cases: 20, wheels: 7, pack: 1 },
                };
                const totalActiveSeconds = activeTimeSeconds + sessionSeconds;
                const activeHours = totalActiveSeconds / 3600;
                const formatActiveTime = (seconds) => {
                  const h = Math.floor(seconds / 3600);
                  const m = Math.floor((seconds % 3600) / 60);
                  if (h === 0) return `${m} dk`;
                  if (m === 0) return `${h} sa`;
                  return `${h} sa ${m} dk`;
                };
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
                      <RankIcon rank={currentRank} size={12} />
                      {showRankBadge ? t('rankShowInProfile') : t('rankHideInProfile')}
                    </button>
                  </div>

                  {/* Sezon geri sayımı */}
                  {seasonData?.active && (
                    <div style={{ background: 'rgba(76,168,173,0.08)', border: '1px solid rgba(76,168,173,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🏆</span>
                      <p style={{ fontSize: 13, color: 'var(--zet-text)', margin: 0 }}>
                        Sezon <strong style={{ color: '#4ca8ad' }}>{seasonData.days_remaining} gün</strong> içinde bitiyor — sezon sonunda ödülünü al!
                      </p>
                    </div>
                  )}

                  {/* CEO: Sezon yönetim formu */}
                  {isCEO && (
                    <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <p style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 10px' }}>👑 Sezon Yönetimi</p>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 10, color: 'var(--zet-text-muted)', margin: '0 0 4px' }}>Başlangıç</p>
                          <input
                            type="date"
                            value={seasonForm.start}
                            onChange={e => setSeasonForm(f => ({ ...f, start: e.target.value }))}
                            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 7, color: '#fff', padding: '6px 8px', fontSize: 12, boxSizing: 'border-box' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 10, color: 'var(--zet-text-muted)', margin: '0 0 4px' }}>Bitiş</p>
                          <input
                            type="date"
                            value={seasonForm.end}
                            onChange={e => setSeasonForm(f => ({ ...f, end: e.target.value }))}
                            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 7, color: '#fff', padding: '6px 8px', fontSize: 12, boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <button
                        disabled={!seasonForm.start || !seasonForm.end || seasonForm.loading}
                        onClick={async () => {
                          setSeasonForm(f => ({ ...f, loading: true }));
                          try {
                            const fmt = d => d.split('-').reverse().join('.');
                            const range = `${fmt(seasonForm.start)}-${fmt(seasonForm.end)}`;
                            const pin = prompt('CEO PIN:');
                            if (!pin) { setSeasonForm(f => ({ ...f, loading: false })); return; }
                            await axios.get(`${API}/season/time/${range}`, { params: { pin }, withCredentials: true });
                            const res = await axios.get(`${API}/season`, { withCredentials: true });
                            setSeasonData(res.data);
                            showToast('Sezon güncellendi', 'success');
                          } catch { showToast('Hata oluştu', 'error'); }
                          setSeasonForm(f => ({ ...f, loading: false }));
                        }}
                        style={{ width: '100%', background: seasonForm.loading ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 7, color: '#f59e0b', fontSize: 12, fontWeight: 600, padding: '7px', cursor: 'pointer' }}
                      >
                        {seasonForm.loading ? 'Kaydediliyor...' : 'Sezonu Başlat'}
                      </button>
                      {seasonData && (
                        <p style={{ fontSize: 10.5, color: 'var(--zet-text-muted)', margin: '8px 0 0' }}>
                          Mevcut: {seasonData.active ? `${seasonData.start_date} → ${seasonData.end_date}` : 'Aktif sezon yok'}
                        </p>
                      )}
                      {seasonData?.active && (
                        <button
                          onClick={async () => {
                            const pin = prompt('CEO PIN:');
                            if (!pin) return;
                            try {
                              const res = await axios.post(`${API}/season/distribute`, { pin }, { withCredentials: true });
                              const updated = await axios.get(`${API}/season`, { withCredentials: true });
                              setSeasonData(updated.data);
                              showToast(`Sezon bitti — ${res.data.rewarded_users} kullanıcı ödüllendirildi`, 'success');
                            } catch { showToast('Hata oluştu', 'error'); }
                          }}
                          style={{ width: '100%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 7, color: '#ef4444', fontSize: 12, fontWeight: 600, padding: '7px', cursor: 'pointer', marginTop: 8 }}
                        >
                          Sezonu Şimdi Bitir
                        </button>
                      )}
                    </div>
                  )}

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
                        {tab === 'requirements' ? t('rankRequirements') : t('rankRewards')}
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
                              <RankIcon rank={r} size={22} />
                              <span className="font-medium" style={{ color: r.color }}>{r.name}</span>
                              {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${r.color}20`, color: r.color }}>{t('currentBadge')}</span>}
                            </div>
                            <span className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{r.xp.toLocaleString()} XP</span>
                          </div>
                          {req ? (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--zet-text-muted)' }}>
                                <span>{formatActiveTime(totalActiveSeconds)} / {req.hours} sa</span>
                                <span>{Math.min(100, Math.round((activeHours / req.hours) * 100))}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (activeHours / req.hours) * 100)}%`, background: activeHours >= req.hours ? r.color : 'rgba(255,255,255,0.3)' }} />
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs mt-1" style={{ color: 'var(--zet-text-muted)' }}>{t('rankNoReq')}</p>
                          )}
                        </div>
                      );})}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl text-xs mb-2" style={{ background: 'rgba(76,168,173,0.1)', border: '1px solid rgba(76,168,173,0.3)', color: 'var(--zet-text-muted)' }}>
                        Ödüller <strong style={{ color: 'var(--zet-text)' }}>sezon sonunda</strong> verilir. Sezon bittiğinde hangi rankta olursan o rankın ödülünü alırsın. Rank kredileri <strong style={{ color: 'var(--zet-text)' }}>1 ay</strong> boyunca geçerlidir.
                      </div>
                      {RANKS.map(r => {
                        const reward = RANK_REWARDS[r.name];
                        const isCurrent = currentRank.name === r.name;
                        return (
                        <div key={r.name} className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'var(--zet-bg-card)', border: isCurrent ? `1px solid ${r.color}60` : '1px solid transparent' }}>
                          <div className="flex items-center gap-3">
                            <RankIcon rank={r} size={22} />
                            <span className="font-medium" style={{ color: r.color }}>{r.name}</span>
                            {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${r.color}20`, color: r.color }}>{t('currentBadge')}</span>}
                          </div>
                          <div className="flex flex-col items-end gap-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-0.5" style={{ color: '#fbbf24' }}>
                                <CreditIcon color="#fbbf24" size={12} /> {reward.credits} kr
                              </span>
                              <span className="flex items-center gap-0.5" style={{ color: '#f59e0b' }}>
                                <ZPIcon color="#f59e0b" size={12} /> {reward.zp.toLocaleString()} ZP
                              </span>
                            </div>
                            {(reward.cases || reward.wheels || reward.pack) && (
                              <div className="flex items-center gap-2" style={{ color: 'var(--zet-text-muted)' }}>
                                {reward.cases && <span style={{ color: '#60a5fa' }}>{reward.cases} kasa</span>}
                                {reward.wheels && <span style={{ color: '#a78bfa' }}>{reward.wheels} çark</span>}
                                {reward.pack && <span style={{ color: '#fbbf24' }}>+Zeta paketi</span>}
                              </div>
                            )}
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
                    <p className="text-xs mt-2 text-center" style={{ color: 'var(--zet-text-muted)' }}>{formatActiveTime(totalActiveSeconds)} / {nextRank ? `${nextRank.xp} sa` : '∞'}</p>
                  </div>
                </div>
                );
              })()}

              {settingsTab === 'magaza' && (
                <div className="max-w-lg">
                  <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--zet-text)' }}>{t('subscription')}</h2>
                  <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-xl" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <ZPIcon color="#fbbf24" size={16} />
                    <span className="text-sm font-bold" style={{ color: '#fbbf24' }}>{userZP.toLocaleString()} ZP</span>
                    <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>- ZP ile de plan alabilirsiniz</span>
                  </div>
                  <div className="flex justify-center mb-6">
                    <div className="flex rounded-lg p-1" style={{ background: 'var(--zet-bg)' }}>
                      <button onClick={() => setBillingCycle('monthly')} className="px-4 py-2 rounded-md text-sm font-medium transition-all" style={{ background: billingCycle === 'monthly' ? 'var(--zet-primary)' : 'transparent', color: billingCycle === 'monthly' ? 'white' : 'var(--zet-text-muted)' }}>{t('monthly')}</button>
                      <button onClick={() => setBillingCycle('yearly')} className="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1" style={{ background: billingCycle === 'yearly' ? 'var(--zet-primary)' : 'transparent', color: billingCycle === 'yearly' ? 'white' : 'var(--zet-text-muted)' }}>{t('yearly')}</button>
                    </div>
                  </div>
                  {(() => {
                    const FREE_PLAN_ITEM = { id: 'free', name: 'Free', monthlyPrice: 0, yearlyPrice: 0, color: '#6b7280', zpCost: 0, recommended: false, scope: null, scopeLabel: null, features: ['feat80Credits', 'feat100kToken', 'feat1nb3fs', 'featBasicTools', 'featJudgeChat'] };
                    const allPlansDisplay = [FREE_PLAN_ITEM, ...SUBSCRIPTION_PLANS];
                    const isFreeUser = !userSubscription || userSubscription === 'free';
                    return (
                  <div className="relative">
                    <button onClick={() => setCurrentPlanIndex(Math.max(0, currentPlanIndex - 1))} disabled={currentPlanIndex === 0} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30" style={{ background: 'var(--zet-bg-card)' }}>
                      <ChevronLeft className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
                    </button>
                    <button onClick={() => setCurrentPlanIndex(Math.min(allPlansDisplay.length - 1, currentPlanIndex + 1))} disabled={currentPlanIndex === allPlansDisplay.length - 1} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30" style={{ background: 'var(--zet-bg-card)' }}>
                      <ChevronRight className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
                    </button>
                    <div className="overflow-hidden">
                      <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${currentPlanIndex * 100}%)` }}>
                        {allPlansDisplay.map((plan) => {
                          const isYearly = billingCycle === 'yearly';
                          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                          const fullYearlyPrice = plan.monthlyPrice * 12;
                          const period = isYearly ? '/yr' : '/mo';
                          const isCurrent = plan.id === 'free' ? isFreeUser : userSubscription === plan.id;
                          return (
                            <div key={plan.id} className="w-full flex-shrink-0 px-2">
                              <div className={`relative rounded-2xl p-6 transition-all ${plan.recommended ? 'ring-2' : ''}`} style={{ background: `linear-gradient(135deg, ${plan.color}15 0%, ${plan.color}05 100%)`, border: isCurrent ? `2px solid ${plan.color}` : `1px solid ${plan.color}30` }}>
                                {isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: plan.color }}>{t('currentPlanBadge')}</div>}
                                {plan.recommended && !isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: plan.color }}>{t('recommended')}</div>}
                                <div className="text-center mb-6 pt-2">
                                  <h3 className="text-2xl font-bold mb-1" style={{ color: plan.color }}>{plan.name}</h3>
                                  {plan.scopeLabel && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2" style={{ background: plan.scope === 'both' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)', color: plan.scope === 'both' ? '#f59e0b' : 'var(--zet-text-muted)', border: plan.scope === 'both' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
                                      {plan.scope === 'both' ? '✦ ' : ''}{t(plan.scopeLabel)}
                                    </span>
                                  )}
                                  {plan.id === 'free' ? (
                                    <div><span className="text-4xl font-bold" style={{ color: 'var(--zet-text)' }}>{t('freePrice')}</span></div>
                                  ) : isYearly ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <span className="text-sm line-through" style={{ color: 'var(--zet-text-muted)' }}>${fullYearlyPrice}/yr</span>
                                      <div><span className="text-4xl font-bold" style={{ color: 'var(--zet-text)' }}>${price}</span><span className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>/yr</span></div>
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">%{Math.round((1 - price / fullYearlyPrice) * 100)} {t('savingsLabel')}</span>
                                    </div>
                                  ) : (
                                    <div><span className="text-4xl font-bold" style={{ color: 'var(--zet-text)' }}>${price}</span><span className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>/mo</span></div>
                                  )}
                                </div>
                                <ul className="space-y-3 mb-4">
                                  {plan.features.map((feature, fidx) => (<li key={fidx} className="flex items-center gap-2 text-sm" style={{ color: 'var(--zet-text)' }}><Check className="h-4 w-4 flex-shrink-0" style={{ color: plan.color }} />{t(feature)}</li>))}
                                </ul>
                                <div className="space-y-2">
                                  <button
                                    onClick={() => { setSubscriptionInitSlide({ planId: plan.id, idx: 0 }); setShowSubscription(true); }}
                                    className="w-full py-2.5 rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center gap-1.5 text-sm"
                                    style={{ background: 'transparent', color: plan.color, border: `1px solid ${plan.color}40` }}
                                  >
                                    {t('aboutPackage')}
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                  </button>
                                  {plan.id !== 'free' && (
                                    <button onClick={() => handleSubscribe(plan.id)} disabled={subscribing || isCurrent} className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50" style={{ background: isCurrent ? 'var(--zet-bg)' : plan.color, color: isCurrent ? plan.color : 'white', border: isCurrent ? `2px solid ${plan.color}` : 'none' }} data-testid={`select-plan-${plan.id}`}>
                                      {isCurrent ? t('currentPlan') : `$${price}${period} ${t('buyPlanBtn')}`}
                                    </button>
                                  )}
                                  {isCurrent && plan.id !== 'free' && (
                                    <button
                                      onClick={() => setShowPlanFeatures(true)}
                                      className="w-full py-2.5 rounded-xl font-semibold transition-all hover:opacity-80 text-sm"
                                      style={{ background: `${plan.color}12`, color: plan.color, border: `1px solid ${plan.color}35` }}
                                    >
                                      {t('whatDoIGet')}
                                    </button>
                                  )}
                                  {plan.id !== 'free' && plan.id !== 'creative_station' && !isYearly && !isCurrent && (
                                    <button onClick={() => handleBuyWithSP(plan.id)} disabled={subscribing || userZP < plan.zpCost} className="w-full py-2.5 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: userZP >= plan.zpCost ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.03)', color: userZP >= plan.zpCost ? '#fbbf24' : 'var(--zet-text-muted)', border: `1px solid ${userZP >= plan.zpCost ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)'}` }}>
                                      <Star className="h-4 w-4" />{plan.zpCost.toLocaleString()} ZP ile Al
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
                      {allPlansDisplay.map((p, idx) => (<button key={idx} onClick={() => setCurrentPlanIndex(idx)} className={`w-2 h-2 rounded-full transition-all ${currentPlanIndex === idx ? 'w-6' : ''}`} style={{ background: currentPlanIndex === idx ? allPlansDisplay[idx].color : 'var(--zet-text-muted)' }} />))}
                    </div>
                  </div>
                    );
                  })()}
                  <p className="text-center text-xs mt-4" style={{ color: 'var(--zet-text-muted)' }}>{t('subscriptionNote')}</p>
                </div>
              )}

              {settingsTab === 'magaza' && <div style={{ margin: '8px 0 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }} />}

              {settingsTab === 'magaza' && (() => {
                const CREDIT_TIERS = [
                  { id: 'pack_50k',  color: '#10b981', glow: 'rgba(16,185,129,0.18)', label: t('packStarter') },
                  { id: 'pack_230k', color: '#3b82f6', glow: 'rgba(59,130,246,0.18)', label: t('packStandard') },
                  { id: 'pack_700k', color: '#8b5cf6', glow: 'rgba(139,92,246,0.2)',  label: t('packPopular')  },
                  { id: 'pack_950k', color: '#f59e0b', glow: 'rgba(245,158,11,0.2)',  label: t('packBestValue') },
                ];
                const BAR_WIDTHS = [18, 42, 72, 100];
                if (creditPackages.length === 0) return <MiniDocLoader />;
                const pkg = creditPackages[currentCreditIndex] || creditPackages[0];
                const tier = CREDIT_TIERS[currentCreditIndex] || CREDIT_TIERS[0];
                const priceDiff = pkg.discounted_price !== pkg.price;
                const hasDiscount = priceDiff;
                const fmtCredits = pkg.credits.toLocaleString();
                return (
                  <div style={{ maxWidth: 400 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <CreditIcon color="#f59e0b" size={16} />
                      <h2 className="text-base font-semibold" style={{ color: 'var(--zet-text)' }}>{t('buyCreditsTitle')}</h2>
                    </div>
                    <p className="text-xs mb-5" style={{ color: 'var(--zet-text-muted)' }}>{t('creditsUsedFor')}</p>

                    {/* Carousel card with arrows */}
                    <div className="relative">
                      <button onClick={() => setCurrentCreditIndex(Math.max(0, currentCreditIndex - 1))} disabled={currentCreditIndex === 0} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30" style={{ background: 'var(--zet-bg-card)' }}>
                        <ChevronLeft className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
                      </button>
                      <button onClick={() => setCurrentCreditIndex(Math.min(creditPackages.length - 1, currentCreditIndex + 1))} disabled={currentCreditIndex === creditPackages.length - 1} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30" style={{ background: 'var(--zet-bg-card)' }}>
                        <ChevronRight className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
                      </button>
                    <div
                      key={currentCreditIndex}
                      className="animate-fadeIn rounded-3xl p-8 mb-4 flex flex-col items-center text-center"
                      style={{
                        background: `radial-gradient(ellipse at top, ${tier.glow}, transparent 70%), var(--zet-bg-card)`,
                        border: `1px solid ${tier.color}50`,
                        boxShadow: `0 0 40px ${tier.glow}`,
                        minHeight: 260,
                      }}
                    >
                      {/* Tier badge */}
                      <span className="text-xs font-bold px-3 py-1 rounded-full mb-5"
                        style={{ background: tier.glow, color: tier.color, border: `1px solid ${tier.color}40` }}>
                        {tier.label}
                      </span>

                      {/* Icon */}
                      <div className="rounded-2xl flex items-center justify-center mb-4"
                        style={{ width: 64, height: 64, background: tier.glow }}>
                        <CreditIcon color={tier.color} size={32} />
                      </div>

                      {/* Credits */}
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="font-black" style={{ fontSize: 42, lineHeight: 1, color: tier.color }}>{fmtCredits}</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--zet-text-muted)' }}>{t('creditsUnit')}</span>
                      </div>

                      {/* Bar */}
                      <div className="w-full h-1.5 rounded-full overflow-hidden mt-3 mb-6" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div className="h-full rounded-full" style={{ width: `${BAR_WIDTHS[currentCreditIndex]}%`, background: `linear-gradient(90deg, ${tier.color}66, ${tier.color})`, transition: 'width 0.4s ease' }} />
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-5">
                        {priceDiff && <span className="text-sm line-through" style={{ color: 'var(--zet-text-muted)' }}>${pkg.price.toFixed(2)}</span>}
                        <span className="font-black" style={{ fontSize: 32, color: priceDiff ? '#10b981' : 'var(--zet-text)' }}>${pkg.discounted_price.toFixed(2)}</span>
                      </div>

                      <button
                        onClick={() => handleBuyCredits(pkg.id)}
                        disabled={buyingCredits}
                        className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
                        style={{ background: tier.color, color: '#fff' }}
                        data-testid={`buy-credit-${pkg.credits}`}
                      >
                        {buyingCredits ? '...' : t('buyPlanBtn')}
                      </button>
                    </div>
                    </div>{/* /carousel wrapper */}

                    {/* Dots */}
                    <div className="flex justify-center gap-2 mb-3">
                      {creditPackages.map((_, idx) => {
                        const t = CREDIT_TIERS[idx] || CREDIT_TIERS[0];
                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentCreditIndex(idx)}
                            className="rounded-full transition-all"
                            style={{
                              width: currentCreditIndex === idx ? 24 : 8,
                              height: 8,
                              background: currentCreditIndex === idx ? t.color : 'var(--zet-text-muted)',
                              opacity: currentCreditIndex === idx ? 1 : 0.35,
                            }}
                          />
                        );
                      })}
                    </div>

                    {hasDiscount && (
                      <div className="px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 mt-1" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <CreditIcon color="#10b981" size={12} />
                        <span className="text-[11px] font-semibold" style={{ color: '#10b981' }}>{t('subscriptionDiscount')}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-center mt-3" style={{ color: 'var(--zet-text-muted)' }}>
                      {t('paymentSecure')}
                    </p>
                  </div>
                );
              })()}

              {settingsTab === 'primedrive' && (() => {
                const QUOTA_MAP = { free: 1, plus: 20, pro: 50, creative_station: 1024 };
                const quotaGB = QUOTA_MAP[userSubscription] || 1;
                const usedGB = driveUsed / (1024 * 1024 * 1024);
                const usedPct = Math.min(100, (usedGB / quotaGB) * 100);
                const fmtSize = (b) => b >= 1024**3 ? `${(b/1024**3).toFixed(2)} GB` : b >= 1024**2 ? `${(b/1024**2).toFixed(1)} MB` : `${(b/1024).toFixed(0)} KB`;
                const fileIcon = (ct) => {
                  if (ct?.startsWith('image/')) return (
                    <svg viewBox="0 0 20 20" fill="none" style={{width:18,height:18}}><rect x="2" y="4" width="16" height="12" rx="2" stroke="#6366f1" strokeWidth="1.5"/><circle cx="7" cy="8.5" r="1.5" fill="#6366f1" opacity="0.7"/><path d="M2 13l4-4 3 3 3-3 4 4" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                  );
                  if (ct === 'application/pdf') return (
                    <svg viewBox="0 0 20 20" fill="none" style={{width:18,height:18}}><rect x="3" y="2" width="14" height="16" rx="2" stroke="#ef4444" strokeWidth="1.5"/><text x="5" y="13" fill="#ef4444" fontSize="6" fontWeight="bold">PDF</text></svg>
                  );
                  if (ct?.startsWith('video/')) return (
                    <svg viewBox="0 0 20 20" fill="none" style={{width:18,height:18}}><rect x="2" y="5" width="12" height="10" rx="2" stroke="#a78bfa" strokeWidth="1.5"/><path d="M14 8l4-2v8l-4-2V8z" stroke="#a78bfa" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                  );
                  if (ct?.startsWith('audio/')) return (
                    <svg viewBox="0 0 20 20" fill="none" style={{width:18,height:18}}><circle cx="10" cy="10" r="7" stroke="#22d3ee" strokeWidth="1.5"/><path d="M8 7.5v5l5-2.5-5-2.5z" fill="#22d3ee" opacity="0.8"/></svg>
                  );
                  return <FileText className="h-4 w-4" style={{color:'#6366f1'}}/>;
                };
                return (
                  <div className="max-w-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <HardDrive className="h-6 w-6" style={{ color: '#6366f1' }} />
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--zet-text)' }}>Prime Drive</h2>
                      </div>
                      <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer text-sm font-medium transition-all" style={{ background: driveUploading ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)', opacity: driveUploading ? 0.6 : 1, pointerEvents: driveUploading ? 'none' : 'auto' }}>
                        {driveUploading ? (
                          <svg className="animate-spin" viewBox="0 0 20 20" style={{width:14,height:14}}><circle cx="10" cy="10" r="7" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="30" strokeDashoffset="10" fill="none"/></svg>
                        ) : (
                          <svg viewBox="0 0 20 20" fill="none" style={{width:14,height:14}}><path d="M10 3v10M6 7l4-4 4 4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 15h14" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        )}
                        {driveUploading ? t('uploading') : t('uploadFile')}
                        <input type="file" multiple className="hidden" onChange={e => { Array.from(e.target.files || []).forEach(f => uploadDriveFile(f)); e.target.value = ''; }} />
                      </label>
                    </div>
                    <div className="p-5 rounded-2xl mb-4" style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold" style={{ color: 'var(--zet-text)' }}>{t('storageSpace')}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                          {userSubscription === 'creative_station' ? '1 TB' : userSubscription === 'pro' ? '50 GB' : userSubscription === 'plus' ? '20 GB' : '1 GB'} — {userSubscription === 'creative_station' ? 'Creative Station' : userSubscription === 'pro' ? 'Pro' : userSubscription === 'plus' ? 'Plus' : 'Free'}
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${usedPct}%`, background: usedPct > 80 ? '#ef4444' : '#6366f1' }} />
                      </div>
                      <div className="flex justify-between text-xs" style={{ color: 'var(--zet-text-muted)' }}>
                        <span>{fmtSize(driveUsed)} {t('used')}</span>
                        <span>{quotaGB < 1024 ? `${quotaGB} GB` : '1 TB'} toplam</span>
                      </div>
                    </div>
                    {userSubscription === 'creative_station' && (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                        <svg viewBox="0 0 16 16" fill="none" style={{width:13,height:13,flexShrink:0}}><path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L8 1z" fill="#f59e0b"/></svg>
                        <span className="text-sm" style={{ color: '#f59e0b' }}>ZET Mindshare ve ZET Judge için ortak 1 TB havuz</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--zet-text-muted)' }}>Dosyalar ({driveFiles.length})</span>
                      {driveLoading && <svg className="animate-spin" viewBox="0 0 20 20" style={{width:14,height:14}}><circle cx="10" cy="10" r="7" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="30" strokeDashoffset="10" fill="none"/></svg>}
                    </div>
                    {driveFiles.length === 0 && !driveLoading ? (
                      <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)' }}>
                        <HardDrive className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: '#6366f1' }} />
                        <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{t('driveEmpty')}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--zet-text-muted)' }}>{t('driveEmptyHint')}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {driveFiles.map(item => (
                          <div key={item.file_id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)' }}>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)' }}>
                              {fileIcon(item.content_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--zet-text)' }}>{item.name}</p>
                              <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{fmtSize(item.size)} · {new Date(item.created_at).toLocaleDateString('tr-TR')}</p>
                            </div>
                            <button onClick={() => downloadDriveFile(item.file_id, item.name)} className="p-1.5 rounded-lg hover:bg-white/10 transition-all" style={{ color: '#6366f1' }} title="İndir">
                              <svg viewBox="0 0 20 20" fill="none" style={{width:15,height:15}}><path d="M10 3v10M6 9l4 4 4-4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 15h14" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            </button>
                            <button onClick={() => deleteDriveFile(item.file_id, item.size)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all" style={{ color: 'rgba(255,255,255,0.3)' }} title="Sil">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {userSubscription === 'free' && (
                      <p className="text-xs text-center mt-4" style={{ color: 'var(--zet-text-muted)' }}>
                        Plus ile 20 GB, Pro ile 50 GB, Creative Station ile 1 TB alana sahip ol.
                      </p>
                    )}
                  </div>
                );
              })()}

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
                            <input autoFocus className="zet-input w-12 text-center text-xs font-mono" maxLength={1} onKeyDown={e => { if (e.key.length === 1) { const ns = { ...shortcuts }; Object.keys(ns).forEach(k => { if (ns[k] === tool.id) delete ns[k]; }); ns[e.key.toUpperCase()] = tool.id; setShortcuts(ns); savePreference('zet_shortcuts', JSON.stringify(ns)); setEditingShortcut(null); } else if (e.key === 'Escape') setEditingShortcut(null); }} onBlur={() => setEditingShortcut(null)} placeholder="?" />
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
                      <button key={tool.id} onClick={() => { if (fastSelectTools.includes(tool.id)) { const nt = fastSelectTools.filter(t => t !== tool.id); setFastSelectTools(nt); savePreference('zet_fast_select', JSON.stringify(nt)); } else if (fastSelectTools.length < fastSelectLimit) { const nt = [...fastSelectTools, tool.id]; setFastSelectTools(nt); savePreference('zet_fast_select', JSON.stringify(nt)); } }} className={`p-2 rounded flex flex-col items-center transition-all ${fastSelectTools.includes(tool.id) ? 'ring-2 ring-blue-500' : 'hover:bg-white/10'}`} style={{ background: fastSelectTools.includes(tool.id) ? 'var(--zet-primary)' : 'var(--zet-bg)' }} title={t(tool.nameKey) || tool.nameKey}>
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

              {settingsTab === 'identity' && (() => {
                const loadIdentityStatus = async () => {
                  try {
                    const res = await axios.get(`${API}/users/verify-identity/status`, { withCredentials: true });
                    setIdentityStatus(res.data.identity_status || 'none');
                  } catch { setIdentityStatus('none'); }
                };
                if (identityStatus === null) { loadIdentityStatus(); return <MiniDocLoader />; }

                const toBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsDataURL(file); });
                const handleImg = async (field, e) => { const f = e.target.files[0]; if (!f) return; const b64 = await toBase64(f); setIdentityForm(p => ({ ...p, [field]: b64 })); };
                const submitVerification = async () => {
                  setIdentityError('');
                  if (!identityForm.full_name.trim() || !identityForm.id_number.trim()) return setIdentityError('Ad soyad ve kimlik numarası zorunludur.');
                  if (!identityForm.front_image || !identityForm.selfie_image) return setIdentityError('Ön yüz ve selfie fotoğrafı zorunludur.');
                  setIdentitySubmitting(true);
                  try {
                    await axios.post(`${API}/users/verify-identity`, identityForm, { withCredentials: true });
                    setIdentityStatus('pending');
                  } catch (e) { setIdentityError(e.response?.data?.detail || 'Bir hata oluştu.'); }
                  setIdentitySubmitting(false);
                };

                return (
                  <div className="max-w-lg">
                    <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--zet-text)' }}>✅ Kimlik Doğrulama</h2>
                    <p className="text-sm mb-4" style={{ color: 'var(--zet-text-muted)' }}>Kimliğinizi doğrulayarak mavi tik rozeti kazanın.</p>
                    {identityStatus === 'approved' && (
                      <div className="p-4 rounded-xl text-center" style={{ background: '#22c55e20', border: '1px solid #22c55e50' }}>
                        <p className="text-lg">✅</p>
                        <p className="font-semibold mt-1" style={{ color: '#22c55e' }}>Kimliğiniz Doğrulandı</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--zet-text-muted)' }}>Mavi tik rozetiniz aktif.</p>
                      </div>
                    )}
                    {identityStatus === 'pending' && (
                      <div className="p-4 rounded-xl text-center" style={{ background: '#f59e0b20', border: '1px solid #f59e0b50' }}>
                        <p className="text-lg">⏳</p>
                        <p className="font-semibold mt-1" style={{ color: '#f59e0b' }}>İnceleniyor</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--zet-text-muted)' }}>Başvurunuz 24 saat içinde incelenecek.</p>
                      </div>
                    )}
                    {identityStatus === 'rejected' && (
                      <div className="p-4 rounded-xl mb-4" style={{ background: '#ef444420', border: '1px solid #ef444450' }}>
                        <p className="font-semibold" style={{ color: '#ef4444' }}>❌ Başvuru Reddedildi</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--zet-text-muted)' }}>Tekrar başvurabilirsiniz.</p>
                      </div>
                    )}
                    {(identityStatus === 'none' || identityStatus === 'rejected') && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Ad Soyad *</label>
                          <input value={identityForm.full_name} onChange={e => setIdentityForm(p => ({ ...p, full_name: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)', color: 'var(--zet-text)' }} placeholder="Adınız Soyadınız" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Kimlik Türü *</label>
                          <select value={identityForm.id_type} onChange={e => setIdentityForm(p => ({ ...p, id_type: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)', color: 'var(--zet-text)' }}>
                            <option value="tc_kimlik">TC Kimlik Kartı</option>
                            <option value="pasaport">Pasaport</option>
                            <option value="ehliyet">Ehliyet</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Kimlik Numarası *</label>
                          <input value={identityForm.id_number} onChange={e => setIdentityForm(p => ({ ...p, id_number: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)', color: 'var(--zet-text)' }} placeholder="Kimlik numaranız" />
                        </div>
                        {[['front_image', 'Kimlik Ön Yüzü *'], ['back_image', 'Kimlik Arka Yüzü'], ['selfie_image', 'Selfie (Kimlik ile) *']].map(([field, label]) => (
                          <div key={field}>
                            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>{label}</label>
                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)', color: 'var(--zet-text)' }}>
                                📎 Seç
                                <input type="file" accept="image/*" className="hidden" onChange={e => handleImg(field, e)} />
                              </label>
                              {identityForm[field] && <span className="text-xs" style={{ color: '#22c55e' }}>✓ Yüklendi</span>}
                            </div>
                          </div>
                        ))}
                        {identityError && <p className="text-xs" style={{ color: '#ef4444' }}>{identityError}</p>}
                        <button onClick={submitVerification} disabled={identitySubmitting}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                          style={{ background: 'var(--zet-primary)', color: '#fff' }}>
                          {identitySubmitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {settingsTab === 'inventory' && (
                <div className="max-w-lg">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--zet-text)', margin: 0 }}>Envanter</h2>
                    {isPrivileged && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await axios.post(`${API}/admin/give-test-cases`, {}, { withCredentials: true });
                            const items = res.data.items || [];
                            console.log('[give-test-cases] user_id:', res.data.user_id, 'matched:', res.data.matched, 'modified:', res.data.modified, 'items:', items.map(i => i.id));
                            setInventory(prev => [...prev, ...items]);
                            showToast(`10 item eklendi — matched:${res.data.matched} modified:${res.data.modified}`, 'success');
                          } catch (e) { showToast(e?.response?.data?.detail || 'Hata', 'error'); }
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)', cursor: 'pointer' }}
                      >
                        Test: 10 Item Ekle
                      </button>
                    )}
                  </div>
                  <p className="text-sm mb-5" style={{ color: 'var(--zet-text-muted)' }}>{t('inventoryDesc')}</p>
                  {inventory.length === 0 ? (
                    <div className="text-center py-12" style={{ color: 'var(--zet-text-muted)' }}>
                      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ margin: '0 auto 10px' }}><rect x="6" y="16" width="32" height="22" rx="4" stroke="#334155" strokeWidth="1.5"/><path d="M6 22h32" stroke="#334155" strokeWidth="1.5"/><path d="M22 8v8M16 10l6 6 6-6" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <p className="text-sm">{t('inventoryEmpty')}</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                      {inventory.map((c) => {
                        const isPack  = c.item_type === 'rank_case';
                        const isWheel = !isPack && (c.item_type === 'daily_wheel' || c.item_type === 'rank_wheel' || c.type === 'daily_wheel');
                        const accentColor = isPack ? '#c084fc' : isWheel ? '#a78bfa' : '#60a5fa';
                        const borderColor = isPack ? '#3a1a5a' : isWheel ? '#3b2a5a' : '#2a2a5a';
                        const bgGradient  = isPack
                          ? 'linear-gradient(160deg, #1a0a2e, #2d1054, #1a0a2e)'
                          : isWheel ? 'linear-gradient(135deg, #12082a, #1a1040)' : 'linear-gradient(135deg, #0f0f2a, #1a1a3a)';
                        const handleClick = () => isPack ? setOpeningPackId(c.id) : isWheel ? setOpeningWheelId(c.id) : setOpeningCaseId(c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={handleClick}
                            style={{ background: bgGradient, border: `1px solid ${borderColor}`, borderRadius: 14, padding: '18px 12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', overflow: 'hidden' }}
                            onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${accentColor}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${borderColor}`; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            {isPack ? (
                              <>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 28, background: 'linear-gradient(90deg, #2d1054, #3b1470, #2d1054)', borderRadius: '14px 14px 0 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, padding: '0 8px' }}>
                                  {[5, 11, 17].map(t => <div key={t} style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.6), transparent)', borderRadius: 1 }} />)}
                                </div>
                                <div style={{ marginTop: 22 }}>
                                  <svg width="38" height="38" viewBox="0 0 38 38" fill="none"><circle cx="19" cy="19" r="16" stroke="#c084fc" strokeWidth="1" strokeDasharray="3 2" fill="rgba(192,132,252,0.06)"/><text x="19" y="25" textAnchor="middle" fill="#c084fc" fontSize="18" fontWeight="700" fontFamily="sans-serif">Z</text></svg>
                                </div>
                                <span style={{ fontSize: 11, color: '#c084fc', fontWeight: 700, letterSpacing: 1 }}>PAKET</span>
                              </>
                            ) : isWheel ? (
                              <svg width="38" height="38" viewBox="0 0 38 38" fill="none"><circle cx="19" cy="19" r="16" stroke="#a78bfa" strokeWidth="1.5" fill="rgba(167,139,250,0.08)"/><circle cx="19" cy="19" r="3.5" fill="#a78bfa"/><path d="M19 3v5M19 30v5M3 19h5M30 19h5M7.1 7.1l3.5 3.5M27.4 27.4l3.5 3.5M7.1 30.9l3.5-3.5M27.4 10.6l3.5-3.5" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round"/></svg>
                            ) : (
                              <svg width="38" height="38" viewBox="0 0 38 38" fill="none"><rect x="5" y="15" width="28" height="18" rx="3" stroke="#60a5fa" strokeWidth="1.5" fill="rgba(96,165,250,0.08)"/><path d="M5 21h28" stroke="#60a5fa" strokeWidth="1.5"/><path d="M19 7v8M13 9l6 6 6-6" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                            {!isPack && <span style={{ fontSize: 12, color: accentColor, fontWeight: 600 }}>{isWheel ? t('luckyWheel') : t('dailyCase')}</span>}
                            <span style={{ fontSize: 10, color: '#555', background: `rgba(${isPack ? '192,132,252' : isWheel ? '167,139,250' : '96,165,250'},0.1)`, borderRadius: 20, padding: '2px 10px' }}>{t('openToClick')}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              </div>{/* /animate-slideIn */}
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
                placeholder={activeTab === 'notes' ? t('searchNotes') : t('searchDocuments')}
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
                <ZetaTypingIndicator hasDocument={activeTab === 'documents'} />
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
                  <p className="text-sm whitespace-pre-wrap mb-3" style={{ color: 'var(--zet-text)' }}>{zetaSearchResults?.text}</p>
                  {zetaSearchResults?.matches?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: 'rgba(76,168,173,0.2)' }}>
                      {zetaSearchResults.matches.map(m => (
                        <button
                          key={m.id}
                          onClick={() => {
                            if (m.type === 'document') {
                              navigate(`/editor/${m.id}`);
                            } else {
                              // Nota kaydır: not sekmesine geç ve ilgili notu highlight et
                              setActiveTab('notes');
                              setZetaSearch(false);
                              setTimeout(() => {
                                const el = document.querySelector(`[data-testid="note-card-${m.id}"]`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                          style={{ background: 'rgba(76,168,173,0.2)', border: '1px solid rgba(76,168,173,0.4)', color: '#4ca8ad' }}
                        >
                          {m.type === 'document' ? <FileText className="h-3 w-3" /> : <StickyNote className="h-3 w-3" />}
                          {m.title.slice(0, 30)}{m.title.length > 30 ? '…' : ''}
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Normal arama içerik yükleniyor göstergesi */}
          {!zetaSearch && docSearchLoading && activeTab === 'documents' && searchQuery && (
            <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--zet-text-muted)' }}>
              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0" style={{ borderColor: '#4ca8ad', borderTopColor: 'transparent' }} />
              {t('scanningContent')}
            </div>
          )}
        </div>

        {/* Documents/Notes Grid */}
        {activeTab === 'documents' ? (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', paddingBottom: 80 }}>
          <div className="flex justify-end mb-3">
            <button onClick={() => { setShowTrash(true); fetchTrash(); }} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all" style={{ color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}>
              <Trash2 className="h-3.5 w-3.5" /> {t('recyclebin')}
            </button>
          </div>

          {/* ── Dosyalar (Doc Files) ── */}
          {(docFiles.length > 0 || showNewFile) && !searchQuery && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Folder className="h-4 w-4" style={{ color: 'var(--zet-primary-light)' }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--zet-text-muted)' }}>{t('folders')}</span>
                <button onClick={() => setShowNewFile(v => !v)} className="ml-auto p-1 rounded hover:bg-white/10 transition-all" style={{ color: 'var(--zet-text-muted)' }} title={t('newFolder')}>
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {showNewFile && (
                <div className="flex gap-2 mb-3">
                  <input
                    className="zet-input flex-1 text-sm"
                    placeholder={t('fileNamePlaceholder')}
                    value={newFileName}
                    onChange={e => setNewFileName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') createDocFile(); if (e.key === 'Escape') { setShowNewFile(false); setNewFileName(''); } }}
                    autoFocus
                  />
                  <button onClick={createDocFile} className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'var(--zet-primary)', color: 'var(--zet-text)' }}>{t('create')}</button>
                  <button onClick={() => { setShowNewFile(false); setNewFileName(''); }} className="p-1.5 rounded-lg hover:bg-white/10"><X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {docFiles.map(file => {
                  const docCount = (file.document_ids || []).length;
                  const isOpen = activeDocFile?.file_id === file.file_id;
                  return (
                    <div key={file.file_id} className="zet-card p-3 cursor-pointer group relative" onClick={() => { setActiveDocFile(isOpen ? null : file); }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b44, #f59e0b22)' }}>
                          {isOpen ? <FolderOpen className="h-5 w-5" style={{ color: '#f59e0b' }} /> : <Folder className="h-5 w-5" style={{ color: '#f59e0b' }} />}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setFileMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right }); setOpenMenuFileId(openMenuFileId === file.file_id ? null : file.file_id); }}
                          className="p-1 rounded hover:bg-white/10 transition-all"
                          style={{ color: 'var(--zet-text-muted)' }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                      {renamingFileId === file.file_id ? (
                        <div className="flex gap-1 mb-1" onClick={e => e.stopPropagation()}>
                          <input
                            className="zet-input flex-1 text-sm font-medium"
                            value={renamingFileName}
                            onChange={e => setRenamingFileName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') renameDocFile(file.file_id, renamingFileName); if (e.key === 'Escape') { setRenamingFileId(null); setRenamingFileName(''); } }}
                            autoFocus
                          />
                          <button onClick={() => renameDocFile(file.file_id, renamingFileName)} className="p-1 rounded hover:bg-white/10"><Check className="h-4 w-4" style={{ color: '#22c55e' }} /></button>
                          <button onClick={() => { setRenamingFileId(null); setRenamingFileName(''); }} className="p-1 rounded hover:bg-white/10"><X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>
                        </div>
                      ) : (
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--zet-text)' }}>{file.name}</p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: 'var(--zet-text-muted)' }}>{docCount} {t('docCountUnit')}</p>
                    </div>
                  );
                })}
                {docFiles.length === 0 && showNewFile && null}
              </div>
              {/* File three-dot menu */}
              {openMenuFileId && (
                <div
                  className="fixed z-50 py-1 rounded-xl min-w-[160px] animate-fadeIn"
                  style={{ top: fileMenuPos.top, right: fileMenuPos.right, background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                  onClick={e => e.stopPropagation()}
                >
                  {[
                    { icon: <FolderInput className="h-4 w-4" />, label: t('importDoc'), action: () => { setImportMode({ fileId: openMenuFileId, selectedDocIds: new Set() }); setOpenMenuFileId(null); } },
                    { icon: <FileEdit className="h-4 w-4" />, label: t('renameFile'), action: () => { const f = docFiles.find(f => f.file_id === openMenuFileId); if (f) { setRenamingFileId(f.file_id); setRenamingFileName(f.name); } setOpenMenuFileId(null); } },
                    { icon: <Trash2 className="h-4 w-4" />, label: t('deleteItem'), color: '#ef4444', action: () => { const fid = openMenuFileId; setOpenMenuFileId(null); showConfirm(t('deleteFolderTitle'), t('deleteFolderMsg'), () => deleteDocFile(fid), true); } },
                  ].map(item => (
                    <button key={item.label} onClick={item.action} className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-all text-left hover:bg-white/5" style={{ color: item.color || 'var(--zet-text)' }}>
                      {item.icon}{item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {!docFiles.length && !showNewFile && !searchQuery && (
            <button onClick={() => setShowNewFile(true)} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-4 hover:bg-white/5 transition-all" style={{ color: 'var(--zet-text-muted)', border: '1px dashed var(--zet-border)' }}>
              <Folder className="h-3.5 w-3.5" /> {t('newFolder')}
            </button>
          )}

          {/* Active file contents view */}
          {activeDocFile && !importMode && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setActiveDocFile(null)} className="p-1 rounded hover:bg-white/10"><ChevronLeft className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>
                <FolderOpen className="h-4 w-4" style={{ color: '#f59e0b' }} />
                <span className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>{activeDocFile.name}</span>
                <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>({(activeDocFile.document_ids || []).length} {t('docCountUnit')})</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {documents.filter(d => d.file_id === activeDocFile.file_id).map(doc => (
                  <div key={doc.doc_id} className="zet-card p-4 cursor-pointer group relative" onClick={() => navigate(`/editor/${doc.doc_id}`)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--zet-primary), var(--zet-primary-light))' }}>
                        <FileText className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
                      </div>
                      <button onClick={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setFolderDocMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right }); setOpenFolderDocMenuId(openFolderDocMenuId === doc.doc_id ? null : doc.doc_id); }} className="p-1 rounded hover:bg-white/10 transition-all" style={{ color: 'var(--zet-text-muted)' }}>
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                    <h3 className="font-medium mb-1 truncate text-sm" style={{ color: 'var(--zet-text)' }}>{doc.title}</h3>
                    <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: 'var(--zet-text-muted)' }}>
                      <Clock className="h-3 w-3" />{formatTime(doc.updated_at || doc.created_at)}
                    </div>
                  </div>
                ))}
                {documents.filter(d => d.file_id === activeDocFile.file_id).length === 0 && (
                  <div className="col-span-full text-center py-6 text-sm" style={{ color: 'var(--zet-text-muted)' }}>{t('emptyFolder')}</div>
                )}
              </div>
              {/* Folder doc three-dot menu portal */}
              {openFolderDocMenuId && (() => {
                const doc = documents.find(d => d.doc_id === openFolderDocMenuId);
                const inDrive = primeDriveDocs.some(d => d.id === openFolderDocMenuId);
                const items = [
                  { icon: <ExternalLink className="h-4 w-4" />, label: t('openDocument'), action: () => { navigate(`/editor/${openFolderDocMenuId}`); setOpenFolderDocMenuId(null); } },
                  { icon: <Pin className="h-4 w-4" style={{ color: doc?.pinned ? '#f59e0b' : 'inherit' }} />, label: doc?.pinned ? t('noteMenuUnpin') : t('noteMenuPin'), action: () => { if (doc) { pinDocument(doc); setOpenFolderDocMenuId(null); } } },
                  { icon: <ZetaIcon size={14} color="#4ca8ad" />, label: t('zetaSummary'), action: () => { if (doc) { analyzeDocWithZeta(doc); setOpenFolderDocMenuId(null); } } },
                  ...(userSubscription === 'creative_station' || isCEO ? [{
                    icon: <Scale className="h-4 w-4" style={{ color: '#c8005a' }} />,
                    label: t('judgeShare'),
                    color: '#c8005a',
                    action: async () => {
                      if (!doc) return;
                      setOpenFolderDocMenuId(null);
                      try {
                        const res = await axios.get(`${API}/documents/${doc.doc_id}`, { withCredentials: true });
                        const pages = res.data.pages || [];
                        const text = pages.map(p => {
                          const quillText = (p.content?.ops || []).map(op => (typeof op.insert === 'string' ? op.insert : '')).join('');
                          if (quillText.trim()) return quillText;
                          if (p.pageText) return p.pageText;
                          return (p.elements || []).filter(el => el.type === 'text').map(el => el.content || '').join('\n');
                        }).join('\n').trim();
                        localStorage.setItem('judge_pending_doc', JSON.stringify({ title: doc.title, text: text.slice(0, 8000) }));
                        navigate('/judge');
                      } catch { showToast('Belge yüklenemedi', 'error'); }
                    }
                  }] : []),
                  { icon: <HardDrive className="h-4 w-4" />, label: inDrive ? t('primeDriveIn') : t('primeDriveAdd'), color: inDrive ? '#6366f1' : undefined, action: () => {
                    if (!inDrive && doc) uploadDocToDrive(doc);
                    setOpenFolderDocMenuId(null);
                  }},
                  { icon: <X className="h-4 w-4" />, label: t('removeFromFolder'), color: '#ef4444', action: () => { const id = openFolderDocMenuId; setOpenFolderDocMenuId(null); showConfirm(t('removeFromFolderTitle'), t('removeFromFolderMsg'), () => removeDocFromFile(id, activeDocFile.file_id)); } },
                ];
                return (
                  <>
                    <div onClick={() => setOpenFolderDocMenuId(null)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                    <div className="fixed py-1 rounded-xl min-w-[180px] animate-fadeIn" style={{ top: folderDocMenuPos.top, right: folderDocMenuPos.right, zIndex: 999, background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
                      {items.map(item => (
                        <button key={item.label} onClick={item.action} className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-all text-left hover:bg-white/5" style={{ color: item.color || 'var(--zet-text)' }}>
                          {item.icon}{item.label}
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Mobile folder file action sheet */}
          {folderFileSheet && (
            <>
              <div onClick={() => setFolderFileSheet(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001, background: 'var(--zet-bg-card)', borderTop: '1px solid var(--zet-border)', borderRadius: '16px 16px 0 0', padding: '20px 16px 32px' }}>
                <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--zet-border)' }} />
                <p className="text-sm font-semibold mb-4 px-1" style={{ color: 'var(--zet-text)' }}>{folderFileSheet.name} {t('addToFolderSuffix')}</p>
                {[
                  { label: t('selectPhoto'), accept: 'image/*', capture: undefined,
                    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 11v6M9 14l3-3 3 3"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> },
                  { label: t('selectFile'), accept: '*/*', capture: undefined,
                    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                  { label: t('takePhoto'), accept: 'image/*', capture: 'environment',
                    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> },
                ].map(opt => (
                  <label key={opt.label} className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl mb-2 cursor-pointer hover:bg-white/5 transition-all" style={{ border: '1px solid var(--zet-border)' }}>
                    <span style={{ color: 'var(--zet-primary-light)' }}>{opt.icon}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--zet-text)' }}>{opt.label}</span>
                    <input type="file" accept={opt.accept} capture={opt.capture} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { uploadDriveFile(f); setFolderFileSheet(null); } e.target.value = ''; }} />
                  </label>
                ))}
                <button onClick={() => setFolderFileSheet(null)} className="w-full py-3 rounded-xl text-sm font-medium mt-2" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--zet-text-muted)' }}>
                  {t('cancel')}
                </button>
              </div>
            </>
          )}

          {/* Import mode header */}
          {importMode && (
            <div className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2 text-sm" style={{ background: 'rgba(76,168,173,0.1)', border: '1px solid rgba(76,168,173,0.3)', color: '#4ca8ad' }}>
              <FolderInput className="h-4 w-4 flex-shrink-0" />
              <span>{t('selectToImport')}</span>
              <span className="ml-auto font-semibold">{importMode.selectedDocIds.size} {t('selected')}</span>
            </div>
          )}

          <div ref={docsGridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {/* New Document Card — hidden during import */}
            {!importMode && (
            <button
              onClick={() => !isFreeOffline && setShowNewDoc(true)}
              className={`zet-card p-4 flex flex-col items-center justify-center min-h-[120px] ${isFreeOffline ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5'}`}
              data-testid="new-document-btn"
              title={isFreeOffline ? 'Çevrimdışıyken yeni belge oluşturamazsın' : undefined}
            >
              <Plus className="h-8 w-8 mb-2" style={{ color: 'var(--zet-primary-light)' }} />
              <span style={{ color: 'var(--zet-text-muted)' }}>{t('newDocument')}</span>
            </button>
            )}

            {/* Document Cards */}
            {filteredDocs.filter(d => !d.file_id || importMode).map(doc => {
              const isSelected = importMode?.selectedDocIds.has(doc.doc_id);
              return (
              <div
                key={doc.doc_id}
                className="zet-card p-4 cursor-pointer group relative"
                style={{ border: importMode ? (isSelected ? '2px solid #4ca8ad' : '1px solid var(--zet-border)') : (doc.pinned ? '1px solid rgba(245,158,11,0.4)' : undefined) }}
                onMouseEnter={() => !importMode && playSfx('mixkit-interface-device-click-2577.wav')}
                onClick={() => {
                  if (importMode) {
                    setImportMode(prev => {
                      const next = new Set(prev.selectedDocIds);
                      next.has(doc.doc_id) ? next.delete(doc.doc_id) : next.add(doc.doc_id);
                      return { ...prev, selectedDocIds: next };
                    });
                    return;
                  }
                  if (renamingDocId !== doc.doc_id) navigate(`/editor/${doc.doc_id}`);
                }}
                data-testid={`doc-card-${doc.doc_id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, var(--zet-primary), var(--zet-primary-light))' }}>
                    <FileText className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
                    {!importMode && doc.pinned && <Pin className="h-3 w-3 absolute -top-1 -right-1" style={{ color: '#f59e0b' }} />}
                  </div>
                  {importMode ? (
                    <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: isSelected ? '#4ca8ad' : 'var(--zet-border)', background: isSelected ? '#4ca8ad' : 'transparent' }}>
                      {isSelected && <Check className="h-3 w-3" style={{ color: '#fff' }} />}
                    </div>
                  ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setDocMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right }); setOpenMenuDocId(openMenuDocId === doc.doc_id ? null : doc.doc_id); }}
                    className="p-1 rounded hover:bg-white/10 transition-all"
                    style={{ color: 'var(--zet-text-muted)' }}
                    data-testid={`doc-menu-btn-${doc.doc_id}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  )}
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
                      <ZetaTypingIndicator hasDocument size={14} />
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
            );
            })}

            {/* Infinite scroll sentinel */}
            {!searchQuery && docsHasMore && (
              <div ref={docsBottomRef} style={{ gridColumn: '1 / -1', height: 40 }} />
            )}

            {/* Document menu dropdown (fixed, not clipped) */}
            {openMenuDocId && (
              <div
                className="fixed z-50 py-1 rounded-xl min-w-[160px] animate-fadeIn"
                style={{ top: docMenuPos.top, right: docMenuPos.right, background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                onClick={e => e.stopPropagation()}
              >
                {(() => {
                  const doc = filteredDocs.find(d => d.doc_id === openMenuDocId);
                  const inDrive = primeDriveDocs.some(d => d.id === openMenuDocId);
                  return [
                    { icon: <Pin className="h-4 w-4" style={{ color: doc?.pinned ? '#f59e0b' : 'inherit' }} />, label: doc?.pinned ? t('noteMenuUnpin') : t('noteMenuPin'), action: () => { if (doc) pinDocument(doc); } },
                    { icon: <ZetaIcon size={14} color="#4ca8ad" />, label: t('zetaSummary'), action: () => { if (doc) analyzeDocWithZeta(doc); } },
                    ...(userSubscription === 'creative_station' || isCEO ? [{
                      icon: <Scale className="h-4 w-4" style={{ color: '#c8005a' }} />,
                      label: t('judgeShare'),
                      color: '#c8005a',
                      action: async () => {
                        if (!doc) return;
                        setOpenMenuDocId(null);
                        try {
                          const res = await axios.get(`${API}/documents/${doc.doc_id}`, { withCredentials: true });
                          const pages = res.data.pages || [];
                          const text = pages.map(p => {
                            const quillText = (p.content?.ops || []).map(op => (typeof op.insert === 'string' ? op.insert : '')).join('');
                            if (quillText.trim()) return quillText;
                            if (p.pageText) return p.pageText;
                            return (p.elements || []).filter(el => el.type === 'text').map(el => el.content || '').join('\n');
                          }).join('\n').trim();
                          localStorage.setItem('judge_pending_doc', JSON.stringify({ title: doc.title, text: text.slice(0, 8000) }));
                          navigate('/judge');
                        } catch { showToast('Belge yüklenemedi', 'error'); }
                      }
                    }] : []),
                    { icon: <HardDrive className="h-4 w-4" />, label: inDrive ? t('primeDriveIn') : t('primeDriveAdd'), color: inDrive ? '#6366f1' : undefined, action: () => {
                      if (!inDrive && doc) uploadDocToDrive(doc);
                      setOpenMenuDocId(null);
                    }},
                    { icon: <FileEdit className="h-4 w-4" />, label: t('noteMenuEdit'), action: () => { if (doc) { setRenamingDocId(doc.doc_id); setRenamingDocTitle(doc.title); } setOpenMenuDocId(null); } },
                    { icon: <Trash2 className="h-4 w-4" />, label: t('noteMenuDelete'), color: '#ef4444', action: () => { setConfirmDeleteDocId(openMenuDocId); setOpenMenuDocId(null); } },
                  ];
                })().map(item => (
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

          {/* Import mode bottom bar */}
          {importMode && !importProgress && (
            <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3" style={{ background: 'var(--zet-bg-card)', borderTop: '1px solid var(--zet-border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.3)' }}>
              <span className="text-sm flex-1" style={{ color: 'var(--zet-text-muted)' }}>{importMode.selectedDocIds.size} {t('docCountUnit')} {t('selected')}</span>
              <button onClick={() => setImportMode(null)} className="px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-all" style={{ color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}>{t('cancel')}</button>
              <button onClick={executeImport} disabled={importMode.selectedDocIds.size === 0} className="px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: importMode.selectedDocIds.size > 0 ? 'var(--zet-primary)' : 'var(--zet-border)', color: 'var(--zet-text)', opacity: importMode.selectedDocIds.size === 0 ? 0.5 : 1 }}>{t('importComplete')}</button>
            </div>
          )}

          {/* Import progress overlay */}
          {importProgress && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
              <div className="rounded-2xl p-8 flex flex-col items-center gap-5 w-72" style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)' }}>
                <FolderInput className="h-10 w-10" style={{ color: '#4ca8ad' }} />
                <p className="text-base font-semibold" style={{ color: 'var(--zet-text)' }}>{t('importing')}</p>
                <div className="w-full rounded-full overflow-hidden h-3" style={{ background: 'var(--zet-border)' }}>
                  <div className="h-3 rounded-full transition-all duration-300" style={{ width: `${Math.round((importProgress.current / importProgress.total) * 100)}%`, background: 'linear-gradient(90deg, #4ca8ad, var(--zet-primary-light))' }} />
                </div>
                <p className="text-2xl font-bold" style={{ color: '#4ca8ad' }}>{Math.round((importProgress.current / importProgress.total) * 100)}%</p>
                <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{importProgress.current} / {importProgress.total} {t('docCountUnit')}</p>
              </div>
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
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${activeNotebook.color}25`, border: `1px solid ${activeNotebook.color}50` }}>
                <BookOpen className="h-4 w-4" style={{ color: activeNotebook.color }} />
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
                  placeholder={isFreeOffline ? 'Çevrimdışıyken not ekleyemezsin' : t('addNoteToNotebook')}
                  value={notebookNote}
                  onChange={(e) => !isFreeOffline && setNotebookNote(e.target.value)}
                  onKeyDown={(e) => !isFreeOffline && e.key === 'Enter' && addNoteToNotebook()}
                  className="zet-input flex-1"
                  disabled={isFreeOffline}
                  data-testid="notebook-note-input"
                  style={isFreeOffline ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                />
                <button
                  onClick={() => !isFreeOffline && addNoteToNotebook()}
                  className="zet-btn px-4"
                  disabled={isFreeOffline}
                  data-testid="add-notebook-note-btn"
                  style={isFreeOffline ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
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
                  <BookOpen className="h-3.5 w-3.5" />
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

            <div ref={notesListRef} className="flex-1 min-h-0 overflow-y-auto space-y-3" style={{ paddingBottom: 80 }}>
              {/* Defterler */}
              {notebooks.filter(nb => !searchQuery || nb.name.toLowerCase().includes(searchQuery.toLowerCase())).map(nb => {
                const hasPassword = !!(nb.password_hash || nb.has_password);
                const isUnlocked = unlockedNotebooks[nb.notebook_id];
                const isLocked = hasPassword && !isUnlocked;
                const lockUntil = nbLockoutUntil[nb.notebook_id] || 0;
                const lockRemaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
                return (
                <div key={nb.notebook_id} className="relative">
                  {renamingNotebookId === nb.notebook_id ? (
                    <div className="zet-card p-3 flex items-center gap-2" style={{ border: '1px solid var(--zet-primary)' }}>
                      <input
                        className="zet-input flex-1 text-sm"
                        value={renamingNotebookName}
                        onChange={e => setRenamingNotebookName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') renameNotebook(nb.notebook_id, renamingNotebookName); if (e.key === 'Escape') { setRenamingNotebookId(null); setRenamingNotebookName(''); } }}
                        autoFocus
                      />
                      <button onClick={() => renameNotebook(nb.notebook_id, renamingNotebookName)} className="p-1 rounded hover:bg-white/10">
                        <Check className="h-4 w-4" style={{ color: '#22c55e' }} />
                      </button>
                      <button onClick={() => { setRenamingNotebookId(null); setRenamingNotebookName(''); }} className="p-1 rounded hover:bg-white/10">
                        <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="zet-card p-4 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all"
                      style={{ border: nb.pinned ? '1px solid rgba(245,158,11,0.4)' : undefined, opacity: isLocked ? 0.75 : 1 }}
                      onClick={() => {
                        if (isLocked) {
                          if (lockRemaining > 0) { showToast(`${lockRemaining} saniye bekleyin`, 'error'); return; }
                          setNotebookPasswordModal({ mode: 'unlock', notebookId: nb.notebook_id, notebookName: nb.name });
                          setNbPwInput(''); setNbPwError('');
                        } else {
                          setActiveNotebook(nb);
                        }
                      }}
                      data-testid={`notebook-card-${nb.notebook_id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 relative"
                          style={{ background: `${nb.color || '#292F91'}25`, border: `1px solid ${nb.color || '#292F91'}50` }}>
                          <BookOpen className="h-4 w-4" style={{ color: nb.color || '#292F91' }} />
                          {hasPassword && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: isLocked ? '#ef4444' : '#22c55e', fontSize: 9 }}>
                              {isLocked ? '🔒' : '🔓'}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium" style={{ color: 'var(--zet-text)' }}>{nb.name}</p>
                            {nb.pinned && <Pin className="h-3 w-3" style={{ color: '#f59e0b' }} />}
                          </div>
                          <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>
                            {isLocked ? (lockRemaining > 0 ? `🔒 ${lockRemaining}s bekle` : '🔒 Şifreli') : `${notes.filter(n => n.notebook_id === nb.notebook_id).length} ${t('notesCount')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--zet-text-muted)' }} />
                        <button
                          onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setNotebookMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right }); setOpenMenuNotebookId(openMenuNotebookId === nb.notebook_id ? null : nb.notebook_id); }}
                          className="p-1 rounded hover:bg-white/10 transition-all"
                          style={{ color: 'var(--zet-text-muted)' }}
                          data-testid={`notebook-menu-${nb.notebook_id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Notebook dropdown menu */}
                  {openMenuNotebookId === nb.notebook_id && (
                    <div
                      className="fixed z-50 py-1 rounded-xl min-w-[180px] animate-fadeIn"
                      style={{ top: notebookMenuPos.top, right: notebookMenuPos.right, background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      {NOTEBOOK_MENU(nb).map(item => (
                        <button
                          key={item.label}
                          onClick={item.action}
                          disabled={item.disabled}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-all text-left hover:bg-white/5"
                          style={{ color: item.disabled ? 'var(--zet-text-muted)' : (item.color || 'var(--zet-text)'), opacity: item.disabled ? 0.4 : 1, cursor: item.disabled ? 'not-allowed' : 'pointer' }}
                        >
                          {item.icon}{item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                );
              })}

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
      <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: 'var(--zet-bg)', zIndex: 20 }}>
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

      {/* Delete Note Confirmation */}
      {confirmDeleteNoteId && (
        <DeleteConfirmModal
          title={t('deleteNote')} subtitle={t('cannotUndo')}
          onConfirm={() => { deleteNote(confirmDeleteNoteId); setConfirmDeleteNoteId(null); }}
          onCancel={() => setConfirmDeleteNoteId(null)}
          cancelLabel={t('cancel')} confirmLabel={t('yesDelete')}
        />
      )}

      {/* Backdrop to close floating menus */}
      {(openMenuNoteId || openMenuDocId || openMenuNotebookId || openMenuFileId) && (
        <div className="fixed inset-0 z-40" onClick={() => { setOpenMenuNoteId(null); setOpenMenuDocId(null); setOpenMenuNotebookId(null); setOpenMenuFileId(null); }} />
      )}

      {/* Delete Document Confirmation */}
      {confirmDeleteDocId && (
        <DeleteConfirmModal
          title={t('trashMoveTitle')} subtitle={t('trashMoveMsg')}
          onConfirm={() => { deleteDocument(confirmDeleteDocId); setConfirmDeleteDocId(null); }}
          onCancel={() => setConfirmDeleteDocId(null)}
          cancelLabel={t('cancel')} confirmLabel={t('moveBtn')}
        />
      )}

      {/* Trash Modal */}
      {showTrash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowTrash(false)}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" style={{ color: '#ef4444' }} />
                <h2 className="text-lg font-semibold" style={{ color: 'var(--zet-text)' }}>{t('recyclebin')}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{trashDocs.length}</span>
              </div>
              <div className="flex items-center gap-2">
                {trashDocs.length > 0 && (
                  <button onClick={emptyTrash} className="text-xs px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all" style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>{t('deleteAll')}</button>
                )}
                <button onClick={() => setShowTrash(false)} className="p-1.5 rounded-lg hover:bg-white/10"><X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>
              </div>
            </div>
            {trashLoading ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--zet-text-muted)' }}>{t('loading')}</p>
            ) : trashDocs.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--zet-text-muted)' }}>{t('trashEmpty')}</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                {trashDocs.map(doc => (
                  <div key={doc.doc_id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--zet-text)' }}>{doc.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--zet-text-muted)' }}>
                        {formatTime(doc.deleted_at)} · <span style={{ color: '#f59e0b' }}>{trashDaysRemaining(doc.deleted_at)} {t('daysLeft')}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button onClick={() => restoreDocument(doc.doc_id)} className="text-xs px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all" style={{ color: '#4ca8ad', border: '1px solid rgba(76,168,173,0.3)' }}>{t('restore')}</button>
                      <button onClick={() => permanentDelete(doc.doc_id)} className="text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 transition-all" style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>{t('permanentDelete')}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notebook Password Modal */}
      {notebookPasswordModal && (
        <NotebookPasswordModal
          notebookPasswordModal={notebookPasswordModal} setNotebookPasswordModal={setNotebookPasswordModal}
          nbPwInput={nbPwInput} setNbPwInput={setNbPwInput}
          nbPwConfirm={nbPwConfirm} setNbPwConfirm={setNbPwConfirm}
          nbPwError={nbPwError} setNbPwError={setNbPwError}
          nbPwLoading={nbPwLoading} nbLockoutUntil={nbLockoutUntil} nbFailedAttempts={nbFailedAttempts}
          handleNotebookPasswordSubmit={handleNotebookPasswordSubmit}
        />
      )}

      {/* Delete Notebook Confirmation */}
      {confirmDeleteNotebookId && (
        <DeleteConfirmModal
          title={t('deleteNotebook')} subtitle={t('cannotUndo')}
          onConfirm={() => { deleteNotebook(confirmDeleteNotebookId); setConfirmDeleteNotebookId(null); }}
          onCancel={() => setConfirmDeleteNotebookId(null)}
          cancelLabel={t('cancel')} confirmLabel={t('yesDelete')}
        />
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
          <span>{toast.type === 'success' ? <Check className="h-4 w-4" /> : toast.type === 'error' ? <X className="h-4 w-4" /> : <Bell className="h-4 w-4" />}</span>
          <span style={{ color: 'var(--zet-text)' }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal confirmModal={confirmModal} setConfirmModal={setConfirmModal} />
      )}

      {/* Hafizz Uyarı Popup */}
      {activeWarnings.length > 0 && (
        <WarningPopup warnings={activeWarnings} onDismiss={() => setActiveWarnings([])} />
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
              disabled={(newDocType === 'pdf' && !pdfFile) || creatingDoc}
              className="zet-btn w-full disabled:opacity-50"
            >
              {creatingDoc ? 'PDF işleniyor...' : newDocType === 'pdf' ? t('openPDF') : t('createDocument')}
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
                            savePreference('zet_shortcuts', JSON.stringify(newShortcuts));
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
                      savePreference('zet_fast_select', JSON.stringify(newTools));
                    } else if (fastSelectTools.length < fastSelectLimit) {
                      const newTools = [...fastSelectTools, tool.id];
                      setFastSelectTools(newTools);
                      savePreference('zet_fast_select', JSON.stringify(newTools));
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

      {showPlanFeatures && (
        <PlanFeaturesModal plan={userSubscription} onClose={() => setShowPlanFeatures(false)} />
      )}

      {/* Subscription Modal */}
      {showSubscription && (
        <SubscriptionModal
          onClose={() => { setShowSubscription(false); setSubscriptionInitSlide(null); }}
          userZP={userZP} billingCycle={billingCycle} setBillingCycle={setBillingCycle}
          currentPlanIndex={currentPlanIndex} setCurrentPlanIndex={setCurrentPlanIndex}
          SUBSCRIPTION_PLANS={SUBSCRIPTION_PLANS} userSubscription={userSubscription}
          subscribing={subscribing} handleSubscribe={handleSubscribe}
          handleBuyWithSP={handleBuyWithSP} t={t}
          initialSlide={subscriptionInitSlide}
        />
      )}


      {upgradePrompt && (
        <UpgradePromptModal
          featureName={upgradePrompt.featureName}
          requiredPlan={upgradePrompt.requiredPlan}
          currentPlan={userSubscription || 'free'}
          onClose={() => setUpgradePrompt(null)}
          onSubscribe={(planId) => {
            setUpgradePrompt(null);
            const planIdx = SUBSCRIPTION_PLANS.findIndex(p => p.id === planId);
            if (planIdx >= 0) setCurrentPlanIndex(planIdx);
            setShowSubscription(true);
          }}
          onDetails={() => {
            setUpgradePrompt(null);
            setShowSubscription(true);
          }}
        />
      )}

      {/* AI Settings Modal */}
      {showAISettings && (
        <AISettingsModal
          zetaMood={zetaMood} setZetaMood={setZetaMood}
          zetaEmoji={zetaEmoji} setZetaEmoji={setZetaEmoji}
          zetaCustomPrompt={zetaCustomPrompt} setZetaCustomPrompt={setZetaCustomPrompt}
          judgeMood={judgeMood} setJudgeMood={setJudgeMood}
          onClose={() => setShowAISettings(false)}
        />
      )}


      {/* Credits Purchase Modal */}
      {showCredits && (
        <CreditsModal
          creditPackages={creditPackages} buyingCredits={buyingCredits}
          handleBuyCredits={handleBuyCredits} onClose={() => setShowCredits(false)}
        />
      )}

      {/* Ranks Modal */}
      {showRanks && (
        <RanksModal
          currentRank={currentRank} nextRank={nextRank} rankProgress={rankProgress}
          userZP={userZP} RANKS={RANKS} RankIcon={RankIcon}
          onClose={() => setShowRanks(false)}
        />
      )}

      {/* Kasa Açma Modalı */}
      {openingCaseId && (
        <CaseOpenModal
          caseId={openingCaseId}
          showToast={showToast}
          onClose={() => setOpeningCaseId(null)}
          onReward={(r) => {
            setInventory(prev => prev.filter(c => c.id !== openingCaseId));
            if (r.type === 'zp') setUserZP(prev => prev + r.amount);
          }}
        />
      )}

      {/* Çark Modalı */}
      {openingWheelId && (
        <WheelModal
          caseId={openingWheelId}
          showToast={showToast}
          onClose={() => setOpeningWheelId(null)}
          onReward={(r) => {
            setInventory(prev => prev.filter(c => c.id !== openingWheelId));
            if (r.type === 'zp') setUserZP(prev => prev + r.amount);
          }}
        />
      )}

      {/* Paket Modalı */}
      {openingPackId && (
        <PackOpenModal
          packId={openingPackId}
          showToast={showToast}
          onClose={() => setOpeningPackId(null)}
          onNotFound={() => setInventory(prev => prev.filter(c => c.id !== openingPackId))}
          onReward={(r) => {
            setInventory(prev => prev.filter(c => c.id !== openingPackId));
            if (r.mode) setDUnlockedModes(prev => prev.includes(r.mode) ? prev : [...prev, r.mode]);
          }}
        />
      )}

      {/* Missions Modal */}
      {showMissions && <MissionsModal onClose={() => setShowMissions(false)} />}

      <QuestNotification quest={questNotification} onClose={() => setQuestNotification(null)} />

      {seasonResult && (
        <SeasonEndModal result={seasonResult} onClose={() => setSeasonResult(null)} />
      )}

      {/* Mood Info Modal */}
      {showMoodInfo && (() => {
        const MOOD_SLIDES = [
          { title: 'Mod Nedir?', desc: 'Mod seçimi Zeta\'nın temel kimliğini değiştirmez — sadece konuşma tonunu ayarlar. İstediğin zaman değiştirebilirsin.' },
          { title: 'Neşeli',      rarity: 'nadir', desc: 'Enerjik ve konuşkan. Konulara hevesle yaklaşır, sohbeti akıcı tutar.' },
          { title: 'Meraklı',     rarity: 'nadir', desc: 'Derinleştirir ve sorgular. Araştırma ve keşif konuşmaları için idealdir.' },
          { title: 'Profesyonel', rarity: 'nadir', desc: 'Resmi ve odaklı. İş ve akademik konular için temiz, net yanıtlar verir.' },
          { title: 'Özel',        rarity: 'nadir', desc: 'Kendi isteğini yazabilirsin. Zeta tam olarak belirlediğin tonda konuşacak.' },
          { title: 'Agresif',     rarity: 'epik',  badge: 'Kasaya Özel', warn: true, desc: 'Kısa, sert ve aşağılayıcı bir ton. Uyarı: ağır dil içerebilir.' },
          { title: 'Robot',       rarity: 'nadir', badge: 'Kasaya Özel', desc: 'Tamamen mekanik format: "KOMUT ALINDI / SONUÇ / BİTTİ"' },
          { title: 'Yorgun',      rarity: 'nadir', badge: 'Kasaya Özel', desc: 'Hayattan bezgin, usanmış, uyuşuk bir ton. Her şeye uğursuz yaklaşır.' },
        ];
        const slide = MOOD_SLIDES[moodInfoSlide];
        const col = slide.rarity ? RARITY_COL[slide.rarity] : '#4ca8ad';
        return (
          <div onClick={() => setShowMoodInfo(false)} style={{ position: 'fixed', inset: 0, zIndex: 10100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#0d1117', border: '1px solid #252545', borderRadius: 16, padding: '24px 28px', width: '100%', maxWidth: 420 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>Zeta AI Modları</span>
                <button onClick={() => setShowMoodInfo(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: '#aaa', width: 28, height: 28, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div style={{ minHeight: 130 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  {slide.rarity && <span style={{ width: 10, height: 10, borderRadius: '50%', background: col, flexShrink: 0 }} />}
                  <span style={{ color: col, fontWeight: 700, fontSize: 17 }}>{slide.title}</span>
                  {slide.badge && (
                    <span style={{ background: '#1e1b4b', border: `1px solid ${col}`, borderRadius: 4, color: col, fontSize: 10, padding: '1px 6px', fontWeight: 600 }}>{slide.badge}</span>
                  )}
                </div>
                {slide.warn && (
                  <div style={{ background: '#1a0a0a', border: '1px solid #ef4444', borderRadius: 8, padding: '7px 10px', marginBottom: 10 }}>
                    <span style={{ color: '#fca5a5', fontSize: 12 }}>Uyarı: Bu mod ağır dil içerebilir.</span>
                  </div>
                )}
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>{slide.desc}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                <button onClick={() => setMoodInfoSlide(p => Math.max(0, p - 1))} disabled={moodInfoSlide === 0} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: moodInfoSlide === 0 ? '#2d3748' : '#94a3b8', width: 32, height: 32, cursor: moodInfoSlide === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <div style={{ display: 'flex', gap: 5 }}>
                  {MOOD_SLIDES.map((_, i) => (
                    <button key={i} onClick={() => setMoodInfoSlide(i)} style={{ width: i === moodInfoSlide ? 20 : 8, height: 8, borderRadius: 4, background: i === moodInfoSlide ? '#4ca8ad' : '#1e293b', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }} />
                  ))}
                </div>
                <button onClick={() => setMoodInfoSlide(p => Math.min(MOOD_SLIDES.length - 1, p + 1))} disabled={moodInfoSlide === MOOD_SLIDES.length - 1} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: moodInfoSlide === MOOD_SLIDES.length - 1 ? '#2d3748' : '#94a3b8', width: 32, height: 32, cursor: moodInfoSlide === MOOD_SLIDES.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
              <p style={{ color: '#334155', fontSize: 11, textAlign: 'center', marginTop: 8 }}>{moodInfoSlide + 1} / {MOOD_SLIDES.length}</p>
            </div>
          </div>
        );
      })()}

      {/* Troll Confirm Popup */}
      {moodPending && DASH_TROLL[moodPending] && (
        <div onClick={() => setMoodPending(null)} style={{ position: 'fixed', inset: 0, zIndex: 10100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0d1117', border: `1px solid ${DASH_TROLL[moodPending].color}40`, borderRadius: 16, padding: '24px 28px', width: '100%', maxWidth: 380 }}>
            <p style={{ color: DASH_TROLL[moodPending].color, fontWeight: 700, fontSize: 16, marginBottom: 10 }}>
              {DASH_TROLL[moodPending].label} Modunu Etkinleştir
            </p>
            {moodPending === 'agresif' && (
              <div style={{ background: '#450a0a', border: '1px solid #ef4444', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
                <span style={{ color: '#fca5a5', fontSize: 13 }}>Uyarı: {DASH_TROLL[moodPending].warn}</span>
              </div>
            )}
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Bu mod etkinleştirilince Zeta bu tonda konuşacak. İstediğin zaman geri alabilirsin.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setMoodPending(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#94a3b8', fontSize: 13, fontWeight: 600, padding: '10px 0', cursor: 'pointer' }}>
                Vazgeç
              </button>
              <button onClick={() => {
                setZetaMood(moodPending);
                localStorage.setItem('zet_zeta_mood', moodPending);
                setMoodPending(null);
              }} style={{ flex: 1, background: DASH_TROLL[moodPending].color, border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 0', cursor: 'pointer' }}>
                Etkinleştir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Locked Mode Popup */}
      {moodLocked && (
        <div onClick={() => setMoodLocked(null)} style={{ position: 'fixed', inset: 0, zIndex: 10100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0d1117', border: '1px solid #252545', borderRadius: 16, padding: '24px 28px', width: '100%', maxWidth: 360, textAlign: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 14 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
              {DASH_TROLL[moodLocked]?.label || moodLocked} Kilitli
            </p>
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              Bu mod kasaya özeldir — kasadan açarak kazanabilirsin.
            </p>
            <button onClick={() => setMoodLocked(null)} style={{ background: 'linear-gradient(135deg, #4ca8ad, #2d7a7e)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 32px', cursor: 'pointer' }}>
              Tamam
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
