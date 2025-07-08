// src/App.tsx - CORRECTION RESPONSIVITÉ MOBILE/TABLETTE (VERSION CORRIGÉE)
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ChakraProvider, extendTheme, Box } from '@chakra-ui/react';
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
import PolitiqueEtConfidentialitePage from './pages/PolitiqueEtConfidentialitePage';
import DivulgationDesRisquesPage from './pages/DivulgationDesRisquesPage';
import StrategyManagement from './pages/StrategyManagement';
import InvestmentCalculatorMultiCritere from './pages/InvestmentCalculatorMultiCritere';

// NOUVEAUX COMPOSANTS COMMUNAUTÉ
import CommunityRegistrationPage from './pages/CommunityRegistrationPage';
import PlatformAccessPage from './pages/PlatformAccessPage';
import RegistrationPage from './pages/RegistrationPage';
import EnhancedAuthService from './services/EnhancedAuthService';

import { pinataService } from './services/pinataService';

// Force les breakpoints pour mobile si nécessaire
const mobileInfo = detectMobileAndMetaMask();
console.log('🔍 Mobile détecté:', mobileInfo);

if (mobileInfo.shouldUseMobileMode) {
  console.log('📱 Forçage du mode mobile...');
  forceMobileBreakpoints();
}

// ========================================
// 🎨 CONFIGURATION THÈME CHAKRA UI RESPONSIVE
// ========================================
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
  // 🆕 STYLES GLOBAUX RESPONSIVE
  styles: {
    global: {
      // Reset et base
      '*': {
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      },
      html: {
        fontSize: { base: '14px', md: '16px' },
        scrollBehavior: 'smooth',
        // Empêche le zoom sur les inputs sur iOS
        '-webkit-text-size-adjust': '100%',
        '-ms-text-size-adjust': '100%',
      },
      body: {
        fontFamily: 'Inter, sans-serif',
        minHeight: '100vh',
        width: '100%',
        margin: 0,
        padding: 0,
        // Empêche le scroll horizontal
        overflowX: 'hidden',
        // Support PWA
        '-webkit-touch-callout': 'none',
        '-webkit-user-select': 'none',
        userSelect: 'none',
        // Améliore les performances de scroll sur mobile
        '-webkit-overflow-scrolling': 'touch',
      },
      // Container principal responsive
      '#root': {
        minHeight: '100vh',
        width: '100%',
        margin: 0,
        padding: 0,
        position: 'relative',
      },
      // Améliore l'affichage des boutons sur mobile
      'button, input, select, textarea': {
        '-webkit-appearance': 'none',
        '-moz-appearance': 'none',
        fontSize: { base: '16px', md: '14px' }, // Évite le zoom sur iOS
      },
    },
  },
  // 🆕 BREAKPOINTS PERSONNALISÉS
  breakpoints: {
    base: '0px',    // mobile
    sm: '480px',    // mobile large
    md: '768px',    // tablette
    lg: '992px',    // desktop
    xl: '1280px',   // desktop large
    '2xl': '1536px' // très large
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
// 🆕 ROUTE DE PROTECTION COMMUNAUTÉ (INCHANGÉ)
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
        if (requiresCommunity || requiresPlatform || requiresLegalAcceptance) {
          const status = await EnhancedAuthService.getCompleteUserAccessStatus(user.walletAddress);
          
          if (requiresCommunity && !status.isCommunityMember) {
            navigate('/community-registration');
            return;
          }
          
          if (requiresPlatform && !status.isPlatformAuthorized) {
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
// 🆕 CONTENU PRINCIPAL AVEC LAYOUT RESPONSIVE
// ========================================
const AppContent: React.FC = () => {
  return (
    <Router>
      {/* 🎨 CONTAINER PRINCIPAL RESPONSIVE */}
      <Box
        minH="100vh"
        w="100%"
        bg="linear-gradient(135deg, #1a202c 0%, #2d3748 100%)"
        position="relative"
        overflow="hidden"
        // Centrage et contraintes de largeur
        maxW="100vw"
        mx="auto"
        // Évite les débordements sur mobile
        css={{
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}
      >
        <Routes>
          {/* Routes publiques */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Box w="100%" minH="100vh" display="flex" flexDirection="column">
                  <LoginPage />
                </Box>
              </PublicRoute>
            }
          />
          
          <Route
            path="/terms-and-conditions"
            element={
                <Box w="100%" minH="100vh" display="flex" flexDirection="column">
                  <TermsAndConditionsPage />
                </Box>
            }
          />

          <Route
            path="/politique-et-confidentialite"
            element={
                <Box w="100%" minH="100vh" display="flex" flexDirection="column">
                  <PolitiqueEtConfidentialitePage />
                </Box>
            }
          />

          <Route
            path="/divulgation-des-risques"
            element={
                <Box w="100%" minH="100vh" display="flex" flexDirection="column">
                  <DivulgationDesRisquesPage />
                </Box>
            }
          />

          <Route 
            path="/registration" 
            element={
              <Box w="100%" minH="100vh" display="flex" flexDirection="column">
                <RegistrationPage />
              </Box>
            } 
          />
          
          <Route 
            path="/conditions-utilisation" 
            element={
              <Box w="100%" minH="100vh" display="flex" flexDirection="column">
                <TermsAndConditionsPage />
              </Box>
            } 
          />

          <Route 
            path="/community-registrations" 
            element={
              <Box w="100%" minH="100vh" display="flex" flexDirection="column">
                <CommunityRegistrationPage />
              </Box>
            } 
          />
          
          <Route 
            path="/platform-access" 
            element={
              <CommunityProtectedRoute requiresCommunity={true}>
                <Box w="100%" minH="100vh" display="flex" flexDirection="column">
                  <PlatformAccessPage />
                </Box>
              </CommunityProtectedRoute>
            } 
          />

          {/* Routes protégées avec layout responsive */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                {/* 🎯 LAYOUT PRINCIPAL RESPONSIVE */}
                <Box
                  w="100%"
                  minH="100vh"
                  display="flex"
                  flexDirection="column"
                  position="relative"
                >
                  {/* Navbar responsive */}
                  <Box
                    w="100%"
                    position="sticky"
                    top={0}
                    zIndex={1000}
                    bg="rgba(26, 32, 44, 0.95)"
                    backdropFilter="blur(10px)"
                  >
                    <Navbar />
                  </Box>
                  
                  {/* Contenu principal responsive */}
                  <Box
                    as="main"
                    flex={1}
                    w="100%"
                    position="relative"
                    // Padding responsive pour éviter que le contenu touche les bords
                    px={{ base: 0, md: 0 }}
                    py={{ base: 0, md: 0 }}
                    // Centrage du contenu
                    mx="auto"
                    // Largeur maximale pour éviter l'étirement sur très grand écran
                    maxW="100vw"
                  >
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      
                      <Route 
                        path="/dashboard" 
                        element={
                          <CommunityProtectedRoute 
                            requiresCommunity={false}
                            requiresPlatform={false}
                            requiresLegalAcceptance={false}
                          >
                            <Dashboard />
                          </CommunityProtectedRoute>
                        } 
                      />
                      
                      <Route path="/invest" element={<InvestPage />} />
                      <Route path="/roadmap" element={<RoadmapPage />} />
                      <Route path="/admin/*" element={<AdminPage />} />
                      <Route path="/nft-collection" element={<NFTMarketplace />} />
                      <Route path="/nft-cards" element={<NFTCards1 />} />
                      <Route path="/nft-page" element={<NFTPage />} />
                      <Route path="/history" element={<TransactionHistoryUsers />} />
                      <Route path="/yield-calculator" element={<YieldCalculatorPage />} />
                      <Route path="/calculator-multi-critere" element={<InvestmentCalculatorMultiCritere />} />
                      <Route path="/strategy-management" element={<StrategyManagement />} />
                     
                      {/* Routes de la communauté */}
                      
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Box>
                  
                  {/* Footer responsive */}
                  <Box
                    w="100%"
                    mt="auto"
                  >
                    <Footer />
                  </Box>
                </Box>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Box>
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
// 🚀 COMPOSANT RACINE AVEC CSS GLOBAL
// ========================================
const App: React.FC = () => {
  useEffect(() => {
    console.log('🚀 CryptoVault Application démarrée');
    console.log('📱 Mode responsive activé');
    console.log('🆕 Nouvelles routes communauté disponibles');
    
    // 🎯 INJECTION CSS GLOBAL POUR MOBILE
    const globalStyles = document.createElement('style');
    globalStyles.innerHTML = `
      /* Reset global */
      * {
        box-sizing: border-box !important;
      }
      
      /* HTML et body */
      html, body, #root {
        width: 100% !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
      }
      
      /* Évite le zoom sur iOS */
      input, select, textarea {
        font-size: 16px !important;
      }
      
      /* Améliore les performances sur mobile */
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      /* Fix pour les containers Chakra UI */
      .chakra-container {
        max-width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
      
      /* Responsive breakpoints custom */
      @media (max-width: 767px) {
        .chakra-container {
          width: 100% !important;
          margin: 0 !important;
        }
      }
    `;
    document.head.appendChild(globalStyles);
    
    if (typeof window !== 'undefined') {
      if (window.ethereum) {
        console.log('✅ MetaMask détecté');
      } else {
        console.warn('⚠️ MetaMask non détecté');
      }
    }

    document.title = 'CryptocaVault - Plateforme de récompense sécurisée';
    
    // Cleanup
    return () => {
      document.head.removeChild(globalStyles);
    };
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