const PADDLE_CLIENT_TOKEN = process.env.REACT_APP_PADDLE_CLIENT_TOKEN || '';
const IS_SANDBOX = process.env.REACT_APP_PADDLE_ENV === 'sandbox';
const PADDLE_SUBSCRIBER_DISCOUNT = 'dsc_01kz1svzqwxj844y0sesr0a2h6';

const PADDLE_PRICES = {
  plus:             { monthly: 'pri_01kyvfkckwcaymmcp28haj7wdx', yearly: 'pri_01kyvfv0e11nn6gj6wbc0c4pt8' },
  pro:              { monthly: 'pri_01kyvh3djaq82s8fq8x2z1kht1', yearly: 'pri_01kyvh5shj156wresbp49gqgt8' },
  creative_station: { monthly: 'pri_01kyvh762mgc9q9pvd9hfqbn9t', yearly: 'pri_01kyvh8j1zrbfrcdafzb7rnbqv' },
};

const PADDLE_CREDIT_PRICES = {
  pack_50k:  'pri_01kz1sreqq4phvr1yv7qavg98v',
  pack_230k: 'pri_01kz1st3r9a07zrdagvbxxgs0r',
  pack_700k: 'pri_01kz1stmg2h06p8mtec80zn1j2',
  pack_950k: 'pri_01kz1sv2e8y9w2p2fqrkqay7ak',
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

export function openPaddleCreditCheckout({ packageId, userEmail, userId, isSubscriber }) {
  _init();
  const priceId = PADDLE_CREDIT_PRICES[packageId];
  if (!priceId || !window.Paddle) return false;
  const opts = {
    items: [{ priceId, quantity: 1 }],
    customer: userEmail ? { email: userEmail } : undefined,
    customData: { user_id: userId, credit_package_id: packageId },
  };
  if (isSubscriber) opts.discountId = PADDLE_SUBSCRIBER_DISCOUNT;
  window.Paddle.Checkout.open(opts);
  return true;
}
