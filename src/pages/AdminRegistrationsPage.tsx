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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, ViewIcon, EmailIcon, PhoneIcon } from '@chakra-ui/icons';
import { supabase, CryptocaVaultDB } from '../lib/supabase';

// Types
interface PublicRegistration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  wallet_address?: string;
  registration_date: string;
  registration_ip?: string;
  notes?: string;
  processed_by?: string;
  processed_date?: string;
}

interface AuthorizedWallet {
  id: string;
  wallet_address: string;
  first_name: string;
  last_name: string;
  status: string;
  user_type_id: number;
}

interface RegistrationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  today: number;
  thisWeek: number;
}

const AdminRegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<PublicRegistration[]>([]);
  const [availableWallets, setAvailableWallets] = useState<AuthorizedWallet[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<PublicRegistration | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stats, setStats] = useState<RegistrationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    today: 0,
    thisWeek: 0
  });

  const toast = useToast();
  const { isOpen: isApprovalOpen, onOpen: onApprovalOpen, onClose: onApprovalClose } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

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

      // Charger les inscriptions publiques
      const { data: regsData, error: regsError } = await supabase
        .from('public_registrations')
        .select('*')
        .order('registration_date', { ascending: false });

      if (regsError) throw regsError;

      // Charger les wallets autorisés disponibles
      const availableWallets = await CryptocaVaultDB.getAvailableAuthorizedWallets();

      setRegistrations(regsData || []);
      setAvailableWallets(availableWallets);
      
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
  const calculateStats = (data: PublicRegistration[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      approved: data.filter(r => r.status === 'approved').length,
      rejected: data.filter(r => r.status === 'rejected').length,
      today: data.filter(r => new Date(r.registration_date) >= today).length,
      thisWeek: data.filter(r => new Date(r.registration_date) >= weekAgo).length,
    };

    setStats(stats);
  };

  // Filtrer les inscriptions
  const filteredRegistrations = registrations.filter(reg => {
    const matchesFilter = filter === 'all' || reg.status === filter;
    const matchesSearch = searchTerm === '' || 
      reg.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  // Ouvrir modal d'approbation
  const handleApprove = (registration: PublicRegistration) => {
    setSelectedRegistration(registration);
    setSelectedWallet('');
    setAdminNotes('');
    onApprovalOpen();
  };

  // Ouvrir modal de rejet
  const handleReject = (registration: PublicRegistration) => {
    setSelectedRegistration(registration);
    setAdminNotes('');
    onRejectOpen();
  };

  // Voir les détails
  const handleView = (registration: PublicRegistration) => {
    setSelectedRegistration(registration);
    onViewOpen();
  };

  // Approuver une inscription
  const confirmApproval = async () => {
    if (!selectedRegistration || !selectedWallet) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un wallet autorisé',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);

      // Mettre à jour l'inscription
      const { error: updateError } = await supabase
        .from('public_registrations')
        .update({
          status: 'approved',
          wallet_address: selectedWallet,
          notes: adminNotes,
          processed_by: 'admin', // À remplacer par l'ID de l'admin connecté
          processed_date: new Date().toISOString()
        })
        .eq('id', selectedRegistration.id);

      if (updateError) throw updateError;

      // Créer le membre de la communauté
      const walletData = availableWallets.find(w => w.wallet_address === selectedWallet);
      if (walletData) {
        await CryptocaVaultDB.createCommunityMember({
          wallet_address: selectedWallet,
          username: `${selectedRegistration.first_name}_${selectedRegistration.last_name}`.toLowerCase(),
          first_name: selectedRegistration.first_name,
          last_name: selectedRegistration.last_name,
          email: selectedRegistration.email,
          phone: selectedRegistration.phone,
          registration_method: 'admin_approval'
        });
      }

      // Log d'audit
      await CryptocaVaultDB.createAuditLog({
        action: 'registration_approved',
        wallet_address: selectedWallet,
        details: {
          registrationId: selectedRegistration.id,
          approvedBy: 'admin',
          originalEmail: selectedRegistration.email
        }
      });

      toast({
        title: 'Inscription approuvée',
        description: `${selectedRegistration.first_name} ${selectedRegistration.last_name} a été approuvé`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onApprovalClose();
      fetchData(); // Recharger les données

    } catch (error: any) {
      console.error('Erreur approbation:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'approbation: ' + error.message,
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
        .from('public_registrations')
        .update({
          status: 'rejected',
          notes: adminNotes,
          processed_by: 'admin', // À remplacer par l'ID de l'admin connecté
          processed_date: new Date().toISOString()
        })
        .eq('id', selectedRegistration.id);

      if (error) throw error;

      // Log d'audit
      await CryptocaVaultDB.createAuditLog({
        action: 'registration_rejected',
        wallet_address: 'none',
        details: {
          registrationId: selectedRegistration.id,
          rejectedBy: 'admin',
          reason: adminNotes,
          email: selectedRegistration.email
        }
      });

      toast({
        title: 'Inscription rejetée',
        description: `La demande de ${selectedRegistration.first_name} ${selectedRegistration.last_name} a été rejetée`,
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

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* En-tête */}
        <Box>
          <Heading size="xl" mb={2}>Administration des Inscriptions</Heading>
          <Text color="gray.600">Gérez les demandes d'inscription à la communauté CryptocaVault</Text>
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
            <StatLabel>Approuvées</StatLabel>
            <StatNumber color="green.500">{stats.approved}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Rejetées</StatLabel>
            <StatNumber color="red.500">{stats.rejected}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Aujourd'hui</StatLabel>
            <StatNumber color="purple.500">{stats.today}</StatNumber>
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
                  <option value="approved">Approuvées</option>
                  <option value="rejected">Rejetées</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Recherche</FormLabel>
                <Input
                  placeholder="Nom, prénom ou email..."
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
                    <Th>Nom</Th>
                    <Th>Email</Th>
                    <Th>Téléphone</Th>
                    <Th>Date</Th>
                    <Th>Statut</Th>
                    <Th>Wallet assigné</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredRegistrations.map((registration) => (
                    <Tr key={registration.id}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold">
                            {registration.first_name} {registration.last_name}
                          </Text>
                          {registration.registration_ip && (
                            <Text fontSize="xs" color="gray.500">
                              IP: {registration.registration_ip}
                            </Text>
                          )}
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
                          <Text fontSize="sm">{registration.phone}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm">{formatDate(registration.registration_date)}</Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(registration.status)}>
                          {registration.status}
                        </Badge>
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
                        <HStack spacing={2}>
                          <Tooltip label="Voir détails">
                            <IconButton
                              aria-label="Voir"
                              icon={<ViewIcon />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleView(registration)}
                            />
                          </Tooltip>
                          {registration.status === 'pending' && (
                            <>
                              <Tooltip label="Approuver">
                                <IconButton
                                  aria-label="Approuver"
                                  icon={<CheckIcon />}
                                  size="sm"
                                  colorScheme="green"
                                  variant="ghost"
                                  onClick={() => handleApprove(registration)}
                                  isDisabled={availableWallets.length === 0}
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

        {/* Informations sur les wallets disponibles */}
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">Wallets Autorisés Disponibles ({availableWallets.length})</Heading>
          </CardHeader>
          <CardBody>
            {availableWallets.length === 0 ? (
              <Alert status="warning">
                <AlertIcon />
                Aucun wallet autorisé disponible. Vous devez d'abord ajouter des wallets dans le système.
              </Alert>
            ) : (
              <Text color="gray.600">
                {availableWallets.length} wallet(s) disponible(s) pour assignation
              </Text>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Modal d'approbation */}
      <Modal isOpen={isApprovalOpen} onClose={onApprovalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Approuver l'inscription</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRegistration && (
              <VStack spacing={4} align="stretch">
                <Box p={4} bg="green.50" borderRadius="md">
                  <Text fontWeight="semibold">
                    {selectedRegistration.first_name} {selectedRegistration.last_name}
                  </Text>
                  <Text fontSize="sm" color="gray.600">{selectedRegistration.email}</Text>
                  <Text fontSize="sm" color="gray.600">{selectedRegistration.phone}</Text>
                </Box>

                <FormControl isRequired>
                  <FormLabel>Wallet à assigner</FormLabel>
                  <Select
                    placeholder="Sélectionnez un wallet autorisé"
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                  >
                    {availableWallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.wallet_address}>
                        {wallet.wallet_address} - {wallet.first_name} {wallet.last_name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Notes administratives (optionnel)</FormLabel>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Ajoutez des notes sur cette approbation..."
                    rows={3}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onApprovalClose}>
              Annuler
            </Button>
            <Button
              colorScheme="green"
              onClick={confirmApproval}
              isLoading={isLoading}
              isDisabled={!selectedWallet}
            >
              Confirmer l'approbation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de rejet */}
      <Modal isOpen={isRejectOpen} onClose={onRejectClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rejeter l'inscription</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRegistration && (
              <VStack spacing={4} align="stretch">
                <Box p={4} bg="red.50" borderRadius="md">
                  <Text fontWeight="semibold">
                    {selectedRegistration.first_name} {selectedRegistration.last_name}
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
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Prénom</Text>
                    <Text>{selectedRegistration.first_name}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Nom</Text>
                    <Text>{selectedRegistration.last_name}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Email</Text>
                    <Text>{selectedRegistration.email}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Téléphone</Text>
                    <Text>{selectedRegistration.phone}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Date d'inscription</Text>
                    <Text>{formatDate(selectedRegistration.registration_date)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Statut</Text>
                    <Badge colorScheme={getStatusColor(selectedRegistration.status)}>
                      {selectedRegistration.status}
                    </Badge>
                  </Box>
                </SimpleGrid>

                {selectedRegistration.registration_ip && (
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Adresse IP</Text>
                    <Text fontFamily="mono">{selectedRegistration.registration_ip}</Text>
                  </Box>
                )}

                {selectedRegistration.wallet_address && (
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Wallet assigné</Text>
                    <Text fontFamily="mono">{selectedRegistration.wallet_address}</Text>
                  </Box>
                )}

                {selectedRegistration.notes && (
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Notes administratives</Text>
                    <Box p={3} bg="gray.50" borderRadius="md">
                      <Text>{selectedRegistration.notes}</Text>
                    </Box>
                  </Box>
                )}

                {selectedRegistration.processed_date && (
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">Traité le</Text>
                    <Text>{formatDate(selectedRegistration.processed_date)}</Text>
                    {selectedRegistration.processed_by && (
                      <Text fontSize="sm" color="gray.500">Par: {selectedRegistration.processed_by}</Text>
                    )}
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
    </Container>
  );
};

export default AdminRegistrationsPage;