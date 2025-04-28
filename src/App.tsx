import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react'; // Ajoutez cette importation
import { WalletProvider } from './contexts/WalletContext';
import { InvestmentProvider } from './contexts/InvestmentContext';
import { ThemeProvider } from './contexts/ThemeContext';
// Pages
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import InvestPage from './pages/InvestPage';
// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/utils/ProtectedRoute';
import AdminRoute from './components/utils/AdminRoute';

function App() {
  return (
    <ChakraProvider> {/* Ajoutez ChakraProvider ici */}
      <ThemeProvider>
        <WalletProvider>
          <InvestmentProvider>
            <Router>
              <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/invest" element={<InvestPage />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      }
                    />
                  </Routes>
                </main>
                <Footer />
              </div>
            </Router>
          </InvestmentProvider>
        </WalletProvider>
      </ThemeProvider>
    </ChakraProvider>
  );
}

export default App;