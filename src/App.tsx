import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { WalletProvider } from './contexts/WalletContext';
import { InvestmentProvider } from './contexts/InvestmentContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import InvestPage from './pages/InvestPage';
import RoadmapPage from './pages/RoadmapPage';
import StrategyManagement from './pages/StrategyManagement';
import InvestmentCalculator from './pages/InvestmentCalculator';
import InvestmentCalculatorMultiCritere from './pages/InvestmentCalculatorMultiCritere';
import LoginPage from './pages/LoginPage'; // Nouveau
import FAQ from './pages/FAQ';
import AdminPage from './pages/AdminPage';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/utils/ProtectedRoute';

// Composant pour gérer l'authentification globale
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si non authentifié, afficher seulement la page de login
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Si authentifié, afficher l'application complète
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/invest" element={<InvestPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/strategy-management" element={<StrategyManagement />} />
          <Route path="/calculator" element={<InvestmentCalculator />} />
          <Route path="/calculator-multi-critere" element={<InvestmentCalculatorMultiCritere />} />
          <Route path="/faq" element={<FAQ />} />
          
          {/* Routes protégées */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          
          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <ChakraProvider>
      <ThemeProvider>
        <AuthProvider> {/* Nouveau wrapper */}
          <WalletProvider>
            <InvestmentProvider>
              <Router>
                <AppContent />
              </Router>
            </InvestmentProvider>
          </WalletProvider>
        </AuthProvider>
      </ThemeProvider>
    </ChakraProvider>
  );
}

export default App;