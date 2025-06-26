// src/App.tsx - Intégration système communauté (VERSION PROGRESSIVE)
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { InvestmentProvider } from './contexts/InvestmentContext';
import { useMetaMaskSecurityBSC } from './hooks/useMetaMaskSecurityBSC';
import { detectMobileAndMetaMask, forceMobileBreakpoints } from './components/utils/mobileDetection';

// Vos composants existants
import Navbar from './components/layout/Navbar';
import SecurityMonitor from './components/SecurityMonitor';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import InvestPage from './pages/InvestPage';
import RoadmapPage from './pages/RoadmapPage';
import AdminPage from './pages/AdminPage';
import NFTMarketplace from './pages/NFTMarketplace';
import LoadingSpinner from './components/LoadingSpinner';
import TransactionHistoryUsers from './pages/TransactionHistoryUsers';
import Footer from './components/layout/Footer';
import NFTCards1 from './pages/NFTCards1';
import YieldCalculatorPage from './pages/YieldCalculatorPage';
import NFTPage from './pages/NFTPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';

// NOUVEAUX COMPOSANTS COMMUNAUTÉ
import CommunityRegistrationPage from './pages/CommunityRegistrationPage';
import PlatformAccessPage from './pages/PlatformAccessPage';
import RegistrationPage from './pages/RegistrationPage'; // ← NOUVEAU
import EnhancedAuthService from './services/EnhancedAuthService';

import { pinataService } from './services/pinataService';

// Force les breakpoints pour mobile si nécessaire
const mobileInfo = detectMobileAndMetaMask();
console.log('🔍 Mobile détecté:', mobileInfo);

if (mobileInfo.shouldUseMobileMode) {
  console.log('📱 Forçage du mode mobile...');
  forceMobileBreakpoints();
}

// Configuration du thème Chakra UI (INCHANGÉ)
const chakraTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#e6f3ff',
      100: '#b3d9ff',
      200: '#80bfff',
      300: '#4da6ff',
      400: '#1a8cff',
      500: '#0073e6',
      600: '#005bb3',
      700: '#004280',
      800: '#002a4d',
      900: '#00111a',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  styles: {
    global: {
      body: {
        fontFamily: 'Inter, sans-serif',
      },
    },
  },
});

// ========================================
// 🔧 CONFIGURATION DEBUG PINATA (INCHANGÉ)
// ========================================

const setupPinataDebug = () => {
  if (import.meta.env.DEV) {
    (window as any).testPinata = async () => {
      console.log('🔍 Test connexion Pinata...');
      try {
        const isAuth = await pinataService.testAuthentication();
        if (isAuth) {
          console.log('✅ Pinata connecté !');
          const files = await pinataService.getAllPinnedFiles();
          console.log('📁 Fichiers épinglés:', files.count);
        } else {
          console.log('❌ Échec connexion Pinata');
        }
      } catch (error) {
        console.error('💥 Erreur:', error);
      }
    };

    (window as any).pinataService = pinataService;
    console.log('🔧 Debug Pinata: testPinata() disponible');
  }
};

setupPinataDebug();

// ========================================
// 🆕 NOUVEAU: Route de Protection Communauté
// ========================================

const CommunityProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  requiresCommunity?: boolean;
  requiresPlatform?: boolean;
  requiresLegalAcceptance?: boolean;
}> = ({ 
  children, 
  requiresCommunity = false, 
  requiresPlatform = false, 
  requiresLegalAcceptance = false 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated || !user?.walletAddress) return;

      try {
        // Vérifier le statut complet uniquement si nécessaire
        if (requiresCommunity || requiresPlatform || requiresLegalAcceptance) {
          const status = await EnhancedAuthService.getCompleteUserAccessStatus(user.walletAddress);
          
          // Rediriger selon les besoins
          if (requiresCommunity && !status.isCommunityMember) {
            navigate('/community-registration');
            return;
          }
          
          if (requiresPlatform && !status.isPlatformAuthorized) {
            // Utilisateur membre mais pas autorisé plateforme - rester sur la page actuelle
            return;
          }
          
          if (requiresLegalAcceptance && !status.hasRecentLegalAcceptance) {
            navigate('/platform-access');
            return;
          }
        }
      } catch (error) {
        console.error('Erreur vérification statut communauté:', error);
      }
    };

    if (!isLoading) {
      checkAccess();
    }
  }, [isAuthenticated, user?.walletAddress, isLoading, requiresCommunity, requiresPlatform, requiresLegalAcceptance, navigate]);

  return <>{children}</>;
};

// ========================================
// 🔒 COMPOSANTS DE SÉCURITÉ (INCHANGÉS)
// ========================================

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const { getSecurityStatus } = useMetaMaskSecurityBSC({
    onUnauthorizedChange: (oldAddr, newAddr) => {
      console.log('🚨 [ProtectedRoute] Changement d\'adresse non autorisé:', { oldAddr, newAddr });
    },
    onSecurityBreach: () => {
      console.log('🔒 [ProtectedRoute] Violation de sécurité - Redirection vers login');
      navigate('/login', { replace: true });
    },
    checkInterval: 2000,
    enableLogging: true
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <LoadingSpinner 
        message="Vérification de l'authentification..."
        subMessage="Sécurisation de votre session"
        variant="security"
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}
      <SecurityMonitor />
    </>
  );
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // INCHANGÉ: Redirection vers HomePage après connexion
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <LoadingSpinner 
        message="Initialisation de l'application..."
        subMessage="Configuration de l'environnement sécurisé"
        variant="default"
      />
    );
  }

  return <>{children}</>;
};

// ========================================
// 🆕 CONTENU PRINCIPAL AVEC NOUVELLES ROUTES
// ========================================

const AppContent: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <Routes>
          {/* Route publique - Page de connexion (INCHANGÉE) */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          {/* 🆕 NOUVELLE ROUTE PUBLIQUE - Termes et Conditions */}
          <Route
            path="/terms-and-conditions"
            element={
              <PublicRoute>
              <TermsAndConditionsPage />
              </PublicRoute>
            }
          />

          {/* 🆕 NOUVELLE ROUTE PUBLIQUE - Page d'inscription */}
          <Route 
            path="/registration" 
            element={<RegistrationPage />} 
          />
          <Route path="/conditions-utilisation" element={<TermsAndConditionsPage />} />

          {/* 🆕 AUTRES ROUTES COMMUNAUTÉ */}
          <Route 
            path="/community-registrations" 
            element={<CommunityRegistrationPage />} 
          />
          
          <Route 
            path="/platform-access" 
            element={
              <CommunityProtectedRoute requiresCommunity={true}>
                <PlatformAccessPage />
              </CommunityProtectedRoute>
            } 
          />

          {/* Routes protégées EXISTANTES */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Navbar />
                <main className="relative">
                  <Routes>
                    {/* HomePage - INCHANGÉE */}
                    <Route path="/" element={<HomePage />} />
                    
                    {/* 🔄 Dashboard avec protection communauté OPTIONNELLE */}
                    <Route 
                      path="/dashboard" 
                      element={
                        <CommunityProtectedRoute 
                          requiresCommunity={false}     // ← Mise à false pour ne pas forcer
                          requiresPlatform={false}      // ← Vos utilisateurs existants continuent
                          requiresLegalAcceptance={false} // ← à fonctionner normalement
                        >
                          <Dashboard />
                        </CommunityProtectedRoute>
                      } 
                    />
                    
                    {/* Toutes vos autres routes INCHANGÉES */}
                    <Route path="/invest" element={<InvestPage />} />
                    <Route path="/roadmap" element={<RoadmapPage />} />
                    <Route path="/admin/*" element={<AdminPage />} />
                    <Route path="/nft-collection" element={<NFTMarketplace />} />
                    <Route path="/nft-cards" element={<NFTCards1 />} />
                    <Route path="/nft-page" element={<NFTPage />} />
                    <Route path="/history" element={<TransactionHistoryUsers />} />
                    <Route path="/yield-calculator" element={<YieldCalculatorPage />} />
                    
                    
                    {/* Redirection INCHANGÉE */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Footer />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

// ========================================
// 🔧 GESTION D'ERREURS (INCHANGÉE)
// ========================================

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Erreur globale capturée:', event.error);
      
      if (event.error?.message?.includes('MetaMask')) {
        console.error('💼 Erreur liée à MetaMask détectée');
      } else if (event.error?.message?.includes('Provider')) {
        console.error('🔌 Erreur de Provider - Vérifiez l\'ordre des providers dans App.tsx');
      } else if (event.error?.message?.includes('useInvestment')) {
        console.error('💰 Erreur InvestmentContext - Assurez-vous que InvestmentProvider est présent');
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Promise rejetée non gérée:', event.reason);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
};

// ========================================
// 🚀 COMPOSANT RACINE (INCHANGÉ)
// ========================================

const App: React.FC = () => {
  useEffect(() => {
    console.log('🚀 CryptoVault Application démarrée');
    console.log('🏠 Redirection après connexion : HomePage (/)');
    console.log('🆕 Nouvelles routes communauté disponibles');
    
    if (typeof window !== 'undefined') {
      if (window.ethereum) {
        console.log('✅ MetaMask détecté');
      } else {
        console.warn('⚠️ MetaMask non détecté');
      }
    }

    document.title = 'CryptoVault - Plateforme d\'investissement sécurisée';
  }, []);

  return (
    <ErrorBoundary>
      <ChakraProvider theme={chakraTheme}>
        <ThemeProvider>
          <AuthProvider>
            <WalletProvider>
              <InvestmentProvider>
                <AppContent />
              </InvestmentProvider>
            </WalletProvider>
          </AuthProvider>
        </ThemeProvider>
      </ChakraProvider>
    </ErrorBoundary>
  );
};

export default App;