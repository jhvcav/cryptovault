import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
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
  VStack,
  Badge,
} from '@chakra-ui/react';
import { useInvestment } from '../contexts/InvestmentContext';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Settings, RefreshCw, PlusCircle, Copy, Check } from 'lucide-react';
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
  withdrawnAmount?: string;
  totalWithdrawn?: string;
  availableRewards?: string;
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
  const [statusFilter, setStatusFilter] = useState('active'); // 'all', 'active', 'completed'
  const [copiedAddress, setCopiedAddress] = useState(null);
  
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

// Fonction pour récupérer les données de retrait via les événements
const getWithdrawalDataFromEvents = async (userAddress: string, stakeIndex: number) => {
  try {
    if (!stakingContract) return { withdrawnAmount: '0', totalWithdrawn: '0' };

    const API_KEY = import.meta.env.VITE_BSCSCAN_API_KEY;
    if (!API_KEY) {
      console.error('Clé API BSCScan non configurée');
      return { withdrawnAmount: '0', totalWithdrawn: '0' };
    }

    const contractAddress = stakingContract.target || stakingContract.address;
    console.log('🔍 Debug retraits pour:', userAddress, 'stakeIndex:', stakeIndex);
    console.log('🔍 Adresse contrat:', contractAddress);
    
    // Générer les topics correctement
    const rewardsEventTopic = ethers.id('RewardsClaimed(address,uint256,uint256,address)');
    const stakeEndEventTopic = ethers.id('StakeEnded(address,uint256,uint256,address)');
    const userTopic = ethers.zeroPadValue(userAddress, 32);
    
    console.log('🔍 Topics générés:');
    console.log('  - RewardsClaimed:', rewardsEventTopic);
    console.log('  - StakeEnded:', stakeEndEventTopic);
    console.log('  - User topic:', userTopic);
    
    // URLs avec debug
    const rewardsUrl = `https://api.bscscan.com/api?module=logs&action=getLogs&address=${contractAddress}&topic0=${rewardsEventTopic}&topic1=${userTopic}&fromBlock=0&toBlock=latest&apikey=${API_KEY}`;
    const endsUrl = `https://api.bscscan.com/api?module=logs&action=getLogs&address=${contractAddress}&topic0=${stakeEndEventTopic}&topic1=${userTopic}&fromBlock=0&toBlock=latest&apikey=${API_KEY}`;

    console.log('🔍 URLs API:');
    console.log('  - Rewards:', rewardsUrl);
    console.log('  - Ends:', endsUrl);

    const [rewardsResponse, endsResponse] = await Promise.all([
      fetch(rewardsUrl),
      fetch(endsUrl)
    ]);

    const rewardsData = await rewardsResponse.json();
    const endsData = await endsResponse.json();

    console.log('🔍 Réponses API:');
    console.log('  - Rewards status:', rewardsData.status, 'count:', rewardsData.result?.length || 0);
    console.log('  - Ends status:', endsData.status, 'count:', endsData.result?.length || 0);

    if (rewardsData.status !== '1') {
      console.log('❌ Erreur rewards API:', rewardsData.message);
    }
    if (endsData.status !== '1') {
      console.log('❌ Erreur ends API:', endsData.message);
    }

    let totalWithdrawn = 0;
    let lastWithdrawn = 0;

    // Traiter les rewards claims
    if (rewardsData.status === '1' && rewardsData.result && rewardsData.result.length > 0) {
      console.log('🔍 Traitement de', rewardsData.result.length, 'rewards events');
      
      rewardsData.result.forEach((log, index) => {
        try {
          console.log(`🔍 Event reward ${index}:`, log);
          
          // Décoder les données du log
          const decodedData = ethers.AbiCoder.defaultAbiCoder().decode(
            ['uint256', 'uint256', 'address'], 
            log.data
          );
          
          const stakeId = parseInt(decodedData[0].toString());
          const amount = parseFloat(ethers.formatUnits(decodedData[1], 18));
          
          console.log(`  - StakeId: ${stakeId}, Amount: ${amount}, Cherché: ${stakeIndex}`);
          
          if (stakeId === stakeIndex) {
            totalWithdrawn += amount;
            lastWithdrawn = amount;
            console.log(`  ✅ Match! Total: ${totalWithdrawn}, Last: ${lastWithdrawn}`);
          }
        } catch (error) {
          console.error('❌ Erreur décodage reward:', error);
        }
      });
    } else {
      console.log('ℹ️ Aucun event rewards trouvé');
    }

    // Traiter les stake ends
    if (endsData.status === '1' && endsData.result && endsData.result.length > 0) {
      console.log('🔍 Traitement de', endsData.result.length, 'end events');
      
      endsData.result.forEach((log, index) => {
        try {
          console.log(`🔍 Event end ${index}:`, log);
          
          const decodedData = ethers.AbiCoder.defaultAbiCoder().decode(
            ['uint256', 'uint256', 'address'], 
            log.data
          );
          
          const stakeId = parseInt(decodedData[0].toString());
          const amount = parseFloat(ethers.formatUnits(decodedData[1], 18));
          
          console.log(`  - StakeId: ${stakeId}, Amount: ${amount}, Cherché: ${stakeIndex}`);
          
          if (stakeId === stakeIndex) {
            totalWithdrawn += amount;
            lastWithdrawn = amount;
            console.log(`  ✅ Match! Total: ${totalWithdrawn}, Last: ${lastWithdrawn}`);
          }
        } catch (error) {
          console.error('❌ Erreur décodage end:', error);
        }
      });
    } else {
      console.log('ℹ️ Aucun event ends trouvé');
    }

    const result = {
      withdrawnAmount: lastWithdrawn.toFixed(4),
      totalWithdrawn: totalWithdrawn.toFixed(4)
    };

    console.log('🎯 Résultat final:', result);
    return result;

  } catch (error) {
    console.error('❌ Erreur récupération retraits via events:', error);
    return {
      withdrawnAmount: '0',
      totalWithdrawn: '0'
    };
  }
};

const getFilteredStakes = () => {
  switch (statusFilter) {
    case 'active':
      return stakes.filter(stake => stake.active);
    case 'completed':
      return stakes.filter(stake => !stake.active);
    case 'all':
    default:
      return stakes;
  }
};

// Fonction pour copier l'adresse dans le presse-papiers
const copyToClipboard = async (address) => {
  try {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    
    // Remettre l'icône normale après 2 secondes
    setTimeout(() => {
      setCopiedAddress(null);
    }, 2000);
  } catch (error) {
    console.error('Erreur lors de la copie:', error);
    // Fallback pour les navigateurs plus anciens
    const textArea = document.createElement('textarea');
    textArea.value = address;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    setCopiedAddress(address);
    setTimeout(() => {
      setCopiedAddress(null);
    }, 2000);
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
    let knownInvestors = [
        "0x1FF70C1DFc33F5DDdD1AD2b525a07b172182d8eF",
        "0xec0cf7505c86e0ea33a2f2de4660e6a06abe92dd",
        "0xce1a17c4c2e1e2cc0586c451952a073a82fa2bf0"
    ];

    try {
        console.log('🔍 Recherche des investisseurs via événements BSCScan...');

        const API_KEY = import.meta.env.VITE_BSCSCAN_API_KEY;
        if (API_KEY && stakingContract) {
            const contractAddress = stakingContract.target || stakingContract.address;

            // Signature correcte de votre événement Staked
            const stakedEventTopic = ethers.id('Staked(address,uint256,uint256,uint256,uint256,address)');

            const url = `https://api.bscscan.com/api?module=logs&action=getLogs&address=${contractAddress}&topic0=${stakedEventTopic}&fromBlock=0&toBlock=latest&apikey=${API_KEY}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.status === '1' && data.result && data.result.length > 0) {
            console.log(`📊 ${data.result.length} événements Staked trouvés`);

            const eventAddresses = data.result.map(log => {
                try {
                const userAddress = ethers.AbiCoder.defaultAbiCoder().decode(['address'], log.topics[1])[0];
                return userAddress.toLowerCase();
                } catch (error) {
                return null;
                }
            }).filter(addr => addr !== null);

            const uniqueEventAddresses = [...new Set(eventAddresses)];
            console.log(`✅ ${uniqueEventAddresses.length} nouvelles adresses trouvées via événements`);

            // Ajouter les nouvelles adresses aux adresses connues
            knownInvestors = [...new Set([...knownInvestors, ...uniqueEventAddresses])];
            console.log(`🎯 Total: ${knownInvestors.length} adresses à tester`);
            } else {
            console.log('ℹ️ Aucun événement trouvé, utilisation des adresses hardcodées');
            }
        }
        } catch (eventError) {
        console.error('❌ Erreur récupération événements, utilisation des adresses hardcodées:', eventError);
        }
    
    // CORRECTION MAJEURE : Récupérer les investissements avec mapping correct
    for (const investorAddress of knownInvestors) {
      try {
        console.log(`📊 Récupération des stakes pour ${investorAddress}`);
        const investorStakes = await stakingContract.getUserStakes(investorAddress);
        console.log(`${investorAddress} stake results:`, investorStakes);
        
        if (investorStakes && investorStakes.length > 0) {
          // IMPORTANT : Ajouter chaque stake avec son index USER SPÉCIFIQUE
          for (let userStakeIndex = 0; userStakeIndex < investorStakes.length; userStakeIndex++) {
            const stakeWithAddress = {
              ...investorStakes[userStakeIndex],
              userAddress: investorAddress,
              userStakeIndex: userStakeIndex // ← INDEX SPÉCIFIQUE À L'UTILISATEUR
            };
            allStakes.push(stakeWithAddress);
            console.log(`✅ Ajouté stake ${userStakeIndex} pour ${investorAddress}`);
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
      // Ajouter l'index utilisateur à chaque stake
      for (let userStakeIndex = 0; userStakeIndex < userStakes.length; userStakeIndex++) {
        allStakes.push({
          ...userStakes[userStakeIndex],
          userAddress: currentAddress,
          userStakeIndex: userStakeIndex
        });
      }
    }
  }
  
  // SECTION FORMATAGE CORRIGÉE
  if (allStakes.length > 0) {
    console.log('Nombre d\'investissements trouvés:', allStakes.length);
    console.log('Investissements bruts:', allStakes);
    
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
        
        // Récupérer l'adresse de l'utilisateur et l'index spécifique
        const userAddress = stake.userAddress || (isOwner ? undefined : address);
        const userStakeIndex = stake.userStakeIndex !== undefined ? stake.userStakeIndex : 0;
        
        // CORRECTION MAJEURE : Utiliser l'index spécifique à l'utilisateur
        let withdrawalData = { withdrawnAmount: '0', totalWithdrawn: '0' };
        let availableRewards = '0';

        if (userAddress) {
          console.log(`🔍 Traitement du stake ${userStakeIndex} pour ${userAddress} (global index: ${i})`);
          
          // Récupérer l'historique des retraits avec l'index utilisateur correct
          withdrawalData = await getWithdrawalDataFromEvents(userAddress, userStakeIndex);
          
          // Calculer les récompenses disponibles avec l'index utilisateur correct
          try {
            console.log(`🎯 Tentative calculateRewards(${userAddress}, ${userStakeIndex})`);
            const rewards = await stakingContract.calculateRewards(userAddress, userStakeIndex);
            availableRewards = ethers.formatUnits(rewards, 18);
            console.log(`✅ Récompenses calculées: ${availableRewards} USDC`);
          } catch (rewardsError) {
            console.error(`❌ Erreur calcul récompenses pour ${userAddress}, userStakeIndex ${userStakeIndex}:`, rewardsError);
            
            // Diagnostic détaillé
            console.log(`🔍 Diagnostic pour ${userAddress}:`);
            console.log(`  - User Stake Index: ${userStakeIndex}`);
            console.log(`  - Global Index: ${i}`);
            console.log(`  - Stake actif: ${active}`);
            console.log(`  - StartTime: ${new Date(startTime * 1000)}`);
            console.log(`  - EndTime: ${new Date(endTime * 1000)}`);
            console.log(`  - PlanId: ${planId}`);
          }
        }

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
          userAddress,
          withdrawnAmount: withdrawalData.withdrawnAmount,
          totalWithdrawn: withdrawalData.totalWithdrawn,
          availableRewards: parseFloat(availableRewards).toFixed(4),
          userStakeIndex: userStakeIndex, // Index spécifique à l'utilisateur
          globalIndex: i // Index global pour debug
        };
        
        formattedStakes.push(formattedStake);
        console.log('✅ Stake formaté ajouté:', formattedStake);
      } catch (formatError) {
        console.error(`❌ Erreur lors du formatage du stake ${i}:`, formatError);
      }
    }
    
    console.log('✅ Nombre de stakes formatés:', formattedStakes.length);
    console.log('✅ Stakes formatés final:', formattedStakes);
    setStakes(formattedStakes);
    setIsOwnerView(isOwner);
  } else {
    console.log('ℹ️ Aucun investissement trouvé');
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
  <Box p={{ base: 4, md: 8 }} w="100%">  {/* ← Padding responsive, pas de minW */}
    
    {/* En-tête responsive */}
    <Flex 
      justify="space-between" 
      align="center" 
      mb={6}
      direction={{ base: "column", md: "row" }}  
      gap={4}
    >
      <Heading 
        color="green.600"
        size={{ base: "md", md: "lg" }}  
        textAlign={{ base: "center", md: "left" }}
      >
        Tableau de bord {isAdmin ? 'administrateur' : 'utilisateur'}
      </Heading>
      
      <Flex gap={2} flexWrap="wrap">  {/* ← Wrap sur mobile */}
        <Button
          leftIcon={<Icon as={RefreshCw} />}
          colorScheme="teal"
          onClick={loadPlatformStats}
          isLoading={loading}
          size={{ base: "sm", md: "md" }}  
        >
          Actualiser
        </Button>
        <Button
          leftIcon={<Icon as={Settings} />}
          colorScheme="blue"
          onClick={() => navigate('/strategy-management')}
          size={{ base: "sm", md: "md" }}
        >
          Gestion des Stratégies
        </Button>
      </Flex>
    </Flex>

    {/* Statistiques - responsive grid */}
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} mb={8}>  {/* ← Plus responsive */}
      <Card bg={bgColorCard}>
        <CardBody>
          <Stat>
            <StatLabel color={textColor} fontSize={{ base: "sm", md: "md" }}>Total investi</StatLabel>
            <StatNumber fontSize={{ base: "lg", md: "2xl" }}>{stats.totalInvested} USDC</StatNumber>
            <StatHelpText fontSize={{ base: "xs", md: "sm" }}>Montant total des investissements</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      {/* Somme Total des Récompenses en cours*/}
      <Card bg={bgColorCard}>
      <CardBody>
        <Stat>
          <StatLabel color={textColor} fontSize={{ base: "sm", md: "md" }}>Total récompenses en cours</StatLabel>
          <StatNumber fontSize={{ base: "lg", md: "2xl" }} color="orange.500">
            {stakes
              .filter(stake => stake.active)
              .reduce((total, stake) => {
                const rewards = parseFloat(stake.availableRewards || '0');
                return total + rewards;
              }, 0).toFixed(4)} USDC
          </StatNumber>
          <StatHelpText fontSize={{ base: "xs", md: "sm" }}>
            <StatArrow type="increase" />
            {stakes.filter(stake => stake.active && parseFloat(stake.availableRewards || '0') > 0).length} plans actifs avec récompenses
          </StatHelpText>
        </Stat>
      </CardBody>
    </Card>

    {/* Somme total des plans investits en cours*/}
    <Card bg={bgColorCard}>
  <CardBody>
    <Stat>
      <StatLabel color={textColor} fontSize={{ base: "sm", md: "md" }}>Total investi actif</StatLabel>
      <StatNumber fontSize={{ base: "lg", md: "2xl" }} color="blue.500">
        {stakes
          .filter(stake => stake.active)
          .reduce((total, stake) => {
            const amount = parseFloat(stake.amount || '0');
            return total + amount;
          }, 0).toFixed(2)} USDC
      </StatNumber>
      <StatHelpText fontSize={{ base: "xs", md: "sm" }}>
        <StatArrow type="increase" />
        {stakes.filter(stake => stake.active).length} investissements actifs en cours
      </StatHelpText>
    </Stat>
  </CardBody>
</Card>

    {/* Alerte solde contrat insuffisant contre solde des récompenses en cours */}
      <Card bg={bgColorCard}>
      <CardBody>
        <Stat>
          <StatLabel color={textColor} fontSize={{ base: "sm", md: "md" }}>Alerte Liquidité</StatLabel>
          <StatNumber 
            fontSize={{ base: "lg", md: "2xl" }} 
            color={(() => {
              const totalRewards = stakes
                .filter(stake => stake.active)
                .reduce((total, stake) => {
                  const rewards = parseFloat(stake.availableRewards || '0');
                  return total + rewards;
                }, 0);
          
              const contractBalance = parseFloat(stats.contractBalance.replace(' USDC', '') || '0');
          
              if (totalRewards <= contractBalance) return "green.500";
              return "red.500";
            })()}
            >
            {(() => {
              const totalRewards = stakes
                .filter(stake => stake.active)
                .reduce((total, stake) => {
                  const rewards = parseFloat(stake.availableRewards || '0');
                  return total + rewards;
                }, 0);
          
              const contractBalance = parseFloat(stats.contractBalance.replace(' USDC', '') || '0');
          
              if (totalRewards <= contractBalance) {
                return "✅ SÉCURISÉ";
              } else {
                return "⚠️ LIQUIDITÉ INSUFFISANTE";
              }
            })()}
          </StatNumber>
          <StatHelpText fontSize={{ base: "xs", md: "sm" }}>
            {(() => {
              const totalRewards = stakes
                .filter(stake => stake.active)
                .reduce((total, stake) => {
                  const rewards = parseFloat(stake.availableRewards || '0');
                  return total + rewards;
                }, 0);
          
              const contractBalance = parseFloat(stats.contractBalance.replace(' USDC', '') || '0');
              const gap = contractBalance - totalRewards;
          
              if (totalRewards <= contractBalance) {
                return (
                  <>
                    <StatArrow type="increase" />
                    Excédent de {gap.toFixed(2)} USDC
                  </>
                );
              } else {
                return (
                  <>
                    <StatArrow type="decrease" />
                    Déficit de {Math.abs(gap).toFixed(2)} USDC - Action requise !
                  </>
                );
              }
            })()}
          </StatHelpText>
        </Stat>
      </CardBody>
    </Card>
      {/* ... autres cards similaires ... */}
    </SimpleGrid>

    {/* Détail des liquidités - responsive */}
    <Card bg={bgColorCard} mb={4}>
      <CardBody>
        <Heading size={{ base: "sm", md: "md" }} mb={4} color="blue.600">
          💧 Détail des Liquidités
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>  {/* ← Stack sur mobile */}
          
          {/* Solde contrat */}
          <Box p={4} bg="blue.100" borderRadius="lg" textAlign="center">
            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.800" mb={1}>
              Solde Contrat
            </Text>
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="black">
              {stats.contractBalance}
            </Text>
          </Box>
          
          {/* Total gains disponibles */}
          <Box p={4} bg="orange.100" borderRadius="lg" textAlign="center">
            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.800" mb={1}>
              Gains Disponibles (Actifs)
            </Text>
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="orange.600">
              {stakes
                .filter(stake => stake.active)
                .reduce((total, stake) => {
                  const rewards = parseFloat(stake.availableRewards || '0');
                  return total + rewards;
                }, 0).toFixed(2)} USDC
            </Text>
            <Text fontSize={{ base: "2xs", md: "xs" }} color="gray.800">
              {stakes.filter(stake => stake.active && parseFloat(stake.availableRewards || '0') >= 0.4).length} prêts à retirer (≥0.4)
            </Text>
          </Box>
          
          {/* Marge de sécurité */}
          <Box 
            p={4} 
            bg={(() => {
              const totalAvailableRewards = stakes
                .filter(stake => stake.active)
                .reduce((total, stake) => {
                  const rewards = parseFloat(stake.availableRewards || '0');
                  return total + rewards;
                }, 0);
              
              const contractBalance = parseFloat(stats.contractBalance.replace(' USDC', '') || '0');
              const liquidityGap = contractBalance - totalAvailableRewards;
              
              if (liquidityGap > 10) return "green.200";
              if (liquidityGap > 2) return "purple.100";
              if (liquidityGap > 0) return "orange.100";
              return "red.200";
            })()} 
            borderRadius="lg" 
            textAlign="center"
          >
            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.800" mb={1}>
              Marge de Sécurité
            </Text>
            <Text 
              fontSize={{ base: "lg", md: "xl" }} 
              fontWeight="bold" 
              color={(() => {
                const totalAvailableRewards = stakes
                  .filter(stake => stake.active)
                  .reduce((total, stake) => {
                    const rewards = parseFloat(stake.availableRewards || '0');
                    return total + rewards;
                  }, 0);
                
                const contractBalance = parseFloat(stats.contractBalance.replace(' USDC', '') || '0');
                const liquidityGap = contractBalance - totalAvailableRewards;
                
                if (liquidityGap > 10) return "green.600";
                if (liquidityGap > 2) return "purple.600";
                if (liquidityGap > 0) return "orange.600";
                return "red.600";
              })()}
            >
              {(() => {
                const totalAvailableRewards = stakes
                  .filter(stake => stake.active)
                  .reduce((total, stake) => {
                    const rewards = parseFloat(stake.availableRewards || '0');
                    return total + rewards;
                  }, 0);
                
                const contractBalance = parseFloat(stats.contractBalance.replace(' USDC', '') || '0');
                const liquidityGap = contractBalance - totalAvailableRewards;
                
                return `${liquidityGap >= 0 ? '+' : ''}${liquidityGap.toFixed(2)} USDC`;
              })()}
            </Text>
            <Text fontSize={{ base: "2xs", md: "xs" }} color="gray.800">
              {(() => {
                const totalAvailableRewards = stakes
                  .filter(stake => stake.active)
                  .reduce((total, stake) => {
                    const rewards = parseFloat(stake.availableRewards || '0');
                    return total + rewards;
                  }, 0);
                
                const contractBalance = parseFloat(stats.contractBalance.replace(' USDC', '') || '0');
                const liquidityGap = contractBalance - totalAvailableRewards;
                
                if (liquidityGap > 10) return "Très sécurisé";
                if (liquidityGap > 2) return "Niveau acceptable";
                if (liquidityGap > 0) return "Attention requise";
                return "ACTION URGENTE !";
              })()}
            </Text>
          </Box>
        </SimpleGrid>
      </CardBody>
    </Card>

    {/* Tableau des investissements - responsive */}
<Card bg={bgColorCard} mb={8}>
  <CardBody>
    {/* En-tête du tableau responsive */}
    <Flex 
      justify="space-between" 
      align="center" 
      mb={4}
      direction={{ base: "column", md: "row" }}
      gap={4}
    >
      <Heading size={{ base: "sm", md: "md" }}>
        Investissements 
        {statusFilter === 'active' && ' actifs'}
        {statusFilter === 'completed' && ' terminés'}
        {statusFilter === 'all' && ' (tous)'}
      </Heading>
      
      <VStack spacing={2} align={{ base: "center", md: "end" }}>
        <Text fontSize="sm" color="gray.600" textAlign="center">
          {getFilteredStakes().length} / {stakes.length} investissement(s)
        </Text>
        
        {/* Boutons de filtre responsive */}
        <Flex gap={1} flexWrap="wrap" justify="center">
          <Button
            size="sm"
            colorScheme={statusFilter === 'active' ? "green" : "gray"}
            variant={statusFilter === 'active' ? "solid" : "outline"}
            onClick={() => setStatusFilter('active')}
            fontSize={{ base: "xs", md: "sm" }}
          >
            Actifs ({stakes.filter(stake => stake.active).length})
          </Button>
          
          <Button
            size="sm"
            colorScheme={statusFilter === 'completed' ? "red" : "gray"}
            variant={statusFilter === 'completed' ? "solid" : "outline"}
            onClick={() => setStatusFilter('completed')}
            fontSize={{ base: "xs", md: "sm" }}
          >
            Terminés ({stakes.filter(stake => !stake.active).length})
          </Button>
          
          <Button
            size="sm"
            colorScheme={statusFilter === 'all' ? "blue" : "gray"}
            variant={statusFilter === 'all' ? "solid" : "outline"}
            onClick={() => setStatusFilter('all')}
            fontSize={{ base: "xs", md: "sm" }}
          >
            Tous ({stakes.length})
          </Button>
        </Flex>
      </VStack>
    </Flex>
    
    {loading ? (
  <Text>Chargement des données...</Text>
) : getFilteredStakes().length > 0 ? (
  // Conteneur de tableau avec scroll horizontal contrôlé
  <Box 
    overflowX="auto" 
    w="100%" 
    pb={2}
    css={{
      '&::-webkit-scrollbar': {
        height: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#888',
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: '#555',
      },
    }}
  >
    <Table variant="simple" size="sm" minW="1200px">
      <Thead>
        <Tr>
          {isOwnerView && <Th minW="140px" fontSize={{ base: "xs", md: "sm" }}>Utilisateur</Th>}
          <Th minW="80px" fontSize={{ base: "xs", md: "sm" }}>Plan</Th>
          <Th minW="120px" fontSize={{ base: "xs", md: "sm" }}>Montant</Th>
          <Th minW="110px" fontSize={{ base: "xs", md: "sm" }}>Date de début</Th>
          <Th minW="110px" fontSize={{ base: "xs", md: "sm" }}>Date de fin</Th>
          <Th minW="70px" fontSize={{ base: "xs", md: "sm" }}>Token</Th>
          <Th minW="120px" fontSize={{ base: "xs", md: "sm" }}>Récompenses Dispo.</Th>
          <Th minW="120px" fontSize={{ base: "xs", md: "sm" }}>Dernier Retrait</Th>
          <Th minW="120px" fontSize={{ base: "xs", md: "sm" }}>Total Retiré</Th>
          <Th minW="140px" fontSize={{ base: "xs", md: "sm" }}>Gains Réalisés</Th>
          <Th minW="80px" fontSize={{ base: "xs", md: "sm" }}>Statut</Th>
        </Tr>
      </Thead>
      <Tbody>
        {getFilteredStakes().map((stake, index) => {
          const plan = plans ? plans.find(p => p.id === stake.planId) : null;
          
          const stakeAmount = parseFloat(stake.amount) || 0;
          const totalWithdrawn = parseFloat(stake.totalWithdrawn || '0');
          const availableRewards = parseFloat(stake.availableRewards || '0');

          let realizedGains;
          if (stake.active) {
            realizedGains = availableRewards;
          } else {
            realizedGains = totalWithdrawn - stakeAmount;
          }

          const gainsPercentage = stakeAmount > 0 ? ((realizedGains / stakeAmount) * 100) : 0;
          
                return (
                  <Tr key={index}>
                    {isOwnerView && (
                      <Td minW="140px">
                        {stake.userAddress ? (
                          <Flex align="center" gap={1} flexWrap="wrap">
                            <Text fontSize={{ base: "2xs", md: "sm" }}>
                              {`${stake.userAddress.substring(0, 6)}...${stake.userAddress.substring(stake.userAddress.length - 4)}`}
                            </Text>
                            <Button
                              size="xs"
                              variant="ghost"
                              colorScheme={copiedAddress === stake.userAddress ? "green" : "gray"}
                              onClick={() => copyToClipboard(stake.userAddress)}
                              leftIcon={<Icon as={copiedAddress === stake.userAddress ? Check : Copy} />}
                              title={copiedAddress === stake.userAddress ? "Copié !" : "Copier l'adresse complète"}
                              minW="auto"
                            >
                              {copiedAddress === stake.userAddress ? "Copié" : ""}
                            </Button>
                          </Flex>
                        ) : (
                          <Text fontSize={{ base: "2xs", md: "sm" }} color="gray.400">N/A</Text>
                        )}
                      </Td>
                    )}
              
                    <Td minW="80px" fontSize={{ base: "2xs", md: "sm" }}>
                      Plan {plan ? plan.name : stake.planId}
                    </Td>
              
                    <Td minW="120px" fontSize={{ base: "2xs", md: "sm" }} fontWeight="medium">
                      {stake.amount} {stake.token}
                    </Td>
              
                    <Td minW="110px" fontSize={{ base: "2xs", md: "xs" }}>
                      {stake.startTime.toLocaleDateString()}
                    </Td>
              
                    <Td minW="110px" fontSize={{ base: "2xs", md: "xs" }}>
                      {stake.endTime.toLocaleDateString()}
                    </Td>
              
                    <Td minW="70px" fontSize={{ base: "2xs", md: "sm" }}>
                      {stake.token}
                    </Td>
              
                    <Td minW="120px">
                      <Text color="orange.500" fontWeight="medium" fontSize={{ base: "2xs", md: "sm" }}>
                        {stake.availableRewards || '0'} {stake.token}
                      </Text>
                    </Td>
              
                    <Td minW="120px">
                      <Text color="blue.500" fontWeight="medium" fontSize={{ base: "2xs", md: "sm" }}>
                        {stake.withdrawnAmount || '0'} {stake.token}
                      </Text>
                    </Td>
              
                    <Td minW="120px">
                      <Text color="green.500" fontWeight="bold" fontSize={{ base: "2xs", md: "sm" }}>
                        {stake.totalWithdrawn || '0'} {stake.token}
                      </Text>
                    </Td>
              
                    <Td minW="140px">
                      <VStack spacing={0} align="start">
                        <Text 
                          color={realizedGains >= 0 ? "green.500" : "red.500"} 
                          fontWeight="bold"
                          fontSize={{ base: "2xs", md: "sm" }}
                        >
                          {realizedGains >= 0 ? '+' : ''}{realizedGains.toFixed(4)} {stake.token}
                        </Text>
                        <Text 
                          color={gainsPercentage >= 0 ? "green.400" : "red.400"} 
                          fontSize={{ base: "3xs", md: "xs" }}
                          fontWeight="medium"
                        >
                          ({gainsPercentage >= 0 ? '+' : ''}{gainsPercentage.toFixed(2)}%)
                        </Text>
                      </VStack>
                    </Td>
              
                    <Td minW="80px">
                      <Badge 
                        colorScheme={stake.active ? "green" : "red"} 
                        fontSize={{ base: "2xs", md: "xs" }}
                        variant="solid"
                      >
                        {stake.active ? "Actif" : "Terminé"}
                      </Badge>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      ) : (
        <Box textAlign="center" py={8} bg="gray.50" borderRadius="md">
          <Text color="gray.600" fontSize={{ base: "sm", md: "lg" }}>
            {statusFilter === 'active' && 'Aucun investissement actif trouvé'}
            {statusFilter === 'completed' && 'Aucun investissement terminé trouvé'}
            {statusFilter === 'all' && 'Aucun investissement trouvé'}
          </Text>
        </Box>
      )}
      </CardBody>
    </Card>

    {/* Tableau des investissements arrivant à échéance */}
    <Card bg={bgColorCard} mb={8}>
      <CardBody>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md" color="orange.600">
            ⚠️ Investissements arrivant à échéance (7 jours)
          </Heading>
          <Text color="orange.500" fontWeight="bold">
            {stakes.filter(stake => {
              if (!stake.active) return false;
              const now = new Date();
              const endDate = new Date(stake.endTime);
              const diffTime = endDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
              return diffDays <= 7 && diffDays >= 0;
            }).length} investissement(s) à préparer
          </Text>
        </Flex>
    
        {loading ? (
          <Text>Chargement des données...</Text>
        ) : (
          (() => {
            // Filtrer les stakes arrivant à échéance dans 7 jours
            const expiringStakes = stakes.filter(stake => {
              if (!stake.active) return false;
              const now = new Date();
              const endDate = new Date(stake.endTime);
              const diffTime = endDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
              return diffDays <= 7 && diffDays >= 0;
            });

            return expiringStakes.length > 0 ? (
              <Box overflowX="auto" maxW="100%" pb={2}>
                <Table variant="simple" size="sm" minW="900px">
                  <Thead bg="orange.50">
                    <Tr>
                      {isOwnerView && <Th minW="100px" color="black">Utilisateur</Th>}
                      <Th minW="80px" color="black">Plan</Th>
                      <Th minW="120px" color="black">Montant</Th>
                      <Th minW="110px" color="black">Date de début</Th>
                      <Th minW="110px" color="black">Date de fin</Th>
                      <Th minW="70px" color="black">Token</Th>
                      <Th minW="100px" color="black">Jours restants</Th>  {/* ← Colonne bonus */}
                      <Th minW="80px" color="black">Statut</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {expiringStakes.map((stake, index) => {
                      const plan = plans ? plans.find(p => p.id === stake.planId) : null;
                  
                      // Calculer les jours restants
                      const now = new Date();
                      const endDate = new Date(stake.endTime);
                      const diffTime = endDate.getTime() - now.getTime();
                      const daysRemaining = Math.ceil(diffTime / (1000 * 3600 * 24));
                  
                      // Couleur selon urgence
                      const urgencyColor = daysRemaining <= 1 ? "red.500" : 
                                          daysRemaining <= 3 ? "orange.500" : "yellow.500";
                  
                      return (
                        <Tr key={index} bg={daysRemaining <= 1 ? "red.100" : daysRemaining <= 3 ? "orange.100" : "blue.100"}>
                          {isOwnerView && (
                            <Td minW="100px" fontSize="sm" color="black">
                              {stake.userAddress ? 
                                `${stake.userAddress.substring(0, 6)}...${stake.userAddress.substring(stake.userAddress.length - 4)}` : 
                                'N/A'}
                            </Td>
                          )}
                          <Td minW="80px" fontSize="sm" color="black">Plan {plan ? plan.name : stake.planId}</Td>
                          <Td minW="120px" fontSize="sm" fontWeight="bold" color="orange.600">
                            {stake.amount} {stake.token}
                          </Td>
                          <Td minW="110px" fontSize="xs" color="black">{stake.startTime.toLocaleDateString()}</Td>
                          <Td minW="110px" fontSize="xs" fontWeight="bold" color="red">
                            {stake.endTime.toLocaleDateString()}
                          </Td>
                          <Td minW="70px" fontSize="sm" color="black">{stake.token}</Td>
                      
                          {/* Jours restants avec couleur d'urgence */}
                          <Td minW="100px">
                            <Badge 
                              colorScheme={daysRemaining <= 1 ? "red" : daysRemaining <= 3 ? "orange" : "yellow"}
                              fontSize="xs"
                              fontWeight="bold"
                              variant="solid"
                              color="black"
                            >
                              {daysRemaining <= 0 ? "ÉCHÉANCE !" : `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`}
                            </Badge>
                          </Td>
                      
                          {/* Statut */}
                          <Td minW="80px">
                            <Badge 
                              colorScheme="orange" 
                              fontSize="sm"
                              fontWeight="bold"
                              variant="solid"
                              color="black"
                            >
                              À préparer
                            </Badge>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
            
                {/* Message d'alerte en bas du tableau */}
                <Alert status="warning" mt={4} borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Action requise :</Text>
                    <Text fontSize="sm">
                      Assurez-vous que le contrat dispose de suffisamment de liquidités pour ces retraits de capital.
                      Total à prévoir : <strong>
                        {expiringStakes.reduce((total, stake) => total + parseFloat(stake.amount), 0).toFixed(2)} USDC
                      </strong>
                    </Text>
                  </Box>
                </Alert>
              </Box>
            ) : (
              <Box textAlign="center" py={8} bg="green.50" borderRadius="md">
                <Text color="green.600" fontWeight="bold" fontSize="lg">
                  ✅ Aucun investissement n'arrive à échéance dans les 7 prochains jours
                </Text>
                <Text color="green.500" fontSize="sm">
                  Pas d'action requise pour le moment
                </Text>
              </Box>
            );
          })()
        )}
      </CardBody>
    </Card>

    {/* Actions rapides - responsive */}
    <Card bg={bgColorCard}>
      <CardBody>
        <Heading size={{ base: "sm", md: "md" }} mb={4}>Actions rapides</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Button
            leftIcon={<Icon as={ArrowUpRight} />}
            colorScheme="green"
            onClick={() => navigate('/strategy-management')}
            size={{ base: "md", md: "lg" }}
          >
            Gérer les stratégies d'investissement
          </Button>
          <Button
            leftIcon={<Icon as={Settings} />}
            colorScheme="purple"
            onClick={() => navigate('/admin/settings')}
            size={{ base: "md", md: "lg" }}
          >
            Paramètres de la plateforme
          </Button>
        </SimpleGrid>
      </CardBody>
    </Card>
  </Box>
  );
}

export default AdminDashboard;