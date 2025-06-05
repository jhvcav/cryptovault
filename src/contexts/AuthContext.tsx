// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import HybridAuthService from '../services/HybridAuthService';
import { AuthResult } from '../services/LocalAuthService';

interface AuthContextType {
  user: AuthResult | null;
  isLoading: boolean;
  login: (walletAddress: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkStoredAuth = () => {
      const storedAuth = sessionStorage.getItem('walletAuth');
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          // Vérifier si l'authentification n'est pas expirée (24h)
          const isExpired = Date.now() - authData.timestamp > 24 * 60 * 60 * 1000;
          
          if (!isExpired) {
            setUser({
              isAuthorized: true,
              firstName: authData.firstName,
              lastName: authData.lastName,
              walletAddress: authData.walletAddress,
              isActive: true,
            });
          } else {
            sessionStorage.removeItem('walletAuth');
          }
        } catch (error) {
          sessionStorage.removeItem('walletAuth');
        }
      }
      setIsLoading(false);
    };

    checkStoredAuth();
  }, []);

  const login = async (walletAddress: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Validation basique de l'adresse Ethereum
      if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Format d\'adresse wallet invalide');
      }

      const authResult = await HybridAuthService.checkWalletAccess(walletAddress);
      
      if (authResult.isAuthorized && authResult.isActive) {
        setUser(authResult);
        
        // Stocker l'authentification
        sessionStorage.setItem('walletAuth', JSON.stringify({
          walletAddress: authResult.walletAddress,
          firstName: authResult.firstName,
          lastName: authResult.lastName,
          timestamp: Date.now()
        }));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('walletAuth');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user?.isAuthorized,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};