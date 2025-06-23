// src/components/ProtectedRoutes.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  Box,
  VStack,
  Spinner,
  Text,
  Alert,
  AlertIcon,
  Button,
  useToast
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import EnhancedAuthService, { UserAccessStatus } from '../services/EnhancedAuthService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresCommunity?: boolean;
  requiresPlatform?: boolean;
  requiresLegalAcceptance?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresCommunity = false,
  requiresPlatform = false,
  requiresLegalAcceptance = false
}) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [userStatus, setUserStatus] = useState<UserAccessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const toast = useToast();

  // Vérifier le statut utilisateur
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!isAuthenticated || !user?.walletAddress) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        
        const status = await EnhancedAuthService.getCompleteUserAccessStatus(user.walletAddress);
        setUserStatus(status);
        
      } catch (error: any) {
        setError('Erreur lors de la vérification des autorisations');
        console.error('Erreur vérification statut:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      checkUserStatus();
    }
  }, [isAuthenticated, user?.walletAddress, authLoading]);

  // Affichage pendant le chargement
  if (authLoading || isLoading) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color="gray.600">Vérification des autorisations...</Text>
        </VStack>
      </Box>
    );
  }

  // Redirection si non connecté
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50" p={4}>
        <VStack spacing={4} maxW="md" textAlign="center">
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <Text>{error}</Text>
          </Alert>
          <Button onClick={() => window.location.reload()} colorScheme="blue">
            Réessayer
          </Button>
        </VStack>
      </Box>
    );
  }

  // Vérifications des prérequis
  if (userStatus) {
    // Vérifier membre communauté
    if (requiresCommunity && !userStatus.isCommunityMember) {
      return <Navigate to="/community-registration" replace />;
    }

    // Vérifier autorisation plateforme
    if (requiresPlatform && !userStatus.isPlatformAuthorized) {
      return (
        <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50" p={4}>
          <VStack spacing={6} maxW="lg" textAlign="center">
            <Box bg="orange.100" p={6} borderRadius="xl">
              <Text fontSize="4xl" mb={4}>⏳</Text>
              <Text fontSize="xl" fontWeight="bold" color="orange.800" mb={2}>
                En Attente d'Autorisation
              </Text>
              <Text color="orange.700" mb={4}>
                Votre wallet n'est pas encore autorisé pour accéder à la plateforme. 
                Contactez l'administrateur.
              </Text>
              <Text fontSize="sm" color="orange.600" fontFamily="mono">
                {user?.walletAddress?.substring(0, 6)}...{user?.walletAddress?.substring(user.walletAddress.length - 4)}
              </Text>
            </Box>
            <VStack spacing={2}>
              <Button onClick={() => window.location.reload()} colorScheme="orange" variant="outline">
                🔄 Vérifier à nouveau
              </Button>
              <Text fontSize="xs" color="gray.500">
                Actualisez la page après avoir reçu l'autorisation
              </Text>
            </VStack>
          </VStack>
        </Box>
      );
    }

    // Vérifier acceptation légale
    if (requiresLegalAcceptance && !userStatus.hasRecentLegalAcceptance) {
      return <Navigate to="/platform-access" replace />;
    }
  }

  // Toutes les vérifications passées
  return <>{children}</>;
};

// =============================================
// COMPOSANT DE STATUS UTILISATEUR
// =============================================

export const UserStatusIndicator: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [userStatus, setUserStatus] = useState<UserAccessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!isAuthenticated || !user?.walletAddress) return;

      setIsLoading(true);
      try {
        const status = await EnhancedAuthService.getCompleteUserAccessStatus(user.walletAddress);
        setUserStatus(status);
      } catch (error) {
        console.error('Erreur récupération statut:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [isAuthenticated, user?.walletAddress]);

  if (!isAuthenticated || isLoading) {
    return null;
  }

  if (!userStatus) {
    return (
      <Alert status="warning" size="sm" borderRadius="md">
        <AlertIcon />
        <Text fontSize="sm">Impossible de vérifier le statut</Text>
      </Alert>
    );
  }

  const getStatusColor = () => {
    switch (userStatus.accessLevel) {
      case 'full': return 'green';
      case 'platform': return 'blue';
      case 'community': return 'orange';
      default: return 'red';
    }
  };

  const getStatusMessage = () => {
    switch (userStatus.accessLevel) {
      case 'full': return 'Accès complet autorisé';
      case 'platform': return 'Conditions légales à accepter';
      case 'community': return 'Autorisation plateforme en attente';
      default: return 'Accès limité';
    }
  };

  return (
    <Alert status="info" size="sm" borderRadius="md" bg={`${getStatusColor()}.50`} borderColor={`${getStatusColor()}.200`}>
      <AlertIcon color={`${getStatusColor()}.500`} />
      <VStack align="start" spacing={1} flex={1}>
        <Text fontSize="sm" fontWeight="medium" color={`${getStatusColor()}.800`}>
          {getStatusMessage()}
        </Text>
        {userStatus.nextSteps.length > 0 && (
          <Text fontSize="xs" color={`${getStatusColor()}.600`}>
            Prochaine étape: {userStatus.nextSteps[0]}
          </Text>
        )}
      </VStack>
    </Alert>
  );
};

// =============================================
// CONFIGURATION DES ROUTES AVEC PROTECTION
// =============================================

import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import CommunityRegistrationPage from '../pages/CommunityRegistrationPage';
import PlatformAccessPage from '../pages/PlatformAccessPage';

// Importez vos composants existants
// import Dashboard from '../pages/Dashboard';
// import OtherProtectedPage from '../pages/OtherProtectedPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Route d'inscription communauté */}
      <Route 
        path="/community-registration" 
        element={<CommunityRegistrationPage />} 
      />
      
      {/* Route d'accès plateforme */}
      <Route 
        path="/platform-access" 
        element={
          <ProtectedRoute requiresCommunity={true}>
            <PlatformAccessPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Route dashboard - protection complète */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute 
            requiresCommunity={true} 
            requiresPlatform={true} 
            requiresLegalAcceptance={true}
          >
            {/* <Dashboard /> */}
            <DashboardPlaceholder />
          </ProtectedRoute>
        } 
      />
      
      {/* Autres routes protégées */}
      <Route 
        path="/strategies" 
        element={
          <ProtectedRoute 
            requiresCommunity={true} 
            requiresPlatform={true} 
            requiresLegalAcceptance={true}
          >
            {/* <StrategiesPage /> */}
            <ProtectedPagePlaceholder title="Stratégies" />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/rewards" 
        element={
          <ProtectedRoute 
            requiresCommunity={true} 
            requiresPlatform={true} 
            requiresLegalAcceptance={true}
          >
            {/* <RewardsPage /> */}
            <ProtectedPagePlaceholder title="Récompenses" />
          </ProtectedRoute>
        } 
      />
      
      {/* Route par défaut */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Route 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

// =============================================
// COMPOSANTS PLACEHOLDER (à remplacer par vos vrais composants)
// =============================================

const DashboardPlaceholder: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <Box minH="100vh" bg="gray.50" p={8}>
      <VStack spacing={6} maxW="4xl" mx="auto">
        <Box bg="white" p={8} borderRadius="xl" shadow="lg" w="full">
          <Text fontSize="3xl" fontWeight="bold" color="gray.800" mb={4}>
            🎉 Bienvenue sur CryptocaVault !
          </Text>
          <Text color="gray.600" mb={6}>
            Félicitations ! Vous avez accès complet à la plateforme.
          </Text>
          
          <UserStatusIndicator />
          
          <Box mt={6} p={4} bg="blue.50" borderRadius="lg">
            <Text fontSize="sm" color="blue.800" fontWeight="medium" mb={2}>
              Wallet connecté :
            </Text>
            <Text fontSize="sm" fontFamily="mono" color="blue.600">
              {user?.walletAddress}
            </Text>
          </Box>
          
          <Text fontSize="sm" color="gray.500" mt={4}>
            Remplacez ce composant par votre vraie page Dashboard.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

const ProtectedPagePlaceholder: React.FC<{ title: string }> = ({ title }) => {
  return (
    <Box minH="100vh" bg="gray.50" p={8}>
      <VStack spacing={6} maxW="4xl" mx="auto">
        <Box bg="white" p={8} borderRadius="xl" shadow="lg" w="full">
          <Text fontSize="2xl" fontWeight="bold" color="gray.800" mb={4}>
            {title}
          </Text>
          <Text color="gray.600" mb={6}>
            Cette page est protégée et nécessite une autorisation complète.
          </Text>
          
          <UserStatusIndicator />
          
          <Text fontSize="sm" color="gray.500" mt={4}>
            Remplacez ce composant par votre vraie page {title}.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

const NotFoundPage: React.FC = () => {
  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={4} textAlign="center">
        <Text fontSize="6xl" fontWeight="bold" color="gray.400">404</Text>
        <Text fontSize="xl" color="gray.600">Page non trouvée</Text>
        <Button as="a" href="/" colorScheme="blue">
          Retour à l'accueil
        </Button>
      </VStack>
    </Box>
  );
};

// =============================================
// HOOK POUR NAVIGATION INTELLIGENTE
// =============================================

export const useSmartNavigation = () => {
  const { user, isAuthenticated } = useAuth();
  const [userStatus, setUserStatus] = useState<UserAccessStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!isAuthenticated || !user?.walletAddress) return;

      try {
        const status = await EnhancedAuthService.getCompleteUserAccessStatus(user.walletAddress);
        setUserStatus(status);
      } catch (error) {
        console.error('Erreur récupération statut navigation:', error);
      }
    };

    fetchStatus();
  }, [isAuthenticated, user?.walletAddress]);

  const getRecommendedPath = (): string => {
    if (!isAuthenticated) return '/login';
    if (!userStatus) return '/login';

    switch (userStatus.accessLevel) {
      case 'none':
        return userStatus.isPreApproved ? '/community-registration' : '/login';
      case 'community':
        return '/platform-access';
      case 'platform':
        return '/platform-access';
      case 'full':
        return '/dashboard';
      default:
        return '/login';
    }
  };

  const canAccessPath = (path: string): boolean => {
    if (!userStatus) return false;

    const protectedPaths = {
      '/dashboard': 'full',
      '/strategies': 'full',
      '/rewards': 'full',
      '/platform-access': 'community',
      '/community-registration': 'none'
    };

    const requiredLevel = protectedPaths[path as keyof typeof protectedPaths];
    if (!requiredLevel) return true; // Chemin public

    const levelHierarchy = {
      'none': 0,
      'community': 1,
      'platform': 2,
      'full': 3
    };

    const userLevel = levelHierarchy[userStatus.accessLevel];
    const pathLevel = levelHierarchy[requiredLevel as keyof typeof levelHierarchy];

    return userLevel >= pathLevel;
  };

  return {
    userStatus,
    getRecommendedPath,
    canAccessPath,
    isReady: !!userStatus
  };
};

// Export par défaut
export default ProtectedRoute;