import { useState } from 'react';
import { User, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/Nutrica-logo.png';

const InputField = ({ label, type = 'text', placeholder, icon: Icon, value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className={`h-5 w-5 transition-colors duration-200 ${isFocused ? 'text-emerald-500' : 'text-slate-400'}`} />
        </div>
        <input
          type={type} placeholder={placeholder} value={value} onChange={onChange} required
          onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
          className={`block w-full pl-10 pr-3 py-2.5 border ${isFocused ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'} rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all duration-200`}
        />
      </div>
    </div>
  );
};

const SignUpPage = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (!termsAccepted) return setError('You must accept the terms.');
    setError('');
    setLoading(true);
    try {
      const result = await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: null,
        role: 'Client',
      });
      saveAuth(result);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center justify-center mb-4">
          <img src={logo} alt="NutriCA" className="h-10 w-auto" />
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Start Your Journey</h1>
        <p className="text-slate-600">Create your account and begin transforming your health</p>
      </div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Create Account</h2>
          <p className="text-slate-500 text-sm">Fill in your details to get started</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="First Name" placeholder="John" icon={User} value={form.firstName} onChange={set('firstName')} />
            <InputField label="Last Name" placeholder="Doe" icon={User} value={form.lastName} onChange={set('lastName')} />
          </div>
          <InputField label="Email" type="email" placeholder="you@example.com" icon={Mail} value={form.email} onChange={set('email')} />
          <InputField label="Password" type="password" placeholder="••••••••" icon={Lock} value={form.password} onChange={set('password')} />
          <InputField label="Confirm Password" type="password" placeholder="••••••••" icon={Lock} value={form.confirmPassword} onChange={set('confirmPassword')} />

          <div className="flex items-center mb-6">
            <input id="terms" type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
              className="h-4 w-4 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer" />
            <label htmlFor="terms" className="ml-2 text-sm text-slate-600 cursor-pointer">
              I agree to the <a href="#" className="text-emerald-500 hover:underline">Terms of Service</a> and <a href="#" className="text-emerald-500 hover:underline">Privacy Policy</a>
            </label>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 px-4 rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-500 font-medium hover:underline">Sign in</Link>
        </div>
      </div>

      <div className="mt-8">
        <Link to="/" className="inline-flex items-center text-slate-700 hover:text-emerald-600 font-medium transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default SignUpPage;
