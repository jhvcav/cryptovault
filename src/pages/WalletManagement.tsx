// src/pages/WalletManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  FormControl,
  FormLabel,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Badge,
  Text,
  Heading,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { authorizedWallets, AuthorizedWallet, addAuthorizedWallet } from '../config/authorizedWallets';
import HybridAuthService from '../services/HybridAuthService';

const WalletManagement: React.FC = () => {
  const [wallets, setWallets] = useState<AuthorizedWallet[]>([]);
  const [currentMode, setCurrentMode] = useState<string>('auto');
  const [newWallet, setNewWallet] = useState({
    address: '',
    firstName: '',
    lastName: '',
    status: 'Active' as 'Active' | 'Suspended' | 'Inactive'
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    loadWallets();
    setCurrentMode(HybridAuthService.getCurrentMode());
  }, []);

  const loadWallets = async () => {
    const allWallets = await HybridAuthService.getAllUsers();
    setWallets(allWallets);
  };

  const handleAddWallet = async () => {
    if (!newWallet.address || !newWallet.firstName || !newWallet.lastName) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont requis",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (!newWallet.address.match(/^0x[a-fA-F0-9]{40}$/i)) {
      toast({
        title: "Erreur",
        description: "Format d'adresse wallet invalide",
        status: "error",
        duration: 3000,
      });
      return;
    }

    const success = await HybridAuthService.addAuthorizedUser(
      newWallet.address,
      newWallet.firstName,
      newWallet.lastName
    );

    if (success) {
      toast({
        title: "Succès",
        description: "Wallet ajouté avec succès",
        status: "success",
        duration: 3000,
      });
      setNewWallet({ address: '', firstName: '', lastName: '', status: 'Active' });
      onClose();
      loadWallets();
    } else {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter ce wallet (peut-être déjà existant)",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleUpdateStatus = async (address: string, newStatus: 'Active' | 'Suspended' | 'Inactive') => {
    const success = await HybridAuthService.updateUserStatus(address, newStatus);
    
    if (success) {
      toast({
        title: "Succès",
        description: `Statut mis à jour vers ${newStatus}`,
        status: "success",
        duration: 3000,
      });
      loadWallets();
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        status: "error",
        duration: 3000,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'teal';
      case 'Suspended': return 'orange';
      case 'Inactive': return 'red';
      default: return 'gray';
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(wallets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wallets_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* En-tête */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="blue.500">
              Gestion des Wallets Autorisés
            </Heading>
            <Badge colorScheme={currentMode === 'supabase' ? 'green' : 'blue'}>
              Mode: {currentMode === 'supabase' ? 'Supabase' : currentMode === 'local' ? 'Local' : 'Auto'}
            </Badge>
          </VStack>
          <HStack spacing={3}>
            <Button colorScheme="green" onClick={exportData}>
              Exporter JSON
            </Button>
            <Button colorScheme="blue" onClick={onOpen}>
              Ajouter un Wallet
            </Button>
          </HStack>
        </HStack>

        {/* Statistiques */}
        <HStack spacing={4}>
          <Card>
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {wallets.length}
              </Text>
              <Text fontSize="sm" color="gray.600">Total</Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {wallets.filter(w => w.status === 'Active').length}
              </Text>
              <Text fontSize="sm" color="gray.600">Actifs</Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                {wallets.filter(w => w.status === 'Suspended').length}
              </Text>
              <Text fontSize="sm" color="gray.600">Suspendus</Text>
            </CardBody>
          </Card>
        </HStack>

        {/* Tableau des wallets */}
        <Box overflowX="auto">
          <Table variant="simple" bg="white" rounded="lg" shadow="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>Adresse Wallet</Th>
                <Th>Nom</Th>
                <Th>Prénom</Th>
                <Th>Statut</Th>
                <Th>Date d'inscription</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {wallets.map((wallet) => (
                <Tr key={wallet.address}>
                  <Td fontFamily="mono" fontSize="sm">
                    {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 8)}
                  </Td>
                  <Td fontWeight="medium">{wallet.lastName}</Td>
                  <Td>{wallet.firstName}</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(wallet.status)}>
                      {wallet.status}
                    </Badge>
                  </Td>
                  <Td>{wallet.registrationDate}</Td>
                  <Td>
                    <Select
                      size="sm"
                      value={wallet.status}
                      onChange={(e) => handleUpdateStatus(wallet.address, e.target.value as any)}
                      w="120px"
                    >
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspendu</option>
                      <option value="Inactive">Inactif</option>
                    </Select>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        {wallets.length === 0 && (
          <Box textAlign="center" py={10}>
            <Text color="gray.500">Aucun wallet autorisé pour le moment</Text>
          </Box>
        )}
      </VStack>

      {/* Modal d'ajout */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ajouter un nouveau wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Adresse Wallet</FormLabel>
                <Input
                  placeholder="0x742d35Cc6634C0532925a3b8D404dEBC..."
                  value={newWallet.address}
                  onChange={(e) => setNewWallet({...newWallet, address: e.target.value})}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Prénom</FormLabel>
                <Input
                  placeholder="John"
                  value={newWallet.firstName}
                  onChange={(e) => setNewWallet({...newWallet, firstName: e.target.value})}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Nom</FormLabel>
                <Input
                  placeholder="Doe"
                  value={newWallet.lastName}
                  onChange={(e) => setNewWallet({...newWallet, lastName: e.target.value})}
                />
              </FormControl>

              <HStack spacing={3} w="full" pt={4}>
                <Button variant="outline" onClick={onClose} flex={1}>
                  Annuler
                </Button>
                <Button colorScheme="blue" onClick={handleAddWallet} flex={1}>
                  Ajouter
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WalletManagement;