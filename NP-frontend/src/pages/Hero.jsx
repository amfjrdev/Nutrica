import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

const Hero = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCta = () => {
    if (user?.role === 'Client') navigate('/payment?plan=predefined');
    else if (user?.role === 'Nutritionist') navigate('/nutritionist/dashboard');
    else if (user?.role === 'Admin') navigate('/admin/dashboard');
    else navigate('/register');
  };

  return (
    <section className="bg-emerald-50 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <CheckCircle className="w-4 h-4 mr-2" />
          Trusted by 10,000+ happy clients
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
          Your Journey to <br />
          <span className="text-emerald-500">Healthier Living Starts Here</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
          Personalized nutrition plans, expert guidance, and AI-powered tools to help you achieve your health goals.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button variant="primary" className="w-full sm:w-auto text-lg" onClick={handleCta}>Start Your Free Trial</Button>
          <a href="#pricing"><Button variant="secondary" className="w-full sm:w-auto text-lg">View Plans</Button></a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
