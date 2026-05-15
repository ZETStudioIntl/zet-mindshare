import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Opens a LemonSqueezy checkout in an overlay.
 * If the lemon.js script hasn't loaded yet, falls back to a new tab
 * so the user never loses their current page.
 */
export const openCheckoutOverlay = (url) => {
  if (!url) return;
  if (window.LemonSqueezy?.Url?.Open) {
    window.LemonSqueezy.Url.Open(url);
  } else {
    // lemon.js not yet loaded — open in new tab instead of navigating away
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Calls the backend to create a checkout session then opens the overlay.
 * Returns true on success, false on error.
 */
export const startCheckout = async (planId, billingCycle = 'monthly') => {
  try {
    const res = await axios.post(
      `${API}/checkout/lemonsqueezy`,
      { plan: planId, billing_cycle: billingCycle },
      { withCredentials: true }
    );
    openCheckoutOverlay(res.data.checkout_url);
    return true;
  } catch (err) {
    const msg = err?.response?.data?.detail || err?.message || 'Ödeme sayfası açılamadı';
    console.error('Checkout error:', msg);
    return false;
  }
};
