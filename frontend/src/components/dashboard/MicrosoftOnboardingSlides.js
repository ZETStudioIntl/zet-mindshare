import React, { useState, useEffect, useCallback } from 'react';

const MS_BLUE = '#0078D4';
const MS_GREEN = '#107C10';
const MS_YELLOW = '#FFB900';
const MS_RED = '#D83B01';
const MS_PURPLE = '#5C2D91';

const SLIDES = [
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect width="56" height="56" rx="16" fill={MS_BLUE + '22'} />
        <image href="/logo-mindshare.svg" x="8" y="8" width="40" height="40" />
      </svg>
    ),
    tag: 'Welcome',
    tagColor: MS_BLUE,
    title: 'Welcome to ZET Mindshare',
    body: 'An AI-powered creative workspace for writing, thinking, and learning. This guide walks you through everything in under 3 minutes.',
    note: 'Beta · Creative Station plan active on this account',
  },
  {
    icon: <GridIcon />,
    tag: 'Overview',
    tagColor: MS_BLUE,
    title: 'Four Core Pillars',
    bullets: [
      { color: MS_BLUE,   label: 'Document Editor', desc: 'Rich text, canvas tools, multi-page documents' },
      { color: MS_GREEN,  label: 'Zeta AI',          desc: 'Writing assistant embedded in every document' },
      { color: MS_YELLOW, label: 'Prime Drive',       desc: 'Cloud file storage, upload & share' },
      { color: MS_RED,    label: 'Quest System',      desc: 'Gamified learning with XP, ranks, and seasons' },
    ],
  },
  {
    icon: <LayoutIcon />,
    tag: 'Navigation',
    tagColor: MS_BLUE,
    title: 'App Structure',
    body: 'The app has three main areas accessible from the App Selector screen.',
    bullets: [
      { color: MS_BLUE,   label: 'ZET Mindshare', desc: 'Dashboard with documents, notes, and settings' },
      { color: MS_RED,    label: 'ZET Judge',      desc: 'AI business analysis tool (prototype)' },
    ],
    note: 'Use the Z logo in the top-left to return to the App Selector at any time.',
  },
  {
    icon: <DocIcon />,
    tag: 'Editor',
    tagColor: MS_BLUE,
    title: 'Document Editor',
    body: 'Create multi-page documents with rich formatting. Every document is auto-saved locally and synced to the cloud on Creative Station.',
    bullets: [
      { color: MS_BLUE, label: 'New Document', desc: 'Click "+ New Document" on the Dashboard' },
      { color: MS_BLUE, label: 'Multi-page',   desc: 'Add pages via the right panel' },
      { color: MS_BLUE, label: 'Auto-save',    desc: 'All changes saved automatically' },
    ],
  },
  {
    icon: <CanvasIcon />,
    tag: 'Canvas',
    tagColor: MS_PURPLE,
    title: 'Canvas Tools',
    body: 'Beyond text — the editor includes a full canvas layer on each page.',
    bullets: [
      { color: MS_PURPLE, label: 'Pen & Eraser',   desc: 'Freehand drawing with pressure sensitivity' },
      { color: MS_PURPLE, label: 'Shapes & Text',   desc: 'Geometric shapes, arrows, text boxes' },
      { color: MS_PURPLE, label: 'Tables & Charts', desc: 'Insert structured data and charts' },
      { color: MS_PURPLE, label: 'Images',          desc: 'Upload and position images on canvas' },
    ],
  },
  {
    icon: <ZetaIcon />,
    tag: 'Zeta AI',
    tagColor: MS_GREEN,
    title: 'Meet Zeta',
    body: 'Zeta is your AI writing assistant, available in every document via the right panel. It reads your document content and canvas in real time.',
    bullets: [
      { color: MS_GREEN, label: 'Chat Mode',  desc: 'Ask anything about your document or topic' },
      { color: MS_GREEN, label: 'Edit Mode',  desc: 'Ask Zeta to rewrite or extend selected text' },
      { color: MS_GREEN, label: 'Patch Mode', desc: 'Apply structured edits across the document' },
    ],
  },
  {
    icon: <TextIcon />,
    tag: 'Formatting',
    tagColor: MS_BLUE,
    title: 'Rich Text Formatting',
    body: 'Full text formatting via the left toolbar in the editor.',
    bullets: [
      { color: MS_BLUE, label: 'Fonts',        desc: '100+ fonts available' },
      { color: MS_BLUE, label: 'Styles',        desc: 'H1–H6, paragraph, code block' },
      { color: MS_BLUE, label: 'Lists',         desc: 'Bullet and numbered lists' },
      { color: MS_BLUE, label: 'Columns',       desc: 'Multi-column page layouts' },
    ],
  },
  {
    icon: <ExportIcon />,
    tag: 'Export',
    tagColor: MS_BLUE,
    title: 'Export Your Work',
    body: 'Export documents to PDF from the document\'s three-dot menu on the Dashboard, or from within the Editor.',
    note: 'PDF export preserves canvas elements, fonts, and multi-page layout.',
  },
  {
    icon: <NoteIcon />,
    tag: 'Notes',
    tagColor: MS_YELLOW,
    title: 'Quick Notes',
    body: 'Capture thoughts fast using the Notes tab in the Dashboard. Notes are stored locally and synced on CS plan.',
    bullets: [
      { color: MS_YELLOW, label: 'Markdown support', desc: 'Write in plain text or markdown' },
      { color: MS_YELLOW, label: 'Pin & Tag',         desc: 'Pin important notes to the top' },
      { color: MS_YELLOW, label: 'AI Analysis',       desc: 'Analyze any note with Zeta' },
      { color: MS_YELLOW, label: 'Drive upload',      desc: 'Send notes to Prime Drive as .txt' },
    ],
  },
  {
    icon: <DriveIcon />,
    tag: 'Prime Drive',
    tagColor: MS_BLUE,
    title: 'Prime Drive',
    body: 'Cloud file storage integrated directly in the Dashboard. Upload any file and access it anywhere.',
    bullets: [
      { color: MS_BLUE, label: 'Upload any file', desc: 'Drag or click to upload documents, images, etc.' },
      { color: MS_BLUE, label: 'Open .zetdoc',    desc: 'Open exported ZET documents directly in the editor' },
      { color: MS_BLUE, label: 'Manage files',    desc: 'Rename, delete, and organize your cloud files' },
    ],
  },
  {
    icon: <QuestIcon />,
    tag: 'Quest Map',
    tagColor: MS_YELLOW,
    title: 'Quest Map',
    body: 'Complete tasks to earn ZP (Quest Points) and unlock new quest levels. Quests are tied to real app usage.',
    bullets: [
      { color: MS_YELLOW, label: 'Circle (20 ZP)',   desc: 'Beginner quests — get started' },
      { color: MS_YELLOW, label: 'Square (60 ZP)',   desc: 'Intermediate — build habits' },
      { color: MS_YELLOW, label: 'Triangle (130 ZP)', desc: 'Advanced — power user tasks' },
      { color: MS_YELLOW, label: 'Star (200 ZP)',    desc: 'Expert — master the platform' },
    ],
    note: 'Access Quest Map from the bottom navigation bar in the Dashboard.',
  },
  {
    icon: <JudgeIcon />,
    tag: 'Judge AI',
    tagColor: MS_RED,
    title: 'ZET Judge (Prototype)',
    body: 'A dedicated AI for business plan evaluation, risk analysis, and strategic decision-making.',
    bullets: [
      { color: MS_RED, label: 'Plan Analysis',   desc: 'Submit business plans for structured feedback' },
      { color: MS_RED, label: 'Risk Scoring',    desc: 'Automated risk and success probability scoring' },
      { color: MS_RED, label: 'Deep Research',   desc: 'Extended analysis mode for complex decisions' },
    ],
    note: 'Judge is in early prototype. Core analysis is functional; UI is still evolving.',
  },
  {
    icon: <LangIcon />,
    tag: 'Languages',
    tagColor: MS_BLUE,
    title: '10 Language Support',
    body: 'The entire app UI is available in 10 languages. Switch at any time from Settings → Language.',
    bullets: [
      { color: MS_BLUE, label: 'EN / TR / DE / FR', desc: 'English, Turkish, German, French' },
      { color: MS_BLUE, label: 'ES / AR / RU',       desc: 'Spanish, Arabic, Russian' },
      { color: MS_BLUE, label: 'JA / KO / ZH',       desc: 'Japanese, Korean, Chinese' },
    ],
    note: 'RTL layout is fully supported for Arabic.',
  },
  {
    icon: <PlanIcon />,
    tag: 'Plans',
    tagColor: MS_BLUE,
    title: 'Subscription Plans',
    bullets: [
      { color: '#6b7280', label: 'Free',             desc: 'Local documents, basic Zeta, 25 AI memories' },
      { color: '#6366f1', label: 'Plus',             desc: 'More AI credits, 75 memories, priority support' },
      { color: MS_BLUE,   label: 'Pro',              desc: 'Editor cloud sync, 200 memories, Pro features' },
      { color: MS_YELLOW, label: 'Creative Station', desc: 'Full sync across all apps, unlimited memories, Prime Drive' },
    ],
    note: 'This guest account has Creative Station plan for testing purposes.',
  },
  {
    icon: <GuestIcon />,
    tag: 'Your Account',
    tagColor: MS_GREEN,
    title: 'Test Account Details',
    bullets: [
      { color: MS_GREEN, label: 'Plan',        desc: 'Creative Station (full access)' },
      { color: MS_GREEN, label: 'Session',     desc: '7-day guest session (no sign-in required)' },
      { color: MS_GREEN, label: 'AI Credits',  desc: '100 credits pre-loaded' },
      { color: MS_GREEN, label: 'Quest XP',    desc: '500 ZP pre-loaded' },
    ],
    note: 'All features of the CS plan are available without any account creation.',
  },
  {
    icon: <SettingsIcon />,
    tag: 'Settings',
    tagColor: MS_BLUE,
    title: 'Settings & Customization',
    body: 'Access settings via the gear icon in the top-right of the Dashboard.',
    bullets: [
      { color: MS_BLUE, label: 'Profile',    desc: 'Name, username, bio, profile picture' },
      { color: MS_BLUE, label: 'Language',   desc: 'Switch between 10 supported languages' },
      { color: MS_BLUE, label: 'Zeta AI',    desc: 'Model, persona, custom prompt, emoji usage' },
      { color: MS_BLUE, label: 'Appearance', desc: 'Greeting style and color customization' },
    ],
  },
  {
    icon: <BugIcon />,
    tag: 'Known Issues',
    tagColor: MS_RED,
    title: 'Known Issues',
    body: 'We are actively working to resolve the following. All items will be fixed before full release.',
    bullets: [
      { color: MS_RED,    label: 'Zeta Patch',  desc: 'Patch mode is currently broken' },
      { color: MS_YELLOW, label: 'Judge AI',     desc: 'Prototype — core works, UI still evolving' },
      { color: MS_RED,    label: 'Zeta Edit',    desc: 'Edit mode is limited in some scenarios' },
      { color: MS_YELLOW, label: 'Quests',       desc: 'Quest system is in active testing' },
    ],
    note: 'Paddle payment sync is in progress. Expected resolution within 1–2 months.',
  },
  {
    icon: <BetaIcon />,
    tag: 'Beta',
    tagColor: MS_YELLOW,
    title: 'Beta Status',
    body: 'ZET Mindshare is currently in public beta. Core features are stable and fully functional.',
    bullets: [
      { color: MS_GREEN,  label: 'Stable',     desc: 'Editor, Zeta AI, Drive, Notes, Quest Map' },
      { color: MS_YELLOW, label: 'Prototype',   desc: 'Judge AI — functional but UI evolving' },
      { color: MS_BLUE,   label: 'Coming Soon', desc: 'Collaboration, version history, plugins' },
    ],
    note: 'Full release expected within 1–2 months.',
  },
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect width="56" height="56" rx="16" fill={MS_BLUE + '22'} />
        <rect x="10" y="10" width="16" height="16" fill={MS_RED} />
        <rect x="30" y="10" width="16" height="16" fill={MS_GREEN} />
        <rect x="10" y="30" width="16" height="16" fill={MS_BLUE} />
        <rect x="30" y="30" width="16" height="16" fill={MS_YELLOW} />
      </svg>
    ),
    tag: 'Thank You',
    tagColor: MS_BLUE,
    title: 'Thank You, Microsoft',
    body: 'Thank you for reviewing ZET Mindshare. We appreciate your time and look forward to bringing this experience to Windows users worldwide.',
    note: 'Questions? Contact us at support@zetstudiointl.com',
  },
];

function GridIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_BLUE + '22'} />
      <rect x="12" y="12" width="13" height="13" rx="3" fill={MS_BLUE} />
      <rect x="31" y="12" width="13" height="13" rx="3" fill={MS_GREEN} />
      <rect x="12" y="31" width="13" height="13" rx="3" fill={MS_YELLOW} />
      <rect x="31" y="31" width="13" height="13" rx="3" fill={MS_RED} />
    </svg>
  );
}
function LayoutIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_BLUE + '22'} />
      <rect x="10" y="10" width="36" height="8" rx="3" fill={MS_BLUE} />
      <rect x="10" y="22" width="16" height="24" rx="3" fill={MS_BLUE + '60'} />
      <rect x="30" y="22" width="16" height="24" rx="3" fill={MS_BLUE + '40'} />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_BLUE + '22'} />
      <rect x="14" y="10" width="24" height="30" rx="3" fill={MS_BLUE + '40'} stroke={MS_BLUE} strokeWidth="1.5" />
      <rect x="18" y="16" width="16" height="2" rx="1" fill={MS_BLUE} />
      <rect x="18" y="21" width="12" height="2" rx="1" fill={MS_BLUE + '80'} />
      <rect x="18" y="26" width="14" height="2" rx="1" fill={MS_BLUE + '80'} />
      <rect x="18" y="31" width="10" height="2" rx="1" fill={MS_BLUE + '60'} />
    </svg>
  );
}
function CanvasIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_PURPLE + '22'} />
      <circle cx="20" cy="20" r="6" fill={MS_PURPLE + '60'} stroke={MS_PURPLE} strokeWidth="1.5" />
      <rect x="30" y="14" width="12" height="12" rx="2" fill={MS_PURPLE + '60'} stroke={MS_PURPLE} strokeWidth="1.5" />
      <path d="M12 36 L24 28 L36 36 L44 30" stroke={MS_PURPLE} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
function ZetaIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_GREEN + '22'} />
      <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill={MS_GREEN} fontSize="28" fontWeight="800" fontFamily="sans-serif">Z</text>
    </svg>
  );
}
function TextIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_BLUE + '22'} />
      <path d="M14 16 L42 16" stroke={MS_BLUE} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 22 L36 22" stroke={MS_BLUE} strokeWidth="2" strokeLinecap="round" />
      <path d="M14 28 L38 28" stroke={MS_BLUE} strokeWidth="2" strokeLinecap="round" />
      <path d="M14 34 L30 34" stroke={MS_BLUE} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function ExportIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_BLUE + '22'} />
      <rect x="14" y="12" width="20" height="26" rx="2" fill={MS_BLUE + '30'} stroke={MS_BLUE} strokeWidth="1.5" />
      <path d="M34 12 L40 18" stroke={MS_BLUE} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="34" y="12" width="6" height="6" rx="1" fill={MS_BLUE + '60'} />
      <path d="M30 36 L30 46 M26 42 L30 46 L34 42" stroke={MS_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function NoteIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_YELLOW + '22'} />
      <rect x="12" y="12" width="32" height="32" rx="4" fill={MS_YELLOW + '30'} stroke={MS_YELLOW} strokeWidth="1.5" />
      <path d="M18 22 L38 22 M18 28 L34 28 M18 34 L30 34" stroke={MS_YELLOW} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function DriveIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_BLUE + '22'} />
      <path d="M20 38 L10 38 L18 24 L28 24 Z" fill={MS_BLUE + '60'} stroke={MS_BLUE} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M28 38 L22 24 L36 24 L42 38 Z" fill={MS_GREEN + '60'} stroke={MS_GREEN} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 38 L42 38" stroke={MS_YELLOW} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function QuestIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_YELLOW + '22'} />
      <polygon points="28,10 34,22 48,24 38,34 40,48 28,42 16,48 18,34 8,24 22,22" fill={MS_YELLOW + '40'} stroke={MS_YELLOW} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
function JudgeIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_RED + '22'} />
      <path d="M16 38 L28 14 L40 38" stroke={MS_RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M20 30 L36 30" stroke={MS_RED} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function LangIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_BLUE + '22'} />
      <circle cx="28" cy="28" r="16" stroke={MS_BLUE} strokeWidth="2" fill="none" />
      <path d="M28 12 Q22 28 28 44" stroke={MS_BLUE} strokeWidth="1.5" fill="none" />
      <path d="M28 12 Q34 28 28 44" stroke={MS_BLUE} strokeWidth="1.5" fill="none" />
      <path d="M12 28 L44 28" stroke={MS_BLUE} strokeWidth="1.5" />
      <path d="M13 21 Q28 18 43 21" stroke={MS_BLUE} strokeWidth="1" fill="none" />
      <path d="M13 35 Q28 38 43 35" stroke={MS_BLUE} strokeWidth="1" fill="none" />
    </svg>
  );
}
function PlanIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_BLUE + '22'} />
      <rect x="10" y="20" width="36" height="22" rx="4" fill="none" stroke={MS_BLUE} strokeWidth="2" />
      <path d="M10 28 L46 28" stroke={MS_BLUE} strokeWidth="1.5" />
      <circle cx="20" cy="37" r="3" fill={MS_YELLOW} />
      <path d="M26 37 L38 37" stroke={MS_BLUE + '80'} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 24 L37 24" stroke={MS_BLUE + '60'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function GuestIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_GREEN + '22'} />
      <circle cx="28" cy="22" r="8" fill={MS_GREEN + '60'} stroke={MS_GREEN} strokeWidth="2" />
      <path d="M14 42 Q14 32 28 32 Q42 32 42 42" stroke={MS_GREEN} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_BLUE + '22'} />
      <circle cx="28" cy="28" r="7" fill="none" stroke={MS_BLUE} strokeWidth="2" />
      <path d="M28 12 L28 16 M28 40 L28 44 M12 28 L16 28 M40 28 L44 28 M16.7 16.7 L19.5 19.5 M36.5 36.5 L39.3 39.3 M39.3 16.7 L36.5 19.5 M19.5 36.5 L16.7 39.3" stroke={MS_BLUE} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function BugIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_RED + '22'} />
      <circle cx="28" cy="28" r="10" fill="none" stroke={MS_RED} strokeWidth="2" />
      <path d="M21 19 L17 15 M35 19 L39 15" stroke={MS_RED} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 28 L12 28 M38 28 L44 28" stroke={MS_RED} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M21 37 L17 41 M35 37 L39 41" stroke={MS_RED} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M24 24 L32 24 M24 32 L32 32" stroke={MS_RED} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function BetaIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill={MS_YELLOW + '22'} />
      <path d="M28 10 L30.9 20.6 L42 20.6 L33.1 27.2 L36 37.8 L28 31.2 L20 37.8 L22.9 27.2 L14 20.6 L25.1 20.6 Z" fill={MS_YELLOW + '60'} stroke={MS_YELLOW} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M18 44 L38 44" stroke={MS_YELLOW} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function MicrosoftOnboardingSlides({ onClose }) {
  const [idx, setIdx] = useState(0);
  const total = SLIDES.length;

  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx(i => Math.min(total - 1, i + 1)), [total]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, onClose]);

  const slide = SLIDES[idx];
  const progress = ((idx + 1) / total) * 100;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: '#0d1117',
        border: '1px solid #1e2433',
        borderRadius: 24,
        width: '100%', maxWidth: 640,
        boxShadow: '0 24px 80px rgba(0,120,212,0.18)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: '#1e2433' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: `linear-gradient(90deg, ${MS_BLUE}, #50e6ff)`,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect width="9" height="9" fill={MS_RED} />
              <rect x="11" width="9" height="9" fill={MS_GREEN} />
              <rect y="11" width="9" height="9" fill={MS_BLUE} />
              <rect x="11" y="11" width="9" height="9" fill={MS_YELLOW} />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ZET Mindshare — Overview
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#4b5563', fontVariantNumeric: 'tabular-nums' }}>{idx + 1} / {total}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Slide content */}
        <div style={{ padding: '24px 32px 20px', minHeight: 340 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
            <div style={{ flexShrink: 0 }}>{slide.icon}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                display: 'inline-block', fontSize: 11, fontWeight: 700,
                color: slide.tagColor, background: slide.tagColor + '18',
                border: `1px solid ${slide.tagColor}40`,
                borderRadius: 20, padding: '2px 10px', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>{slide.tag}</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: 0, lineHeight: 1.2 }}>{slide.title}</h2>
            </div>
          </div>

          {slide.body && (
            <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.65, margin: '0 0 18px' }}>{slide.body}</p>
          )}

          {slide.bullets && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {slide.bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 3, height: 36, borderRadius: 2, flexShrink: 0,
                    background: b.color, marginTop: 2,
                  }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{b.label}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slide.note && (
            <div style={{
              marginTop: 18, padding: '10px 14px',
              background: '#0078D422', border: '1px solid #0078D440',
              borderRadius: 8, fontSize: 12, color: '#93c5fd', lineHeight: 1.5,
            }}>
              {slide.note}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 20px', borderTop: '1px solid #1e2433',
        }}>
          <button
            onClick={prev}
            disabled={idx === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1px solid #1e2433',
              color: idx === 0 ? '#374151' : '#9ca3af',
              borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: idx === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            Previous
          </button>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 4 }}>
            {SLIDES.map((_, i) => (
              <div
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 16 : 6, height: 6, borderRadius: 3,
                  background: i === idx ? MS_BLUE : '#1e2433',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              />
            ))}
          </div>

          {idx < total - 1 ? (
            <button
              onClick={next}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: MS_BLUE, border: 'none',
                color: '#fff', borderRadius: 10, padding: '8px 16px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: MS_GREEN, border: 'none',
                color: '#fff', borderRadius: 10, padding: '8px 16px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Get Started
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
