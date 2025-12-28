import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-700" />
          <h1 className="text-xl font-bold text-slate-800">EconWords</h1>
        </Link>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link to="/" className="text-slate-600 hover:text-blue-700 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link to="/stats" className="text-slate-600 hover:text-blue-700 transition-colors">
                Stats
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-slate-600 hover:text-blue-700 transition-colors">
                About
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;