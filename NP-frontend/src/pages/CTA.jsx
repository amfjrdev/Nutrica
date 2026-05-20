import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

const CTA = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCta = () => {
    if (user?.role === 'Client') navigate('/payment?plan=predefined');
    else if (user?.role === 'Nutritionist') navigate('/nutritionist/dashboard');
    else if (user?.role === 'Admin') navigate('/admin/dashboard');
    else navigate('/register');
  };

  return (
    <section className="bg-emerald-600 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Health?</h2>
        <p className="text-lg text-emerald-100 max-w-2xl mx-auto mb-10">
          Join thousands of people who have already started their wellness journey with NP
        </p>
        <Button variant="white" className="text-lg font-bold px-8" onClick={handleCta}>
          Start Your 7-Day Free Trial
        </Button>
      </div>
    </section>
  );
};

export default CTA;
