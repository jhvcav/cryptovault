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
    remaining: 0,
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
    setMultipleFidelityEligible
  } = useNFTContract();

  // Charger les données initiales
  useEffect(() => {
    if (contract && isOwner && !contractLoading) {
      loadFidelityData();
    }
  }, [contract, isOwner, contractLoading]);

  // Fonction pour charger les données de fidélité
  const loadFidelityData = async () => {
    try {
      setLoadingAction('Chargement des données de fidélité...');
      
      // Pour l'exemple, on va charger depuis votre base de données
      // En réalité, vous devriez avoir une API pour récupérer les utilisateurs fidèles
      const mockUsers: FidelityUser[] = [
        {
          address: '0x460852bb2347042be1a257f6652b9afd2939959b',
          firstName: 'John',
          lastName: 'Doe',
          eligible: true,
          alreadyClaimed: false
        },
        {
          address: '0xec0cf7505c86e0ea33a2f2de4660e6a06abe92dd',
          firstName: 'Jane',
          lastName: 'Smith',
          eligible: true,
          alreadyClaimed: true,
          claimedDate: '2024-01-15',
          txHash: '0x123...'
        }
      ];
      
      // Vérifier le statut blockchain pour chaque utilisateur
      const updatedUsers = await Promise.all(
        mockUsers.map(async (user) => {
          try {
            const eligibility = await getFidelityEligibility(user.address);
            return {
              ...user,
              eligible: eligibility.eligible,
              alreadyClaimed: eligibility.alreadyClaimed
            };
          } catch (error) {
            console.warn(`Erreur vérification ${user.address}:`, error);
            return user;
          }
        })
      );
      
      setFidelityUsers(updatedUsers);
      
      // Calculer les statistiques
      const stats = {
        totalEligible: updatedUsers.filter(u => u.eligible).length,
        totalClaimed: updatedUsers.filter(u => u.alreadyClaimed).length,
        remaining: 50 - updatedUsers.filter(u => u.alreadyClaimed).length, // Supply NFT Fidélité
        claimRate: updatedUsers.length > 0 
          ? (updatedUsers.filter(u => u.alreadyClaimed).length / updatedUsers.filter(u => u.eligible).length) * 100 
          : 0
      };
      
      setFidelityStats(stats);
      
    } catch (error) {
      console.error('Erreur chargement données fidélité:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de fidélité',
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
      
      // Ajouter à la liste locale
      setFidelityUsers(prev => [...prev, {
        address,
        eligible: true,
        alreadyClaimed: false
      }]);
      
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
      
      // Retirer de la liste locale
      setFidelityUsers(prev => prev.filter(u => u.address !== address));
      
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
      
      // Ajouter à la liste locale
      const newUsers = addresses.map(addr => ({
        address: addr,
        eligible: true,
        alreadyClaimed: false
      }));
      
      setFidelityUsers(prev => [...prev, ...newUsers]);
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
        <Text mt={4}>Chargement des données de fidélité...</Text>
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
              placeholder="Adresse ou nom..."
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
                      <Th>Utilisateur</Th>
                      <Th>Adresse</Th>
                      <Th>Statut Éligibilité</Th>
                      <Th>Statut NFT</Th>
                      <Th>Date Réclamation</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredUsers.map((user) => (
                      <Tr key={user.address}>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" fontSize="sm">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : 'Utilisateur Anonyme'
                              }
                            </Text>
                          </VStack>
                        </Td>
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
                          {user.claimedDate ? (
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs">{user.claimedDate}</Text>
                              {user.txHash && (
                                <Link 
                                  href={`https://bscscan.com/tx/${user.txHash}`}
                                  isExternal
                                  fontSize="xs"
                                  color="blue.500"
                                >
                                  TX: {user.txHash.slice(0, 8)}...
                                </Link>
                              )}
                            </VStack>
                          ) : (
                            <Text fontSize="xs" color="gray.500">-</Text>
                          )}
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
                    Aucun utilisateur trouvé avec les filtres actuels
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