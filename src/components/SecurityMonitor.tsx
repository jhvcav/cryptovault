// src/components/SecurityMonitor.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useMetaMaskSecurityBSC } from '../hooks/useMetaMaskSecurityBSC';
import { Shield, AlertTriangle, Clock, Wifi, X, Zap, RefreshCw } from 'lucide-react';

interface SecurityStatus {
  addressMatch: boolean;
  sessionActive: boolean;
  walletConnected: boolean;
  networkCorrect: boolean;
  lastCheck: Date;
  securityLevel: 'high' | 'medium' | 'low';
}

const BSC_CHAIN_ID = 56;

const SecurityMonitor: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { address, isConnected, chainId, balance } = useWallet();
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    addressMatch: true,
    sessionActive: true,
    walletConnected: false,
    networkCorrect: true,
    lastCheck: new Date(),
    securityLevel: 'high'
  });
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);

  // Hook de sécurité MetaMask
  const { getSecurityStatus, forceSecurityCheck } = useMetaMaskSecurityBSC({
    onUnauthorizedChange: (oldAddr, newAddr) => {
      console.log('🚨 SecurityMonitor: Changement non autorisé détecté');
      setShowAlerts(true);
    },
    onSecurityBreach: () => {
      console.log('🔒 SecurityMonitor: Violation de sécurité');
    },
    enableLogging: false // Désactiver les logs pour le monitoring
  });

  // Surveillance continue de la sécurité
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSecurity = () => {
      const metaMaskSecurity = getSecurityStatus();
      const isOnBSC = chainId === BSC_CHAIN_ID;
      
      const currentStatus: SecurityStatus = {
        addressMatch: metaMaskSecurity.isSecure,
        sessionActive: metaMaskSecurity.isInitialized,
        walletConnected: isConnected,
        networkCorrect: isOnBSC,
        lastCheck: new Date(),
        securityLevel: 'high'
      };

      // Calculer le niveau de sécurité
      if (!currentStatus.addressMatch || !currentStatus.sessionActive) {
        currentStatus.securityLevel = 'low';
      } else if (!currentStatus.walletConnected || !currentStatus.networkCorrect) {
        currentStatus.securityLevel = 'medium';
      } else {
        currentStatus.securityLevel = 'high';
      }

      setSecurityStatus(currentStatus);
    };

    // Vérification initiale
    checkSecurity();

    // Vérification périodique toutes les 5 secondes
    const securityInterval = setInterval(checkSecurity, 5000);

    return () => {
      clearInterval(securityInterval);
    };
  }, [isAuthenticated, address, isConnected, chainId, getSecurityStatus]);

  // Ne pas afficher si non authentifié
  if (!isAuthenticated) return null;

  const getSecurityColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-green-500',
          hoverBg: 'hover:bg-green-600',
          text: 'text-green-500',
          borderColor: 'border-green-200',
          bgLight: 'bg-green-100'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-500',
          hoverBg: 'hover:bg-yellow-600',
          text: 'text-yellow-500',
          borderColor: 'border-yellow-200',
          bgLight: 'bg-yellow-100'
        };
      case 'low':
        return {
          bg: 'bg-red-500',
          hoverBg: 'hover:bg-red-600',
          text: 'text-red-500',
          borderColor: 'border-red-200',
          bgLight: 'bg-red-100'
        };
    }
  };

  const colors = getSecurityColor(securityStatus.securityLevel);

  const getSecurityMessage = () => {
    if (securityStatus.securityLevel === 'low') {
      return 'Problème de sécurité détecté';
    } else if (securityStatus.securityLevel === 'medium') {
      return 'Attention requise';
    }
    return 'Sécurité optimale';
  };

  return (
    <>
      {/* Indicateur de sécurité flottant */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowSecurityPanel(!showSecurityPanel)}
          className={`p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 ${colors.bg} ${colors.hoverBg} text-white relative`}
          title={`Sécurité: ${getSecurityMessage()}`}
        >
          {securityStatus.securityLevel === 'low' ? (
            <AlertTriangle size={20} className="animate-pulse" />
          ) : (
            <Shield size={20} />
          )}
          
          {/* Badge de notification si problème */}
          {securityStatus.securityLevel !== 'high' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
          )}
        </button>
      </div>

      {/* Panel de sécurité détaillé */}
      {showSecurityPanel && (
        <div className="fixed bottom-20 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-96 max-w-[90vw]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
              <Shield className="mr-2" size={20} />
              Monitoring Sécurité
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={forceSecurityCheck}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Forcer une vérification"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={() => setShowSecurityPanel(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Niveau de sécurité global */}
          <div className={`p-3 rounded-lg border mb-4 ${colors.borderColor} ${colors.bgLight}`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">
                Niveau: {securityStatus.securityLevel === 'high' ? 'Élevé' : 
                         securityStatus.securityLevel === 'medium' ? 'Moyen' : 'Faible'}
              </span>
              <div className={`w-3 h-3 rounded-full ${colors.bg} ${
                securityStatus.securityLevel !== 'high' ? 'animate-pulse' : ''
              }`}></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {getSecurityMessage()}
            </p>
          </div>

          {/* Détails de sécurité */}
          <div className="space-y-3 mb-4">
            {/* Connexion Wallet */}
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="flex items-center text-sm">
                <Wifi className="mr-2" size={16} />
                Wallet connecté
              </span>
              <span className={securityStatus.walletConnected ? 'text-green-600' : 'text-red-600'}>
                {securityStatus.walletConnected ? '✓' : '✗'}
              </span>
            </div>

            {/* Adresse autorisée */}
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="flex items-center text-sm">
                <Shield className="mr-2" size={16} />
                Adresse autorisée
              </span>
              <span className={securityStatus.addressMatch ? 'text-green-600' : 'text-red-600'}>
                {securityStatus.addressMatch ? '✓' : '✗'}
              </span>
            </div>

            {/* Réseau BSC */}
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="flex items-center text-sm">
                <Zap className="mr-2" size={16} />
                Réseau BSC
              </span>
              <div className="flex items-center space-x-2">
                <span className={securityStatus.networkCorrect ? 'text-green-600' : 'text-orange-600'}>
                  {securityStatus.networkCorrect ? '✓' : '⚠'}
                </span>
                {chainId && (
                  <span className="text-xs text-gray-500">
                    ({chainId === BSC_CHAIN_ID ? 'BSC' : `Chain ${chainId}`})
                  </span>
                )}
              </div>
            </div>

            {/* Session active */}
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="flex items-center text-sm">
                <Clock className="mr-2" size={16} />
                Session active
              </span>
              <span className={securityStatus.sessionActive ? 'text-green-600' : 'text-red-600'}>
                {securityStatus.sessionActive ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* Informations utilisateur et wallet */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <p>👤 {user?.firstName} {user?.lastName}</p>
              {address && (
                <p className="font-mono">💼 {address.substring(0, 8)}...{address.substring(address.length - 6)}</p>
              )}
              <p>🕒 Dernière vérif: {securityStatus.lastCheck.toLocaleTimeString()}</p>
            </div>

            {/* Balances BSC si connecté */}
            {isConnected && balance && (
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p className="font-medium">💰 Balances BSC:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    <span className="text-green-700 dark:text-green-400">USDT: {balance.usdt.toFixed(2)}</span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    <span className="text-blue-700 dark:text-blue-400">USDC: {balance.usdc.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions d'urgence */}
          {securityStatus.securityLevel === 'low' && (
            <div className="pt-3 border-t border-red-200 dark:border-red-800">
              <button
                onClick={() => {
                  logout();
                  setShowSecurityPanel(false);
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <AlertTriangle size={16} />
                <span>Déconnexion d'urgence</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay pour fermer le panel */}
      {showSecurityPanel && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSecurityPanel(false)}
        />
      )}
    </>
  );
};

export default SecurityMonitor;