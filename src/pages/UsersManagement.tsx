// src/pages/UsersManagement.tsx
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
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import HybridAuthService from '../services/HybridAuthService';

interface User {
  walletAddress: string;
  firstName: string;
  lastName: string;
  registrationDate: string;
  status: 'Active' | 'Suspended' | 'Inactive';
  fidelityStatus: 'OUI' | 'NON';
  userType: string;
  userTypeId: number;
}

interface UserType {
  id: number;
  typeName: string;
  description: string;
  permissions: Record<string, boolean>;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    walletAddress: '',
    firstName: '',
    lastName: '',
    status: 'Active' as 'Active' | 'Suspended' | 'Inactive',
    fidelityStatus: 'OUI' as 'OUI' | 'NON',
    userTypeId: 1
  });

  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const toast = useToast();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Styles modernes avec dégradé
  const bgGradient = 'linear(135deg, #667eea 0%, #764ba2 100%)';
  const cardBgColor = 'rgba(255, 255, 255, 0.95)';
  const tableBgColor = 'white';
  const tableHeaderBg = 'rgba(102, 126, 234, 0.1)';
  const borderColor = 'rgba(102, 126, 234, 0.2)';
  const shadowColor = '0 20px 40px rgba(0,0,0,0.1)';

  useEffect(() => {
    loadUsers();
    loadUserTypes();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const allUsers = await HybridAuthService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserTypes = async () => {
    try {
      const types = await HybridAuthService.getUserTypes();
      setUserTypes(types);
    } catch (error) {
      console.error('Erreur lors du chargement des types:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      walletAddress: '',
      firstName: '',
      lastName: '',
      status: 'Active',
      userTypeId: 1,
      fidelityStatus: 'NON'
    });
  };

  const validateForm = () => {
    if (!formData.walletAddress.trim()) {
      toast({ title: "Erreur", description: "L'adresse wallet est requise", status: "error" });
      return false;
    }
    
    if (!formData.walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
      toast({ title: "Erreur", description: "Format d'adresse wallet invalide", status: "error" });
      return false;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({ title: "Erreur", description: "Prénom et nom sont requis", status: "error" });
      return false;
    }

    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const success = await HybridAuthService.addAuthorizedUser(
        formData.walletAddress,
        formData.firstName,
        formData.lastName,
        formData.userTypeId
      );

      if (success) {
        toast({
          title: "Succès",
          description: "Utilisateur ajouté avec succès",
          status: "success",
          duration: 3000,
        });
        resetForm();
        onAddClose();
        loadUsers();
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter l'utilisateur (peut-être déjà existant)",
          status: "error",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      walletAddress: user.walletAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      fidelityStatus: user.fidelityStatus,
      userTypeId: user.userTypeId
    });
    onEditOpen();
  };

  const handleUpdate = async () => {
  if (!editingUser || !validateForm()) return;

  setIsLoading(true);
  try {
    // Mise à jour du statut
    const statusSuccess = await HybridAuthService.updateUserStatus(
      editingUser.walletAddress,
      formData.status
    );

    // Mise à jour du type d'utilisateur
    const typeSuccess = await HybridAuthService.updateUserType(
      editingUser.walletAddress,
      formData.userTypeId
    );

    // ✅ NOUVELLE LIGNE À AJOUTER ICI
    const fidelitySuccess = await HybridAuthService.updateUserFidelity(
      editingUser.walletAddress,
      formData.fidelityStatus
    );

    // ✅ MODIFIER CETTE CONDITION AUSSI
    if (statusSuccess && typeSuccess && fidelitySuccess) {
      toast({
        title: "Succès",
        description: "Utilisateur mis à jour avec succès",
        status: "success",
        duration: 3000,
      });
      setEditingUser(null);
      resetForm();
      onEditClose();
      loadUsers();
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'utilisateur",
        status: "error",
        duration: 3000,
      });
    }
  } catch (error) {
    toast({
      title: "Erreur",
      description: "Une erreur est survenue lors de la mise à jour",
      status: "error",
      duration: 3000,
    });
  } finally {
    setIsLoading(false);
  }
};

  const handleDelete = (user: User) => {
    setDeletingUser(user);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;

    setIsLoading(true);
    try {
      const success = await HybridAuthService.updateUserStatus(
        deletingUser.walletAddress,
        'Inactive'
      );

      if (success) {
        toast({
          title: "Succès",
          description: "Utilisateur désactivé avec succès",
          status: "success",
          duration: 3000,
        });
        setDeletingUser(null);
        onDeleteClose();
        loadUsers();
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de désactiver l'utilisateur",
          status: "error",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la désactivation",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'Admin': return 'purple';
      case 'MemberPrivilégié': return 'blue';
      case 'MemberSimple': return 'green';
      case 'UtilisateurExterne': return 'orange';
      case 'Invité': return 'gray';
      default: return 'gray';
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const icons = {
      'Admin': '👑',
      'MemberPrivilégié': '⭐',
      'MemberSimple': '👤',
      'UtilisateurExterne': '🔗',
      'Invité': '👥'
    };
    return icons[userType as keyof typeof icons] || '👤';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'green';
      case 'Suspended': return 'orange';
      case 'Inactive': return 'red';
      default: return 'gray';
    }
  };

  const filteredUsers = users.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportData = () => {
    const dataStr = JSON.stringify(users, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box 
      minH="100vh"
      bgGradient={bgGradient}
      p={6}
    >
      <Box maxW="1400px" mx="auto">
        <VStack spacing={6} align="stretch">
          {/* En-tête */}
          <Flex 
            align="center" 
            wrap="wrap" 
            gap={4}
            bg={cardBgColor}
            p={6}
            borderRadius="2xl"
            shadow={shadowColor}
            backdropFilter="blur(20px)"
            border="1px solid"
            borderColor={borderColor}
          >
            <VStack align="start" spacing={1}>
              <Heading size="lg" bgGradient="linear(to-r, #667eea, #764ba2)" bgClip="text">
                Gestion des Utilisateurs Autorisés
              </Heading>
              <Badge 
                bgGradient="linear(to-r, #667eea, #764ba2)" 
                color="white" 
                variant="solid"
                borderRadius="full"
                px={3}
              >
                ☁️ Base de données Supabase
              </Badge>
            </VStack>
            <Spacer />
            <HStack spacing={3}>
              <Button 
                bgGradient="linear(to-r, #48bb78, #38a169)"
                color="white"
                _hover={{
                  bgGradient: "linear(to-r, #38a169, #2f855a)",
                  transform: "translateY(-2px)",
                  shadow: "lg"
                }}
                onClick={exportData}
                size="md"
                borderRadius="xl"
                transition="all 0.3s ease"
              >
                📊 Exporter
              </Button>
              <Button 
                bgGradient="linear(to-r, #667eea, #764ba2)"
                color="white"
                _hover={{
                  bgGradient: "linear(to-r, #5a6fd8, #6b4190)",
                  transform: "translateY(-2px)",
                  shadow: "lg"
                }}
                onClick={() => {
                  resetForm();
                  onAddOpen();
                }}
                size="md"
                borderRadius="xl"
                transition="all 0.3s ease"
              >
                ➕ Nouvel utilisateur
              </Button>
            </HStack>
          </Flex>

          {/* Statistiques */}
          <HStack spacing={4} wrap="wrap">
            <Card 
              flex={1} 
              minW="150px" 
              bg={cardBgColor}
              backdropFilter="blur(20px)"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="2xl"
              shadow={shadowColor}
              transition="all 0.3s ease"
              _hover={{ transform: "translateY(-5px)", shadow: "2xl" }}
            >
              <CardBody textAlign="center" py={4}>
                <Text fontSize="2xl" fontWeight="bold" bgGradient="linear(to-r, #667eea, #764ba2)" bgClip="text">
                  {users.length}
                </Text>
                <Text fontSize="sm" color="gray.600">Total</Text>
              </CardBody>
            </Card>
            <Card 
              flex={1} 
              minW="150px" 
              bg={cardBgColor}
              backdropFilter="blur(20px)"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="2xl"
              shadow={shadowColor}
              transition="all 0.3s ease"
              _hover={{ transform: "translateY(-5px)", shadow: "2xl" }}
            >
              <CardBody textAlign="center" py={4}>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {users.filter(u => u.status === 'Active').length}
                </Text>
                <Text fontSize="sm" color="gray.600">Actifs</Text>
              </CardBody>
            </Card>
            <Card 
              flex={1} 
              minW="150px" 
              bg={cardBgColor}
              backdropFilter="blur(20px)"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="2xl"
              shadow={shadowColor}
              transition="all 0.3s ease"
              _hover={{ transform: "translateY(-5px)", shadow: "2xl" }}
            >
              <CardBody textAlign="center" py={4}>
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {users.filter(u => u.status === 'Suspended').length}
                </Text>
                <Text fontSize="sm" color="gray.600">Suspendus</Text>
              </CardBody>
            </Card>
            <Card 
              flex={1} 
              minW="150px" 
              bg={cardBgColor}
              backdropFilter="blur(20px)"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="2xl"
              shadow={shadowColor}
              transition="all 0.3s ease"
              _hover={{ transform: "translateY(-5px)", shadow: "2xl" }}
            >
              <CardBody textAlign="center" py={4}>
                <Text fontSize="2xl" fontWeight="bold" color="red.500">
                  {users.filter(u => u.status === 'Inactive').length}
                </Text>
                <Text fontSize="sm" color="gray.600">Inactifs</Text>
              </CardBody>
            </Card>
          </HStack>

          {/* Barre de recherche */}
          <Card 
            bg={cardBgColor}
            backdropFilter="blur(20px)"
            border="1px solid"
            borderColor={borderColor}
            borderRadius="2xl"
            shadow={shadowColor}
          >
            <CardBody>
              <HStack spacing={4}>
                <Input
                  placeholder="🔍 Rechercher par nom, prénom, adresse wallet ou type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg={tableBgColor}
                  border="2px solid"
                  borderColor="rgba(102, 126, 234, 0.1)"
                  borderRadius="xl"
                  _focus={{
                    borderColor: "#667eea",
                    boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)"
                  }}
                  size="md"
                />
                <Button 
                  onClick={loadUsers} 
                  isLoading={isLoading}
                  variant="outline"
                  borderColor="#667eea"
                  color="#667eea"
                  _hover={{
                    bg: "#667eea",
                    color: "white",
                    transform: "translateY(-2px)"
                  }}
                  borderRadius="xl"
                  transition="all 0.3s ease"
                >
                  🔄 Actualiser
                </Button>
              </HStack>
            </CardBody>
          </Card>

          {/* Tableau des utilisateurs */}
          <Card 
            bg={cardBgColor}
            backdropFilter="blur(20px)"
            border="1px solid"
            borderColor={borderColor}
            borderRadius="2xl"
            shadow={shadowColor}
            overflow="hidden"
          >
            <CardBody p={0}>
              <Box overflowX="auto">
                <Table variant="simple" bg={tableBgColor}>
                  <Thead bg={tableHeaderBg} borderBottom="2px solid" borderColor={borderColor}>
                    <Tr>
                      <Th color="gray.700" fontWeight="bold" fontSize="sm">Adresse Wallet</Th>
                      <Th color="gray.700" fontWeight="bold" fontSize="sm">Nom</Th>
                      <Th color="gray.700" fontWeight="bold" fontSize="sm">Prénom</Th>
                      <Th color="gray.700" fontWeight="bold" fontSize="sm">Type</Th>
                      <Th color="gray.700" fontWeight="bold" fontSize="sm">Statut</Th>
                      <Th color="gray.700" fontWeight="bold" fontSize="sm">Date d'inscription</Th>
                      <Th color="gray.700" fontWeight="bold" fontSize="sm">Statut Fidélité</Th>
                      <Th width="150px" color="gray.700" fontWeight="bold" fontSize="sm">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredUsers.map((user, index) => (
                      <Tr 
                        key={user.walletAddress} 
                        _hover={{ 
                          bg: "rgba(102, 126, 234, 0.05)",
                          transform: "scale(1.01)",
                          transition: "all 0.2s ease"
                        }}
                        borderBottom={index === filteredUsers.length - 1 ? "none" : "1px solid"}
                        borderColor="rgba(102, 126, 234, 0.1)"
                      >
                        <Td fontFamily="mono" fontSize="sm" color="gray.800" fontWeight="medium">
                          {user.walletAddress.substring(0, 10)}...{user.walletAddress.substring(user.walletAddress.length - 8)}
                        </Td>
                        <Td fontWeight="bold" color="gray.800">{user.lastName}</Td>
                        <Td color="gray.700" fontWeight="medium">{user.firstName}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <Text fontSize="lg">{getUserTypeBadge(user.userType)}</Text>
                            <Badge 
                              colorScheme={getUserTypeColor(user.userType)} 
                              variant="subtle"
                              borderRadius="full"
                              px={3}
                              py={1}
                              fontWeight="bold"
                              fontSize="xs"
                            >
                              {user.userType}
                            </Badge>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge 
                            colorScheme={getStatusColor(user.status)} 
                            variant="subtle"
                            borderRadius="full"
                            px={3}
                            py={1}
                            fontWeight="bold"
                          >
                            {user.status}
                          </Badge>
                        </Td>
                        <Td color="gray.700" fontWeight="medium">{user.registrationDate}</Td>
                        <Td>
                          <Badge 
                            colorScheme={getStatusColor(user.fidelityStatus)} 
                            variant="subtle"
                            borderRadius="full"
                            px={3}
                            py={1}
                            fontWeight="bold"
                          >
                            {user.fidelityStatus}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            <IconButton
                              aria-label="Modifier"
                              icon={<Text>✏️</Text>}
                              size="sm"
                              bg="rgba(102, 126, 234, 0.1)"
                              color="#667eea"
                              borderRadius="lg"
                              _hover={{
                                bg: "#667eea",
                                color: "white",
                                transform: "scale(1.1)"
                              }}
                              transition="all 0.2s ease"
                              onClick={() => handleEdit(user)}
                            />
                            <IconButton
                              aria-label="Supprimer"
                              icon={<Text>🗑️</Text>}
                              size="sm"
                              bg="rgba(245, 101, 101, 0.1)"
                              color="red.500"
                              borderRadius="lg"
                              _hover={{
                                bg: "red.500",
                                color: "white",
                                transform: "scale(1.1)"
                              }}
                              transition="all 0.2s ease"
                              onClick={() => handleDelete(user)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              {filteredUsers.length === 0 && !isLoading && (
                <Box textAlign="center" py={10}>
                  <Text color="gray.500" fontSize="lg">
                    {searchTerm ? 'Aucun résultat trouvé' : 'Aucun utilisateur pour le moment'}
                  </Text>
                </Box>
              )}
            </CardBody>
          </Card>
        </VStack>

        {/* Modal d'ajout */}
        <Modal isOpen={isAddOpen} onClose={onAddClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>➕ Nouvel utilisateur</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Adresse Wallet</FormLabel>
                  <Input
                    placeholder="0x742d35Cc6634C0532925a3b8D404dEBC..."
                    value={formData.walletAddress}
                    onChange={(e) => setFormData({...formData, walletAddress: e.target.value})}
                    fontFamily="mono"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Prénom</FormLabel>
                  <Input
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Nom</FormLabel>
                  <Input
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Type d'utilisateur</FormLabel>
                  <Select
                    value={formData.userTypeId}
                    onChange={(e) => setFormData({...formData, userTypeId: parseInt(e.target.value)})}
                  >
                    {userTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {getUserTypeBadge(type.typeName)} {type.typeName} - {type.description}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Statut</FormLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="Active">Actif</option>
                    <option value="Suspended">Suspendu</option>
                    <option value="Inactive">Inactif</option>
                  </Select>
                </FormControl>

                <HStack spacing={3} w="full" pt={4}>
                  <Button variant="outline" onClick={onAddClose} flex={1}>
                    Annuler
                  </Button>
                  <Button 
                    colorScheme="blue" 
                    onClick={handleAdd} 
                    flex={1}
                    isLoading={isLoading}
                  >
                    Ajouter
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Modal de modification */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>✏️ Modifier l'utilisateur</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isDisabled>
                  <FormLabel>Adresse Wallet</FormLabel>
                  <Input
                    value={formData.walletAddress}
                    fontFamily="mono"
                    bg="gray.100"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    L'adresse wallet ne peut pas être modifiée
                  </Text>
                </FormControl>
                
                <FormControl isDisabled>
                  <FormLabel>Prénom</FormLabel>
                  <Input
                    value={formData.firstName}
                    bg="gray.100"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Le prénom ne peut pas être modifié
                  </Text>
                </FormControl>
                
                <FormControl isDisabled>
                  <FormLabel>Nom</FormLabel>
                  <Input
                    value={formData.lastName}
                    bg="gray.100"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Le nom ne peut pas être modifié
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Type d'utilisateur</FormLabel>
                  <Select
                    value={formData.userTypeId}
                    onChange={(e) => setFormData({...formData, userTypeId: parseInt(e.target.value)})}
                  >
                    {userTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {getUserTypeBadge(type.typeName)} {type.typeName}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Fidélité</FormLabel>
                  <Select
                    value={formData.fidelityStatus}
                    onChange={(e) => setFormData({...formData, fidelityStatus: e.target.value as any})}
                  >
                    <option value="OUI">OUI</option>
                    <option value="NON">NON</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Statut</FormLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="Active">Actif</option>
                    <option value="Suspended">Suspendu</option>
                    <option value="Inactive">Inactif</option>
                  </Select>
                </FormControl>

                <HStack spacing={3} w="full" pt={4}>
                  <Button variant="outline" onClick={onEditClose} flex={1}>
                    Annuler
                  </Button>
                  <Button 
                    colorScheme="blue" 
                    onClick={handleUpdate} 
                    flex={1}
                    isLoading={isLoading}
                  >
                    Mettre à jour
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                🗑️ Désactiver l'utilisateur
              </AlertDialogHeader>

              <AlertDialogBody>
                Êtes-vous sûr de vouloir désactiver l'utilisateur{" "}
                <strong>{deletingUser?.firstName} {deletingUser?.lastName}</strong> ?
                <br /><br />
                <Text fontSize="sm" color="gray.600">
                  L'utilisateur sera marqué comme "Inactif" et ne pourra plus se connecter.
                  Cette action peut être annulée en modifiant le statut.
                </Text>
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Annuler
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={confirmDelete} 
                  ml={3}
                  isLoading={isLoading}
                >
                  Désactiver
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </Box>
  );
};

export default UsersManagement;