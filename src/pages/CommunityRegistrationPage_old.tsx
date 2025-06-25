// src/pages/CommunityRegistrationPage.tsx
import React, { useState, useEffect } from 'react';
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
  Checkbox,
  Link,
  Badge,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { CryptocaVaultDB } from '../lib/supabase';
import { detectMobileAndMetaMask } from '../components/utils/mobileDetection';

// Types
interface CommunityRegistrationForm {
  username: string;
  email: string;
  phone: string;
  charterAccepted: boolean;
  participationConfirmed: boolean;
  responsibilityAccepted: boolean;
  respectConfirmed: boolean;
}

// Déclaration TypeScript pour window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}

const CommunityRegistrationPage: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPreApproved, setIsPreApproved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState<boolean>(false);
  const [formData, setFormData] = useState<CommunityRegistrationForm>({
    username: '',
    email: '',
    phone: '',
    charterAccepted: false,
    participationConfirmed: false,
    responsibilityAccepted: false,
    respectConfirmed: false
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(1);

  const toast = useToast();
  const { isOpen: isCharterOpen, onOpen: onCharterOpen, onClose: onCharterClose } = useDisclosure();

  // Styles Chakra UI
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Responsive values
  const containerMaxW = useBreakpointValue({ base: 'sm', md: 'lg', lg: 'xl' });
  const cardPadding = useBreakpointValue({ base: 6, md: 10 });
  const headingSize = useBreakpointValue({ base: 'xl', md: '2xl' });

  // Fonction pour obtenir l'IP utilisateur
  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Erreur récupération IP:', error);
      return 'unknown';
    }
  };

  // Fonction pour connecter MetaMask (adaptée de votre LoginPage)
  const connectMetaMask = async () => {
    const mobileInfo = detectMobileAndMetaMask();
    
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
          
          if (window.ethereum) {
            clearInterval(waitForEthereum);
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
        setWalletAddress(metamaskAddress);
        setIsConnected(true);
        setCurrentStep(2);
        
        await checkPreApproval(metamaskAddress);
        
        toast({
          title: "Wallet connecté !",
          description: `${metamaskAddress.substring(0, 6)}...${metamaskAddress.substring(metamaskAddress.length - 4)}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur MetaMask",
        description: error.message || "Erreur lors de la connexion à MetaMask",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsConnectingMetaMask(false);
    }
  };

  // Vérifier si l'utilisateur est pré-approuvé
  const checkPreApproval = async (address: string) => {
    try {
      setIsLoading(true);
      
      // Vérifier d'abord s'il n'est pas déjà membre
      const existingMember = await CryptocaVaultDB.getCommunityMember(address);

      if (existingMember) {
        setError('Vous êtes déjà membre de la communauté CryptocaVault.');
        return;
      }

      // Vérifier la pré-approbation
      const preApprovalData = await CryptocaVaultDB.checkPreApproval(address);

      if (preApprovalData) {
        setIsPreApproved(true);
        setCurrentStep(3);
      } else {
        setError('Wallet non pré-approuvé. Veuillez contacter l\'administrateur pour obtenir l\'accès.');
      }

    } catch (error: any) {
      console.error('Erreur vérification pré-approbation:', error);
      setError('Erreur lors de la vérification. Contactez le support.');
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion des changements de formulaire
  const handleInputChange = (field: keyof CommunityRegistrationForm, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Vérifier si le formulaire est valide
  const isFormValid = (): boolean => {
    return (
      formData.username.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.charterAccepted &&
      formData.participationConfirmed &&
      formData.responsibilityAccepted &&
      formData.respectConfirmed
    );
  };

  // Enregistrer l'acceptation de la charte
  const registerCommunityAcceptance = async () => {
  try {
    setIsLoading(true);
    setError('');

    const userIP = await getUserIP();
    
    const acceptance = {
      wallet_address: walletAddress,  // ← GARDER (obligatoire)
      username: formData.username.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      acceptance_ip: userIP,
      registration_method: 'public'  // ← AJOUTER
    };

    const insertedData = await CryptocaVaultDB.createCommunityMember(acceptance);

    // Marquer la pré-approbation comme utilisée
    await CryptocaVaultDB.markPreApprovalUsed(walletAddress);

    // Log d'audit
    await CryptocaVaultDB.createAuditLog({
      action: 'community_registration',
      wallet_address: walletAddress,
      details: { username: formData.username },
      ip_address: userIP
    });

    setSuccess('Inscription réussie ! Vous recevrez bientôt les informations pour rejoindre notre groupe et formations.');
    setCurrentStep(4);

  } catch (error: any) {
    setError('Erreur lors de l\'inscription: ' + error.message);
  } finally {
    setIsLoading(false);
  }
};

  // Gestion de la soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError('Veuillez remplir tous les champs obligatoires et accepter toutes les conditions.');
      return;
    }
    await registerCommunityAcceptance();
  };

  // Auto-connexion pour MetaMask mobile
  useEffect(() => {
    const isMetaMaskBrowser = /MetaMask/i.test(navigator.userAgent);
    
    if (isMetaMaskBrowser) {
      const timer = setTimeout(() => {
        if (window.ethereum && !walletAddress) {
          connectMetaMask();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Box
      minH="100vh"
      position="relative"
      overflow="hidden"
      background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    >
      {/* Éléments décoratifs */}
      <Box
        position="absolute"
        top="10%"
        left="10%"
        w={{ base: "100px", md: "200px" }}
        h={{ base: "100px", md: "200px" }}
        bg="rgba(255, 255, 255, 0.1)"
        rounded="full"
        filter="blur(40px)"
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
            {/* En-tête */}
            <VStack spacing={6} align="stretch">
              <Box textAlign="center">
                <Box
                  p={{ base: 4, md: 6 }}
                  bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  rounded="full"
                  shadow="xl"
                  w={{ base: 16, md: 20 }}
                  h={{ base: 16, md: 20 }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb={4}
                >
                  <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="bold" color="white">🌟</Text>
                </Box>
                
                <Heading
                  size={headingSize}
                  bgGradient="linear(to-r, #667eea, #764ba2)"
                  bgClip="text"
                  textAlign="center"
                  fontWeight="800"
                  lineHeight="1.2"
                  mb={2}
                >
                  Rejoindre la Communauté
                </Heading>
                
                <Text
                  fontSize={{ base: "sm", md: "lg" }}
                  color="gray.600"
                  textAlign="center"
                  px={{ base: 2, md: 0 }}
                >
                  Vous avez été invité(e) à rejoindre notre communauté privée d'éducation crypto
                </Text>
              </Box>

              {/* Barre de progression */}
              <Box>
                <Text fontSize="sm" color="orange.600" mb={2}>
                  Étape {currentStep} sur 4
                </Text>
                <Progress 
                  value={(currentStep / 4) * 100} 
                  colorScheme="purple" 
                  size="sm" 
                  borderRadius="full"
                />
              </Box>

              {/* Messages d'erreur et succès */}
              {error && (
                <Alert status="error" borderRadius="xl">
                  <AlertIcon />
                  <Text fontSize={{ base: "sm", md: "md" }}>{error}</Text>
                </Alert>
              )}

              {success && (
                <Alert status="success" borderRadius="xl">
                  <AlertIcon />
                  <Text fontSize={{ base: "sm", md: "md" }}>{success}</Text>
                </Alert>
              )}

              {/* Étape 1: Présentation Charte */}
              {currentStep >= 1 && !success && (
                <Box>
                  <Heading size="lg" mb={4} color="orange.600">
                    📋 Charte de la Communauté
                  </Heading>
                  
                  <Box bg="blue.50" borderRadius="xl" p={6} mb={4}>
                    <Heading size="md" color="blue.800" mb={3}>
                      Points Clés à Retenir :
                    </Heading>
                    <VStack spacing={3} align="start">
                      <HStack>
                        <Text fontSize="xl">🕘</Text>
                        <Text fontSize="sm" color="blue.700">
                          <Text as="span" fontWeight="bold">Formations quotidiennes</Text> : Tous les soirs à 21h30 (GMT+3)
                        </Text>
                      </HStack>
                      <HStack>
                        <Text fontSize="xl">📅</Text>
                        <Text fontSize="sm" color="blue.700">
                          <Text as="span" fontWeight="bold">Règle d'absence</Text> : Maximum 4 absences sur 6 sessions
                        </Text>
                      </HStack>
                      <HStack>
                        <Text fontSize="xl">🤝</Text>
                        <Text fontSize="sm" color="blue.700">
                          <Text as="span" fontWeight="bold">Respect absolu</Text> : Aucune insulte, provocation ou commentaire haineux
                        </Text>
                      </HStack>
                      <HStack>
                        <Text fontSize="xl">💪</Text>
                        <Text fontSize="sm" color="blue.700">
                          <Text as="span" fontWeight="bold">Responsabilité personnelle</Text> : Vous êtes responsable de toutes vos décisions
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>

                  <Button
                    leftIcon={<Icon as={ExternalLinkIcon} />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={onCharterOpen}
                    mb={4}
                  >
                    Lire la Charte Complète
                  </Button>
                </Box>
              )}

              {/* Étape 2: Connexion Wallet */}
              {currentStep >= 1 && !success && (
                <Box>
                  <Heading size="lg" mb={4} color="orange.600">
                    🔗 Connexion Wallet
                  </Heading>
                  
                  {!isConnected ? (
                    <Button
                      leftIcon={<Text fontSize="xl">🦊</Text>}
                      onClick={connectMetaMask}
                      isLoading={isConnectingMetaMask}
                      loadingText="Connexion..."
                      bg="linear-gradient(145deg, #ff7a00, #e85d00)"
                      color="white"
                      size="lg"
                      _hover={{
                        bg: "linear-gradient(145deg, #ff8500, #f06800)",
                        transform: 'translateY(-2px)',
                      }}
                      borderRadius="xl"
                    >
                      Connecter MetaMask
                    </Button>
                  ) : (
                    <Box bg="black" p={4} borderRadius="xl">
                      <HStack>
                        <Text fontSize="xl">✅</Text>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold" color="green.500">
                            Wallet connecté avec succès
                          </Text>
                          <Text fontSize="sm" color="green.700">
                            {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                          </Text>
                          {isPreApproved && (
                            <Badge colorScheme="orange" variant="subtle">
                              ✅ Pré-approuvé pour la communauté
                            </Badge>
                          )}
                        </VStack>
                      </HStack>
                    </Box>
                  )}
                </Box>
              )}

              {/* Étape 3: Formulaire d'inscription */}
              {isConnected && isPreApproved && !success && (
                <Box as="form" onSubmit={handleSubmit}>
                  <Heading size="lg" mb={6} color="orange.600">
                    📝 Inscription à la Communauté
                  </Heading>
                  
                  <VStack spacing={6}>
                    {/* Informations utilisateur */}
                    <FormControl isRequired>
                      <FormLabel color="white" fontWeight="600">
                        Nom d'utilisateur
                      </FormLabel>
                      <Input
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="Votre nom d'utilisateur"
                        borderRadius="xl"
                        bg="white"
                        color="black"
                        borderColor="gray.200"
                        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' }}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel color="white" fontWeight="600">
                        Email de contact
                      </FormLabel>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="votre@email.com"
                        borderRadius="xl"
                        bg="white"
                        color="black"
                        borderColor="gray.200"
                        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' }}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel color="white" fontWeight="600">
                        Téléphone (pour signalement absences)
                      </FormLabel>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+262 692 XX XX XX"
                        borderRadius="xl"
                        bg="white"
                        color="black"
                        borderColor="gray.200"
                        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' }}
                      />
                    </FormControl>

                    {/* Acceptations obligatoires */}
                    <Box w="full">
                      <Heading size="md" mb={4} color="orange.600">
                        Acceptations Obligatoires
                      </Heading>
                      
                      <VStack spacing={4} align="start">
                        <Checkbox
                          isChecked={formData.charterAccepted}
                          onChange={(e) => handleInputChange('charterAccepted', e.target.checked)}
                          colorScheme="purple"
                          size="md"
                        >
                          <Text fontSize="sm">
                            J'ai lu et j'accepte intégralement la{' '}
                            <Link color="purple.600" onClick={onCharterOpen} textDecoration="underline">
                              Charte de la Communauté RMR
                            </Link>
                          </Text>
                        </Checkbox>

                        <Checkbox
                          isChecked={formData.participationConfirmed}
                          onChange={(e) => handleInputChange('participationConfirmed', e.target.checked)}
                          colorScheme="purple"
                          size="md"
                        >
                          <Text fontSize="sm">
                            Je m'engage à participer aux formations quotidiennes (21h30 GMT+3) 
                            et à respecter la règle des absences (max 4/6 sessions)
                          </Text>
                        </Checkbox>

                        <Checkbox
                          isChecked={formData.responsibilityAccepted}
                          onChange={(e) => handleInputChange('responsibilityAccepted', e.target.checked)}
                          colorScheme="orange"
                          size="md"
                        >
                          <Text fontSize="sm" fontWeight="medium" color="white">
                            J'accepte la responsabilité totale de mes décisions d'investissement 
                            et comprends que toute décision sera ma décision personnelle
                          </Text>
                        </Checkbox>

                        <Checkbox
                          isChecked={formData.respectConfirmed}
                          onChange={(e) => handleInputChange('respectConfirmed', e.target.checked)}
                          colorScheme="purple"
                          size="md"
                        >
                          <Text fontSize="sm">
                            Je m'engage à maintenir un comportement respectueux en toutes 
                            circonstances au sein de la communauté
                          </Text>
                        </Checkbox>
                      </VStack>
                    </Box>

                    {/* Informations importantes */}
                    <Box bg="blue.50" p={4} borderRadius="xl" w="full">
                      <HStack align="start">
                        <Text fontSize="xl">📞</Text>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold" color="blue.800">
                            Canaux de Communication
                          </Text>
                          <Text fontSize="sm" color="blue.700">
                            Pour signaler vos absences, utilisez : WhatsApp, SMS, Téléphone, 
                            Email, Telegram ou Messenger. Les contacts vous seront fournis 
                            après votre inscription.
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>

                    {/* Bouton de soumission */}
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
                      isLoading={isLoading}
                      loadingText="Inscription en cours..."
                      disabled={!isFormValid() || isLoading}
                      borderRadius="xl"
                      py={6}
                      fontSize="lg"
                      fontWeight="600"
                      leftIcon={<Text fontSize="xl">🌟</Text>}
                    >
                      Rejoindre la Communauté RMR
                    </Button>
                  </VStack>
                </Box>
              )}

              {/* Étape 4: Message de succès */}
              {success && (
                <Box textAlign="center">
                  <Box bg="green.50" borderRadius="xl" p={8}>
                    <Text fontSize="5xl" mb={4}>🎉</Text>
                    <Heading size="xl" color="green.800" mb={4}>
                      Bienvenue dans la Communauté RMR-M !
                    </Heading>
                    <VStack spacing={3} color="green.700">
                      <HStack>
                        <Text fontSize="xl">✅</Text>
                        <Text>Votre inscription a été enregistrée avec succès</Text>
                      </HStack>
                      <HStack>
                        <Text fontSize="xl">✅</Text>
                        <Text>Vous recevrez bientôt un email de bienvenue</Text>
                      </HStack>
                      <HStack>
                        <Text fontSize="xl">✅</Text>
                        <Text>Les liens pour rejoindre nos groupes vous seront envoyés</Text>
                      </HStack>
                    </VStack>
                    
                    <Box mt={6} bg="blue.50" borderRadius="lg" p={4}>
                      <Heading size="md" color="blue.800" mb={2}>
                        📅 Prochaines Étapes :
                      </Heading>
                      <VStack spacing={2} fontSize="sm" color="blue.700">
                        <Text>1. Attendre l'email de confirmation avec les détails</Text>
                        <Text>2. Rejoindre le groupe WhatsApp</Text>
                        <Text>3. Participer à la prochaine formation webinaire (21h30 GMT+4)</Text>
                        <Text>4. Une fois formé, voir comment accéder à la plateforme de récompense</Text>
                      </VStack>
                    </Box>
                  </Box>
                </Box>
              )}
            </VStack>
          </Box>
        </Container>
      </Flex>

      {/* Modal Charte */}
      <Modal isOpen={isCharterOpen} onClose={onCharterClose} size="xl">
        <ModalOverlay />
        <ModalContent maxH="80vh">
          <ModalHeader>Charte de la Communauté RMR</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflow="auto">
            <VStack spacing={4} align="start">
              <Box>
                <Heading size="md" mb={2}>1. Participation aux Formations</Heading>
                <Text fontSize="sm" color="gray.600">
                  • Horaire : Tous les soirs à 21h30 (GMT+3)<br/>
                  • Tolérance : 4 absences maximum sur 6 sessions<br/>
                  • Signalement obligatoire des absences
                </Text>
              </Box>
              
              <Box>
                <Heading size="md" mb={2}>2. Respect et Comportement</Heading>
                <Text fontSize="sm" color="gray.600">
                  • Aucune insulte, provocation ou menace tolérée<br/>
                  • Bienveillance et entraide privilégiées<br/>
                  • Confidentialité des informations partagées
                </Text>
              </Box>
              
              <Box>
                <Heading size="md" mb={2}>3. Responsabilité</Heading>
                <Text fontSize="sm" color="gray.600">
                  • Vous êtes responsable de toutes vos décisions d'investissement<br/>
                  • Aucune garantie de résultat financier<br/>
                  • Application volontaire des enseignements reçus
                </Text>
              </Box>

              <Box>
                <Heading size="md" mb={2}>4. Sanctions</Heading>
                <Text fontSize="sm" color="gray.600">
                  • Avertissement pour manquements mineurs<br/>
                  • Suspension temporaire pour récidive<br/>
                  • Exclusion définitive pour manquements graves
                </Text>
              </Box>

              <Box bg="yellow.50" p={4} borderRadius="md">
                <Text fontSize="sm" fontWeight="bold" color="orange.800">
                  ⚠️ Important : En acceptant cette charte, vous vous engagez à respecter 
                  toutes ces règles. Le non-respect peut entraîner votre exclusion de la communauté.
                </Text>
              </Box>

              <Divider />

              <Box>
                <Heading size="md" mb={2}>5. Formations et Éducation</Heading>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Notre communauté propose des formations régulières sur :
                </Text>
                <VStack spacing={1} align="start" fontSize="sm" color="gray.600">
                  <Text>• Fondamentaux des cryptomonnaies</Text>
                  <Text>• Analyse technique et fondamentale</Text>
                  <Text>• Identification et prévention des arnaques</Text>
                  <Text>• Sécurisation des wallets et clés privées</Text>
                  <Text>• Stratégies de gestion des risques</Text>
                  <Text>• Utilisation sécurisée de la plateforme de récompense CryptocaVault</Text>
                </VStack>
              </Box>

              <Box>
                <Heading size="md" mb={2}>6. Communication et Support</Heading>
                <Text fontSize="sm" color="gray.600">
                  • Canaux officiels : WhatsApp, Telegram, Discord<br/>
                  • Support prioritaire pour les membres actifs<br/>
                  • Partage d'expériences encouragé<br/>
                  • Questions bienvenues pendant les sessions
                </Text>
              </Box>

              <Box>
                <Heading size="md" mb={2}>7. Progression vers la Plateforme</Heading>
                <Text fontSize="sm" color="gray.600">
                  Après avoir démontré votre engagement dans la communauté, vous pourrez :
                </Text>
                <VStack spacing={1} align="start" fontSize="sm" color="gray.600" mt={2}>
                  <Text>• Demander l'accès à la plateforme de trading</Text>
                  <Text>• Accéder aux stratégies premium</Text>
                  <Text>• Participer aux pools de récompenses</Text>
                  <Text>• Bénéficier d'un accompagnement personnalisé</Text>
                </VStack>
              </Box>

              <Box bg="blue.50" p={4} borderRadius="md">
                <Text fontSize="sm" fontWeight="bold" color="blue.800" mb={2}>
                  📚 Objectif de la Communauté
                </Text>
                <Text fontSize="sm" color="blue.700">
                  Notre mission est de vous éduquer et vous accompagner pour que vous puissiez 
                  prendre des décisions éclairées en toute sécurité dans l'univers des cryptomonnaies.
                </Text>
              </Box>

              <Box bg="orange.50" p={4} borderRadius="md">
                <Text fontSize="sm" fontWeight="bold" color="orange.800" mb={2}>
                  ⚠️ Avertissement Final
                </Text>
                <Text fontSize="sm" color="orange.700">
                  Les cryptomonnaies sont hautement volatiles et comportent des risques significatifs. 
                  N'investissez jamais plus que ce que vous pouvez vous permettre de perdre. 
                  Cette communauté fournit de l'éducation, pas des conseils d'investissement.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <VStack spacing={3} w="full">
              <Button colorScheme="blue" onClick={onCharterClose} w="full">
                J'ai lu et compris la charte
              </Button>
              <Text fontSize="xs" color="gray.500" textAlign="center">
                La charte complète est également disponible sur notre site web
              </Text>
            </VStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CommunityRegistrationPage;