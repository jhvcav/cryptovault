// src/pages/WalletMonitoring.tsx - VERSION COMPLÈTE AVEC SMART CONTRACT
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

// Nouvelle interface pour les transactions du smart contrat
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
  transactionCount: number;
  totalAdminDeposits: number;
  totalToStrategies: number;
  byMethod: {
    deposits: number;
    withdrawals: number;
    fees: number;
    capitalWithdrawals: number;
    adminDeposits: number;
    toStrategies: number;
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
  const [reportPeriod, setReportPeriod] = useState('current-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [contractUSDCBalance, setContractUSDCBalance] = useState('0');

  const API_KEY = import.meta.env.VITE_BSCSCAN_API_KEY;
  const BNB_PRICE_USD = 670;
  const SMART_CONTRACT_ADDRESS = "0x719fd9F511DDc561D03801161742D84ECb9445e9"; // Votre contrat

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Fonction pour décoder les méthodes du smart contrat depuis les token transfers
  const decodeSmartContractMethod = (tx: TokenTransfer): string => {
    // Récupérer les détails de la transaction normale pour obtenir functionName
    // Pour l'instant, on se base sur la direction et le pattern des montants
    
    const isFromContract = tx.from.toLowerCase() === SMART_CONTRACT_ADDRESS.toLowerCase();
    const isToContract = tx.to.toLowerCase() === SMART_CONTRACT_ADDRESS.toLowerCase();
    
    // Analyser les token transfers USDC
    if (tx.tokenSymbol === 'USDC') {
      if (isToContract) {
        // USDC entrant dans le contrat = Dépôt
        return 'Dépôt plan';
      } else if (isFromContract) {
        // USDC sortant du contrat = Retrait
        // Pour distinguer entre gains et capital, on pourrait analyser le montant
        // ou récupérer la méthode depuis la transaction normale
        return 'Retrait gains'; // Par défaut, à affiner
      }
    }
    
    return 'Méthode inconnue';
  };

  // Fonction pour récupérer les transactions du smart contrat (Token Transfers)
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

      console.log('Token transfers du smart contract:', tokenTxsData);

      if (tokenTxsData.status === '1' && tokenTxsData.result) {
        // Récupérer les transactions normales pour obtenir les méthodes
        const normalTxsResponse = await fetch(
          `${baseUrl}?module=account&action=txlist&address=${SMART_CONTRACT_ADDRESS}&sort=desc&apikey=${API_KEY}`
        );
        const normalTxsData = await normalTxsResponse.json();
        
        console.log('Transactions normales du smart contract:', normalTxsData);

        // Créer un mapping hash -> functionName
        const txMethodMap: { [key: string]: string } = {};
        if (normalTxsData.status === '1' && normalTxsData.result) {
          normalTxsData.result.forEach((tx: Transaction) => {
            if (tx.functionName) {
              txMethodMap[tx.hash] = tx.functionName;
            }
          });
        }

        // Traiter les token transfers avec décodage des méthodes
        const processedTxs: SmartContractTransaction[] = tokenTxsData.result
          .filter((tx: TokenTransfer) => tx.tokenSymbol === 'USDC') // Filtrer seulement USDC
          .map((tx: TokenTransfer) => {
  const functionName = txMethodMap[tx.hash] || '';
  let decodedMethod = '';
  let direction: 'in' | 'out' = 'in';

  // Décoder selon vos spécifications EXACTES
  if (functionName.toLowerCase().includes('claimrewards')) {
    decodedMethod = 'Retrait gains';
    direction = 'out';
  } else if (functionName.toLowerCase().includes('endstake')) {
    decodedMethod = 'Retrait Capital';
    direction = 'out';
  } else if (functionName.toLowerCase().includes('adminwithdraw')) {
    decodedMethod = 'Vers Stratégies';
    direction = 'out';
  } else if (functionName.toLowerCase().includes('stake')) {
    if (tx.to.toLowerCase() === SMART_CONTRACT_ADDRESS.toLowerCase()) {
      decodedMethod = 'Dépôt plan';
      direction = 'in';
    } else if (tx.from.toLowerCase() === SMART_CONTRACT_ADDRESS.toLowerCase()) {
      decodedMethod = '2% Frais';
      direction = 'out';
    }
  } else if (functionName.toLowerCase().includes('transfer') || functionName === '') {
    // Transfer ou pas de functionName détectée
    if (tx.to.toLowerCase() === SMART_CONTRACT_ADDRESS.toLowerCase()) {
      decodedMethod = 'Dépôt Admin';  // ← NOUVEAU : Transfer IN
      direction = 'in';
    } else if (tx.from.toLowerCase() === SMART_CONTRACT_ADDRESS.toLowerCase()) {
      decodedMethod = 'Autre'; // Transfer OUT = retrait gains
      direction = 'out';
    }
  } else {
    // Autres cas
    if (tx.to.toLowerCase() === SMART_CONTRACT_ADDRESS.toLowerCase()) {
      decodedMethod = 'Dépôt Admin';
      direction = 'in';
    } else {
      decodedMethod = 'Retrait gains';
      direction = 'out';
    }
  }

  const amountUSDC = (parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal))).toFixed(2);

  return {
    ...tx,
    decodedMethod,
    direction,
    amountUSDC,
    functionName
  };
})
          .filter((tx: SmartContractTransaction) => 
            ['Retrait gains', 'Retrait Capital', 'Dépôt plan', '2% Frais', 'Dépôt Admin', 'Vers Stratégies'].includes(tx.decodedMethod)
          );

        console.log('Transactions filtrées et décodées:', processedTxs);
        setSmartContractTxs(processedTxs);
      }

    } catch (err) {
      setError('Erreur lors de la récupération des données du smart contract');
      console.error('Smart Contract API Error:', err);
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
      
      const usdcAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"; // USDC BSC
      
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

  // Fonction pour récupérer les données BSCScan (Monitoring Wallet - inchangé)
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
    // Charger automatiquement les données du smart contract
    fetchSmartContractData();
    getContractUSDCBalance();
  }, []);

  const filterByDate = (timestamp: string): boolean => {
    const txDate = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diffTime = now.getTime() - txDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    switch (dateFilter) {
      case '1d': return diffDays <= 1;
      case '7d': return diffDays <= 7;
      case '30d': return diffDays <= 30;
      case '90d': return diffDays <= 90;
      default: return true;
    }
  };

  const calculateSummary = (): WalletSummary => {
    const filteredNormal = transactions.filter(tx => filterByDate(tx.timeStamp));
    const filteredInternal = internalTxs.filter(tx => filterByDate(tx.timeStamp));
    const filteredTokens = tokenTransfers.filter(tx => filterByDate(tx.timeStamp));

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
  const filteredTxs = smartContractTxs.filter(tx => filterByDate(tx.timeStamp));

  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalFees = 0;
  let totalCapitalWithdrawals = 0;
  let totalAdminDeposits = 0;
  let totalToStrategies = 0;
  let adminDeposits = 0;

  const byMethod = {
    deposits: 0,
    withdrawals: 0,
    fees: 0,
    capitalWithdrawals: 0,
    adminDeposits: 0,
    toStrategies: 0,
  };

  filteredTxs.forEach(tx => {
    const amount = parseFloat(tx.amountUSDC);
    
    switch (tx.decodedMethod) {
      case 'Dépôt plan':
        totalDeposits += amount;
        byMethod.deposits++;
        break;
      case 'Retrait gains':
        totalWithdrawals += amount;
        byMethod.withdrawals++;
        break;
      case '2% Frais':
        totalFees += amount;
        byMethod.fees++;
        break;
      case 'Retrait Capital':
        totalCapitalWithdrawals += amount;
        byMethod.capitalWithdrawals++;
        break;
      case 'Dépôt Admin':  // ← NOUVEAU CAS
        adminDeposits += amount;
        byMethod.adminDeposits++;
        break;
      case 'Vers Stratégies':  // ← NOUVEAU CAS
        totalToStrategies += amount;
        byMethod.toStrategies++;
        break;
    }
  });

  return {
    totalDeposits,
    totalWithdrawals,
    totalFees,
    totalCapitalWithdrawals,
    totalAdminDeposits,
    transactionCount: filteredTxs.length,
    byMethod,
    totalToStrategies,
    adminDeposits,
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
    const filteredData = smartContractTxs.filter(tx => filterByDate(tx.timeStamp));

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
                      tx.decodedMethod === 'Dépôt plan' ? 'green' :
                      tx.decodedMethod === 'Dépôt Admin' ? 'cyan' :
                      tx.decodedMethod === 'Vers Stratégies' ? 'purple' :
                      tx.decodedMethod === 'Retrait gains' ? 'blue' :
                      tx.decodedMethod === 'Retrait Capital' ? 'orange' :
                      tx.decodedMethod === '2% Frais' ? 'red' : 'gray'
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

  // Fonction pour analyser les transactions et générer le rapport (inchangé)
  const generateTransparencyReport = () => {
    const now = new Date();
    let startDate: Date, endDate: Date, periodLabel: string;
    
    switch (reportPeriod) {
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        periodLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        break;
        
      case 'previous-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        periodLabel = startDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        break;
        
      case 'current-quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        endDate = new Date(now.getFullYear(), quarterStart + 3, 0);
        periodLabel = `T${Math.floor(quarterStart / 3) + 1} ${now.getFullYear()}`;
        break;
        
      case 'custom':
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        periodLabel = `${customStartDate} au ${customEndDate}`;
        break;
        
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        periodLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    
    const filteredTransactions = transactions.filter(tx => {
      const txDate = new Date(parseInt(tx.timeStamp) * 1000);
      return txDate >= startDate && txDate <= endDate;
    });
    
    const filteredTokens = tokenTransfers.filter(tx => {
      const txDate = new Date(parseInt(tx.timeStamp) * 1000);
      return txDate >= startDate && txDate <= endDate;
    });

    // Ajouter les données du smart contract au rapport
    const filteredSmartContract = smartContractTxs.filter(tx => {
      const txDate = new Date(parseInt(tx.timeStamp) * 1000);
      return txDate >= startDate && txDate <= endDate;
    });
    
    let userDeposits = 0;
    let platformInvestments = 0;
    let platformReturns = 0;
    let userWithdrawals = 0;
    let gasFees = 0;
    let claimRewards = 0;
    let endStake = 0;

    // Analyser les transactions du smart contract
    filteredSmartContract.forEach(tx => {
      const amount = parseFloat(tx.amountUSDC);
      
      switch (tx.decodedMethod) {
        case 'Dépôt plan':
          userDeposits += amount;
          break;
        case 'Dépôt Admin': 
          //Ne pas ajouter à usersDeposits
          break;
        case 'Retrait gains':
          claimRewards += amount;
          break;
        case 'Retrait Capital':
          endStake += amount;
          break;
        case '2% Frais':
          // Les frais sont comptabilisés séparément
          break;
      }
    });

      // userWithdrawals = TOTAL des deux types de retraits
      userWithdrawals = claimRewards + endStake;
    
    filteredTransactions.forEach(tx => {
      const value = parseFloat(tx.value) / Math.pow(10, 18);
      const fee = (parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice)) / Math.pow(10, 18);
      gasFees += fee;
      
      if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
        platformReturns += value;
      } else {
        platformInvestments += value;
      }
    });
    
    /*
    filteredTokens.forEach(tx => {
      const value = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));
      
      if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
        if (tx.tokenSymbol === 'USDT' || tx.tokenSymbol === 'USDC') {
          userDeposits += value;
        }
      } else {
        if (tx.tokenSymbol === 'USDT' || tx.tokenSymbol === 'USDC') {
          userWithdrawals += value;
        }
      }
    });
    */
    
    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const estimatedBeginnerReturns = (userDeposits * 0.10 * daysInPeriod) / 365;
    const estimatedGrowthReturns = (userDeposits * 0.15 * daysInPeriod) / 365;
    const estimatedPremiumReturns = (userDeposits * 0.20 * daysInPeriod) / 365;
    const totalEstimatedReturns = estimatedBeginnerReturns + estimatedGrowthReturns + estimatedPremiumReturns;
    const rendements = smartContractSummary.totalWithdrawals + smartContractSummary.totalCapitalWithdrawals;
    
    return {
      period: periodLabel,
      userDeposits,
      platformInvestments,
      platformReturns,
      userWithdrawals,
      gasFees,
      netFlow: platformReturns - platformInvestments,
      estimatedReturns: totalEstimatedReturns,
      actualReturns: claimRewards + endStake,
      claimRewards,
      endStake,
      performance: (smartContractSummary.totalWithdrawals + smartContractSummary.totalCapitalWithdrawals) > 0 ? 
  (((smartContractSummary.totalWithdrawals + smartContractSummary.totalCapitalWithdrawals) / totalEstimatedReturns) * 100) : 0,
      transactionCount: filteredTransactions.length + filteredTokens.length + filteredSmartContract.length,
      walletAddress,
      contractBalance: contractUSDCBalance,
      startDate: startDate.toLocaleDateString('fr-FR'),
      endDate: endDate.toLocaleDateString('fr-FR'),
      smartContractSummary,
    };
  };

  const report = generateTransparencyReport();

  // Composant du rapport de transparence avec données Smart Contract
  const TransparencyReportModal = () => (
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
            {/* Sélecteur de période */}
            <Card>
              <CardHeader>
                <Heading size="md">📅 Période du Rapport</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={4}>
                    <Select 
                      value={reportPeriod} 
                      onChange={(e) => setReportPeriod(e.target.value)}
                      maxW="300px"
                    >
                      <option value="current-month">Mois en cours</option>
                      <option value="previous-month">Mois précédent</option>
                      <option value="current-quarter">Trimestre en cours</option>
                      <option value="custom">Période personnalisée</option>
                    </Select>
                    
                    <Button onClick={() => window.location.reload()} colorScheme="blue" size="sm">
                      Actualiser
                    </Button>
                  </HStack>
                  
                  {reportPeriod === 'custom' && (
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
                  
                  <Text fontSize="sm" color="gray.600">
                    Période analysée : {report.startDate} au {report.endDate}
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            {/* Résumé Smart Contract */}
            <Card>
              <CardHeader>
                <Heading size="md" color="purple.600">🏦 Résumé Smart Contract</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                  <Stat>
                    <StatLabel>Dépôts Plans</StatLabel>
                    <StatNumber color="green.500">
                      {smartContractSummary.totalDeposits.toFixed(2)} USDC
                    </StatNumber>
                    <StatHelpText>{smartContractSummary.byMethod.deposits} transactions</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Retraits Gains</StatLabel>
                    <StatNumber color="blue.500">
                      {report.claimRewards.toFixed(2)} USDC
                    </StatNumber>
                    <StatHelpText>{smartContractSummary.byMethod.withdrawals} Claim Rewards</StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Retraits Capital</StatLabel>
                    <StatNumber color="orange.500">
                      {report.endStake.toFixed(2)} USDC
                    </StatNumber>
                    <StatHelpText>{smartContractSummary.byMethod.capitalWithdrawals} End Stake</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Frais 2%</StatLabel>
                    <StatNumber color="orange.500">
                      {smartContractSummary.totalFees.toFixed(2)} USDC
                    </StatNumber>
                    <StatHelpText>{smartContractSummary.byMethod.fees} transactions</StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Retraits Capital</StatLabel>
                    <StatNumber color="red.500">
                      {smartContractSummary.totalCapitalWithdrawals.toFixed(2)} USDC
                    </StatNumber>
                    <StatHelpText>{smartContractSummary.byMethod.capitalWithdrawals} transactions</StatHelpText>
                  </Stat>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Résumé Exécutif */}
            <Card>
              <CardHeader>
                <Heading size="md" color="blue.600">📊 Résumé Exécutif</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Stat>
                    <StatLabel>Dépôts Utilisateurs</StatLabel>
                    <StatNumber color="green.500">
                      {report.userDeposits.toFixed(2)} USDC
                    </StatNumber>
                    <StatHelpText>Fonds des plans d'investissement</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Rendements Générés</StatLabel>
                    <StatNumber color="blue.500">
                      {(report.claimRewards + report.endStake).toFixed(2)} USDC
                    </StatNumber>
                    <StatHelpText>
                      Claim Rewards + End Stake
                    </StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Flux Net</StatLabel>
                    <StatNumber color={report.netFlow >= 0 ? "green.500" : "red.500"}>
                      {formatValueWithUSD(Math.abs(report.netFlow))}
                    </StatNumber>
                    <StatHelpText>
                      {report.netFlow >= 0 ? "Bénéfice" : "Perte"} de la période
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Analyse des Flux Smart Contract */}
            <Card>
              <CardHeader>
                <Heading size="md" color="purple.600">💰 Analyse des Flux Smart Contract (USDC)</Heading>
              </CardHeader>
              <CardBody>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Type de Transaction</Th>
                        <Th>Montant USDC</Th>
                        <Th>Nombre de Transactions</Th>
                        <Th>Description</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>
                          <Badge colorScheme="green">Dépôts Plans</Badge>
                        </Td>
                        <Td>{smartContractSummary.totalDeposits.toFixed(2)} USDC</Td>
                        <Td>{smartContractSummary.byMethod.deposits}</Td>
                        <Td>Fonds investis par les utilisateurs</Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <Badge colorScheme="blue">Retraits Gains</Badge>
                        </Td>
                        <Td>{smartContractSummary.totalWithdrawals.toFixed(2)} USDC</Td>
                        <Td>{smartContractSummary.byMethod.withdrawals}</Td>
                        <Td>Profits redistribués aux utilisateurs</Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <Badge colorScheme="orange">Frais 2%</Badge>
                        </Td>
                        <Td>{smartContractSummary.totalFees.toFixed(2)} USDC</Td>
                        <Td>{smartContractSummary.byMethod.fees}</Td>
                        <Td>Frais de gestion prélevés</Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <Badge colorScheme="red">Retraits Capital</Badge>
                        </Td>
                        <Td>{smartContractSummary.totalCapitalWithdrawals.toFixed(2)} USDC</Td>
                        <Td>{smartContractSummary.byMethod.capitalWithdrawals}</Td>
                        <Td>Capital retiré par les utilisateurs</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

            {/* Performance des Plans */}
            <Card>
              <CardHeader>
                <Heading size="md" color="green.600">📈 Performance des Plans d'Investissement</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={3} spacing={4}>
                  <Box p={4} bg="blue.50" borderRadius="lg" textAlign="center">
                    <Text fontWeight="bold" color="blue.600">Plan Débutant</Text>
                    <Text fontSize="2xl" fontWeight="bold">10% APR</Text>
                    <Text fontSize="sm" color="gray.600">30 jours - Bloqué</Text>
                    <Text fontSize="sm" mt={2}>
                      Rendement estimé: {((smartContractSummary.totalDeposits * 0.10) / 12).toFixed(2)} USDC/mois
                    </Text>
                  </Box>
                  
                  <Box p={4} bg="purple.50" borderRadius="lg" textAlign="center">
                    <Text fontWeight="bold" color="purple.600">Plan Croissance</Text>
                    <Text fontSize="2xl" fontWeight="bold">15% APR</Text>
                    <Text fontSize="sm" color="gray.600">90 jours - Bloqué</Text>
                    <Text fontSize="sm" mt={2}>
                      Rendement estimé: {((smartContractSummary.totalDeposits * 0.15) / 12).toFixed(2)} USDC/mois
                    </Text>
                  </Box>
                  
                  <Box p={4} bg="yellow.50" borderRadius="lg" textAlign="center">
                    <Text fontWeight="bold" color="yellow.600">Plan Premium</Text>
                    <Text fontSize="2xl" fontWeight="bold">20% APR</Text>
                    <Text fontSize="sm" color="gray.600">180 jours - Bloqué</Text>
                    <Text fontSize="sm" mt={2}>
                      Rendement estimé: {((smartContractSummary.totalDeposits * 0.20) / 12).toFixed(2)} USDC/mois
                    </Text>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Traçabilité On-Chain */}
            <Card>
              <CardHeader>
                <Heading size="md" color="teal.600">🔗 Traçabilité On-Chain</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Wallet analysé:</Text>
                    <Link href={`https://bscscan.com/address/${walletAddress}`} isExternal color="blue.500">
                      {walletAddress.slice(0, 20)}... <ExternalLink size={12} style={{display: 'inline'}} />
                    </Link>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Smart Contract:</Text>
                    <Link href={`https://bscscan.com/address/${SMART_CONTRACT_ADDRESS}`} isExternal color="blue.500">
                      {SMART_CONTRACT_ADDRESS.slice(0, 20)}... <ExternalLink size={12} style={{display: 'inline'}} />
                    </Link>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Solde du contrat :</Text>
                    <Text>{report.contractBalance} USDC</Text>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Transactions analysées:</Text>
                    <Text>{report.transactionCount} transactions sur la période</Text>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Transactions Smart Contract:</Text>
                    <Text>{smartContractSummary.transactionCount} transactions USDC</Text>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Période du rapport:</Text>
                    <Text>{report.period}</Text>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Génération du rapport:</Text>
                    <Text>{new Date().toLocaleString('fr-FR')}</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Conclusions */}
            <Alert status={smartContractSummary.totalDeposits > smartContractSummary.totalWithdrawals ? "success" : "warning"}>
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">
                  {smartContractSummary.totalDeposits > smartContractSummary.totalWithdrawals ? "✅ Flux Positif Smart Contract" : "⚠️ Flux Négatif Smart Contract"}
                </Text>
                <Text fontSize="sm">
                  {smartContractSummary.totalDeposits > smartContractSummary.totalWithdrawals
                    ? `Les dépôts (${smartContractSummary.totalDeposits.toFixed(2)} USDC) dépassent les retraits (${(smartContractSummary.totalWithdrawals + smartContractSummary.totalCapitalWithdrawals).toFixed(2)} USDC). Le contrat accumule des fonds.`
                    : `Les retraits (${(smartContractSummary.totalWithdrawals + smartContractSummary.totalCapitalWithdrawals).toFixed(2)} USDC) dépassent les dépôts (${smartContractSummary.totalDeposits.toFixed(2)} USDC). Surveillance recommandée.`
                  }
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

  const renderTransactionTable = (type: 'normal' | 'internal' | 'token') => {
    let data: any[] = [];
    let columns: string[] = [];

    switch (type) {
      case 'normal':
        data = transactions.filter(tx => filterByDate(tx.timeStamp));
        columns = ['Hash', 'Méthode', 'Direction', 'Montant (BNB)', 'Frais (BNB)', 'Date'];
        break;
      case 'internal':
        data = internalTxs.filter(tx => filterByDate(tx.timeStamp));
        columns = ['Hash', 'Type', 'Direction', 'Montant (BNB)', 'Date'];
        break;
      case 'token':
        data = tokenTransfers.filter(tx => filterByDate(tx.timeStamp));
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
                {/* Onglet Monitoring Wallet (inchangé) */}
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
                              placeholder="0x1FF70C1DFc33F5DDdD1AD2b525a07b172182d8eF"
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

                {/* Nouvel Onglet Monitoring SmartContrat */}
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
                      
                      <Button onClick={handleSmartContractRefresh} isLoading={smartContractLoading} colorScheme="purple">
                        Actualiser Smart Contract
                      </Button>
                    </HStack>

                    {/* Loading Smart Contract */}
                    {smartContractLoading && (
                      <Box textAlign="center" py={8}>
                        <Spinner size="lg" color="purple.500" />
                        <Text mt={2}>Chargement des transactions du smart contract...</Text>
                      </Box>
                    )}

                    {/* Résumé Smart Contract */}
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Dépôts Plans</StatLabel>
                        <StatNumber color="green.500">{smartContractSummary.totalDeposits.toFixed(2)} USDC</StatNumber>
                        <StatHelpText>
                          <StatArrow type="increase" />
                          {smartContractSummary.byMethod.deposits} transactions
                        </StatHelpText>
                      </Stat>

                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Retraits Gains</StatLabel>
                        <StatNumber color="blue.500">{smartContractSummary.totalWithdrawals.toFixed(2)} USDC</StatNumber>
                        <StatHelpText>
                          <StatArrow type="decrease" />
                          {smartContractSummary.byMethod.withdrawals} transactions
                        </StatHelpText>
                      </Stat>

                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Frais 2%</StatLabel>
                        <StatNumber color="orange.500">{smartContractSummary.totalFees.toFixed(2)} USDC</StatNumber>
                        <StatHelpText>
                          {smartContractSummary.byMethod.fees} prélèvements
                        </StatHelpText>
                      </Stat>

                      <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                        <StatLabel color="black">Retraits Capital</StatLabel>
                        <StatNumber color="red.500">{smartContractSummary.totalCapitalWithdrawals.toFixed(2)} USDC</StatNumber>
                        <StatHelpText>
                          <StatArrow type="decrease" />
                          {smartContractSummary.byMethod.capitalWithdrawals} retraits
                        </StatHelpText>
                      </Stat>
                    </SimpleGrid>

                    {/* Répartition par méthode Smart Contract */}
                    <Card bg={bgColor}>
                      <CardHeader>
                        <Heading size="md">Répartition par Méthode</Heading>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={4} spacing={4}>
                          <Box textAlign="center" p={4} bg="green.100" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="green.900">
                              {smartContractSummary.byMethod.deposits}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Dépôts Plans</Text>
                            <Text fontSize="xs" color="gray.500">
                              {smartContractSummary.totalDeposits.toFixed(0)} USDC
                            </Text>
                          </Box>
                          <Box textAlign="center" p={4} bg="blue.100" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="blue.900">
                              {smartContractSummary.byMethod.withdrawals}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Retraits Gains</Text>
                            <Text fontSize="xs" color="gray.500">
                              {smartContractSummary.totalWithdrawals.toFixed(0)} USDC
                            </Text>
                          </Box>
                          <Box textAlign="center" p={4} bg="orange.100" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="orange.900">
                              {smartContractSummary.byMethod.fees}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Frais 2%</Text>
                            <Text fontSize="xs" color="gray.500">
                              {smartContractSummary.totalFees.toFixed(0)} USDC
                            </Text>
                          </Box>
                          <Box textAlign="center" p={4} bg="red.100" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="red.900">
                              {smartContractSummary.byMethod.capitalWithdrawals}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Retraits Capital</Text>
                            <Text fontSize="xs" color="gray.500">
                              {smartContractSummary.totalCapitalWithdrawals.toFixed(0)} USDC
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
                            Token Transfers USDC
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
                        <Heading size="md" color="purple.600">📊 Analyse Détaillée</Heading>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                          <VStack spacing={3} align="stretch">
                            <Text fontWeight="bold" color="purple.600">Flux Entrants (USDC)</Text>
                            <HStack justify="space-between">
                              <Text>Total dépôts:</Text>
                              <Text fontWeight="bold" color="green.500">
                                +{smartContractSummary.totalDeposits.toFixed(2)} USDC
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
                              <Text>Retraits gains:</Text>
                              <Text fontWeight="bold" color="blue.500">
                                -{smartContractSummary.totalWithdrawals.toFixed(2)} USDC
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Retraits capital:</Text>
                              <Text fontWeight="bold" color="red.500">
                                -{smartContractSummary.totalCapitalWithdrawals.toFixed(2)} USDC
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Frais 2%:</Text>
                              <Text fontWeight="bold" color="orange.500">
                                -{smartContractSummary.totalFees.toFixed(2)} USDC
                              </Text>
                            </HStack>
                            <Box h="1px" bg="gray.200" />
                            <HStack justify="space-between">
                              <Text fontWeight="bold">Total sorties:</Text>
                              <Text fontWeight="bold" color="red.500">
                                -{(smartContractSummary.totalWithdrawals + 
                                   smartContractSummary.totalCapitalWithdrawals + 
                                   smartContractSummary.totalFees).toFixed(2)} USDC
                              </Text>
                            </HStack>
                          </VStack>
                        </SimpleGrid>

                        <Box mt={6} p={4} bg="gray.50" borderRadius="lg">
                          <HStack justify="space-between">
                            <Text fontSize="lg" fontWeight="bold">Flux Net du Contrat:</Text>
                            <Text 
                              fontSize="lg" 
                              fontWeight="bold" 
                              color={
                                (smartContractSummary.totalDeposits - 
                                 smartContractSummary.totalWithdrawals - 
                                 smartContractSummary.totalCapitalWithdrawals - 
                                 smartContractSummary.totalFees) >= 0 ? "green.500" : "red.500"
                              }
                            >
                              {(smartContractSummary.totalDeposits - 
                                smartContractSummary.totalWithdrawals - 
                                smartContractSummary.totalCapitalWithdrawals - 
                                smartContractSummary.totalFees) >= 0 ? "+" : ""}
                              {(smartContractSummary.totalDeposits - 
                                smartContractSummary.totalWithdrawals - 
                                smartContractSummary.totalCapitalWithdrawals - 
                                smartContractSummary.totalFees).toFixed(2)} USDC
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600" mt={1}>
                            Solde théorique vs Solde réel: {contractUSDCBalance} USDC
                          </Text>
                        </Box>
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