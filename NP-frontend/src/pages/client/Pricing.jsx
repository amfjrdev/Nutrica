import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, Sparkles, Users, Utensils, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FeatureRow = ({ feature, free, readyMade, ai, personalized }) => {
  const cell = (val) => {
    if (val === true)  return <Check className="w-5 h-5 text-emerald-500 mx-auto" />;
    if (val === false) return <X className="w-5 h-5 text-slate-300 mx-auto" />;
    return val;
  };
  return (
    <div className="grid grid-cols-5 gap-4 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <div className="font-medium text-slate-900 flex items-center text-sm">{feature}</div>
      <div className="text-center text-slate-600 flex items-center justify-center">{cell(free)}</div>
      <div className="text-center text-slate-600 flex items-center justify-center">{cell(readyMade)}</div>
      <div className="text-center text-slate-600 flex items-center justify-center">{cell(ai)}</div>
      <div className="text-center text-emerald-700 font-medium flex items-center justify-center bg-emerald-50/50 rounded-lg">{cell(personalized)}</div>
    </div>
  );
};

const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border border-slate-200 rounded-xl mb-3 overflow-hidden bg-white">
    <button onClick={onClick} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
      <span className="font-semibold text-slate-900 pr-8 text-sm">{question}</span>
      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
    </button>
    {isOpen && <div className="px-5 pb-4 text-slate-600 text-sm leading-relaxed">{answer}</div>}
  </div>
);

const PricingCard = ({ title, price, subtitle, features, isPopular, ctaText, icon: Icon, onCta }) => (
  <div className={`relative rounded-2xl p-7 ${isPopular ? 'bg-emerald-500 text-white shadow-xl scale-105' : 'bg-white border border-slate-200 text-slate-900'}`}>
    {isPopular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <span className="bg-amber-400 text-amber-900 px-4 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Most Popular
        </span>
      </div>
    )}
    <div className="mb-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isPopular ? 'bg-white/20' : 'bg-slate-100'}`}>
        <Icon className={`w-5 h-5 ${isPopular ? 'text-white' : 'text-emerald-600'}`} />
      </div>
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold">${price}</span>
        <span className={`text-sm ${isPopular ? 'text-emerald-100' : 'text-slate-500'}`}>/month</span>
      </div>
      <p className={`mt-3 text-sm ${isPopular ? 'text-emerald-100' : 'text-slate-600'}`}>{subtitle}</p>
    </div>
    <ul className="space-y-3 mb-6">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-2">
          <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isPopular ? 'text-emerald-200' : 'text-emerald-500'}`} />
          <span className={`text-sm ${isPopular ? 'text-emerald-50' : 'text-slate-600'}`}>{f}</span>
        </li>
      ))}
    </ul>
    <button onClick={onCta}
      className={`w-full py-3 rounded-xl font-bold transition-all transform hover:-translate-y-0.5 text-sm ${isPopular ? 'bg-white text-emerald-600 hover:bg-emerald-50 shadow-md' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
      {ctaText}
    </button>
  </div>
);

const FAQS = [
  { question: 'Can I switch plans later?',                    answer: "Yes, you can upgrade or downgrade at any time. Changes take effect immediately." },
  { question: 'What if I need to cancel?',                    answer: 'You can cancel anytime. Your access continues until the end of your billing period.' },
  { question: 'How quickly will I get my personalized plan?', answer: 'After completing the questionnaire, your nutritionist will create your plan within 24-48 hours.' },
  { question: 'Is there a free trial?',                       answer: 'Yes! We offer a 7-day free trial on all paid plans.' },
];

const ClientPricingPage = () => {
  const [openFAQ, setOpenFAQ] = useState(0);
  const navigate = useNavigate();

  const handleCta = (planKey) => navigate(`/payment?plan=${planKey}`);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Choose Your Plan</h1>
        <p className="text-slate-500">Select the plan that fits your nutrition goals</p>
      </header>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
        <PricingCard
          title="Ready-Made Plans"
          price="29"
          subtitle="Expert-designed nutrition plans you can follow independently"
          features={['Access to 10+ expert nutrition plans', 'Keto, Mediterranean, Vegan, and more', 'AI calorie estimation from photos', 'Progress tracking & analytics', 'AI chatbot support (unlimited)']}
          isPopular={false}
          ctaText="Get Started"
          icon={Utensils}
          onCta={() => handleCta('predefined')}
        />
        <PricingCard
          title="AI Model"
          price="19"
          subtitle="Unlock all AI-powered tools with no nutritionist involvement"
          features={['Unlimited AI food alternative suggestions', 'AI calorie estimation from photos', 'AI chatbot (unlimited)', 'Progress tracking & analytics']}
          isPopular={false}
          ctaText="Get Started"
          icon={Bot}
          onCta={() => handleCta('ai')}
        />
        <PricingCard
          title="Personalized Consultation"
          price="99"
          subtitle="Custom plan by a certified nutritionist based on your health profile"
          features={['Everything in Ready-Made, plus:', 'Custom plan by certified nutritionist', 'Direct chat with your nutritionist', '1-on-1 video consultations', 'Weekly progress reviews', 'Ongoing plan adjustments']}
          isPopular={true}
          ctaText="Get Started"
          icon={Users}
          onCta={() => handleCta('personalized')}
        />
      </div>

      {/* Feature Comparison */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">Feature Comparison</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-5 gap-4 pb-4 border-b border-slate-200 mb-2">
            <div className="font-bold text-slate-900 text-sm">Feature</div>
            <div className="text-center font-semibold text-slate-700 text-sm">Free</div>
            <div className="text-center font-semibold text-slate-700 text-sm">Ready-Made</div>
            <div className="text-center font-semibold text-slate-700 text-sm">AI Model</div>
            <div className="text-center font-bold text-emerald-600 bg-emerald-50 rounded-lg py-1 text-sm">Personalized</div>
          </div>
          <FeatureRow feature="Article Access"      free={true}                                       readyMade={true}       ai={false}         personalized={true} />
          <FeatureRow feature="AI Chatbot"          free="5/day"                                      readyMade="Unlimited"  ai="Unlimited"    personalized="Unlimited" />
          <FeatureRow feature="Nutrition Plans"     free={<span className="text-slate-300">—</span>}  readyMade="10+ Plans"  ai={false}         personalized="Custom" />
          <FeatureRow feature="AI Photo Analysis"   free={false}                                      readyMade={true}       ai={true}          personalized={true} />
          <FeatureRow feature="Nutritionist Chat"   free={false}                                      readyMade={false}      ai={false}         personalized={true} />
          <FeatureRow feature="Video Consultations" free={false}                                      readyMade={false}      ai={false}         personalized={true} />
          <FeatureRow feature="Weekly Reviews"      free={false}                                      readyMade={false}      ai={false}         personalized={true} />
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">Frequently Asked Questions</h2>
        {FAQS.map((faq, idx) => (
          <FAQItem key={idx} question={faq.question} answer={faq.answer}
            isOpen={openFAQ === idx} onClick={() => setOpenFAQ(openFAQ === idx ? -1 : idx)} />
        ))}
      </div>
    </div>
  );
};

export default ClientPricingPage;
