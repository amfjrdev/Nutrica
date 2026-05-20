import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import logo from '../assets/Nutrica-logo.png';
import { Link } from 'react-router-dom';
import Button from './Button';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="NutriCA" className="h-8 w-auto" />
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/articles" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Articles</Link>
            <Link to="/pricing"  className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Pricing</Link>
            <Link to="/login"    className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Login</Link>
            <Link to="/register"><Button variant="primary" className="!py-2 !px-4">Register</Button></Link>
          </div>

          <button className="md:hidden text-gray-600 hover:text-gray-900" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-4 shadow-lg">
          <Link to="/articles" className="block text-gray-600 hover:text-emerald-600 font-medium" onClick={() => setIsOpen(false)}>Articles</Link>
          <Link to="/pricing"  className="block text-gray-600 hover:text-emerald-600 font-medium" onClick={() => setIsOpen(false)}>Pricing</Link>
          <Link to="/login"    className="block text-gray-600 hover:text-emerald-600 font-medium" onClick={() => setIsOpen(false)}>Login</Link>
          <Link to="/register" onClick={() => setIsOpen(false)}><Button variant="primary" className="w-full">Register</Button></Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
