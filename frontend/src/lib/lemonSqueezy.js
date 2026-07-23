import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Touch device OR narrow viewport → mobile hosted checkout
// (Payment Request API / Apple Pay / Google Pay requires top-level browsing context)
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  const uaMatch = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const narrow = window.innerWidth < 768;
  return uaMatch || (hasTouch && narrow);
};

const withEmbed = (url) => {
  try {
    const u = new URL(url);
    u.searchParams.set('embed', '1');
    return u.toString();
  } catch {
    return url + (url.includes('?') ? '&' : '?') + 'embed=1';
  }
};

export const openCheckoutOverlay = (url) => {
  if (!url) return;
  if (isMobile()) {
    // Mobile: full-page redirect so Apple Pay / Google Pay native sheets work
    window.location.href = url;
  } else {
    // Desktop: overlay via LemonSqueezy.js SDK (requires ?embed=1)
    const embedUrl = withEmbed(url);
    if (window.LemonSqueezy?.Url?.Open) {
      window.LemonSqueezy.Url.Open(embedUrl);
    } else {
      window.open(embedUrl, '_blank', 'noopener,noreferrer');
    }
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
