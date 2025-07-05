// src/pages/LoginPage.tsx - VERSION AVEC VÉRIFICATION CÔTÉ CLIENT
import React, { useState, useEffect, useCallback } from 'react';
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

// 🔐 FONCTION DE VÉRIFICATION DE SIGNATURE CÔTÉ CLIENT
const verifySignature = async (address: string, message: string, signature: string): Promise<boolean> => {
  try {
    // Utiliser l'API Web3 pour vérifier la signature
    if (!window.ethereum) {
      console.error('❌ MetaMask non disponible pour la vérification');
      return false;
    }

    // Méthode de vérification via eth_personal_ecRecover
    const recoveredAddress = await window.ethereum.request({
      method: 'personal_ecRecover',
      params: [message, signature],
    });

    console.log('🔍 Adresse récupérée:', recoveredAddress);
    console.log('🔍 Adresse attendue:', address);

    // Comparer les adresses (insensible à la casse)
    const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();
    console.log('✅ Signature valide:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de signature:', error);
    
    // Méthode alternative avec ethers.js si disponible
    try {
      // Si ethers.js est disponible dans votre projet
      if (typeof window !== 'undefined' && (window as any).ethers) {
        const ethers = (window as any).ethers;
        const recoveredAddress = ethers.utils.verifyMessage(message, signature);
        const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();
        console.log('✅ Signature valide (ethers):', isValid);
        return isValid;
      }
    } catch (ethersError) {
      console.error('❌ Erreur ethers:', ethersError);
    }
    
    return false;
  }
};

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
  const [hasTriedAutoConnect, setHasTriedAutoConnect] = useState(false); // 🔥 NOUVEAU
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)');

  // 🎯 RESPONSIVE VALUES CORRIGÉS POUR DESKTOP
  const containerMaxW = useBreakpointValue({ 
    base: 'full',
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl',
    '2xl': '2xl'
  });
  
  const cardMaxW = useBreakpointValue({
    base: 'full',
    sm: '400px',
    md: '500px',
    lg: '600px',
    xl: '650px',
    '2xl': '700px'
  });

  const cardPadding = useBreakpointValue({ base: 6, md: 8, lg: 10 });
  const headingSize = useBreakpointValue({ base: 'xl', md: '2xl', lg: '3xl' });
  const logoSize = useBreakpointValue({ base: 16, md: 20, lg: 24 });
  const logoFontSize = useBreakpointValue({ base: '2xl', md: '4xl', lg: '5xl' });
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const metaMaskButtonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const metaMaskButtonText = useBreakpointValue({ base: '🦊', md: 'Connect MetaMask' });
  const showMetaMaskText = useBreakpointValue({ base: false, md: true });
  const inscriptionButtonSize = useBreakpointValue({ base: 'sm', md: 'md' });

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

  // 🔥 FONCTION CONNECTMASK STABILISÉE AVEC USECALLBACK ET SIGNATURE
  const connectMetaMask = useCallback(async () => {
    const mobileInfo = detectMobileAndMetaMask();
    
    console.log('🦊 Tentative MetaMask sur:', mobileInfo);
    
    if (!window.ethereum) {
      if (mobileInfo.isMetaMaskBrowser) {
        toast({
          title: "Chargement...",
          description: "MetaMask se charge, veuillez patienter quelques secondes.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        
        let attempts = 0;
        const maxAttempts = 10;
        
        setIsConnectingMetaMask(true);
        
        const waitForEthereum = setInterval(() => {
          attempts++;
          console.log(`🔄 Tentative ${attempts}/${maxAttempts} pour détecter ethereum...`);
          
          if (window.ethereum) {
            clearInterval(waitForEthereum);
            console.log('✅ window.ethereum détecté !');
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
      let accounts;
      
      try {
        accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (!accounts || accounts.length === 0) {
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

        // 🔐 ÉTAPE DE SIGNATURE CRYPTOGRAPHIQUE POUR PROUVER LA PROPRIÉTÉ
        try {
          toast({
            title: "Vérification de propriété",
            description: "Veuillez signer le message pour prouver que vous possédez ce wallet...",
            status: "info",
            duration: 5000,
            isClosable: true,
          });

          // Message unique basé sur timestamp pour éviter les replay attacks
          const timestamp = Date.now();
          const message = `CryptocaVault - Authentification sécurisée\nAdresse: ${metamaskAddress}\nTimestamp: ${timestamp}\nJe confirme être le propriétaire de ce wallet.`;
          
          console.log('📝 Demande de signature du message:', message);
          
          // Demander la signature du message
          const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, metamaskAddress],
          });

          console.log('✅ Signature obtenue:', signature);

          // Stocker l'adresse, la signature et le message pour validation côté serveur
          setWalletAddress(metamaskAddress);
          
          // Stocker les données de signature pour l'envoi au serveur lors du login
          sessionStorage.setItem('walletAddress', metamaskAddress);
          sessionStorage.setItem('signature', signature);
          sessionStorage.setItem('message', message);
          sessionStorage.setItem('timestamp', timestamp.toString());
          
          toast({
            title: "Wallet connecté et vérifié !",
            description: `${metamaskAddress.substring(0, 6)}...${metamaskAddress.substring(metamaskAddress.length - 4)} ✓ Signature valide`,
            status: "success",
            duration: 4000,
            isClosable: true,
          });

        } catch (signError: any) {
          console.error('❌ Erreur lors de la signature:', signError);
          
          if (signError.code === 4001) {
            toast({
              title: "Signature refusée",
              description: "Vous devez signer le message pour prouver la propriété du wallet.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
          } else {
            toast({
              title: "Erreur de signature",
              description: "Impossible de vérifier la propriété du wallet. Réessayez.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
          
          // Ne pas définir l'adresse si la signature échoue
          return;
        }
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
  }, [toast]); // 🔥 DÉPENDANCES EXPLICITES

  // Fonction pour gérer la soumission avec vérification de signature côté client
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const mobileInfo = detectMobileAndMetaMask();
    console.log('🚀 Soumission formulaire sur:', mobileInfo);
    
    setError('');

    // Vérification que l'adresse provient de MetaMask avec signature
    if (!walletAddress.trim()) {
      setError('Veuillez d\'abord connecter votre wallet MetaMask');
      return;
    }

    // Vérifier que nous avons les données de signature
    const storedSignature = sessionStorage.getItem('signature');
    const storedMessage = sessionStorage.getItem('message');
    const storedTimestamp = sessionStorage.getItem('timestamp');
    const storedAddress = sessionStorage.getItem('walletAddress');

    if (!storedSignature || !storedMessage || !storedTimestamp || !storedAddress) {
      setError('Données de signature manquantes. Veuillez reconnecter votre wallet MetaMask.');
      setWalletAddress(''); // Forcer la reconnexion
      return;
    }

    // Vérifier que l'adresse affichée correspond à celle signée
    if (storedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      setError('Incohérence dans les données de signature. Veuillez reconnecter votre wallet.');
      setWalletAddress('');
      return;
    }

    // Vérifier que la signature n'est pas trop ancienne (15 minutes max)
    const currentTime = Date.now();
    const signatureTime = parseInt(storedTimestamp);
    const maxAge = 15 * 60 * 1000; // 15 minutes en millisecondes

    if (currentTime - signatureTime > maxAge) {
      setError('La signature a expiré. Veuillez reconnecter votre wallet MetaMask.');
      setWalletAddress('');
      sessionStorage.removeItem('signature');
      sessionStorage.removeItem('message');
      sessionStorage.removeItem('timestamp');
      sessionStorage.removeItem('walletAddress');
      return;
    }

    const trimmedAddress = walletAddress.trim();
    
    if (!trimmedAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
      setError('Format d\'adresse wallet invalide');
      return;
    }

    console.log('🔐 Vérification de la signature côté client...');
    setIsSubmitting(true);

    try {
      // 🔐 VÉRIFICATION DE SIGNATURE CÔTÉ CLIENT
      const isSignatureValid = await verifySignature(
        storedAddress,
        storedMessage,
        storedSignature
      );

      if (!isSignatureValid) {
        setError('Signature invalide. Vous n\'êtes pas le propriétaire de ce wallet.');
        setWalletAddress('');
        // Nettoyer les données de session
        sessionStorage.removeItem('signature');
        sessionStorage.removeItem('message');
        sessionStorage.removeItem('timestamp');
        sessionStorage.removeItem('walletAddress');
        return;
      }

      console.log('✅ Signature vérifiée côté client - Tentative de connexion...');
      
      // Maintenant on peut faire confiance à l'adresse pour le login
      const success = await login(trimmedAddress);
      console.log('✅ Résultat login:', success);
      
      if (!success) {
        setError('Vous n\'êtes pas autorisé à accéder à cette plateforme. Contactez votre Leader.');
      } else {
        console.log('🎉 Connexion réussie avec signature valide ! Redirection vers dashboard...');
        // Nettoyer les données de session après succès
        sessionStorage.removeItem('signature');
        sessionStorage.removeItem('message');
        sessionStorage.removeItem('timestamp');
        sessionStorage.removeItem('walletAddress');
      }
    } catch (error) {
      console.error('❌ Erreur login:', error);
      setError('Erreur de connexion ou de vérification de signature. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔥 USEEFFECT CORRIGÉ POUR ÉVITER LA BOUCLE INFINIE
  useEffect(() => {
    // Ne tenter la connexion automatique qu'une seule fois
    if (hasTriedAutoConnect) {
      return;
    }

    const isMetaMaskBrowser = /MetaMask/i.test(navigator.userAgent);
    
    if (isMetaMaskBrowser && !walletAddress) {
      console.log('📱 Navigateur MetaMask détecté - Tentative auto-connexion...');
      
      const timer = setTimeout(() => {
        console.log('🔄 Tentative auto-connexion après délai...');
        if (window.ethereum) {
          connectMetaMask();
        }
        setHasTriedAutoConnect(true); // 🔥 MARQUER COMME TENTÉ
      }, 4000);
      
      return () => clearTimeout(timer);
    } else {
      // Marquer comme tenté même si pas MetaMask pour éviter les re-renders
      setHasTriedAutoConnect(true);
    }
  }, [connectMetaMask, hasTriedAutoConnect, walletAddress]); // 🔥 DÉPENDANCES EXPLICITES

  const navigate = useNavigate();

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
        w={{ base: "100px", md: "200px", lg: "250px" }}
        h={{ base: "100px", md: "200px", lg: "250px" }}
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
        w={{ base: "150px", md: "300px", lg: "400px" }}
        h={{ base: "150px", md: "300px", lg: "400px" }}
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
        p={{ base: 4, md: 6, lg: 8 }}
        position="relative"
        zIndex={1}
      >
        <Container maxW={containerMaxW} w="full">
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
            maxW={cardMaxW}
            mx="auto"
          >
            {/* Bouton MetaMask flottant */}
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

            {/* Bouton inscription RMR flottant */}
            <Button
              position="absolute"
              top={{ base: 4, md: 6 }}
              left={{ base: 4, md: 6 }}
              size={inscriptionButtonSize}
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
                  📝
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
  _hover={{ transform: 'scale(1.05)' }}
  transition="transform 0.3s ease"
  w="150px"
  h="150px"
  display="flex"
  alignItems="center"
  justifyContent="center"
>
  <svg width="150" height="150" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    {/*Dégradé violet pour le fond*/}
    <radialGradient id="bgGradient" cx="30%" cy="30%">
      <stop offset="0%" style={{stopColor:"#a855f7", stopOpacity:1}} />
      <stop offset="100%" style={{stopColor:"#6b21a8", stopOpacity:1}} />
    </radialGradient>
    
    {/*Dégradé pour le demi-cercle*/}
    <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor:"#ffffff", stopOpacity:0.9}} />
      <stop offset="50%" style={{stopColor:"#f8fafc", stopOpacity:0.8}} />
      <stop offset="100%" style={{stopColor:"#e2e8f0", stopOpacity:0.7}} />
    </linearGradient>
    
    {/*Ombre portée*/}
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
    </filter>
    
    {/*Effet de brillance pour les lettres*/}
    <filter id="letterGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#ffffff" floodOpacity="0.4"/>
    </filter>
  </defs>
  
  {/*Cercle de fond avec dégradé et ombre*/}
  <circle cx="100" cy="100" r="90" fill="url(#bgGradient)" stroke="#000000" strokeWidth="3" filter="url(#shadow)"/>
  
  {/*Demi-cercle ouvert avec effet dégradé*/}
  <path d="M 112 40 A 65 65 0 1 0 112 160" fill="none" stroke="url(#arcGradient)" strokeWidth="14" strokeLinecap="round"/>
  
  {/*Étoiles décoratives de différents formats*/}
  {/*Étoile 5 branches en haut à droite*/}
  <path d="M 155 45 L 158 54 L 167 54 L 160 60 L 163 69 L 155 63 L 147 69 L 150 60 L 143 54 L 152 54 Z" fill="#ffffff" opacity="0.7"/>
  
  {/*Petite étoile 4 branches à gauche*/}
  <path d="M 35 75 L 37 82 L 44 80 L 37 87 L 35 94 L 33 87 L 26 80 L 33 82 Z" fill="#ffffff" opacity="0.5"/>
  
  {/*Étoile simple (diamant) en bas à droite*/}
  <path d="M 165 150 L 169 154 L 165 158 L 161 154 Z" fill="#ffffff" opacity="0.6"/>
  
  {/*Petite étoile 6 branches en haut à gauche*/}
  <path d="M 45 50 L 46 53 L 49 52 L 47 55 L 50 58 L 46 57 L 45 60 L 44 57 L 41 58 L 43 55 L 40 52 L 44 53 Z" fill="#ffffff" opacity="0.4"/>
  
  {/*Étoile brillante (croix) en bas à gauche*/}
  <path d="M 50 165 L 52 163 L 54 165 L 52 167 Z M 50 163 L 54 167 M 54 163 L 50 167" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.6"/>
  
  {/*Petite étoile simple en bas*/}
  <circle cx="100" cy="175" r="1.5" fill="#ffffff" opacity="0.5"/>
  
  {/*Lettres avec effet de brillance*/}
  <text x="70" y="130" fontFamily="Arial, sans-serif" fontSize="76" fontWeight="bold" fill="#ffffff" textAnchor="middle" filter="url(#letterGlow)">C</text>
  <text x="130" y="130" fontFamily="Arial, sans-serif" fontSize="76" fontWeight="bold" fill="#ffffff" textAnchor="middle" filter="url(#letterGlow)">V</text>
  
  {/*Effet de brillance subtil sur le contour*/}
  <circle cx="100" cy="100" r="87" fill="none" stroke="url(#bgGradient)" strokeWidth="1" opacity="0.3"/>
  
  {/*Point de lumière décoratif*/}
  <circle cx="75" cy="65" r="3" fill="#ffffff" opacity="0.6"/>
  <circle cx="75" cy="65" r="1.5" fill="#ffffff" opacity="0.9"/>
  </svg>
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
                    fontSize={{ base: "sm", md: "lg", lg: "xl" }}
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
                      readOnly
                      placeholder="Cliquez sur le bouton MetaMask pour connecter votre wallet"
                      bg={walletAddress ? "white" : "gray.50"}
                      border="2px solid"
                      borderColor={walletAddress ? "green.300" : "gray.200"}
                      borderRadius="xl"
                      px={4}
                      py={3}
                      fontSize={{ base: "sm", md: "md" }}
                      _hover={{ 
                        borderColor: walletAddress ? 'green.400' : 'blue.300',
                        cursor: 'not-allowed'
                      }}
                      _focus={{ 
                        borderColor: walletAddress ? 'green.500' : 'blue.500', 
                        boxShadow: walletAddress 
                          ? '0 0 0 3px rgba(72, 187, 120, 0.1)' 
                          : '0 0 0 3px rgba(102, 126, 234, 0.1)' 
                      }}
                      transition="all 0.3s ease"
                      cursor="not-allowed"
                      onPaste={(e) => e.preventDefault()}
                      onKeyDown={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                      rightElement={
                        walletAddress ? (
                          <Text 
                            fontSize="lg" 
                            color="green.500" 
                            pr={3}
                            pointerEvents="none"
                          >
                            ✅
                          </Text>
                        ) : null
                      }
                    />
                    {/* Message informatif */}
                    <Text 
                      fontSize={{ base: "2xs", md: "xs" }} 
                      color="gray.400" 
                      mt={1}
                      fontStyle="italic"
                    >
                      🔒 Ce champ se remplit automatiquement via MetaMask pour votre sécurité
                    </Text>
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

                  {/* Message si pas d'adresse wallet */}
                  {!walletAddress && (
                    <Alert
                      status="info"
                      borderRadius="xl"
                      bg="blue.50"
                      border="1px solid"
                      borderColor="blue.200"
                    >
                      <AlertIcon color="blue.500" />
                      <Text 
                        color="blue.700" 
                        fontSize={{ base: "xs", md: "sm" }} 
                        fontWeight="500"
                      >
                        Veuillez d'abord connecter votre wallet MetaMask en cliquant sur le bouton 🦊 en haut à droite
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
                    <Text fontSize={{ base: "lg", md: "2xl" }}>🔐</Text>
                    <VStack spacing={1} align="start" flex={1}>
                      <Text 
                        fontSize={{ base: "xs", md: "sm" }} 
                        fontWeight="600" 
                        color="orange.800"
                      >
                        Authentification sécurisée
                      </Text>
                      <Text 
                        fontSize={{ base: "2xs", md: "xs" }} 
                        color="orange.700" 
                        lineHeight={1.4}
                      >
                        Le bouton MetaMask vous demande de signer un message cryptographique pour prouver que vous possédez réellement ce wallet.
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