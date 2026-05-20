import { useState, useEffect, useRef } from 'react';
import { Mail, Lock, ShieldCheck, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { login, verifyOtp, resendOtp } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/Nutrica-logo.png';

const RESEND_COOLDOWN = 60; // seconds

// ─── Step 1: Credentials form ─────────────────────────────────────────────────
const CredentialsStep = ({ onSuccess }) => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onSuccess(email);
    } catch (err) {
      setError(err?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-1">Sign In</h3>
        <p className="text-slate-500">Enter your credentials to continue</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required
              className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-slate-50
                         text-slate-900 placeholder-slate-400 focus:outline-none
                         focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-slate-50
                         text-slate-900 placeholder-slate-400 focus:outline-none
                         focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-sm
                     text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600
                     disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none
                     focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all">
          {loading ? 'Sending code…' : 'Continue'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link to="/signup" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
          Sign up
        </Link>
      </div>
    </>
  );
};

// ─── Step 2: OTP verification form ────────────────────────────────────────────
const OtpStep = ({ email, onSuccess, onBack }) => {
  const [otp,      setOtp]      = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  // Start countdown on mount
  useEffect(() => {
    inputRef.current?.focus();
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await verifyOtp(email, otp);
      onSuccess(result);
    } catch (err) {
      setError(err?.detail || 'Invalid or expired code.');
      setOtp('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await resendOtp(email);
      setCooldown(RESEND_COOLDOWN);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(timerRef.current); return 0; }
          return c - 1;
        });
      }, 1000);
      setOtp('');
      inputRef.current?.focus();
    } catch (err) {
      setError(err?.detail || 'Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <div className="mb-6 text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-1">Check your email</h3>
        <p className="text-slate-500 text-sm">
          We sent a 6-digit code to <span className="font-medium text-slate-700">{email}</span>.
          It expires in 5 minutes.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1.5">
            Verification Code
          </label>
          <input
            ref={inputRef}
            id="otp" type="text" inputMode="numeric" pattern="\d{6}"
            maxLength={6} value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000" required
            className="block w-full px-4 py-3 border-none rounded-lg bg-slate-50 text-slate-900
                       text-center text-2xl font-bold tracking-[0.5em] placeholder-slate-300
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white
                       transition-all"
          />
        </div>

        <button type="submit" disabled={loading || otp.length !== 6}
          className="w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-sm
                     text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600
                     disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none
                     focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all">
          {loading ? 'Verifying…' : 'Verify & Sign In'}
        </button>
      </form>

      {/* Resend + back */}
      <div className="mt-5 flex flex-col items-center gap-3">
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="flex items-center gap-1.5 text-sm font-medium text-emerald-600
                     hover:text-emerald-500 disabled:text-slate-400 disabled:cursor-not-allowed
                     transition-colors">
          <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
          {cooldown > 0 ? `Resend code in ${cooldown}s` : resending ? 'Sending…' : 'Resend code'}
        </button>

        <button onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
          ← Use a different account
        </button>
      </div>
    </>
  );
};

// ─── Main Login page ──────────────────────────────────────────────────────────
const LoginPage = () => {
  const [step,  setStep]  = useState('credentials'); // 'credentials' | 'otp'
  const [email, setEmail] = useState('');
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const handleCredentialsSuccess = (verifiedEmail) => {
    setEmail(verifiedEmail);
    setStep('otp');
  };

  const handleOtpSuccess = (authResult) => {
    saveAuth(authResult);
    if (authResult.role === 'Client')          navigate('/dashboard');
    else if (authResult.role === 'Nutritionist') navigate('/nutritionist/dashboard');
    else                                         navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="text-center mb-8 w-full max-w-md">
        <Link to="/" className="inline-flex items-center justify-center mb-6">
          <img src={logo} alt="NutriCA" className="h-10 w-auto" />
        </Link>
        <h2 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Welcome Back</h2>
        <p className="text-slate-600 text-lg">Sign in to continue your wellness journey</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        {step === 'credentials' ? (
          <CredentialsStep onSuccess={handleCredentialsSuccess} />
        ) : (
          <OtpStep
            email={email}
            onSuccess={handleOtpSuccess}
            onBack={() => setStep('credentials')}
          />
        )}
      </div>
    </div>
  );
};

export default LoginPage;
