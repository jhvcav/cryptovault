// src/components/layout/Navbar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, Moon, Sun, LogOut } from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useOwner } from '../../hooks/useOwner';

const Navbar = () => {
  const { pathname } = useLocation();
  const { address, connectWallet, disconnectWallet, isConnected, isConnecting } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { isOwner } = useOwner();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleLogout = () => {
    logout();
    disconnectWallet(); // Déconnecter aussi le wallet
    setMobileMenuOpen(false);
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
            
            {/* Menu desktop - Seulement si authentifié */}
            {isAuthenticated && (
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
                  to="/roadmap" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/roadmap' 
                      ? 'bg-slate-900 text-white' 
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white transition-colors'
                  }`}
                >
                  Roadmap
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
                
                {/* Menu Admin - Visible seulement pour l'owner */}
                {isOwner && (
                  <Link 
                    to="/admin" 
                    className={`px-3 py-2 rounded-md text-sm font-medium relative ${
                      pathname.startsWith('/admin') 
                        ? 'bg-slate-900 text-white' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white transition-colors'
                    }`}
                  >
                    Admin
                    {/* Badge owner */}
                    <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      👑
                    </span>
                  </Link>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-300 hover:text-white focus:outline-none"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Affichage conditionnel selon l'authentification */}
            {isAuthenticated ? (
              <>
                {/* Informations utilisateur et bouton de déconnexion */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-300 text-sm">
                      Bonjour, {user?.firstName}
                    </span>
                    {/* Badge owner à côté du nom */}
                    {isOwner && (
                      <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                        👑 OWNER
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <LogOut size={16} />
                    <span>Déconnexion</span>
                  </button>
                </div>

                {/* Wallet connection (si authentifié) */}
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
              </>
            ) : (
              /* Si non authentifié, afficher seulement le statut */
              <div className="text-slate-400 text-sm hidden md:block">
                Non connecté
              </div>
            )}
            
            {/* Menu mobile toggle */}
            {isAuthenticated && (
              <div className="md:hidden flex items-center">
                <button
                  onClick={toggleMobileMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Menu mobile - Seulement si authentifié */}
      {mobileMenuOpen && isAuthenticated && (
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
              to="/roadmap" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/roadmap' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Roadmap
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
            
            {/* Menu Admin mobile - Visible seulement pour l'owner */}
            {isOwner && (
              <Link 
                to="/admin" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                  pathname.startsWith('/admin') 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Admin</span>
                <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                  👑
                </span>
              </Link>
            )}
            
            {/* Section utilisateur mobile */}
            <div className="border-t border-slate-700 pt-3 mt-3">
              <div className="px-3 py-2 text-slate-300 text-sm flex items-center space-x-2">
                <span>Connecté en tant que {user?.firstName} {user?.lastName}</span>
                {isOwner && (
                  <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                    👑 OWNER
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:text-red-300 hover:bg-slate-700"
              >
                <LogOut size={16} />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;