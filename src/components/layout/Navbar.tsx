// src/components/layout/Navbar.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useOwner } from '../../hooks/useOwner';
import { useMetaMaskSecurityBSC } from '../../hooks/useMetaMaskSecurityBSC';
import { Menu, X, Wallet, Moon, Sun, LogOut, AlertTriangle, Shield, Zap, ChevronDown, RefreshCw, Users } from 'lucide-react';
import { Smartphone, Download, ExternalLink } from 'lucide-react';

const BSC_CHAIN_ID = 56;

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { 
    address, 
    connectWallet, 
    disconnectWallet, 
    isConnected, 
    isConnecting, 
    chainId, 
    switchNetwork,
    balance,
    refreshBalances,
    changeAccount,
    requestAccountPermissions
  } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { isOwner } = useOwner();
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [showBalances, setShowBalances] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleChangeAccount = async () => {
  try {
    await changeAccount(); // Nouvelle fonction du WalletContext
  } catch (error) {
    console.error('Erreur changement de compte:', error);
  }
};

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const isInMetaMaskBrowser = () => {
  return /MetaMask/i.test(navigator.userAgent);
};

const openInMetaMask = () => {
  const currentUrl = window.location.href;
  const metamaskUrl = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
  window.open(metamaskUrl, '_blank');
};

  // Hook de sécurité MetaMask pour BSC
  const { getSecurityStatus, forceSecurityCheck } = useMetaMaskSecurityBSC({
    onUnauthorizedChange: (oldAddr, newAddr) => {
      console.log('🚨 Changement non autorisé détecté:', { oldAddr, newAddr });
      setShowSecurityWarning(true);
    },
    onSecurityBreach: () => {
      setShowSecurityWarning(true);
    },
    enableLogging: true
  });

  // Effect pour gérer les changements non autorisés
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Effect pour masquer l'avertissement après un délai
  useEffect(() => {
    if (showSecurityWarning) {
      const timer = setTimeout(() => {
        setShowSecurityWarning(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showSecurityWarning]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleLogout = () => {
    logout();
    disconnectWallet();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const handleWalletConnect = async () => {
    await connectWallet();
  };

  const handleWalletDisconnect = () => {
    disconnectWallet();
    setShowBalances(false);
  };

  const handleSwitchToBSC = async () => {
    if (chainId !== BSC_CHAIN_ID) {
      await switchNetwork(BSC_CHAIN_ID);
    }
  };

  const handleRefreshBalances = async () => {
    setIsRefreshing(true);
    await refreshBalances();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const toggleBalances = () => {
    setShowBalances(!showBalances);
  };

  // Vérifier si on est sur BSC
  const isOnBSC = chainId === BSC_CHAIN_ID;
  const securityStatus = getSecurityStatus();

  // Formatage des balances
  const formatBalance = (balance: number): string => {
    if (balance === 0) return '0.00';
    if (balance < 0.01) return '< 0.01';
    return balance.toFixed(2);
  };

  // Si l'utilisateur n'est pas authentifié, ne pas afficher la navbar complète
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Avertissement de sécurité */}
      {showSecurityWarning && (
        <div className="bg-red-600 text-white px-4 py-3 text-center relative animate-pulse">
          <div className="flex items-center justify-center space-x-2">
            <AlertTriangle size={20} />
            <span className="font-medium">
              🚨 ALERTE SÉCURITÉ : Changement d'adresse wallet détecté - Déconnexion automatique
            </span>
          </div>
          <button
            onClick={() => setShowSecurityWarning(false)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Avertissement réseau BSC */}
      {isConnected && !isOnBSC && (
        <div className="bg-yellow-600 text-white px-4 py-2 text-center">
          <div className="flex items-center justify-center space-x-3">
            <Zap size={18} />
            <span className="text-sm font-medium">
              Vous n'êtes pas sur le réseau BSC (BNB Smart Chain)
            </span>
            <button
              onClick={handleSwitchToBSC}
              className="bg-yellow-700 hover:bg-yellow-800 px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              Changer vers BSC
            </button>
          </div>
        </div>
      )}

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
              
              {/* Menu desktop */}
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
                    <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      👑
                    </span>
                  </Link>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-300 hover:text-white focus:outline-none"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Informations utilisateur et bouton de déconnexion */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-300 text-sm">
                    Bonjour, {user?.firstName}
                  </span>
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

              {/* Section Wallet avec sécurité */}
              {isConnected ? (
                <div className="relative">
                  <div className="flex items-center space-x-2">
                    {/* Indicateur de sécurité */}
                    <div className="flex items-center space-x-1">
                      {securityStatus.isSecure ? (
                        <Shield className="w-4 h-4 text-green-400" title="Connexion sécurisée" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" title="Problème de sécurité" />
                      )}
                    </div>

                    {/* Bouton wallet principal */}
                    <button
                      onClick={toggleBalances}
                      className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                    >
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>{shortenAddress(address || '')}</span>
                      <ChevronDown size={16} className={`transform transition-transform ${showBalances ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Indicateur de réseau */}
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      isOnBSC 
                        ? 'bg-green-600 text-white' 
                        : 'bg-orange-600 text-white animate-pulse'
                    }`}>
                      {isOnBSC ? 'BSC' : `Chain ${chainId}`}
                    </div>
                  </div>

                  {/* Menu déroulant des balances */}
                  {showBalances && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Balances BSC
                          </h3>
                          <button
                            onClick={handleRefreshBalances}
                            disabled={isRefreshing}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                            title="Actualiser les balances"
                          >
                            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {/* USDT Balance */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">₮</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 dark:text-white">USDT</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Tether USD</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-800 dark:text-white">
                                {formatBalance(balance.usdt)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">USDT</p>
                            </div>
                          </div>

                          {isMobileDevice() && !isConnected && !window.ethereum && (
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 text-center">
                              <div className="flex items-center justify-center space-x-3">
                                <Smartphone size={20} />
                                <div className="text-sm">
                                  <p className="font-medium">
                                    {isInMetaMaskBrowser() 
                                      ? "Utilisez le bouton 'Connecter Wallet' ci-dessus" 
                                      : "Pour la meilleure expérience mobile"}
                                  </p>
                                  {!isInMetaMaskBrowser() && (
                                    <button
                                      onClick={openInMetaMask}
                                      className="underline font-medium hover:text-orange-200 transition-colors"
                                    >
                                      Ouvrir dans l'app MetaMask →
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* USDC Balance */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">$</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 dark:text-white">USDC</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">USD Coin</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-800 dark:text-white">
                                {formatBalance(balance.usdc)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">USDC</p>
                            </div>
                          </div>

                          {/* Total en USD */}
                          <div className="border-t border-gray-200 dark:border-slate-600 pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Total USD
                              </span>
                              <span className="text-lg font-bold text-gray-800 dark:text-white">
                                ${formatBalance(balance.usdt + balance.usdc)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-600">
                          <div className="flex space-x-2">
                            {/* Nouveau bouton pour changer de compte */}
                            <button
                              onClick={handleChangeAccount}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                              title="Changer de compte MetaMask"
                            >
                              <Users size={14} />
                              <span>Changer</span>
                            </button>
    
                            <button
                              onClick={() => {
                                handleRefreshBalances();
                                setShowBalances(false);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                            >
                            Actualiser
                            </button>
                            <button
                              onClick={handleWalletDisconnect}
                              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                            >
                              Déconnecter
                            </button>
                          </div>
                        </div>

                        {/* Infos de sécurité */}
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                            <Shield size={12} />
                            <span>
                              Sécurité: {securityStatus.isSecure ? 'Vérifiée' : 'Attention'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleWalletConnect}
                  disabled={isConnecting}
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70"
                >
                  {isConnecting ? 'Connexion...' : 'Connecter Wallet'}
                </button>
              )}

              {/* Bouton spécial mobile si MetaMask non détecté */}
              {isMobileDevice() && !window.ethereum && (
                <button
                  onClick={openInMetaMask}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-1"
                  title="Ouvrir dans MetaMask"
                >
                  <ExternalLink size={16} />
                  <span className="hidden sm:inline">MetaMask</span>
                </button>
              )}
            
              {/* Menu mobile toggle */}
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
              
              {/* Menu Admin mobile */}
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

                {/* Balances mobile */}
                {isConnected && (
                  <div className="px-3 py-2 space-y-2">
                    <div className="text-slate-300 text-xs">Balances BSC:</div>
                    <div className="flex justify-between text-sm bg-slate-700 p-2 rounded">
                      <span className="text-slate-300">USDT:</span>
                      <span className="text-white font-medium">{formatBalance(balance.usdt)}</span>
                    </div>
                    <div className="flex justify-between text-sm bg-slate-700 p-2 rounded">
                      <span className="text-slate-300">USDC:</span>
                      <span className="text-white font-medium">{formatBalance(balance.usdc)}</span>
                    </div>
                  </div>
                )}

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

      {/* Click outside pour fermer les menus */}
      {showBalances && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowBalances(false)}
        />
      )}
    </>
  );
};

export default Navbar;