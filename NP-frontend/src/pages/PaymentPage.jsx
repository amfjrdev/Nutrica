import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, Calendar, CheckCircle, Loader2, FlaskConical } from 'lucide-react';
import PlanOption from '../components/payment/PlanOption';
import InputField from '../components/payment/InputField';
import { initiatePayment, mockPayment, selectPredefinedPlan } from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';

const IS_DEV_PAYMENT = import.meta.env.VITE_DEV_MODE_PAYMENT === 'true';
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

const stripeElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': {
        color: '#94a3b8',
      },
    },
    invalid: {
      color: '#ef4444',
    },
  },
};

const StripeInputWrapper = ({ label, icon: Icon, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-slate-400" />
        </div>
      )}
      <div className={`block w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all`}>
        {children}
      </div>
    </div>
  </div>
);

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
  const stripe = useStripe();
  const elements = useElements();
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const initialPlan = PLANS[searchParams.get('plan')] ? searchParams.get('plan') : 'personalized';
  const returnPlanId = searchParams.get('returnPlanId') ?? null;
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [form, setForm]   = useState({ cardNumber: '', expiry: '', cvc: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [successDetails, setSuccessDetails] = useState(null);

  const plan = PLANS[selectedPlan];
  const set  = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (IS_DEV_PAYMENT) {
      if (!form.cardNumber || !form.expiry || !form.cvc || !form.name) {
        setError('Please fill in all payment fields.');
        return;
      }
    } else {
      if (!stripe || !elements) {
        setError('Stripe has not loaded yet. Please wait.');
        return;
      }
      if (!form.name) {
        setError('Please enter the cardholder name.');
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      if (IS_DEV_PAYMENT) {
        await mockPayment({ subscriptionType: plan.type, amount: plan.amount, currency: 'usd' });
        const dest = (returnPlanId && selectedPlan === 'predefined')
          ? '/my-plan'
          : (selectedPlan === 'personalized' ? '/questionnaire?from=payment' : '/dashboard?payment=pending&mode=test');
        
        if (returnPlanId && selectedPlan === 'predefined') {
          try { await selectPredefinedPlan(returnPlanId); } catch (_) {}
        }
        
        setSuccessDetails({ planTitle: plan.title, amount: plan.amount, dest });
      } else {
        // Stripe Mode:
        // 1. Create PaymentIntent in backend
        const initResult = await initiatePayment({
          nutritionistId: null,
          nutritionPlanId: null,
          subscriptionType: plan.type,
          amount: plan.amount,
          currency: 'usd'
        });

        // 2. Confirm card payment client-side
        const cardElement = elements.getElement(CardNumberElement);
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          initResult.clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: form.name,
              },
            },
          }
        );

        if (stripeError) {
          setError(stripeError.message || 'Payment confirmation failed.');
          setLoading(false);
          return;
        }

        if (paymentIntent.status === 'succeeded') {
          const dest = (returnPlanId && selectedPlan === 'predefined')
            ? '/my-plan'
            : (selectedPlan === 'personalized' ? '/questionnaire?from=payment' : '/dashboard?payment=pending');
          
          if (returnPlanId && selectedPlan === 'predefined') {
            try { await selectPredefinedPlan(returnPlanId); } catch (_) {}
          }
          
          setSuccessDetails({ planTitle: plan.title, amount: plan.amount, dest });
        } else {
          setError(`Payment status: ${paymentIntent.status}. Awaiting completion.`);
        }
      }
    } catch (err) {
      setError(err?.detail || err?.title || err?.message || 'Payment failed. Please try again.');
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
                  {IS_DEV_PAYMENT ? (
                    <>
                      <InputField
                        label="Card Number"
                        icon={CreditCard}
                        placeholder="4242 4242 4242 4242 (any value)"
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
                    </>
                  ) : (
                    <>
                      <StripeInputWrapper label="Card Number" icon={CreditCard}>
                        <CardNumberElement options={stripeElementOptions} />
                      </StripeInputWrapper>
                      <div className="grid grid-cols-2 gap-6">
                        <StripeInputWrapper label="Expiry Date" icon={Calendar}>
                          <CardExpiryElement options={stripeElementOptions} />
                        </StripeInputWrapper>
                        <StripeInputWrapper label="CVC">
                          <CardCvcElement options={stripeElementOptions} />
                        </StripeInputWrapper>
                      </div>
                    </>
                  )}
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

      {successDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border border-slate-100 transform scale-100 transition-all duration-300">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500 animate-bounce" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h3>
            <p className="text-slate-600 mb-6 text-sm">
              Thank you for your purchase. Your subscription to the <span className="font-semibold text-slate-800">{successDetails.planTitle}</span> has been processed successfully.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 flex justify-between items-center text-sm border border-slate-100">
              <span className="text-slate-500 font-medium">Amount Paid</span>
              <span className="text-slate-900 font-bold">${successDetails.amount}.00</span>
            </div>

            <button
              onClick={() => navigate(successDetails.dest)}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 text-white font-bold rounded-xl transition-all transform hover:-translate-y-0.5"
            >
              Continue to Platform
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentPageWrapper = () => (
  <Elements stripe={stripePromise}>
    <PaymentPage />
  </Elements>
);

export default PaymentPageWrapper;
