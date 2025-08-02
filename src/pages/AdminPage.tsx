// VERSION COMPLÈTE CORRIGÉE de AdminPage.tsx

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
import AdminRegistrationsPage from './AdminRegistrationsPage';
import NFTImageManager from '../components/NFTImageManager';
import NFTContractManager from '../components/NFTContractManager';

const AdminPage: React.FC = () => {
  const { isOwner } = useOwner();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [nftSubTab, setNftSubTab] = useState(0);
  const [usersSubTab, setUsersSubTab] = useState(0);

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = 'transparent';

  // Rediriger si pas authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Afficher une erreur si pas owner
  if (!isOwner) {
    return (
      <Box p={4} w="100%" maxW="100vw" overflowX="auto">
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
    <Box p={4} w="100%" maxW="100vw" overflowX="auto">
      <VStack spacing={6} align="stretch" w="100%">
        {/* En-tête Admin */}
        <Box>
          <HStack spacing={4} align="center" mb={2} flexWrap="wrap">
            <Heading size={{ base: "lg", md: "xl" }} color="blue.500">
              🛠️ Administration
            </Heading>
            <Badge colorScheme="yellow" variant="solid" px={3} py={1}>
              👑 OWNER
            </Badge>
          </HStack>
          <Text color="white" fontSize={{ base: "sm", md: "md" }}>
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
          w="100%"
        >
          <Tabs 
            index={activeTab} 
            onChange={setActiveTab}
            variant="enclosed"
            colorScheme="black"
          >
            <TabList 
              bg="black.50" 
              borderBottom="1px" 
              borderColor={borderColor}
              overflowX="auto"
              overflowY="hidden"
              whiteSpace="nowrap"
            >
              <Tab 
                fontWeight="medium"
                fontSize={{ base: "xs", md: "sm" }}
                minW="max-content"
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
                fontSize={{ base: "xs", md: "sm" }}
                minW="max-content"
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
                fontSize={{ base: "xs", md: "sm" }}
                minW="max-content"
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
                fontSize={{ base: "xs", md: "sm" }}
                minW="max-content"
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
                fontSize={{ base: "xs", md: "sm" }}
                minW="max-content"
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
                fontSize={{ base: "xs", md: "sm" }}
                minW="max-content"
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
              {/* Onglet 1: Dashboard Admin */}
              <TabPanel p={0}>
                <Box overflowX="auto" w="100%">
                  <AdminDashboard />
                </Box>
              </TabPanel>

              {/* Onglet 2: Gestion des utilisateurs avec sous-onglets */}
              <TabPanel p={0}>
                <Box>
                  <Tabs
                    index={usersSubTab}
                    onChange={setUsersSubTab}
                    variant="soft-rounded"
                    colorScheme="blue"
                  >
                    <TabList bg="blue.50" p={4} borderRadius="lg" mb={4}>
                      <Tab
                        mr={2}
                        _selected={{
                          color: 'white',
                          bg: 'blue.500',
                          shadow: 'md'
                        }}
                      >
                        👤 Utilisateurs Autorisés
                      </Tab>
                      <Tab
                        _selected={{
                          color: 'white',
                          bg: 'blue.500',
                          shadow: 'md'
                        }}
                      >
                        📝 Demandes d'Inscription
                      </Tab>
                    </TabList>

                    <TabPanels>
                      <TabPanel p={0}>
                        <UsersManagement />
                      </TabPanel>
                      <TabPanel p={0}>
                        <AdminRegistrationsPage />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
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
                      <TabPanel p={0}>
                        <NFTImageManager />
                      </TabPanel>
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
          w="100%"
        >
          <Text fontWeight="bold" mb={2}>ℹ️ Informations:</Text>
          
          <VStack align="start" spacing={1}>
            <Text fontSize={{ base: "xs", md: "sm" }}>
              • Utilisateur connecté : {user?.firstName} {user?.lastName}
            </Text>
            
            <Text fontSize={{ base: "xs", md: "sm" }}>
              • Wallet : {user?.walletAddress}
            </Text>
            
            <Text fontSize={{ base: "xs", md: "sm" }}>
              • Statut Owner : {isOwner ? '✅ Confirmé' : '❌ Non autorisé'}
            </Text>
            
            <VStack align="start" spacing={1} w="100%">
              <HStack spacing={1} align="center" flexWrap="wrap">
                <Text fontSize={{ base: "xs", md: "sm" }}>• Contrat CryptoVault :</Text>
                <Text
                  as="a"
                  href="https://bscscan.com/address/0x719fd9F511DDc561D03801161742D84ECb9445e9"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="cyan.300"
                  textDecoration="underline"
                  _hover={{
                    color: "cyan.100",
                    textDecoration: "none",
                    bg: "whiteAlpha.200",
                    px: 2,
                    py: 1,
                    borderRadius: "md",
                    transition: "all 0.2s"
                  }}
                  fontFamily="mono"
                  fontSize={{ base: "2xs", md: "xs" }}
                  fontWeight="medium"
                  wordBreak="break-all"
                >
                  0x719fd9F511DDc561D03801161742D84ECb9445e9 🔗
                </Text>
              </HStack>
              
              <HStack spacing={1} align="center" flexWrap="wrap">
                <Text fontSize={{ base: "xs", md: "sm" }}>• Contrat NFT :</Text>
                <Text
                  as="a"
                  href="https://bscscan.com/address/0x4B834aa2C64c7030d7F2920E760469354f72686C"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="orange.300"
                  textDecoration="underline"
                  _hover={{
                    color: "orange.100",
                    textDecoration: "none",
                    bg: "whiteAlpha.200",
                    px: 2,
                    py: 1,
                    borderRadius: "md",
                    transition: "all 0.2s"
                  }}
                  fontFamily="mono"
                  fontSize={{ base: "2xs", md: "xs" }}
                  fontWeight="medium"
                  wordBreak="break-all"
                >
                  0x4B834aa2C64c7030d7F2920E760469354f72686C 🔗
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default AdminPage;