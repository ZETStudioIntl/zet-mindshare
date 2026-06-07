import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STORAGE_KEY = 'zet_id_accounts';

export const getZetIdAccounts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveZetIdAccounts = (accounts) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
};

export const upsertZetIdAccount = (account) => {
  const accounts = getZetIdAccounts().filter((a) => a.zet_id !== account.zet_id);
  accounts.unshift(account);
  saveZetIdAccounts(accounts);
  return accounts;
};

export const removeZetIdAccount = (zetId) => {
  const accounts = getZetIdAccounts().filter((a) => a.zet_id !== zetId);
  saveZetIdAccounts(accounts);
  return accounts;
};

const toAccount = (data, fallback = {}) => ({
  zet_id: data.zet_id || data.user?.zet_id || fallback.zet_id,
  user_id: data.user?.user_id || fallback.user_id,
  email: data.user?.email || fallback.email,
  name: data.user?.name || fallback.name,
  picture: data.user?.picture || fallback.picture,
  access_token: data.access_token || fallback.access_token,
  refresh_token: data.refresh_token || fallback.refresh_token,
});

// Aktif oturum için ZET ID oluşturur/alır (yoksa migrasyon yapar) ve bu cihazın hesap listesine ekler
export const createZetIdForCurrentSession = async () => {
  const res = await axios.post(`${API}/zet-id/create`, {}, { withCredentials: true });
  const account = toAccount(res.data);
  upsertZetIdAccount(account);
  return { ...res.data, account };
};

// Cihazda kayıtlı ZET ID hesabıyla tek dokunuşla giriş — "ZET ID ile Giriş Yap" akışı
export const loginWithZetIdAccount = async (account) => {
  const res = await axios.post(
    `${API}/zet-id/login`,
    { access_token: account.access_token, refresh_token: account.refresh_token },
    { withCredentials: true }
  );
  const updated = toAccount(res.data, account);
  upsertZetIdAccount(updated);
  if (res.data.session_token) localStorage.setItem('session_token', res.data.session_token);
  return { ...res.data, account: updated };
};
