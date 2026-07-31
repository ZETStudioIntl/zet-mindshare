const PADDLE_CLIENT_TOKEN = process.env.REACT_APP_PADDLE_CLIENT_TOKEN || '';
const IS_SANDBOX = process.env.REACT_APP_PADDLE_ENV === 'sandbox';

const PADDLE_PRICES = {
  plus:             { monthly: 'pri_01kyvfkckwcaymmcp28haj7wdx', yearly: 'pri_01kyvfv0e11nn6gj6wbc0c4pt8' },
  pro:              { monthly: 'pri_01kyvh3djaq82s8fq8x2z1kht1', yearly: 'pri_01kyvh5shj156wresbp49gqgt8' },
  creative_station: { monthly: 'pri_01kyvh762mgc9q9pvd9hfqbn9t', yearly: 'pri_01kyvh8j1zrbfrcdafzb7rnbqv' },
};

let _initialized = false;

function _init() {
  if (_initialized || !window.Paddle || !PADDLE_CLIENT_TOKEN) return;
  if (IS_SANDBOX) window.Paddle.Environment.set('sandbox');
  window.Paddle.Initialize({ token: PADDLE_CLIENT_TOKEN });
  _initialized = true;
}

export function openPaddleCheckout({ plan, billingCycle = 'monthly', userEmail, userId }) {
  _init();
  const priceId = PADDLE_PRICES[plan]?.[billingCycle];
  if (!priceId || !window.Paddle) return false;
  window.Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: userEmail ? { email: userEmail } : undefined,
    customData: { user_id: userId, plan, billing_cycle: billingCycle },
  });
  return true;
}
