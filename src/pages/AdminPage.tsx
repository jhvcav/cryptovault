// src/pages/AdminPage.tsx
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  VStack,
  Alert,
  AlertIcon,
  Badge,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useOwner } from '../hooks/useOwner';
import { useAuth } from '../contexts/AuthContext';
import UsersManagement from './UsersManagement';
import AdminDashboard from './AdminDashboard';
import WalletMonitoring from './WalletMonitoring';
import ContractMonitoring from './ContractMonitoring';
import PlansManagement from './PlansManagement'; // Nouveau import

const AdminPage: React.FC = () => {
  const { isOwner } = useOwner();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = 'transparent';

  // Rediriger si pas authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Afficher une erreur si pas owner
  if (!isOwner) {
    return (
      <Box p={6} maxW="800px" mx="auto">
        <VStack spacing={6}>
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <Box>
              <strong>Accès refusé</strong>
              <br />
              Seul le propriétaire de la plateforme peut accéder à cette section.
            </Box>
          </Alert>
          
          <Box textAlign="center" p={6} bg="gray.50" borderRadius="lg">
            <Heading size="md" color="gray.600" mb={2}>
              🔒 Zone Administrateur
            </Heading>
            <p>Cette section est réservée au propriétaire de la plateforme.</p>
          </Box>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="1600px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* En-tête Admin */}
        <Box>
          <HStack spacing={4} align="center" mb={2}>
            <Heading size="xl" color="blue.600">
              🛠️ Administration
            </Heading>
            <Badge colorScheme="yellow" variant="solid" px={3} py={1}>
              👑 OWNER
            </Badge>
          </HStack>
          <p>Bienvenue {user?.firstName} ! Vous avez accès à toutes les fonctionnalités d'administration.</p>
        </Box>

        {/* Onglets Admin */}
        <Box
          bg={bgColor}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          overflow="hidden"
        >
          <Tabs 
            index={activeTab} 
            onChange={setActiveTab}
            variant="enclosed"
            colorScheme="black"
          >
            <TabList bg="black.50" borderBottom="1px" borderColor={borderColor}>
              <Tab 
                fontWeight="medium"
                _selected={{ 
                  color: 'blue.600', 
                  borderColor: 'blue.500',
                  borderBottomColor: 'white',
                  bg: 'black'
                }}
              >
                📊 Dashboard Principal
              </Tab>
              <Tab 
                fontWeight="medium"
                _selected={{ 
                  color: 'white.600', 
                  borderColor: 'blue.500',
                  borderBottomColor: 'red',
                  bg: 'black'
                }}
              >
                👥 Gestion des Utilisateurs
              </Tab>
              <Tab 
                fontWeight="medium"
                _selected={{ 
                  color: 'purple.600', 
                  borderColor: 'purple.500',
                  borderBottomColor: 'white',
                  bg: 'black'
                }}
              >
                📋 Gestion des Plans
              </Tab>
              <Tab 
                fontWeight="medium"
                _selected={{ 
                  color: 'green.600', 
                  borderColor: 'green.500',
                  borderBottomColor: 'white',
                  bg: 'black'
                }}
              >
                💰 Monitoring Wallet
              </Tab>
              <Tab 
                fontWeight="medium"
                _selected={{ 
                  color: 'green.600', 
                  borderColor: 'green.500',
                  borderBottomColor: 'white',
                  bg: 'black'
                }}
              >
                📝 Monitoring SmartContrat
              </Tab>
            </TabList>

            <TabPanels>
              {/* Onglet 1: Dashboard Admin existant */}
              <TabPanel p={0}>
                <AdminDashboard />
              </TabPanel>

              {/* Onglet 2: Gestion des utilisateurs */}
              <TabPanel p={0}>
                <UsersManagement />
              </TabPanel>

              {/* Onglet 3: Gestion des Plans */}
              <TabPanel p={0}>
                <PlansManagement />
              </TabPanel>

              {/* Onglet 4: Monitoring Wallet */}
              <TabPanel p={0}>
                <WalletMonitoring />
              </TabPanel>

              {/* Onglet 5: Monitoring Contrat */}
              <TabPanel p={0}>
                <ContractMonitoring />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>

        {/* Informations de debug */}
        <Box 
          bg="black.50" 
          p={4} 
          borderRadius="lg" 
          border="1px" 
          borderColor="black.200"
          fontSize="sm"
        >
          <strong>ℹ️ Informations:</strong>
          <br />
          • Utilisateur connecté : {user?.firstName} {user?.lastName}
          <br />
          • Wallet : {user?.walletAddress}
          <br />
          • Statut Owner : {isOwner ? '✅ Confirmé' : '❌ Non autorisé'}
          <br />
          • Contrat CryptoVault: 0x719fd9F511DDc561D03801161742D84ECb9445e9
        </Box>
      </VStack>
    </Box>
  );
};

export default AdminPage;