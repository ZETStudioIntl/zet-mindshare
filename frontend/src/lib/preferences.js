import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Hesaba bağlı tercihler — bu key'ler server'a sync edilir
const PREF_KEYS = [
  'zet_saved_gradients',
  'zet_shortcuts',
  'zet_fast_select',
  'zet_zeta_mood',
  'zet_zeta_emoji',
  'zet_zeta_custom',
  'zet_judge_mood',
  'zet-language',
  'zet_active_app',
  'zet_editor_text_defaults',
];

let _debounceTimer = null;
let _pendingUpdates = {};

// Auth sonrası çağrılır — server'dan çeker, localStorage'ı günceller
export const loadPreferences = async () => {
  try {
    const res = await axios.get(`${API}/users/preferences`, { withCredentials: true });
    const prefs = res.data.preferences || {};
    PREF_KEYS.forEach(key => {
      if (prefs[key] !== undefined) {
        const val = typeof prefs[key] === 'string' ? prefs[key] : JSON.stringify(prefs[key]);
        localStorage.setItem(key, val);
      }
    });
    // LanguageContext ve AppThemeContext gibi önceden mount olmuş provider'ları bilgilendir
    window.dispatchEvent(new CustomEvent('zet:preferences-loaded', { detail: prefs }));
    return prefs;
  } catch {
    return {};
  }
};

// localStorage'a yazar + 1s debounce ile server'a gönderir
export const savePreference = (key, value) => {
  localStorage.setItem(key, value);
  _pendingUpdates[key] = value;
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(async () => {
    const updates = { ..._pendingUpdates };
    _pendingUpdates = {};
    try {
      await axios.put(`${API}/users/preferences`, { preferences: updates }, { withCredentials: true });
    } catch {}
  }, 1000);
};
