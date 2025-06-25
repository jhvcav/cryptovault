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
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';

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

const CommunityRegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState<CommunityRegistrationForm>({
    username: '',
    email: '',
    phone: '',
    charterAccepted: false,
    participationConfirmed: false,
    responsibilityAccepted: false,
    respectConfirmed: false
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(1);

  const toast = useToast();
  const { isOpen: isCharterOpen, onOpen: onCharterOpen, onClose: onCharterClose } = useDisclosure();

  // Styles Chakra UI
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)');

  // Responsive values
  const containerMaxW = useBreakpointValue({ base: 'sm', md: 'lg', lg: 'xl' });
  const cardPadding = useBreakpointValue({ base: 6, md: 10 });
  const headingSize = useBreakpointValue({ base: 'xl', md: '2xl' });

  // Fonction pour envoyer une notification email à l'administrateur
  // Fonction temporaire pour envoyer une notification email à l'administrateur
// Fonction finale pour envoyer une notification email à l'administrateur
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
          email: memberData.email,
          phone: memberData.phone,
          registrationDate: memberData.acceptance_timestamp,
          registrationIP: memberData.acceptance_ip
        }
      })
    });

    // Vérifier si la réponse est OK
    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}`;
      
      // Essayer de parser la réponse d'erreur
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('❌ Erreur API:', errorData);
      } catch (parseError) {
        console.warn('Impossible de parser la réponse d\'erreur');
      }
      
      throw new Error(errorMessage);
    }

    // Parser la réponse de succès
    const result = await response.json();
    
    if (result.fallback) {
      console.warn('⚠️ Email envoyé en mode fallback:', result.message);
    } else {
      console.log('✅ Email admin envoyé avec succès:', result.message);
    }
    
    return result;

  } catch (error) {
    console.error('❌ Erreur notification admin:', error);
    
    // Informations de debug
    if (error.message.includes('fetch')) {
      console.error('🔍 Vérifiez que les deux serveurs tournent:');
      console.error('   - Backend: http://localhost:3001/health');
      console.error('   - Frontend: http://localhost:5173');
    }
    
    // Ne pas faire échouer l'inscription
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

  // Enregistrer l'inscription
  // Fonction d'inscription simplifiée (remplace registerCommunityMember)
const registerCommunityMember = async () => {
  try {
    setIsLoading(true);
    setError('');

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

    // Créer l'inscription SANS récupérer l'IP côté client
    const { data, error: insertError } = await supabase
      .from('community_members')
      .insert([{
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        acceptance_ip: null, // L'IP sera gérée côté serveur dans l'email
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
      // Ne pas faire échouer l'inscription si l'email échoue
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
                  Rejoindre la Communauté RMR-M
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
              {currentStep === 1 && !success && (
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
                    mb={6}
                  >
                    Lire la Charte Complète
                  </Button>

                  <Button
                    onClick={startRegistration}
                    bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    color="white"
                    size="lg"
                    width="full"
                    _hover={{
                      bg: "linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%)",
                      transform: 'translateY(-2px)',
                    }}
                    borderRadius="xl"
                    py={6}
                    fontSize="lg"
                    fontWeight="600"
                    leftIcon={<Text fontSize="xl">📝</Text>}
                  >
                    M'inscrire à la Communauté
                  </Button>
                </Box>
              )}

              {/* Étape 2: Formulaire d'inscription */}
              {currentStep === 2 && !success && (
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
                          <Text fontSize="sm" color="white">
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
                          size="md"
                        >
                          <Text fontSize="sm" color="white">
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
                          <Text fontSize="sm" color="white">
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

                    {/* Boutons d'action */}
                    <HStack spacing={4} w="full">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setCurrentStep(1)}
                        borderColor="white"
                        color="white"
                        _hover={{ bg: "rgba(255,255,255,0.1)" }}
                        borderRadius="xl"
                        flex={1}
                      >
                        Retour
                      </Button>

                      <Button
                        type="submit"
                        size="lg"
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
                        fontSize="lg"
                        fontWeight="600"
                        leftIcon={<Text fontSize="xl">🌟</Text>}
                        flex={2}
                      >
                        Confirmer mon Inscription
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              )}

              {/* Étape 3: Message de succès */}
              {success && currentStep === 3 && (
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