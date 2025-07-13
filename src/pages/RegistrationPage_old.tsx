// src/pages/RegistrationPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useBreakpointValue,
  Link,
  Divider,
  Icon,
  FormErrorMessage,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  Badge,
  UnorderedList,
  ListItem,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ExternalLinkIcon, CheckCircleIcon, StarIcon, EmailIcon } from '@chakra-ui/icons';
import { supabase, CryptocaVaultDB } from '../lib/supabase';

// Types
interface RegistrationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

const RegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState<RegistrationForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const toast = useToast();
  const navigate = useNavigate();

  // Modal pour les conditions d'utilisation
  const { isOpen: isTermsOpen, onOpen: onTermsOpen, onClose: onTermsClose } = useDisclosure();

  // Styles Chakra UI
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)');

  // Responsive values
  const cardPadding = useBreakpointValue({ base: 6, md: 8 });
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

  // Gestion des changements de formulaire
  const handleInputChange = (field: keyof RegistrationForm, value: string) => {
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

    // Validation email
    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }

    // Validation téléphone
    if (!formData.phone.trim()) {
      errors.phone = 'Le téléphone est requis';
    } else if (!isValidPhone(formData.phone)) {
      errors.phone = 'Format de téléphone invalide';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Valider l'email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Valider le téléphone
  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    return phoneRegex.test(phone);
  };

  // Enregistrer l'inscription
  const handleRegistration = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!validateForm()) {
        setError('Veuillez corriger les erreurs dans le formulaire.');
        return;
      }

      // Vérifier si l'email n'est pas déjà utilisé
      const { data: existingEmail, error: checkError } = await supabase
        .from('public_registrations')
        .select('email')
        .eq('email', formData.email.trim().toLowerCase())
        .single();

      if (existingEmail) {
        setError('Cette adresse email est déjà utilisée pour une inscription.');
        return;
      }

      const userIP = await getUserIP();
      
      // Créer l'inscription publique
      const { data, error: insertError } = await supabase
        .from('public_registrations')
        .insert([{
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            registration_ip: userIP,
            status: 'pending'
        }])
        .select()
        .single();

      if (insertError) {
        throw new Error('Erreur lors de l\'enregistrement: ' + insertError.message);
      }

      // Log d'audit
      await CryptocaVaultDB.createAuditLog({
        action: 'public_registration_request',
        wallet_address: 'pending', // Pas encore de wallet
        details: { 
          registrationId: data.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email 
        },
        ip_address: userIP
      });

      setSuccess('Inscription envoyée avec succès ! Votre demande sera examinée par notre équipe.');
      
      // Réinitialiser le formulaire
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      });

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
    await handleRegistration();
  };

  // Fonction pour rediriger vers la page de connexion
  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <>
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
          p={{ base: 4, md: 6 }}
          position="relative"
          zIndex={1}
        >
          <Box maxW="550px" w="full">
            {/* 🎨 CARTE PRINCIPALE */}
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
              mx="auto"
            >
              {/* En-tête */}
              <VStack spacing={6} align="stretch">
                <Box textAlign="center">
                  <Box
                    p={{ base: 3, md: 4 }}
                    bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    rounded="full"
                    shadow="xl"
                    w={{ base: 14, md: 16 }}
                    h={{ base: 14, md: 16 }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mx="auto"
                    mb={4}
                  >
                    <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="white">CV</Text>
                  </Box>
                  
                  <Heading
                    size={{ base: "lg", md: "xl" }}
                    bgGradient="linear(to-r, #667eea, #764ba2)"
                    bgClip="text"
                    textAlign="center"
                    fontWeight="800"
                    lineHeight="1.2"
                    mb={4}
                  >
                    Demande d'inscription à la communauté RMR
                  </Heading>
                  
                  <Text
                    fontSize={{ base: "sm", md: "md" }}
                    color="white"
                    textAlign="center"
                    px={{ base: 2, md: 0 }}
                    mb={4}
                  >
                    Formulaire de demande d'inscription à la communauté privée
                  </Text>
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
                    <VStack align="start" spacing={2}>
                      <Text fontSize={{ base: "sm", md: "md" }} fontWeight="semibold">
                        {success}
                      </Text>
                      <Text fontSize="sm" color="green.600">
                        Vous recevrez un email de confirmation une fois votre demande approuvée.
                      </Text>
                    </VStack>
                  </Alert>
                )}

                {/* 🎯 BOUTON RETOUR VERS LOGIN APRÈS SUCCÈS */}
                {success && (
                  <VStack spacing={4}>
                    <Button
                      size="lg"
                      width="full"
                      bg="green.500"
                      color="white"
                      _hover={{
                        bg: 'green.600',
                        transform: 'translateY(-2px)',
                        shadow: 'xl',
                      }}
                      onClick={handleGoToLogin}
                      borderRadius="xl"
                      py={6}
                      fontSize="lg"
                      fontWeight="600"
                      leftIcon={<Text fontSize="xl">🔑</Text>}
                    >
                      Aller à la page de connexion
                    </Button>
                    
                    <Text fontSize="sm" color="gray.300" textAlign="center">
                      Votre demande a été enregistrée. Vous pouvez maintenant vous connecter 
                      une fois votre inscription approuvée.
                    </Text>
                  </VStack>
                )}

                {/* Avantages de la communauté */}
                {!success && (
                  <Box bg="blue.50" borderRadius="xl" p={4} mb={4}>
                    <Heading size="sm" color="blue.800" mb={3} textAlign="center">
                      🌟 Ce que vous obtiendrez
                    </Heading>
                    <VStack spacing={2} align="start">
                      <HStack>
                        <Icon as={CheckCircleIcon} color="blue.500" />
                        <Text fontSize="xs" color="blue.700">
                          <Text as="span" fontWeight="bold">Formations exclusives</Text> - Apprenez les stratégies crypto
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={StarIcon} color="blue.500" />
                        <Text fontSize="xs" color="blue.700">
                          <Text as="span" fontWeight="bold">Accès plateforme</Text> - Pools de récompenses sécurisés
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={CheckCircleIcon} color="blue.500" />
                        <Text fontSize="xs" color="blue.700">
                          <Text as="span" fontWeight="bold">Protection arnaques</Text> - Évitez les pièges du marché
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={StarIcon} color="blue.500" />
                        <Text fontSize="xs" color="blue.700">
                          <Text as="span" fontWeight="bold">Communauté sélective</Text> - Échanges de qualité
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                )}

                {/* Formulaire d'inscription */}
                {!success && (
                  <Box as="form" onSubmit={handleSubmit}>
                    <VStack spacing={4}>
                      <Heading size="md" color="white" textAlign="center">
                        📝 Vos informations
                      </Heading>
                      
                      {/* Prénom et Nom */}
                      <HStack spacing={3} w="full">
                        <FormControl isRequired isInvalid={!!formErrors.firstName}>
                          <FormLabel color="orange" fontWeight="600" fontSize="sm">
                            Prénom
                          </FormLabel>
                          <Input
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            placeholder="Votre prénom"
                            borderRadius="xl"
                            bg="white"
                            borderColor="gray.200"
                            size="sm"
                            _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' }}
                          />
                          <FormErrorMessage>{formErrors.firstName}</FormErrorMessage>
                        </FormControl>

                        <FormControl isRequired isInvalid={!!formErrors.lastName}>
                          <FormLabel color="orange" fontWeight="600" fontSize="sm">
                            Nom
                          </FormLabel>
                          <Input
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            placeholder="Votre nom"
                            borderRadius="xl"
                            bg="white"
                            borderColor="gray.200"
                            size="sm"
                            _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' }}
                          />
                          <FormErrorMessage>{formErrors.lastName}</FormErrorMessage>
                        </FormControl>
                      </HStack>

                      {/* Email */}
                      <FormControl isRequired isInvalid={!!formErrors.email}>
                        <FormLabel color="orange" fontWeight="600" fontSize="sm">
                          Email
                        </FormLabel>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="votre@email.com"
                          borderRadius="xl"
                          bg="white"
                          borderColor="gray.200"
                          size="sm"
                          _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' }}
                        />
                        <FormErrorMessage>{formErrors.email}</FormErrorMessage>
                      </FormControl>

                      {/* Téléphone */}
                      <FormControl isRequired isInvalid={!!formErrors.phone}>
                        <FormLabel color="orange" fontWeight="600" fontSize="sm">
                          Téléphone
                        </FormLabel>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+262 692 XX XX XX"
                          borderRadius="xl"
                          bg="white"
                          borderColor="gray.200"
                          size="sm"
                          _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' }}
                        />
                        <FormErrorMessage>{formErrors.phone}</FormErrorMessage>
                      </FormControl>

                      {/* Informations importantes */}
                      <Box bg="orange.50" p={3} borderRadius="xl" w="full" border="1px solid" borderColor="orange.200">
                        <HStack align="start">
                          <Text fontSize="lg">ℹ️</Text>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" color="orange.800" fontSize="xs">
                              Processus de validation
                            </Text>
                            <Text fontSize="2xs" color="orange.700">
                              Votre demande sera examinée par notre équipe. Vous recevrez un email 
                              de confirmation si votre profil correspond à nos critères d'admission.
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>

                      {/* Bouton de soumission */}
                      <Button
                        type="submit"
                        size="md"
                        width="full"
                        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        color="white"
                        _hover={{
                          transform: 'translateY(-2px)',
                          shadow: 'xl',
                          bg: 'linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%)',
                        }}
                        isLoading={isLoading}
                        loadingText="Envoi en cours..."
                        disabled={isLoading}
                        borderRadius="xl"
                        py={5}
                        fontSize="md"
                        fontWeight="600"
                        leftIcon={<Text fontSize="lg">📋</Text>}
                      >
                        Envoyer ma Demande
                      </Button>
                    </VStack>
                  </Box>
                )}

                {/* Liens utiles */}
                {!success && (
                  <>
                    <Divider />
                    
                    <VStack spacing={3}>
                      <Text fontSize="xs" color="white" textAlign="center">
                        Déjà approuvé ?{' '}
                        <Link 
                          as={RouterLink} 
                          to="/login" 
                          color="purple.600" 
                          fontWeight="extrabold"
                          _hover={{ textDecoration: 'underline' }}
                        >
                          Connectez-vous ici
                        </Link>
                      </Text>

                      <HStack spacing={3} justify="center">
                        <Link 
                          href="mailto:support@cryptocavault.com" 
                          fontSize="2xs"
                          color="gray.500" 
                          _hover={{ color: 'purple.600' }}
                        >
                          Contact support
                        </Link>
                        <Text fontSize="2xs" color="gray.400">•</Text>
                        <Button
                          variant="link"
                          fontSize="2xs"
                          color="gray.500" 
                          _hover={{ color: 'purple.600' }}
                          onClick={onTermsOpen}
                          height="auto"
                          minH="auto"
                          p={0}
                          fontWeight="normal"
                        >
                          Conditions d'utilisation
                        </Button>
                      </HStack>
                    </VStack>
                  </>
                )}
              </VStack>
            </Box>
          </Box>
        </Flex>
      </Box>

      {/* Modal des Conditions d'Utilisation */}
      <Modal isOpen={isTermsOpen} onClose={onTermsClose} size="6xl" scrollBehavior="inside" isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" backdropFilter="blur(10px)" />
        <ModalContent maxH="95vh" bg="white" borderRadius="2xl" shadow="2xl">
          <ModalHeader bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" borderTopRadius="2xl">
            <VStack spacing={3} align="center">
              <HStack>
                <Box
                  p={2}
                  bg="white"
                  rounded="full"
                  shadow="md"
                >
                  <Text fontSize="xl" fontWeight="bold" bgGradient="linear(to-r, #667eea, #764ba2)" bgClip="text">CV</Text>
                </Box>
                <Heading size="lg" color="white">
                  Conditions d'Utilisation
                </Heading>
              </HStack>
              <Badge bg="white" color="purple.600" px={3} py={1} borderRadius="full">
                Version 1.0 - 24 juin 2025
              </Badge>
            </VStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "rgba(255,255,255,0.2)" }} />
          
          <ModalBody p={8}>
            <VStack spacing={6} align="stretch">
              
              {/* Alerte importante */}
              <Alert status="warning" borderRadius="xl" bg="orange.50" border="2px solid" borderColor="orange.200">
                <AlertIcon color="orange.500" />
                <Box>
                  <Text fontWeight="bold" color="orange.800">
                    ⚠️ Information Importante
                  </Text>
                  <Text color="orange.700" fontSize="sm" mt={1}>
                    En utilisant la plateforme CryptocaVault, vous reconnaissez avoir lu, compris et accepté ces conditions d'utilisation.
                  </Text>
                </Box>
              </Alert>

              {/* Section 1 */}
              <Card>
                <CardBody>
                  <Heading size="md" color="blue.600" mb={3}>
                    1. ACCEPTATION DES CONDITIONS
                  </Heading>
                  <Text color="gray.700" lineHeight="1.7">
                    En accédant à ou en utilisant la plateforme CryptocaVault (ci-après "la Plateforme"), vous acceptez d'être lié par les présentes Conditions d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la Plateforme.
                  </Text>
                </CardBody>
              </Card>

              {/* Contact */}
              <Card bg="blue.50" border="2px solid" borderColor="blue.200">
                <CardBody>
                  <Heading size="md" color="blue.600" mb={3}>
                    CONTACT
                  </Heading>
                  <HStack spacing={2}>
                    <EmailIcon color="blue.500" />
                    <Text color="blue.700">
                      Pour toute question concernant ces conditions, contactez-nous à :{' '}
                      <Link color="blue.500" href="mailto:support@cryptocavault.com" fontWeight="bold">
                        support@cryptocavault.com
                      </Link>
                    </Text>
                  </HStack>
                </CardBody>
              </Card>

            </VStack>
          </ModalBody>
          
          <ModalFooter bg="gray.50" borderBottomRadius="2xl" position="relative" py={8}>
            <Box 
              position="absolute" 
              left="50%" 
              transform="translateX(-50%)"
              mx={16}
            >
              <Button
                colorScheme="blue"
                size="lg"
                onClick={onTermsClose}
                bgGradient="linear(to-r, #667eea, #764ba2)"
                _hover={{
                  bgGradient: "linear(to-r, #5a6fd8, #6b4190)",
                  transform: "translateY(-2px)",
                  shadow: "lg"
                }}
                borderRadius="xl"
                px={12}
                py={4}
              >
                ✓ J'ai lu et compris
              </Button>
            </Box>

            <Box position="absolute" right={6} top="50%" transform="translateY(-50%)">
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  window.open('/conditions-utilisation', '_blank');
                }}
                color="blue.600"
                _hover={{
                  color: "blue.800",
                  textDecoration: "underline"
                }}
                fontWeight="500"
              >
                Voir en page complète
              </Button>
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default RegistrationPage;