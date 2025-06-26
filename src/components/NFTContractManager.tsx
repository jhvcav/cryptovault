// src/components/NFTContractManager.tsx - Version complète intégrée
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Image,
  Link,
  IconButton,
  Tooltip,
  Progress,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Divider
} from '@chakra-ui/react';
import { ExternalLinkIcon, InfoIcon, EditIcon, AddIcon, CheckIcon, WarningIcon } from '@chakra-ui/icons';

// Imports des hooks et services
import { useNFTContract, NFTTier, RevenueStats } from '../hooks/useNFTContract';
import { usePinata, pinataService } from '../services/pinataService';
import FidelityManager from './FidelityManager';

const NFTContractManager: React.FC = () => {
  // États pour les données du contrat
  const [tiers, setTiers] = useState<NFTTier[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTier, setSelectedTier] = useState<NFTTier | null>(null);
  const [consistencyResults, setConsistencyResults] = useState<any[]>([]);
  const [pinataMetadata, setPinataMetadata] = useState<any[]>([]);
  
  // États pour les formulaires
  const [newTierForm, setNewTierForm] = useState({
    name: '',
    description: '',
    price: '0',
    supply: 100,
    multiplier: 100,
    baseURI: '',
    accessPlans: ['starter'],
    isSpecial: false
  });
  
  const [editTierForm, setEditTierForm] = useState({
    price: '',
    supply: 0,
    active: true
  });

  // États UI
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Hooks
  const toast = useToast();
  const {
    contract,
    isOwner,
    loading: contractLoading,
    error: contractError,
    getAllTiers,
    getRevenueStats,
    createNewTier,
    updateTier,
    toggleTier,
    mintSpecialNFT,
    setupEventListeners
  } = useNFTContract();
  
  const {
    isAuthenticated: pinataAuth,
    loading: pinataLoading,
    error: pinataError,
    verifyTierConsistency,
    getMetadataForTier
  } = usePinata();

  // Charger les données initiales
  useEffect(() => {
    if (contract && !contractLoading) {
      loadAllData();
      
      // Configurer les listeners d'événements
      const cleanup = setupEventListeners({
        onTierCreated: (tierId, name, price, supply) => {
          toast({
            title: 'Nouveau Tier Créé',
            description: `${name} (ID: ${tierId}) créé avec succès`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          loadAllData(); // Recharger les données
        },
        onNFTPurchased: (buyer, tokenId, tier, price) => {
          toast({
            title: 'NFT Acheté',
            description: `Token #${tokenId} acheté pour $${price}`,
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
          loadAllData();
        },
        onSpecialNFTMinted: (to, tokenId, tier, reason) => {
          toast({
            title: 'NFT Spécial Minté',
            description: `Token #${tokenId} minté pour ${to}`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          loadAllData();
        }
      });

      return cleanup;
    }
  }, [contract, contractLoading]);

  // Fonction pour charger toutes les données
  const loadAllData = async () => {
    try {
      // Charger les tiers du contrat
      const contractTiers = await getAllTiers();
      setTiers(contractTiers);
      
      // Charger les stats de revenus
      const stats = await getRevenueStats();
      setRevenueStats(stats);
      
      // Charger les données Pinata si authentifié
      if (pinataAuth) {
        await loadPinataData(contractTiers);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du contrat',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Charger les données Pinata
  const loadPinataData = async (contractTiers: NFTTier[]) => {
    try {
      setLoadingAction('Vérification Pinata...');
      
      // Vérifier la cohérence pour chaque tier
      const results = await verifyTierConsistency(contractTiers.map(tier => ({
        id: tier.id,
        name: tier.name,
        baseURI: tier.baseURI,
        minted: tier.minted
      })));
      
      setConsistencyResults(results);
      
      // Charger quelques exemples de métadonnées
      const metadataExamples = [];
      for (const tier of contractTiers.slice(0, 3)) { // Limiter à 3 tiers pour l'exemple
        try {
          const metadata = await getMetadataForTier(tier.baseURI, Math.min(tier.minted, 5));
          metadataExamples.push(...metadata.map(m => ({
            ...m,
            tierName: tier.name,
            tierId: tier.id
          })));
        } catch (error) {
          console.warn(`Erreur métadonnées tier ${tier.name}:`, error);
        }
      }
      
      setPinataMetadata(metadataExamples);
    } catch (error) {
      console.error('Erreur chargement Pinata:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  // Créer un nouveau tier
  const handleCreateTier = async () => {
    if (!isOwner) {
      toast({
        title: 'Accès refusé',
        description: 'Seul le owner peut créer des tiers',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoadingAction('Création du tier...');
      
      const txHash = await createNewTier(
        newTierForm.name,
        newTierForm.description,
        newTierForm.price,
        newTierForm.supply,
        newTierForm.multiplier,
        newTierForm.baseURI,
        newTierForm.accessPlans,
        newTierForm.isSpecial
      );
      
      toast({
        title: 'Tier créé',
        description: `Transaction: ${txHash.substring(0, 10)}...`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form
      setNewTierForm({
        name: '',
        description: '',
        price: '0',
        supply: 100,
        multiplier: 100,
        baseURI: '',
        accessPlans: ['starter'],
        isSpecial: false
      });
      
      // Recharger les données après 3 secondes (temps pour la confirmation)
      setTimeout(loadAllData, 3000);
      
    } catch (error) {
      console.error('Erreur création tier:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la création',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Modifier un tier existant
  const handleUpdateTier = async () => {
    if (!selectedTier || !isOwner) return;

    try {
      setLoadingAction('Modification du tier...');
      
      const txHash = await updateTier(
        selectedTier.id,
        editTierForm.price,
        editTierForm.supply,
        editTierForm.active
      );
      
      toast({
        title: 'Tier modifié',
        description: `Transaction: ${txHash.substring(0, 10)}...`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      onClose();
      setTimeout(loadAllData, 3000);
      
    } catch (error) {
      console.error('Erreur modification tier:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la modification',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Activer/Désactiver un tier
  const handleToggleTier = async (tierId: number, currentActive: boolean) => {
    if (!isOwner) return;

    try {
      setLoadingAction(`${currentActive ? 'Désactivation' : 'Activation'} du tier...`);
      
      const txHash = await toggleTier(tierId, !currentActive);
      
      toast({
        title: `Tier ${!currentActive ? 'activé' : 'désactivé'}`,
        description: `Transaction: ${txHash.substring(0, 10)}...`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setTimeout(loadAllData, 3000);
      
    } catch (error) {
      console.error('Erreur toggle tier:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la modification',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Minter un NFT spécial
  const handleMintSpecialNFT = async (tierId: number) => {
    if (!isOwner) return;

    const address = prompt('Adresse destinataire du NFT spécial :');
    if (!address) return;

    const reason = prompt('Raison du mint spécial :') || 'Mint administrateur';

    try {
      setLoadingAction('Mint du NFT spécial...');
      
      const txHash = await mintSpecialNFT(address, tierId, reason);
      
      toast({
        title: 'NFT spécial minté',
        description: `Transaction: ${txHash.substring(0, 10)}...`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setTimeout(loadAllData, 3000);
      
    } catch (error) {
      console.error('Erreur mint spécial:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du mint',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Fonction pour ouvrir le modal d'édition
  const openEditModal = (tier: NFTTier) => {
    setSelectedTier(tier);
    setEditTierForm({
      price: tier.price,
      supply: tier.supply,
      active: tier.active
    });
    onOpen();
  };

  // Calculer les statistiques globales
  const globalStats = {
    totalMinted: tiers.reduce((sum, tier) => sum + tier.minted, 0),
    totalSupply: tiers.reduce((sum, tier) => sum + tier.supply, 0),
    activeTiers: tiers.filter(t => t.active).length,
    totalRevenue: revenueStats ? parseFloat(revenueStats.totalRevenue) : 0
  };

  if (contractLoading || pinataLoading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" color="orange.500" />
        <Text mt={4}>Chargement des données du contrat...</Text>
        {loadingAction && (
          <Text mt={2} fontSize="sm" color="gray.600">
            {loadingAction}
          </Text>
        )}
      </Box>
    );
  }

  if (contractError) {
    return (
      <Alert status="error" borderRadius="lg">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Erreur de connexion au contrat</Text>
          <Text fontSize="sm">{contractError}</Text>
        </Box>
      </Alert>
    );
  }

  return (
    <Box p={6} maxW="1400px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* En-tête avec statut de connexion */}
        <Box>
          <HStack justify="space-between" align="center" mb={4}>
            <VStack align="start" spacing={1}>
              <Heading size="lg" color="orange.500">
                ⚙️ Gestion Smart Contract NFT
              </Heading>
              <HStack spacing={4}>
                <Text color="gray.600" fontSize="sm">
                  Contrat : 0xFC7206e81211F52Fc6Cdb20ac9D4deDC5fb40b72
                  <Link href="https://bscscan.com/address/0xFC7206e81211F52Fc6Cdb20ac9D4deDC5fb40b72" isExternal ml={2}>
                    <ExternalLinkIcon />
                  </Link>
                </Text>
                <Badge colorScheme={isOwner ? 'green' : 'red'}>
                  {isOwner ? '👑 OWNER' : '👤 USER'}
                </Badge>
                <Badge colorScheme={pinataAuth ? 'green' : 'orange'}>
                  📁 Pinata: {pinataAuth ? 'Connecté' : 'Déconnecté'}
                </Badge>
              </HStack>
            </VStack>
            
            <Button
              colorScheme="blue"
              size="sm"
              onClick={loadAllData}
              isLoading={!!loadingAction}
              loadingText="Actualisation..."
            >
              🔄 Actualiser
            </Button>
          </HStack>

          {/* Alertes d'état */}
          {!isOwner && (
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <Text fontSize="sm">
                Vous êtes en mode lecture seule. Seul le owner peut modifier les tiers.
              </Text>
            </Alert>
          )}

          {pinataError && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              <Text fontSize="sm">
                Erreur Pinata : {pinataError}
              </Text>
            </Alert>
          )}
        </Box>

        {/* Statistiques globales */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Revenus Totaux</StatLabel>
                <StatNumber color="green.500">
                  ${globalStats.totalRevenue.toLocaleString()}
                </StatNumber>
                <StatHelpText>USDC générés</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>NFT Mintés</StatLabel>
                <StatNumber>{globalStats.totalMinted.toLocaleString()}</StatNumber>
                <StatHelpText>Sur {globalStats.totalSupply.toLocaleString()} total</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Tiers Actifs</StatLabel>
                <StatNumber>{globalStats.activeTiers}</StatNumber>
                <StatHelpText>Sur {tiers.length} total</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Taux Global</StatLabel>
                <StatNumber>
                  {globalStats.totalSupply > 0 
                    ? ((globalStats.totalMinted / globalStats.totalSupply) * 100).toFixed(1)
                    : 0}%
                </StatNumber>
                <StatHelpText>Supply utilisée</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Indicateur de chargement pour les actions */}
        {loadingAction && (
          <Alert status="info">
            <Spinner size="sm" mr={3} />
            <Text>{loadingAction}</Text>
          </Alert>
        )}

        {/* Onglets principaux */}
        <Tabs 
          index={activeTab} 
          onChange={setActiveTab} 
          variant="soft-rounded" 
          colorScheme="orange"
        >
          <TabList>
            <Tab>📋 Gestion des Tiers</Tab>
            {isOwner && <Tab>➕ Créer Nouveau Tier</Tab>}
            <Tab>🔍 Vérification Pinata</Tab>
            <Tab>💰 Analytics Avancées</Tab>
            <Tab>🎁 Gestion Fidélité</Tab>
          </TabList>

          <TabPanel>
            <FidelityManager />
          </TabPanel>


          <TabPanels>
            {/* Onglet 1: Gestion des Tiers */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">Tiers NFT du Contrat</Heading>
                  {isOwner && (
                    <Button 
                      colorScheme="orange" 
                      leftIcon={<AddIcon />}
                      onClick={() => setActiveTab(1)}
                    >
                      Créer Nouveau Tier
                    </Button>
                  )}
                </HStack>

                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>ID</Th>
                        <Th>Nom & Description</Th>
                        <Th>Prix</Th>
                        <Th>Supply / Mintés</Th>
                        <Th>Multiplicateur</Th>
                        <Th>Statut</Th>
                        <Th>Type</Th>
                        {isOwner && <Th>Actions</Th>}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {tiers.map((tier) => {
                        const sellRate = (tier.minted / tier.supply) * 100;
                        return (
                          <Tr key={tier.id}>
                            <Td fontWeight="bold">{tier.id}</Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold" fontSize="sm">{tier.name}</Text>
                                <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                  {tier.description}
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              {tier.price === '0' ? (
                                <Badge colorScheme="green" variant="solid">GRATUIT</Badge>
                              ) : (
                                <Text fontWeight="bold">${parseFloat(tier.price).toLocaleString()}</Text>
                              )}
                            </Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontSize="sm">{tier.minted} / {tier.supply}</Text>
                                <Progress 
                                  value={sellRate} 
                                  size="sm" 
                                  colorScheme={sellRate > 50 ? "green" : sellRate > 25 ? "yellow" : "red"}
                                  borderRadius="md"
                                />
                                <Text fontSize="xs" color="gray.500">
                                  {sellRate.toFixed(1)}%
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <Badge variant="outline" colorScheme="blue">
                                {(tier.multiplier / 100).toFixed(1)}x
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={tier.active ? 'green' : 'red'} variant="solid">
                                {tier.active ? 'ACTIF' : 'INACTIF'}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={tier.isSpecial ? 'purple' : 'blue'} variant="outline">
                                {tier.isSpecial ? 'SPÉCIAL' : 'STANDARD'}
                              </Badge>
                            </Td>
                            {isOwner && (
                              <Td>
                                <HStack spacing={1}>
                                  <Tooltip label="Modifier le tier">
                                    <IconButton
                                      aria-label="Modifier"
                                      icon={<EditIcon />}
                                      size="xs"
                                      onClick={() => openEditModal(tier)}
                                    />
                                  </Tooltip>
                                  <Button
                                    size="xs"
                                    colorScheme={tier.active ? 'red' : 'green'}
                                    onClick={() => handleToggleTier(tier.id, tier.active)}
                                    isDisabled={!!loadingAction}
                                  >
                                    {tier.active ? 'Pause' : 'Active'}
                                  </Button>
                                  {tier.isSpecial && (
                                    <Button
                                      size="xs"
                                      colorScheme="purple"
                                      onClick={() => handleMintSpecialNFT(tier.id)}
                                      isDisabled={!!loadingAction}
                                    >
                                      Mint
                                    </Button>
                                  )}
                                </HStack>
                              </Td>
                            )}
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </VStack>
            </TabPanel>

            {/* Onglet 2: Créer Nouveau Tier (Owner seulement) */}
            {isOwner && (
              <TabPanel>
                <VStack spacing={6} align="stretch" maxW="800px">
                  <Heading size="md">Créer un Nouveau Tier NFT</Heading>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Nom du Tier</FormLabel>
                      <Input
                        value={newTierForm.name}
                        onChange={(e) => setNewTierForm({...newTierForm, name: e.target.value})}
                        placeholder="Ex: Nouveau Tier Épique"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Type de Tier</FormLabel>
                      <Select
                        value={newTierForm.isSpecial ? 'special' : 'standard'}
                        onChange={(e) => setNewTierForm({...newTierForm, isSpecial: e.target.value === 'special'})}
                      >
                        <option value="standard">Standard (Achetable)</option>
                        <option value="special">Spécial (Mint Admin uniquement)</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl isRequired>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      value={newTierForm.description}
                      onChange={(e) => setNewTierForm({...newTierForm, description: e.target.value})}
                      placeholder="Description détaillée du tier et de ses avantages..."
                      rows={3}
                    />
                  </FormControl>

                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Prix (USDC)</FormLabel>
                      <NumberInput
                        value={newTierForm.price}
                        onChange={(value) => setNewTierForm({...newTierForm, price: value})}
                        min={0}
                      >
                        <NumberInputField placeholder="0 pour gratuit" />
                      </NumberInput>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Supply Total</FormLabel>
                      <NumberInput
                        value={newTierForm.supply}
                        onChange={(value) => setNewTierForm({...newTierForm, supply: parseInt(value) || 0})}
                        min={1}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Multiplicateur (%)</FormLabel>
                      <NumberInput
                        value={newTierForm.multiplier}
                        onChange={(value) => setNewTierForm({...newTierForm, multiplier: parseInt(value) || 100})}
                        min={100}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl isRequired>
                    <FormLabel>Base URI (Pinata IPFS)</FormLabel>
                    <Input
                      value={newTierForm.baseURI}
                      onChange={(e) => setNewTierForm({...newTierForm, baseURI: e.target.value})}
                      placeholder="https://olive-quick-dolphin-266.mypinata.cloud/ipfs/..."
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      L'URI de base où seront stockées les métadonnées JSON des NFT
                    </Text>
                  </FormControl>

                  <Alert status="info" borderRadius="lg">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Informations importantes :</Text>
                      <Text fontSize="sm">
                        • Les tiers spéciaux ne peuvent être mintés que par l'administrateur<br/>
                        • Le multiplicateur affecte les bonus dans l'application<br/>
                        • L'URI de base doit pointer vers un dossier IPFS contenant les métadonnées
                      </Text>
                    </Box>
                  </Alert>

                  <Button
                    colorScheme="orange"
                    size="lg"
                    onClick={handleCreateTier}
                    isLoading={!!loadingAction}
                    isDisabled={!newTierForm.name || !newTierForm.description || !newTierForm.baseURI}
                    loadingText="Création en cours..."
                  >
                    🚀 Créer le Tier sur la Blockchain
                  </Button>
                </VStack>
              </TabPanel>
            )}

            {/* Onglet 3: Vérification Pinata */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">Cohérence Smart Contract ↔ Pinata</Heading>
                  <Button
                    size="sm"
                    onClick={() => loadPinataData(tiers)}
                    isLoading={!!loadingAction}
                    loadingText="Vérification..."
                  >
                    🔄 Re-vérifier
                  </Button>
                </HStack>
                
                {!pinataAuth && (
                  <Alert status="warning">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Pinata non connecté</Text>
                      <Text fontSize="sm">
                        Configurez vos clés API Pinata dans les variables d'environnement pour activer cette fonctionnalité.
                      </Text>
                    </Box>
                  </Alert>
                )}

                {/* Tableau de cohérence */}
                {consistencyResults.length > 0 && (
                  <Box>
                    <Heading size="sm" mb={3}>Résultats de Vérification</Heading>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Tier</Th>
                          <Th>Contrat</Th>
                          <Th>Pinata</Th>
                          <Th>Statut</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {consistencyResults.map((result) => (
                          <Tr key={result.tierId}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold" fontSize="sm">{result.tierName}</Text>
                                <Code fontSize="xs" color="gray.500">
                                  ID: {result.tierId}
                                </Code>
                              </VStack>
                            </Td>
                            <Td>
                              <Badge variant="outline">
                                {result.contractMinted} mintés
                              </Badge>
                            </Td>
                            <Td>
                              <Badge variant="outline" colorScheme={result.pinataMetadata > 0 ? 'green' : 'red'}>
                                {result.pinataMetadata} métadonnées
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Badge colorScheme={result.consistent ? 'green' : 'red'} variant="solid">
                                  {result.consistent ? <CheckIcon boxSize={3} /> : <WarningIcon boxSize={3} />}
                                  {result.consistent ? 'OK' : 'INCOHÉRENT'}
                                </Badge>
                                {result.missingTokens > 0 && (
                                  <Badge colorScheme="orange" variant="outline">
                                    -{result.missingTokens}
                                  </Badge>
                                )}
                              </HStack>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Link href={result.baseURI} isExternal>
                                  <Button size="xs" leftIcon={<ExternalLinkIcon />}>
                                    Pinata
                                  </Button>
                                </Link>
                                {!result.consistent && (
                                  <Tooltip label="Synchroniser les métadonnées manquantes">
                                    <Button size="xs" colorScheme="orange" isDisabled>
                                      Sync
                                    </Button>
                                  </Tooltip>
                                )}
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}

                {/* Aperçu des métadonnées */}
                {pinataMetadata.length > 0 && (
                  <Box>
                    <Heading size="sm" mb={3}>Aperçu Métadonnées Pinata</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                      {pinataMetadata.slice(0, 9).map((item, index) => (
                        <Card key={index} size="sm">
                          <CardBody>
                            <VStack spacing={3}>
                              {item.metadata?.image && (
                                <Image 
                                  src={item.metadata.image} 
                                  alt={item.metadata.name || `Token ${item.tokenId}`}
                                  boxSize="80px"
                                  objectFit="cover"
                                  borderRadius="md"
                                  fallback={<Box boxSize="80px" bg="gray.200" borderRadius="md" />}
                                />
                              )}
                              <VStack spacing={1}>
                                <Text fontWeight="bold" fontSize="xs" textAlign="center">
                                  {item.metadata?.name || `Token #${item.tokenId}`}
                                </Text>
                                <Badge size="sm" colorScheme="blue">
                                  {item.tierName}
                                </Badge>
                                <Text fontSize="xs" color="gray.600" textAlign="center" noOfLines={2}>
                                  {item.metadata?.description}
                                </Text>
                              </VStack>
                              <HStack spacing={2}>
                                <Link href={item.metadata?.image} isExternal>
                                  <Button size="xs" leftIcon={<ExternalLinkIcon />}>
                                    Image
                                  </Button>
                                </Link>
                                <Link href={item.ipfsUrl} isExternal>
                                  <Button size="xs" variant="outline">
                                    JSON
                                  </Button>
                                </Link>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}

                {/* Détails techniques */}
                <Accordion allowToggle>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <Text fontWeight="bold">🔧 Détails Techniques</Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <VStack spacing={4} align="stretch">
                        <Box>
                          <Text fontWeight="bold" mb={2}>Configuration Pinata :</Text>
                          <Code p={3} borderRadius="md" display="block" fontSize="sm">
                            Gateway: {pinataService.getPublicUrl('')}<br/>
                            Authentification: {pinataAuth ? '✅ Connecté' : '❌ Échec'}<br/>
                            Base URI utilisée: olive-quick-dolphin-266.mypinata.cloud
                          </Code>
                        </Box>
                        
                        <Box>
                          <Text fontWeight="bold" mb={2}>Format attendu des métadonnées :</Text>
                          <Code p={3} borderRadius="md" display="block" fontSize="sm" whiteSpace="pre">
{`{
  "name": "Nom du NFT #123",
  "description": "Description du NFT",
  "image": "https://gateway.pinata.cloud/ipfs/hash/image.png",
  "attributes": [
    {"trait_type": "Tier", "value": "Bronze"},
    {"trait_type": "Multiplier", "value": "1.2x"}
  ]
}`}
                          </Code>
                        </Box>
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </VStack>
            </TabPanel>

            {/* Onglet 4: Analytics Avancées */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading size="md">Analytics & Métriques Avancées</Heading>
                
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  {/* Revenus par tier */}
                  <Card>
                    <CardBody>
                      <Heading size="sm" mb={4}>💰 Revenus par Tier</Heading>
                      <VStack spacing={3} align="stretch">
                        {tiers.filter(t => !t.isSpecial).map((tier) => {
                          const revenue = parseFloat(tier.price) * tier.minted;
                          const percentage = globalStats.totalRevenue > 0 
                            ? (revenue / globalStats.totalRevenue) * 100 
                            : 0;
                          
                          return (
                            <Box key={tier.id}>
                              <HStack justify="space-between" mb={1}>
                                <Text fontSize="sm" fontWeight="medium">{tier.name}</Text>
                                <VStack align="end" spacing={0}>
                                  <Text fontWeight="bold" color="green.500" fontSize="sm">
                                    ${revenue.toLocaleString()}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {percentage.toFixed(1)}%
                                  </Text>
                                </VStack>
                              </HStack>
                              <Progress 
                                value={percentage} 
                                size="sm" 
                                colorScheme="green"
                                borderRadius="md"
                              />
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                {tier.minted} NFT × ${tier.price}
                              </Text>
                            </Box>
                          );
                        })}
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Performance des ventes */}
                  <Card>
                    <CardBody>
                      <Heading size="sm" mb={4}>📊 Performance des Ventes</Heading>
                      <VStack spacing={3} align="stretch">
                        {tiers.map((tier) => {
                          const sellRate = (tier.minted / tier.supply) * 100;
                          const remaining = tier.supply - tier.minted;
                          
                          return (
                            <Box key={tier.id}>
                              <HStack justify="space-between" mb={1}>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="medium">{tier.name}</Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {remaining} restants
                                  </Text>
                                </VStack>
                                <Text fontSize="sm" fontWeight="bold">
                                  {sellRate.toFixed(1)}%
                                </Text>
                              </HStack>
                              <Progress 
                                value={sellRate} 
                                size="sm" 
                                colorScheme={
                                  sellRate > 75 ? "red" : 
                                  sellRate > 50 ? "orange" : 
                                  sellRate > 25 ? "yellow" : "green"
                                }
                                borderRadius="md"
                              />
                            </Box>
                          );
                        })}
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Métriques temporelles */}
                  <Card>
                    <CardBody>
                      <Heading size="sm" mb={4}>⏱️ Métriques Temporelles</Heading>
                      <VStack spacing={4} align="stretch">
                        {tiers.map((tier) => {
                          const daysSinceCreation = Math.floor((Date.now() - tier.createdAt * 1000) / (1000 * 60 * 60 * 24));
                          const mintRate = daysSinceCreation > 0 ? (tier.minted / daysSinceCreation).toFixed(2) : '0';
                          
                          return (
                            <HStack key={tier.id} justify="space-between">
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">{tier.name}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  Créé il y a {daysSinceCreation} jours
                                </Text>
                              </VStack>
                              <VStack align="end" spacing={0}>
                                <Text fontSize="sm" fontWeight="bold">
                                  {mintRate} NFT/jour
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  Taux de mint
                                </Text>
                              </VStack>
                            </HStack>
                          );
                        })}
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Projections */}
                  <Card>
                    <CardBody>
                      <Heading size="sm" mb={4}>🔮 Projections</Heading>
                      <VStack spacing={4} align="stretch">
                        {tiers.filter(t => !t.isSpecial && t.active).map((tier) => {
                          const remaining = tier.supply - tier.minted;
                          const daysSinceCreation = Math.floor((Date.now() - tier.createdAt * 1000) / (1000 * 60 * 60 * 24));
                          const mintRate = daysSinceCreation > 0 ? tier.minted / daysSinceCreation : 0;
                          const daysToSellOut = mintRate > 0 ? Math.ceil(remaining / mintRate) : Infinity;
                          const potentialRevenue = remaining * parseFloat(tier.price);
                          
                          return (
                            <Box key={tier.id}>
                              <Text fontSize="sm" fontWeight="medium" mb={2}>{tier.name}</Text>
                              <VStack spacing={1} align="stretch">
                                <HStack justify="space-between">
                                  <Text fontSize="xs" color="gray.600">Revenus potentiels :</Text>
                                  <Text fontSize="xs" fontWeight="bold" color="green.500">
                                    ${potentialRevenue.toLocaleString()}
                                  </Text>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text fontSize="xs" color="gray.600">Épuisement estimé :</Text>
                                  <Text fontSize="xs" fontWeight="bold">
                                    {daysToSellOut === Infinity ? 'Jamais' : `${daysToSellOut} jours`}
                                  </Text>
                                </HStack>
                              </VStack>
                              <Divider my={2} />
                            </Box>
                          );
                        })}
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Résumé exécutif */}
                <Card bg="orange.50" borderColor="orange.200">
                  <CardBody>
                    <Heading size="sm" mb={4} color="orange.700">📈 Résumé Exécutif</Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <Box>
                        <Text fontWeight="bold" color="orange.700">Performance Globale</Text>
                        <Text fontSize="sm">
                          {globalStats.totalMinted} NFT vendus sur {globalStats.totalSupply} disponibles
                          ({((globalStats.totalMinted / globalStats.totalSupply) * 100).toFixed(1)}%)
                        </Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" color="orange.700">Revenus Actuels</Text>
                        <Text fontSize="sm">
                          ${globalStats.totalRevenue.toLocaleString()} générés
                        </Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" color="orange.700">Potentiel Restant</Text>
                        <Text fontSize="sm">
                          ${tiers.filter(t => !t.isSpecial).reduce((sum, t) => 
                            sum + ((t.supply - t.minted) * parseFloat(t.price)), 0
                          ).toLocaleString()} possibles
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Modal d'édition des tiers */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Modifier le Tier : {selectedTier?.name}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedTier && (
                <VStack spacing={4} align="stretch">
                  <Alert status="info" size="sm">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Tier ID: {selectedTier.id} | Actuellement {selectedTier.minted} NFT mintés
                    </Text>
                  </Alert>
                  
                  <FormControl>
                    <FormLabel>Prix (USDC)</FormLabel>
                    <NumberInput
                      value={editTierForm.price}
                      onChange={(value) => setEditTierForm({...editTierForm, price: value})}
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Supply Maximum</FormLabel>
                    <NumberInput
                      value={editTierForm.supply}
                      onChange={(value) => setEditTierForm({...editTierForm, supply: parseInt(value) || 0})}
                      min={selectedTier.minted}
                    >
                      <NumberInputField />
                    </NumberInput>
                    <Text fontSize="xs" color="gray.500">
                      Minimum: {selectedTier.minted} (NFT déjà mintés)
                    </Text>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Statut</FormLabel>
                    <Select
                      value={editTierForm.active ? 'active' : 'inactive'}
                      onChange={(e) => setEditTierForm({...editTierForm, active: e.target.value === 'active'})}
                    >
                      <option value="active">Actif (Ventes autorisées)</option>
                      <option value="inactive">Inactif (Ventes suspendues)</option>
                    </Select>
                  </FormControl>
                  
                  <Alert status="warning" size="sm">
                    <AlertIcon />
                    <Text fontSize="sm">
                      ⚠️ Ces modifications seront appliquées sur la blockchain et nécessiteront des frais de gas.
                    </Text>
                  </Alert>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Annuler
              </Button>
              <Button 
                colorScheme="orange" 
                onClick={handleUpdateTier}
                isLoading={!!loadingAction}
                loadingText="Modification..."
              >
                💾 Sauvegarder sur Blockchain
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default NFTContractManager;