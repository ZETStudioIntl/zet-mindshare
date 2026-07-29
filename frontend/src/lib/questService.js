const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const questService = {
  async fireCounter(field, amount = 1) {
    try {
      await fetch(`${API}/quests/event`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: field, amount }),
      });
    } catch {}
  },
};
