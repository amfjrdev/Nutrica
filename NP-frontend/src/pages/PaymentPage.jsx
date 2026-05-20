import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, Calendar, CheckCircle, Loader2, FlaskConical } from 'lucide-react';
import PlanOption from '../components/payment/PlanOption';
import InputField from '../components/payment/InputField';
import { initiatePayment, mockPayment } from '../services/api';

const IS_DEV_PAYMENT = import.meta.env.VITE_DEV_MODE_PAYMENT === 'true';

const PLANS = {
  predefined: {
    key:      'predefined',
    title:    'Ready-Made Plans',
    subtitle: '$29/month • Instant access',
    type:     'Predefined',
    amount:   29,
    label:    'Ready-Made Plans',
  },
  ai: {
    key:      'ai',
    title:    'AI Model Subscription',
    subtitle: '$19/month • AI-powered tools',
    type:     'AI',
    amount:   19,
    label:    'AI Model Subscription',
  },
  personalized: {
    key:       'personalized',
    title:     'Personalized Consultation',
    subtitle:  '$99/month • Custom support',
    type:      'Personalized',
    amount:    99,
    label:     'Personalized Consultation',
    isPopular: true,
  },
};

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const initialPlan = PLANS[searchParams.get('plan')] ? searchParams.get('plan') : 'personalized';
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [form, setForm]   = useState({ cardNumber: '', expiry: '', cvc: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const plan = PLANS[selectedPlan];
  const set  = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.cardNumber || !form.expiry || !form.cvc || !form.name) {
      setError('Please fill in all payment fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (IS_DEV_PAYMENT) {
        await mockPayment({
          subscriptionType: plan.type,
          amount:           plan.amount,
          currency:         'usd',
        });
        const dest = selectedPlan === 'personalized'
          ? '/questionnaire?from=payment'
          : '/dashboard?payment=pending&mode=test';
        navigate(dest);
      } else {
        await initiatePayment({
          nutritionistId:   null,
          nutritionPlanId:  null,
          subscriptionType: plan.type,
          amount:           plan.amount,
          currency:         'usd',
        });
        const dest = selectedPlan === 'personalized'
          ? '/questionnaire?from=payment'
          : '/dashboard?payment=pending';
        navigate(dest);
      }
    } catch (err) {
      setError(err?.detail || err?.title || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Dev Mode Banner */}
        {IS_DEV_PAYMENT && (
          <div className="mb-6 bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center gap-3">
            <FlaskConical className="w-5 h-5 text-violet-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-violet-800 text-sm">TEST MODE — No real payment will be processed</p>
              <p className="text-violet-600 text-xs mt-0.5">Any card details are accepted. Payment is simulated.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column */}
            <div className="lg:col-span-7 space-y-8">

              {/* Plan Selection */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Select Your Plan</h2>
                <div className="space-y-4">
                  {Object.values(PLANS).map((p) => (
                    <PlanOption
                      key={p.key}
                      title={p.title}
                      subtitle={p.subtitle}
                      isSelected={selectedPlan === p.key}
                      onSelect={() => setSelectedPlan(p.key)}
                      isPopular={p.isPopular}
                    />
                  ))}
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Payment Information</h2>

                {error && (
                  <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <InputField
                    label="Card Number"
                    icon={CreditCard}
                    placeholder={IS_DEV_PAYMENT ? '4242 4242 4242 4242 (any value)' : '4242 4242 4242 4242'}
                    value={form.cardNumber}
                    onChange={set('cardNumber')}
                  />
                  <div className="grid grid-cols-2 gap-6">
                    <InputField
                      label="Expiry Date"
                      icon={Calendar}
                      placeholder="MM/YY"
                      value={form.expiry}
                      onChange={set('expiry')}
                    />
                    <InputField
                      label="CVC"
                      placeholder="123"
                      value={form.cvc}
                      onChange={set('cvc')}
                    />
                  </div>
                  <InputField
                    label="Cardholder Name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={set('name')}
                  />
                </div>
              </div>
            </div>

            {/* Right Column — Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>

                <div className="space-y-4 mb-8 pb-6 border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">{plan.label}</span>
                    <span className="font-bold text-slate-900">${plan.amount}/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Billing cycle</span>
                    <span className="text-slate-900">Monthly</span>
                  </div>
                  {IS_DEV_PAYMENT && (
                    <div className="flex justify-between items-center">
                      <span className="text-violet-600 font-medium text-sm">Mode</span>
                      <span className="text-violet-600 font-bold text-sm">TEST</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mb-8">
                  <span className="text-lg font-bold text-slate-900">Total Today</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {IS_DEV_PAYMENT ? <span className="line-through text-slate-300 mr-2">${plan.amount}.00</span> : null}
                    {IS_DEV_PAYMENT ? <span className="text-violet-600">$0.00</span> : `$${plan.amount}.00`}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-lg mb-6 flex items-center justify-center gap-2 ${
                    IS_DEV_PAYMENT
                      ? 'bg-violet-500 hover:bg-violet-600 hover:shadow-violet-500/30'
                      : 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-emerald-500/30'
                  }`}
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? 'Processing...' : IS_DEV_PAYMENT ? 'Simulate Payment' : 'Complete Purchase'}
                </button>

                <div className="space-y-3">
                  {(IS_DEV_PAYMENT
                    ? ['No real charge in test mode', 'Simulates full payment flow', 'Access unlocked after admin approval']
                    : ['7-day money-back guarantee', 'Cancel anytime, no questions asked', 'Access unlocked after admin approval']
                  ).map((text) => (
                    <div key={text} className="flex items-center text-sm text-slate-500">
                      <CheckCircle className={`w-4 h-4 mr-2 flex-shrink-0 ${IS_DEV_PAYMENT ? 'text-violet-400' : 'text-emerald-500'}`} />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentPage;
