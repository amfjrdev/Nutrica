import { Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopBanner = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-emerald-500 text-white py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          <span className="font-medium">Unlock personalized nutrition plans and unlimited AI support</span>
        </div>
        <button
          onClick={() => navigate('/pricing')}
          className="bg-white text-emerald-600 px-6 py-2 rounded-lg font-semibold hover:bg-emerald-50 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          Upgrade Now <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TopBanner;
