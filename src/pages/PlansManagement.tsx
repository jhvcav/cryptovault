import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Input,
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Switch,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Spinner,
  Text,
  Divider,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue
} from '@chakra-ui/react';

// Types
interface Plan {
  id: number;
  apr: number;
  duration: number;
  minAmount: number;
  active: boolean;
  activeUsersCount?: number;
  totalInvested?: number; // ← Nouveau champ
}

interface PlanFormData {
  apr: string;
  duration: string;
  minAmount: string;
}

const PlansManagement: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [knownUsers, setKnownUsers] = useState<string[]>([]);
  const [planForm, setPlanForm] = useState<PlanFormData>({
    apr: '',
    duration: '',
    minAmount: ''
  });
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Fonction pour récupérer automatiquement tous les investisseurs via les événements
  const getAllInvestorsFromEvents = async (contract) => {
    try {
      console.log('🔍 Récupération de tous les utilisateurs via événements...');
      
      // Récupérer tous les événements Staked
      const stakedFilter = contract.filters.Staked();
      const stakedEvents = await contract.queryFilter(stakedFilter, 0, 'latest');
      
      // Extraire toutes les adresses uniques
      const allInvestors = [...new Set(
        stakedEvents.map(event => event.args.user.toLowerCase())
      )];
      
      console.log(`✅ ${allInvestors.length} utilisateurs détectés via événements:`, allInvestors);
      return allInvestors;
      
    } catch (error) {
      console.error('❌ Erreur récupération utilisateurs via événements:', error);
      
      // Fallback vers utilisateurs par défaut
      const fallbackUsers = [
        "0x1FF70C1DFc33F5DDdD1AD2b525a07b172182d8eF",
        "0xec0cf7505c86e0ea33a2f2de4660e6a06abe92dd"
      ];
      console.log('🔄 Utilisation des utilisateurs par défaut:', fallbackUsers);
      return fallbackUsers;
    }
  };

  // Charger les utilisateurs connus depuis localStorage (synchronisé avec AdminDashboard)
  const loadKnownUsers = async () => {
    try {
      // D'abord essayer de récupérer tous les investisseurs automatiquement
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          '0x719fd9F511DDc561D03801161742D84ECb9445e9',
          [
            "event Staked(address indexed user, uint256 planId, uint256 amount, uint256 startTime, uint256 endTime, address token)"
          ],
          provider
        );
        
        const autoDetectedUsers = await getAllInvestorsFromEvents(contract);
        if (autoDetectedUsers.length > 0) {
          setKnownUsers(autoDetectedUsers);
          // Sauvegarder dans localStorage pour les prochaines fois
          localStorage.setItem('knownUsers', JSON.stringify(autoDetectedUsers));
          console.log('✅ Utilisateurs auto-détectés sauvegardés dans localStorage');
          return;
        }
      }
      
      // Fallback : utiliser localStorage existant
      const savedUsers = localStorage.getItem('knownUsers');
      if (savedUsers) {
        const users = JSON.parse(savedUsers);
        if (Array.isArray(users) && users.length > 0) {
          // S'assurer que tous les utilisateurs critiques sont présents
          const criticalUsers = [
            "0x1FF70C1DFc33F5DDdD1AD2b525a07b172182d8eF",
            "0xec0cf7505c86e0ea33a2f2de4660e6a06abe92dd"
          ];
          
          // Fusionner avec les utilisateurs critiques
          const allUsers = [...new Set([...users, ...criticalUsers])];
          
          setKnownUsers(allUsers);
          console.log('Utilisateurs chargés depuis localStorage:', allUsers);
          
          // Mettre à jour localStorage si nécessaire
          if (allUsers.length !== users.length) {
            localStorage.setItem('knownUsers', JSON.stringify(allUsers));
            console.log('localStorage mis à jour avec tous les utilisateurs critiques');
          }
          return;
        }
      }
      
      // Si localStorage est vide ou invalide, utiliser les mêmes valeurs par défaut qu'AdminDashboard
      console.log('localStorage vide, initialisation avec utilisateurs par défaut');
      const defaultUsers = [
        "0x1FF70C1DFc33F5DDdD1AD2b525a07b172182d8eF",
        "0xec0cf7505c86e0ea33a2f2de4660e6a06abe92dd"  // ← Adresse qui a les stakes actifs
      ];
      setKnownUsers(defaultUsers);
      localStorage.setItem('knownUsers', JSON.stringify(defaultUsers));
      console.log('Utilisateurs par défaut sauvegardés:', defaultUsers);
      
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs connus:', error);
      // Fallback vers les utilisateurs par défaut (même logique qu'AdminDashboard)
      const defaultUsers = [
        "0x1FF70C1DFc33F5DDdD1AD2b525a07b172182d8eF",
        "0xec0cf7505c86e0ea33a2f2de4660e6a06abe92dd"  // ← Adresse qui a les stakes actifs
      ];
      setKnownUsers(defaultUsers);
      // Forcer la sauvegarde même en cas d'erreur
      try {
        localStorage.setItem('knownUsers', JSON.stringify(defaultUsers));
      } catch (saveError) {
        console.error('Impossible de sauvegarder dans localStorage:', saveError);
      }
    }
  };

  // Fonction pour écouter les changements du localStorage (synchronisation en temps réel)
  const syncWithLocalStorage = () => {
    const handleStorageChange = (e) => {
      if (e.key === 'knownUsers' && e.newValue) {
        try {
          const users = JSON.parse(e.newValue);
          if (Array.isArray(users)) {
            console.log('Synchronisation détectée, mise à jour des utilisateurs:', users);
            setKnownUsers(users);
          }
        } catch (error) {
          console.error('Erreur lors de la synchronisation:', error);
        }
      }
    };

    // Écouter les changements du localStorage depuis d'autres onglets/pages
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  };

  // Fonction pour calculer le montant total investi sur un plan
  const getTotalInvestedForPlan = async (planId: number, contract: any) => {
    try {
      let totalInvested = 0;
      
      // Pour chaque investisseur connu, calculer le total de ses stakes actifs sur ce plan
      for (const investorAddress of knownUsers) {
        try {
          const investorStakes = await contract.getUserStakes(investorAddress);
          
          if (investorStakes && investorStakes.length > 0) {
            // Calculer la somme des montants pour ce plan
            investorStakes.forEach((stake, index) => {
              const stakePlanId = stake.planId !== undefined ? Number(stake.planId) : 
                                 stake[0] !== undefined ? Number(stake[0]) : 0;
              const stakeActive = stake.active !== undefined ? Boolean(stake.active) : 
                                 stake[6] !== undefined ? Boolean(stake[6]) : true;
              const stakeAmount = stake.amount !== undefined ? stake.amount : 
                                 stake[1] !== undefined ? stake[1] : 0;
              
              if (stakePlanId === planId && stakeActive) {
                // Convertir le montant de wei vers USDT/USDC
                const amount = parseFloat(ethers.formatUnits(stakeAmount, 18));
                totalInvested += amount;
              }
            });
          }
        } catch (investorError) {
          console.error(`Erreur pour ${investorAddress}:`, investorError);
        }
      }
      
      return totalInvested;
      
    } catch (error) {
      console.error(`Erreur lors du calcul du total investi pour le plan ${planId}:`, error);
      return 0;
    }
  };

  // Fonction pour compter les utilisateurs actifs d'un plan (basée sur AdminDashboard)
  const getActiveUsersForPlan = async (planId: number, contract: any) => {
    try {
      let activeUsersCount = 0;
      
      // Pour chaque investisseur connu, vérifier s'il a des stakes actifs sur ce plan
      for (const investorAddress of knownUsers) {
        try {
          const investorStakes = await contract.getUserStakes(investorAddress);
          
          if (investorStakes && investorStakes.length > 0) {
            // Vérifier si cet investisseur a au moins un stake actif sur ce plan
            const hasActiveStakeOnPlan = investorStakes.some((stake, index) => {
              const stakePlanId = stake.planId !== undefined ? Number(stake.planId) : 
                                 stake[0] !== undefined ? Number(stake[0]) : 0;
              const stakeActive = stake.active !== undefined ? Boolean(stake.active) : 
                                 stake[6] !== undefined ? Boolean(stake[6]) : true;
              
              return stakePlanId === planId && stakeActive;
            });
            
            if (hasActiveStakeOnPlan) {
              activeUsersCount++;
            }
          }
        } catch (investorError) {
          console.error(`Erreur pour ${investorAddress}:`, investorError);
        }
      }
      
      return activeUsersCount;
      
    } catch (error) {
      console.error(`Erreur lors du comptage des utilisateurs pour le plan ${planId}:`, error);
      return 0;
    }
  };

  // Charger les plans depuis le contrat (avec la même logique que AdminDashboard)
  const loadPlans = async () => {
    try {
      setLoading(true);
      
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          '0x719fd9F511DDc561D03801161742D84ECb9445e9',
          [
            "function plans(uint256) external view returns (uint256 apr, uint256 duration, uint256 minAmount, bool active)",
            "function getUserStakes(address _user) external view returns (tuple(uint256 planId, uint256 amount, uint256 startTime, uint256 endTime, uint256 lastRewardTime, address token, bool active)[])"
          ],
          provider
        );
        
        // Récupérer tous les plans (similaire à AdminDashboard)
        const plansData = [];
        let consecutiveErrors = 0;
        const MAX_PLANS = 20;
        
        for (let planId = 0; planId < MAX_PLANS; planId++) {
          try {
            const plan = await contract.plans(planId);
            
            // Vérifier si le plan existe (comme dans AdminDashboard)
            if (Number(plan.apr) === 0 && Number(plan.duration) === 0 && Number(plan.minAmount) === 0) {
              consecutiveErrors++;
              if (consecutiveErrors >= 3) {
                console.log(`Arrêt après ${consecutiveErrors} plans vides consécutifs`);
                break;
              }
              continue;
            }
            
            consecutiveErrors = 0;
            
            // Compter les utilisateurs actifs et le total investi pour ce plan
            const activeUsersCount = await getActiveUsersForPlan(planId, contract);
            const totalInvested = await getTotalInvestedForPlan(planId, contract);
            
            plansData.push({
              id: planId,
              apr: Number(plan.apr) / 100, // ← Diviser par 100 pour convertir en pourcentage réel
              duration: Number(plan.duration),
              minAmount: Number(ethers.formatUnits(plan.minAmount, 18)),
              active: plan.active,
              activeUsersCount,
              totalInvested // ← Nouveau champ
            });
            
            console.log(`Plan ${planId}: ${activeUsersCount} utilisateurs actifs, ${totalInvested.toFixed(2)} USDT investis`);
            
          } catch (error) {
            consecutiveErrors++;
            console.log(`Erreur plan ${planId}:`, error.message);
            if (consecutiveErrors >= 3) {
              console.log(`Arrêt après ${consecutiveErrors} erreurs consécutives`);
              break;
            }
          }
        }
        
        console.log(`${plansData.length} plans chargés avec succès`);
        setPlans(plansData);
      } else {
        throw new Error('MetaMask n\'est pas installé');
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des plans:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les plans',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau plan
  const createPlan = async () => {
    try {
      setCreating(true);
      
      const { apr, duration, minAmount } = planForm;
      
      if (!apr || !duration || !minAmount) {
        toast({
          title: 'Erreur',
          description: 'Tous les champs sont requis',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          '0x719fd9F511DDc561D03801161742D84ECb9445e9',
          [
            "function createPlan(uint256 _apr, uint256 _duration, uint256 _minAmount) external"
          ],
          signer
        );
        
        const minAmountWei = ethers.parseUnits(minAmount, 18); // ← Changé de 6 à 18 décimales
        const tx = await contract.createPlan(
          Number(apr) * 100, // ← Multiplier par 100 pour envoyer au contrat
          Number(duration),
          minAmountWei
        );
        
        await tx.wait();
        await loadPlans(); // Recharger les plans
      }

      toast({
        title: 'Succès',
        description: 'Plan créé avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Réinitialiser le formulaire
      setPlanForm({ apr: '', duration: '', minAmount: '' });
      onClose();
      
    } catch (error) {
      console.error('Erreur lors de la création du plan:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le plan',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  // Activer/désactiver un plan
  const togglePlan = async (planId: number) => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          '0x719fd9F511DDc561D03801161742D84ECb9445e9',
          [
            "function togglePlan(uint256 _planId) external"
          ],
          signer
        );
        
        const tx = await contract.togglePlan(planId);
        await tx.wait();
        await loadPlans();
      }

      toast({
        title: 'Succès',
        description: 'Statut du plan mis à jour',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du plan:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le plan',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Statistiques des plans
  const planStats = {
    totalPlans: plans.length,
    activePlans: plans.filter(p => p.active).length,
    totalActiveUsers: plans.reduce((sum, plan) => sum + (plan.activeUsersCount || 0), 0),
    totalInvested: plans.reduce((sum, plan) => sum + (plan.totalInvested || 0), 0), // ← Nouveau
    avgAPR: plans.length > 0 ? plans.reduce((sum, plan) => sum + plan.apr, 0) / plans.length : 0
  };

  useEffect(() => {
    loadKnownUsers(); // Maintenant async
  }, []);

  useEffect(() => {
    if (knownUsers.length > 0) {
      console.log('Chargement des plans avec', knownUsers.length, 'utilisateurs connus');
      loadPlans();
    } else {
      console.log('Aucun utilisateur connu, attente...');
    }
  }, [knownUsers]);

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" color="blue.500" />
        <Text mt={4}>Chargement des plans...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* En-tête */}
        <HStack justify="space-between" align="center">
          <Heading size="lg" color="blue.600">
            📋 Gestion des Plans d'Investissement
          </Heading>
          <Button
            colorScheme="blue"
            onClick={onOpen}
            leftIcon={<span>➕</span>}
          >
            Créer un Plan
          </Button>
        </HStack>

        {/* Statistiques */}
        <Grid templateColumns="repeat(5, 1fr)" gap={4}>
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Plans</StatLabel>
                  <StatNumber>{planStats.totalPlans}</StatNumber>
                  <StatHelpText>{planStats.activePlans} actifs</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Plans Actifs</StatLabel>
                  <StatNumber color="green.500">{planStats.activePlans}</StatNumber>
                  <StatHelpText>Sur {planStats.totalPlans} total</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Utilisateurs Actifs</StatLabel>
                  <StatNumber color="blue.500">{planStats.totalActiveUsers}</StatNumber>
                  <StatHelpText>Investissements en cours</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Investi</StatLabel>
                  <StatNumber color="purple.500">{planStats.totalInvested.toFixed(2)} USDT</StatNumber>
                  <StatHelpText>Tous plans actifs</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>APR Moyen</StatLabel>
                  <StatNumber>{planStats.avgAPR.toFixed(1)}%</StatNumber>
                  <StatHelpText>Tous plans confondus</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Table des plans */}
        <Card>
          <CardHeader>
            <Heading size="md">Liste des Plans</Heading>
          </CardHeader>
          <CardBody>
            {plans.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                Aucun plan d'investissement n'a été créé.
              </Alert>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>APR</Th>
                    <Th>Durée</Th>
                    <Th>Montant Min</Th>
                    <Th>Utilisateurs Actifs</Th>
                    <Th>Statut</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {plans.map((plan) => (
                    <Tr key={plan.id}>
                      <Td fontWeight="bold">#{plan.id}</Td>
                      <Td>
                        <Badge colorScheme="green" fontSize="sm">
                          {plan.apr}%
                        </Badge>
                      </Td>
                      <Td>{plan.duration} jours</Td>
                      <Td>{plan.minAmount.toLocaleString()} USDT</Td>
                      <Td>
                        <HStack>
                          <Text fontWeight="bold" color="blue.500">
                            {plan.activeUsersCount || 0}
                          </Text>
                          <Text color="gray.500" fontSize="sm">
                            {plan.activeUsersCount === 1 ? "utilisateur" : "utilisateurs"}
                          </Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={plan.active ? "green" : "red"}
                          variant="solid"
                        >
                          {plan.active ? "Actif" : "Inactif"}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack>
                          <Switch
                            isChecked={plan.active}
                            onChange={() => togglePlan(plan.id)}
                            colorScheme="green"
                            size="md"
                          />
                          <Text fontSize="sm" color="gray.500">
                            {plan.active ? "Désactiver" : "Activer"}
                          </Text>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Modal de création de plan */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Créer un Nouveau Plan</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>APR (%)</FormLabel>
                  <Input
                    type="number"
                    value={planForm.apr}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, apr: e.target.value }))}
                    placeholder="Ex: 15"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Durée (jours)</FormLabel>
                  <Input
                    type="number"
                    value={planForm.duration}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="Ex: 90"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Montant Minimum (USDT)</FormLabel>
                  <Input
                    type="number"
                    value={planForm.minAmount}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, minAmount: e.target.value }))}
                    placeholder="Ex: 1000"
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Annuler
              </Button>
              <Button
                colorScheme="blue"
                onClick={createPlan}
                isLoading={creating}
                loadingText="Création..."
              >
                Créer le Plan
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default PlansManagement;