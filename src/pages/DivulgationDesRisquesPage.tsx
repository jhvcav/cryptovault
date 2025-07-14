// src/pages/DivulgationDesRisquesPage.tsx
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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { EmailIcon, ArrowBackIcon, ExternalLinkIcon, CheckCircleIcon, LockIcon, WarningIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

const DivulgationDesRisquesPage: React.FC = () => {
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
        bgImage="transparent"
        pointerEvents="none"
      />
      
      <Container maxW={containerMaxW} position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch">
          
          {/* En-tête avec navigation amélioré */}
          <Card
            bg={cardBg}
            backdropFilter="blur(30px)"
            border="2px solid"
            borderColor="red.300"
            borderRadius="3xl"
            shadow="2xl"
            overflow="hidden"
          >
            <Box
              bgGradient="linear(135deg, #dc2626 0%, #b91c1c 100%)"
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
                  <WarningIcon fontSize="4xl" color="white" />
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
                    DIVULGATION DES RISQUES
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

          {/* Avertissement critique */}
          <Alert 
            status="error" 
            borderRadius="2xl" 
            bg="linear-gradient(135deg, #fed7d7 0%, #fc8181 100%)"
            border="3px solid" 
            borderColor="red.400"
            p={8}
            shadow="2xl"
          >
            <AlertIcon color="red.600" boxSize={8} />
            <Box>
              <Text fontWeight="bold" color="red.800" fontSize="2xl" fontFamily="'Inter', sans-serif" mb={3}>
                ⚠️ AVERTISSEMENT CRITIQUE
              </Text>
              <Text color="red.700" fontSize="lg" lineHeight="1.8" fontFamily="'Inter', sans-serif">
                Cette divulgation contient des informations importantes sur les risques associés à l'utilisation de CryptocaVault. 
                <Text as="span" fontWeight="bold"> VEUILLEZ LIRE ATTENTIVEMENT CE DOCUMENT AVANT D'UTILISER NOS SERVICES.</Text>
              </Text>
            </Box>
          </Alert>

          {/* Section 1 - Nature des Services */}
          <Card
            bg={cardBg}
            backdropFilter="blur(30px)"
            border="2px solid"
            borderColor="red.300"
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
                  bg="linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">1</Text>
                </Box>
                <Heading size={sectionSize} color="red.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  NATURE DES SERVICES
                </Heading>
              </HStack>
              
              <VStack spacing={6} align="stretch">
                <Alert status="error" borderRadius="xl" bg="red.50" border="2px solid" borderColor="red.300">
                  <AlertIcon color="red.500" />
                  <Box>
                    <Text fontWeight="bold" fontSize="lg" color="red.800" fontFamily="'Inter', sans-serif">
                      🚫 1.1 Aucune Garantie de Rendement
                    </Text>
                    <Text fontSize="md" mt={2} color="red.700" fontFamily="'Inter', sans-serif" fontWeight="600">
                      NOUS NE GARANTISSONS AUCUN RENDEMENT FIXE, AUCUN APR, NI AUCUN PROFIT.
                    </Text>
                  </Box>
                </Alert>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box p={6} bg="orange.50" borderRadius="xl" border="1px solid" borderColor="orange.300">
                    <Text fontWeight="bold" color="orange.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={3}>
                      📊 1.2 Récompenses Basées sur la Performance
                    </Text>
                    <Text color="orange.700" mb={3} fontFamily="'Inter', sans-serif">
                      Toutes les récompenses dépendent de :
                    </Text>
                    <UnorderedList color="orange.700" spacing={2}>
                      <ListItem>Performance réelle des stratégies DeFi</ListItem>
                      <ListItem>Succès du yield farming et trading</ListItem>
                      <ListItem>Conditions de marché</ListItem>
                      <ListItem>Performance des protocoles partenaires</ListItem>
                    </UnorderedList>
                  </Box>
                  
                  <Box p={6} bg="red.50" borderRadius="xl" border="1px solid" borderColor="red.300">
                    <Text fontWeight="bold" color="red.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={3}>
                      💸 1.3 Possibilité de Pertes
                    </Text>
                    <Text color="red.700" fontWeight="600" fontSize="lg" fontFamily="'Inter', sans-serif">
                      VOS RÉCOMPENSES PEUVENT ÊTRE NULLES OU NÉGATIVES. RISQUE RÉEL DE PERTE TOTALE DE VOS FONDS.
                    </Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>

          {/* Section 2 - Risques Cryptomonnaies */}
          <Card
            bg={cardBg}
            backdropFilter="blur(30px)"
            border="2px solid"
            borderColor="orange.300"
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
                  bg="linear-gradient(135deg, #ea580c 0%, #c2410c 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">2</Text>
                </Box>
                <Heading size={sectionSize} color="orange.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  RISQUES LIÉS AUX CRYPTOMONNAIES
                </Heading>
              </HStack>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {[
                  {
                    icon: "📈",
                    title: "2.1 Volatilité Extrême",
                    desc: "Fluctuations drastiques en minutes",
                    points: ["Perte de 50%+ rapidement", "Facteurs imprévisibles", "Variations extrêmes"],
                    color: "red"
                  },
                  {
                    icon: "🌊",
                    title: "2.2 Risque de Marché", 
                    desc: "Effondrement soudain possible",
                    points: ["Bear markets durables", "Liquidité volatile", "Corrélations changeantes"],
                    color: "orange"
                  },
                  {
                    icon: "⚙️",
                    title: "2.3 Risque Technologique",
                    desc: "Défaillances techniques",
                    points: ["Bugs smart contracts", "Failles sécurité", "Pannes blockchain"],
                    color: "yellow"
                  }
                ].map((risk, index) => (
                  <Box key={index} p={6} bg={`${risk.color}.50`} borderRadius="xl" border="2px solid" borderColor={`${risk.color}.300`}>
                    <VStack spacing={4} align="start">
                      <HStack spacing={3}>
                        <Text fontSize="3xl">{risk.icon}</Text>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold" color={`${risk.color}.800`} fontSize="lg" fontFamily="'Inter', sans-serif">
                            {risk.title}
                          </Text>
                          <Text fontSize="sm" color={`${risk.color}.700`} fontFamily="'Inter', sans-serif">
                            {risk.desc}
                          </Text>
                        </VStack>
                      </HStack>
                      <UnorderedList color={`${risk.color}.700`} spacing={1} fontSize="sm">
                        {risk.points.map((point, i) => (
                          <ListItem key={i}>{point}</ListItem>
                        ))}
                      </UnorderedList>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Section 3 - Risques Spécifiques à la Plateforme */}
          <Card
            bg={cardBg}
            backdropFilter="blur(30px)"
            border="2px solid"
            borderColor="purple.300"
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
                  bg="linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">3</Text>
                </Box>
                <Heading size={sectionSize} color="purple.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  RISQUES SPÉCIFIQUES À LA PLATEFORME
                </Heading>
              </HStack>
              
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" color={headerColor} mb={4} fontFamily="'Inter', sans-serif" fontWeight="600">
                    ⚡ 3.1 Risques de Stratégie
                  </Heading>
                  
                  <Accordion allowMultiple>
                    {[
                      {
                        title: "🌾 Yield Farming DeFi",
                        risks: ["Impermanent loss", "Échec des protocoles", "Rug pulls", "Changements tokenomics"],
                        color: "green"
                      },
                      {
                        title: "🥩 Staking",
                        risks: ["Risque de slashing", "Périodes de déblocage longues", "Risque de validateur", "Dévaluation du token staké"],
                        color: "orange"
                    },
                      {
                        title: "🤖 Trading Algorithmique", 
                        risks: ["Erreurs d'algorithme", "Conditions imprevues", "Problèmes d'exécution", "Risque liquidation"],
                        color: "blue"
                      },
                      {
                        title: "🔄 Arbitrage",
                        risks: ["Disparition d'opportunités", "Coûts élevés", "Risques contrepartie", "Échecs d'exécution"],
                        color: "teal"
                      },
                      {
                        title: "💧 Provision de Liquidité",
                        risks: ["Impermanent loss garanti", "Slippage", "Concentration liquidité", "Risques protocole"],
                        color: "cyan"
                      }
                    ].map((strategy, index) => (
                      <AccordionItem key={index} border="1px solid" borderColor={`${strategy.color}.200`} borderRadius="xl" mb={4}>
                        <AccordionButton p={4} bg={`${strategy.color}.50`} borderRadius="xl" _expanded={{ bg: `${strategy.color}.100` }}>
                          <Box flex="1" textAlign="left">
                            <Text fontWeight="bold" color={`${strategy.color}.800`} fontSize="lg" fontFamily="'Inter', sans-serif">
                              {strategy.title}
                            </Text>
                          </Box>
                          <AccordionIcon color={`${strategy.color}.600`} />
                        </AccordionButton>
                        <AccordionPanel p={4} bg={`${strategy.color}.25`}>
                          <UnorderedList color={`${strategy.color}.700`} spacing={2}>
                            {strategy.risks.map((risk, i) => (
                              <ListItem key={i} fontFamily="'Inter', sans-serif">{risk}</ListItem>
                            ))}
                          </UnorderedList>
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box p={6} bg="purple.50" borderRadius="xl" border="1px solid" borderColor="purple.300">
                    <Text fontWeight="bold" color="purple.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={3}>
                      🎯 3.2 Risque de Concentration
                    </Text>
                    <UnorderedList color="purple.700" spacing={2}>
                      <ListItem>Dépendance à un nombre limité de stratégies</ListItem>
                      <ListItem>Concentration géographique/technologique</ListItem>
                      <ListItem>Risques de corrélation élevée</ListItem>
                    </UnorderedList>
                  </Box>
                  
                  <Box p={6} bg="red.50" borderRadius="xl" border="1px solid" borderColor="red.300">
                    <Text fontWeight="bold" color="red.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={3}>
                      🚨 3.3 Risque Opérationnel
                    </Text>
                    <UnorderedList color="red.700" spacing={2}>
                      <ListItem>Erreurs humaines de l'équipe</ListItem>
                      <ListItem>Défaillances techniques</ListItem>
                      <ListItem>Problèmes de gouvernance</ListItem>
                      <ListItem>Risques de cybersécurité</ListItem>
                    </UnorderedList>
                  </Box>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>

          {/* Section 4 - Risques NFT */}
          <Card
            bg={cardBg}
            backdropFilter="blur(30px)"
            border="2px solid"
            borderColor="pink.300"
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
                  bg="linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">4</Text>
                </Box>
                <Heading size={sectionSize} color="pink.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  RISQUES LIÉS AUX NFT
                </Heading>
              </HStack>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {[
                  {
                    icon: "🎨",
                    title: "4.1 Nature des NFT",
                    points: ["NE sont PAS des parts de propriété", "NE sont PAS des securities", "Peuvent perdre toute valeur", "Marché hautement spéculatif"],
                    color: "pink"
                  },
                  {
                    icon: "⚙️",
                    title: "4.2 Risques Technologiques",
                    points: ["Problèmes smart contract", "Perte d'accès wallet", "Erreurs de transfert", "Incompatibilité tech"],
                    color: "purple"
                  },
                  {
                    icon: "💧",
                    title: "4.3 Liquidité des NFT",
                    points: ["Marché secondaire limité", "Difficulté de revente", "Prix imprévisibles", "Absence d'acheteurs"],
                    color: "red"
                  }
                ].map((risk, index) => (
                  <Box key={index} p={6} bg={`${risk.color}.50`} borderRadius="xl" border="2px solid" borderColor={`${risk.color}.300`}>
                    <VStack spacing={4} align="start">
                      <HStack spacing={3}>
                        <Text fontSize="3xl">{risk.icon}</Text>
                        <Text fontWeight="bold" color={`${risk.color}.800`} fontSize="lg" fontFamily="'Inter', sans-serif">
                          {risk.title}
                        </Text>
                      </HStack>
                      <UnorderedList color={`${risk.color}.700`} spacing={1} fontSize="sm">
                        {risk.points.map((point, i) => (
                          <ListItem key={i} fontFamily="'Inter', sans-serif">{point}</ListItem>
                        ))}
                      </UnorderedList>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Section 5-9 - Autres Risques en Accordéon */}
          <Card
            bg={cardBg}
            backdropFilter="blur(30px)"
            border="2px solid"
            borderColor={borderColor}
            borderRadius="2xl"
            shadow="xl"
          >
            <CardBody p={8}>
              <Heading size={sectionSize} color={headerColor} fontFamily="'Inter', sans-serif" fontWeight="700" mb={6}>
                🔍 AUTRES RISQUES IMPORTANTS
              </Heading>
              
              <Accordion allowMultiple>
                {[
                  {
                    number: "5",
                    title: "📜 Risques Réglementaires",
                    content: {
                      "Incertitude Réglementaire": ["Évolution rapide des réglementations", "Interdictions potentielles", "Nouvelles obligations fiscales"],
                      "Conformité": ["Risques de non-conformité", "Obligations KYC/AML changeantes", "Restrictions géographiques"]
                    },
                    color: "blue"
                  },
                  {
                    number: "6", 
                    title: "💧 Risques de Liquidité",
                    content: {
                      "Périodes de Blocage": ["Fonds inaccessibles (30-360 jours)", "Impossibilité de retrait d'urgence", "Pénalités de sortie anticipée"],
                      "Liquidité Plateforme": ["Illiquidité temporaire/permanente", "Problèmes de retrait", "Concentration des sorties"]
                    },
                    color: "teal"
                  },
                  {
                    number: "7",
                    title: "🤝 Risques de Contrepartie", 
                    content: {
                      "Risque CryptocaVault": ["Défaillance de l'entreprise", "Problèmes financiers", "Faillite possible"],
                      "Protocoles Tiers": ["Défaillance protocoles DeFi", "Piratages partenaires", "Changements de politique"]
                    },
                    color: "orange"
                  },
                  {
                    number: "8",
                    title: "🔒 Risques Techniques et Sécurité",
                    content: {
                      "Sécurité Blockchain": ["Attaques 51%", "Forks blockchain", "Bugs consensus"],
                      "Sécurité Informatique": ["Piratages plateforme", "Vol de données", "Attaques DDoS", "Malwares"]
                    },
                    color: "red"
                  },
                  {
                    number: "9",
                    title: "🌍 Facteurs Externes",
                    content: {
                      "Macroéconomiques": ["Crises économiques", "Politiques monétaires", "Inflation/déflation", "Conflits"],
                      "Adoption et Sentiment": ["Sentiment marché", "Adoption institutionnelle", "Influences médias", "Cycles hype/peur"]
                    },
                    color: "purple"
                  }
                ].map((section, index) => (
                  <AccordionItem key={index} border="2px solid" borderColor={`${section.color}.200`} borderRadius="xl" mb={4}>
                    <AccordionButton p={6} bg={`${section.color}.50`} borderRadius="xl" _expanded={{ bg: `${section.color}.100` }}>
                      <HStack spacing={4} flex="1" textAlign="left">
                        <Box
                          w={10}
                          h={10}
                          bg={`${section.color}.500`}
                          borderRadius="lg"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text fontSize="lg" fontWeight="bold" color="white">{section.number}</Text>
                        </Box>
                        <Text fontWeight="bold" color={`${section.color}.800`} fontSize="lg" fontFamily="'Inter', sans-serif">
                          {section.title}
                        </Text>
                      </HStack>
                      <AccordionIcon color={`${section.color}.600`} />
                    </AccordionButton>
                    <AccordionPanel p={6} bg={`${section.color}.25`}>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        {Object.entries(section.content).map(([key, values], i) => (
                          <Box key={i} p={4} bg="white" borderRadius="lg" border="1px solid" borderColor={`${section.color}.200`}>
                            <Text fontWeight="bold" color={`${section.color}.800`} mb={3} fontFamily="'Inter', sans-serif">
                              {key}
                            </Text>
                            <UnorderedList color={`${section.color}.700`} spacing={1}>
                              {values.map((value, j) => (
                                <ListItem key={j} fontSize="sm" fontFamily="'Inter', sans-serif">{value}</ListItem>
                              ))}
                            </UnorderedList>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardBody>
          </Card>

          {/* Section 10 - Considérations Fiscales */}
          <Card
            bg="linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)"
            backdropFilter="blur(30px)"
            border="2px solid"
            borderColor="yellow.400"
            borderRadius="2xl"
            shadow="xl"
          >
            <CardBody p={8}>
              <HStack spacing={4} mb={6}>
                <Box
                  w={12}
                  h={12}
                  bg="linear-gradient(135deg, #eab308 0%, #ca8a04 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">💰</Text>
                </Box>
                <Heading size={sectionSize} color="yellow.700" fontFamily="'Inter', sans-serif" fontWeight="700">
                  CONSIDÉRATIONS FISCALES
                </Heading>
              </HStack>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Box p={6} bg="yellow.50" borderRadius="xl" border="2px solid" borderColor="yellow.300">
                  <Text fontWeight="bold" color="yellow.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={3}>
                    📊 10.1 Complexité Fiscale
                  </Text>
                  <UnorderedList color="yellow.700" spacing={2}>
                    <ListItem>Réglementations complexes et changeantes</ListItem>
                    <ListItem>Différences entre juridictions</ListItem>
                    <ListItem>Obligations de déclaration</ListItem>
                    <ListItem>Risques de pénalités fiscales</ListItem>
                  </UnorderedList>
                </Box>
                
                <Box p={6} bg="red.50" borderRadius="xl" border="2px solid" borderColor="red.300">
                  <Text fontWeight="bold" color="red.800" fontSize="lg" fontFamily="'Inter', sans-serif" mb={3}>
                    ⚖️ 10.2 Responsabilité Utilisateur
                  </Text>
                  <Text color="red.700" fontWeight="600" fontSize="md" fontFamily="'Inter', sans-serif">
                    VOUS ÊTES ENTIÈREMENT RESPONSABLE DE VOS OBLIGATIONS FISCALES. CONSULTEZ UN CONSEILLER FISCAL QUALIFIÉ.
                  </Text>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Section 11 - Recommandations */}
          <Card
            bg={cardBg}
            backdropFilter="blur(30px)"
            border="2px solid"
            borderColor="green.300"
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
                  bg="linear-gradient(135deg, #16a34a 0%, #15803d 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">💡</Text>
                </Box>
                <Heading size={sectionSize} color="green.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  RECOMMANDATIONS IMPORTANTES
                </Heading>
              </HStack>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {[
                  {
                    icon: "🎯",
                    title: "11.1 Diversification",
                    points: [
                      "Ne jamais investir plus que ce que vous pouvez perdre",
                      "Diversifier vos placements", 
                      "Ne pas concentrer sur une seule stratégie"
                    ],
                    color: "green"
                  },
                  {
                    icon: "🔍",
                    title: "11.2 Due Diligence", 
                    points: [
                      "Comprendre parfaitement les risques",
                      "Effectuer vos propres recherches",
                      "Consulter des conseillers qualifiés",
                      "Surveiller régulièrement"
                    ],
                    color: "blue"
                  },
                  {
                    icon: "🛡️",
                    title: "11.3 Gestion des Risques",
                    points: [
                      "Établir des limites de perte",
                      "Réévaluer régulièrement l'exposition",
                      "Maintenir des réserves d'urgence",
                      "Comprendre les implications fiscales"
                    ],
                    color: "purple"
                  }
                ].map((rec, index) => (
                  <Box key={index} p={6} bg={`${rec.color}.50`} borderRadius="xl" border="2px solid" borderColor={`${rec.color}.300`}>
                    <VStack spacing={4} align="start">
                      <HStack spacing={3}>
                        <Text fontSize="3xl">{rec.icon}</Text>
                        <Text fontWeight="bold" color={`${rec.color}.800`} fontSize="lg" fontFamily="'Inter', sans-serif">
                          {rec.title}
                        </Text>
                      </HStack>
                      <UnorderedList color={`${rec.color}.700`} spacing={2} fontSize="sm">
                        {rec.points.map((point, i) => (
                          <ListItem key={i} fontFamily="'Inter', sans-serif">{point}</ListItem>
                        ))}
                      </UnorderedList>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Section 12 - Déclarations Importantes */}
          <Card
            bg="linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)"
            backdropFilter="blur(30px)"
            border="3px solid"
            borderColor="red.400"
            borderRadius="2xl"
            shadow="2xl"
          >
            <CardBody p={8}>
              <HStack spacing={4} mb={6}>
                <Box
                  w={12}
                  h={12}
                  bg="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">⚠️</Text>
                </Box>
                <Heading size={sectionSize} color="red.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  DÉCLARATIONS IMPORTANTES
                </Heading>
              </HStack>
              
              <VStack spacing={6}>
                {[
                  {
                    title: "🚫 12.1 Aucun Conseil Financier",
                    content: "CryptocaVault ne fournit aucun conseil en investissement, financier, fiscal ou juridique. Nos communications sont uniquement informatives.",
                    color: "red"
                  },
                  {
                    title: "📊 12.2 Performance Passée", 
                    content: "Les performances passées ne préjugent pas des résultats futurs. Les stratégies qui ont bien fonctionné peuvent échouer.",
                    color: "orange"
                  },
                  {
                    title: "🚫 12.3 Aucune Garantie",
                    content: "NOUS NE GARANTISSONS RIEN CONCERNANT : les performances futures, la disponibilité du service, la sécurité absolue, la conformité réglementaire continue.",
                    color: "red"
                  }
                ].map((decl, index) => (
                  <Alert key={index} status="error" borderRadius="xl" bg={`${decl.color}.50`} border="2px solid" borderColor={`${decl.color}.300`} p={6}>
                    <AlertIcon color={`${decl.color}.500`} boxSize={6} />
                    <Box>
                      <Text fontWeight="bold" fontSize="lg" color={`${decl.color}.800`} fontFamily="'Inter', sans-serif" mb={2}>
                        {decl.title}
                      </Text>
                      <Text fontSize="md" color={`${decl.color}.700`} fontFamily="'Inter', sans-serif" lineHeight="1.6">
                        {decl.content}
                      </Text>
                    </Box>
                  </Alert>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Section 13 - Responsabilité Utilisateur */}
          <Card
            bg={cardBg}
            backdropFilter="blur(30px)"
            border="2px solid"
            borderColor="blue.300"
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
                  bg="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">👤</Text>
                </Box>
                <Heading size={sectionSize} color="blue.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  RESPONSABILITÉ UTILISATEUR
                </Heading>
              </HStack>
              
              <Box p={6} bg="blue.50" borderRadius="xl" border="2px solid" borderColor="blue.300">
                <Text color="blue.700" fontSize="lg" fontFamily="'Inter', sans-serif" mb={4} lineHeight="1.8">
                  En utilisant CryptocaVault, vous reconnaissez et acceptez que :
                </Text>
                <VStack spacing={3} align="stretch">
                  {[
                    "Vous comprenez tous les risques décrits",
                    "Vous acceptez la possibilité de pertes totales", 
                    "Vous êtes seul responsable de vos décisions de placement",
                    "Vous ne vous fiez pas à nos communications comme conseils",
                    "Vous respecterez toutes les lois applicables"
                  ].map((item, index) => (
                    <HStack key={index} spacing={3} p={3} bg="white" borderRadius="lg" border="1px solid" borderColor="blue.200">
                      <Icon as={CheckCircleIcon} color="blue.500" boxSize={5} />
                      <Text color="blue.800" fontFamily="'Inter', sans-serif" fontWeight="500">
                        {item}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </CardBody>
          </Card>

          {/* Section 14 - Mise à jour */}
          <Card
            bg={cardBg}
            backdropFilter="blur(30px)"
            border="2px solid"
            borderColor="teal.300"
            borderRadius="2xl"
            shadow="xl"
          >
            <CardBody p={8}>
              <HStack spacing={4} mb={6}>
                <Box
                  w={12}
                  h={12}
                  bg="linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  shadow="lg"
                >
                  <Text fontSize="xl" fontWeight="bold" color="white">🔄</Text>
                </Box>
                <Heading size={sectionSize} color="teal.600" fontFamily="'Inter', sans-serif" fontWeight="700">
                  MISE À JOUR DE CETTE DIVULGATION
                </Heading>
              </HStack>
              
              <Box p={6} bg="teal.50" borderRadius="xl" border="1px solid" borderColor="teal.300">
                <Text color="teal.700" fontSize="lg" fontFamily="'Inter', sans-serif" lineHeight="1.8">
                  Cette divulgation peut être mise à jour pour refléter de nouveaux risques ou changements réglementaires. 
                  <Text as="span" fontWeight="bold"> Consultez régulièrement la version la plus récente.</Text>
                </Text>
              </Box>
            </CardBody>
          </Card>

          {/* Avertissement Final */}
          <Card
            bg="linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
            borderRadius="2xl"
            shadow="2xl"
            color="white"
            border="3px solid"
            borderColor="red.300"
          >
            <CardBody p={10} textAlign="center">
              <VStack spacing={8}>
                <Text fontSize="4xl" mb={4}>⚠️</Text>
                <Heading size="xl" fontFamily="'Inter', sans-serif" fontWeight="800" letterSpacing="-0.02em">
                  AVERTISSEMENT FINAL
                </Heading>
                
                <Box 
                  p={8} 
                  bg="rgba(255,255,255,0.15)" 
                  borderRadius="2xl" 
                  border="2px solid rgba(255,255,255,0.3)"
                  backdropFilter="blur(10px)"
                  maxW="4xl"
                >
                  <Text 
                    fontSize="xl" 
                    fontWeight="700"
                    lineHeight="1.8"
                    fontFamily="'Inter', sans-serif"
                    mb={6}
                  >
                    L'UTILISATION DE CRYPTOCAVAULT EST HAUTEMENT RISQUÉE ET PEUT ENTRAÎNER LA PERTE TOTALE DE VOS FONDS.
                  </Text>
                  <Text 
                    fontSize="lg" 
                    fontWeight="600"
                    lineHeight="1.8"
                    fontFamily="'Inter', sans-serif"
                    opacity={0.95}
                  >
                    NE PARTICIPEZ QUE SI VOUS COMPRENEZ ET ACCEPTEZ TOUS LES RISQUES DÉCRITS CI-DESSUS.
                  </Text>
                </Box>

                <Divider borderColor="rgba(255,255,255,0.3)" />

                <Box p={6} bg="rgba(255,255,255,0.1)" borderRadius="xl" maxW="4xl">
                  <Text 
                    fontSize="lg" 
                    fontWeight="600"
                    fontFamily="'Inter', sans-serif"
                    lineHeight="1.8"
                  >
                    EN UTILISANT NOTRE PLATEFORME, VOUS CONFIRMEZ AVOIR LU, COMPRIS ET ACCEPTÉ TOUS CES RISQUES.
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Contact et Support */}
          <Card
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            borderRadius="2xl"
            shadow="2xl"
            color="white"
          >
            <CardBody p={8} textAlign="center">
              <VStack spacing={6}>
                <Heading size="lg" fontFamily="'Inter', sans-serif" fontWeight="700">
                  📧 QUESTIONS SUR CES RISQUES
                </Heading>
                
                <Box p={6} bg="rgba(255,255,255,0.15)" borderRadius="xl" w="full" maxW="md">
                  <VStack spacing={4}>
                    <HStack spacing={3}>
                      <EmailIcon boxSize={6} />
                      <Text fontSize="lg" fontFamily="'Inter', sans-serif" fontWeight="600">
                        Pour toute question :
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
                      border="1px solid rgba(255,255,255,0.3)"
                    >
                      support@cryptocavault.com
                    </Link>
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Footer avec reconnaissance finale */}
          <Card
            bg="white"
            backdropFilter="blur(30px)"
            border="3px solid"
            borderColor="red.400"
            borderRadius="2xl"
            shadow="2xl"
          >
            <CardBody p={8} textAlign="center">
              <VStack spacing={6}>
                <Text fontSize="3xl" mb={2}>📋</Text>
                <Heading size="lg" color="red.700" fontFamily="'Inter', sans-serif" fontWeight="700">
                  RECONNAISSANCE DE LECTURE
                </Heading>
                <Text 
                  color="red.700" 
                  lineHeight="1.8" 
                  fontWeight="600"
                  fontSize="lg"
                  fontFamily="'Inter', sans-serif"
                  maxW="4xl"
                >
                  EN CONTINUANT, JE CERTIFIE AVOIR LU ET COMPRIS TOUS LES RISQUES PRÉSENTÉS DANS CETTE DIVULGATION.
                </Text>
                <Text 
                  color="red.600" 
                  fontSize="md"
                  fontFamily="'Inter', sans-serif"
                  fontStyle="italic"
                  mt={4}
                  opacity={0.9}
                >
                  Cette divulgation fait partie intégrante de nos Conditions d'Utilisation et de notre Politique de Confidentialité.
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Navigation bottom améliorée */}
          <HStack spacing={6} justify="center" pt={4}>
            <Button
              leftIcon={<ArrowBackIcon />}
              colorScheme="red"
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
              bg="linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
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
                bg: "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)"
              }}
            >
              J'ai compris les risques
            </Button>
          </HStack>

        </VStack>
      </Container>
    </Box>
  );
};

export default DivulgationDesRisquesPage;