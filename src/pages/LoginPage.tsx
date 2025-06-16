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

  // Solution robuste pour MetaMask mobile - gère les cas où window.ethereum n'est pas injecté
const connectMetaMask = async () => {
  console.log('🦊 Tentative de récupération de l\'adresse MetaMask...');
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isMetaMaskBrowser = /MetaMask/i.test(navigator.userAgent);
  
  console.log('📱 Mobile:', isMobile);
  console.log('🔍 Navigateur MetaMask:', isMetaMaskBrowser);
  
  setIsConnectingMetaMask(true);
  setError('');
  
  try {
    // 1. Vérifier si nous avons déjà une adresse en session
    const storedWallet = sessionStorage.getItem('lastConnectedWallet');
    
    if (storedWallet) {
      console.log('🔄 Adresse stockée trouvée:', storedWallet);
      
      const confirmUse = confirm(
        `Voulez-vous utiliser l'adresse précédemment connectée: ${storedWallet.substring(0, 6)}...${storedWallet.substring(storedWallet.length - 4)} ?`
      );
      
      if (confirmUse) {
        setWalletAddress(storedWallet);
        
        toast({
          title: "Adresse récupérée",
          description: `${storedWallet.substring(0, 6)}...${storedWallet.substring(storedWallet.length - 4)}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        setIsConnectingMetaMask(false);
        return;
      }
    }
    
    // 2. Fonction d'attente pour ethereum avec timeout
    const waitForEthereum = (maxWaitTime = 5000) => {
      return new Promise((resolve) => {
        if (window.ethereum) {
          console.log('✅ window.ethereum déjà disponible');
          resolve(window.ethereum);
          return;
        }
        
        console.log('⏳ Attente de l\'injection de window.ethereum...');
        
        let timeoutId;
        let intervalId;
        
        // Écouteur pour l'événement ethereum#initialized
        const handleEthereumInitialized = () => {
          console.log('🎉 Événement ethereum#initialized reçu');
          clearTimeout(timeoutId);
          clearInterval(intervalId);
          resolve(window.ethereum);
        };
        
        window.addEventListener('ethereum#initialized', handleEthereumInitialized, { once: true });
        
        // Vérification périodique
        intervalId = setInterval(() => {
          if (window.ethereum) {
            console.log('✅ window.ethereum détecté par polling');
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            window.removeEventListener('ethereum#initialized', handleEthereumInitialized);
            resolve(window.ethereum);
          }
        }, 100);
        
        // Timeout
        timeoutId = setTimeout(() => {
          console.log('⏰ Timeout atteint pour l\'injection ethereum');
          clearInterval(intervalId);
          window.removeEventListener('ethereum#initialized', handleEthereumInitialized);
          resolve(null);
        }, maxWaitTime);
      });
    };
    
    // 3. Attendre l'injection de ethereum
    const ethereum = await waitForEthereum();
    
    if (ethereum) {
      console.log('✅ Provider ethereum trouvé, tentative de connexion...');
      
      // Tentative de connexion avec plusieurs méthodes
      let accounts = null;
      
      try {
        // Méthode 1: Vérifier d'abord les comptes existants
        console.log('🔄 Vérification des comptes existants...');
        accounts = await ethereum.request({ method: 'eth_accounts' });
        
        if (!accounts || accounts.length === 0) {
          // Méthode 2: Demander l'accès aux comptes
          console.log('🔄 Demande d\'accès aux comptes...');
          accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        }
        
      } catch (error) {
        console.log('⚠️ Erreur lors de la récupération des comptes:', error);
        
        // Méthode 3: Attendre un peu et réessayer
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          console.log('🔄 Nouvelle tentative après délai...');
          accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        } catch (retryError) {
          console.log('⚠️ Échec de la nouvelle tentative:', retryError);
          throw retryError;
        }
      }
      
      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        console.log('✅ Adresse récupérée avec succès:', address);
        
        sessionStorage.setItem('lastConnectedWallet', address);
        setWalletAddress(address);
        
        toast({
          title: "Wallet connecté",
          description: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        setIsConnectingMetaMask(false);
        return;
      } else {
        throw new Error('Aucun compte trouvé');
      }
      
    } else {
      // 4. Si ethereum n'est pas disponible après attente
      console.log('❌ window.ethereum non disponible après attente');
      
      if (isMobile && isMetaMaskBrowser) {
        // Sur navigateur MetaMask mobile, proposer des solutions alternatives
        console.log('🦊 Navigateur MetaMask mobile - Solutions alternatives');
        
        // Option 1: Utiliser l'adresse stockée si disponible
        if (storedWallet) {
          const useStored = confirm(
            `window.ethereum n'est pas disponible. Voulez-vous utiliser l'adresse précédemment connectée: ${storedWallet.substring(0, 6)}...${storedWallet.substring(storedWallet.length - 4)} ?`
          );
          
          if (useStored) {
            setWalletAddress(storedWallet);
            
            toast({
              title: "Adresse récupérée du cache",
              description: `${storedWallet.substring(0, 6)}...${storedWallet.substring(storedWallet.length - 4)}`,
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            
            setIsConnectingMetaMask(false);
            return;
          }
        }
        
        // Option 2: Rafraîchissement de la page
        const shouldRefresh = confirm(
          "MetaMask ne s'est pas chargé correctement. Voulez-vous rafraîchir la page ? Cela résout souvent le problème."
        );
        
        if (shouldRefresh) {
          // Marquer qu'on va rafraîchir pour éviter les boucles
          sessionStorage.setItem('metamaskRefreshAttempt', Date.now().toString());
          window.location.reload();
          return;
        }
        
        // Option 3: Saisie manuelle en dernier recours
        const shouldEnterManually = confirm(
          "Voulez-vous saisir manuellement votre adresse wallet ?"
        );
        
        if (shouldEnterManually) {
          const manualAddress = prompt("Veuillez saisir votre adresse Ethereum (commençant par 0x):");
          
          if (manualAddress && manualAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
            setWalletAddress(manualAddress);
            sessionStorage.setItem('lastConnectedWallet', manualAddress);
            
            toast({
              title: "Adresse saisie manuellement",
              description: `${manualAddress.substring(0, 6)}...${manualAddress.substring(manualAddress.length - 4)}`,
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            
            setIsConnectingMetaMask(false);
            return;
          } else if (manualAddress) {
            throw new Error("Format d'adresse invalide");
          }
        }
        
        throw new Error("Opération annulée");
        
      } else if (isMobile) {
        // Sur mobile standard, rediriger vers MetaMask
        console.log('📱 Mobile standard, redirection vers MetaMask');
        
        toast({
          title: "Redirection vers MetaMask",
          description: "Ouverture de l'application MetaMask...",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        
        const dappUrl = `${window.location.host}${window.location.pathname}`;
        const metamaskAppDeepLink = `https://metamask.app.link/dapp/${dappUrl}`;
        
        sessionStorage.setItem('metamaskRedirectPending', 'true');
        sessionStorage.setItem('metamaskRedirectTime', Date.now().toString());
        
        window.location.href = metamaskAppDeepLink;
        return;
        
      } else {
        // Sur desktop
        throw new Error("MetaMask n'est pas installé ou n'est pas disponible");
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur finale:', error);
    
    let errorMessage = "Erreur lors de la connexion MetaMask";
    
    if (error.code === 4001) {
      errorMessage = "Connexion refusée par l'utilisateur";
    } else if (error.code === -32002) {
      errorMessage = "Demande de connexion déjà en cours. Veuillez vérifier MetaMask.";
    } else if (error.code === -32603) {
      errorMessage = "Erreur interne MetaMask. Essayez de rafraîchir la page.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    toast({
      title: "Erreur de connexion",
      description: errorMessage,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
    
    setError(errorMessage);
  } finally {
    setIsConnectingMetaMask(false);
  }
};

// Hook pour vérifier le retour d'un rafraîchissement MetaMask
React.useEffect(() => {
  const checkRefreshReturn = () => {
    const refreshAttempt = sessionStorage.getItem('metamaskRefreshAttempt');
    
    if (refreshAttempt) {
      const timeSinceRefresh = Date.now() - parseInt(refreshAttempt);
      
      // Si le rafraîchissement est récent (moins de 30 secondes)
      if (timeSinceRefresh < 30000) {
        console.log('🔄 Retour après rafraîchissement MetaMask');
        
        // Nettoyer l'indicateur
        sessionStorage.removeItem('metamaskRefreshAttempt');
        
        // Essayer de récupérer automatiquement l'adresse après rafraîchissement
        setTimeout(() => {
          if (window.ethereum) {
            window.ethereum.request({ method: 'eth_accounts' })
              .then(accounts => {
                if (accounts && accounts.length > 0) {
                  console.log('✅ Compte récupéré après rafraîchissement:', accounts[0]);
                  setWalletAddress(accounts[0]);
                  sessionStorage.setItem('lastConnectedWallet', accounts[0]);
                  
                  toast({
                    title: "Connexion réussie",
                    description: `${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`,
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                  });
                }
              })
              .catch(error => {
                console.log('⚠️ Erreur après rafraîchissement:', error);
              });
          }
        }, 1000);
      } else {
        // Trop ancien, nettoyer
        sessionStorage.removeItem('metamaskRefreshAttempt');
      }
    }
  };
  
  checkRefreshReturn();
}, []);

// Fonction utilitaire pour diagnostiquer l'état de MetaMask
const diagnosticMetaMask = () => {
  const info = {
    userAgent: navigator.userAgent,
    isMetaMaskBrowser: /MetaMask/i.test(navigator.userAgent),
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    windowEthereum: !!window.ethereum,
    ethereumIsMetaMask: window.ethereum?.isMetaMask,
    ethereumChainId: window.ethereum?.chainId,
    ethereumSelectedAddress: window.ethereum?.selectedAddress,
    timestamp: new Date().toISOString()
  };
  
  console.log('🔍 Diagnostic MetaMask:', JSON.stringify(info, null, 2));
  
  // Afficher dans une alerte pour debug mobile
  if (info.isMobile) {
    alert(`Debug MetaMask:
- Navigateur MetaMask: ${info.isMetaMaskBrowser}
- window.ethereum: ${info.windowEthereum}
- isMetaMask: ${info.ethereumIsMetaMask}
- Adresse: ${info.ethereumSelectedAddress || 'Non disponible'}`);
  }
  
  return info;
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

const createMetaMaskDeepLink = () => {
  // Construction du deep link
  let deepLink = '';
  
  // URL de base du dapp
  const dappUrl = `${window.location.host}${window.location.pathname}`;
  
  // URL pour les appareils iOS (iPhone/iPad)
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    deepLink = `https://metamask.app.link/dapp/${dappUrl}`;
  } 
  // URL pour les appareils Android
  else {
    deepLink = `https://metamask.app.link/dapp/${dappUrl}`;
    
    // Alternative pour Android si nécessaire
    // deepLink = `intent://dapp/${dappUrl}#Intent;scheme=metamask;package=io.metamask;end`;
  }
  
  console.log('🔗 Deep link généré:', deepLink);
  return deepLink;
};

// Utilisation:
// const deepLink = createMetaMaskDeepLink();
// window.location.href = deepLink;

// Hook 1: Remplissage automatique au chargement (désactivé par défaut sur mobile)
React.useEffect(() => {
  // Variable pour déterminer si le remplissage automatique est activé
  const enableAutoFill = false; // Mettre à false pour désactiver le remplissage automatique
  
  if (!enableAutoFill) {
    console.log('🔒 Remplissage automatique désactivé');
    return;
  }
  
  const checkExistingConnection = async () => {
    console.log('🔍 Vérification d\'une connexion existante...');
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Sur mobile, ne pas faire de détection automatique
    if (isMobile) {
      console.log('📱 Sur mobile, pas de détection automatique');
      return;
    }
    
    try {
      // Uniquement pour desktop
      if (window.ethereum) {
        console.log('💻 Provider ethereum trouvé, vérification des comptes...');
        
        // Utiliser eth_accounts qui ne déclenche pas de popup
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts && accounts.length > 0) {
          console.log('✅ Compte déjà connecté détecté:', accounts[0]);
          setWalletAddress(accounts[0]);
          
          // Notification optionnelle
          toast({
            title: "Wallet détecté",
            description: `${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`,
            status: "info",
            duration: 3000,
            isClosable: true,
          });
        } else {
          console.log('ℹ️ Aucun compte connecté détecté');
        }
      }
    } catch (error) {
      console.log('⚠️ Erreur lors de la vérification initiale:', error);
    }
  };
  
  // Vérifier après un court délai
  setTimeout(() => {
    checkExistingConnection();
  }, 500);
}, []);

// Hook 2: Récupération automatique sur mobile
React.useEffect(() => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isMetaMaskBrowser = /MetaMask/i.test(navigator.userAgent);
  
  // Fonction pour tenter de récupérer l'adresse sur mobile
  const checkReturnFromMetaMask = async () => {
    // Ne s'exécute que sur mobile
    if (!isMobile) return;
    
    // Vérifier si ethereum est disponible
    const ethereum = window.ethereum || 
                   (window.web3 && window.web3.currentProvider) || 
                   (window as any).ethereum;
    
    if (ethereum) {
      console.log('📱 Tentative de récupération automatique de l\'adresse au chargement...');
      
      try {
        // Vérifier les comptes connectés
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        
        if (accounts && accounts.length > 0) {
          console.log('✅ Compte trouvé au chargement:', accounts[0]);
          
          // IMPORTANT: Remplir uniquement le champ d'adresse
          setWalletAddress(accounts[0]);
          
          // Stocker l'adresse pour une utilisation future
          sessionStorage.setItem('lastConnectedWallet', accounts[0]);
          
          toast({
            title: "Adresse récupérée",
            description: `${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.log('⚠️ Erreur récupération automatique de l\'adresse:', error);
      }
    }
  };
  
  // Exécuter la vérification au chargement après un court délai
  setTimeout(() => {
    checkReturnFromMetaMask();
  }, 1000);
  
  // Sur mobile, tenter à nouveau après un délai plus long
  if (isMobile) {
    setTimeout(() => {
      checkReturnFromMetaMask();
    }, 2000);
  }
}, []);

// Hook 3: Écouteur de changement de compte MetaMask
React.useEffect(() => {
  // Écouteur pour les changements de compte
  const handleAccountsChanged = (accounts) => {
    console.log('👤 Comptes MetaMask changés:', accounts);
    
    if (accounts && accounts.length > 0) {
      // Mettre à jour le champ d'adresse
      setWalletAddress(accounts[0]);
      
      // Stocker l'adresse pour une utilisation future
      sessionStorage.setItem('lastConnectedWallet', accounts[0]);
      
      toast({
        title: "Adresse mise à jour",
        description: `${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Réinitialiser le champ si tous les comptes sont déconnectés
      setWalletAddress('');
      
      toast({
        title: "Déconnecté de MetaMask",
        description: "Aucun compte n'est actuellement connecté",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Ajouter l'écouteur
  if (window.ethereum) {
    console.log('🔄 Configuration de l\'écouteur de changement de compte...');
    window.ethereum.on('accountsChanged', handleAccountsChanged);
  }
  
  // Fonction de nettoyage
  return () => {
    if (window.ethereum && window.ethereum.removeListener) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  };
}, []);

// Hook 4: Vérification de retour de redirection MetaMask
React.useEffect(() => {
  // Vérifier si on revient d'une redirection MetaMask
  const checkReturnFromRedirect = async () => {
    const redirectPending = sessionStorage.getItem('metamaskRedirectPending');
    const redirectTime = sessionStorage.getItem('metamaskRedirectTime');
    
    if (redirectPending === 'true' && redirectTime) {
      console.log('🔄 Retour détecté d\'une redirection MetaMask');
      
      // Vérifier que la redirection n'est pas trop ancienne (max 10 minutes)
      const timeSinceRedirect = Date.now() - parseInt(redirectTime);
      if (timeSinceRedirect > 10 * 60 * 1000) {
        console.log('⏱️ Redirection trop ancienne, nettoyage');
        sessionStorage.removeItem('metamaskRedirectPending');
        sessionStorage.removeItem('metamaskRedirectTime');
        return;
      }
      
      // Nettoyer les indicateurs de redirection
      sessionStorage.removeItem('metamaskRedirectPending');
      sessionStorage.removeItem('metamaskRedirectTime');
      
      try {
        // Après redirection, attendre un peu pour laisser ethereum s'initialiser
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Tenter de récupérer le provider ethereum
        if (window.ethereum) {
          console.log('✅ Provider ethereum trouvé après redirection');
          
          // Vérifier les comptes
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts && accounts.length > 0) {
            console.log('🎉 Compte trouvé après redirection:', accounts[0]);
            
            // Stocker l'adresse pour une utilisation future
            sessionStorage.setItem('lastConnectedWallet', accounts[0]);
            
            setWalletAddress(accounts[0]);
            
            toast({
              title: "Wallet connecté",
              description: `${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`,
              status: "success",
              duration: 3000,
              isClosable: true,
            });
          } else {
            console.log('⚠️ Aucun compte trouvé après redirection');
            
            // Vérifier s'il y a une adresse stockée précédemment
            const storedWallet = sessionStorage.getItem('lastConnectedWallet');
            if (storedWallet) {
              console.log('🔄 Utilisation de l\'adresse stockée après redirection:', storedWallet);
              
              // Proposer d'utiliser cette adresse
              const confirmUse = confirm(
                `Voulez-vous utiliser l'adresse précédemment connectée: ${storedWallet.substring(0, 6)}...${storedWallet.substring(storedWallet.length - 4)} ?`
              );
              
              if (confirmUse) {
                setWalletAddress(storedWallet);
                
                toast({
                  title: "Adresse récupérée",
                  description: `${storedWallet.substring(0, 6)}...${storedWallet.substring(storedWallet.length - 4)}`,
                  status: "success",
                  duration: 3000,
                  isClosable: true,
                });
              }
            }
          }
        } else {
          console.log('⚠️ Provider ethereum non trouvé après redirection');
        }
      } catch (error) {
        console.error('❌ Erreur après redirection:', error);
      }
    }
  };
  
  // Vérifier au chargement initial
  checkReturnFromRedirect();
  
  // Également vérifier lors du retour à la page
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('🔄 Page redevenue visible, vérification retour MetaMask');
      checkReturnFromRedirect();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
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
                    .CryptocaVault.
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

                  {/* Bouton de connexion */}

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