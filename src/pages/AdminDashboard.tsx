import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Text,
  Button,
  Flex,
  Icon,
  Alert,
  AlertIcon,
  Input,
} from '@chakra-ui/react';
import { useInvestment } from '../contexts/InvestmentContext';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Settings, RefreshCw, PlusCircle } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

interface PlatformStats {
  totalInvested: string;
  totalUsers: string;
  totalFees: string;
  contractBalance: string;
}

interface StakeInfo {
  planId: number;
  amount: string;
  startTime: Date;
  endTime: Date;
  lastRewardTime: Date;
  token: string;
  active: boolean;
  userAddress?: string;
}

const AdminDashboard = () => {
  const { stakingContract, plans } = useInvestment();
  const { address } = useWallet();
  const [stats, setStats] = useState<PlatformStats>({
    totalInvested: '0',
    totalUsers: '0',
    totalFees: '0',
    contractBalance: '0',
  });
  const [stakes, setStakes] = useState<StakeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwnerView, setIsOwnerView] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [knownUsers, setKnownUsers] = useState<string[]>([]);
  
  const navigate = useNavigate();
  const bgColor = 'transparent'; // Utiliser une couleur de fond transparente
  const bgColorCard = useColorModeValue('white', 'gray.800'); // Couleur de fond pour le thème clair/sombre
  const textColor = useColorModeValue('gray.600', 'gray.200');

  const BNB_PRICE_USDC = 670; // Prix approximatif BNB en USDC

  // Fonction pour formater le montant BNB du contrat avec sa valeur en USDC
  const formatBNBWithUSDC = (bnbAmount: string): string => {
  const bnb = parseFloat(bnbAmount);
  const usdcValue = bnb * BNB_PRICE_USDC;
  return `${bnb.toFixed(4)} BNB ($${usdcValue.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })})`;
};

// Ajouter cette fonction pour récupérer le solde USDC
const getUSDCBalance = async () => {
  try {
    if (stakingContract) {
      const usdcAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"; // USDC BSC
      const usdcABI = ["function balanceOf(address) view returns (uint256)"];
      const provider = stakingContract.runner?.provider || new ethers.BrowserProvider(window.ethereum);
      const usdcContract = new ethers.Contract(usdcAddress, usdcABI, provider);
      
      const balance = await usdcContract.balanceOf(stakingContract.target);
      const balanceFormatted = parseFloat(ethers.formatUnits(balance, 18)).toFixed(2);
      
      console.log('Solde USDC du contrat:', balanceFormatted);
      
      setStats(prev => ({
        ...prev,
        contractBalance: `${balanceFormatted} USDC`
      }));
    }
  } catch (error) {
    console.error('Erreur récupération solde USDC:', error);
  }
};

  // Fonction pour récupérer les adresses des investisseurs via l'API BSCScan
  const fetchInvestorsFromBSCScan = async () => {
    try {
      // Récupérer la clé API depuis les variables d'environnement
      const apiKey = import.meta.env.VITE_BSCSCAN_API_KEY;
      
      // Adresse de votre contrat - assurez-vous de la définir correctement
      const contractAddress = stakingContract?.address || '0x...';
      
      // URL pour récupérer les transactions internes du contrat
      const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        // Filtrer les transactions qui correspondent à la méthode "stake"
        // La signature de la méthode "stake" serait le hash Keccak-256 des 4 premiers octets de "stake(uint256,uint256,address)"
        const stakeMethodSignature = '0x8a19c8bc'; // Exemple, à ajuster selon la signature réelle de votre méthode
        
        const investorAddresses = data.result
          .filter(tx => tx.input.startsWith(stakeMethodSignature))
          .map(tx => tx.from.toLowerCase());
        
        // Éliminer les doublons
        const uniqueAddresses = [...new Set(investorAddresses)];
        console.log('Adresses d\'investisseurs trouvées:', uniqueAddresses);
        
        return uniqueAddresses;
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des investisseurs via BSCScan:', error);
      return [];
    }
  };

  // Vérifier si l'utilisateur connecté est le propriétaire du contrat
  useEffect(() => {
    const checkOwner = async () => {
      if (stakingContract && address) {
        try {
          const ownerAddress = await stakingContract.owner();
          const isOwner = address.toLowerCase() === ownerAddress.toLowerCase();
          setIsAdmin(isOwner);
          console.log('Statut d\'administrateur:', isOwner);
          
          // Si c'est le propriétaire, charger les utilisateurs connus
          if (isOwner) {
            loadKnownUsers();
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du propriétaire:', error);
        }
      }
    };
    
    checkOwner();
  }, [stakingContract, address]);

  // Charger les utilisateurs connus depuis localStorage
  const loadKnownUsers = () => {
    try {
      const savedUsers = localStorage.getItem('knownUsers');
      if (savedUsers) {
        const users = JSON.parse(savedUsers);
        setKnownUsers(Array.isArray(users) ? users : []);
      } else {
        // Initialiser avec l'adresse actuelle
        const initialUsers = address ? [address] : [];
        setKnownUsers(initialUsers);
        localStorage.setItem('knownUsers', JSON.stringify(initialUsers));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs connus:', error);
    }
  };

  // Ajouter une nouvelle adresse à la liste des utilisateurs connus
  const addNewAddress = () => {
    if (!ethers.isAddress(newAddress)) {
      alert('Adresse Ethereum invalide');
      return;
    }
    
    if (knownUsers.includes(newAddress)) {
      alert('Cette adresse est déjà dans la liste');
      return;
    }
    
    const updatedUsers = [...knownUsers, newAddress];
    setKnownUsers(updatedUsers);
    localStorage.setItem('knownUsers', JSON.stringify(updatedUsers));
    setNewAddress('');
    
    // Recharger les données avec la nouvelle adresse
    loadPlatformStats();
  };

  // Fonction pour charger les statistiques et les investissements
  const loadPlatformStats = async () => {
    setLoading(true);
    setError(null);
  
    try {
      // Essayer de récupérer les données du contrat si disponible
      if (stakingContract) {
        console.log('Tentative d\'appel aux méthodes du contrat...');
        
        // Vérifier si l'utilisateur actuel est le propriétaire du contrat
        let isOwner = false;
        try {
          const ownerAddress = await stakingContract.owner();
          isOwner = address && ownerAddress && address.toLowerCase() === ownerAddress.toLowerCase();
          console.log('Adresse du propriétaire:', ownerAddress);
          console.log('Adresse connectée:', address);
          console.log('Est propriétaire:', isOwner);
        } catch (ownerError) {
          console.error('Erreur lors de la vérification du propriétaire:', ownerError);
        }
        
        try {
          // Utiliser Promise.allSettled pour ne pas échouer si une promesse est rejetée
          const results = await Promise.allSettled([
            stakingContract.getTotalInvested(),
            stakingContract.getUserCount(),
            stakingContract.getTotalFees(),
          ]);
          
          console.log('Résultats des appels au contrat:', results);
          
          // Traiter les résultats individuellement
          if (results[0].status === 'fulfilled') {
            console.log('Valeur brute totalInvested:', results[0].value.toString());
            setStats(prev => ({
              ...prev,
              totalInvested: ethers.formatUnits(results[0].value, 18)
            }));
          }
          
          if (results[1].status === 'fulfilled') {
            console.log('Valeur brute userCount:', results[1].value.toString());
            setStats(prev => ({
              ...prev,
              totalUsers: results[1].value.toString()
            }));
          }
          
          if (results[2].status === 'fulfilled') {
            console.log('Valeur brute totalFees:', results[2].value.toString());
            setStats(prev => ({
              ...prev,
              totalFees: ethers.formatUnits(results[2].value, 18)
            }));
          }
        } catch (contractError) {
          console.error("Erreur lors de l'appel au contrat pour les statistiques:", contractError);
        }
        
          try {
  if (stakingContract && stakingContract.target) {
    console.log('🔍 Debug solde contrat:');
    await getUSDCBalance();
  }
} catch (error) {
  console.error('❌ Erreur récupération solde contrat:', error);
}

        // Récupérer les investissements - traiter dans un bloc try/catch séparé
        try {
          let allStakes = [];
          
          if (isOwner) {
            // Si c'est le propriétaire, récupérer les adresses des investisseurs
            console.log("Récupération des investissements pour tous les utilisateurs (mode admin)");
            
            // Liste des adresses connues pour avoir investi
            const knownInvestors = [
              "0x1FF70C1DFc33F5DDdD1AD2b525a07b172182d8eF",  // L'adresse du propriétaire
              "0xec0cf7505c86e0ea33a2f2de4660e6a06abe92dd"   // Une autre adresse connue
              // Ajoutez d'autres adresses ici
            ];
            
            // Récupérer les investissements pour chaque adresse connue
            for (const investorAddress of knownInvestors) {
              try {
                console.log(`Récupération directe des stakes pour ${investorAddress}`);
                const investorStakes = await stakingContract.getUserStakes(investorAddress);
                console.log(`${investorAddress} stake results:`, investorStakes);
                
                if (investorStakes && investorStakes.length > 0) {
                  // Ajouter l'adresse de l'investisseur à chaque stake
                  for (let i = 0; i < investorStakes.length; i++) {
                    const stakeWithAddress = {
                      ...investorStakes[i],
                      userAddress: investorAddress // Ajouter l'adresse
                    };
                    allStakes.push(stakeWithAddress);
                  }
                  console.log(`${investorStakes.length} stakes trouvés pour ${investorAddress}`);
                }
              } catch (investorError) {
                console.error(`Erreur pour ${investorAddress}:`, investorError);
              }
            }
            
            console.log(`Total de ${allStakes.length} stakes récupérés pour tous les investisseurs connus`);
          } else {
            // Récupérer uniquement les investissements de l'utilisateur connecté
            const currentAddress = address || "0x1FF70C1DFc33F5DDdD1AD2b525a07b172182d8eF";
            
            console.log('Tentative de récupération des investissements pour:', currentAddress);
            const userStakes = await stakingContract.getUserStakes(currentAddress);
            console.log('Investissements récupérés du contrat (brut):', userStakes);
            
            if (userStakes && userStakes.length > 0) {
              allStakes = userStakes;
            }
          }
          
          // Formater tous les stakes récupérés
          if (allStakes.length > 0) {
            console.log('Nombre d\'investissements trouvés:', allStakes.length);
            console.log('Investissements bruts:', allStakes);
            
            // Formater les stakes sans conditions de filtrage
            const formattedStakes = [];
            
            for (let i = 0; i < allStakes.length; i++) {
              const stake = allStakes[i];
              console.log(`Formatage du stake ${i}:`, stake);
              
              try {
                // Détecter et manipuler différentes structures possibles
                const planId = stake.planId !== undefined ? Number(stake.planId) : 
                              stake[0] !== undefined ? Number(stake[0]) : 0;
                              
                const amount = stake.amount !== undefined ? stake.amount : 
                              stake[1] !== undefined ? stake[1] : 0;
                              
                const startTime = stake.startTime !== undefined ? Number(stake.startTime) : 
                                  stake[2] !== undefined ? Number(stake[2]) : Date.now()/1000 - 86400;
                                  
                const endTime = stake.endTime !== undefined ? Number(stake.endTime) : 
                                stake[3] !== undefined ? Number(stake[3]) : Date.now()/1000 + 86400*30;
                                
                const lastRewardTime = stake.lastRewardTime !== undefined ? Number(stake.lastRewardTime) : 
                                      stake[4] !== undefined ? Number(stake[4]) : Date.now()/1000;
                                      
                const token = stake.token !== undefined ? stake.token : 
                              stake[5] !== undefined ? stake[5] : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
                              
                const active = stake.active !== undefined ? Boolean(stake.active) : 
                              stake[6] !== undefined ? Boolean(stake[6]) : true;
                
                // Récupérer l'adresse de l'utilisateur (si disponible)
                const userAddress = stake.userAddress || (isOwner ? undefined : address);
                
                // Formater le montant correctement
                let formattedAmount;
                try {
                  formattedAmount = ethers.formatUnits(amount, 18);
                  console.log(`Montant formaté: ${formattedAmount}`);
                } catch (amountError) {
                  console.error('Erreur de formatage du montant:', amountError);
                  formattedAmount = '0';
                }
                
                // Convertir l'adresse du token en symbole
                const tokenSymbol = token === "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" ? "USDC" : 
                                    token === "0x55d398326f99059fF775485246999027B3197955" ? "USDT" : 
                                    token && token.substring && token.length > 10 ? token.substring(0, 6) + "..." : "UNKNOWN";
                
                // Créer l'objet stake formaté
                const formattedStake = {
                  planId,
                  amount: formattedAmount,
                  startTime: new Date(startTime * 1000),
                  endTime: new Date(endTime * 1000),
                  lastRewardTime: new Date(lastRewardTime * 1000),
                  token: tokenSymbol,
                  active,
                  userAddress
                };
                
                formattedStakes.push(formattedStake);
                console.log('Stake formaté ajouté:', formattedStake);
              } catch (formatError) {
                console.error(`Erreur lors du formatage du stake ${i}:`, formatError);
              }
            }
            
            console.log('Nombre de stakes formatés:', formattedStakes.length);
            console.log('Stakes formatés final:', formattedStakes);
            setStakes(formattedStakes);
            setIsOwnerView(isOwner); // Sauvegarder l'état du propriétaire pour l'interface
          } else {
            console.log('Aucun investissement trouvé');
          }
        } catch (stakesError) {
          console.error('Erreur lors de la récupération des investissements:', stakesError);
        }
      } else {
        console.log('stakingContract non disponible, impossible d\'appeler les méthodes du contrat');
        setError('Contract non disponible. Veuillez vous connecter à votre portefeuille.');
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      setError(`Erreur générale: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage et quand les dépendances changent
  useEffect(() => {
    loadPlatformStats();
  }, [stakingContract, address, isAdmin, knownUsers.length]);

  // Effet pour récupérer les investisseurs via BSCScan quand l'admin est connecté
  useEffect(() => {
    if (isAdmin) {
      const loadInvestors = async () => {
        try {
          const investors = await fetchInvestorsFromBSCScan();
          // Vous pouvez faire quelque chose avec les investisseurs ici
          console.log('Investisseurs récupérés via BSCScan:', investors);
        } catch (error) {
          console.error('Erreur lors du chargement des investisseurs:', error);
        }
      };
      
      loadInvestors();
    }
  }, [isAdmin]);

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading color= "green.600">Tableau de bord {isAdmin ? 'administrateur' : 'utilisateur'}</Heading>
        <Flex gap={2}>
          <Button
            leftIcon={<Icon as={RefreshCw} />}
            colorScheme="teal"
            onClick={loadPlatformStats}
            isLoading={loading}
          >
            Actualiser
          </Button>
          <Button
            leftIcon={<Icon as={Settings} />}
            colorScheme="blue"
            onClick={() => navigate('/strategy-management')}
          >
            Gestion des Stratégies
          </Button>
        </Flex>
      </Flex>
      
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Card bg={bgColorCard}>
          <CardBody>
            <Stat>
              <StatLabel color={textColor}>Total investi</StatLabel>
              <StatNumber>{stats.totalInvested} USDC</StatNumber>
              <StatHelpText>Montant total des investissements</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={bgColorCard}>
          <CardBody>
            <Stat>
              <StatLabel color={textColor}>Nombre d'utilisateurs</StatLabel>
              <StatNumber>{stats.totalUsers}</StatNumber>
              <StatHelpText>Utilisateurs uniques</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={bgColorCard}>
          <CardBody>
            <Stat>
              <StatLabel color={textColor}>Solde du Contrat (USDC)</StatLabel>
              <StatNumber>{stats.contractBalance}</StatNumber>
              <StatHelpText>Liquidités disponibles</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={bgColorCard}>
          <CardBody>
            <Stat>
              <StatLabel color={textColor}>Frais de plateforme</StatLabel>
              <StatNumber>{stats.totalFees} USDC</StatNumber>
              <StatHelpText>Total des frais collectés</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Formulaire d'ajout d'adresse pour l'administrateur */}
      {isAdmin && (
        <Card bg={bgColorCard} mb={4}>
          <CardBody>
            <Heading size="md" mb={4}>Ajouter une adresse à surveiller</Heading>
            <Flex gap={2}>
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Adresse Ethereum"
                bg="slate.700"
                color="white"
              />
              <Button
                colorScheme="blue"
                onClick={addNewAddress}
                leftIcon={<Icon as={PlusCircle} />}
              >
                Ajouter
              </Button>
            </Flex>
            
            {knownUsers.length > 0 && (
              <Box mt={4}>
                <Text fontWeight="bold" mb={2}>Adresses surveillées ({knownUsers.length}):</Text>
                <SimpleGrid columns={{base: 1, md: 2}} spacing={2}>
                  {knownUsers.map((user, index) => (
                    <Text key={index} fontSize="sm">
                      {user.substring(0, 10)}...{user.substring(user.length - 8)}
                    </Text>
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tableau des investissements */}
      <Card bg={bgColorCard} mb={8}>
        <CardBody>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">Investissements actifs</Heading>
            <Text>{stakes.length} investissement(s) trouvé(s)</Text>
          </Flex>
          
          {loading ? (
            <Text>Chargement des données...</Text>
          ) : stakes.length > 0 ? (
            <Table variant="simple">
              <Thead>
                <Tr>
                  {isOwnerView && <Th>Utilisateur</Th>}
                  <Th>Plan</Th>
                  <Th>Montant</Th>
                  <Th>Date de début</Th>
                  <Th>Date de fin</Th>
                  <Th>Token</Th>
                  <Th>Statut</Th>
                </Tr>
              </Thead>
              <Tbody>
                {stakes.map((stake, index) => {
                  const plan = plans ? plans.find(p => p.id === stake.planId) : null;
                  return (
                    <Tr key={index}>
                      {isOwnerView && (
                        <Td>
                          {stake.userAddress ? 
                            `${stake.userAddress.substring(0, 6)}...${stake.userAddress.substring(stake.userAddress.length - 4)}` : 
                            'N/A'}
                        </Td>
                      )}
                      <Td>Plan {plan ? plan.name : stake.planId}</Td>
                      <Td>{stake.amount} {stake.token}</Td>
                      <Td>{stake.startTime.toLocaleDateString()}</Td>
                      <Td>{stake.endTime.toLocaleDateString()}</Td>
                      <Td>{stake.token}</Td>
                      <Td>{stake.active ? "Actif" : "Terminé"}</Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          ) : (
            <Text>Aucun investissement actif trouvé</Text>
          )}
        </CardBody>
      </Card>
      
      <Card bg={bgColorCard}>
        <CardBody>
          <Heading size="md" mb={4}>Actions rapides</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Button
              leftIcon={<Icon as={ArrowUpRight} />}
              colorScheme="green"
              onClick={() => navigate('/strategy-management')}
              size="lg"
            >
              Gérer les stratégies d'investissement
            </Button>
            <Button
              leftIcon={<Icon as={Settings} />}
              colorScheme="purple"
              onClick={() => navigate('/admin/settings')}
              size="lg"
            >
              Paramètres de la plateforme
            </Button>
          </SimpleGrid>
        </CardBody>
      </Card>
    </Box>
  );
};

export default AdminDashboard;