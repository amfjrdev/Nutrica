import { Leaf, Users, MessageSquare, TrendingUp } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-6">
      <Icon className="w-6 h-6 text-emerald-600" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);

const features = [
  { icon: Leaf, title: "Personalized Nutrition Plans", description: "Get custom meal plans tailored to your health goals and dietary preferences." },
  { icon: Users, title: "Expert Nutritionists", description: "Work directly with certified nutrition professionals for personalized guidance." },
  { icon: MessageSquare, title: "AI-Powered Assistant", description: "Get instant answers about food alternatives and nutrition queries." },
  { icon: TrendingUp, title: "Track Your Progress", description: "Monitor your health journey with comprehensive tracking and analytics." },
];

const Features = () => (
  <section id="features" className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything You Need for Success</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Comprehensive tools and expert support at your fingertips</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((f, i) => <FeatureCard key={i} {...f} />)}
      </div>
    </div>
  </section>
);

export default Features;
