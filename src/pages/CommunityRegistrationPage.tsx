// src/pages/CommunityRegistrationPage.tsx
import React, { useState } from 'react';
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
  Container,
  useColorModeValue,
  useToast,
  Flex,
  Divider,
  useBreakpointValue,
  Checkbox,
  Link,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
  FormErrorMessage,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

// Types
interface CommunityRegistrationForm {
  firstName: string;       // Nouveau champ prénom
  lastName: string;        // Nouveau champ nom
  username: string;
  email: string;
  phone: string;
  referrerName: string;    // Nouveau champ référent
  charterAccepted: boolean;
  participationConfirmed: boolean;
  responsibilityAccepted: boolean;
  respectConfirmed: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  referrerName?: string;
  [key: string]: string | undefined;
}

const CommunityRegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState<CommunityRegistrationForm>({
    firstName: '',           // Initialisation prénom
    lastName: '',            // Initialisation nom
    username: '',
    email: '',
    phone: '',
    referrerName: '',        // Initialisation référent
    charterAccepted: false,
    participationConfirmed: false,
    responsibilityAccepted: false,
    respectConfirmed: false
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const navigate = useNavigate();

  const toast = useToast();
  const { isOpen: isCharterOpen, onOpen: onCharterOpen, onClose: onCharterClose } = useDisclosure();

  // Styles Chakra UI
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)');

  // Responsive values
  const containerMaxW = useBreakpointValue({ base: 'sm', md: 'lg', lg: 'xl' });
  const cardPadding = useBreakpointValue({ base: 4, md: 8, lg: 10 });
  const headingSize = useBreakpointValue({ base: 'lg', md: 'xl', lg: '2xl' });
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const buttonFontSize = useBreakpointValue({ base: 'sm', md: 'md', lg: 'lg' });
  const iconSize = useBreakpointValue({ base: 'md', md: 'lg', lg: 'xl' });
  const buttonHeight = useBreakpointValue({ base: '12', md: '14', lg: '16' });

  // Fonction pour envoyer une notification email à l'administrateur
  const sendAdminNotification = async (memberData: any) => {
    try {
      console.log('📧 Envoi notification admin pour:', memberData.username);
      
      const response = await fetch('/api/send-admin-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberData: {
            username: memberData.username,
            first_name: memberData.first_name,
            last_name: memberData.last_name, 
            email: memberData.email,
            phone: memberData.phone,
            referrer_name: memberData.referrer_name,
            registrationDate: memberData.acceptance_timestamp,
            registrationIP: memberData.acceptance_ip
          }
        })
      });

      if (!response.ok) {
        let errorMessage = `Erreur HTTP ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('❌ Erreur API:', errorData);
        } catch (parseError) {
          console.warn('Impossible de parser la réponse d\'erreur');
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.fallback) {
        console.warn('⚠️ Email envoyé en mode fallback:', result.message);
      } else {
        console.log('✅ Email admin envoyé avec succès:', result.message);
      }
      
      return result;

    } catch (error) {
      console.error('❌ Erreur notification admin:', error);
      
      if (error.message.includes('fetch')) {
        console.error('🔍 Vérifiez que les deux serveurs tournent:');
        console.error('   - Backend: http://localhost:3001/health');
        console.error('   - Frontend: http://localhost:5173');
      }
      
      throw error;
    }
  };

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

  // Démarrer l'inscription
  const startRegistration = () => {
    setCurrentStep(2);
  };

  // Gestion des changements de formulaire
  const handleInputChange = (field: keyof CommunityRegistrationForm, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Effacer l'erreur du champ modifié
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Validation prénom
    if (!formData.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    // Validation nom
    if (!formData.lastName.trim()) {
      errors.lastName = 'Le nom est requis';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    // Validation nom du référent
    if (!formData.referrerName.trim()) {
      errors.referrerName = 'Le nom de la personne qui vous a conduit ici est requis';
    } else if (formData.referrerName.trim().length < 2) {
      errors.referrerName = 'Le nom doit contenir au moins 2 caractères';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Vérifier si le formulaire est valide
  const isFormValid = (): boolean => {
    return (
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.username.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.referrerName.trim() !== '' &&
      formData.charterAccepted &&
      formData.participationConfirmed &&
      formData.responsibilityAccepted &&
      formData.respectConfirmed
    );
  };

  // Fonction d'inscription simplifiée
  const registerCommunityMember = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Valider le formulaire
      if (!validateForm()) {
        setError('Veuillez corriger les erreurs dans le formulaire.');
        return;
      }

      // Vérifier si l'email n'est pas déjà utilisé
      const { data: existingEmailData, error: checkEmailError } = await supabase
        .from('community_members')
        .select('email')
        .eq('email', formData.email.trim().toLowerCase());

      if (checkEmailError && checkEmailError.code !== 'PGRST116') {
        console.error('Erreur vérification email:', checkEmailError);
        setError('Erreur lors de la vérification de l\'email.');
        return;
      }

      if (existingEmailData && existingEmailData.length > 0) {
        setError('Cette adresse email est déjà utilisée pour une inscription.');
        return;
      }

      // Vérifier si le téléphone n'est pas déjà utilisé (si renseigné)
      if (formData.phone.trim()) {
        const { data: existingPhoneData, error: checkPhoneError } = await supabase
          .from('community_members')
          .select('phone')
          .eq('phone', formData.phone.trim());

        if (checkPhoneError && checkPhoneError.code !== 'PGRST116') {
          console.error('Erreur vérification téléphone:', checkPhoneError);
          setError('Erreur lors de la vérification du téléphone.');
          return;
        }

        if (existingPhoneData && existingPhoneData.length > 0) {
          setError('Ce numéro de téléphone est déjà utilisé pour une inscription.');
          return;
        }
      }

      const userIP = await getUserIP();

      // Créer l'inscription
      const { data, error: insertError } = await supabase
        .from('community_members')
        .insert([{
          first_name: formData.firstName.trim(),      // Nouveau champ
          last_name: formData.lastName.trim(),       // Nouveau champ
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          referrer_name: formData.referrerName.trim(), // Nouveau champ
          acceptance_ip: userIP,
          charter_accepted: true,
          charter_version: '1.0',
          acceptance_timestamp: new Date().toISOString(),
          status: 'pending',
          registration_method: 'public'
        }])
        .select()
        .single();

      if (insertError) {
        throw new Error('Erreur lors de l\'enregistrement: ' + insertError.message);
      }

      // Envoyer un email de notification à l'administrateur
      try {
        await sendAdminNotification(data);
      } catch (emailError) {
        console.error('Erreur envoi email admin:', emailError);
      }

      setSuccess('Inscription réussie ! Vous recevrez bientôt les informations pour rejoindre notre groupe et formations.');
      setCurrentStep(3);

    } catch (error: any) {
      console.error('Erreur inscription:', error);
      setError('Erreur lors de l\'inscription: ' + (error.message || 'Erreur inconnue'));
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
    await registerCommunityMember();
  };

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
        p={{ base: 2, md: 4 }}
        position="relative"
        zIndex={1}
      >
        <Box maxW="650px" w="full" mx="auto">
          <Box
            bg={cardBg}
            backdropFilter="blur(20px)"
            border="1px solid rgba(255, 255, 255, 0.2)"
            borderRadius={{ base: 'xl', md: '2xl', lg: '3xl' }}
            shadow="2xl"
            p={cardPadding}
            position="relative"
            overflow="hidden"
            w="full"
          >
            {/* En-tête */}
            <VStack spacing={{ base: 4, md: 6 }} align="stretch">
              <Box textAlign="center">
                <Box
                  p={{ base: 3, md: 4, lg: 6 }}
                  bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  rounded="full"
                  shadow="xl"
                  w={{ base: 14, md: 16, lg: 20 }}
                  h={{ base: 14, md: 16, lg: 20 }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb={4}
                >
                  <Text fontSize={{ base: "xl", md: "2xl", lg: "4xl" }} fontWeight="bold" color="white">🌟</Text>
                </Box>
                
                <Heading
                  size={headingSize}
                  bgGradient="linear(to-r, #667eea, #764ba2)"
                  bgClip="text"
                  textAlign="center"
                  fontWeight="800"
                  lineHeight="1.2"
                  mb={2}
                  px={{ base: 2, md: 0 }}
                >
                  Rejoindre la Communauté RMR-M
                </Heading>
                
                <Text
                  fontSize={{ base: "xs", md: "sm", lg: "lg" }}
                  color="gray.600"
                  textAlign="center"
                  px={{ base: 2, md: 0 }}
                  lineHeight={{ base: "1.3", md: "1.5" }}
                >
                  Vous avez été invité(e) à rejoindre notre communauté privée d'éducation crypto
                </Text>
              </Box>

              {/* Barre de progression */}
              <Box>
                <Text fontSize={{ base: "xs", md: "sm" }} color="orange.600" mb={2}>
                  Étape {currentStep} sur 3
                </Text>
                <Progress 
                  value={(currentStep / 3) * 100} 
                  colorScheme="purple" 
                  size="sm" 
                  borderRadius="full"
                />
              </Box>

              {/* Messages d'erreur et succès */}
              {error && (
                <Alert status="error" borderRadius="xl">
                  <AlertIcon />
                  <Text fontSize={{ base: "xs", md: "sm" }}>{error}</Text>
                </Alert>
              )}

              {success && (
                <Alert status="success" borderRadius="xl">
                  <AlertIcon />
                  <Text fontSize={{ base: "xs", md: "sm" }}>{success}</Text>
                </Alert>
              )}

              {/* Étape 1: Présentation Charte */}
              {currentStep === 1 && !success && (
                <Box>
                  <Heading size={{ base: "md", md: "lg" }} mb={4} color="orange.600">
                    📋 Charte de la Communauté
                  </Heading>
                  
                  <Box bg="blue.50" borderRadius="xl" p={{ base: 4, md: 6 }} mb={4}>
                    <Heading size={{ base: "sm", md: "md" }} color="blue.800" mb={3}>
                      Points Clés à Retenir :
                    </Heading>
                    <VStack spacing={3} align="start">
                      <HStack align="start">
                        <Text fontSize={{ base: "md", md: "lg", lg: "xl" }}>🕘</Text>
                        <Text fontSize={{ base: "xs", md: "sm" }} color="blue.700" lineHeight="1.4">
                          <Text as="span" fontWeight="bold">Formations quotidiennes</Text> : Tous les soirs à 21h30 (GMT+3)
                        </Text>
                      </HStack>
                      <HStack align="start">
                        <Text fontSize={{ base: "md", md: "lg", lg: "xl" }}>📅</Text>
                        <Text fontSize={{ base: "xs", md: "sm" }} color="blue.700" lineHeight="1.4">
                          <Text as="span" fontWeight="bold">Règle d'absence</Text> : Maximum 4 absences sur 6 sessions
                        </Text>
                      </HStack>
                      <HStack align="start">
                        <Text fontSize={{ base: "md", md: "lg", lg: "xl" }}>🤝</Text>
                        <Text fontSize={{ base: "xs", md: "sm" }} color="blue.700" lineHeight="1.4">
                          <Text as="span" fontWeight="bold">Respect absolu</Text> : Aucune insulte, provocation ou commentaire haineux
                        </Text>
                      </HStack>
                      <HStack align="start">
                        <Text fontSize={{ base: "md", md: "lg", lg: "xl" }}>💪</Text>
                        <Text fontSize={{ base: "xs", md: "sm" }} color="blue.700" lineHeight="1.4">
                          <Text as="span" fontWeight="bold">Responsabilité personnelle</Text> : Vous êtes responsable de toutes vos décisions
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>

                  <Button
                    leftIcon={<Icon as={ExternalLinkIcon} boxSize={{ base: 3, md: 4 }} />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={onCharterOpen}
                    mb={6}
                    size={buttonSize}
                    fontSize={buttonFontSize}
                    h={buttonHeight}
                    w="full"
                    whiteSpace="normal"
                    textAlign="center"
                  >
                    Lire la Charte Complète
                  </Button>

                  <Button
                    onClick={startRegistration}
                    bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    color="white"
                    size={buttonSize}
                    width="full"
                    _hover={{
                      bg: "linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%)",
                      transform: 'translateY(-2px)',
                    }}
                    borderRadius="xl"
                    h={buttonHeight}
                    fontSize={buttonFontSize}
                    fontWeight="600"
                    leftIcon={<Text fontSize={iconSize}>📝</Text>}
                    whiteSpace="normal"
                    textAlign="center"
                    px={{ base: 4, md: 6 }}
                  >
                    <Text lineHeight="1.2">
                      M'inscrire à la Communauté
                    </Text>
                  </Button>

                  <Button
                    variant="outline"
                    size={buttonSize}
                    onClick={() => navigate('/login')}
                    borderColor="white"
                    color="white"
                    _hover={{ bg: "rgba(255,255,255,0.1)" }}
                    borderRadius="xl"
                    w="full"
                    h={buttonHeight}
                    fontSize={buttonFontSize}
                    mt={4}
                  >
                    Retour à la connexion
                  </Button>
                </Box>
              )}

              {/* Étape 2: Formulaire d'inscription */}
              {currentStep === 2 && !success && (
                <Box as="form" onSubmit={handleSubmit}>
                  <Heading size={{ base: "md", md: "lg" }} mb={6} color="orange.600">
                    📝 Inscription à la Communauté
                  </Heading>
                  
                  <VStack spacing={{ base: 4, md: 6 }}>
                    {/* Prénom et Nom */}
                    <HStack spacing={4} w="full">
                      <FormControl isRequired isInvalid={!!formErrors.firstName}>
                        <FormLabel color="white" fontWeight="600" fontSize={{ base: "sm", md: "md" }}>
                          Prénom *
                        </FormLabel>
                        <Input
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          placeholder="Votre prénom"
                          borderRadius="xl"
                          bg="white"
                          color="black"
                          borderColor="gray.200"
                          _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' }}
                          size={{ base: "md", md: "lg" }}
                        />
                        <FormErrorMessage fontSize="xs">{formErrors.firstName}</FormErrorMessage>
                      </FormControl>

                      <FormControl isRequired isInvalid={!!formErrors.lastName}>
                        <FormLabel color="white" fontWeight="600" fontSize={{ base: "sm", md: "md" }}>
                          Nom *
                        </FormLabel>
                        <Input
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          placeholder="Votre nom de famille"
                          borderRadius="xl"
                          bg="white"
                          color="black"
                          borderColor="gray.200"
                          _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' }}
                          size={{ base: "md", md: "lg" }}
                        />
                        <FormErrorMessage fontSize="xs">{formErrors.lastName}</FormErrorMessage>
                      </FormControl>
                    </HStack>

                    {/* Nom d'utilisateur */}
                    <FormControl isRequired>
                      <FormLabel color="white" fontWeight="600" fontSize={{ base: "sm", md: "md" }}>
                        Nom d'utilisateur *
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
                        size={{ base: "md", md: "lg" }}
                      />
                    </FormControl>

                    {/* Email */}
                    <FormControl isRequired>
                      <FormLabel color="white" fontWeight="600" fontSize={{ base: "sm", md: "md" }}>
                        Email de contact *
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
                        size={{ base: "md", md: "lg" }}
                      />
                    </FormControl>

                    {/* Téléphone */}
                    <FormControl>
                      <FormLabel color="white" fontWeight="600" fontSize={{ base: "sm", md: "md" }}>
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
                        size={{ base: "md", md: "lg" }}
                      />
                    </FormControl>

                    {/* Nom de la personne qui vous a conduit ici */}
                    <FormControl isRequired isInvalid={!!formErrors.referrerName}>
                      <FormLabel color="white" fontWeight="600" fontSize={{ base: "sm", md: "md" }}>
                        👤 Nom de la personne qui vous a conduit ici *
                      </FormLabel>
                      <Input
                        value={formData.referrerName}
                        onChange={(e) => handleInputChange('referrerName', e.target.value)}
                        placeholder="Prénom et nom de votre référent"
                        borderRadius="xl"
                        bg="white"
                        color="black"
                        borderColor="gray.200"
                        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' }}
                        size={{ base: "md", md: "lg" }}
                      />
                      <FormErrorMessage fontSize="xs">{formErrors.referrerName}</FormErrorMessage>
                    </FormControl>

                    {/* Acceptations obligatoires */}
                    <Box w="full">
                      <Heading size={{ base: "sm", md: "md" }} mb={4} color="orange.600">
                        Acceptations Obligatoires
                      </Heading>
                      
                      <VStack spacing={4} align="start">
                        <Checkbox
                          isChecked={formData.charterAccepted}
                          onChange={(e) => handleInputChange('charterAccepted', e.target.checked)}
                          colorScheme="purple"
                          size={{ base: "sm", md: "md" }}
                        >
                          <Text fontSize={{ base: "xs", md: "sm" }} color="white" lineHeight="1.4">
                            J'ai lu et j'accepte intégralement la{' '}
                            <Link color="purple.300" onClick={onCharterOpen} textDecoration="underline">
                              Charte de la Communauté RMR
                            </Link>
                          </Text>
                        </Checkbox>

                        <Checkbox
                          isChecked={formData.participationConfirmed}
                          onChange={(e) => handleInputChange('participationConfirmed', e.target.checked)}
                          colorScheme="purple"
                          size={{ base: "sm", md: "md" }}
                        >
                          <Text fontSize={{ base: "xs", md: "sm" }} color="white" lineHeight="1.4">
                            Je m'engage à participer aux formations quotidiennes (21h30 GMT+3) 
                            et à respecter la règle des absences (max 4/6 sessions)
                          </Text>
                        </Checkbox>

                        <Checkbox
                          isChecked={formData.responsibilityAccepted}
                          onChange={(e) => handleInputChange('responsibilityAccepted', e.target.checked)}
                          colorScheme="orange"
                          size={{ base: "sm", md: "md" }}
                        >
                          <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="medium" color="white" lineHeight="1.4">
                            J'accepte la responsabilité totale de mes décisions d'investissement 
                            et comprends que toute décision sera ma décision personnelle
                          </Text>
                        </Checkbox>

                        <Checkbox
                          isChecked={formData.respectConfirmed}
                          onChange={(e) => handleInputChange('respectConfirmed', e.target.checked)}
                          colorScheme="purple"
                          size={{ base: "sm", md: "md" }}
                        >
                          <Text fontSize={{ base: "xs", md: "sm" }} color="white" lineHeight="1.4">
                            Je m'engage à maintenir un comportement respectueux en toutes 
                            circonstances au sein de la communauté
                          </Text>
                        </Checkbox>
                      </VStack>
                    </Box>

                    {/* Informations importantes */}
                    <Box bg="blue.50" p={4} borderRadius="xl" w="full">
                      <HStack align="start">
                        <Text fontSize={{ base: "md", md: "lg", lg: "xl" }}>📞</Text>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold" color="blue.800" fontSize={{ base: "xs", md: "sm" }}>
                            Canaux de Communication
                          </Text>
                          <Text fontSize={{ base: "xs", md: "sm" }} color="blue.700" lineHeight="1.5">
                            Pour signaler vos absences, utilisez : WhatsApp, SMS, Téléphone, 
                            Email, Telegram ou Messenger. Les contacts vous seront fournis 
                            après votre inscription.
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>

                    {/* Boutons d'action */}
                    <VStack spacing={3} w="full">
                      <Button
                        variant="outline"
                        size={buttonSize}
                        onClick={() => setCurrentStep(1)}
                        borderColor="white"
                        color="white"
                        _hover={{ bg: "rgba(255,255,255,0.1)" }}
                        borderRadius="xl"
                        w="full"
                        h={buttonHeight}
                        fontSize={buttonFontSize}
                      >
                        Retour
                      </Button>

                      <Button
                        type="submit"
                        size={buttonSize}
                        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        color="white"
                        _hover={{
                          transform: 'translateY(-2px)',
                          shadow: 'xl',
                          bg: 'linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%)',
                        }}
                        isLoading={isLoading}
                        loadingText="Inscription..."
                        disabled={!isFormValid() || isLoading}
                        borderRadius="xl"
                        fontSize={buttonFontSize}
                        fontWeight="600"
                        leftIcon={<Text fontSize={iconSize}>🌟</Text>}
                        w="full"
                        h={buttonHeight}
                        whiteSpace="normal"
                        textAlign="center"
                        px={{ base: 4, md: 6 }}
                      >
                        <Text lineHeight="1.2">
                          Confirmer mon Inscription
                        </Text>
                      </Button>
                    </VStack>
                  </VStack>
                </Box>
              )}

              {/* Étape 3: Message de succès */}
              {success && currentStep === 3 && (
                <Box textAlign="center">
                  <Box bg="green.50" borderRadius="xl" p={{ base: 6, md: 8 }}>
                    <Text fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }} mb={4}>🎉</Text>
                    <Heading size={{ base: "lg", md: "xl" }} color="green.800" mb={4}>
                      Bienvenue dans la Communauté RMR-M !
                    </Heading>
                    <VStack spacing={3} color="green.700">
                      <HStack>
                        <Text fontSize={{ base: "md", md: "lg", lg: "xl" }}>✅</Text>
                        <Text fontSize={{ base: "xs", md: "sm" }}>Votre inscription a été enregistrée avec succès</Text>
                      </HStack>
                      <HStack>
                        <Text fontSize={{ base: "md", md: "lg", lg: "xl" }}>✅</Text>
                        <Text fontSize={{ base: "xs", md: "sm" }}>Vous recevrez bientôt un email de bienvenue</Text>
                      </HStack>
                      <HStack>
                        <Text fontSize={{ base: "md", md: "lg", lg: "xl" }}>✅</Text>
                        <Text fontSize={{ base: "xs", md: "sm" }}>Les liens pour rejoindre nos groupes vous seront envoyés</Text>
                      </HStack>
                    </VStack>
                    
                    <Box mt={6} bg="blue.50" borderRadius="lg" p={4}>
                      <Heading size={{ base: "sm", md: "md" }} color="blue.800" mb={2}>
                        📅 Prochaines Étapes :
                      </Heading>
                      <VStack spacing={2} fontSize={{ base: "xs", md: "sm" }} color="blue.700">
                        <Text>1. Attendre l'email de confirmation avec les détails</Text>
                        <Text>2. Rejoindre le groupe WhatsApp</Text>
                        <Text>3. Participer à la prochaine formation webinaire (21h30 GMT+4)</Text>
                        <Text>4. Une fois formé, voir comment accéder à la plateforme de récompense</Text>
                      </VStack>
                    </Box>

                    <Button
                      variant="outline"
                      size={buttonSize}
                      onClick={() => navigate('/login')}
                      bg="purple.300"
                      borderColor="blue.500"
                      color="orange.800"
                      _hover={{
                        bg: "blue.400"
                      }}
                      borderRadius="xl"
                      w="full"
                      h={buttonHeight}
                      fontSize={buttonFontSize}
                      mt={4}
                    >
                      Retour à la connexion
                    </Button>
                  </Box>
                </Box>
              )}
            </VStack>
          </Box>
        </Box>
      </Flex>

      {/* Modal Charte */}
      <Modal isOpen={isCharterOpen} onClose={onCharterClose} size={{ base: "full", md: "xl" }}>
        <ModalOverlay />
        <ModalContent maxH="80vh" mx={{ base: 2, md: 0 }}>
          <ModalHeader fontSize={{ base: "md", md: "lg" }} color="orange.600">Charte de la Communauté RMR</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflow="auto">
            <VStack spacing={4} align="start">
              <Box>
                <Heading size={{ base: "sm", md: "md" }} mb={2} color="black">1. Participation aux Formations</Heading>
                <Text fontSize={{ base: "xs", md: "sm" }} color="white.600" lineHeight="1.4">
                  • Horaire : Tous les soirs à 21h30 (GMT+3)<br/>
                  • Tolérance : 4 absences maximum sur 6 sessions<br/>
                  • Signalement obligatoire des absences
                </Text>
              </Box>
              
              <Box>
                <Heading size={{ base: "sm", md: "md" }} mb={2} color="black">2. Respect et Comportement</Heading>
                <Text fontSize={{ base: "xs", md: "sm" }} color="white.600" lineHeight="1.4">
                  • Aucune insulte, provocation ou menace tolérée<br/>
                  • Bienveillance et entraide privilégiées<br/>
                  • Confidentialité des informations partagées
                </Text>
              </Box>
              
              <Box>
                <Heading size={{ base: "sm", md: "md" }} mb={2} color="black">3. Responsabilité</Heading>
                <Text fontSize={{ base: "xs", md: "sm" }} color="white.600" lineHeight="1.4">
                  • Vous êtes responsable de toutes vos décisions d'investissement<br/>
                  • Aucune garantie de résultat financier<br/>
                  • Application volontaire des enseignements reçus
                </Text>
              </Box>

              <Box>
                <Heading size={{ base: "sm", md: "md" }} mb={2} color="black">4. Sanctions</Heading>
                <Text fontSize={{ base: "xs", md: "sm" }} color="white.600" lineHeight="1.4">
                  • Avertissement pour manquements mineurs<br/>
                  • Suspension temporaire pour récidive<br/>
                  • Exclusion définitive pour manquements graves
                </Text>
              </Box>

              <Box bg="yellow.50" p={4} borderRadius="md">
                <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold" color="orange.800" lineHeight="1.4">
                  ⚠️ Important : En acceptant cette charte, vous vous engagez à respecter 
                  toutes ces règles. Le non-respect peut entraîner votre exclusion de la communauté.
                </Text>
              </Box>

              <Divider />

              <Box>
                <Heading size={{ base: "sm", md: "md" }} mb={2} color="black">5. Formations et Éducation</Heading>
                <Text fontSize={{ base: "xs", md: "sm" }} color="white.600" mb={3} lineHeight="1.4">
                  Notre communauté propose des formations régulières sur :
                </Text>
                <VStack spacing={1} align="start" fontSize={{ base: "xs", md: "sm" }} color="white.600">
                  <Text>• Fondamentaux des cryptomonnaies</Text>
                  <Text>• Analyse technique et fondamentale</Text>
                  <Text>• Identification et prévention des arnaques</Text>
                  <Text>• Sécurisation des wallets et clés privées</Text>
                  <Text>• Stratégies de gestion des risques</Text>
                  <Text>• Utilisation sécurisée de la plateforme de récompense CryptocaVault</Text>
                </VStack>
              </Box>

              <Box>
                <Heading size={{ base: "sm", md: "md" }} mb={2} color="black">6. Communication et Support</Heading>
                <Text fontSize={{ base: "xs", md: "sm" }} color="white.600" lineHeight="1.4">
                  • Canaux officiels : WhatsApp, Telegram, Discord<br/>
                  • Support prioritaire pour les membres actifs<br/>
                  • Partage d'expériences encouragé<br/>
                  • Questions bienvenues pendant les sessions
                </Text>
              </Box>

              <Box bg="blue.50" p={4} borderRadius="md">
                <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold" color="blue.800" mb={2}>
                  📚 Objectif de la Communauté
                </Text>
                <Text fontSize={{ base: "xs", md: "sm" }} color="blue.700" lineHeight="1.4">
                  Notre mission est de vous éduquer et vous accompagner pour que vous puissiez 
                  prendre des décisions éclairées en toute sécurité dans l'univers des cryptomonnaies.
                </Text>
              </Box>

              <Box bg="orange.50" p={4} borderRadius="md">
                <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold" color="orange.800" mb={2}>
                  ⚠️ Avertissement Final
                </Text>
                <Text fontSize={{ base: "xs", md: "sm" }} color="orange.700" lineHeight="1.4">
                  Les cryptomonnaies sont hautement volatiles et comportent des risques significatifs. 
                  N'investissez jamais plus que ce que vous pouvez vous permettre de perdre. 
                  Cette communauté fournit de l'éducation, pas des conseils d'investissement.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter px={{ base: 4, md: 6 }}>
            <VStack spacing={3} w="full">
              <Button 
                colorScheme="blue" 
                onClick={onCharterClose} 
                w="full"
                size={{ base: "md", md: "lg" }}
                fontSize={{ base: "sm", md: "md" }}
                h={{ base: "10", md: "12" }}
                whiteSpace="normal"
                textAlign="center"
              >
                J'ai lu et compris la charte
              </Button>
              <Text fontSize={{ base: "xs", md: "xs" }} color="gray.500" textAlign="center">
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