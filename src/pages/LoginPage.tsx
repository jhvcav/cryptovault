// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Spinner,
  Container,
  useColorModeValue,
  useToast,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

// Déclaration TypeScript pour window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)');

  // Rediriger si déjà authentifié
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <Box
        minH="100vh"
        background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={6}>
          <Box
            p={6}
            bg="white"
            rounded="full"
            shadow="2xl"
            _hover={{ transform: 'scale(1.05)' }}
            transition="transform 0.3s ease"
          >
            <Spinner size="xl" color="blue.500" thickness="4px" />
          </Box>
          <Text color="white" fontSize="xl" fontWeight="medium">
            Vérification de l'authentification...
          </Text>
        </VStack>
      </Box>
    );
  }

  // Fonction pour connecter MetaMask et récupérer l'adresse
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask non détecté",
        description: "Veuillez installer MetaMask pour utiliser cette fonctionnalité.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsConnectingMetaMask(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        const metamaskAddress = accounts[0];
        console.log('🦊 Adresse MetaMask récupérée:', metamaskAddress);
        
        setWalletAddress(metamaskAddress);
        toast({
          title: "Wallet connecté",
          description: "Adresse MetaMask récupérée avec succès !",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de la connexion MetaMask:', error);
      
      let errorMessage = "Erreur lors de la connexion à MetaMask";
      if (error.code === 4001) {
        errorMessage = "Connexion refusée par l'utilisateur";
      }
      
      toast({
        title: "Erreur MetaMask",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsConnectingMetaMask(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!walletAddress.trim()) {
      setError('Veuillez saisir votre adresse wallet');
      return;
    }

    const trimmedAddress = walletAddress.trim();
    
    if (!trimmedAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
      setError('Format d\'adresse wallet invalide');
      return;
    }

    console.log('🚀 Tentative de connexion avec l\'adresse:', trimmedAddress);
    setIsSubmitting(true);

    try {
      const success = await login(trimmedAddress);
      
      if (!success) {
        setError('Vous n\'êtes pas autorisé à accéder à cette plateforme. Contactez votre Leader.');
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      minH="100vh"
      position="relative"
      overflow="hidden"
      background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    >
      {/* Éléments décoratifs de fond */}
      <Box
        position="absolute"
        top="10%"
        left="10%"
        w="200px"
        h="200px"
        bg="rgba(255, 255, 255, 0.1)"
        rounded="full"
        filter="blur(40px)"
        _hover={{ transform: 'translateY(-5px)' }}
        transition="transform 6s ease-in-out"
      />
      <Box
        position="absolute"
        bottom="10%"
        right="15%"
        w="300px"
        h="300px"
        bg="rgba(255, 255, 255, 0.05)"
        rounded="full"
        filter="blur(60px)"
        _hover={{ transform: 'translateY(5px)' }}
        transition="transform 8s ease-in-out"
      />
      
      <Flex
        minH="100vh"
        align="center"
        justify="center"
        p={4}
        position="relative"
        zIndex={1}
      >
        <Container maxW="lg">
          {/* Carte principale */}
          <Box
            bg={cardBg}
            backdropFilter="blur(20px)"
            border="1px solid rgba(255, 255, 255, 0.2)"
            borderRadius="3xl"
            shadow="2xl"
            p={10}
            position="relative"
            overflow="hidden"
          >
            {/* Bouton MetaMask flottant */}
            <Button
              position="absolute"
              top={6}
              right={6}
              size="md"
              bg="linear-gradient(135deg, #f6851b 0%, #e2761b 100%)"
              color="white"
              _hover={{
                transform: 'translateY(-2px)',
                shadow: 'lg',
                bg: 'linear-gradient(135deg, #e2761b 0%, #d1661b 100%)',
              }}
              _active={{ transform: 'translateY(0)' }}
              onClick={connectMetaMask}
              isLoading={isConnectingMetaMask}
              loadingText="Connexion..."
              leftIcon={<Text fontSize="20px">🦊</Text>}
              borderRadius="xl"
              px={6}
              transition="all 0.3s ease"
            >
              MetaMask
            </Button>

            <VStack spacing={8} align="stretch" pt={4}>
              {/* En-tête avec logo et titre */}
              <VStack spacing={4}>
                <Box
                  p={6}
                  bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  rounded="full"
                  shadow="xl"
                  _hover={{ transform: 'scale(1.05)' }}
                  transition="transform 0.3s ease"
                  w={20}
                  h={20}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="3xl" fontWeight="bold" color="white">CV</Text>
                </Box>
                
                <VStack spacing={2}>
                  <Heading
                    size="2xl"
                    bgGradient="linear(to-r, #667eea, #764ba2)"
                    bgClip="text"
                    textAlign="center"
                    fontWeight="800"
                  >
                    CryptoVault
                  </Heading>
                  <Text
                    fontSize="lg"
                    color="gray.600"
                    textAlign="center"
                    fontWeight="500"
                  >
                    Plateforme d'investissement sécurisée
                  </Text>
                </VStack>
              </VStack>

              {/* Section de sécurité */}
              <HStack
                spacing={4}
                p={4}
                bg="rgba(102, 126, 234, 0.1)"
                borderRadius="xl"
                border="1px solid rgba(102, 126, 234, 0.2)"
              >
                <Text fontSize="24px" color="blue.500">🛡️</Text>
                <VStack spacing={0} align="start" flex={1}>
                  <Text fontWeight="600" color="blue.700" fontSize="sm">
                    Authentification sécurisée
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    Seuls les wallets autorisés peuvent accéder
                  </Text>
                </VStack>
              </HStack>

              {/* Formulaire de connexion */}
              <Box as="form" onSubmit={handleSubmit}>
                <VStack spacing={6}>
                  <FormControl isRequired>
                    <FormLabel
                      color="gray.700"
                      fontWeight="600"
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <Text fontSize="18px" color="blue.500">💼</Text>
                      Adresse de votre Wallet
                    </FormLabel>
                    <Input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="0x742d35Cc6634C0532925a3b8D404dEBC00000000"
                      bg="white"
                      border="2px solid"
                      borderColor="gray.200"
                      borderRadius="xl"
                      px={4}
                      py={3}
                      fontSize="md"
                      _hover={{ borderColor: 'blue.300' }}
                      _focus={{ 
                        borderColor: 'blue.500', 
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' 
                      }}
                      transition="all 0.3s ease"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    size="lg"
                    width="full"
                    bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    color="white"
                    _hover={{
                      transform: 'translateY(-2px)',
                      shadow: 'xl',
                      bg: 'linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%)',
                    }}
                    _active={{ transform: 'translateY(0)' }}
                    isLoading={isSubmitting}
                    loadingText="Connexion en cours..."
                    disabled={isSubmitting}
                    borderRadius="xl"
                    py={6}
                    fontSize="lg"
                    fontWeight="600"
                    transition="all 0.3s ease"
                  >
                    Se connecter à la plateforme
                  </Button>

                  {/* Message d'erreur */}
                  {error && (
                    <Alert
                      status="error"
                      borderRadius="xl"
                      bg="red.50"
                      border="1px solid"
                      borderColor="red.200"
                    >
                      <AlertIcon color="red.500" />
                      <Text color="red.700" fontSize="sm" fontWeight="500">
                        {error}
                      </Text>
                    </Alert>
                  )}
                </VStack>
              </Box>

              <Divider borderColor="gray.300" />

              {/* Instructions et aide */}
              <VStack spacing={4}>
                <Box
                  p={4}
                  bg="blue.50"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="blue.200"
                  w="full"
                >
                  <HStack spacing={3}>
                    <Text fontSize="2xl">💡</Text>
                    <VStack spacing={1} align="start" flex={1}>
                      <Text fontSize="sm" fontWeight="600" color="blue.800">
                        Accès restreint
                      </Text>
                      <Text fontSize="xs" color="blue.700" lineHeight={1.4}>
                        Seules les adresses wallet préalablement autorisées par l'administrateur peuvent accéder à la plateforme.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box
                  p={4}
                  bg="orange.50"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="orange.200"
                  w="full"
                >
                  <HStack spacing={3}>
                    <Text fontSize="2xl">🦊</Text>
                    <VStack spacing={1} align="start" flex={1}>
                      <Text fontSize="sm" fontWeight="600" color="orange.800">
                        Connexion rapide
                      </Text>
                      <Text fontSize="xs" color="orange.700" lineHeight={1.4}>
                        Cliquez sur le bouton MetaMask en haut à droite pour récupérer automatiquement votre adresse wallet.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </VStack>
            </VStack>
          </Box>
        </Container>
      </Flex>
    </Box>
  );
};

export default LoginPage;