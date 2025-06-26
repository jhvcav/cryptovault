// src/pages/AdminRegistrationsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  VStack,
  HStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
  Container,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Spacer,
  IconButton,
  Tooltip,
  Input,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  CheckIcon, 
  CloseIcon, 
  ViewIcon, 
  EmailIcon, 
  PhoneIcon, 
  EditIcon, 
  DeleteIcon 
} from '@chakra-ui/icons';
import { supabase, CryptocaVaultDB } from '../lib/supabase';

// Types
interface CommunityMemberRegistration {
  id: string;
  username: string;
  email: string;
  phone?: string;
  wallet_address?: string;
  status: 'pending' | 'active' | 'inactive' | 'rejected';
  acceptance_timestamp: string;
  acceptance_ip?: string;
  charter_accepted: boolean;
  charter_version: string;
  registration_method: string;
  updated_at?: string;
  nft_minted?: boolean;
  nft_token_id?: string;
}

interface RegistrationStats {
  total: number;
  pending: number;
  active: number;
  inactive: number;
  rejected: number;
  today: number;
  thisWeek: number;
}

const AdminRegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<CommunityMemberRegistration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<CommunityMemberRegistration | null>(null);
  const [editedRegistration, setEditedRegistration] = useState<CommunityMemberRegistration | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stats, setStats] = useState<RegistrationStats>({
    total: 0,
    pending: 0,
    active: 0,
    inactive: 0,
    rejected: 0,
    today: 0,
    thisWeek: 0
  });

  const toast = useToast();
  const { isOpen: isValidateOpen, onOpen: onValidateOpen, onClose: onValidateClose } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const deleteRef = React.useRef<HTMLButtonElement>(null);

  // Styles
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Charger les données
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Charger les inscriptions de la communauté
      const { data: regsData, error: regsError } = await supabase
        .from('community_members')
        .select('*')
        .order('acceptance_timestamp', { ascending: false });

      if (regsError) throw regsError;

      setRegistrations(regsData || []);
      
      // Calculer les statistiques
      calculateStats(regsData || []);

    } catch (error: any) {
      console.error('Erreur chargement données:', error);
      setError('Erreur lors du chargement: ' + error.message);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer les statistiques
  const calculateStats = (data: CommunityMemberRegistration[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      active: data.filter(r => r.status === 'active').length,
      inactive: data.filter(r => r.status === 'inactive').length,
      rejected: data.filter(r => r.status === 'rejected').length,
      today: data.filter(r => new Date(r.acceptance_timestamp) >= today).length,
      thisWeek: data.filter(r => new Date(r.acceptance_timestamp) >= weekAgo).length,
    };

    setStats(stats);
  };

  // Filtrer les inscriptions
  const filteredRegistrations = registrations.filter(reg => {
    const matchesFilter = filter === 'all' || reg.status === filter;
    const matchesSearch = searchTerm === '' || 
      reg.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.wallet_address && reg.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir la couleur du badge selon le statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'active': return 'green';
      case 'inactive': return 'gray';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  // Ouvrir modal de validation
  const handleValidate = (registration: CommunityMemberRegistration) => {
    setSelectedRegistration(registration);
    setAdminNotes('');
    onValidateOpen();
  };

  // Ouvrir modal de rejet
  const handleReject = (registration: CommunityMemberRegistration) => {
    setSelectedRegistration(registration);
    setAdminNotes('');
    onRejectOpen();
  };

  // Voir les détails
  const handleView = (registration: CommunityMemberRegistration) => {
    setSelectedRegistration(registration);
    onViewOpen();
  };

  // Ouvrir modal d'édition
  const handleEdit = (registration: CommunityMemberRegistration) => {
    setEditedRegistration({ ...registration });
    onEditOpen();
  };

  // Ouvrir modal de suppression
  const handleDelete = (registration: CommunityMemberRegistration) => {
    setSelectedRegistration(registration);
    onDeleteOpen();
  };

  // Valider une inscription
  const confirmValidation = async () => {
    if (!selectedRegistration) return;

    try {
      setIsLoading(true);

      const { error: updateError } = await supabase
        .from('community_members')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRegistration.id);

      if (updateError) throw updateError;

      // Log d'audit
      await CryptocaVaultDB.createAuditLog({
        action: 'member_validated',
        wallet_address: selectedRegistration.wallet_address || 'none',
        details: {
          memberId: selectedRegistration.id,
          validatedBy: 'admin',
          originalStatus: selectedRegistration.status,
          notes: adminNotes
        }
      });

      toast({
        title: 'Inscription validée',
        description: `${selectedRegistration.username} a été validé avec succès`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onValidateClose();
      fetchData(); // Recharger les données

    } catch (error: any) {
      console.error('Erreur validation:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la validation: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Rejeter une inscription
  const confirmRejection = async () => {
    if (!selectedRegistration) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('community_members')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRegistration.id);

      if (error) throw error;

      // Log d'audit
      await CryptocaVaultDB.createAuditLog({
        action: 'member_rejected',
        wallet_address: selectedRegistration.wallet_address || 'none',
        details: {
          memberId: selectedRegistration.id,
          rejectedBy: 'admin',
          reason: adminNotes,
          originalStatus: selectedRegistration.status
        }
      });

      toast({
        title: 'Inscription rejetée',
        description: `La demande de ${selectedRegistration.username} a été rejetée`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      onRejectClose();
      fetchData(); // Recharger les données

    } catch (error: any) {
      console.error('Erreur rejet:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du rejet: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sauvegarder les modifications
  const saveEdit = async () => {
    if (!editedRegistration) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('community_members')
        .update({
          username: editedRegistration.username,
          email: editedRegistration.email,
          phone: editedRegistration.phone,
          wallet_address: editedRegistration.wallet_address,
          updated_at: new Date().toISOString()
        })
        .eq('id', editedRegistration.id);

      if (error) throw error;

      // Log d'audit
      await CryptocaVaultDB.createAuditLog({
        action: 'member_edited',
        wallet_address: editedRegistration.wallet_address || 'none',
        details: {
          memberId: editedRegistration.id,
          editedBy: 'admin',
          changes: 'Member data updated'
        }
      });

      toast({
        title: 'Modifications sauvegardées',
        description: `Les données de ${editedRegistration.username} ont été mises à jour`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onEditClose();
      fetchData(); // Recharger les données

    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la sauvegarde: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer une inscription
  const confirmDelete = async () => {
    if (!selectedRegistration) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('id', selectedRegistration.id);

      if (error) throw error;

      // Log d'audit
      await CryptocaVaultDB.createAuditLog({
        action: 'member_deleted',
        wallet_address: selectedRegistration.wallet_address || 'none',
        details: {
          memberId: selectedRegistration.id,
          deletedBy: 'admin',
          memberData: {
            username: selectedRegistration.username,
            email: selectedRegistration.email
          }
        }
      });

      toast({
        title: 'Inscription supprimée',
        description: `${selectedRegistration.username} a été supprimé du système`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });

      onDeleteClose();
      fetchData(); // Recharger les données

    } catch (error: any) {
      console.error('Erreur suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* En-tête */}
        <Box>
          <Heading size="xl" mb={2}>Gestion des Inscriptions Communauté</Heading>
          <Text color="gray.600">Administrez les inscriptions à la communauté CryptocaVault</Text>
        </Box>

        {/* Statistiques */}
        <SimpleGrid columns={{ base: 2, md: 6 }} spacing={4}>
          <Stat>
            <StatLabel>Total</StatLabel>
            <StatNumber color="blue.500">{stats.total}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>En attente</StatLabel>
            <StatNumber color="yellow.500">{stats.pending}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Actifs</StatLabel>
            <StatNumber color="green.500">{stats.active}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Inactifs</StatLabel>
            <StatNumber color="gray.500">{stats.inactive}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Rejetés</StatLabel>
            <StatNumber color="red.500">{stats.rejected}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Cette semaine</StatLabel>
            <StatNumber color="teal.500">{stats.thisWeek}</StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Messages d'erreur */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Filtres et recherche */}
        <Card bg={cardBg}>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="md">Filtres</Heading>
              <Button onClick={fetchData} isLoading={isLoading} size="sm">
                Actualiser
              </Button>
            </Flex>
          </CardHeader>
          <CardBody>
            <HStack spacing={4}>
              <FormControl maxW="200px">
                <FormLabel>Statut</FormLabel>
                <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">Tous</option>
                  <option value="pending">En attente</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                  <option value="rejected">Rejetés</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Recherche</FormLabel>
                <Input
                  placeholder="Username, email ou wallet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </FormControl>
            </HStack>
          </CardBody>
        </Card>

        {/* Tableau des inscriptions */}
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">
              Inscriptions ({filteredRegistrations.length})
            </Heading>
          </CardHeader>
          <CardBody p={0}>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Utilisateur</Th>
                    <Th>Email</Th>
                    <Th>Téléphone</Th>
                    <Th>Wallet</Th>
                    <Th>Date d'inscription</Th>
                    <Th>Statut</Th>
                    <Th>NFT</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredRegistrations.map((registration) => (
                    <Tr key={registration.id}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold">
                            {registration.username}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {registration.registration_method}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <HStack>
                          <EmailIcon boxSize={3} color="gray.400" />
                          <Text fontSize="sm">{registration.email}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        <HStack>
                          <PhoneIcon boxSize={3} color="gray.400" />
                          <Text fontSize="sm">{registration.phone || '-'}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        {registration.wallet_address ? (
                          <Text fontSize="xs" fontFamily="mono">
                            {registration.wallet_address.slice(0, 6)}...
                            {registration.wallet_address.slice(-4)}
                          </Text>
                        ) : (
                          <Text fontSize="sm" color="gray.400">-</Text>
                        )}
                      </Td>
                      <Td>
                        <Text fontSize="sm">{formatDate(registration.acceptance_timestamp)}</Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(registration.status)}>
                          {registration.status}
                        </Badge>
                      </Td>
                      <Td>
                        {registration.nft_minted ? (
                          <Badge colorScheme="purple" size="sm">
                            #{registration.nft_token_id}
                          </Badge>
                        ) : (
                          <Text fontSize="sm" color="gray.400">-</Text>
                        )}
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <Tooltip label="Voir détails">
                            <IconButton
                              aria-label="Voir"
                              icon={<ViewIcon />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleView(registration)}
                            />
                          </Tooltip>
                          <Tooltip label="Modifier">
                            <IconButton
                              aria-label="Modifier"
                              icon={<EditIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => handleEdit(registration)}
                            />
                          </Tooltip>
                          {registration.status === 'pending' && (
                            <>
                              <Tooltip label="Valider">
                                <IconButton
                                  aria-label="Valider"
                                  icon={<CheckIcon />}
                                  size="sm"
                                  colorScheme="green"
                                  variant="ghost"
                                  onClick={() => handleValidate(registration)}
                                />
                              </Tooltip>
                              <Tooltip label="Rejeter">
                                <IconButton
                                  aria-label="Rejeter"
                                  icon={<CloseIcon />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleReject(registration)}
                                />
                              </Tooltip>
                            </>
                          )}
                          <Tooltip label="Supprimer">
                            <IconButton
                              aria-label="Supprimer"
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleDelete(registration)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {filteredRegistrations.length === 0 && (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">Aucune inscription trouvée</Text>
                </Box>
              )}
            </Box>
          </CardBody>
        </Card>
      </VStack>

      {/* Modal de validation */}
      <Modal isOpen={isValidateOpen} onClose={onValidateClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Valider l'inscription</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRegistration && (
              <VStack spacing={4} align="stretch">
                <Box p={4} bg="green.50" borderRadius="md">
                  <Text fontWeight="semibold">
                    {selectedRegistration.username}
                  </Text>
                  <Text fontSize="sm" color="gray.600">{selectedRegistration.email}</Text>
                </Box>

                <FormControl>
                  <FormLabel>Notes administratives (optionnel)</FormLabel>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Ajoutez des notes sur cette validation..."
                    rows={3}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onValidateClose}>
              Annuler
            </Button>
            <Button
              colorScheme="green"
              onClick={confirmValidation}
              isLoading={isLoading}
            >
              Valider l'inscription
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de rejet */}
      <Modal isOpen={isRejectOpen} onClose={onRejectClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rejeter l'inscription</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRegistration && (
              <VStack spacing={4} align="stretch">
                <Box p={4} bg="red.50" borderRadius="md">
                  <Text fontWeight="semibold">
                    {selectedRegistration.username}
                  </Text>
                  <Text fontSize="sm" color="gray.600">{selectedRegistration.email}</Text>
                </Box>

                <FormControl isRequired>
                  <FormLabel>Raison du rejet</FormLabel>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Expliquez pourquoi cette inscription est rejetée..."
                    rows={4}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRejectClose}>
              Annuler
            </Button>
            <Button
              colorScheme="red"
              onClick={confirmRejection}
              isLoading={isLoading}
              isDisabled={!adminNotes.trim()}
            >
              Confirmer le rejet
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'édition */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modifier l'inscription</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editedRegistration && (
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Nom d'utilisateur</FormLabel>
                  <Input
                    value={editedRegistration.username}
                    onChange={(e) => setEditedRegistration({
                      ...editedRegistration,
                      username: e.target.value
                    })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={editedRegistration.email}
                    onChange={(e) => setEditedRegistration({
                      ...editedRegistration,
                      email: e.target.value
                    })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Téléphone</FormLabel>
                  <Input
                    value={editedRegistration.phone || ''}
                    onChange={(e) => setEditedRegistration({
                      ...editedRegistration,
                      phone: e.target.value
                    })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Adresse Wallet</FormLabel>
                  <Input
                    value={editedRegistration.wallet_address || ''}
                    onChange={(e) => setEditedRegistration({
                      ...editedRegistration,
                      wallet_address: e.target.value
                    })}
                    placeholder="0x..."
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Annuler
            </Button>
            <Button
              colorScheme="blue"
              onClick={saveEdit}
              isLoading={isLoading}
            >
              Sauvegarder
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de visualisation */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Détails de l'inscription</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRegistration && (
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Nom d'utilisateur</Text>
                    <Text>{selectedRegistration.username}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Email</Text>
                    <Text>{selectedRegistration.email}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Téléphone</Text>
                    <Text>{selectedRegistration.phone || 'Non renseigné'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Statut</Text>
                    <Badge colorScheme={getStatusColor(selectedRegistration.status)}>
                      {selectedRegistration.status}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Date d'inscription</Text>
                    <Text>{formatDate(selectedRegistration.acceptance_timestamp)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Méthode d'inscription</Text>
                    <Text>{selectedRegistration.registration_method}</Text>
                  </Box>
                </SimpleGrid>

                {selectedRegistration.wallet_address && (
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Adresse Wallet</Text>
                    <Text fontFamily="mono" fontSize="sm">{selectedRegistration.wallet_address}</Text>
                  </Box>
                )}

                {selectedRegistration.acceptance_ip && (
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Adresse IP d'inscription</Text>
                    <Text fontFamily="mono" fontSize="sm">{selectedRegistration.acceptance_ip}</Text>
                  </Box>
                )}

                <Box>
                  <Text fontWeight="semibold" fontSize="sm" color="gray.600">Charte acceptée</Text>
                  <HStack>
                    <Badge colorScheme={selectedRegistration.charter_accepted ? 'green' : 'red'}>
                      {selectedRegistration.charter_accepted ? 'Oui' : 'Non'}
                    </Badge>
                    <Text fontSize="sm" color="gray.500">
                      Version {selectedRegistration.charter_version}
                    </Text>
                  </HStack>
                </Box>

                {selectedRegistration.nft_minted && (
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">NFT</Text>
                    <HStack>
                      <Badge colorScheme="purple">
                        Token #{selectedRegistration.nft_token_id}
                      </Badge>
                      <Text fontSize="sm" color="gray.500">NFT généré</Text>
                    </HStack>
                  </Box>
                )}

                {selectedRegistration.updated_at && (
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Dernière mise à jour</Text>
                    <Text fontSize="sm">{formatDate(selectedRegistration.updated_at)}</Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onViewClose}>Fermer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* AlertDialog de suppression */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={deleteRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Supprimer l'inscription
            </AlertDialogHeader>

            <AlertDialogBody>
              {selectedRegistration && (
                <VStack spacing={3} align="stretch">
                  <Text>
                    Êtes-vous sûr de vouloir supprimer définitivement l'inscription de :
                  </Text>
                  <Box p={3} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
                    <Text fontWeight="semibold" color="red.800">
                      {selectedRegistration.username}
                    </Text>
                    <Text fontSize="sm" color="red.600">
                      {selectedRegistration.email}
                    </Text>
                    {selectedRegistration.wallet_address && (
                      <Text fontSize="xs" fontFamily="mono" color="red.600">
                        {selectedRegistration.wallet_address}
                      </Text>
                    )}
                  </Box>
                  <Alert status="warning" size="sm">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Cette action est irréversible. Toutes les données associées seront perdues.
                    </Text>
                  </Alert>
                </VStack>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={deleteRef} onClick={onDeleteClose}>
                Annuler
              </Button>
              <Button 
                colorScheme="red" 
                onClick={confirmDelete}
                isLoading={isLoading}
                ml={3}
              >
                Supprimer définitivement
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default AdminRegistrationsPage;