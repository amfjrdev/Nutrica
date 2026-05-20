import logo from '../assets/Nutrica-logo.png';

const Footer = () => (
  <footer className="bg-slate-900 text-slate-300 py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        {/* Brand */}
        <div>
          <div className="flex items-center mb-4">
            <img src={logo} alt="NutriCA" className="h-8 w-auto" />
          </div>
          <p className="text-sm leading-relaxed">Your partner in health and wellness</p>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-white font-bold mb-4">Product</h4>
          <ul className="space-y-2 text-sm">
            {["Features", "Pricing", "How it Works"].map((l) => (
              <li key={l}><a href="#" className="hover:text-emerald-400 transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-white font-bold mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            {["About Us", "Contact", "Privacy Policy"].map((l) => (
              <li key={l}><a href="#" className="hover:text-emerald-400 transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white font-bold mb-4">Support</h4>
          <ul className="space-y-2 text-sm">
            {["Help Center", "Terms of Service", "FAQ"].map((l) => (
              <li key={l}><a href="#" className="hover:text-emerald-400 transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
        <p>© 2026 NutriCA. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
