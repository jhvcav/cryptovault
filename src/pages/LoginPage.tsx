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
  useBreakpointValue,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { detectMobileAndMetaMask } from '../components/utils/mobileDetection';
import { useNavigate } from 'react-router-dom';


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

  // Responsive values
  const containerMaxW = useBreakpointValue({ base: 'sm', md: 'lg' });
  const cardPadding = useBreakpointValue({ base: 6, md: 10 });
  const headingSize = useBreakpointValue({ base: 'xl', md: '2xl' });
  const logoSize = useBreakpointValue({ base: 16, md: 20 });
  const logoFontSize = useBreakpointValue({ base: '2xl', md: '4xl' });
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const metaMaskButtonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const metaMaskButtonText = useBreakpointValue({ base: '🦊', md: 'Connect MetaMask' });
  const showMetaMaskText = useBreakpointValue({ base: false, md: true });

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
        px={4}
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
          <Text 
            color="white" 
            fontSize={{ base: 'lg', md: 'xl' }} 
            fontWeight="medium"
            textAlign="center"
            px={4}
          >
            Vérification de l'authentification...
          </Text>
        </VStack>
      </Box>
    );
  }

  // Fonction pour connecter MetaMask et récupérer l'adresse
  const connectMetaMask = async () => {
  const mobileInfo = detectMobileAndMetaMask();
  
  console.log('🦊 Tentative MetaMask sur:', mobileInfo);
  
  if (!window.ethereum) {
    if (mobileInfo.isMetaMaskBrowser) {
      // On est dans MetaMask mais ethereum pas encore injecté
      toast({
        title: "Chargement...",
        description: "MetaMask se charge, veuillez patienter quelques secondes.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      
      // Attendre l'injection avec timeout
      let attempts = 0;
      const maxAttempts = 10;
      
      setIsConnectingMetaMask(true);
      
      const waitForEthereum = setInterval(() => {
        attempts++;
        console.log(`🔄 Tentative ${attempts}/${maxAttempts} pour détecter ethereum...`);
        
        if (window.ethereum) {
          clearInterval(waitForEthereum);
          console.log('✅ window.ethereum détecté !');
          // Relancer la fonction maintenant qu'ethereum est disponible
          connectMetaMask();
          return;
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(waitForEthereum);
          setIsConnectingMetaMask(false);
          toast({
            title: "Erreur MetaMask",
            description: "Impossible de détecter MetaMask. Essayez de rafraîchir la page.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }, 500);
      
      return;
    }
    
    toast({
      title: "MetaMask non détecté",
      description: "Veuillez installer MetaMask ou utiliser le navigateur MetaMask.",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
    return;
  }

  setIsConnectingMetaMask(true);
  try {
    // Méthode robuste pour mobile
    let accounts;
    
    try {
      // D'abord vérifier les comptes déjà connectés
      accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (!accounts || accounts.length === 0) {
        // Si pas de comptes, demander la connexion
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Connexion refusée par l\'utilisateur');
      }
      throw error;
    }

    if (accounts && accounts.length > 0) {
      const metamaskAddress = accounts[0];
      console.log('🦊 Adresse récupérée:', metamaskAddress);
      
      setWalletAddress(metamaskAddress);
      
      // Stocker pour utilisation future
      sessionStorage.setItem('lastConnectedWallet', metamaskAddress);
      
      toast({
        title: "Wallet connecté !",
        description: `${metamaskAddress.substring(0, 6)}...${metamaskAddress.substring(metamaskAddress.length - 4)}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  } catch (error: any) {
    console.error('Erreur MetaMask:', error);
    
    let errorMessage = "Erreur lors de la connexion à MetaMask";
    if (error.message) {
      errorMessage = error.message;
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

// Fonction pour détecter si on est sur mobile et dans MetaMask
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const mobileInfo = detectMobileAndMetaMask();
  console.log('🚀 Soumission formulaire sur:', mobileInfo);
  
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

  console.log('✅ Connexion avec adresse:', trimmedAddress);
  setIsSubmitting(true);

  try {
    const success = await login(trimmedAddress);
    console.log('✅ Résultat login:', success);
    
    if (!success) {
      setError('Vous n\'êtes pas autorisé à accéder à cette plateforme. Contactez votre Leader.');
    } else {
      console.log('🎉 Connexion réussie ! Redirection vers dashboard...');
    }
  } catch (error) {
    console.error('❌ Erreur login:', error);
    setError('Erreur de connexion. Veuillez réessayer.');
  } finally {
    setIsSubmitting(false);
  }
};

 React.useEffect(() => {
  const isMetaMaskBrowser = /MetaMask/i.test(navigator.userAgent);
  
  if (isMetaMaskBrowser) {
    console.log('📱 Navigateur MetaMask détecté - Attente initialisation...');
    
    // Attendre plus longtemps pour laisser MetaMask s'initialiser
    const timer = setTimeout(() => {
      console.log('🔄 Tentative auto-connexion après délai...');
      if (window.ethereum && !walletAddress) {
        connectMetaMask();
      }
    }, 4000); // 4 secondes au lieu de 2
    
    return () => clearTimeout(timer);
  }
}, []);

const navigate = useNavigate();

  return (
    <Box
      minH="100vh"
      position="relative"
      overflow="hidden"
      background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    >
      {/* Éléments décoratifs de fond - masqués sur mobile pour améliorer les performances */}
      <Box
        position="absolute"
        top="10%"
        left="10%"
        w={{ base: "100px", md: "200px" }}
        h={{ base: "100px", md: "200px" }}
        bg="rgba(255, 255, 255, 0.1)"
        rounded="full"
        filter="blur(40px)"
        _hover={{ transform: 'translateY(-5px)' }}
        transition="transform 6s ease-in-out"
        display={{ base: "none", md: "block" }}
      />
      <Box
        position="absolute"
        bottom="10%"
        right="15%"
        w={{ base: "150px", md: "300px" }}
        h={{ base: "150px", md: "300px" }}
        bg="rgba(255, 255, 255, 0.05)"
        rounded="full"
        filter="blur(60px)"
        _hover={{ transform: 'translateY(5px)' }}
        transition="transform 8s ease-in-out"
        display={{ base: "none", md: "block" }}
      />
      
      <Flex
        minH="100vh"
        align="center"
        justify="center"
        p={{ base: 4, md: 4 }}
        position="relative"
        zIndex={1}
      >
        <Container maxW={containerMaxW} w="full">
          {/* Carte principale */}
          <Box
            bg={cardBg}
            backdropFilter="blur(20px)"
            border="1px solid rgba(255, 255, 255, 0.2)"
            borderRadius={{ base: '2xl', md: '3xl' }}
            shadow="2xl"
            p={cardPadding}
            position="relative"
            overflow="hidden"
            w="full"
          >
            {/* Bouton MetaMask flottant - repositionné pour mobile */}
            <Button
              position="absolute"
              top={{ base: 4, md: 6 }}
              right={{ base: 4, md: 6 }}
              size={metaMaskButtonSize}
              bg="linear-gradient(145deg, #ff7a00, #e85d00)"
              color="white"
              boxShadow="
                0 8px 16px rgba(232, 93, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                inset 0 -1px 0 rgba(0, 0, 0, 0.1)
              "
              border="1px solid rgba(0, 0, 0, 0.1)"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: `
                  0 12px 24px rgba(232, 93, 0, 0.4),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `,
                bg: "linear-gradient(145deg, #ff8500, #f06800)",
              }}
              _active={{
                transform: 'translateY(1px)',
                boxShadow: `
                  0 4px 8px rgba(232, 93, 0, 0.3),
                  inset 0 2px 4px rgba(0, 0, 0, 0.2)
                `,
                bg: "linear-gradient(145deg, #e85d00, #d15000)",
              }}
              onClick={connectMetaMask}
              isLoading={isConnectingMetaMask}
              loadingText={showMetaMaskText ? "Connexion..." : "..."}
              leftIcon={
                <Text 
                  fontSize={{ base: "16px", md: "20px" }}
                  filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))"
                >
                  🦊
                </Text>
              }
              borderRadius="lg"
              px={{ base: 2, md: 2 }}
              py={3}
              fontWeight="700"
              fontSize={{ base: "xs", md: "md" }}
              textShadow="0 1px 2px rgba(0,0,0,0.3)"
              transition="all 0.2s ease"
              minW={{ base: "60px", md: "110px" }}
              mb={4}
            >
              {showMetaMaskText ? "MetaMask" : ""}
            </Button>

            {/* Bouton inscription RMR flottant - repositionné pour mobile */}
            <Button
              position="absolute"
              top={{ base: 4, md: 6 }}
              left={{ base: 4, md: 6 }}
              size={metaMaskButtonSize}
              bg="linear-gradient(145deg,rgb(27, 46, 107),rgb(85, 50, 26))"
              color="white"
              boxShadow="
                0 8px 16px rgba(232, 93, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                inset 0 -1px 0 rgba(0, 0, 0, 0.1)
              "
              border="1px solid rgba(0, 0, 0, 0.1)"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: `
                  0 12px 24px rgba(232, 93, 0, 0.4),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `,
                bg: "linear-gradient(145deg,rgb(146, 37, 110),rgb(71, 9, 56))",
              }}
              _active={{
                transform: 'translateY(1px)',
                boxShadow: `
                  0 4px 8px rgba(232, 93, 0, 0.3),
                  inset 0 2px 4px rgba(0, 0, 0, 0.2)
                `,
                bg: "linear-gradient(145deg, #e85d00, #d15000)",
              }}
              onClick={() => navigate('/community-registrations')}
              leftIcon={
                <Text 
                  fontSize={{ base: "16px", md: "20px" }}
                  filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))"
                >
                </Text>
              }
              borderRadius="lg"
              px={{ base: 2, md: 2 }}
              py={3}
              fontWeight="700"
              fontSize={{ base: "xs", md: "md" }}
              textShadow="0 1px 2px rgba(0,0,0,0.3)"
              transition="all 0.2s ease"
              minW={{ base: "60px", md: "110px" }}
              mb={4}
            >
              {showMetaMaskText ? "Inscription" : ""}
            </Button>

            <VStack spacing={{ base: 6, md: 8 }} align="stretch" pt={4}>
              {/* En-tête avec logo et titre */}
              <VStack spacing={0}>
                <Box
                  mt={{ base: 6, md: 9 }}
                  p={{ base: 4, md: 6 }}
                  bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  rounded="full"
                  shadow="xl"
                  _hover={{ transform: 'scale(1.05)' }}
                  transition="transform 0.3s ease"
                  w={logoSize}
                  h={logoSize}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={logoFontSize} fontWeight="bold" color="white">CV</Text>
                </Box>
                
                <VStack spacing={1}>
                  <Heading
                    mt={{ base: 3, md: 4 }}
                    size={headingSize}
                    bgGradient="linear(to-r, #667eea, #764ba2)"
                    bgClip="text"
                    textAlign="center"
                    fontWeight="800"
                    lineHeight="1.2"
                  >
                    CryptocaVault
                  </Heading>
                  <Text
                    mt={{ base: 2, md: 3 }}
                    fontSize={{ base: "sm", md: "lg" }}
                    bgGradient="linear(to-r, #667eea, #764ba2)"
                    bgClip="text"
                    textAlign="center"
                    fontWeight="500"
                    px={{ base: 2, md: 0 }}
                  >
                    Plateforme communautaire de récompense sécurisée
                  </Text>
                </VStack>
              </VStack>

              {/* Section de sécurité */}
              <HStack
                spacing={{ base: 3, md: 4 }}
                p={{ base: 3, md: 4 }}
                bg="rgba(102, 126, 234, 0.1)"
                borderRadius="xl"
                border="1px solid rgba(102, 126, 234, 0.2)"
              >
                <Text fontSize={{ base: "20px", md: "24px" }} color="blue.500">🛡️</Text>
                <VStack spacing={0} align="start" flex={1}>
                  <Text 
                    fontWeight="600" 
                    color="blue.700" 
                    fontSize={{ base: "xs", md: "sm" }}
                  >
                    Authentification sécurisée
                  </Text>
                  <Text 
                    fontSize={{ base: "2xs", md: "xs" }} 
                    color="white.600"
                  >
                    Seuls les wallets autorisés peuvent accéder
                  </Text>
                </VStack>
              </HStack>

              {/* Formulaire de connexion */}
              <Box as="form" onSubmit={handleSubmit}>
                <VStack spacing={{ base: 4, md: 6 }}>
                  <FormControl isRequired>
                    <FormLabel
                      color="white"
                      fontWeight="600"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      fontSize={{ base: "sm", md: "md" }}
                    >
                      <Text fontSize={{ base: "16px", md: "18px" }} color="blue">💼</Text>
                      Adresse de votre Wallet
                    </FormLabel>
                    <Input
                      type="text" 
                      color="black"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="0x742d35Cc6634C0532925a3b8D404dEBC00000000"
                      bg="white"
                      border="2px solid"
                      borderColor="gray.200"
                      borderRadius="xl"
                      px={4}
                      py={3}
                      fontSize={{ base: "sm", md: "md" }}
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
                    size={buttonSize}
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
                    py={{ base: 5, md: 6 }}
                    fontSize={{ base: "md", md: "lg" }}
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
                      <Text 
                        color="red.700" 
                        fontSize={{ base: "xs", md: "sm" }} 
                        fontWeight="500"
                      >
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
                  p={{ base: 3, md: 4 }}
                  bg="blue.50"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="blue.200"
                  w="full"
                >
                  <HStack spacing={3} align="start">
                    <Text fontSize={{ base: "lg", md: "2xl" }}>💡</Text>
                    <VStack spacing={1} align="start" flex={1}>
                      <Text 
                        fontSize={{ base: "xs", md: "sm" }} 
                        fontWeight="600" 
                        color="blue.800"
                      >
                        Accès restreint
                      </Text>
                      <Text 
                        fontSize={{ base: "2xs", md: "xs" }} 
                        color="blue.700" 
                        lineHeight={1.4}
                      >
                        Seules les adresses wallet préalablement autorisées par l'administrateur peuvent accéder à la plateforme.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box
                  p={{ base: 3, md: 4 }}
                  bg="orange.50"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="orange.200"
                  w="full"
                >
                  <HStack spacing={3} align="start">
                    <Text fontSize={{ base: "lg", md: "2xl" }}>🦊</Text>
                    <VStack spacing={1} align="start" flex={1}>
                      <Text 
                        fontSize={{ base: "xs", md: "sm" }} 
                        fontWeight="600" 
                        color="orange.800"
                      >
                        Connexion rapide
                      </Text>
                      <Text 
                        fontSize={{ base: "2xs", md: "xs" }} 
                        color="orange.700" 
                        lineHeight={1.4}
                      >
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