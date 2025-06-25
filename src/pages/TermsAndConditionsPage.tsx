// src/pages/TermsAndConditionsPage.tsx
import React from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Divider,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Badge,
  Button,
  useColorModeValue,
  Link,
  UnorderedList,
  ListItem,
  Flex,
  Spacer,
  SimpleGrid,
  Icon,
  useBreakpointValue,
} from '@chakra-ui/react';
import { EmailIcon, ArrowBackIcon, ExternalLinkIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

const TermsAndConditionsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Styles améliorés
  const bgGradient = 'linear(135deg, #667eea 0%, #764ba2 100%)';
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.98)', 'rgba(26, 32, 44, 0.95)');
  const borderColor = useColorModeValue('rgba(102, 126, 234, 0.2)', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const headerColor = useColorModeValue('gray.800', 'gray.100');
  
  // Responsive
  const containerMaxW = useBreakpointValue({ base: 'full', md: '5xl' });
  const headerSize = useBreakpointValue({ base: 'xl', md: '2xl' });
  const sectionSize = useBreakpointValue({ base: 'md', md: 'lg' });

  return (
    <Box
      minH="100vh"
      bg="transparent"
      py={8}
      position="relative"
      overflow="hidden"
    >
      {/* Éléments décoratifs d'arrière-plan */}
      <Box
        position="absolute"
        top="0"
        left="0"
        w="100%"
        h="100%"
        bgImage="radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(102, 126, 234, 0.2) 0%, transparent 50%)"
        pointerEvents="none"
      />
      
      <Container maxW={containerMaxW} position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch">
          
          {/* En-tête avec navigation amélioré */}
          <Card
            bg={cardBg}
            backdropFilter="blur(30px)"
            border="2px solid"
            borderColor={borderColor}
            borderRadius="3xl"
            shadow="2xl"
            overflow="hidden"
          >
            <Box
              bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)"
              p={6}
            >
              <Flex align="center" mb={4}>
                <Button
                  leftIcon={<ArrowBackIcon />}
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  color="white"
                  _hover={{ bg: 'rgba(255,255,255,0.2)' }}
                  borderRadius="xl"
                  fontWeight="600"
                >
                  Retour
                </Button>
                <Spacer />
                <Badge
                  bg="rgba(255,255,255,0.2)"
                  color="white"
                  variant="solid"
                  borderRadius="full"
                  px={4}
                  py={2}
                  fontSize="sm"
                  fontWeight="600"
                  border="1px solid rgba(255,255,255,0.3)"
                >
                  Version 1.0 - 2025
                </Badge>
              </Flex>
              
              <VStack spacing={6} align="center" textAlign="center">
                <Box
                  p={6}
                  bg="rgba(255,255,255,0.15)"
                  rounded="full"
                  shadow="2xl"
                  w={24}
                  h={24}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  border="2px solid rgba(255,255,255,0.3)"
                  backdropFilter="blur(10px)"
                >
                  <Text fontSize="4xl" fontWeight="bold" color="white" fontFamily="'Inter', sans-serif">CV</Text>
                </Box>
                
                <VStack spacing={3}>
                  <Heading
                    size={headerSize}
                    color="white"
                    fontWeight="800"
                    fontFamily="'Inter', sans-serif"
                    letterSpacing="-0.02em"
                    textShadow="0 2px 4px rgba(0,0,0,0.3)"
                  >
                    CONDITIONS D'UTILISATION
                  </Heading>
                  
                  <Heading
                    size="lg"
                    color="rgba(255,255,255,0.9)"
                    fontWeight="600"
                    fontFamily="'Inter', sans-serif"
                  >
                    PLATEFORME CRYPTOCAVAULT
                  </Heading>
                  
                  <HStack spacing={6} wrap="wrap" justify="center" mt={4}>
                    <Badge bg="rgba(255,255,255,0.2)" color="white" px={3} py={1} borderRadius="full">
                      📅 Entrée en vigueur : 24 juin 2025
                    </Badge>
                    <Badge bg="rgba(255,255,255,0.2)" color="white" px={3} py={1} borderRadius="full">
                      🔄 Dernière mise à jour : 24 juin 2025
                    </Badge>
                  </HStack>
                </VStack>
              </VStack>
            </Box>
          </Card>

          {/* Alerte importante redesignée */}
          <Alert 
            status="warning" 
            borderRadius="2xl" 
            bg="linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)"
            border="2px solid" 
            borderColor="orange.300"
            p={6}
            shadow="xl"
          >
            <AlertIcon color="orange.600" boxSize={6} />
            <Box>
              <Text fontWeight="bold" color="orange.800" fontSize="lg" fontFamily="'Inter', sans-serif">
                ⚠️ Information Importante
              </Text>
              <Text color="orange.700" fontSize="md" mt={2} lineHeight="1.6" fontFamily="'Inter', sans-serif">
                En utilisant la plateforme CryptocaVault, vous reconnaissez avoir lu, compris et accepté ces conditions d'utilisation.
              </Text>
            </Box>
          </Alert>

          {/* Contenu principal avec design amélioré */}
          <VStack spacing={6} align="stretch">

            {/* Section 1 */}
            <Card
              bg={cardBg}
              backdropFilter="blur(30px)"
              border="2px solid"
              borderColor={borderColor}
              borderRadius="2xl"
              shadow="xl"
              transition="all 0.3s ease"
              _hover={{ transform: "translateY(-5px)", shadow: "2xl" }}
            >
              <CardBody p={8}>
                <HStack spacing={4} mb={6}>
                  <Box
                    w={12}
                    h={12}
                    bg="linear-gradient(135deg, #4299e1 0%, #3182ce 100%)"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    shadow="lg"
                  >
                    <Text fontSize="xl" fontWeight="bold" color="white">1</Text>
                  </Box>
                  <Heading size={sectionSize} color="blue.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                    ACCEPTATION DES CONDITIONS
                  </Heading>
                </HStack>
                <Text color={textColor} lineHeight="1.8" fontSize="lg" fontFamily="'Inter', sans-serif">
                  En accédant à ou en utilisant la plateforme CryptocaVault (ci-après "la Plateforme"), vous acceptez d'être lié par les présentes Conditions d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la Plateforme.
                </Text>
              </CardBody>
            </Card>

            {/* Section 2 */}
            <Card
              bg={cardBg}
              backdropFilter="blur(30px)"
              border="2px solid"
              borderColor={borderColor}
              borderRadius="2xl"
              shadow="xl"
              transition="all 0.3s ease"
              _hover={{ transform: "translateY(-5px)", shadow: "2xl" }}
            >
              <CardBody p={8}>
                <HStack spacing={4} mb={6}>
                  <Box
                    w={12}
                    h={12}
                    bg="linear-gradient(135deg, #48bb78 0%, #38a169 100%)"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    shadow="lg"
                  >
                    <Text fontSize="xl" fontWeight="bold" color="white">2</Text>
                  </Box>
                  <Heading size={sectionSize} color="green.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                    DÉFINITIONS
                  </Heading>
                </HStack>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box p={5} bg="blue.50" borderRadius="xl" border="1px solid" borderColor="blue.200">
                    <Text fontWeight="bold" color="blue.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={2}>
                      📱 "Plateforme"
                    </Text>
                    <Text color="blue.700" lineHeight="1.6" fontFamily="'Inter', sans-serif">
                      La plateforme CryptocaVault permettant l'accès aux pools de récompenses via des NFT.
                    </Text>
                  </Box>
                  <Box p={5} bg="purple.50" borderRadius="xl" border="1px solid" borderColor="purple.200">
                    <Text fontWeight="bold" color="purple.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={2}>
                      🎨 "NFT"
                    </Text>
                    <Text color="purple.700" lineHeight="1.6" fontFamily="'Inter', sans-serif">
                      Les jetons non fongibles CryptocaVault donnant accès aux différents niveaux (Bronze, Argent, Or, Privilège, Fidélité).
                    </Text>
                  </Box>
                  <Box p={5} bg="orange.50" borderRadius="xl" border="1px solid" borderColor="orange.200">
                    <Text fontWeight="bold" color="orange.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={2}>
                      💰 "Pools de Récompenses"
                    </Text>
                    <Text color="orange.700" lineHeight="1.6" fontFamily="'Inter', sans-serif">
                      Les mécanismes de distribution de récompenses basées sur la performance des stratégies.
                    </Text>
                  </Box>
                  <Box p={5} bg="teal.50" borderRadius="xl" border="1px solid" borderColor="teal.200">
                    <Text fontWeight="bold" color="teal.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={2}>
                      👤 "Utilisateur"
                    </Text>
                    <Text color="teal.700" lineHeight="1.6" fontFamily="'Inter', sans-serif">
                      Toute personne accédant à ou utilisant la Plateforme.
                    </Text>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Section 3 */}
            <Card
              bg={cardBg}
              backdropFilter="blur(30px)"
              border="2px solid"
              borderColor={borderColor}
              borderRadius="2xl"
              shadow="xl"
              transition="all 0.3s ease"
              _hover={{ transform: "translateY(-5px)", shadow: "2xl" }}
            >
              <CardBody p={8}>
                <HStack spacing={4} mb={6}>
                  <Box
                    w={12}
                    h={12}
                    bg="linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    shadow="lg"
                  >
                    <Text fontSize="xl" fontWeight="bold" color="white">3</Text>
                  </Box>
                  <Heading size={sectionSize} color="orange.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                    DESCRIPTION DU SERVICE
                  </Heading>
                </HStack>
                
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" color={headerColor} mb={4} fontFamily="'Inter', sans-serif" fontWeight="600">
                      🔧 3.1 Fonctionnement
                    </Heading>
                    <Text color={textColor} lineHeight="1.8" fontSize="lg" fontFamily="'Inter', sans-serif">
                      CryptocaVault est une plateforme offrant un accès basé sur des NFT à des pools de récompenses liés aux performances de stratégies crypto (yield farming DeFi, trading algorithmique, arbitrage, provision de liquidité).
                    </Text>
                  </Box>

                  <Box>
                    <Heading size="md" color={headerColor} mb={4} fontFamily="'Inter', sans-serif" fontWeight="600">
                      🎯 3.2 Niveaux d'Accès
                    </Heading>
                    <Text color={textColor} mb={4} fontSize="lg" fontFamily="'Inter', sans-serif">
                      La Plateforme propose 5 niveaux d'accès via NFT :
                    </Text>
                    
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                      <Box p={4} bg="yellow.50" borderRadius="xl" border="2px solid" borderColor="yellow.300">
                        <HStack spacing={3}>
                          <Box w={8} h={8} bg="yellow.500" borderRadius="lg" />
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" color="yellow.800" fontFamily="'Inter', sans-serif">Bronze</Text>
                            <Text fontSize="sm" color="yellow.700" fontFamily="'Inter', sans-serif">120 USDC - 1,2X</Text>
                          </VStack>
                        </HStack>
                      </Box>
                      
                      <Box p={4} bg="gray.50" borderRadius="xl" border="2px solid" borderColor="gray.400">
                        <HStack spacing={3}>
                          <Box w={8} h={8} bg="gray.400" borderRadius="lg" />
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" color="gray.800" fontFamily="'Inter', sans-serif">Argent</Text>
                            <Text fontSize="sm" color="gray.700" fontFamily="'Inter', sans-serif">250 USDC - 1,5X</Text>
                          </VStack>
                        </HStack>
                      </Box>
                      
                      <Box p={4} bg="yellow.100" borderRadius="xl" border="2px solid" borderColor="yellow.500">
                        <HStack spacing={3}>
                          <Box w={8} h={8} bg="yellow.600" borderRadius="lg" />
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" color="yellow.800" fontFamily="'Inter', sans-serif">Or</Text>
                            <Text fontSize="sm" color="yellow.700" fontFamily="'Inter', sans-serif">500 USDC - 2,0X</Text>
                          </VStack>
                        </HStack>
                      </Box>
                      
                      <Box p={4} bg="purple.50" borderRadius="xl" border="2px solid" borderColor="purple.400">
                        <HStack spacing={3}>
                          <Box w={8} h={8} bg="purple.500" borderRadius="lg" />
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" color="purple.800" fontFamily="'Inter', sans-serif">Privilège</Text>
                            <Text fontSize="sm" color="purple.700" fontFamily="'Inter', sans-serif">1000 USDC - 2,5X</Text>
                          </VStack>
                        </HStack>
                      </Box>
                      
                      <Box p={4} bg="green.50" borderRadius="xl" border="2px solid" borderColor="green.400">
                        <HStack spacing={3}>
                          <Box w={8} h={8} bg="green.500" borderRadius="lg" />
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" color="green.800" fontFamily="'Inter', sans-serif">Fidélité</Text>
                            <Text fontSize="sm" color="green.700" fontFamily="'Inter', sans-serif">Gratuit - 1,2X</Text>
                          </VStack>
                        </HStack>
                      </Box>
                    </SimpleGrid>
                  </Box>

                  <Box p={6} bg="blue.50" borderRadius="xl" border="1px solid" borderColor="blue.200">
                    <Heading size="md" color="blue.800" mb={3} fontFamily="'Inter', sans-serif" fontWeight="600">
                      ⚡ 3.3 Système de Récompenses
                    </Heading>
                    <Text color="blue.700" lineHeight="1.8" fontSize="lg" fontFamily="'Inter', sans-serif">
                      Les récompenses sont exclusivement basées sur la performance réelle des stratégies utilisées par la Plateforme. Aucun rendement fixe n'est garanti.
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Section 4 */}
            <Card
              bg={cardBg}
              backdropFilter="blur(30px)"
              border="2px solid"
              borderColor={borderColor}
              borderRadius="2xl"
              shadow="xl"
              transition="all 0.3s ease"
              _hover={{ transform: "translateY(-5px)", shadow: "2xl" }}
            >
              <CardBody p={8}>
                <HStack spacing={4} mb={6}>
                  <Box
                    w={12}
                    h={12}
                    bg="linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    shadow="lg"
                  >
                    <Text fontSize="xl" fontWeight="bold" color="white">4</Text>
                  </Box>
                  <Heading size={sectionSize} color="purple.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                    ÉLIGIBILITÉ ET INSCRIPTION
                  </Heading>
                </HStack>
                
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" color={headerColor} mb={4} fontFamily="'Inter', sans-serif" fontWeight="600">
                      ✅ 4.1 Conditions d'Éligibilité
                    </Heading>
                    <Text color={textColor} mb={4} fontSize="lg" fontFamily="'Inter', sans-serif">
                      Pour utiliser la Plateforme, vous devez :
                    </Text>
                    <VStack spacing={3} align="stretch">
                      {[
                        "Être âgé d'au moins 18 ans",
                        "Avoir la capacité juridique de conclure des contrats",
                        "Résider dans une juridiction où l'utilisation est légale",
                        "Posséder un wallet compatible pour NFT et cryptomonnaies",
                        "Être membre de la communauté ayant droit d'accès",
                        "Avoir suivi les formations de la communauté"
                      ].map((item, index) => (
                        <HStack key={index} spacing={3} p={3} bg="purple.50" borderRadius="lg">
                          <Icon as={CheckCircleIcon} color="purple.500" boxSize={5} />
                          <Text color="purple.800" fontFamily="'Inter', sans-serif" fontWeight="500">
                            {item}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>

                  <Box p={6} bg="yellow.50" borderRadius="xl" border="1px solid" borderColor="yellow.300">
                    <Heading size="md" color="yellow.800" mb={3} fontFamily="'Inter', sans-serif" fontWeight="600">
                      🔍 4.2 Vérification d'Identité
                    </Heading>
                    <Text color="yellow.700" lineHeight="1.8" fontSize="lg" fontFamily="'Inter', sans-serif">
                      Nous nous réservons le droit de demander une vérification d'identité conforme aux réglementations KYC/AML applicables.
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Section 5 - Limitation de responsabilité */}
            <Card
              bg="linear-gradient(135deg, rgba(255, 0, 0, 0.05) 0%, rgba(255, 100, 100, 0.05) 100%)"
              backdropFilter="blur(30px)"
              border="2px solid"
              borderColor="red.300"
              borderRadius="2xl"
              shadow="xl"
            >
              <CardBody p={8}>
                <HStack spacing={4} mb={6}>
                  <Box
                    w={12}
                    h={12}
                    bg="linear-gradient(135deg, #f56565 0%, #e53e3e 100%)"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    shadow="lg"
                  >
                    <Text fontSize="xl" fontWeight="bold" color="white">⚠️</Text>
                  </Box>
                  <Heading size={sectionSize} color="red.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                    LIMITATION DE RESPONSABILITÉ
                  </Heading>
                </HStack>
                
                <VStack spacing={4}>
                  <Alert status="error" borderRadius="xl" bg="red.50" border="2px solid" borderColor="red.300">
                    <AlertIcon color="red.500" />
                    <Box>
                      <Text fontWeight="bold" fontSize="lg" color="red.800" fontFamily="'Inter', sans-serif">
                        Exclusion de Garanties
                      </Text>
                      <Text fontSize="md" mt={2} color="red.700" fontFamily="'Inter', sans-serif">
                        LA PLATEFORME EST FOURNIE "EN L'ÉTAT" SANS GARANTIE D'AUCUNE SORTE. NOUS DÉCLINONS EXPRESSÉMENT TOUTE GARANTIE DE DISPONIBILITÉ, PERFORMANCE, OU RÉSULTATS SPÉCIFIQUES.
                      </Text>
                    </Box>
                  </Alert>

                  <Alert status="warning" borderRadius="xl" bg="orange.50" border="2px solid" borderColor="orange.300">
                    <AlertIcon color="orange.500" />
                    <Box>
                      <Text fontWeight="bold" fontSize="lg" color="orange.800" fontFamily="'Inter', sans-serif">
                        Limitation des Dommages
                      </Text>
                      <Text fontSize="md" mt={2} color="orange.700" fontFamily="'Inter', sans-serif">
                        EN AUCUN CAS CRYPTOCAVAULT NE SERA RESPONSABLE DE DOMMAGES INDIRECTS, ACCESSOIRES, SPÉCIAUX, OU CONSÉCUTIFS, Y COMPRIS LA PERTE DE PROFITS OU DE DONNÉES.
                      </Text>
                    </Box>
                  </Alert>
                </VStack>
              </CardBody>
            </Card>

            {/* Contact */}
            <Card
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              borderRadius="2xl"
              shadow="2xl"
              color="white"
            >
              <CardBody p={8} textAlign="center">
                <VStack spacing={6}>
                  <Heading size="lg" fontFamily="'Inter', sans-serif" fontWeight="700">
                    📧 CONTACT
                  </Heading>
                  <HStack spacing={3} justify="center">
                    <EmailIcon boxSize={6} />
                    <Text fontSize="lg" fontFamily="'Inter', sans-serif">
                      Pour toute question concernant ces conditions :
                    </Text>
                  </HStack>
                  <Link 
                    href="mailto:support@cryptocavault.com" 
                    fontSize="xl" 
                    fontWeight="bold"
                    p={4}
                    bg="rgba(255,255,255,0.2)"
                    borderRadius="xl"
                    _hover={{ bg: "rgba(255,255,255,0.3)" }}
                    fontFamily="'Inter', sans-serif"
                  >
                    support@cryptocavault.com
                  </Link>
                </VStack>
              </CardBody>
            </Card>

          </VStack>

          {/* Footer avec reconnaissance d'acceptation */}
          <Card
            bg="linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)"
            backdropFilter="blur(30px)"
            border="3px solid"
            borderColor="blue.300"
            borderRadius="2xl"
            shadow="2xl"
          >
            <CardBody p={8} textAlign="center">
              <VStack spacing={4}>
                <Text fontSize="2xl" mb={2}>📋</Text>
                <Heading size="lg" color="blue.700" fontFamily="'Inter', sans-serif" fontWeight="700">
                  RECONNAISSANCE D'ACCEPTATION
                </Heading>
                <Text 
                  color="blue.600" 
                  lineHeight="1.8" 
                  fontWeight="600"
                  fontSize="lg"
                  fontFamily="'Inter', sans-serif"
                  maxW="4xl"
                >
                  EN UTILISANT LA PLATEFORME CRYPTOCAVAULT, VOUS RECONNAISSEZ AVOIR LU, COMPRIS ET ACCEPTÉ CES CONDITIONS D'UTILISATION.
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Navigation bottom améliorée */}
          <HStack spacing={6} justify="center" pt={4}>
            <Button
              leftIcon={<ArrowBackIcon />}
              colorScheme="blue"
              variant="outline"
              onClick={() => navigate(-1)}
              size="lg"
              borderRadius="xl"
              px={8}
              fontFamily="'Inter', sans-serif"
              fontWeight="600"
              _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
            >
              Retour
            </Button>
            <Button
              rightIcon={<ExternalLinkIcon />}
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              color="white"
              onClick={() => navigate('/')}
              size="lg"
              borderRadius="xl"
              px={8}
              fontFamily="'Inter', sans-serif"
              fontWeight="600"
              _hover={{ 
                transform: "translateY(-2px)", 
                shadow: "lg",
                bg: "linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%)"
              }}
            >
              Accueil
            </Button>
          </HStack>

        </VStack>
      </Container>
    </Box>
  );
};

export default TermsAndConditionsPage;