import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';

const plans = [
  { title: 'Predefined Plans',   planKey: 'predefined',   subtitle: 'Choose from our curated nutrition plans',      price: '29', features: ['Access to all predefined plans', 'AI chatbot support', 'Calorie estimation tool', 'Nutrition articles & tips', 'Mobile app access'],                                                                          isPopular: false },
  { title: 'With Nutritionist',  planKey: 'nutritionist', subtitle: 'Get personalized guidance from experts',        price: '99', features: ['Everything in Predefined Plans', '1-on-1 nutritionist consultations', 'Custom meal plans', 'Video & chat support', 'Weekly check-ins', 'Priority support'],                                    isPopular: true  },
];

const PricingCard = ({ title, subtitle, price, features, isPopular, planKey }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate(`/payment?plan=${planKey}`);
    } else {
      navigate('/register');
    }
  };

  return (
    <div className={`relative bg-white rounded-2xl p-8 border flex flex-col ${isPopular ? 'border-emerald-500 shadow-xl ring-2 ring-emerald-500 ring-opacity-50' : 'border-gray-200 shadow-lg'}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">Most Popular</span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600">{subtitle}</p>
      </div>
      <div className="mb-8">
        <span className="text-5xl font-extrabold text-slate-900">${price}</span>
        <span className="text-slate-500 font-medium">/month</span>
      </div>
      <ul className="space-y-4 mb-8 flex-grow">
        {features.map((f, i) => (
          <li key={i} className="flex items-start">
            <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-slate-700">{f}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={isPopular ? 'primary' : 'outline'}
        className="w-full mt-auto"
        onClick={handleGetStarted}
      >
        Get Started
      </Button>
    </div>
  );
};

const PricingSection = () => (
  <section id="pricing" className="py-20 bg-emerald-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Choose Your Path to Wellness</h2>
        <p className="text-lg text-slate-600">Flexible plans designed for your unique needs</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((p, i) => <PricingCard key={i} {...p} />)}
      </div>
    </div>
  </section>
);

export default PricingSection;
