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
  Text,
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
import PlansManagement from './PlansManagement';
import NFTImageManager from '../components/NFTImageManager'; // Renommé
import NFTContractManager from '../components/NFTContractManager'; // Nouveau composant

const AdminPage: React.FC = () => {
  const { isOwner } = useOwner();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [nftSubTab, setNftSubTab] = useState(0);

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
          <Alert 
            status="error" 
            borderRadius="lg"
            bg="red.50"
            borderColor="red.300"
            border="2px solid"
          >
            <AlertIcon color="red.500" />
            <Box>
              <Text fontWeight="bold" color="red.700">
                Accès refusé
              </Text>
              <Text color="red.600" mt={1}>
                Seul le propriétaire de la plateforme peut accéder à cette section.
              </Text>
            </Box>
          </Alert>
          
          <Box 
            textAlign="center" 
            p={6} 
            bg="gray.100"
            borderRadius="lg"
            border="2px solid"
            borderColor="gray.300"
          >
            <Heading size="md" color="gray.700" mb={2}>
              🔒 Zone Administrateur
            </Heading>
            <Text color="gray.600">
              Cette section est réservée au propriétaire de la plateforme.
            </Text>
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
            <Heading size="xl" color="blue.500">
              🛠️ Administration
            </Heading>
            <Badge colorScheme="yellow" variant="solid" px={3} py={1}>
              👑 OWNER
            </Badge>
          </HStack>
          <Text color="white">
            Bienvenue {user?.firstName} ! Vous avez accès à toutes les fonctionnalités d'administration.
          </Text>
        </Box>

        {/* Onglets Admin principaux */}
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
                  color: 'blue.600', 
                  borderColor: 'blue.500',
                  borderBottomColor: 'white',
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
                  color: 'orange.600', 
                  borderColor: 'orange.500',
                  borderBottomColor: 'white',
                  bg: 'black'
                }}
              >
                🎨 Gestion NFT
              </Tab>
              <Tab 
                fontWeight="medium"
                _selected={{ 
                  color: 'white', 
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
                  color: 'white', 
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

              {/* Onglet 4: Gestion NFT avec sous-onglets */}
              <TabPanel p={0}>
                <Box>
                  <Tabs
                    index={nftSubTab}
                    onChange={setNftSubTab}
                    variant="soft-rounded"
                    colorScheme="orange"
                  >
                    <TabList bg="orange.50" p={4} borderRadius="lg" mb={4}>
                      <Tab
                        mr={2}
                        _selected={{
                          color: 'white',
                          bg: 'orange.500',
                          shadow: 'md'
                        }}
                      >
                        🖼️ Création d'Images NFT
                      </Tab>
                      <Tab
                        _selected={{
                          color: 'white',
                          bg: 'orange.500',
                          shadow: 'md'
                        }}
                      >
                        ⚙️ Gestion Smart Contract
                      </Tab>
                    </TabList>

                    <TabPanels>
                      {/* Sous-onglet 1: Création d'images */}
                      <TabPanel p={0}>
                        <NFTImageManager />
                      </TabPanel>

                      {/* Sous-onglet 2: Gestion du contrat */}
                      <TabPanel p={0}>
                        <NFTContractManager />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              </TabPanel>

              {/* Onglet 5: Monitoring Wallet */}
              <TabPanel p={0}>
                <WalletMonitoring />
              </TabPanel>

              {/* Onglet 6: Monitoring Contrat */}
              <TabPanel p={0}>
                <ContractMonitoring />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>

        {/* Informations de debug */}
        <Box 
          bgGradient="linear(135deg, gray.800 0%, gray.900 100%)"
          p={4} 
          borderRadius="lg" 
          border="1px solid" 
          borderColor="gray.600"
          fontSize="sm"
          color="white"
          shadow="lg"
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
          <br />
          • Contrat NFT: 0xe7778688E645d0795c71837C2d44e08A1B6f6c0A
          <br />
        </Box>
      </VStack>
    </Box>
  );
};

export default AdminPage;