// src/components/FidelityManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
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
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  IconButton,
  Tooltip,
  Switch,
  Select,
  Checkbox,
  Divider,
  Progress,
  Link
} from '@chakra-ui/react';
import { 
  AddIcon, 
  EditIcon, 
  CheckIcon, 
  CloseIcon, 
  ExternalLinkIcon,
  DownloadIcon,
  UploadIcon 
} from '@chakra-ui/icons';
import { useNFTContract, FidelityUser } from '../hooks/useNFTContract';

const FidelityManager: React.FC = () => {
  // États pour les données
  const [fidelityUsers, setFidelityUsers] = useState<FidelityUser[]>([]);
  const [fidelityStats, setFidelityStats] = useState({
    totalEligible: 0,
    totalClaimed: 0,
    remaining: 50, // Supply NFT Fidélité
    claimRate: 0
  });
  
  // États pour les formulaires
  const [newUserAddress, setNewUserAddress] = useState('');
  const [bulkAddresses, setBulkAddresses] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'eligible' | 'claimed' | 'pending'>('all');
  
  // États UI
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Hooks
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    contract,
    isOwner,
    loading: contractLoading,
    error: contractError,
    getFidelityEligibility,
    setFidelityEligible,
    setMultipleFidelityEligible,
    getAllFidelityUsers // Assumons que cette fonction existe pour récupérer tous les utilisateurs
  } = useNFTContract();

  // Charger les données initiales
  useEffect(() => {
    if (contract && isOwner && !contractLoading) {
      loadFidelityData();
    }
  }, [contract, isOwner, contractLoading]);

  // Fonction pour charger les données de fidélité RÉELLES depuis la blockchain
  const loadFidelityData = async () => {
    try {
      setLoadingAction('Chargement des données de fidélité depuis la blockchain...');
      
      // Récupérer les utilisateurs éligibles depuis la blockchain
      // Cette fonction doit être implémentée dans votre hook useNFTContract
      const blockchainUsers = await getAllFidelityUsers?.() || [];
      
      // Si getAllFidelityUsers n'existe pas, vous pouvez utiliser une liste d'adresses
      // que vous maintenez dans votre base de données ou fichier de configuration
      // et vérifier leur éligibilité une par une
      
      let users: FidelityUser[] = [];
      
      if (blockchainUsers.length > 0) {
        // Cas 1: Récupération directe depuis la blockchain
        users = blockchainUsers;
      } else {
        // Cas 2: Vous devez maintenir une liste d'adresses à vérifier
        // Remplacez cette partie par votre propre logique de récupération d'adresses
        const addressesToCheck: string[] = [
          // Ajoutez ici les adresses que vous voulez vérifier
          // Ou récupérez-les depuis votre base de données/API
        ];
        
        // Vérifier le statut blockchain pour chaque adresse
        users = await Promise.all(
          addressesToCheck.map(async (address) => {
            try {
              const eligibility = await getFidelityEligibility(address);
              return {
                address,
                eligible: eligibility.eligible,
                alreadyClaimed: eligibility.alreadyClaimed,
                // Vous pouvez ajouter des métadonnées depuis votre base de données
                firstName: undefined,
                lastName: undefined
              };
            } catch (error) {
              console.warn(`Erreur vérification ${address}:`, error);
              return {
                address,
                eligible: false,
                alreadyClaimed: false
              };
            }
          })
        );
      }
      
      // Filtrer seulement les utilisateurs qui ont une éligibilité ou qui ont déjà réclamé
      const activeUsers = users.filter(user => user.eligible || user.alreadyClaimed);
      
      setFidelityUsers(activeUsers);
      
      // Calculer les statistiques réelles
      const stats = {
        totalEligible: activeUsers.filter(u => u.eligible).length,
        totalClaimed: activeUsers.filter(u => u.alreadyClaimed).length,
        remaining: 50 - activeUsers.filter(u => u.alreadyClaimed).length,
        claimRate: activeUsers.filter(u => u.eligible).length > 0 
          ? (activeUsers.filter(u => u.alreadyClaimed).length / activeUsers.filter(u => u.eligible).length) * 100 
          : 0
      };
      
      setFidelityStats(stats);
      
    } catch (error) {
      console.error('Erreur chargement données fidélité:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de fidélité depuis la blockchain',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Ajouter un utilisateur éligible
  const handleAddUser = async (address: string) => {
    if (!isOwner || !address) return;
    
    try {
      setLoadingAction(`Ajout de l'éligibilité pour ${address.slice(0, 10)}...`);
      
      const txHash = await setFidelityEligible(address, true);
      
      toast({
        title: 'Éligibilité accordée',
        description: `Transaction: ${txHash.substring(0, 10)}...`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Recharger les données depuis la blockchain
      await loadFidelityData();
      
      setNewUserAddress('');
      
    } catch (error) {
      console.error('Erreur ajout utilisateur:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'ajout',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Retirer l'éligibilité
  const handleRemoveUser = async (address: string) => {
    if (!isOwner) return;
    
    try {
      setLoadingAction(`Retrait de l'éligibilité pour ${address.slice(0, 10)}...`);
      
      const txHash = await setFidelityEligible(address, false);
      
      toast({
        title: 'Éligibilité retirée',
        description: `Transaction: ${txHash.substring(0, 10)}...`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Recharger les données depuis la blockchain
      await loadFidelityData();
      
    } catch (error) {
      console.error('Erreur retrait utilisateur:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du retrait',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Ajout en masse
  const handleBulkAdd = async () => {
    if (!isOwner || !bulkAddresses.trim()) return;
    
    const addresses = bulkAddresses
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.startsWith('0x') && addr.length === 42);
    
    if (addresses.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Aucune adresse valide trouvée',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setLoadingAction(`Ajout en masse de ${addresses.length} adresses...`);
      
      const txHash = await setMultipleFidelityEligible(addresses, true);
      
      toast({
        title: 'Ajout en masse réussi',
        description: `${addresses.length} adresses ajoutées. TX: ${txHash.substring(0, 10)}...`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Recharger les données depuis la blockchain
      await loadFidelityData();
      
      setBulkAddresses('');
      onClose();
      
    } catch (error) {
      console.error('Erreur ajout en masse:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'ajout en masse',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = fidelityUsers.filter(user => {
    const matchesSearch = user.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'eligible' && user.eligible && !user.alreadyClaimed) ||
                         (filterStatus === 'claimed' && user.alreadyClaimed) ||
                         (filterStatus === 'pending' && user.eligible && !user.alreadyClaimed);
    
    return matchesSearch && matchesFilter;
  });

  if (contractLoading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" color="purple.500" />
        <Text mt={4}>Connexion à la blockchain...</Text>
      </Box>
    );
  }

  if (!isOwner) {
    return (
      <Alert status="error" borderRadius="lg">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Accès refusé</Text>
          <Text fontSize="sm">Seul le owner peut gérer les éligibilités NFT Fidélité</Text>
        </Box>
      </Alert>
    );
  }

  return (
    <Box p={6} maxW="1400px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* En-tête */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="purple.500">
              🎁 Gestion NFT Fidélité
            </Heading>
            <Text color="gray.600" fontSize="sm">
              Gérer les éligibilités pour les NFT de récompense de fidélité
            </Text>
          </VStack>
          
          <HStack spacing={3}>
            <Button
              colorScheme="blue"
              size="sm"
              onClick={loadFidelityData}
              isLoading={!!loadingAction}
              loadingText="Actualisation..."
            >
              🔄 Actualiser
            </Button>
            <Button
              colorScheme="purple"
              leftIcon={<AddIcon />}
              onClick={onOpen}
            >
              Ajout en Masse
            </Button>
          </HStack>
        </HStack>

        {/* Statistiques */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Utilisateurs Éligibles</StatLabel>
                <StatNumber color="purple.500">{fidelityStats.totalEligible}</StatNumber>
                <StatHelpText>Autorisés à réclamer</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>NFT Réclamés</StatLabel>
                <StatNumber color="green.500">{fidelityStats.totalClaimed}</StatNumber>
                <StatHelpText>Déjà mintés</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Supply Restant</StatLabel>
                <StatNumber color="orange.500">{fidelityStats.remaining}</StatNumber>
                <StatHelpText>Sur 50 total</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Taux de Réclamation</StatLabel>
                <StatNumber>{fidelityStats.claimRate.toFixed(1)}%</StatNumber>
                <StatHelpText>Éligibles qui ont réclamé</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Indicateur de chargement */}
        {loadingAction && (
          <Alert status="info">
            <Spinner size="sm" mr={3} />
            <Text>{loadingAction}</Text>
          </Alert>
        )}

        {/* Ajouter un utilisateur */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="sm">➕ Ajouter un Utilisateur Éligible</Heading>
              <HStack spacing={4}>
                <FormControl flex={1}>
                  <FormLabel fontSize="sm">Adresse Wallet</FormLabel>
                  <Input
                    value={newUserAddress}
                    onChange={(e) => setNewUserAddress(e.target.value)}
                    placeholder="0x..."
                    size="sm"
                  />
                </FormControl>
                <Button
                  colorScheme="purple"
                  onClick={() => handleAddUser(newUserAddress)}
                  isDisabled={!newUserAddress || !!loadingAction}
                  size="sm"
                  mt={6}
                >
                  Ajouter
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Filtres et recherche */}
        <HStack spacing={4} wrap="wrap">
          <FormControl maxW="300px">
            <FormLabel fontSize="sm">🔍 Rechercher</FormLabel>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Adresse..."
              size="sm"
            />
          </FormControl>
          
          <FormControl maxW="200px">
            <FormLabel fontSize="sm">📊 Filtrer par statut</FormLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              size="sm"
            >
              <option value="all">Tous</option>
              <option value="eligible">Éligibles</option>
              <option value="claimed">Réclamés</option>
              <option value="pending">En attente</option>
            </Select>
          </FormControl>
        </HStack>

        {/* Tableau des utilisateurs */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Heading size="sm">
                  👥 Utilisateurs de Fidélité ({filteredUsers.length})
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  Progress global: {fidelityStats.remaining} NFT restants
                </Text>
              </HStack>
              
              <Progress 
                value={((50 - fidelityStats.remaining) / 50) * 100}
                colorScheme="purple"
                size="sm"
                borderRadius="md"
              />

              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Adresse</Th>
                      <Th>Statut Éligibilité</Th>
                      <Th>Statut NFT</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredUsers.map((user) => (
                      <Tr key={user.address}>
                        <Td>
                          <HStack spacing={2}>
                            <Text fontSize="xs" fontFamily="mono">
                              {user.address.slice(0, 10)}...{user.address.slice(-8)}
                            </Text>
                            <Link 
                              href={`https://bscscan.com/address/${user.address}`}
                              isExternal
                            >
                              <ExternalLinkIcon boxSize={3} />
                            </Link>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge 
                            colorScheme={user.eligible ? 'green' : 'red'} 
                            variant="solid"
                          >
                            {user.eligible ? '✅ ÉLIGIBLE' : '❌ NON ÉLIGIBLE'}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge 
                            colorScheme={user.alreadyClaimed ? 'blue' : 'orange'} 
                            variant="outline"
                          >
                            {user.alreadyClaimed ? '🎁 RÉCLAMÉ' : '⏳ EN ATTENTE'}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            <Tooltip label="Retirer l'éligibilité">
                              <IconButton
                                aria-label="Retirer"
                                icon={<CloseIcon />}
                                size="xs"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => handleRemoveUser(user.address)}
                                isDisabled={!!loadingAction || user.alreadyClaimed}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              {filteredUsers.length === 0 && (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">
                    {fidelityUsers.length === 0 
                      ? "Aucun utilisateur éligible trouvé sur la blockchain"
                      : "Aucun utilisateur trouvé avec les filtres actuels"
                    }
                  </Text>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Modal ajout en masse */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              📝 Ajout en Masse d'Utilisateurs Éligibles
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Alert status="info" size="sm">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Entrez une adresse par ligne. Format attendu : 0x...
                  </Text>
                </Alert>
                
                <FormControl>
                  <FormLabel>Adresses Wallet (une par ligne)</FormLabel>
                  <Textarea
                    value={bulkAddresses}
                    onChange={(e) => setBulkAddresses(e.target.value)}
                    placeholder={`0x460852bb2347042be1a257f6652b9afd2939959b\n0xec0cf7505c86e0ea33a2f2de4660e6a06abe92dd\n...`}
                    rows={10}
                    fontSize="sm"
                    fontFamily="mono"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {bulkAddresses.split('\n').filter(addr => 
                      addr.trim().startsWith('0x') && addr.trim().length === 42
                    ).length} adresses valides détectées
                  </Text>
                </FormControl>
                
                <Alert status="warning" size="sm">
                  <AlertIcon />
                  <Text fontSize="sm">
                    ⚠️ Cette action sera définitive sur la blockchain et nécessitera des frais de gas.
                  </Text>
                </Alert>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Annuler
              </Button>
              <Button 
                colorScheme="purple" 
                onClick={handleBulkAdd}
                isLoading={!!loadingAction}
                loadingText="Ajout en cours..."
                isDisabled={!bulkAddresses.trim()}
              >
                🚀 Ajouter sur Blockchain
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default FidelityManager;