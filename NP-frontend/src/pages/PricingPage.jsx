import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, Sparkles, Users, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// --- Sub-components ---

const FeatureRow = ({ feature, free, readyMade, personalized }) => {
  const cell = (val) => {
    if (val === true)  return <Check className="w-5 h-5 text-emerald-500 mx-auto" />;
    if (val === false) return <X className="w-5 h-5 text-slate-300 mx-auto" />;
    return val;
  };
  return (
    <div className="grid grid-cols-4 gap-4 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <div className="font-medium text-slate-900 flex items-center">{feature}</div>
      <div className="text-center text-slate-600 flex items-center justify-center">{cell(free)}</div>
      <div className="text-center text-slate-600 flex items-center justify-center">{cell(readyMade)}</div>
      <div className="text-center text-emerald-700 font-medium flex items-center justify-center bg-emerald-50/50 rounded-lg">{cell(personalized)}</div>
    </div>
  );
};

const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border border-slate-200 rounded-xl mb-4 overflow-hidden bg-white hover:shadow-md transition-shadow">
    <button onClick={onClick} className="w-full px-6 py-4 flex items-center justify-between text-left bg-white hover:bg-slate-50 transition-colors">
      <span className="font-semibold text-slate-900 pr-8">{question}</span>
      {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
    </button>
    {isOpen && <div className="px-6 pb-4 text-slate-600 leading-relaxed">{answer}</div>}
  </div>
);

const PricingCard = ({ title, price, subtitle, features, isPopular, ctaText, icon: Icon, onCta }) => (
  <div className={`relative rounded-2xl p-8 ${isPopular ? 'bg-emerald-500 text-white shadow-2xl scale-105' : 'bg-white border border-slate-200 text-slate-900'}`}>
    {isPopular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <span className="bg-amber-400 text-amber-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
          <Sparkles className="w-4 h-4" /> Most Popular
        </span>
      </div>
    )}
    <div className="mb-6">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isPopular ? 'bg-white/20' : 'bg-slate-100'}`}>
        <Icon className={`w-6 h-6 ${isPopular ? 'text-white' : 'text-emerald-600'}`} />
      </div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-bold">${price}</span>
        <span className={`text-lg ${isPopular ? 'text-emerald-100' : 'text-slate-500'}`}>/month</span>
      </div>
      <p className={`mt-4 text-sm ${isPopular ? 'text-emerald-100' : 'text-slate-600'}`}>{subtitle}</p>
    </div>
    <ul className="space-y-4 mb-8">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-3">
          <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isPopular ? 'text-emerald-200' : 'text-emerald-500'}`} />
          <span className={`text-sm ${isPopular ? 'text-emerald-50' : 'text-slate-600'}`}>{f}</span>
        </li>
      ))}
    </ul>
    <button
      onClick={onCta}
      className={`w-full py-3.5 rounded-xl font-bold transition-all transform hover:-translate-y-0.5 ${isPopular ? 'bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
    >
      {ctaText}
    </button>
  </div>
);

// --- Main Page ---

const FAQS = [
  { question: 'Can I switch plans later?',                  answer: "Yes, you can upgrade or downgrade at any time. Changes take effect immediately, and we'll prorate any difference in cost." },
  { question: 'What if I need to cancel?',                  answer: 'You can cancel anytime. Your access continues until the end of your billing period. No questions asked.' },
  { question: 'How quickly will I get my personalized plan?', answer: 'After completing the questionnaire, your nutritionist will create your plan within 24-48 hours.' },
  { question: 'Is there a free trial?',                     answer: 'Yes! We offer a 7-day free trial on all paid plans. You can cancel anytime during the trial period.' },
];

const PricingPage = () => {
  const [openFAQ, setOpenFAQ] = useState(0);
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const handleCta = (planKey) => {
    if (!user) return navigate('/register');
    if (user.role === 'Client') return navigate(`/payment?plan=${planKey}`);
    if (user.role === 'Nutritionist') return navigate('/nutritionist/dashboard');
    if (user.role === 'Admin') return navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
        {/* Header */}
        <div className="bg-gradient-to-b from-emerald-50 to-slate-50 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Choose Your Nutrition Journey
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Whether you prefer expert-designed plans or personalized 1-on-1 support, we have the perfect solution for your goals
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 -mt-8">
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-24">
            <PricingCard
              title="Ready-Made Plans"
              price="29"
              subtitle="Perfect for self-starters who want expert-designed nutrition plans they can follow independently"
              features={['Access to 10+ expert nutrition plans', 'Keto, Mediterranean, Vegan, and more', 'Unlimited AI food alternative suggestions', 'AI calorie estimation from photos', 'Progress tracking & analytics', 'AI chatbot support (unlimited)']}
              isPopular={false}
              ctaText="Get Started"
              icon={Utensils}
              onCta={() => handleCta('predefined')}
            />
            <PricingCard
              title="Personalized Consultation"
              price="99"
              subtitle="Custom nutrition plan designed by a certified nutritionist based on your unique health profile"
              features={['Everything in Ready-Made, plus:', 'Custom plan by certified nutritionist', 'Personalized health questionnaire', 'Direct chat with your nutritionist', '1-on-1 video consultations', 'Weekly progress reviews', 'Ongoing plan adjustments']}
              isPopular={true}
              ctaText="Start Free Trial"
              icon={Users}
              onCta={() => handleCta('nutritionist')}
            />
          </div>

          {/* Feature Comparison */}
          <div className="max-w-4xl mx-auto mb-24">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Feature Comparison</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <div className="grid grid-cols-4 gap-4 pb-4 border-b border-slate-200 mb-4">
                <div className="font-bold text-slate-900">Feature</div>
                <div className="text-center font-semibold text-slate-700">Free</div>
                <div className="text-center font-semibold text-slate-700">Ready-Made ($29)</div>
                <div className="text-center font-bold text-emerald-600 bg-emerald-50 rounded-lg py-1">Personalized ($99)</div>
              </div>
              <FeatureRow feature="Article Access"       free={true}                                        readyMade={true}          personalized={true} />
              <FeatureRow feature="AI Chatbot"           free="5/day"                                       readyMade="Unlimited"     personalized="Unlimited" />
              <FeatureRow feature="Progress Tracking"    free="Basic"                                       readyMade="Advanced"      personalized="Advanced" />
              <FeatureRow feature="Nutrition Plans"      free={<span className="text-slate-300">—</span>}   readyMade="10+ Plans"     personalized="Custom Plan" />
              <FeatureRow feature="AI Photo Analysis"    free={false}                                       readyMade={true}          personalized={true} />
              <FeatureRow feature="Nutritionist Chat"    free={false}                                       readyMade={false}         personalized={true} />
              <FeatureRow feature="Video Consultations"  free={false}                                       readyMade={false}         personalized={true} />
              <FeatureRow feature="Weekly Reviews"       free={false}                                       readyMade={false}         personalized={true} />
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto mb-24">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Frequently Asked Questions</h2>
            {FAQS.map((faq, idx) => (
              <FAQItem
                key={idx}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === idx}
                onClick={() => setOpenFAQ(openFAQ === idx ? -1 : idx)}
              />
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="bg-emerald-500 rounded-3xl p-12 text-center text-white mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join thousands achieving their nutrition goals with NP
            </p>
            <button
              onClick={() => handleCta('nutritionist')}
              className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </div>
  );
};

export default PricingPage;
