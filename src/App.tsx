// src/App.tsx - COHABITATION V1 + V2
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ChakraProvider, extendTheme, Box } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';

// ✅ DOUBLE IMPORT : V1 ET V2
import { InvestmentProvider as InvestmentProviderV1 } from './contexts/InvestmentContext';
import { InvestmentProvider as InvestmentProviderV2 } from './contexts/InvestmentContextV2';

import { useMetaMaskSecurityBSC } from './hooks/useMetaMaskSecurityBSC';
import { detectMobileAndMetaMask, forceMobileBreakpoints } from './components/utils/mobileDetection';

// Vos composants existants
import Navbar from './components/layout/Navbar';
import SecurityMonitor from './components/SecurityMonitor';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard'; // ← Utilise V1
import DashboardV2 from './pages/DashboardV2'; // ← Utilise V2
import InvestPageV2 from './pages/InvestPageV2';
import RoadmapPage from './pages/RoadmapPage';
import AdminPage from './pages/AdminPage';
//import NFTMarketplace from './pages/NFTMarketplace';
import LoadingSpinner from './components/LoadingSpinner';
import TransactionHistoryUsers from './pages/TransactionHistoryUsers';
import TransactionHistoryUsersV2 from './pages/TransactionHistoryUsersV2';
import Footer from './components/layout/Footer';
import NFTCards1 from './pages/NFTCards1';
import YieldCalculatorPage from './pages/YieldCalculatorPage';
import NFTPage from './pages/NFTPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import PolitiqueEtConfidentialitePage from './pages/PolitiqueEtConfidentialitePage';
import DivulgationDesRisquesPage from './pages/DivulgationDesRisquesPage';
import StrategyManagement from './pages/StrategyManagement';
import NFTMultiPlanSimulator from './pages/NFTMultiPlanSimulator';
import CompoundInterestSimulator from './pages/CompoundingInterestSimulator';
import StrategyRecommender from './pages/StrategyRecommender';

// NOUVEAUX COMPOSANTS COMMUNAUTÉ
import CommunityRegistrationPage from './pages/CommunityRegistrationPage';
import PlatformAccessPage from './pages/PlatformAccessPage';
import RegistrationPage from './pages/RegistrationPage';
import EnhancedAuthService from './services/EnhancedAuthService';

import { pinataService } from './services/pinataService';

// Configuration mobile (inchangée)
const mobileInfo = detectMobileAndMetaMask();
console.log('🔍 Mobile détecté:', mobileInfo);

if (mobileInfo.shouldUseMobileMode) {
  console.log('📱 Forçage du mode mobile...');
  forceMobileBreakpoints();
}

// Configuration Chakra UI (inchangée - code raccourci pour la lisibilité)
const chakraTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#e6f3ff',
      500: '#0073e6',
      900: '#00111a',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  styles: {
    global: {
      '*': { margin: 0, padding: 0, boxSizing: 'border-box' },
      html: { fontSize: { base: '14px', md: '16px' } },
      body: { fontFamily: 'Inter, sans-serif', minHeight: '100vh', overflowX: 'hidden' },
    },
  },
  breakpoints: {
    base: '0px', sm: '480px', md: '768px', lg: '992px', xl: '1280px', '2xl': '1536px'
  },
});

// Configuration debug Pinata (inchangée)
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

// Routes de protection (inchangées)
const CommunityProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  requiresCommunity?: boolean;
  requiresPlatform?: boolean;
  requiresLegalAcceptance?: boolean;
}> = ({ children, requiresCommunity = false, requiresPlatform = false, requiresLegalAcceptance = false }) => {
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
          if (requiresPlatform && !status.isPlatformAuthorized) return;
          if (requiresLegalAcceptance && !status.hasRecentLegalAcceptance) {
            navigate('/platform-access');
            return;
          }
        }
      } catch (error) {
        console.error('Erreur vérification statut communauté:', error);
      }
    };
    if (!isLoading) checkAccess();
  }, [isAuthenticated, user?.walletAddress, isLoading, requiresCommunity, requiresPlatform, requiresLegalAcceptance, navigate]);

  return <>{children}</>;
};

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

  return <>{children}<SecurityMonitor /></>;
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

// ✅ COMPOSANT WRAPPER POUR LES ROUTES V1
const V1ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <InvestmentProviderV1>
      {children}
    </InvestmentProviderV1>
  );
};

// ✅ COMPOSANT WRAPPER POUR LES ROUTES V2
const V2ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <InvestmentProviderV2>
      {children}
    </InvestmentProviderV2>
  );
};

// Contenu principal avec routes séparées
const AppContent: React.FC = () => {
  return (
    <Router>
      <Box
        minH="100vh"
        w="100%"
        bg="linear-gradient(135deg, #1a202c 0%, #2d3748 100%)"
        position="relative"
        overflow="hidden"
        maxW="100vw"
        mx="auto"
        css={{
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}
      >
        <Routes>
          {/* Routes publiques (inchangées) */}
          <Route path="/login" element={<PublicRoute><Box w="100%" minH="100vh" display="flex" flexDirection="column"><LoginPage /></Box></PublicRoute>} />
          <Route path="/terms-and-conditions" element={<Box w="100%" minH="100vh" display="flex" flexDirection="column"><TermsAndConditionsPage /></Box>} />
          <Route path="/politique-et-confidentialite" element={<Box w="100%" minH="100vh" display="flex" flexDirection="column"><PolitiqueEtConfidentialitePage /></Box>} />
          <Route path="/divulgation-des-risques" element={<Box w="100%" minH="100vh" display="flex" flexDirection="column"><DivulgationDesRisquesPage /></Box>} />
          <Route path="/registration" element={<Box w="100%" minH="100vh" display="flex" flexDirection="column"><RegistrationPage /></Box>} />
          <Route path="/conditions-utilisation" element={<Box w="100%" minH="100vh" display="flex" flexDirection="column"><TermsAndConditionsPage /></Box>} />
          <Route path="/community-registrations" element={<Box w="100%" minH="100vh" display="flex" flexDirection="column"><CommunityRegistrationPage /></Box>} />
          <Route path="/platform-access" element={<CommunityProtectedRoute requiresCommunity={true}><Box w="100%" minH="100vh" display="flex" flexDirection="column"><PlatformAccessPage /></Box></CommunityProtectedRoute>} />

          {/* Routes protégées avec layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Box w="100%" minH="100vh" display="flex" flexDirection="column" position="relative">
                  <Box w="100%" position="sticky" top={0} zIndex={1000} bg="rgba(26, 32, 44, 0.95)" backdropFilter="blur(10px)">
                    <Navbar />
                  </Box>
                  
                  <Box as="main" flex={1} w="100%" position="relative" px={{ base: 0, md: 0 }} py={{ base: 0, md: 0 }} mx="auto" maxW="100vw">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      
                      {/* ✅ ROUTE V1 - AVEC PROVIDER V1 */}
                      <Route 
                        path="/dashboardV1" 
                        element={
                          <V1ProtectedRoute>
                            <CommunityProtectedRoute requiresCommunity={false} requiresPlatform={false} requiresLegalAcceptance={false}>
                              <Dashboard />
                            </CommunityProtectedRoute>
                          </V1ProtectedRoute>
                        } 
                      />

                      {/* ✅ ROUTE V2 - AVEC PROVIDER V2 */}
                      <Route 
                        path="/dashboardV2" 
                        element={
                          <V2ProtectedRoute>
                            <CommunityProtectedRoute requiresCommunity={false} requiresPlatform={false} requiresLegalAcceptance={false}>
                              <DashboardV2 />
                            </CommunityProtectedRoute>
                          </V2ProtectedRoute>
                        } 
                      />

                      {/* ✅ ROUTE PRINCIPALE - REDIRECTION INTELLIGENTE */}
                      <Route 
                        path="/dashboard" 
                        element={
                          <V2ProtectedRoute>
                            <CommunityProtectedRoute requiresCommunity={false} requiresPlatform={false} requiresLegalAcceptance={false}>
                              <DashboardV2 />
                            </CommunityProtectedRoute>
                          </V2ProtectedRoute>
                        } 
                      />
                      
                      {/* ✅ AUTRES ROUTES - Déterminez lesquelles utilisent V1 ou V2 */}
                      <Route 
                        path="/invest" 
                        element={
                            <V2ProtectedRoute>
                            <InvestPageV2 />
                            </V2ProtectedRoute>
                        } 
                        />

                      
                      {/* ✅ ROUTE ADMIN CORRIGÉE */}
                      {/*}
                      <Route 
                        path="/admin/*" 
                        element={
                      <V2ProtectedRoute>
                      <AdminPage />
                      </V2ProtectedRoute>
                      } 
                      />
                      */}

                      <Route path="/admin/*" element={
  <V1ProtectedRoute>
    <AdminPage />
  </V1ProtectedRoute>
} />
                      
                      {/* Routes neutres (pas d'investissement) */}
                      <Route path="/roadmap" element={<RoadmapPage />} />
                      <Route path="/admin/*" element={<AdminPage />} />
                      {/*<Route path="/nft-collection" element={<NFTMarketplace />} />*/}
                      <Route path="/nft-cards" element={<NFTCards1 />} />
                      <Route path="/nft-page" element={<NFTPage />} />
                      <Route path="/yield-calculator" element={<YieldCalculatorPage />} />
                      <Route path="/calculator-nftmultiplan-simulator" element={<NFTMultiPlanSimulator />} />
                      <Route path="/strategy-management" element={<StrategyManagement />} />
                      <Route path="/compound-interest-Simulator" element={<CompoundInterestSimulator />} />
                      <Route path="/strategy-recommender" element={<StrategyRecommender />} />
                      
                      {/* ✅ HISTORIQUE - Pourrait nécessiter les deux contexts */}
                      <Route 
                        path="/history" 
                        element={
                          <V2ProtectedRoute>
                            <TransactionHistoryUsers />
                          </V2ProtectedRoute>
                        } 
                      />

                      <Route 
                        path="/historyV2" 
                        element={
                          <V2ProtectedRoute>
                            <TransactionHistoryUsersV2 />
                          </V2ProtectedRoute>
                        } 
                      />
                      
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Box>
                  
                  <Box w="100%" mt="auto">
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

// Gestion d'erreurs (inchangée)
const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Erreur globale capturée:', event.error);
      
      if (event.error?.message?.includes('MetaMask')) {
        console.error('💼 Erreur liée à MetaMask détectée');
      } else if (event.error?.message?.includes('Provider')) {
        console.error('🔌 Erreur de Provider - Version V1 ou V2?');
      } else if (event.error?.message?.includes('useInvestment')) {
        console.error('💰 Erreur InvestmentContext - Vérifiez la version (V1/V2)');
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

// ✅ COMPOSANT RACINE - SANS PROVIDER GLOBAL D'INVESTISSEMENT
const App: React.FC = () => {
  useEffect(() => {
    console.log('🚀 CryptoVault Application démarrée avec support DUAL V1+V2');
    console.log('📊 Dashboard V1: /dashboardV1 (ancien système)');
    console.log('📊 Dashboard V2: /dashboardV2 (nouveau système)');
    console.log('📱 Mode responsive activé');
    
    const globalStyles = document.createElement('style');
    globalStyles.innerHTML = `
      * { box-sizing: border-box !important; }
      html, body, #root { width: 100% !important; max-width: 100vw !important; margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; }
      input, select, textarea { font-size: 16px !important; }
      * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      .chakra-container { max-width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
      @media (max-width: 767px) { .chakra-container { width: 100% !important; margin: 0 !important; } }
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
              {/* ✅ PAS DE PROVIDER GLOBAL - CHAQUE ROUTE A SON PROVIDER */}
              <AppContent />
            </WalletProvider>
          </AuthProvider>
        </ThemeProvider>
      </ChakraProvider>
    </ErrorBoundary>
  );
};

export default App;