import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';

// Public pages
import Hero from './pages/Hero';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Testimonials from './pages/Testimonials';
import CTA from './pages/CTA';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Articles from './pages/Articles';
import PricingPage from './pages/PricingPage';
import PaymentPage from './pages/PaymentPage';

// Client pages
import Dashboard from './pages/Dashboard';
import MyPlan from './pages/MyPlan';
import AIAssistant from './pages/AIAssistant';
import CalorieScan from './pages/CalorieScan';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import ClientArticles from './pages/client/Articles';
import ClientPricing from './pages/client/Pricing';
import Questionnaire from './pages/client/Questionnaire';
import ClientAppointments from './pages/client/Appointments';
import ReadyMadePlans from './pages/client/ReadyMadePlans';

// Nutritionist pages
import NutritionistDashboard from './pages/nutritionist/Dashboard';
import NutritionistAppointments from './pages/nutritionist/Appointments';
import NutritionistChat from './pages/nutritionist/Chat';
import CreatePlan from './pages/nutritionist/CreatePlan';
import ManagePlans from './pages/nutritionist/ManagePlans';
import ClientAnswers from './pages/nutritionist/ClientAnswers';
import WriteArticle from './pages/nutritionist/WriteArticle';
import NutritionistProfile from './pages/nutritionist/Profile';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminSubscriptions from './pages/admin/Subscriptions';
import AdminApprovals from './pages/admin/Approvals';
import AdminArticles from './pages/admin/Articles';

const LandingPage = () => (
  <div className="min-h-screen font-sans text-slate-900 bg-white">
    <Navbar />
    <main>
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <CTA />
    </main>
    <Footer />
  </div>
);

const QuestionnaireGuard = ({ children }) => {
  const { search } = useLocation();
  const allowed = new URLSearchParams(search).get('from') === 'payment';
  return allowed ? children : <Navigate to="/client/pricing" replace />;
};

const App = () => {
  return (
  <BrowserRouter>
    <Routes>
      {/* Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Public pages — no auth required */}
      <Route path="/articles" element={<PublicLayout><Articles /></PublicLayout>} />
      <Route path="/pricing"  element={<PublicLayout><PricingPage /></PublicLayout>} />

      {/* Auth pages — redirect to dashboard if already logged in */}
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup"   element={<GuestRoute><SignUp /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><SignUp /></GuestRoute>} />

      {/* Client routes */}
      <Route path="/questionnaire" element={<ProtectedRoute role="Client"><QuestionnaireGuard><Questionnaire /></QuestionnaireGuard></ProtectedRoute>} />
      <Route path="/client/pricing"  element={<ProtectedRoute role="Client"><AuthLayout role="client"><ClientPricing /></AuthLayout></ProtectedRoute>} />
      <Route path="/client/articles" element={<ProtectedRoute role="Client"><AuthLayout role="client"><ClientArticles /></AuthLayout></ProtectedRoute>} />
      <Route path="/client/ready-made-plans" element={<ProtectedRoute role="Client"><AuthLayout role="client"><ReadyMadePlans /></AuthLayout></ProtectedRoute>} />
      <Route path="/payment"         element={<ProtectedRoute role="Client"><PaymentPage /></ProtectedRoute>} />
      <Route path="/dashboard"    element={<ProtectedRoute role="Client"><AuthLayout role="client"><Dashboard /></AuthLayout></ProtectedRoute>} />
      <Route path="/my-plan"      element={<ProtectedRoute role="Client"><AuthLayout role="client"><MyPlan /></AuthLayout></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute role="Client"><AuthLayout role="client"><AIAssistant /></AuthLayout></ProtectedRoute>} />
      <Route path="/calorie-scan" element={<ProtectedRoute role="Client"><AuthLayout role="client"><CalorieScan /></AuthLayout></ProtectedRoute>} />
      <Route path="/profile"      element={<ProtectedRoute role="Client"><AuthLayout role="client"><Profile /></AuthLayout></ProtectedRoute>} />
      <Route path="/chat"         element={<ProtectedRoute role="Client"><AuthLayout role="client"><Chat /></AuthLayout></ProtectedRoute>} />
      <Route path="/appointments"  element={<ProtectedRoute role="Client"><AuthLayout role="client"><ClientAppointments /></AuthLayout></ProtectedRoute>} />

      {/* Nutritionist routes */}
      <Route path="/nutritionist/dashboard"     element={<ProtectedRoute role="Nutritionist"><AuthLayout role="nutritionist"><NutritionistDashboard /></AuthLayout></ProtectedRoute>} />
      <Route path="/nutritionist/appointments"  element={<ProtectedRoute role="Nutritionist"><AuthLayout role="nutritionist"><NutritionistAppointments /></AuthLayout></ProtectedRoute>} />
      <Route path="/nutritionist/chat"          element={<ProtectedRoute role="Nutritionist"><AuthLayout role="nutritionist"><NutritionistChat /></AuthLayout></ProtectedRoute>} />
      <Route path="/nutritionist/create-plan"    element={<ProtectedRoute role="Nutritionist"><AuthLayout role="nutritionist"><CreatePlan /></AuthLayout></ProtectedRoute>} />
      <Route path="/nutritionist/manage-plans"   element={<ProtectedRoute role="Nutritionist"><AuthLayout role="nutritionist"><ManagePlans /></AuthLayout></ProtectedRoute>} />
      <Route path="/nutritionist/client-answers" element={<ProtectedRoute role="Nutritionist"><AuthLayout role="nutritionist"><ClientAnswers /></AuthLayout></ProtectedRoute>} />
      <Route path="/nutritionist/write-article"  element={<ProtectedRoute role="Nutritionist"><AuthLayout role="nutritionist"><WriteArticle /></AuthLayout></ProtectedRoute>} />
      <Route path="/nutritionist/profile"       element={<ProtectedRoute role="Nutritionist"><AuthLayout role="nutritionist"><NutritionistProfile /></AuthLayout></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin/dashboard"     element={<ProtectedRoute role="Admin"><AuthLayout role="admin"><AdminDashboard /></AuthLayout></ProtectedRoute>} />
      <Route path="/admin/users"         element={<ProtectedRoute role="Admin"><AuthLayout role="admin"><AdminUsers /></AuthLayout></ProtectedRoute>} />
      <Route path="/admin/subscriptions" element={<ProtectedRoute role="Admin"><AuthLayout role="admin"><AdminSubscriptions /></AuthLayout></ProtectedRoute>} />
      <Route path="/admin/approvals"     element={<ProtectedRoute role="Admin"><AuthLayout role="admin"><AdminApprovals /></AuthLayout></ProtectedRoute>} />
      <Route path="/admin/articles"      element={<ProtectedRoute role="Admin"><AuthLayout role="admin"><AdminArticles /></AuthLayout></ProtectedRoute>} />
    </Routes>
  </BrowserRouter>
  );
};

export default App;
