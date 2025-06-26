// src/components/FidelityManager.tsx - FICHIER COMPLET
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
  Link,
  CheckboxGroup,
  Stack
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
import { useNFTContract } from '../hooks/useNFTContract';
// CORRECTION: Import direct du client supabase
import { supabase } from '../lib/supabase';

interface FidelityUser {
  id: number;
  wallet_address: string;
  first_name: string;
  last_name: string;
  status: 'Active' | 'Suspended' | 'Inactive';
  fidelity_status: 'OUI' | 'NON';
  fidelity_nft_claimed: boolean;
  fidelity_nft_claimed_date?: string;
  fidelity_nft_tx_hash?: string;
  registration_date: string;
  // Statut blockchain (ajouté dynamiquement)
  blockchain_eligible?: boolean;
  blockchain_claimed?: boolean;
}

const FidelityManager: React.FC = () => {
  // États pour les données
  const [fidelityUsers, setFidelityUsers] = useState<FidelityUser[]>([]);
  const [allUsers, setAllUsers] = useState<FidelityUser[]>([]);
  const [fidelityStats, setFidelityStats] = useState({
    totalEligible: 0,
    totalClaimed: 0,
    remaining: 50, // Supply NFT Fidélité
    claimRate: 0,
    dbFidelityUsers: 0,
    syncedWithBlockchain: 0
  });
  
  // États pour les formulaires
  const [newUserAddress, setNewUserAddress] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'eligible' | 'claimed' | 'pending' | 'db_fidelity'>('all');
  
  // États UI
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Hooks
  const toast = useToast();
  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onClose: onBulkClose } = useDisclosure();
  const { isOpen: isSelectOpen, onOpen: onSelectOpen, onClose: onSelectClose } = useDisclosure();
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

  // FONCTION CORRIGÉE pour charger les données de fidélité depuis Supabase + Blockchain
  const loadFidelityData = async () => {
    try {
      setLoadingAction('Chargement des données depuis Supabase...');
      
      console.log('🔍 Début chargement données fidélité...');
      
      // Vérifier que supabase est bien initialisé
      if (!supabase) {
        throw new Error('Client Supabase non initialisé');
      }
      
      // 1. Récupérer tous les utilisateurs depuis Supabase
      console.log('📡 Récupération des utilisateurs depuis Supabase...');
      const { data: supabaseUsers, error } = await supabase
        .from('users_authorized')
        .select('*')
        .eq('status', 'Active')
        .order('registration_date', { ascending: false });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      console.log(`✅ ${supabaseUsers?.length || 0} utilisateurs récupérés depuis Supabase`);
      setAllUsers(supabaseUsers || []);

      if (!supabaseUsers || supabaseUsers.length === 0) {
        console.log('ℹ️ Aucun utilisateur trouvé, arrêt du chargement');
        setFidelityUsers([]);
        setLoadingAction(null);
        return;
      }

      setLoadingAction('Synchronisation avec la blockchain...');

      // 2. Vérifier le statut blockchain pour chaque utilisateur
      console.log('🔗 Vérification statut blockchain...');
      
      const usersWithBlockchainStatus = await Promise.all(
        supabaseUsers.map(async (user, index) => {
          try {
            console.log(`🔍 Vérification ${index + 1}/${supabaseUsers.length}: ${user.wallet_address}`);
            
            // Vérifier que getFidelityEligibility existe
            if (!getFidelityEligibility) {
              console.warn('⚠️ getFidelityEligibility non disponible');
              return {
                ...user,
                blockchain_eligible: false,
                blockchain_claimed: false
              };
            }
            
            const eligibility = await getFidelityEligibility(user.wallet_address);
            console.log(`✅ ${user.wallet_address}: eligible=${eligibility.eligible}, claimed=${eligibility.alreadyClaimed}`);
            
            return {
              ...user,
              blockchain_eligible: eligibility.eligible,
              blockchain_claimed: eligibility.alreadyClaimed
            };
          } catch (error) {
            console.warn(`⚠️ Erreur vérification blockchain ${user.wallet_address}:`, error);
            return {
              ...user,
              blockchain_eligible: false,
              blockchain_claimed: false
            };
          }
        })
      );

      console.log('✅ Vérification blockchain terminée');
      setFidelityUsers(usersWithBlockchainStatus);
      
      // 3. Calculer les statistiques
      const dbFidelityUsers = usersWithBlockchainStatus.filter(u => u.fidelity_status === 'OUI');
      const blockchainEligible = usersWithBlockchainStatus.filter(u => u.blockchain_eligible);
      const blockchainClaimed = usersWithBlockchainStatus.filter(u => u.blockchain_claimed);
      
      const stats = {
        totalEligible: blockchainEligible.length,
        totalClaimed: blockchainClaimed.length,
        remaining: 50 - blockchainClaimed.length,
        claimRate: blockchainEligible.length > 0 
          ? (blockchainClaimed.length / blockchainEligible.length) * 100 
          : 0,
        dbFidelityUsers: dbFidelityUsers.length,
        syncedWithBlockchain: usersWithBlockchainStatus.filter(u => 
          u.fidelity_status === 'OUI' && u.blockchain_eligible
        ).length
      };
      
      console.log('📊 Statistiques calculées:', stats);
      setFidelityStats(stats);
      
    } catch (error) {
      console.error('❌ Erreur chargement données fidélité:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de charger les données de fidélité: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Ajouter un utilisateur éligible sur la blockchain
  const handleAddUser = async (address: string) => {
    if (!isOwner || !address) return;
    
    try {
      setLoadingAction(`Ajout de l'éligibilité blockchain pour ${address.slice(0, 10)}...`);
      
      const txHash = await setFidelityEligible(address, true);
      
      toast({
        title: 'Éligibilité blockchain accordée',
        description: `Transaction: ${txHash.substring(0, 10)}...`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Recharger les données
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
      setLoadingAction(`Retrait de l'éligibilité blockchain pour ${address.slice(0, 10)}...`);
      
      const txHash = await setFidelityEligible(address, false);
      
      toast({
        title: 'Éligibilité blockchain retirée',
        description: `Transaction: ${txHash.substring(0, 10)}...`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Recharger les données
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

  // Synchroniser les utilisateurs fidèles de la DB vers la blockchain
  const handleSyncFidelityUsers = async () => {
    try {
      setLoadingAction('Synchronisation des utilisateurs fidèles vers la blockchain...');
      
      // Récupérer les utilisateurs marqués comme fidèles dans la DB mais pas encore sur la blockchain
      const usersToSync = fidelityUsers.filter(user => 
        user.fidelity_status === 'OUI' && 
        !user.blockchain_eligible &&
        user.status === 'Active'
      );

      if (usersToSync.length === 0) {
        toast({
          title: 'Synchronisation complète',
          description: 'Tous les utilisateurs fidèles sont déjà synchronisés sur la blockchain',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const addresses = usersToSync.map(user => user.wallet_address);
      
      const txHash = await setMultipleFidelityEligible(addresses, true);
      
      toast({
        title: 'Synchronisation réussie',
        description: `${addresses.length} utilisateurs synchronisés. TX: ${txHash.substring(0, 10)}...`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Recharger les données
      await loadFidelityData();
      
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la synchronisation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Ajout en masse par sélection depuis la DB
  const handleBulkAddSelected = async () => {
    if (!isOwner || selectedUserIds.length === 0) return;
    
    try {
      setLoadingAction(`Ajout en masse de ${selectedUserIds.length} utilisateurs...`);
      
      const selectedUsers = fidelityUsers.filter(user => selectedUserIds.includes(user.id));
      const addresses = selectedUsers.map(user => user.wallet_address);
      
      const txHash = await setMultipleFidelityEligible(addresses, true);
      
      toast({
        title: 'Ajout en masse réussi',
        description: `${addresses.length} utilisateurs ajoutés. TX: ${txHash.substring(0, 10)}...`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Recharger les données
      await loadFidelityData();
      setSelectedUserIds([]);
      onSelectClose();
      
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

  // Marquer comme réclamé dans la DB locale
  const handleMarkAsClaimed = async (user: FidelityUser, txHash: string) => {
    try {
      const { error } = await supabase
        .from('users_authorized')
        .update({
          fidelity_nft_claimed: true,
          fidelity_nft_claimed_date: new Date().toISOString(),
          fidelity_nft_tx_hash: txHash
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Statut mis à jour',
        description: 'Utilisateur marqué comme ayant réclamé son NFT',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Recharger les données
      await loadFidelityData();

    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = fidelityUsers.filter(user => {
    const matchesSearch = user.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'eligible' && user.blockchain_eligible && !user.blockchain_claimed) ||
                         (filterStatus === 'claimed' && user.blockchain_claimed) ||
                         (filterStatus === 'pending' && user.blockchain_eligible && !user.blockchain_claimed) ||
                         (filterStatus === 'db_fidelity' && user.fidelity_status === 'OUI');
    
    return matchesSearch && matchesFilter;
  });

  // Utilisateurs éligibles pour sélection (fidèles dans DB mais pas sur blockchain)
  const eligibleForSelection = fidelityUsers.filter(user => 
    user.fidelity_status === 'OUI' && 
    !user.blockchain_eligible &&
    user.status === 'Active'
  );

  // GESTION DES ERREURS DE CHARGEMENT
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
              Synchronisation Supabase ↔ Blockchain pour les NFT de fidélité
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
              colorScheme="green"
              size="sm"
              onClick={handleSyncFidelityUsers}
              isLoading={!!loadingAction}
              leftIcon={<CheckIcon />}
            >
              🔄 Sync Auto
            </Button>
            <Button
              colorScheme="purple"
              leftIcon={<AddIcon />}
              onClick={onSelectOpen}
              isDisabled={eligibleForSelection.length === 0}
            >
              Sélectionner Utilisateurs
            </Button>
          </HStack>
        </HStack>

        {/* DEBUG: Informations de débogage */}
        {process.env.NODE_ENV === 'development' && (
          <Alert status="info">
            <AlertIcon />
            <Box fontSize="sm">
              <Text><strong>Debug:</strong></Text>
              <Text>• Supabase initialisé: {supabase ? '✅' : '❌'}</Text>
              <Text>• Contract connecté: {contract ? '✅' : '❌'}</Text>
              <Text>• IsOwner: {isOwner ? '✅' : '❌'}</Text>
              <Text>• Utilisateurs chargés: {fidelityUsers.length}</Text>
              <Text>• getFidelityEligibility: {getFidelityEligibility ? '✅' : '❌'}</Text>
            </Box>
          </Alert>
        )}

        {/* Statistiques */}
        <SimpleGrid columns={{ base: 2, md: 6 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>DB Fidélité</StatLabel>
                <StatNumber color="blue.500">{fidelityStats.dbFidelityUsers}</StatNumber>
                <StatHelpText>Marqués fidèles</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Blockchain Éligibles</StatLabel>
                <StatNumber color="purple.500">{fidelityStats.totalEligible}</StatNumber>
                <StatHelpText>Sur blockchain</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Synchronisés</StatLabel>
                <StatNumber color="green.500">{fidelityStats.syncedWithBlockchain}</StatNumber>
                <StatHelpText>DB → Blockchain</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>NFT Réclamés</StatLabel>
                <StatNumber color="orange.500">{fidelityStats.totalClaimed}</StatNumber>
                <StatHelpText>Mintés</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Supply Restant</StatLabel>
                <StatNumber color="red.500">{fidelityStats.remaining}</StatNumber>
                <StatHelpText>/ 50 total</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Taux Réclamation</StatLabel>
                <StatNumber>{fidelityStats.claimRate.toFixed(1)}%</StatNumber>
                <StatHelpText>Éligibles réclamés</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Indicateur de synchronisation */}
        {fidelityStats.dbFidelityUsers !== fidelityStats.syncedWithBlockchain && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">⚠️ Synchronisation incomplète</Text>
              <Text fontSize="sm">
                {fidelityStats.dbFidelityUsers - fidelityStats.syncedWithBlockchain} utilisateurs fidèles 
                en base ne sont pas encore synchronisés sur la blockchain.
                <Button size="xs" ml={2} colorScheme="orange" onClick={handleSyncFidelityUsers}>
                  Synchroniser maintenant
                </Button>
              </Text>
            </Box>
          </Alert>
        )}

        {/* Indicateur de chargement */}
        {loadingAction && (
          <Alert status="info">
            <Spinner size="sm" mr={3} />
            <Text>{loadingAction}</Text>
          </Alert>
        )}

        {/* Ajouter un utilisateur manuel */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="sm">➕ Ajouter une Adresse Manuellement</Heading>
              <HStack spacing={4}>
                <FormControl flex={1}>
                  <FormLabel fontSize="sm">Adresse Wallet (non répertoriée en base)</FormLabel>
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
              placeholder="Adresse, nom, prénom..."
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
              <option value="db_fidelity">Fidèles en DB</option>
              <option value="eligible">Éligibles blockchain</option>
              <option value="claimed">NFT réclamés</option>
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
                  Base: {allUsers.length} utilisateurs totaux
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
                      <Th>Nom Complet</Th>
                      <Th>Adresse</Th>
                      <Th>Statut DB</Th>
                      <Th>Blockchain</Th>
                      <Th>NFT Réclamé</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredUsers.map((user) => (
                      <Tr key={user.id}>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" fontSize="sm">
                              {user.first_name} {user.last_name}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              ID: {user.id}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Text fontSize="xs" fontFamily="mono">
                              {user.wallet_address.slice(0, 10)}...{user.wallet_address.slice(-8)}
                            </Text>
                            <Link 
                              href={`https://bscscan.com/address/${user.wallet_address}`}
                              isExternal
                            >
                              <ExternalLinkIcon boxSize={3} />
                            </Link>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge 
                            colorScheme={user.fidelity_status === 'OUI' ? 'green' : 'gray'} 
                            variant="solid"
                          >
                            {user.fidelity_status === 'OUI' ? '⭐ FIDÈLE' : '👤 NORMAL'}
                          </Badge>
                        </Td>
                        <Td>
                          <VStack spacing={1} align="start">
                            <Badge 
                              colorScheme={user.blockchain_eligible ? 'purple' : 'gray'} 
                              variant="outline"
                              size="sm"
                            >
                              {user.blockchain_eligible ? '✅ ÉLIGIBLE' : '❌ NON ÉLIGIBLE'}
                            </Badge>
                            {user.blockchain_claimed && (
                              <Badge colorScheme="blue" variant="solid" size="sm">
                                🎁 RÉCLAMÉ
                              </Badge>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          {user.fidelity_nft_claimed ? (
                            <VStack align="start" spacing={0}>
                              <Badge colorScheme="green" variant="solid">✅ OUI</Badge>
                              {user.fidelity_nft_claimed_date && (
                                <Text fontSize="xs" color="gray.500">
                                  {new Date(user.fidelity_nft_claimed_date).toLocaleDateString()}
                                </Text>
                              )}
                              {user.fidelity_nft_tx_hash && (
                                <Link 
                                  href={`https://bscscan.com/tx/${user.fidelity_nft_tx_hash}`}
                                  isExternal
                                  fontSize="xs"
                                  color="blue.500"
                                >
                                  TX: {user.fidelity_nft_tx_hash.slice(0, 8)}...
                                </Link>
                              )}
                            </VStack>
                          ) : (
                            <Badge colorScheme="orange" variant="outline">⏳ NON</Badge>
                          )}
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            {!user.blockchain_eligible && user.fidelity_status === 'OUI' && (
                              <Tooltip label="Ajouter à la blockchain">
                                <IconButton
                                  aria-label="Ajouter"
                                  icon={<AddIcon />}
                                  size="xs"
                                  colorScheme="green"
                                  variant="outline"
                                  onClick={() => handleAddUser(user.wallet_address)}
                                  isDisabled={!!loadingAction}
                                />
                              </Tooltip>
                            )}
                            {user.blockchain_eligible && (
                              <Tooltip label="Retirer de la blockchain">
                                <IconButton
                                  aria-label="Retirer"
                                  icon={<CloseIcon />}
                                  size="xs"
                                  colorScheme="red"
                                  variant="outline"
                                  onClick={() => handleRemoveUser(user.wallet_address)}
                                  isDisabled={!!loadingAction || user.blockchain_claimed}
                                />
                              </Tooltip>
                            )}
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
                      ? "Aucun utilisateur trouvé"
                      : "Aucun utilisateur trouvé avec les filtres actuels"
                    }
                  </Text>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Modal sélection utilisateurs */}
        <Modal isOpen={isSelectOpen} onClose={onSelectClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              🎯 Sélectionner les Utilisateurs Fidèles à Ajouter
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Alert status="info" size="sm">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Utilisateurs marqués comme fidèles en base mais pas encore éligibles sur la blockchain
                  </Text>
                </Alert>
                
                {eligibleForSelection.length === 0 ? (
                  <Text color="gray.500" textAlign="center" py={4}>
                    Tous les utilisateurs fidèles sont déjà synchronisés !
                  </Text>
                ) : (
                  <CheckboxGroup 
                    value={selectedUserIds.map(String)} 
                    onChange={(values) => setSelectedUserIds(values.map(Number))}
                  >
                    <Stack spacing={3}>
                      {eligibleForSelection.map((user) => (
                        <Checkbox 
                          key={user.id} 
                          value={String(user.id)}
                          colorScheme="purple"
                        >
                          <HStack spacing={3}>
                            <Text fontWeight="bold">
                              {user.first_name} {user.last_name}
                            </Text>
                            <Text fontSize="sm" fontFamily="mono" color="gray.600">
                              {user.wallet_address.slice(0, 10)}...{user.wallet_address.slice(-8)}
                            </Text>
                          </HStack>
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                )}
                
                <Alert status="warning" size="sm">
                  <AlertIcon />
                  <Text fontSize="sm">
                    ⚠️ Cette action écrira les éligibilités sur la blockchain et nécessitera des frais de gas.
                  </Text>
                </Alert>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onSelectClose}>
                Annuler
              </Button>
              <Button 
                colorScheme="purple" 
                onClick={handleBulkAddSelected}
                isLoading={!!loadingAction}
                loadingText="Ajout en cours..."
                isDisabled={selectedUserIds.length === 0}
              >
                🚀 Ajouter {selectedUserIds.length} utilisateur(s)
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default FidelityManager;
              