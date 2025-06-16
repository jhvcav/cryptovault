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

// Déclaration TypeScript pour window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
      chainId?: string;
      selectedAddress?: string;
      providers?: any;
    };
    web3?: {
      currentProvider?: {
        isMetaMask?: boolean;
        selectedAddress?: string;
        request?: (args: { method: string; params?: any[] }) => Promise<any>;
      };
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
  console.log('🦊 Tentative de connexion MetaMask...');
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isMetaMaskBrowser = /MetaMask/i.test(navigator.userAgent);
  
  console.log('📱 Mobile:', isMobile);
  console.log('🔍 Navigateur MetaMask:', isMetaMaskBrowser);
  console.log('🌐 window.ethereum initial:', !!window.ethereum);

  setIsConnectingMetaMask(true);
  
  try {
    // ÉTAPE 1: Localiser ethereum dans différents emplacements possibles
    let ethereum = window.ethereum;
    
    if (!ethereum) {
      console.log('⚠️ Ethereum non trouvé initialement, recherche alternatives...');
      
      // Vérifier d'autres emplacements courants
      ethereum = window.ethereum || 
                (window.web3 && window.web3.currentProvider) || 
                (window.web3 && window.web3.givenProvider);
                
      // Pour MetaMask Mobile specifiquement
      if (!ethereum && isMetaMaskBrowser) {
        console.log('🔍 Dans navigateur MetaMask, recherche provider spécifique...');
        
        // Navigateur MetaMask peut avoir un provider à un emplacement différent
        ethereum = (window.ethereum && window.ethereum.providers && 
                  window.ethereum.providers.find(p => p.isMetaMask)) || 
                  window.ethereum;
      }
    }
    
    // ÉTAPE 2: Attente si nécessaire (uniquement pour mobile)
    if (isMobile && !ethereum) {
      console.log('⏳ Attente de ethereum sur mobile...');
      
      // Attendre jusqu'à 3 secondes par intervalle de 100ms
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Rechercher ethereum à chaque itération
        ethereum = window.ethereum || 
                  (window.web3 && window.web3.currentProvider) || 
                  (window.web3 && window.web3.givenProvider);
        
        if (ethereum) {
          console.log(`✅ Ethereum trouvé après ${i * 100}ms`);
          break;
        }
      }
    }
    
    // ÉTAPE 3: Gestion si ethereum n'est toujours pas disponible
    if (!ethereum) {
      console.log('❌ Ethereum non trouvé après attente');
      
      if (isMobile && !isMetaMaskBrowser) {
        // Proposer d'ouvrir MetaMask sur mobile
        toast({
          title: "MetaMask requis",
          description: "Veuillez utiliser le navigateur MetaMask ou installer l'application.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        
        // Ouvrir MetaMask avec deep link après confirmation
        setTimeout(() => {
          const shouldOpenMetaMask = confirm(
            'Voulez-vous ouvrir MetaMask pour vous connecter ?'
          );
          
          if (shouldOpenMetaMask) {
            // Construire un deep link qui retournera à cette page
            const currentUrl = encodeURIComponent(`${window.location.href}`);
            const metamaskDeepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
            window.location.href = metamaskDeepLink;
            return;
          }
        }, 1000);
      } else {
        toast({
          title: "MetaMask non disponible",
          description: isMetaMaskBrowser 
            ? "Veuillez rafraîchir la page et réessayer."
            : "Veuillez installer MetaMask.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
      setIsConnectingMetaMask(false);
      return;
    }

    console.log('✅ Ethereum disponible, connexion...');

    // ÉTAPE 4: Vérifier comptes existants
    let accounts = [];
    try {
      // Utiliser eth_accounts qui ne déclenche pas de popup
      accounts = await ethereum.request({ method: 'eth_accounts' });
      console.log('🔍 Comptes existants:', accounts);
      
      if (accounts && accounts.length > 0) {
        const metamaskAddress = accounts[0];
        console.log('✅ Compte déjà connecté:', metamaskAddress);
        
        // Définir l'adresse dans le state
        setWalletAddress(metamaskAddress);
        setError('');
        
        toast({
          title: "Wallet déjà connecté",
          description: `Adresse: ${metamaskAddress.substring(0, 6)}...${metamaskAddress.substring(metamaskAddress.length - 4)}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setIsConnectingMetaMask(false);
        return;
      }
    } catch (error) {
      console.log('⚠️ Erreur vérification comptes existants:', error);
      // Continuer même en cas d'erreur ici
    }

    // ÉTAPE 5: Demander la connexion
    console.log('🔑 Demande de connexion...');
    
    // Sur mobile, la gestion des permissions peut être différente
    if (isMobile) {
      try {
        // Essayer d'activer le fournisseur ethereum si disponible
        if (typeof ethereum.enable === 'function') {
          console.log('📱 Utilisation de ethereum.enable() sur mobile');
          accounts = await ethereum.enable();
        } 
        // Sinon utiliser la méthode standard
        else {
          console.log('📱 Utilisation de eth_requestAccounts sur mobile');
          accounts = await ethereum.request({
            method: 'eth_requestAccounts'
          });
        }
      } catch (mobileError) {
        console.error('❌ Erreur connexion mobile:', mobileError);
        
        // Si annulé par l'utilisateur, éviter de réessayer
        if (mobileError.code === 4001) {
          throw mobileError;
        }
        
        // Dernière tentative - méthode standard
        accounts = await ethereum.request({
          method: 'eth_requestAccounts'
        });
      }
    } 
    // Sur desktop, utiliser la méthode standard
    else {
      accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });
    }

    console.log('📝 Comptes reçus:', accounts);

    // ÉTAPE 6: Traiter le résultat
    if (accounts && accounts.length > 0) {
      const metamaskAddress = accounts[0];
      console.log('🎉 Connexion réussie:', metamaskAddress);
      
      // Important: s'assurer que l'adresse est correctement définie dans le state
      setWalletAddress(metamaskAddress);
      setError('');
      
      toast({
        title: "Wallet connecté",
        description: `Adresse: ${metamaskAddress.substring(0, 6)}...${metamaskAddress.substring(metamaskAddress.length - 4)}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      throw new Error('Aucun compte récupéré');
    }

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    console.error('❌ Code:', error.code);
    console.error('❌ Message:', error.message);
    
    let errorMessage = "Erreur lors de la connexion à MetaMask";
    let errorTitle = "Erreur MetaMask";
    
    // Gestion spécifique des erreurs
    switch(error.code) {
      case 4001:
        errorMessage = "Connexion refusée par l'utilisateur";
        errorTitle = "Connexion annulée";
        break;
      case -32002:
        errorMessage = "Une demande de connexion est déjà en cours dans MetaMask";
        errorTitle = "Demande en cours";
        break;
      case -32603:
        errorMessage = "Erreur interne MetaMask";
        errorTitle = "Erreur interne";
        if (isMobile) {
          errorMessage += ". Essayez de rafraîchir la page.";
        }
        break;
      default:
        if (error.message) {
          errorMessage = error.message;
        }
        if (isMobile && isMetaMaskBrowser) {
          errorMessage += " (Essayez de rafraîchir la page)";
        }
    }
    
    toast({
      title: errorTitle,
      description: errorMessage,
      status: "error",
      duration: 6000,
      isClosable: true,
    });
    
    setError(errorMessage);
    
  } finally {
    setIsConnectingMetaMask(false);
  }
};

// Fonction de diagnostic dans le composant LoginPage :

const diagnosticMetaMaskBrowser = () => {
  const info = {
    userAgent: navigator.userAgent,
    isMetaMaskBrowser: /MetaMask/i.test(navigator.userAgent),
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    windowEthereum: !!window.ethereum,
    ethereumIsMetaMask: window.ethereum?.isMetaMask,
    ethereumChainId: window.ethereum?.chainId,
    web3CurrentProvider: !!(window as any).web3?.currentProvider,
    availableProviders: window.ethereum?.providers ? Object.keys(window.ethereum.providers) : [],
    windowKeys: Object.keys(window).filter(key => 
      key.toLowerCase().includes('eth') || 
      key.toLowerCase().includes('web3') || 
      key.toLowerCase().includes('metamask')
    ),
    timestamp: new Date().toISOString()
  };
  
  console.log('🔍 Diagnostic Navigateur MetaMask:', info);
  
  // Test de connexion simple
  if (window.ethereum) {
    window.ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        console.log('✅ Test eth_accounts réussi:', accounts);
      })
      .catch(error => {
        console.log('❌ Test eth_accounts échoué:', error);
      });
  }
  
  return info;
};

// Hook useEffect amélioré pour la détection mobile
React.useEffect(() => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isMetaMaskBrowser = /MetaMask/i.test(navigator.userAgent);
  
  console.log('🔍 LoginPage - Environnement détecté:', {
    isMobile,
    isMetaMaskBrowser,
    hasEthereum: !!window.ethereum,
    userAgent: navigator.userAgent.substring(0, 100)
  });
  
  // Fonction pour vérifier MetaMask et définir l'adresse si déjà connecté
  const checkExistingConnection = async () => {
    try {
      let ethereum = window.ethereum;
      
      // Rechercher ethereum à différents emplacements si nécessaire
      if (!ethereum) {
        ethereum = window.ethereum || 
                  (window.web3 && window.web3.currentProvider) || 
                  (window.web3 && window.web3.givenProvider);
                  
        // Pour MetaMask Mobile spécifiquement
        if (!ethereum && isMetaMaskBrowser) {
          ethereum = (window.ethereum && window.ethereum.providers && 
                    window.ethereum.providers.find(p => p.isMetaMask)) || 
                    window.ethereum;
        }
      }
      
      if (ethereum) {
        console.log('✅ ethereum trouvé, vérification des comptes existants');
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        
        if (accounts && accounts.length > 0) {
          console.log('✅ Compte déjà connecté détecté:', accounts[0]);
          setWalletAddress(accounts[0]);
          
          // Notification de connexion automatique
          toast({
            title: "Wallet connecté automatiquement",
            description: `Adresse: ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } else {
          console.log('ℹ️ Aucun compte connecté trouvé');
        }
      } else {
        console.log('ℹ️ ethereum non trouvé dans useEffect');
      }
    } catch (error) {
      console.log('⚠️ Erreur vérification connexion existante:', error);
    }
  };
  
  // Exécuter immédiatement pour les navigateurs standard
  if (!isMobile || isMetaMaskBrowser) {
    checkExistingConnection();
  }
  
  // Pour les mobiles, attendre un peu plus longtemps pour l'initialisation
  if (isMobile) {
    console.log('📱 Environnement mobile détecté, attente prolongée');
    
    // Attendre 500ms puis réessayer
    setTimeout(() => {
      checkExistingConnection();
    }, 500);
    
    // Attendre 2s puis réessayer à nouveau
    setTimeout(() => {
      checkExistingConnection();
    }, 2000);
  }
  
  // Écouter les changements de compte MetaMask
  const handleAccountsChanged = (accounts) => {
    console.log('🔄 Comptes MetaMask modifiés:', accounts);
    if (accounts && accounts.length > 0) {
      setWalletAddress(accounts[0]);
    } else {
      setWalletAddress('');
    }
  };
  
  // Ajouter un écouteur d'événement pour les changements de compte
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', handleAccountsChanged);
  }
  
  // Nettoyage à la déconnexion du composant
  return () => {
    if (window.ethereum && window.ethereum.removeListener) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  };
}, []);

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
                    color="gray.600"
                  >
                    Seuls les wallets autorisés peuvent accéder
                  </Text>
                </VStack>
              </HStack>

              {/* Alerte spécifique mobile */}
{/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
  <Box
    p={{ base: 3, md: 4 }}
    bg={/MetaMask/i.test(navigator.userAgent) ? "green.50" : (!window.ethereum ? "red.50" : "green.50")}
    borderRadius="xl"
    border="1px solid"
    borderColor={/MetaMask/i.test(navigator.userAgent) ? "green.200" : (!window.ethereum ? "red.200" : "green.200")}
    w="full"
  >
    <HStack spacing={3} align="start">
      <Text fontSize={{ base: "lg", md: "2xl" }}>
        {/MetaMask/i.test(navigator.userAgent) ? "🦊" : (!window.ethereum ? "📱" : "✅")}
      </Text>
      <VStack spacing={1} align="start" flex={1}>
        <Text 
          fontSize={{ base: "xs", md: "sm" }} 
          fontWeight="600" 
          color={/MetaMask/i.test(navigator.userAgent) ? "green.800" : (!window.ethereum ? "red.800" : "green.800")}
        >
          {/MetaMask/i.test(navigator.userAgent) 
            ? "Navigateur MetaMask détecté" 
            : (!window.ethereum ? "Appareil mobile détecté" : "MetaMask détecté")
          }
        </Text>
        {/MetaMask/i.test(navigator.userAgent) ? (
          <Text 
            fontSize={{ base: "2xs", md: "xs" }} 
            color="green.700" 
            lineHeight={1.4}
          >
            Parfait ! Vous êtes dans le navigateur MetaMask. Cliquez sur le bouton 🦊 pour connecter votre wallet.
          </Text>
        ) : (!window.ethereum ? (
          <VStack spacing={1} align="start">
            <Text 
              fontSize={{ base: "2xs", md: "xs" }} 
              color="red.700" 
              lineHeight={1.4}
            >
              Pour une connexion optimale sur mobile :
            </Text>
            <Text 
              fontSize={{ base: "2xs", md: "xs" }} 
              color="red.700" 
              lineHeight={1.4}
              pl={2}
            >
              • Utilisez le navigateur intégré de MetaMask
            </Text>
            <Text 
              fontSize={{ base: "2xs", md: "xs" }} 
              color="red.700" 
              lineHeight={1.4}
              pl={2}
            >
              • Ou cliquez sur le bouton 🦊 pour ouvrir MetaMask
            </Text>
          </VStack>
        ) : (
          <Text 
            fontSize={{ base: "2xs", md: "xs" }} 
            color="green.700" 
            lineHeight={1.4}
          >
            Vous pouvez maintenant cliquer sur le bouton MetaMask pour récupérer votre adresse.
          </Text>
        ))}
      </VStack>
    </HStack>
  </Box>
)}

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
                        {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                            ? "Sur mobile, utilisez le navigateur intégré de MetaMask ou cliquez sur le bouton 🦊 pour ouvrir l'application."
                            : "Cliquez sur le bouton MetaMask en haut à droite pour récupérer automatiquement votre adresse wallet."
                        }
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