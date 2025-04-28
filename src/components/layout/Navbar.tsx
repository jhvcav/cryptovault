import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, Moon, Sun } from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { useTheme } from '../../contexts/ThemeContext';

const Navbar = () => {
  const { pathname } = useLocation();
  const { address, connectWallet, disconnectWallet, isConnected, isConnecting } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Wallet className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                CryptoVault
              </span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/' 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white transition-colors'
                }`}
              >
                Accueil
              </Link>
              <Link 
                to="/invest" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/invest' 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white transition-colors'
                }`}
              >
                Investir
              </Link>
              <Link 
                to="/dashboard" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/dashboard' 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white transition-colors'
                }`}
              >
                Tableau de Bord
              </Link>
              <Link 
                to="/admin" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/admin' 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white transition-colors'
                }`}
              >
                Admin
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-300 hover:text-white focus:outline-none"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {isConnected ? (
              <button
                onClick={disconnectWallet}
                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {shortenAddress(address || '')}
              </button>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70"
              >
                {isConnecting ? 'Connexion...' : 'Connecter le Portefeuille'}
              </button>
            )}
            
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-800">
            <Link 
              to="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Accueil
            </Link>
            <Link 
              to="/invest" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/invest' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Investir
            </Link>
            <Link 
              to="/dashboard" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/dashboard' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Tableau de Bord
            </Link>
            <Link 
              to="/admin" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/admin' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;