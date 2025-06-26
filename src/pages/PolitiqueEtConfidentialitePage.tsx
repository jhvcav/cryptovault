// src/pages/PrivacyPolicyPage.tsx
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
import { EmailIcon, ArrowBackIcon, ExternalLinkIcon, CheckCircleIcon, LockIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
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
                  <LockIcon fontSize="2xl" color="white" />
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
                    POLITIQUE DE CONFIDENTIALITÉ
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
            status="info" 
            borderRadius="2xl" 
            bg="linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%)"
            border="2px solid" 
            borderColor="blue.300"
            p={6}
            shadow="xl"
          >
            <AlertIcon color="blue.600" boxSize={6} />
            <Box>
              <Text fontWeight="bold" color="blue.800" fontSize="lg" fontFamily="'Inter', sans-serif">
                🛡️ Protection de vos Données
              </Text>
              <Text color="blue.700" fontSize="md" mt={2} lineHeight="1.6" fontFamily="'Inter', sans-serif">
                CryptocaVault s'engage à protéger la vie privée et les données personnelles de ses utilisateurs selon les plus hauts standards de sécurité.
              </Text>
            </Box>
          </Alert>

          {/* Section 1 - Introduction */}
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
                  INTRODUCTION
                </Heading>
              </HStack>
              <Text color={textColor} lineHeight="1.8" fontSize="lg" fontFamily="'Inter', sans-serif">
                CryptocaVault ("nous", "notre", "nos") s'engage à protéger la vie privée et les données personnelles de nos utilisateurs. Cette Politique de Confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos informations lors de l'utilisation de notre plateforme.
              </Text>
            </CardBody>
          </Card>

          {/* Section 2 - Informations Collectées */}
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
                  INFORMATIONS COLLECTÉES
                </Heading>
              </HStack>
              
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" color={headerColor} mb={4} fontFamily="'Inter', sans-serif" fontWeight="600">
                    📝 2.1 Informations Fournies Directement
                  </Heading>
                  <Text color={textColor} mb={4} fontSize="lg" fontFamily="'Inter', sans-serif">
                    Nous collectons les informations que vous nous fournissez directement :
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {[
                      { icon: "📧", title: "Informations d'inscription", desc: "Adresse email, nom d'utilisateur" },
                      { icon: "🆔", title: "Vérification d'identité", desc: "KYC/AML si applicable" },
                      { icon: "💰", title: "Adresses wallet", desc: "Adresses blockchain" },
                      { icon: "💬", title: "Communications", desc: "Support client, Discord" }
                    ].map((item, index) => (
                      <Box key={index} p={4} bg="green.50" borderRadius="xl" border="1px solid" borderColor="green.200">
                        <HStack spacing={3}>
                          <Text fontSize="2xl">{item.icon}</Text>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" color="green.800" fontFamily="'Inter', sans-serif">{item.title}</Text>
                            <Text fontSize="sm" color="green.700" fontFamily="'Inter', sans-serif">{item.desc}</Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>

                <Box>
                  <Heading size="md" color={headerColor} mb={4} fontFamily="'Inter', sans-serif" fontWeight="600">
                    🤖 2.2 Informations Collectées Automatiquement
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {[
                      { icon: "🌐", title: "Données de connexion", desc: "IP, navigateur, OS" },
                      { icon: "📊", title: "Données d'utilisation", desc: "Pages, sessions, interactions" },
                      { icon: "⛓️", title: "Données blockchain", desc: "Transactions NFT publiques" },
                      { icon: "🍪", title: "Cookies", desc: "Technologies de suivi" }
                    ].map((item, index) => (
                      <Box key={index} p={4} bg="blue.50" borderRadius="xl" border="1px solid" borderColor="blue.200">
                        <HStack spacing={3}>
                          <Text fontSize="2xl">{item.icon}</Text>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" color="blue.800" fontFamily="'Inter', sans-serif">{item.title}</Text>
                            <Text fontSize="sm" color="blue.700" fontFamily="'Inter', sans-serif">{item.desc}</Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>

                <Box p={6} bg="purple.50" borderRadius="xl" border="1px solid" borderColor="purple.200">
                  <Heading size="md" color="purple.800" mb={3} fontFamily="'Inter', sans-serif" fontWeight="600">
                    🤝 2.3 Informations de Tiers
                  </Heading>
                  <Text color="purple.700" lineHeight="1.8" fontSize="lg" fontFamily="'Inter', sans-serif">
                    Nous pouvons recevoir des informations de fournisseurs de services de vérification, services blockchain, partenaires technologiques et sources publiques.
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Section 3 - Utilisation des Informations */}
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
                  UTILISATION DES INFORMATIONS
                </Heading>
              </HStack>
              
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" color={headerColor} mb={4} fontFamily="'Inter', sans-serif" fontWeight="600">
                    🎯 3.1 Finalités Principales
                  </Heading>
                  <VStack spacing={3} align="stretch">
                    {[
                      "Fournir et maintenir les services de la Plateforme",
                      "Traiter les transactions et gérer les NFT", 
                      "Calculer et distribuer les récompenses",
                      "Vérifier votre identité et prévenir la fraude",
                      "Assurer la sécurité de la Plateforme"
                    ].map((item, index) => (
                      <HStack key={index} spacing={3} p={3} bg="orange.50" borderRadius="lg">
                        <Icon as={CheckCircleIcon} color="orange.500" boxSize={5} />
                        <Text color="orange.800" fontFamily="'Inter', sans-serif" fontWeight="500">
                          {item}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box p={5} bg="teal.50" borderRadius="xl" border="1px solid" borderColor="teal.200">
                    <Text fontWeight="bold" color="teal.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={3}>
                      📢 3.2 Communications
                    </Text>
                    <UnorderedList color="teal.700" spacing={2}>
                      <ListItem>Mises à jour de la Plateforme</ListItem>
                      <ListItem>Support client</ListItem>
                      <ListItem>Modifications des services</ListItem>
                      <ListItem>Communications Discord</ListItem>
                    </UnorderedList>
                  </Box>
                  
                  <Box p={5} bg="purple.50" borderRadius="xl" border="1px solid" borderColor="purple.200">
                    <Text fontWeight="bold" color="purple.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={3}>
                      📈 3.3 Analyses et Améliorations
                    </Text>
                    <UnorderedList color="purple.700" spacing={2}>
                      <ListItem>Améliorer l'expérience utilisateur</ListItem>
                      <ListItem>Analyser les tendances d'utilisation</ListItem>
                      <ListItem>Développer de nouvelles fonctionnalités</ListItem>
                      <ListItem>Optimiser les performances</ListItem>
                    </UnorderedList>
                  </Box>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>

          {/* Section 4 - Base Légale */}
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
                  BASE LÉGALE DU TRAITEMENT
                </Heading>
              </HStack>
              
              <Text color={textColor} mb={6} fontSize="lg" fontFamily="'Inter', sans-serif">
                Nous traitons vos données personnelles sur la base de :
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {[
                  { icon: "📋", title: "Exécution du contrat", desc: "Pour fournir nos services", color: "blue" },
                  { icon: "⚖️", title: "Intérêt légitime", desc: "Sécurité, amélioration des services", color: "green" },
                  { icon: "✅", title: "Consentement", desc: "Communications marketing optionnelles", color: "orange" },
                  { icon: "🏛️", title: "Obligation légale", desc: "Conformité KYC/AML", color: "purple" }
                ].map((item, index) => (
                  <Box key={index} p={5} bg={`${item.color}.50`} borderRadius="xl" border="1px solid" borderColor={`${item.color}.200`}>
                    <HStack spacing={3} mb={2}>
                      <Text fontSize="2xl">{item.icon}</Text>
                      <Text fontWeight="bold" color={`${item.color}.800`} fontSize="lg" fontFamily="'Inter', sans-serif">
                        {item.title}
                      </Text>
                    </HStack>
                    <Text color={`${item.color}.700`} fontFamily="'Inter', sans-serif">
                      {item.desc}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Section 5 - Partage des Informations */}
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
                  bg="linear-gradient(135deg, #38b2ac 0%, #319795 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">5</Text>
                </Box>
                <Heading size={sectionSize} color="teal.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  PARTAGE DES INFORMATIONS
                </Heading>
              </HStack>
              
              <VStack spacing={6} align="stretch">
                <Alert status="success" borderRadius="xl" bg="green.50" border="2px solid" borderColor="green.300">
                  <AlertIcon color="green.500" />
                  <Box>
                    <Text fontWeight="bold" fontSize="lg" color="green.800" fontFamily="'Inter', sans-serif">
                      🚫 Nous Ne Vendons Pas Vos Données
                    </Text>
                    <Text fontSize="md" mt={2} color="green.700" fontFamily="'Inter', sans-serif">
                      Nous ne vendons, ne louons, ni n'échangeons vos informations personnelles à des tiers.
                    </Text>
                  </Box>
                </Alert>

                <Box>
                  <Heading size="md" color={headerColor} mb={4} fontFamily="'Inter', sans-serif" fontWeight="600">
                    🤝 5.2 Partage Autorisé
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {[
                      { icon: "🔧", title: "Fournisseurs de services", desc: "Prestataires techniques, vérification" },
                      { icon: "⛓️", title: "Partenaires blockchain", desc: "Fonctionnement des smart contracts" },
                      { icon: "⚖️", title: "Autorités légales", desc: "Obligations légales, protection des droits" },
                      { icon: "🔄", title: "Successeurs", desc: "Fusion, acquisition, cession d'actifs" }
                    ].map((item, index) => (
                      <Box key={index} p={4} bg="teal.50" borderRadius="xl" border="1px solid" borderColor="teal.200">
                        <HStack spacing={3}>
                          <Text fontSize="2xl">{item.icon}</Text>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" color="teal.800" fontFamily="'Inter', sans-serif">{item.title}</Text>
                            <Text fontSize="sm" color="teal.700" fontFamily="'Inter', sans-serif">{item.desc}</Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>

                <Box p={6} bg="yellow.50" borderRadius="xl" border="1px solid" borderColor="yellow.300">
                  <Heading size="md" color="yellow.800" mb={3} fontFamily="'Inter', sans-serif" fontWeight="600">
                    🌐 5.3 Données Blockchain Publiques
                  </Heading>
                  <Text color="yellow.700" lineHeight="1.8" fontSize="lg" fontFamily="'Inter', sans-serif">
                    Les transactions blockchain sont publiques par nature. Les informations sur vos NFT et transactions peuvent être visibles publiquement sur la blockchain.
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Section 6 - Sécurité */}
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
                  bg="linear-gradient(135deg, #e53e3e 0%, #c53030 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <LockIcon fontSize="xl" color="white" />
                </Box>
                <Heading size={sectionSize} color="red.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  SÉCURITÉ DES DONNÉES
                </Heading>
              </HStack>
              
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" color={headerColor} mb={4} fontFamily="'Inter', sans-serif" fontWeight="600">
                    🛡️ 6.1 Mesures de Protection
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {[
                      { icon: "🔐", title: "Chiffrement", desc: "Données sensibles chiffrées" },
                      { icon: "🚪", title: "Contrôles d'accès", desc: "Accès stricts et limités" },
                      { icon: "🔍", title: "Audits sécurité", desc: "Vérifications régulières" },
                      { icon: "👁️", title: "Surveillance", desc: "Monitoring continu" },
                      { icon: "🚨", title: "Réponse incidents", desc: "Protocoles d'urgence" }
                    ].map((item, index) => (
                      <Box key={index} p={4} bg="red.50" borderRadius="xl" border="1px solid" borderColor="red.200">
                        <VStack spacing={2}>
                          <Text fontSize="2xl">{item.icon}</Text>
                          <Text fontWeight="bold" color="red.800" fontFamily="'Inter', sans-serif" textAlign="center">
                            {item.title}
                          </Text>
                          <Text fontSize="sm" color="red.700" fontFamily="'Inter', sans-serif" textAlign="center">
                            {item.desc}
                          </Text>
                        </VStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>

                <Alert status="warning" borderRadius="xl" bg="orange.50" border="2px solid" borderColor="orange.300">
                  <AlertIcon color="orange.500" />
                  <Box>
                    <Text fontWeight="bold" fontSize="lg" color="orange.800" fontFamily="'Inter', sans-serif">
                      ⚠️ 6.2 Limitations
                    </Text>
                    <Text fontSize="md" mt={2} color="orange.700" fontFamily="'Inter', sans-serif">
                      Aucun système n'est 100% sécurisé. Nous ne pouvons garantir une sécurité absolue, particulièrement concernant les risques blockchain et les erreurs utilisateur.
                    </Text>
                  </Box>
                </Alert>
              </VStack>
            </CardBody>
          </Card>

          {/* Section 7 - Vos Droits */}
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
                  bg="linear-gradient(135deg, #3182ce 0%, #2c5282 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">8</Text>
                </Box>
                <Heading size={sectionSize} color="blue.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  VOS DROITS
                </Heading>
              </HStack>
              
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" color={headerColor} mb={4} fontFamily="'Inter', sans-serif" fontWeight="600">
                    🇪🇺 8.1 Droits RGPD (si applicable)
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {[
                      { icon: "📖", title: "Accès", desc: "Obtenir une copie de vos données", color: "blue" },
                      { icon: "✏️", title: "Rectification", desc: "Corriger les données inexactes", color: "green"},
                      { icon: "🗑️", title: "Suppression", desc: "Demander l'effacement de vos données", color: "red" },
                      { icon: "⏸️", title: "Limitation", desc: "Restreindre le traitement", color: "orange" },
                      { icon: "📦", title: "Portabilité", desc: "Recevoir vos données dans un format structuré", color: "purple" },
                      { icon: "🚫", title: "Opposition", desc: "Vous opposer au traitement", color: "pink" },
                      { icon: "↩️", title: "Retrait du consentement", desc: "Retirer votre consentement", color: "teal" }
                    ].map((item, index) => (
                      <Box key={index} p={4} bg={`${item.color}.50`} borderRadius="xl" border="1px solid" borderColor={`${item.color}.200`}>
                        <HStack spacing={3}>
                          <Text fontSize="2xl">{item.icon}</Text>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" color={`${item.color}.800`} fontFamily="'Inter', sans-serif">{item.title}</Text>
                            <Text fontSize="sm" color={`${item.color}.700`} fontFamily="'Inter', sans-serif">{item.desc}</Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>

                <Box p={6} bg="blue.50" borderRadius="xl" border="1px solid" borderColor="blue.200">
                  <Heading size="md" color="blue.800" mb={3} fontFamily="'Inter', sans-serif" fontWeight="600">
                    📧 8.2 Exercice de Vos Droits
                  </Heading>
                  <Text color="blue.700" lineHeight="1.8" fontSize="lg" fontFamily="'Inter', sans-serif">
                    Pour exercer vos droits, contactez-nous à : support@cryptocavault.com
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Section 9 - Cookies */}
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
                  bg="linear-gradient(135deg, #d69e2e 0%, #b7791f 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">🍪</Text>
                </Box>
                <Heading size={sectionSize} color="yellow.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  COOKIES ET TECHNOLOGIES SIMILAIRES
                </Heading>
              </HStack>
              
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" color={headerColor} mb={4} fontFamily="'Inter', sans-serif" fontWeight="600">
                    🍪 9.1 Types de Cookies
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {[
                      { icon: "⚙️", title: "Cookies essentiels", desc: "Nécessaires au fonctionnement", color: "red" },
                      { icon: "📊", title: "Cookies de performance", desc: "Analyse de l'utilisation", color: "blue" },
                      { icon: "🎛️", title: "Cookies fonctionnels", desc: "Amélioration de l'expérience", color: "green" },
                      { icon: "📢", title: "Cookies publicitaires", desc: "Marketing ciblé (avec consentement)", color: "purple" }
                    ].map((item, index) => (
                      <Box key={index} p={4} bg={`${item.color}.50`} borderRadius="xl" border="1px solid" borderColor={`${item.color}.200`}>
                        <HStack spacing={3}>
                          <Text fontSize="2xl">{item.icon}</Text>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" color={`${item.color}.800`} fontFamily="'Inter', sans-serif">{item.title}</Text>
                            <Text fontSize="sm" color={`${item.color}.700`} fontFamily="'Inter', sans-serif">{item.desc}</Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>

                <Box p={6} bg="yellow.50" borderRadius="xl" border="1px solid" borderColor="yellow.300">
                  <Heading size="md" color="yellow.800" mb={3} fontFamily="'Inter', sans-serif" fontWeight="600">
                    ⚙️ 9.2 Gestion des Cookies
                  </Heading>
                  <Text color="yellow.700" lineHeight="1.8" fontSize="lg" fontFamily="'Inter', sans-serif">
                    Vous pouvez gérer vos préférences cookies via les paramètres de votre navigateur ou notre interface de gestion des cookies.
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Section 10 - Conservation des Données */}
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
                  bg="linear-gradient(135deg, #805ad5 0%, #6b46c1 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">🗄️</Text>
                </Box>
                <Heading size={sectionSize} color="purple.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  CONSERVATION DES DONNÉES
                </Heading>
              </HStack>
              
              <VStack spacing={6} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box p={5} bg="purple.50" borderRadius="xl" border="1px solid" borderColor="purple.200">
                    <Text fontWeight="bold" color="purple.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={3}>
                      ⏱️ 7.1 Durée de Conservation
                    </Text>
                    <Text color="purple.700" mb={3} fontFamily="'Inter', sans-serif">
                      Nous conservons vos données personnelles :
                    </Text>
                    <UnorderedList color="purple.700" spacing={2}>
                      <ListItem>Tant que votre compte est actif</ListItem>
                      <ListItem>Selon les exigences légales</ListItem>
                      <ListItem>Maximum 7 années après fermeture</ListItem>
                    </UnorderedList>
                  </Box>
                  
                  <Box p={5} bg="red.50" borderRadius="xl" border="1px solid" borderColor="red.200">
                    <Text fontWeight="bold" color="red.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={3}>
                      🗑️ 7.2 Suppression
                    </Text>
                    <Text color="red.700" mb={3} fontFamily="'Inter', sans-serif">
                      Vous pouvez demander la suppression, sous réserve :
                    </Text>
                    <UnorderedList color="red.700" spacing={2}>
                      <ListItem>Obligations légales de conservation</ListItem>
                      <ListItem>Contrats en cours</ListItem>
                      <ListItem>Limitations techniques blockchain</ListItem>
                    </UnorderedList>
                  </Box>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>

          {/* Section 11 - Transferts Internationaux */}
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
                  bg="linear-gradient(135deg, #319795 0%, #2c7a7b 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">🌍</Text>
                </Box>
                <Heading size={sectionSize} color="teal.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  TRANSFERTS INTERNATIONAUX
                </Heading>
              </HStack>
              
              <VStack spacing={3} align="stretch">
                <Text color={textColor} fontSize="lg" fontFamily="'Inter', sans-serif" mb={4}>
                  Si nous transférons vos données hors de votre région, nous nous assurons que :
                </Text>
                {[
                  "Des garanties appropriées sont en place",
                  "Le niveau de protection est adéquat", 
                  "Les transferts respectent les réglementations applicables"
                ].map((item, index) => (
                  <HStack key={index} spacing={3} p={3} bg="teal.50" borderRadius="lg">
                    <Icon as={CheckCircleIcon} color="teal.500" boxSize={5} />
                    <Text color="teal.800" fontFamily="'Inter', sans-serif" fontWeight="500">
                      {item}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Section 12 - Protection des Mineurs */}
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
                  bg="linear-gradient(135deg, #f56565 0%, #e53e3e 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">👶</Text>
                </Box>
                <Heading size={sectionSize} color="red.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  PROTECTION DES MINEURS
                </Heading>
              </HStack>
              
              <Alert status="warning" borderRadius="xl" bg="orange.50" border="2px solid" borderColor="orange.300">
                <AlertIcon color="orange.500" />
                <Box>
                  <Text fontWeight="bold" fontSize="lg" color="orange.800" fontFamily="'Inter', sans-serif">
                    🔞 Restriction d'Âge
                  </Text>
                  <Text fontSize="md" mt={2} color="orange.700" fontFamily="'Inter', sans-serif">
                    Nos services ne sont pas destinés aux personnes de moins de 18 ans. Nous ne collectons pas sciemment de données d'enfants.
                  </Text>
                </Box>
              </Alert>
            </CardBody>
          </Card>

          {/* Section 13 - Modifications */}
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
                  <Text fontSize="xl" fontWeight="bold" color="white">🔄</Text>
                </Box>
                <Heading size={sectionSize} color="blue.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  MODIFICATIONS DE CETTE POLITIQUE
                </Heading>
              </HStack>
              
              <VStack spacing={6} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box p={5} bg="blue.50" borderRadius="xl" border="1px solid" borderColor="blue.200">
                    <Text fontWeight="bold" color="blue.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={3}>
                      📢 12.1 Notifications
                    </Text>
                    <Text color="blue.700" mb={3} fontFamily="'Inter', sans-serif">
                      Nous vous informerons par :
                    </Text>
                    <UnorderedList color="blue.700" spacing={2}>
                      <ListItem>Notification sur la Plateforme</ListItem>
                      <ListItem>Email (si fourni)</ListItem>
                      <ListItem>Canaux communautaires</ListItem>
                    </UnorderedList>
                  </Box>
                  
                  <Box p={5} bg="green.50" borderRadius="xl" border="1px solid" borderColor="green.200">
                    <Text fontWeight="bold" color="green.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={3}>
                      ✅ 12.2 Acceptation
                    </Text>
                    <Text color="green.700" fontFamily="'Inter', sans-serif">
                      L'utilisation continue de la Plateforme après modification constitue votre acceptation des changements.
                    </Text>
                  </Box>
                </SimpleGrid>
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
                  📧 CONTACT ET RÉCLAMATIONS
                </Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full">
                  <VStack spacing={4}>
                    <Box p={4} bg="rgba(255,255,255,0.15)" borderRadius="xl" w="full">
                      <Text fontSize="lg" fontWeight="bold" mb={2} fontFamily="'Inter', sans-serif">
                        📞 13.1 Contact
                      </Text>
                      <VStack spacing={2}>
                        <HStack spacing={2}>
                          <EmailIcon />
                          <Link href="mailto:support@cryptocavault.com" fontFamily="'Inter', sans-serif">
                            jean@jhc-developpement.fr
                          </Link>
                        </HStack>
                        <Text fontSize="sm" opacity={0.9} fontFamily="'Inter', sans-serif">
                          Discord : [Lien à venir]
                        </Text>
                      </VStack>
                    </Box>
                  </VStack>
                  
                  <VStack spacing={4}>
                    <Box p={4} bg="rgba(255,255,255,0.15)" borderRadius="xl" w="full">
                      <Text fontSize="lg" fontWeight="bold" mb={2} fontFamily="'Inter', sans-serif">
                        🏛️ 13.2 Autorité de Contrôle
                      </Text>
                      <Text fontSize="sm" opacity={0.9} fontFamily="'Inter', sans-serif">
                        Vous avez le droit de déposer une réclamation auprès de votre autorité de protection des données locale.
                      </Text>
                    </Box>
                  </VStack>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>

          {/* Footer avec reconnaissance d'acceptation */}
          <Card
            bg="linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)"
            backdropFilter="blur(30px)"
            border="3px solid"
            borderColor="purple.300"
            borderRadius="2xl"
            shadow="2xl"
          >
            <CardBody p={8} textAlign="center">
              <VStack spacing={4}>
                <Text fontSize="2xl" mb={2}>🛡️</Text>
                <Heading size="lg" color="white.300" fontFamily="'Inter', sans-serif" fontWeight="700">
                  RECONNAISSANCE D'ACCEPTATION
                </Heading>
                <Text 
                  color="orange.600" 
                  lineHeight="1.8" 
                  fontWeight="600"
                  fontSize="lg"
                  fontFamily="'Inter', sans-serif"
                  maxW="4xl"
                >
                  EN UTILISANT LA PLATEFORME CRYPTOCAVAULT, VOUS RECONNAISSEZ AVOIR LU, COMPRIS ET ACCEPTÉ CETTE POLITIQUE DE CONFIDENTIALITÉ.
                </Text>
                <Text 
                  color="white.500" 
                  fontSize="md"
                  fontFamily="'Inter', sans-serif"
                  fontStyle="italic"
                  mt={4}
                >
                  Cette politique de confidentialité fait partie intégrante de nos Conditions d'Utilisation.
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Navigation bottom améliorée */}
          <HStack spacing={6} justify="center" pt={4}>
            <Button
              leftIcon={<ArrowBackIcon />}
              colorScheme="purple"
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

export default PrivacyPolicyPage;