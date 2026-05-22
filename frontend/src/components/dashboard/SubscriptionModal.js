import React from 'react';
import { X, Star, Check, ChevronLeft, ChevronRight } from 'lucide-react';

const SubscriptionModal = ({
  onClose, userZP, billingCycle, setBillingCycle,
  currentPlanIndex, setCurrentPlanIndex,
  SUBSCRIPTION_PLANS, userSubscription, subscribing,
  handleSubscribe, handleBuyWithSP, t,
}) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="zet-card p-6 max-w-md w-full mx-4 animate-fadeIn" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--zet-text)' }}>
          {t('choosePlan') || 'Planını Seç'}
        </h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-xl" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }} data-testid="sp-balance-banner">
        <Star className="h-4 w-4" style={{ color: '#fbbf24' }} />
        <span className="text-sm font-bold" style={{ color: '#fbbf24' }}>{userZP.toLocaleString()} ZP</span>
        <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>- ZP ile de plan alabilirsiniz</span>
      </div>

      <div className="flex justify-center mb-6">
        <div className="flex rounded-lg p-1" style={{ background: 'var(--zet-bg)' }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            className="px-4 py-2 rounded-md text-sm font-medium transition-all"
            style={{ background: billingCycle === 'monthly' ? 'var(--zet-primary)' : 'transparent', color: billingCycle === 'monthly' ? 'white' : 'var(--zet-text-muted)' }}
          >
            {t('monthly') || 'Aylik'}
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1"
            style={{ background: billingCycle === 'yearly' ? 'var(--zet-primary)' : 'transparent', color: billingCycle === 'yearly' ? 'white' : 'var(--zet-text-muted)' }}
          >
            {t('yearly') || 'Yillik'}
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-500 text-white">-17%</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setCurrentPlanIndex(Math.max(0, currentPlanIndex - 1))}
          disabled={currentPlanIndex === 0}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: 'var(--zet-bg-card)' }}
        >
          <ChevronLeft className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
        </button>
        <button
          onClick={() => setCurrentPlanIndex(Math.min(SUBSCRIPTION_PLANS.length - 1, currentPlanIndex + 1))}
          disabled={currentPlanIndex === SUBSCRIPTION_PLANS.length - 1}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: 'var(--zet-bg-card)' }}
        >
          <ChevronRight className="h-5 w-5" style={{ color: 'var(--zet-text)' }} />
        </button>

        <div className="overflow-hidden">
          <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${currentPlanIndex * 100}%)` }}>
            {SUBSCRIPTION_PLANS.map((plan, idx) => {
              const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
              const period = billingCycle === 'monthly' ? '/mo' : '/yr';
              return (
                <div key={plan.id} className="w-full flex-shrink-0 px-2">
                  <div
                    className={`relative rounded-2xl p-6 transition-all ${plan.recommended ? 'ring-2' : ''}`}
                    style={{ background: `linear-gradient(135deg, ${plan.color}15 0%, ${plan.color}05 100%)`, border: `1px solid ${plan.color}30` }}
                    data-testid={`plan-${plan.id}`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: plan.color }}>
                        {t('recommended') || 'ONERILEN'}
                      </div>
                    )}
                    <div className="text-center mb-6 pt-2">
                      <h3 className="text-2xl font-bold mb-2" style={{ color: plan.color }}>{plan.name}</h3>
                      <div>
                        <span className="text-4xl font-bold" style={{ color: 'var(--zet-text)' }}>${price}</span>
                        <span className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{period}</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <p className="text-xs mt-1 text-green-400">
                          {t('saveYearly') || `Save $${((plan.monthlyPrice * 12) - plan.yearlyPrice).toFixed(2)}/year`}
                        </p>
                      )}
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, fidx) => (
                        <li key={fidx} className="flex items-center gap-2 text-sm" style={{ color: 'var(--zet-text)' }}>
                          <Check className="h-4 w-4 flex-shrink-0" style={{ color: plan.color }} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={subscribing || userSubscription === plan.id}
                        className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50"
                        style={{ background: userSubscription === plan.id ? 'var(--zet-bg)' : plan.color, color: userSubscription === plan.id ? plan.color : 'white', border: userSubscription === plan.id ? `2px solid ${plan.color}` : 'none' }}
                        data-testid={`select-plan-${plan.id}`}
                      >
                        {userSubscription === plan.id ? (t('currentPlan') || 'Mevcut Plan') : `$${price}${period} ile Al`}
                      </button>
                      {userSubscription !== plan.id && (
                        <button
                          onClick={() => handleBuyWithSP(plan.id)}
                          disabled={subscribing || userZP < plan.zpCost}
                          className="w-full py-2.5 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-40 flex items-center justify-center gap-2"
                          style={{ background: userZP >= plan.zpCost ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.03)', color: userZP >= plan.zpCost ? '#fbbf24' : 'var(--zet-text-muted)', border: `1px solid ${userZP >= plan.zpCost ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)'}` }}
                          data-testid={`buy-sp-${plan.id}`}
                        >
                          <Star className="h-4 w-4" />
                          {plan.zpCost.toLocaleString()} ZP ile Al
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
          {SUBSCRIPTION_PLANS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPlanIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${currentPlanIndex === idx ? 'w-6' : ''}`}
              style={{ background: currentPlanIndex === idx ? SUBSCRIPTION_PLANS[idx].color : 'var(--zet-text-muted)' }}
            />
          ))}
        </div>
      </div>

      <p className="text-center text-xs mt-4" style={{ color: 'var(--zet-text-muted)' }}>
        {t('subscriptionNote') || ''}
      </p>
    </div>
  </div>
);

export default SubscriptionModal;
