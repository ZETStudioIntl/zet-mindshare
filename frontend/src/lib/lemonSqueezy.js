import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const isMobile = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export const openCheckoutOverlay = (url) => {
  if (!url) return;
  if (isMobile()) {
    // On mobile, redirect to LS checkout page directly so Apple Pay / Google Pay
    // native sheets can appear (iframe blocks the Payment Request API)
    window.location.href = url;
  } else if (window.LemonSqueezy?.Url?.Open) {
    window.LemonSqueezy.Url.Open(url);
  } else {
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
