// src/App.tsx - Redirection vers HomePage après connexion
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { InvestmentProvider } from './contexts/InvestmentContext';
import { useMetaMaskSecurityBSC } from './hooks/useMetaMaskSecurityBSC';
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

// Configuration du thème Chakra UI
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

// Composant pour les routes protégées avec sécurité MetaMask
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Hook de sécurité MetaMask pour toutes les routes protégées
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

  // Redirection automatique si non authentifié
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Écran de chargement pendant la vérification d'authentification
  if (isLoading) {
    return (
      <LoadingSpinner 
        message="Vérification de l'authentification..."
        subMessage="Sécurisation de votre session"
        variant="security"
      />
    );
  }

  // Redirection si non authentifié
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

// Composant pour les routes publiques (uniquement login)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirection si déjà authentifié - VERS HOMEPAGE
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Écran de chargement
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

// Composant principal de contenu de l'application
const AppContent: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <Routes>
          {/* Route publique - Page de connexion */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Routes protégées */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Navbar />
                <main className="relative">
                  <Routes>
                    {/* HomePage - Page d'accueil principale après connexion */}
                    <Route path="/" element={<HomePage />} />
                    
                    {/* Dashboard */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Page d'investissement */}
                    <Route path="/invest" element={<InvestPage />} />
                    
                    {/* Roadmap */}
                    <Route path="/roadmap" element={<RoadmapPage />} />
                    
                    {/* Pages d'administration */}
                    <Route path="/admin/*" element={<AdminPage />} />

                    {/* NFT Market */}
                    <Route path="/nft-collection" element={<NFTMarketplace />} />

                    {/* NFT Cards - Page de cartes NFT */}
                    <Route path="/nft-cards" element={<NFTCards1 />} />

                    {/* Historique des transactions */}
                    <Route path="/history" element={<TransactionHistoryUsers />} />

                    {/* Calculateur de rendement */}
                    <Route path="/yield-calculator" element={<YieldCalculatorPage />} />
                    
                    {/* Redirection de toutes les autres routes vers HomePage */}
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

// Composant de gestion des erreurs globales
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

// Composant racine de l'application
const App: React.FC = () => {
  useEffect(() => {
    console.log('🚀 CryptoVault Application démarrée');
    console.log('🏠 Redirection après connexion : HomePage (/)');
    
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