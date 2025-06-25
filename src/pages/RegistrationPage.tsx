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

      // Redirection après succès
      setTimeout(() => {
        navigate('/login');
      }, 5000);

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
              <VStack spacing={8} align="stretch">
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
                    mb={6}
                  >
                    <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="bold" color="white">CV</Text>
                  </Box>
                  
                  <Heading
                    size="xl"
                    bgGradient="linear(to-r, #667eea, #764ba2)"
                    bgClip="text"
                    textAlign="center"
                    fontWeight="800"
                    lineHeight="1.2"
                    mb={5}
                  >
                    Demande d'inscription à la communauté RMR
                  </Heading>
                  
                  <Text
                    fontSize={{ base: "md", md: "lg" }}
                    color="white"
                    textAlign="center"
                    px={{ base: 2, md: 0 }}
                    mb={6}
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

                {/* Avantages de la communauté */}
                {!success && (
                  <Box bg="blue.50" borderRadius="xl" p={6} mb={6}>
                    <Heading size="md" color="blue.800" mb={4} textAlign="center">
                      🌟 Ce que vous obtiendrez
                    </Heading>
                    <VStack spacing={3} align="start">
                      <HStack>
                        <Icon as={CheckCircleIcon} color="blue.500" />
                        <Text fontSize="sm" color="blue.700">
                          <Text as="span" fontWeight="bold">Formations exclusives</Text> - Apprenez les stratégies crypto
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={StarIcon} color="blue.500" />
                        <Text fontSize="sm" color="blue.700">
                          <Text as="span" fontWeight="bold">Accès plateforme</Text> - Pools de récompenses sécurisés
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={CheckCircleIcon} color="blue.500" />
                        <Text fontSize="sm" color="blue.700">
                          <Text as="span" fontWeight="bold">Protection arnaques</Text> - Évitez les pièges du marché
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={StarIcon} color="blue.500" />
                        <Text fontSize="sm" color="blue.700">
                          <Text as="span" fontWeight="bold">Communauté sélective</Text> - Échanges de qualité
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                )}

                {/* Formulaire d'inscription */}
                {!success && (
                  <Box as="form" onSubmit={handleSubmit}>
                    <VStack spacing={6}>
                      <Heading size="lg" color="white" textAlign="center">
                        📝 Vos informations
                      </Heading>
                      
                      {/* Prénom et Nom */}
                      <HStack spacing={4} w="full">
                        <FormControl isRequired isInvalid={!!formErrors.firstName}>
                          <FormLabel color="orange" fontWeight="600">
                            Prénom
                          </FormLabel>
                          <Input
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            placeholder="Votre prénom"
                            borderRadius="xl"
                            bg="black-100"
                            borderColor="gray.200"
                            _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' }}
                          />
                          <FormErrorMessage>{formErrors.firstName}</FormErrorMessage>
                        </FormControl>

                        <FormControl isRequired isInvalid={!!formErrors.lastName}>
                          <FormLabel color="orange" fontWeight="600">
                            Nom
                          </FormLabel>
                          <Input
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            placeholder="Votre nom"
                            borderRadius="xl"
                            bg="black-100"
                            borderColor="gray.200"
                            _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' }}
                          />
                          <FormErrorMessage>{formErrors.lastName}</FormErrorMessage>
                        </FormControl>
                      </HStack>

                      {/* Email */}
                      <FormControl isRequired isInvalid={!!formErrors.email}>
                        <FormLabel color="orange" fontWeight="600">
                          Email
                        </FormLabel>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="votre@email.com"
                          borderRadius="xl"
                          bg="black"
                          borderColor="gray-200"
                          _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' }}
                        />
                        <FormErrorMessage>{formErrors.email}</FormErrorMessage>
                      </FormControl>

                      {/* Téléphone */}
                      <FormControl isRequired isInvalid={!!formErrors.phone}>
                        <FormLabel color="orange" fontWeight="600">
                          Téléphone
                        </FormLabel>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+262 692 XX XX XX"
                          borderRadius="xl"
                          bg="black"
                          borderColor="gray.200"
                          _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)' }}
                        />
                        <FormErrorMessage>{formErrors.phone}</FormErrorMessage>
                      </FormControl>

                      {/* Informations importantes */}
                      <Box bg="orange.50" p={4} borderRadius="xl" w="full" border="1px solid" borderColor="orange.200">
                        <HStack align="start">
                          <Text fontSize="xl">ℹ️</Text>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" color="orange.800" fontSize="sm">
                              Processus de validation
                            </Text>
                            <Text fontSize="xs" color="orange.700">
                              Votre demande sera examinée par notre équipe. Vous recevrez un email 
                              de confirmation si votre profil correspond à nos critères d'admission.
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
                        loadingText="Envoi en cours..."
                        disabled={isLoading}
                        borderRadius="xl"
                        py={6}
                        fontSize="lg"
                        fontWeight="600"
                        leftIcon={<Text fontSize="xl">📋</Text>}
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
                    
                    <VStack spacing={4}>
                      <Text fontSize="sm" color="white" textAlign="center">
                        Déjà approuvé ?{' '}
                        <Link 
                          as="a" 
                          href="/login" 
                          color="purple.600" 
                          fontWeight="extrabold"
                          _hover={{ textDecoration: 'underline' }}
                        >
                          Connectez-vous ici
                        </Link>
                      </Text>

                      <HStack spacing={4} justify="center">
                        <Link 
                          href="mailto:support@cryptocavault.com" 
                          fontSize="xs" 
                          color="gray.500" 
                          _hover={{ color: 'purple.600' }}
                        >
                          Contact support
                        </Link>
                        <Text fontSize="xs" color="gray.400">•</Text>
                        <Button
                          variant="link"
                          fontSize="xs" 
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
          </Container>
        </Flex>
      </Box>

      {/* Modal des Conditions d'Utilisation */}
      <Modal isOpen={isTermsOpen} onClose={onTermsClose} size="6xl" scrollBehavior="inside"  isCentered>
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
                  <Text color="white" lineHeight="1.7">
                    En accédant à ou en utilisant la plateforme CryptocaVault (ci-après "la Plateforme"), vous acceptez d'être lié par les présentes Conditions d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la Plateforme.
                  </Text>
                </CardBody>
              </Card>

              {/* Section 2 */}
              <Card>
                <CardBody>
                  <Heading size="md" color="blue.600" mb={3}>
                    2. DÉFINITIONS
                  </Heading>
                  <VStack spacing={3} align="stretch">
                    <Box>
                      <Text fontWeight="bold" color="orange">"Plateforme" :</Text>
                      <Text color="white">La plateforme CryptocaVault permettant l'accès aux pools de récompenses via des NFT.</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" color="orange">"NFT" :</Text>
                      <Text color="white">Les jetons non fongibles CryptocaVault donnant accès aux différents niveaux de la Plateforme (Bronze, Argent, Or, Privilège, Fidélité).</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" color="orange">"Pools de Récompenses" :</Text>
                      <Text color="white">Les mécanismes de distribution de récompenses basées sur la performance des stratégies de la Plateforme.</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" color="orange">"Utilisateur" :</Text>
                      <Text color="white">Toute personne accédant à ou utilisant la Plateforme.</Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              {/* Section 3 */}
              <Card>
                <CardBody>
                  <Heading size="md" color="blue.600" mb={3}>
                    3. DESCRIPTION DU SERVICE
                  </Heading>
                  
                  <Heading size="sm" color="black" mb={2}>
                    3.1 Fonctionnement
                  </Heading>
                  <Text color="white" lineHeight="1.7" mb={4}>
                    CryptocaVault est une plateforme offrant un accès basé sur des NFT à des pools de récompenses liés aux performances de stratégies crypto (yield farming DeFi, trading algorithmique, arbitrage, provision de liquidité).
                  </Text>

                  <Heading size="sm" color="black" mb={2}>
                    3.2 Niveaux d'Accès
                  </Heading>
                  <Text color="white" mb={3}>La Plateforme propose 5 niveaux d'accès via NFT :</Text>
                  <UnorderedList spacing={2} color="white" pl={4}>
                    <ListItem><strong>Bronze</strong> (120 USDC) : Pool de Base, multiplicateur 1,2X</ListItem>
                    <ListItem><strong>Argent</strong> (250 USDC) : Pool Amélioré, multiplicateur 1,5X</ListItem>
                    <ListItem><strong>Or</strong> (500 USDC) : Pool Premium, multiplicateur 2,0X</ListItem>
                    <ListItem><strong>Privilège</strong> (1000 USDC) : Pool VIP, multiplicateur 2,5X</ListItem>
                    <ListItem><strong>Fidélité</strong> (Gratuit) : Pool de Base, multiplicateur 1,2X</ListItem>
                  </UnorderedList>

                  <Heading size="sm" color="black" mb={2} mt={4}>
                    3.3 Système de Récompenses
                  </Heading>
                  <Text color="white" lineHeight="1.7">
                    Les récompenses sont exclusivement basées sur la performance réelle des stratégies utilisées par la Plateforme. Aucun rendement fixe n'est garanti.
                  </Text>
                </CardBody>
              </Card>

              {/* Section 4 */}
              <Card>
                <CardBody>
                  <Heading size="md" color="blue.600" mb={3}>
                    4. ÉLIGIBILITÉ ET INSCRIPTION
                  </Heading>
                  
                  <Heading size="sm" color="black" mb={2}>
                    4.1 Conditions d'Éligibilité
                  </Heading>
                  <Text color="white" mb={3}>Pour utiliser la Plateforme, vous devez :</Text>
                  <UnorderedList spacing={2} color="white" pl={4} mb={4}>
                    <ListItem>Être âgé d'au moins 18 ans</ListItem>
                    <ListItem>Avoir la capacité juridique de conclure des contrats</ListItem>
                    <ListItem>Résider dans une juridiction où l'utilisation de la Plateforme est légale</ListItem>
                    <ListItem>Posséder un wallet compatible pour les NFT et cryptomonnaies</ListItem>
                  </UnorderedList>

                  <Heading size="sm" color="black" mb={2}>
                    4.2 Vérification d'Identité
                  </Heading>
                  <Text color="white" lineHeight="1.7">
                    Nous nous réservons le droit de demander une vérification d'identité conforme aux réglementations KYC/AML applicables.
                  </Text>
                </CardBody>
              </Card>

              {/* Section 5 */}
              <Card>
                <CardBody>
                  <Heading size="md" color="blue.600" mb={3}>
                    5. LIMITATION DE RESPONSABILITÉ
                  </Heading>
                  
                  <Alert status="error" mb={3} borderRadius="lg">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold" color="black">5.1 Exclusion de Garanties</Text>
                      <Text fontSize="sm" mt={1}>
                        LA PLATEFORME EST FOURNIE "EN L'ÉTAT" SANS GARANTIE D'AUCUNE SORTE. NOUS DÉCLINONS EXPRESSÉMENT TOUTE GARANTIE DE DISPONIBILITÉ, PERFORMANCE, OU RÉSULTATS SPÉCIFIQUES.
                      </Text>
                    </Box>
                  </Alert>

                  <Alert status="warning" borderRadius="lg">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold" color="black">5.2 Limitation des Dommages</Text>
                      <Text fontSize="sm" mt={1}>
                        EN AUCUN CAS CRYPTOCAVAULT NE SERA RESPONSABLE DE DOMMAGES INDIRECTS, ACCESSOIRES, SPÉCIAUX, OU CONSÉCUTIFS, Y COMPRIS LA PERTE DE PROFITS OU DE DONNÉES.
                      </Text>
                    </Box>
                  </Alert>
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

              {/* Section 6 - Obligations de l'utilisateur */}
              <Card>
                <CardBody>
                  <Heading size="md" color="blue.600" mb={3}>
                    6. OBLIGATIONS DE L'UTILISATEUR
                  </Heading>
                  
                  <Heading size="sm" color="black" mb={2}>
                    6.1 Utilisation Conforme
                  </Heading>
                  <Text color="white" mb={3}>Vous vous engagez à :</Text>
                  <UnorderedList spacing={2} color="white" pl={4} mb={4}>
                    <ListItem>Utiliser la Plateforme conformément aux présentes conditions</ListItem>
                    <ListItem>Fournir des informations exactes et à jour</ListItem>
                    <ListItem>Maintenir la sécurité de votre wallet et clés privées</ListItem>
                    <ListItem>Respecter toutes les lois et réglementations applicables</ListItem>
                  </UnorderedList>

                  <Heading size="sm" color="black" mb={2}>
                    6.2 Interdictions
                  </Heading>
                  <Text color="white" mb={3}>Il est strictement interdit de :</Text>
                  <UnorderedList spacing={2} color="white" pl={4}>
                    <ListItem>Utiliser la Plateforme à des fins illégales</ListItem>
                    <ListItem>Tenter de contourner les mesures de sécurité</ListItem>
                    <ListItem>Manipuler ou interférer avec le fonctionnement de la Plateforme</ListItem>
                    <ListItem>Créer de faux comptes ou utiliser des informations frauduleuses</ListItem>
                  </UnorderedList>
                </CardBody>
              </Card>

              {/* Section 7 - Propriété intellectuelle */}
              <Card>
                <CardBody>
                  <Heading size="md" color="blue.600" mb={3}>
                    7. PROPRIÉTÉ INTELLECTUELLE
                  </Heading>
                  <Text color="white" lineHeight="1.7">
                    Tous les droits de propriété intellectuelle relatifs à la Plateforme appartiennent à CryptocaVault ou à ses concédants de licence. Les NFT confèrent uniquement des droits d'utilisation, non de propriété du contenu sous-jacent.
                  </Text>
                </CardBody>
              </Card>

              {/* Section 8 - Résiliation */}
              <Card>
                <CardBody>
                  <Heading size="md" color="blue.600" mb={3}>
                    8. RÉSILIATION
                  </Heading>
                  <VStack spacing={3} align="stretch">
                    <Box>
                      <Text fontWeight="bold" color="black">8.1 Résiliation par l'Utilisateur</Text>
                      <Text color="white">Vous pouvez cesser d'utiliser la Plateforme à tout moment, sous réserve des périodes de blocage en cours.</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" color="black">8.2 Résiliation par CryptocaVault</Text>
                      <Text color="white">Nous pouvons suspendre ou résilier votre accès en cas de violation des présentes conditions ou pour des raisons légales ou réglementaires.</Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              {/* Section 9 - Force majeure */}
              <Card>
                <CardBody>
                  <Heading size="md" color="blue.600" mb={3}>
                    9. FORCE MAJEURE
                  </Heading>
                  <Text color="white" lineHeight="1.7">
                    CryptocaVault ne sera pas responsable des retards ou défaillances dus à des circonstances échappant à son contrôle raisonnable, incluant les problèmes de blockchain, les cyberattaques, ou les changements réglementaires.
                  </Text>
                </CardBody>
              </Card>

              {/* Section 10 - Droit applicable */}
              <Card>
                <CardBody>
                  <Heading size="md" color="blue.600" mb={3}>
                    10. DROIT APPLICABLE ET JURIDICTION
                  </Heading>
                  <Text color="white" lineHeight="1.7">
                    Les présentes conditions sont régies par le droit français. Tout litige sera soumis à la juridiction exclusive des tribunaux de Paris.
                  </Text>
                </CardBody>
              </Card>

              {/* Section 11 - Modifications */}
              <Card>
                <CardBody>
                  <Heading size="md" color="blue.600" mb={3}>
                    11. MODIFICATIONS
                  </Heading>
                  <Text color="white" lineHeight="1.7">
                    Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications entreront en vigueur après notification aux utilisateurs.
                  </Text>
                </CardBody>
              </Card>

              {/* Section 12 - Dispositions générales */}
              <Card>
                <CardBody>
                  <Heading size="md" color="blue.600" mb={3}>
                    12. DISPOSITIONS GÉNÉRALES
                  </Heading>
                  <VStack spacing={3} align="stretch">
                    <Box>
                      <Text fontWeight="bold" color="black">12.1 Intégralité de l'Accord</Text>
                      <Text color="white">Ces conditions constituent l'intégralité de l'accord entre vous et CryptocaVault.</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" color="black">12.2 Divisibilité</Text>
                      <Text color="white">Si une disposition est jugée invalide, les autres dispositions restent en vigueur.</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" color="black">12.3 Renonciation</Text>
                      <Text color="white">L'absence d'exercice d'un droit ne constitue pas une renonciation à ce droit.</Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              {/* Footer avec reconnaissance d'acceptation */}
              <Card bg="rgba(102, 126, 234, 0.1)" border="2px solid" borderColor="blue.300">
                <CardBody textAlign="center">
                  <Text fontWeight="bold" fontSize="lg" color="blue.700" mb={2}>
                    📋 RECONNAISSANCE D'ACCEPTATION
                  </Text>
                  <Text color="red" lineHeight="1.7" fontWeight="medium">
                    EN UTILISANT LA PLATEFORME CRYPTOCAVAULT, VOUS RECONNAISSEZ AVOIR LU, COMPRIS ET ACCEPTÉ CES CONDITIONS D'UTILISATION.
                  </Text>
                </CardBody>
              </Card>

            </VStack>
          </ModalBody>
          
<ModalFooter bg="gray.50" borderBottomRadius="2xl" position="relative" py={8}>
  {/* Bouton centré "J'ai lu et compris" avec espaces */}
  <Box 
    position="absolute" 
    left="50%" 
    transform="translateX(-50%)"
    mx={0}  // ← AJOUTÉ : Marges horizontales (équivaut à 4rem de chaque côté)
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
      px={12}  // ← AUGMENTÉ : Plus de padding interne (de px={8} à px={12})
      py={4}   // ← AJOUTÉ : Padding vertical pour plus de hauteur
    >
      ✓ J'ai lu et compris
    </Button>
  </Box>

  {/* Lien "Voir page complète" tout à droite */}
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