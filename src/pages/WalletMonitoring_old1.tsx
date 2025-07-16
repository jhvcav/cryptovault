// src/pages/WalletMonitoring.tsx - VERSION PROPRE ET CORRIGÉE
import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Select,
  Button,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Flex,
  Link,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { 
  ArrowUp, 
  ArrowDown, 
  ExternalLink,
  Calendar,
  Info,
  Search,
  FileText,
} from 'lucide-react';

// Types pour les données BSCScan
interface Transaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
}

interface InternalTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  input: string;
  type: string;
  gas: string;
  gasUsed: string;
  traceId: string;
  isError: string;
  errCode: string;
}

interface TokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

interface SmartContractTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  input: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  decodedMethod: string;
  direction: 'in' | 'out';
  amountUSDC: string;
  functionName: string;
}

interface WalletSummary {
  totalIn: number;
  totalOut: number;
  totalFees: number;
  transactionCount: number;
  byType: {
    normal: number;
    internal: number;
    token: number;
    smartContract?: number;
  };
  netFlow: number;
}

interface SmartContractSummary {
  totalDeposits: number;
  totalWithdrawals: number;
  totalFees: number;
  totalCapitalWithdrawals: number;
  totalPancakeRewards: number;
  totalToStrategies: number;
  totalOwnerReturns: number;
  transactionCount: number;
  byMethod: {
    deposits: number;
    withdrawals: number;
    fees: number;
    capitalWithdrawals: number;
    pancakeRewards: number;
    toStrategies: number;
    ownerReturns: number;
  };
}

const WalletMonitoring: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [internalTxs, setInternalTxs] = useState<InternalTransaction[]>([]);
  const [tokenTransfers, setTokenTransfers] = useState<TokenTransfer[]>([]);
  const [smartContractTxs, setSmartContractTxs] = useState<SmartContractTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [smartContractLoading, setSmartContractLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('7d');
  const [activeCategory, setActiveCategory] = useState(0);
  const [walletAddress, setWalletAddress] = useState('0x1FF70C1DFc33F5DDdD1AD2b525a07b172182d8eF');
  const [showReport, setShowReport] = useState(false);
  const [contractUSDCBalance, setContractUSDCBalance] = useState('0');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const API_KEY = import.meta.env.VITE_BSCSCAN_API_KEY;
  const BNB_PRICE_USD = 670;
  const SMART_CONTRACT_ADDRESS = "0x719fd9F511DDc561D03801161742D84ECb9445e9";
  
  // Wallets spécifiques pour les critères
  const FEES_WALLET = "0x7558cBa3b60F11FBbEcc9CcAB508afA65d88B3d2";
  const PANCAKE_REWARDS_WALLET = "0xEa47e1ca0486871D905A62752fd44a1fFd8cE71a";
  const STRATEGIES_WALLET = "0x1FF70C1DFc33F5DDdD1AD2b525a07b172182d8eF";

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Fonction pour récupérer les transactions du smart contrat
  const fetchSmartContractData = async () => {
    if (!API_KEY) {
      setError('Clé API BSCScan non configurée');
      return;
    }

    setSmartContractLoading(true);
    setError(null);

    try {
      const baseUrl = 'https://api.bscscan.com/api';
      
      // Récupérer tous les token transfers du smart contract
      const tokenTxsResponse = await fetch(
        `${baseUrl}?module=account&action=tokentx&address=${SMART_CONTRACT_ADDRESS}&sort=desc&apikey=${API_KEY}`
      );
      const tokenTxsData = await tokenTxsResponse.json();

      console.log('🔍 Token transfers du smart contract:', tokenTxsData);

      if (tokenTxsData.status === '1' && tokenTxsData.result) {
        // Récupérer les transactions normales pour obtenir les méthodes
        const normalTxsResponse = await fetch(
          `${baseUrl}?module=account&action=txlist&address=${SMART_CONTRACT_ADDRESS}&sort=desc&apikey=${API_KEY}`
        );
        const normalTxsData = await normalTxsResponse.json();
        
        console.log('🔍 Transactions normales du smart contract:', normalTxsData);

        // Créer un mapping hash -> functionName
        const txMethodMap: { [key: string]: string } = {};
        if (normalTxsData.status === '1' && normalTxsData.result) {
          normalTxsData.result.forEach((tx: Transaction) => {
            if (tx.functionName) {
              txMethodMap[tx.hash] = tx.functionName;
            }
          });
        }

        console.log('🔍 Mapping des méthodes:', txMethodMap);

        // Traiter les token transfers avec les critères
        const processedTxs: SmartContractTransaction[] = tokenTxsData.result
          .filter((tx: TokenTransfer) => {
            const isUSDC = tx.tokenSymbol === 'USDC';
            const isSmartContractRelated = 
              tx.to.toLowerCase() === SMART_CONTRACT_ADDRESS.toLowerCase() || 
              tx.from.toLowerCase() === SMART_CONTRACT_ADDRESS.toLowerCase();
            
            console.log(`🔍 Tx ${tx.hash.slice(0, 10)}... - USDC: ${isUSDC}, SmartContract: ${isSmartContractRelated}`);
            
            return isUSDC && isSmartContractRelated;
          })
          .map((tx: TokenTransfer) => {
            const functionName = txMethodMap[tx.hash] || '';
            let decodedMethod = '';
            let direction: 'in' | 'out' = 'in';

            // Variables pour les vérifications d'adresses
            const isToContract = tx.to.toLowerCase() === SMART_CONTRACT_ADDRESS.toLowerCase();
            const isFromContract = tx.from.toLowerCase() === SMART_CONTRACT_ADDRESS.toLowerCase();
            const isFromFeesWallet = tx.from.toLowerCase() === FEES_WALLET.toLowerCase();
            const isToFeesWallet = tx.to.toLowerCase() === FEES_WALLET.toLowerCase();
            const isFromPancakeWallet = tx.from.toLowerCase() === PANCAKE_REWARDS_WALLET.toLowerCase();
            const isToStrategiesWallet = tx.to.toLowerCase() === STRATEGIES_WALLET.toLowerCase();
            const isFromOwnerWallet = tx.from.toLowerCase() === STRATEGIES_WALLET.toLowerCase();

            console.log(`🔍 Analyse tx ${tx.hash.slice(0, 10)}...:`);
            console.log(`   - functionName: "${functionName}"`);
            console.log(`   - from: ${tx.from.slice(0, 10)}...`);
            console.log(`   - to: ${tx.to.slice(0, 10)}...`);
            console.log(`   - isToContract: ${isToContract}`);
            console.log(`   - isFromContract: ${isFromContract}`);

            // LOGIQUE DE DÉCODAGE
            
            // 1. Méthode "stake" - Dépôts utilisateurs
            if (functionName.toLowerCase().includes('stake') && !functionName.toLowerCase().includes('end')) {
              if (isToContract) {
                decodedMethod = 'Dépôt Plans';
                direction = 'in';
                console.log(`   ✅ Détecté: Dépôt Plans (stake IN)`);
              } else if (isFromContract && isToFeesWallet) {
                decodedMethod = 'Frais 2%';
                direction = 'out';
                console.log(`   ✅ Détecté: Frais 2% (stake fees OUT)`);
              }
            }
            
            // 2. Méthode "endStake" - Retrait du capital + récompenses
            else if ((functionName.toLowerCase().includes('endstake') || functionName.toLowerCase().includes('end')) && isFromContract) {
              decodedMethod = 'Retrait capitaux';
              direction = 'out';
              console.log(`   ✅ Détecté: Retrait capitaux (${functionName} OUT)`);
            }
            
            // 3. Méthode "claimRewards" - Retrait des récompenses
            else if (functionName.toLowerCase().includes('claimrewards') && isFromContract) {
              decodedMethod = 'Retrait récompense Plans';
              direction = 'out';
              console.log(`   ✅ Détecté: Retrait récompense Plans (claimRewards OUT)`);
            }
            
            // 4. Méthodes "adminWithdraw" - Vers stratégies
            else if ((functionName.toLowerCase().includes('adminwithdraw')) && isFromContract && isToStrategiesWallet) {
              decodedMethod = 'Vers Stratégies';
              direction = 'out';
              console.log(`   ✅ Détecté: Vers Stratégies (adminWithdraw OUT vers stratégies)`);
            }
            
            // 5. Transfers depuis Pancake
            else if (isFromPancakeWallet && isToContract) {
              decodedMethod = 'Récompenses Pancake';
              direction = 'in';
              console.log(`   ✅ Détecté: Récompenses Pancake (Transfer IN depuis Pancake)`);
            }
            
            // 6. Transfer depuis Owner vers smart contract
            else if (isFromOwnerWallet && isToContract) {
              decodedMethod = 'Retour récompense Owner';
              direction = 'in';
              console.log(`   ✅ Détecté: Retour récompense Owner (Transfer IN depuis Owner)`);
            }
            
            // 7. emergencyWithdraw
            else if (functionName.toLowerCase().includes('emergencywithdraw') && isFromContract) {
              decodedMethod = 'Retrait d\'urgence';
              direction = 'out';
              console.log(`   ✅ Détecté: Retrait d'urgence (emergencyWithdraw OUT)`);
            }
            
            // 8. Cas génériques avec analyse des adresses
            else {
              console.log(`   ⚠️ Analyse fallback pour functionName: "${functionName}"`);
              
              if (isToContract) {
                if (isFromPancakeWallet) {
                  decodedMethod = 'Récompenses Pancake';
                  direction = 'in';
                  console.log(`   🔄 Fallback: Récompenses Pancake (IN depuis Pancake)`);
                } else if (isFromOwnerWallet) {
                  decodedMethod = 'Retour récompense Owner';
                  direction = 'in';
                  console.log(`   🔄 Fallback: Retour récompense Owner (IN depuis Owner)`);
                } else {
                  decodedMethod = 'Dépôt Plans';
                  direction = 'in';
                  console.log(`   🔄 Fallback: Dépôt Plans (Transfer IN générique)`);
                }
              } else if (isFromContract) {
                if (isToFeesWallet) {
                  decodedMethod = 'Frais 2%';
                  direction = 'out';
                  console.log(`   🔄 Fallback: Frais 2% (OUT vers ${FEES_WALLET.slice(0, 10)}...)`);
                } else if (isToStrategiesWallet) {
                  decodedMethod = 'Vers Stratégies';
                  direction = 'out';
                  console.log(`   🔄 Fallback: Vers Stratégies (OUT vers ${STRATEGIES_WALLET.slice(0, 10)}...)`);
                } else {
                  // Analyse avancée par montant
                  const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));
                  if (amount > 100) {
                    decodedMethod = 'Retrait capitaux';
                    direction = 'out';
                    console.log(`   🔄 Fallback: Retrait capitaux (OUT grosse somme: ${amount.toFixed(2)} USDC)`);
                  } else {
                    decodedMethod = 'Retrait récompense Plans';
                    direction = 'out';
                    console.log(`   🔄 Fallback: Retrait récompense Plans (OUT petite somme: ${amount.toFixed(2)} USDC)`);
                  }
                }
              } else {
                decodedMethod = 'Transaction externe';
                direction = 'out';
                console.log(`   🔄 Fallback: Transaction externe`);
              }
            }

            const amountUSDC = (parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal))).toFixed(2);

            const result = {
              ...tx,
              decodedMethod,
              direction,
              amountUSDC,
              functionName
            };

            console.log(`   🎯 Résultat final: ${decodedMethod} (${direction}) - ${amountUSDC} USDC`);

            return result;
          });

        console.log('🎯 Transactions traitées avant filtrage:', processedTxs.length);
        
        // Filtrer les transactions selon nos critères
        const finalTxs = processedTxs.filter((tx: SmartContractTransaction) => {
          const validMethods = [
            'Dépôt Plans', 
            'Frais 2%', 
            'Récompenses Pancake', 
            'Vers Stratégies', 
            'Retrait récompense Plans', 
            'Retrait capitaux',
            'Retrait d\'urgence',
            'Retour récompense Owner'
          ];
          const isValid = validMethods.includes(tx.decodedMethod);
          
          if (!isValid) {
            console.log(`❌ Transaction filtrée: ${tx.decodedMethod} (hash: ${tx.hash.slice(0, 10)}...)`);
          }
          
          return isValid;
        });

        console.log('🎯 Transactions finales après filtrage:', finalTxs.length);
        console.log('🎯 Répartition:', finalTxs.reduce((acc, tx) => {
          acc[tx.decodedMethod] = (acc[tx.decodedMethod] || 0) + 1;
          return acc;
        }, {} as Record<string, number>));

        setSmartContractTxs(finalTxs);
        
        if (finalTxs.length === 0) {
          console.log('ℹ️ Aucune transaction trouvée. Vérifiez:');
          console.log('  - Le smart contract a-t-il des transactions USDC ?');
          console.log('  - Les adresses des wallets sont-elles correctes ?');
          console.log('  - La clé API BSCScan fonctionne-t-elle ?');
        }

      } else {
        console.log('❌ Aucune donnée de token transfer reçue ou erreur API');
        console.log('Response status:', tokenTxsData.status);
        console.log('Response message:', tokenTxsData.message);
        setSmartContractTxs([]);
      }

    } catch (err) {
      setError('Erreur lors de la récupération des données du smart contract');
      console.error('❌ Smart Contract API Error:', err);
    } finally {
      setSmartContractLoading(false);
    }
  };

  // Fonction pour valider l'adresse
  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleAddressChange = (newAddress: string) => {
    setWalletAddress(newAddress);
    setTransactions([]);
    setInternalTxs([]);
    setTokenTransfers([]);
    setError(null);
  };

  const handleSearch = () => {
    if (!isValidAddress(walletAddress)) {
      setError('Adresse de wallet invalide. Veuillez saisir une adresse BSC valide (0x...)');
      return;
    }
    fetchBSCScanData();
    getContractUSDCBalance();
  };

  const handleSmartContractRefresh = () => {
    fetchSmartContractData();
    getContractUSDCBalance();
  };

  // Fonction pour récupérer le solde USDC du contrat
  const getContractUSDCBalance = async () => {
    try {
      if (!API_KEY) return;
      
      const usdcAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
      
      const response = await fetch(
        `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${usdcAddress}&address=${SMART_CONTRACT_ADDRESS}&tag=latest&apikey=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === '1') {
        const balance = parseFloat(data.result) / Math.pow(10, 18);
        setContractUSDCBalance(balance.toFixed(2));
        console.log('Solde USDC du contrat:', balance.toFixed(2));
      }
    } catch (error) {
      console.error('Erreur récupération solde contrat USDC:', error);
    }
  };

  // Fonction pour récupérer les données BSCScan (Monitoring Wallet)
  const fetchBSCScanData = async () => {
    if (!API_KEY) {
      setError('Clé API BSCScan non configurée');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = 'https://api.bscscan.com/api';
      
      const normalTxsResponse = await fetch(
        `${baseUrl}?module=account&action=txlist&address=${walletAddress}&sort=desc&apikey=${API_KEY}`
      );
      const normalTxsData = await normalTxsResponse.json();

      const internalTxsResponse = await fetch(
        `${baseUrl}?module=account&action=txlistinternal&address=${walletAddress}&sort=desc&apikey=${API_KEY}`
      );
      const internalTxsData = await internalTxsResponse.json();

      const tokenTxsResponse = await fetch(
        `${baseUrl}?module=account&action=tokentx&address=${walletAddress}&sort=desc&apikey=${API_KEY}`
      );
      const tokenTxsData = await tokenTxsResponse.json();

      if (normalTxsData.status === '1') {
        setTransactions(normalTxsData.result || []);
      }
      if (internalTxsData.status === '1') {
        setInternalTxs(internalTxsData.result || []);
      }
      if (tokenTxsData.status === '1') {
        setTokenTransfers(tokenTxsData.result || []);
      }

    } catch (err) {
      setError('Erreur lors de la récupération des données BSCScan');
      console.error('BSCScan API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isValidAddress(walletAddress)) {
      fetchBSCScanData();
    }
    fetchSmartContractData();
    getContractUSDCBalance();
  }, []);

  const filterByDateUnified = (timestamp: string): boolean => {
  const txDate = new Date(parseInt(timestamp) * 1000);
  
  // Si on a des dates custom ET que dateFilter est 'custom'
  if (dateFilter === 'custom' && customStartDate && customEndDate) {
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
    endDate.setHours(23, 59, 59, 999); // Fin de journée
    return txDate >= startDate && txDate <= endDate;
  }
  
  // Sinon, utiliser le filtre standard
  const now = new Date();
  const diffTime = now.getTime() - txDate.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);

  switch (dateFilter) {
    case '1d': return diffDays <= 1;
    case '7d': return diffDays <= 7;
    case '30d': return diffDays <= 30;
    case '90d': return diffDays <= 90;
    case 'all': return true;
    default: return true;
  }
};

  const calculateSummary = (): WalletSummary => {
    const filteredNormal = transactions.filter(tx => filterByDateUnified(tx.timeStamp));
    const filteredInternal = internalTxs.filter(tx => filterByDateUnified(tx.timeStamp));
    const filteredTokens = tokenTransfers.filter(tx => filterByDateUnified(tx.timeStamp));

    let totalIn = 0, totalOut = 0, totalFees = 0;

    filteredNormal.forEach(tx => {
      const value = parseFloat(tx.value) / Math.pow(10, 18);
      const fee = (parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice)) / Math.pow(10, 18);
      
      if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
        totalIn += value;
      } else {
        totalOut += value;
      }
      totalFees += fee;
    });

    filteredInternal.forEach(tx => {
      const value = parseFloat(tx.value) / Math.pow(10, 18);
      if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
        totalIn += value;
      } else {
        totalOut += value;
      }
    });

    return {
      totalIn,
      totalOut,
      totalFees,
      transactionCount: filteredNormal.length + filteredInternal.length + filteredTokens.length,
      byType: {
        normal: filteredNormal.length,
        internal: filteredInternal.length,
        token: filteredTokens.length,
      },
      netFlow: totalIn - totalOut,
    };
  };

  const calculateSmartContractSummary = (): SmartContractSummary => {
    const filteredTxs = smartContractTxs.filter(tx => filterByDateUnified(tx.timeStamp));

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalFees = 0;
    let totalCapitalWithdrawals = 0;
    let totalPancakeRewards = 0;
    let totalToStrategies = 0;
    let totalOwnerReturns = 0;

    const byMethod = {
      deposits: 0,
      withdrawals: 0,
      fees: 0,
      capitalWithdrawals: 0,
      pancakeRewards: 0,
      toStrategies: 0,
      ownerReturns: 0,
    };

    filteredTxs.forEach(tx => {
      const amount = parseFloat(tx.amountUSDC);
      
      switch (tx.decodedMethod) {
        case 'Dépôt Plans':
          totalDeposits += amount;
          byMethod.deposits++;
          break;
        case 'Retrait récompense Plans':
          totalWithdrawals += amount;
          byMethod.withdrawals++;
          break;
        case 'Frais 2%':
          totalFees += amount;
          byMethod.fees++;
          break;
        case 'Retrait capitaux':
          totalCapitalWithdrawals += amount;
          byMethod.capitalWithdrawals++;
          break;
        case 'Récompenses Pancake':
          totalPancakeRewards += amount;
          byMethod.pancakeRewards++;
          break;
        case 'Vers Stratégies':
          totalToStrategies += amount;
          byMethod.toStrategies++;
          break;
        case 'Retour récompense Owner':
          totalOwnerReturns += amount;
          byMethod.ownerReturns++;
          break;
      }
    });

    return {
      totalDeposits,
      totalWithdrawals,
      totalFees,
      totalCapitalWithdrawals,
      totalPancakeRewards,
      totalToStrategies,
      totalOwnerReturns,
      transactionCount: filteredTxs.length,
      byMethod,
    };
  };

  const summary = calculateSummary();
  const smartContractSummary = calculateSmartContractSummary();

  const formatDate = (timestamp: string): string => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString('fr-FR');
  };

  const formatValue = (value: string, decimals = 18): string => {
    const val = parseFloat(value) / Math.pow(10, decimals);
    return val.toFixed(6);
  };

  const formatValueWithUSD = (bnbAmount: number): string => {
    const usdValue = bnbAmount * BNB_PRICE_USD;
    return `${bnbAmount.toFixed(4)} BNB ($${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
  };

  const getTransactionMethod = (tx: Transaction): string => {
    if (tx.functionName) {
      return tx.functionName.split('(')[0];
    }
    if (tx.input === '0x') {
      return 'Transfer';
    }
    return 'Contract Call';
  };

  const getDirection = (from: string, to: string): 'in' | 'out' => {
    return to.toLowerCase() === walletAddress.toLowerCase() ? 'in' : 'out';
  };

  const DirectionIcon = ({ direction }: { direction: 'in' | 'out' }) => {
    const IconComponent = direction === 'in' ? ArrowDown : ArrowUp;
    const color = direction === 'in' ? '#38A169' : '#E53E3E';
    
    return <IconComponent size={16} color={color} />;
  };

  // Fonction pour le tableau des transactions du smart contract
  const renderSmartContractTable = () => {
    const filteredData = smartContractTxs.filter(tx =>filterByDateUnified(tx.timeStamp));

    return (
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Hash</Th>
              <Th>Méthode</Th>
              <Th>Direction</Th>
              <Th>Montant USDC</Th>
              <Th>Date</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredData.slice(0, 50).map((tx, idx) => (
              <Tr key={idx}>
                <Td>
                  <Flex align="center">
                    <Link 
                      href={`https://bscscan.com/tx/${tx.hash}`} 
                      isExternal 
                      color="blue.500"
                      fontSize="sm"
                      display="flex"
                      alignItems="center"
                    >
                      {tx.hash.slice(0, 10)}...
                      <Box ml={1}>
                        <ExternalLink size={12} />
                      </Box>
                    </Link>
                  </Flex>
                </Td>
                
                <Td>
                  <Badge 
                    colorScheme={
                      tx.decodedMethod === 'Dépôt Plans' ? 'green' :
                      tx.decodedMethod === 'Récompenses Pancake' ? 'yellow' :
                      tx.decodedMethod === 'Retour récompense Owner' ? 'teal' :
                      tx.decodedMethod === 'Vers Stratégies' ? 'purple' :
                      tx.decodedMethod === 'Retrait récompense Plans' ? 'blue' :
                      tx.decodedMethod === 'Retrait capitaux' ? 'orange' :
                      tx.decodedMethod === 'Frais 2%' ? 'red' : 'gray'
                    }
                    size="sm"
                  >
                    {tx.decodedMethod}
                  </Badge>
                </Td>
                
                <Td>
                  <HStack>
                    <DirectionIcon direction={tx.direction} />
                    <Text color={tx.direction === 'in' ? 'green.500' : 'red.500'}>
                      {tx.direction === 'in' ? 'Entrée' : 'Sortie'}
                    </Text>
                  </HStack>
                </Td>
                
                <Td>
                  <Text fontWeight="semibold">{tx.amountUSDC} USDC</Text>
                </Td>
                
                <Td fontSize="sm">{formatDate(tx.timeStamp)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        {filteredData.length === 0 && (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">Aucune transaction du smart contract trouvée pour cette période</Text>
          </Box>
        )}
      </TableContainer>
    );
  };

  // Fonction pour générer le rapport avec filtrage par période sélectionnée
  const generateTransparencyReport = () => {
  // Utiliser la MÊME logique de filtrage que le tableau
  const filteredSmartContract = smartContractTxs.filter(tx => filterByDateUnified(tx.timeStamp));
  
  // Générer le label de période
  let periodLabel: string;
  let daysInPeriod: number;
  
  if (dateFilter === 'custom' && customStartDate && customEndDate) {
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
    daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
    periodLabel = `${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`;
  } else {
    switch (dateFilter) {
      case '1d': 
        periodLabel = 'Aujourd\'hui'; 
        daysInPeriod = 1; 
        break;
      case '7d': 
        periodLabel = '7 derniers jours'; 
        daysInPeriod = 7; 
        break;
      case '30d': 
        periodLabel = '30 derniers jours'; 
        daysInPeriod = 30; 
        break;
      case '90d': 
        periodLabel = '90 derniers jours'; 
        daysInPeriod = 90; 
        break;
      case 'all': 
        periodLabel = 'Toutes les transactions'; 
        daysInPeriod = 365; 
        break;
      default: 
        periodLabel = 'Période inconnue'; 
        daysInPeriod = 30; 
        break;
    }
  }
  
  // Calculer les données Smart Contract pour la période filtrée
  let userDeposits = 0;
  let claimRewards = 0;
  let endStake = 0;
  let pancakeRewards = 0;
  let ownerReturns = 0;
  let fees = 0;
  let toStrategies = 0;
  let emergencyWithdrawals = 0;

  const reportByMethod = {
    deposits: 0,
    withdrawals: 0,
    fees: 0,
    capitalWithdrawals: 0,
    pancakeRewards: 0,
    toStrategies: 0,
    ownerReturns: 0,
    emergencyWithdrawals: 0,
  };

  filteredSmartContract.forEach(tx => {
    const amount = parseFloat(tx.amountUSDC) || 0; // Protection contre NaN
    
    switch (tx.decodedMethod) {
      case 'Dépôt Plans':
        userDeposits += amount;
        reportByMethod.deposits++;
        break;
      case 'Récompenses Pancake':
        pancakeRewards += amount;
        reportByMethod.pancakeRewards++;
        break;
      case 'Retour récompense Owner':
        ownerReturns += amount;
        reportByMethod.ownerReturns++;
        break;
      case 'Retrait récompense Plans':
        claimRewards += amount;
        reportByMethod.withdrawals++;
        break;
      case 'Retrait capitaux':
        endStake += amount;
        reportByMethod.capitalWithdrawals++;
        break;
      case 'Frais 2%':
        fees += amount;
        reportByMethod.fees++;
        break;
      case 'Vers Stratégies':
        toStrategies += amount;
        reportByMethod.toStrategies++;
        break;
      case 'Retrait d\'urgence':
        emergencyWithdrawals += amount;
        reportByMethod.emergencyWithdrawals++;
        break;
    }
  });

  // Valeurs par défaut pour éviter undefined
  const userWithdrawals = (claimRewards || 0) + (endStake || 0) + (emergencyWithdrawals || 0);
  
  // LOGIQUE DE PERFORMANCE avec protection
  const totalInvestments = userDeposits || 0;
  const totalExternalReturns = (pancakeRewards || 0) + (ownerReturns || 0);
  
  const performanceRatio = totalInvestments > 0 ? (totalExternalReturns / totalInvestments) : 0;
  const performancePercentage = performanceRatio * 100;
  
  const annualizedReturn = daysInPeriod > 0 && dateFilter !== 'all' ? 
    (performanceRatio * 365) / daysInPeriod : performanceRatio;
  const annualizedReturnPercentage = annualizedReturn * 100;

  // Flux net Smart Contract
  const totalEntries = (userDeposits || 0) + (pancakeRewards || 0) + (ownerReturns || 0);
  const totalExits = (claimRewards || 0) + (endStake || 0) + (fees || 0) + (toStrategies || 0) + (emergencyWithdrawals || 0);
  const netFlowSmartContract = totalEntries - totalExits;
  
  // RETOURNER TOUTES LES PROPRIÉTÉS NÉCESSAIRES
  return {
    period: periodLabel || 'Période inconnue',
    userDeposits: userDeposits || 0,
    pancakeRewards: pancakeRewards || 0,
    ownerReturns: ownerReturns || 0,
    claimRewards: claimRewards || 0,
    endStake: endStake || 0,
    emergencyWithdrawals: emergencyWithdrawals || 0,
    fees: fees || 0,
    toStrategies: toStrategies || 0,
    userWithdrawals: userWithdrawals || 0,
    totalEntries: totalEntries || 0,
    totalExits: totalExits || 0,
    netFlowSmartContract: netFlowSmartContract || 0,
    
    // PERFORMANCE
    totalInvestments: totalInvestments || 0,
    totalExternalReturns: totalExternalReturns || 0,
    performanceRatio: performanceRatio || 0,
    performancePercentage: performancePercentage || 0,
    annualizedReturnPercentage: annualizedReturnPercentage || 0,
    
    // MÉTADONNÉES
    smartContractTxCount: filteredSmartContract.length || 0,
    reportByMethod: reportByMethod || {
      deposits: 0,
      withdrawals: 0,
      fees: 0,
      capitalWithdrawals: 0,
      pancakeRewards: 0,
      toStrategies: 0,
      ownerReturns: 0,
      emergencyWithdrawals: 0,
    },
    contractBalance: contractUSDCBalance || '0',
    daysInPeriod: daysInPeriod || 30,
    dateFilter: dateFilter || '7d',
  };
};

// 2. AJOUTER une fonction helper pour les valeurs sûres
const safeToFixed = (value: any, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.' + '0'.repeat(decimals);
  }
  return Number(value).toFixed(decimals);
};

  // Composant du rapport de transparence avec données Smart Contract mises à jour
  const TransparencyReportModal = () => {
  // Générer le rapport avec protection
  let report;
  try {
    report = generateTransparencyReport();
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
    // Rapport par défaut en cas d'erreur
    report = {
      period: 'Erreur',
      userDeposits: 0,
      pancakeRewards: 0,
      ownerReturns: 0,
      claimRewards: 0,
      endStake: 0,
      emergencyWithdrawals: 0,
      fees: 0,
      toStrategies: 0,
      userWithdrawals: 0,
      totalEntries: 0,
      totalExits: 0,
      netFlowSmartContract: 0,
      totalInvestments: 0,
      totalExternalReturns: 0,
      performanceRatio: 0,
      performancePercentage: 0,
      annualizedReturnPercentage: 0,
      smartContractTxCount: 0,
      reportByMethod: {
        deposits: 0,
        withdrawals: 0,
        fees: 0,
        capitalWithdrawals: 0,
        pancakeRewards: 0,
        toStrategies: 0,
        ownerReturns: 0,
        emergencyWithdrawals: 0,
      },
      contractBalance: '0',
      daysInPeriod: 30,
      dateFilter: '7d',
    };
  }
  
  return (
    <Modal isOpen={showReport} onClose={() => setShowReport(false)} size="6xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <FileText size={24} />
            <Text>Rapport de Transparence - {report.period}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Sélecteur de période SYNCHRONISÉ */}
            <Card>
              <CardHeader>
                <Heading size="md">📅 Période du Rapport</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={4}>
                    <Select 
                      value={dateFilter} 
                      onChange={(e) => setDateFilter(e.target.value)}
                      maxW="300px"
                    >
                      <option value="1d">Aujourd'hui</option>
                      <option value="7d">7 derniers jours</option>
                      <option value="30d">30 derniers jours</option>
                      <option value="90d">90 derniers jours</option>
                      <option value="all">Toutes les transactions</option>
                      <option value="custom">Période personnalisée</option>
                    </Select>
                    
                    <Text fontSize="sm" color="blue.500" fontWeight="bold">
                      📊 {report.smartContractTxCount} transactions analysées
                    </Text>
                  </HStack>
                  
                  {dateFilter === 'custom' && (
                    <HStack spacing={4}>
                      <Box>
                        <Text fontSize="sm" mb={1}>Date de début :</Text>
                        <Input 
                          type="date" 
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={1}>Date de fin :</Text>
                        <Input 
                          type="date" 
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </Box>
                    </HStack>
                  )}
                  
                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <Text fontSize="sm">
                        📌 Ce sélecteur est synchronisé avec l'onglet Smart Contract. 
                        Les modifications ici affectent aussi le tableau des transactions.
                      </Text>
                    </Box>
                  </Alert>
                  
                  <Text fontSize="sm" color="gray.600">
                    Période analysée : {report.period} ({report.daysInPeriod} jours)
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            {/* Résumé Smart Contract - AVEC PROTECTION */}
            <Card>
              <CardHeader>
                <Heading size="md" color="purple.600">🏦 Résumé Smart Contract - {report.period}</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                  <Stat>
                    <StatLabel>Dépôts Plans</StatLabel>
                    <StatNumber color="green.500">
                      {safeToFixed(report.userDeposits)} USDC
                    </StatNumber>
                    <StatHelpText>{report.reportByMethod?.deposits || 0} transactions</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Récompenses Pancake</StatLabel>
                    <StatNumber color="yellow.500">
                      {safeToFixed(report.pancakeRewards)} USDC
                    </StatNumber>
                    <StatHelpText>{report.reportByMethod?.pancakeRewards || 0} entrées</StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Retour Owner</StatLabel>
                    <StatNumber color="teal.500">
                      {safeToFixed(report.ownerReturns)} USDC
                    </StatNumber>
                    <StatHelpText>{report.reportByMethod?.ownerReturns || 0} transferts</StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Performance Réelle</StatLabel>
                    <StatNumber color={(report.performancePercentage || 0) >= 5 ? "green.500" : "orange.500"}>
                      {safeToFixed(report.performancePercentage, 1)}%
                    </StatNumber>
                    <StatHelpText>
                      {safeToFixed(report.annualizedReturnPercentage, 1)}% annualisé
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Performance Réelle - AVEC PROTECTION */}
            <Card>
              <CardHeader>
                <Heading size="md" color="green.600">📈 Performance Réelle - {report.period}</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                  <Stat>
                    <StatLabel>💰 Total Investissements</StatLabel>
                    <StatNumber color="blue.500">
                      {safeToFixed(report.totalInvestments)} USDC
                    </StatNumber>
                    <StatHelpText>Somme des Dépôts Plans</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>🎯 Retours Générés</StatLabel>
                    <StatNumber color="green.500">
                      {safeToFixed(report.totalExternalReturns)} USDC
                    </StatNumber>
                    <StatHelpText>Owner + Pancake</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>📊 Performance Période</StatLabel>
                    <StatNumber color={(report.performancePercentage || 0) >= 5 ? "green.500" : "orange.500"}>
                      {safeToFixed(report.performancePercentage)}%
                    </StatNumber>
                    <StatHelpText>
                      {(report.performancePercentage || 0) >= 5 ? "🎯 Bonne performance" : "⚠️ Performance faible"}
                    </StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>📈 Rendement Annualisé</StatLabel>
                    <StatNumber color={(report.annualizedReturnPercentage || 0) >= 15 ? "green.500" : "orange.500"}>
                      {report.dateFilter === 'all' ? 'N/A' : `${safeToFixed(report.annualizedReturnPercentage, 1)}% /an`}
                    </StatNumber>
                    <StatHelpText>
                      {report.dateFilter === 'all' ? 'Toutes périodes' : `Basé sur ${report.daysInPeriod} jours`}
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>

                {/* Détail du calcul - AVEC PROTECTION */}
                <Box mt={6} p={4} bg="gray.50" borderRadius="lg">
                  <Heading color="gray.600" size="md" mb={5} textDecoration="underline">ℹ️ Détail du Calcul</Heading>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text color="green" fontWeight="bold">💰 Total Dépôts Plans:</Text>
                      <Text color="green" fontWeight="bold">{safeToFixed(report.totalInvestments)} USDC</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="bold" color="yellow.600">🥞 Récompenses Pancake:</Text>
                      <Text fontWeight="bold" color="yellow.600">+{safeToFixed(report.pancakeRewards)} USDC</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="bold" color="teal.600">👤 Retours Owner:</Text>
                      <Text fontWeight="bold" color="teal.600">+{safeToFixed(report.ownerReturns)} USDC</Text>
                    </HStack>
                    <Box h="1px" bg="gray.300" />
                    <HStack justify="space-between">
                      <Text color="green.600" fontWeight="bold">🎯 Total Retours:</Text>
                      <Text fontWeight="bold" color="green.600">{safeToFixed(report.totalExternalReturns)} USDC</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="orange" fontWeight="bold">📊 Performance:</Text>
                      <Text fontWeight="bold" color={(report.performancePercentage || 0) >= 5 ? "green.600" : "orange.600"}>
                        {safeToFixed(report.totalExternalReturns)} ÷ {safeToFixed(report.totalInvestments)} = {safeToFixed(report.performancePercentage)}%
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              </CardBody>
            </Card>

            {/* Conclusions - AVEC PROTECTION */}
            <Alert status={(report.netFlowSmartContract || 0) >= 0 ? "success" : "warning"}>
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">
                  {(report.netFlowSmartContract || 0) >= 0 ? "✅ Flux Positif" : "⚠️ Flux Négatif"} - {report.period}
                </Text>
                <Text fontSize="sm">
                  Entrées: {safeToFixed(report.totalEntries)} USDC | 
                  Sorties: {safeToFixed(report.totalExits)} USDC | 
                  Net: {(report.netFlowSmartContract || 0) >= 0 ? "+" : ""}{safeToFixed(report.netFlowSmartContract)} USDC | 
                  Performance: {safeToFixed(report.performancePercentage, 1)}%
                  {report.dateFilter !== 'all' && ` (${safeToFixed(report.annualizedReturnPercentage, 1)}% annualisé)`}
                </Text>
              </Box>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button leftIcon={<Calendar size={16} />} colorScheme="green">
              Exporter PDF
            </Button>
            <Button leftIcon={<FileText size={16} />} colorScheme="blue">
              Exporter CSV
            </Button>
            <Button variant="ghost" onClick={() => setShowReport(false)}>
              Fermer
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

  const renderTransactionTable = (type: 'normal' | 'internal' | 'token') => {
    let data: any[] = [];
    let columns: string[] = [];

    switch (type) {
      case 'normal':
        data = transactions.filter(tx => filterByDateUnified(tx.timeStamp));
        columns = ['Hash', 'Méthode', 'Direction', 'Montant (BNB)', 'Frais (BNB)', 'Date'];
        break;
      case 'internal':
        data = internalTxs.filter(tx => filterByDateUnified(tx.timeStamp));
        columns = ['Hash', 'Type', 'Direction', 'Montant (BNB)', 'Date'];
        break;
      case 'token':
        data = tokenTransfers.filter(tx => filterByDateUnified(tx.timeStamp));
        columns = ['Hash', 'Token', 'Direction', 'Montant', 'Date'];
        break;
    }

    return (
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              {columns.map((col, idx) => (
                <Th key={idx}>{col}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {data.slice(0, 50).map((item, idx) => (
              <Tr key={idx}>
                <Td>
                  <Flex align="center">
                    <Link 
                      href={`https://bscscan.com/tx/${item.hash}`} 
                      isExternal 
                      color="blue.500"
                      fontSize="sm"
                      display="flex"
                      alignItems="center"
                    >
                      {item.hash.slice(0, 10)}...
                      <Box ml={1}>
                        <ExternalLink size={12} />
                      </Box>
                    </Link>
                  </Flex>
                </Td>
                
                {type === 'normal' && (
                  <>
                    <Td>
                      <Badge 
                        colorScheme={getTransactionMethod(item) === 'Transfer' ? 'blue' : 'purple'}
                        size="sm"
                      >
                        {getTransactionMethod(item)}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack>
                        <DirectionIcon direction={getDirection(item.from, item.to)} />
                        <Text color={getDirection(item.from, item.to) === 'in' ? 'green.500' : 'red.500'}>
                          {getDirection(item.from, item.to) === 'in' ? 'Entrée' : 'Sortie'}
                        </Text>
                      </HStack>
                    </Td>
                    <Td>{formatValue(item.value)}</Td>
                    <Td>{formatValue((parseFloat(item.gasUsed) * parseFloat(item.gasPrice)).toString())}</Td>
                  </>
                )}
                
                {type === 'internal' && (
                  <>
                    <Td>
                      <Badge colorScheme="purple" size="sm">
                        {item.type || 'call'}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack>
                        <DirectionIcon direction={getDirection(item.from, item.to)} />
                        <Text color={getDirection(item.from, item.to) === 'in' ? 'green.500' : 'red.500'}>
                          {getDirection(item.from, item.to) === 'in' ? 'Entrée' : 'Sortie'}
                        </Text>
                      </HStack>
                    </Td>
                    <Td>{formatValue(item.value)}</Td>
                  </>
                )}
                
                {type === 'token' && (
                  <>
                    <Td>
                      <Badge colorScheme="green" size="sm">
                        {item.tokenSymbol}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack>
                        <DirectionIcon direction={getDirection(item.from, item.to)} />
                        <Text color={getDirection(item.from, item.to) === 'in' ? 'green.500' : 'red.500'}>
                          {getDirection(item.from, item.to) === 'in' ? 'Entrée' : 'Sortie'}
                          </Text>
                      </HStack>
                    </Td>
                    <Td>{formatValue(item.value, parseInt(item.tokenDecimal))}</Td>
                  </>
                )}
                
                <Td fontSize="sm">{formatDate(item.timeStamp)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        {data.length === 0 && (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">Aucune transaction trouvée pour cette période</Text>
          </Box>
        )}
      </TableContainer>
    );
  };

  if (!API_KEY) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          Clé API BSCScan non configurée. Vérifiez votre fichier .env (VITE_BSCSCAN_API_KEY)
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* En-tête principal avec onglets */}
        <Card bg={bgColor}>
          <CardBody>
            <Tabs index={activeCategory} onChange={setActiveCategory}>
              <TabList>
                <Tab>💰 Monitoring Wallet</Tab>
                <Tab>🏦 Monitoring SmartContrat</Tab>
              </TabList>

              <TabPanels>
                {/* Onglet Monitoring Wallet */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    {/* En-tête avec champ de saisie */}
                    <VStack spacing={4} align="stretch">
                      <Heading size="lg">💰 Monitoring Wallet</Heading>
                      
                      <Box>
                        <Text fontSize="sm" color="gray.600" mb={2}>
                          Adresse du wallet à analyser :
                        </Text>
                        <HStack spacing={3}>
                          <InputGroup>
                            <Input
                              placeholder="0x6Cf9fA1738C0c2AE386EF8a75025B53DEa95407a"
                              value={walletAddress}
                              onChange={(e) => handleAddressChange(e.target.value)}
                              fontSize="sm"
                              fontFamily="monospace"
                            />
                            <InputRightElement>
                              <Search size={16} color="gray" />
                            </InputRightElement>
                          </InputGroup>
                          <Button 
                            onClick={handleSearch} 
                            isLoading={loading} 
                            colorScheme="blue"
                            leftIcon={<Search size={16} />}
                          >
                            Analyser
                          </Button>
                        </HStack>
                        
                        {walletAddress && (
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            Wallet actuel: {walletAddress}
                          </Text>
                        )}
                      </Box>
                    </VStack>

                    {/* Contrôles */}
                    <HStack spacing={4}>
                      <Select 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)}
                        maxW="200px"
                      >
                        <option value="1d">Aujourd'hui</option>
                        <option value="7d">7 derniers jours</option>
                        <option value="30d">30 derniers jours</option>
                        <option value="90d">90 derniers jours</option>
                        <option value="all">Toutes</option>
                      </Select>
                      
                      <Button onClick={handleSearch} isLoading={loading} colorScheme="blue">
                        Actualiser
                      </Button>
                    </HStack>

                    {/* Erreur */}
                    {error && (
                      <Alert status="error">
                        <AlertIcon />
                        {error}
                      </Alert>
                    )}

                    {/* Loading */}
                    {loading && (
                      <Box textAlign="center" py={8}>
                        <Spinner size="lg" />
                        <Text mt={2}>Chargement des données BSCScan...</Text>
                      </Box>
                    )}

                    {/* Résumé */}
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Total Entré</StatLabel>
                        <StatNumber color="green.500">{formatValueWithUSD(summary.totalIn)}</StatNumber>
                        <StatHelpText>
                          <StatArrow type="increase" />
                          Toutes entrées
                        </StatHelpText>
                      </Stat>

                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Total Sorti</StatLabel>
                        <StatNumber color="red.500">{formatValueWithUSD(summary.totalOut)}</StatNumber>
                        <StatHelpText>
                          <StatArrow type="decrease" />
                          Toutes sorties
                        </StatHelpText>
                      </Stat>

                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Frais Totaux</StatLabel>
                        <StatNumber color="orange.500">{formatValueWithUSD(summary.totalFees)}</StatNumber>
                        <StatHelpText>Gas utilisé</StatHelpText>
                      </Stat>

                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Flux Net</StatLabel>
                        <StatNumber color={summary.netFlow >= 0 ? "green.500" : "red.500"}>
                          {formatValueWithUSD(summary.netFlow)}
                        </StatNumber>
                        <StatHelpText>
                          <StatArrow type={summary.netFlow >= 0 ? "increase" : "decrease"} />
                          Entrées - Sorties
                        </StatHelpText>
                      </Stat>
                    </SimpleGrid>

                    {/* Répartition par type */}
                    <Card bg={bgColor}>
                      <CardHeader>
                        <Heading size="md">Répartition par Type</Heading>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={3} spacing={4}>
                          <Box textAlign="center" p={4} bg="blue.100" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="blue.900">
                              {summary.byType.normal}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Transactions</Text>
                          </Box>
                          <Box textAlign="center" p={4} bg="purple.100" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="purple.900">
                              {summary.byType.internal}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Internes</Text>
                          </Box>
                          <Box textAlign="center" p={4} bg="green.100" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="green.900">
                              {summary.byType.token}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Tokens BEP-20</Text>
                          </Box>
                        </SimpleGrid>
                      </CardBody>
                    </Card>

                    {/* Onglets des transactions wallet */}
                    <Card bg={bgColor}>
                      <CardBody p={0}>
                        <Tabs>
                          <TabList>
                            <Tab>🔄 Transactions ({summary.byType.normal})</Tab>
                            <Tab>🔗 Internes ({summary.byType.internal})</Tab>
                            <Tab>🪙 Tokens BEP-20 ({summary.byType.token})</Tab>
                          </TabList>

                          <TabPanels>
                            <TabPanel>
                              {renderTransactionTable('normal')}
                            </TabPanel>
                            <TabPanel>
                              {renderTransactionTable('internal')}
                            </TabPanel>
                            <TabPanel>
                              {renderTransactionTable('token')}
                            </TabPanel>
                          </TabPanels>
                        </Tabs>
                      </CardBody>
                    </Card>
                  </VStack>
                </TabPanel>

                {/* Onglet Monitoring SmartContrat */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    {/* En-tête Smart Contract */}
                    <VStack spacing={4} align="stretch">
                      <Heading size="lg">🏦 Monitoring SmartContrat</Heading>
                      
                      <Box>
                        <Text fontSize="sm" color="gray.600" mb={2}>
                          Smart Contract analysé :
                        </Text>
                        <HStack spacing={3}>
                          <InputGroup>
                            <Input
                              value={SMART_CONTRACT_ADDRESS}
                              isReadOnly
                              fontSize="sm"
                              fontFamily="monospace"
                              bg="gray.50"
                              color="gray.700"
                            />
                            <InputRightElement>
                              <Link href={`https://bscscan.com/address/${SMART_CONTRACT_ADDRESS}`} isExternal>
                                <ExternalLink size={16} color="blue" />
                              </Link>
                            </InputRightElement>
                          </InputGroup>
                          <Button 
                            onClick={handleSmartContractRefresh} 
                            isLoading={smartContractLoading} 
                            colorScheme="purple"
                            leftIcon={<Search size={16} />}
                          >
                            Actualiser
                          </Button>
                        </HStack>
                        
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Solde USDC: {contractUSDCBalance} USDC
                        </Text>
                      </Box>
                    </VStack>

                    {/* Contrôles Smart Contract */}
                    <VStack spacing={4} align="stretch">
  <HStack spacing={4}>
    <Select 
      value={dateFilter} 
      onChange={(e) => setDateFilter(e.target.value)}
      maxW="200px"
    >
      <option value="1d">Aujourd'hui</option>
      <option value="7d">7 derniers jours</option>
      <option value="30d">30 derniers jours</option>
      <option value="90d">90 derniers jours</option>
      <option value="all">Toutes</option>
      <option value="custom">Période personnalisée</option>
    </Select>
    
    <Button onClick={handleSmartContractRefresh} isLoading={smartContractLoading} colorScheme="purple">
      Actualiser Smart Contract
    </Button>
  </HStack>

  {dateFilter === 'custom' && (
    <HStack spacing={4}>
      <Box>
        <Text fontSize="sm" mb={1}>Date de début :</Text>
        <Input 
          type="date" 
          value={customStartDate}
          onChange={(e) => setCustomStartDate(e.target.value)}
          size="sm"
        />
      </Box>
      <Box>
        <Text fontSize="sm" mb={1}>Date de fin :</Text>
        <Input 
          type="date" 
          value={customEndDate}
          onChange={(e) => setCustomEndDate(e.target.value)}
          size="sm"
        />
      </Box>
    </HStack>
  )}
  
  <Text fontSize="sm" color="gray.600">
    Période active : {
      dateFilter === 'custom' && customStartDate && customEndDate
        ? `${new Date(customStartDate).toLocaleDateString('fr-FR')} au ${new Date(customEndDate).toLocaleDateString('fr-FR')}`
        : dateFilter === '1d' ? 'Aujourd\'hui'
        : dateFilter === '7d' ? '7 derniers jours'
        : dateFilter === '30d' ? '30 derniers jours'
        : dateFilter === '90d' ? '90 derniers jours'
        : 'Toutes les transactions'
    }
  </Text>
</VStack>

                    {/* Loading Smart Contract */}
                    {smartContractLoading && (
                      <Box textAlign="center" py={8}>
                        <Spinner size="lg" color="purple.500" />
                        <Text mt={2}>Chargement des transactions du smart contract...</Text>
                      </Box>
                    )}

                    {/* Résumé Smart Contract avec filtrage par période */}
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Dépôts Plans</StatLabel>
                        <StatNumber color="green.500">{smartContractSummary.totalDeposits.toFixed(2)} USDC</StatNumber>
                        <StatHelpText>
                          <StatArrow type="increase" />
                          {smartContractSummary.byMethod.deposits} transactions
                        </StatHelpText>
                      </Stat>

                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Récompenses Pancake</StatLabel>
                        <StatNumber color="yellow.500">{smartContractSummary.totalPancakeRewards.toFixed(2)} USDC</StatNumber>
                        <StatHelpText>
                          <StatArrow type="increase" />
                          {smartContractSummary.byMethod.pancakeRewards} entrées
                        </StatHelpText>
                      </Stat>

                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Retour Owner</StatLabel>
                        <StatNumber color="teal.500">{smartContractSummary.totalOwnerReturns.toFixed(2)} USDC</StatNumber>
                        <StatHelpText>
                          <StatArrow type="increase" />
                          {smartContractSummary.byMethod.ownerReturns} transferts
                        </StatHelpText>
                      </Stat>

                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Vers Stratégies</StatLabel>
                        <StatNumber color="purple.500">{smartContractSummary.totalToStrategies.toFixed(2)} USDC</StatNumber>
                        <StatHelpText>
                          <StatArrow type="decrease" />
                          {smartContractSummary.byMethod.toStrategies} transferts
                        </StatHelpText>
                      </Stat>

                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Retraits Récompenses</StatLabel>
                        <StatNumber color="blue.500">{smartContractSummary.totalWithdrawals.toFixed(2)} USDC</StatNumber>
                        <StatHelpText>
                          <StatArrow type="decrease" />
                          {smartContractSummary.byMethod.withdrawals} transactions
                        </StatHelpText>
                      </Stat>

                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Retraits Capitaux</StatLabel>
                        <StatNumber color="orange.500">{smartContractSummary.totalCapitalWithdrawals.toFixed(2)} USDC</StatNumber>
                        <StatHelpText>
                          <StatArrow type="decrease" />
                          {smartContractSummary.byMethod.capitalWithdrawals} retraits
                        </StatHelpText>
                      </Stat>

                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Frais 2%</StatLabel>
                        <StatNumber color="red.500">{smartContractSummary.totalFees.toFixed(2)} USDC</StatNumber>
                        <StatHelpText>
                          {smartContractSummary.byMethod.fees} prélèvements
                        </StatHelpText>
                      </Stat>
                    </SimpleGrid>

                    {/* Répartition par méthode Smart Contract */}
                    <Card bg={bgColor}>
                      <CardHeader>
                        <Heading size="md">Répartition par Méthode (Période filtrée: {dateFilter})</Heading>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={{ base: 2, md: 3, lg: 7 }} spacing={4}>
                          <Box textAlign="center" p={4} bg="green.100" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="green.900">
                              {smartContractSummary.byMethod.deposits}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Dépôts Plans</Text>
                            <Text fontSize="xs" color="gray.500">
                              {smartContractSummary.totalDeposits.toFixed(0)} USDC
                            </Text>
                          </Box>
                          
                          <Box textAlign="center" p={4} bg="yellow.100" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="yellow.700">
                              {smartContractSummary.byMethod.pancakeRewards}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Récompenses Pancake</Text>
                            <Text fontSize="xs" color="gray.500">
                              {smartContractSummary.totalPancakeRewards.toFixed(0)} USDC
                            </Text>
                          </Box>

                          <Box textAlign="center" p={4} bg="teal.100" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="teal.900">
                              {smartContractSummary.byMethod.ownerReturns}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Retour Owner</Text>
                            <Text fontSize="xs" color="gray.500">
                              {smartContractSummary.totalOwnerReturns.toFixed(0)} USDC
                            </Text>
                          </Box>
                          
                          <Box textAlign="center" p={4} bg="purple.100" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="purple.900">
                              {smartContractSummary.byMethod.toStrategies}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Vers Stratégies</Text>
                            <Text fontSize="xs" color="gray.500">
                              {smartContractSummary.totalToStrategies.toFixed(0)} USDC
                            </Text>
                          </Box>
                          
                          <Box textAlign="center" p={4} bg="blue.100" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="blue.900">
                              {smartContractSummary.byMethod.withdrawals}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Retraits Récompenses</Text>
                            <Text fontSize="xs" color="gray.500">
                              {smartContractSummary.totalWithdrawals.toFixed(0)} USDC
                            </Text>
                          </Box>
                          
                          <Box textAlign="center" p={4} bg="orange.100" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="orange.900">
                              {smartContractSummary.byMethod.capitalWithdrawals}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Retraits Capitaux</Text>
                            <Text fontSize="xs" color="gray.500">
                              {smartContractSummary.totalCapitalWithdrawals.toFixed(0)} USDC
                            </Text>
                          </Box>
                          
                          <Box textAlign="center" p={4} bg="red.100" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="red.900">
                              {smartContractSummary.byMethod.fees}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Frais 2%</Text>
                            <Text fontSize="xs" color="gray.500">
                              {smartContractSummary.totalFees.toFixed(0)} USDC
                            </Text>
                          </Box>
                        </SimpleGrid>
                      </CardBody>
                    </Card>

                    {/* Tableau des transactions Smart Contract */}
                    <Card bg={bgColor}>
                      <CardHeader>
                        <HStack justify="space-between">
                          <Heading size="md">
                            🏦 Transactions Smart Contract ({smartContractSummary.transactionCount})
                          </Heading>
                          <Badge colorScheme="purple" p={2}>
                            Token Transfers USDC - Filtrées par période
                          </Badge>
                        </HStack>
                      </CardHeader>
                      <CardBody p={0}>
                        {renderSmartContractTable()}
                      </CardBody>
                    </Card>

                    {/* Analyse détaillée Smart Contract */}
                    <Card bg={bgColor}>
                      <CardHeader>
                        <Heading size="md" color="purple.600">📊 Analyse Détaillée - Période: {dateFilter}</Heading>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                          <VStack spacing={3} align="stretch">
                            <Text fontWeight="bold" color="green.600">Flux Entrants (USDC)</Text>
                            <HStack justify="space-between">
                              <Text>Dépôts Plans:</Text>
                              <Text fontWeight="bold" color="green.500">
                                +{smartContractSummary.totalDeposits.toFixed(2)} USDC
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Récompenses Pancake:</Text>
                              <Text fontWeight="bold" color="yellow.500">
                                +{smartContractSummary.totalPancakeRewards.toFixed(2)} USDC
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Retour Owner:</Text>
                              <Text fontWeight="bold" color="teal.500">
                                +{smartContractSummary.totalOwnerReturns.toFixed(2)} USDC
                              </Text>
                            </HStack>
                            <Box h="1px" bg="gray.200" />
                            <HStack justify="space-between">
                              <Text fontWeight="bold">Total entrées:</Text>
                              <Text fontWeight="bold" color="green.500">
                                +{(smartContractSummary.totalDeposits + 
                                   smartContractSummary.totalPancakeRewards + 
                                   smartContractSummary.totalOwnerReturns).toFixed(2)} USDC
                              </Text>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              Montant moyen par dépôt: {
                                smartContractSummary.byMethod.deposits > 0 
                                  ? (smartContractSummary.totalDeposits / smartContractSummary.byMethod.deposits).toFixed(2)
                                  : '0'
                              } USDC
                            </Text>
                          </VStack>
                          
                          <VStack spacing={3} align="stretch">
                            <Text fontWeight="bold" color="red.600">Flux Sortants (USDC)</Text>
                            <HStack justify="space-between">
                              <Text>Vers Stratégies:</Text>
                              <Text fontWeight="bold" color="purple.500">
                                -{smartContractSummary.totalToStrategies.toFixed(2)} USDC
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Retraits récompenses:</Text>
                              <Text fontWeight="bold" color="blue.500">
                                -{smartContractSummary.totalWithdrawals.toFixed(2)} USDC
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Retraits capitaux:</Text>
                              <Text fontWeight="bold" color="orange.500">
                                -{smartContractSummary.totalCapitalWithdrawals.toFixed(2)} USDC
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Frais 2%:</Text>
                              <Text fontWeight="bold" color="red.500">
                                -{smartContractSummary.totalFees.toFixed(2)} USDC
                              </Text>
                            </HStack>
                            <Box h="1px" bg="gray.200" />
                            <HStack justify="space-between">
                              <Text fontWeight="bold">Total sorties:</Text>
                              <Text fontWeight="bold" color="red.500">
                                -{(smartContractSummary.totalToStrategies + 
                                   smartContractSummary.totalWithdrawals + 
                                   smartContractSummary.totalCapitalWithdrawals + 
                                   smartContractSummary.totalFees).toFixed(2)} USDC
                              </Text>
                            </HStack>
                          </VStack>
                        </SimpleGrid>

                        <Box mt={6} p={4} bg="gray.50" borderRadius="lg">
                          <HStack justify="space-between">
                            <Text fontSize="lg" fontWeight="bold">Flux Net du Contrat (période {dateFilter}):</Text>
                            <Text 
                              fontSize="lg" 
                              fontWeight="bold" 
                              color={
                                ((smartContractSummary.totalDeposits + 
                                  smartContractSummary.totalPancakeRewards + 
                                  smartContractSummary.totalOwnerReturns) - 
                                 (smartContractSummary.totalToStrategies + 
                                  smartContractSummary.totalWithdrawals + 
                                  smartContractSummary.totalCapitalWithdrawals + 
                                  smartContractSummary.totalFees)) >= 0 ? "green.500" : "red.500"
                              }
                            >
                              {((smartContractSummary.totalDeposits + 
                                 smartContractSummary.totalPancakeRewards + 
                                 smartContractSummary.totalOwnerReturns) - 
                                (smartContractSummary.totalToStrategies + 
                                 smartContractSummary.totalWithdrawals + 
                                 smartContractSummary.totalCapitalWithdrawals + 
                                 smartContractSummary.totalFees)) >= 0 ? "+" : ""}
                              {((smartContractSummary.totalDeposits + 
                                 smartContractSummary.totalPancakeRewards + 
                                 smartContractSummary.totalOwnerReturns) - 
                                (smartContractSummary.totalToStrategies + 
                                 smartContractSummary.totalWithdrawals + 
                                 smartContractSummary.totalCapitalWithdrawals + 
                                 smartContractSummary.totalFees)).toFixed(2)} USDC
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600" mt={1}>
                            Solde actuel du contrat: {contractUSDCBalance} USDC
                          </Text>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            Note: Le flux net est calculé pour la période sélectionnée ({dateFilter}), 
                            tandis que le solde du contrat représente le total cumulé depuis le déploiement.
                          </Text>
                        </Box>
                      </CardBody>
                    </Card>

                    {/* Wallets de référence */}
                    <Card bg={bgColor}>
                      <CardHeader>
                        <Heading size="md" color="teal.600">🔗 Wallets de Référence</Heading>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                              <Text fontWeight="bold">Smart Contract:</Text>
                              <Link href={`https://bscscan.com/address/${SMART_CONTRACT_ADDRESS}`} isExternal color="blue.500">
                                {SMART_CONTRACT_ADDRESS.slice(0, 15)}... <ExternalLink size={12} style={{display: 'inline'}} />
                              </Link>
                            </HStack>
                            
                            <HStack justify="space-between">
                              <Text fontWeight="bold">Wallet Frais (2%):</Text>
                              <Link href={`https://bscscan.com/address/${FEES_WALLET}`} isExternal color="red.500">
                                {FEES_WALLET.slice(0, 15)}... <ExternalLink size={12} style={{display: 'inline'}} />
                              </Link>
                            </HStack>
                          </VStack>
                          
                          <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                              <Text fontWeight="bold">Wallet Pancake:</Text>
                              <Link href={`https://bscscan.com/address/${PANCAKE_REWARDS_WALLET}`} isExternal color="yellow.500">
                                {PANCAKE_REWARDS_WALLET.slice(0, 15)}... <ExternalLink size={12} style={{display: 'inline'}} />
                              </Link>
                            </HStack>
                            
                            <HStack justify="space-between">
                              <Text fontWeight="bold">Wallet Stratégies:</Text>
                              <Link href={`https://bscscan.com/address/${STRATEGIES_WALLET}`} isExternal color="purple.500">
                                {STRATEGIES_WALLET.slice(0, 15)}... <ExternalLink size={12} style={{display: 'inline'}} />
                              </Link>
                            </HStack>
                          </VStack>
                        </SimpleGrid>
                      </CardBody>
                    </Card>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>

        {/* Boutons d'export globaux */}
        <HStack spacing={4}>
          <Button colorScheme="green" leftIcon={<Calendar size={16} />}>
            Exporter CSV
          </Button>
          <Button 
            colorScheme="blue" 
            leftIcon={<Info size={16} />}
            onClick={() => setShowReport(true)}
          >
            Générer Rapport
          </Button>
          <Button 
            colorScheme="purple" 
            leftIcon={<FileText size={16} />}
            onClick={handleSmartContractRefresh}
            isLoading={smartContractLoading}
          >
            Actualiser Smart Contract
          </Button>
        </HStack>

        {/* Modal du rapport de transparence */}
        <TransparencyReportModal />
      </VStack>
    </Box>
  );
};

export default WalletMonitoring;