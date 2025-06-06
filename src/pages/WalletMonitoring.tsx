// src/pages/WalletMonitoring.tsx - VERSION COMPLÈTE
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

interface WalletSummary {
  totalIn: number;
  totalOut: number;
  totalFees: number;
  transactionCount: number;
  byType: {
    normal: number;
    internal: number;
    token: number;
  };
  netFlow: number;
}

const WalletMonitoring: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [internalTxs, setInternalTxs] = useState<InternalTransaction[]>([]);
  const [tokenTransfers, setTokenTransfers] = useState<TokenTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('7d');
  const [activeCategory, setActiveCategory] = useState(0);
  const [walletAddress, setWalletAddress] = useState('0x1FF70C1DFc33F5DDdD1AD2b525a07b172182d8eF');
  const [showReport, setShowReport] = useState(false);

  const API_KEY = import.meta.env.VITE_BSCSCAN_API_KEY;
  const BNB_PRICE_USD = 670;

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

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
  };

  // Fonction pour récupérer les données BSCScan
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

  const summary = calculateSummary();

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

  // Fonction pour analyser les transactions et générer le rapport
  const generateTransparencyReport = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyTransactions = transactions.filter(tx => {
      const txDate = new Date(parseInt(tx.timeStamp) * 1000);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });
    
    const monthlyTokens = tokenTransfers.filter(tx => {
      const txDate = new Date(parseInt(tx.timeStamp) * 1000);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });
    
    let userDeposits = 0;
    let platformInvestments = 0;
    let platformReturns = 0;
    let userWithdrawals = 0;
    let gasFees = 0;
    
    monthlyTransactions.forEach(tx => {
      const value = parseFloat(tx.value) / Math.pow(10, 18);
      const fee = (parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice)) / Math.pow(10, 18);
      gasFees += fee;
      
      if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
        platformReturns += value;
      } else {
        platformInvestments += value;
      }
    });
    
    monthlyTokens.forEach(tx => {
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
    
    const daysInMonth = now.getDate();
    const estimatedBeginnerReturns = (userDeposits * 0.10 * daysInMonth) / 365;
    const estimatedGrowthReturns = (userDeposits * 0.15 * daysInMonth) / 365;
    const estimatedPremiumReturns = (userDeposits * 0.20 * daysInMonth) / 365;
    const totalEstimatedReturns = estimatedBeginnerReturns + estimatedGrowthReturns + estimatedPremiumReturns;
    
    return {
      period: `${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
      userDeposits,
      platformInvestments,
      platformReturns,
      userWithdrawals,
      gasFees,
      netFlow: platformReturns - platformInvestments,
      estimatedReturns: totalEstimatedReturns,
      actualReturns: platformReturns,
      performance: platformReturns > 0 ? ((platformReturns / totalEstimatedReturns) * 100) : 0,
      transactionCount: monthlyTransactions.length + monthlyTokens.length,
      walletAddress
    };
  };

  const report = generateTransparencyReport();

  // Composant du rapport de transparence
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
                      {report.userDeposits.toFixed(2)} USDT
                    </StatNumber>
                    <StatHelpText>Fonds reçus des investisseurs</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Rendements Générés</StatLabel>
                    <StatNumber color="blue.500">
                      {report.actualReturns.toFixed(4)} BNB
                    </StatNumber>
                    <StatHelpText>
                      <StatArrow type={report.performance >= 100 ? "increase" : "decrease"} />
                      Performance: {report.performance.toFixed(1)}%
                    </StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Flux Net</StatLabel>
                    <StatNumber color={report.netFlow >= 0 ? "green.500" : "red.500"}>
                      {formatValueWithUSD(Math.abs(report.netFlow))}
                    </StatNumber>
                    <StatHelpText>
                      {report.netFlow >= 0 ? "Bénéfice" : "Perte"} du mois
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Analyse des Flux */}
            <Card>
              <CardHeader>
                <Heading size="md" color="purple.600">💰 Analyse des Flux Financiers</Heading>
              </CardHeader>
              <CardBody>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Type de Flux</Th>
                        <Th>Montant</Th>
                        <Th>Équivalent USD</Th>
                        <Th>Description</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>
                          <Badge colorScheme="green">Dépôts Utilisateurs</Badge>
                        </Td>
                        <Td>{report.userDeposits.toFixed(2)} USDT</Td>
                        <Td>${report.userDeposits.toFixed(2)}</Td>
                        <Td>Fonds des plans Débutant/Croissance/Premium</Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <Badge colorScheme="orange">Investissements Plateformes</Badge>
                        </Td>
                        <Td>{report.platformInvestments.toFixed(4)} BNB</Td>
                        <Td>${(report.platformInvestments * BNB_PRICE_USD).toFixed(2)}</Td>
                        <Td>Vers PancakeSwap, Venus, Aave</Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <Badge colorScheme="blue">Rendements Reçus</Badge>
                        </Td>
                        <Td>{report.platformReturns.toFixed(4)} BNB</Td>
                        <Td>${(report.platformReturns * BNB_PRICE_USD).toFixed(2)}</Td>
                        <Td>Profits du staking/farming</Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <Badge colorScheme="red">Frais de Gas</Badge>
                        </Td>
                        <Td>{report.gasFees.toFixed(6)} BNB</Td>
                        <Td>${(report.gasFees * BNB_PRICE_USD).toFixed(2)}</Td>
                        <Td>Coûts opérationnels BSC</Td>
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
                      Rendement estimé: {((report.userDeposits * 0.10) / 12).toFixed(2)} USDT/mois
                    </Text>
                  </Box>
                  
                  <Box p={4} bg="purple.50" borderRadius="lg" textAlign="center">
                    <Text fontWeight="bold" color="purple.600">Plan Croissance</Text>
                    <Text fontSize="2xl" fontWeight="bold">15% APR</Text>
                    <Text fontSize="sm" color="gray.600">90 jours - Bloqué</Text>
                    <Text fontSize="sm" mt={2}>
                      Rendement estimé: {((report.userDeposits * 0.15) / 12).toFixed(2)} USDT/mois
                    </Text>
                  </Box>
                  
                  <Box p={4} bg="yellow.50" borderRadius="lg" textAlign="center">
                    <Text fontWeight="bold" color="yellow.600">Plan Premium</Text>
                    <Text fontSize="2xl" fontWeight="bold">20% APR</Text>
                    <Text fontSize="sm" color="gray.600">180 jours - Bloqué</Text>
                    <Text fontSize="sm" mt={2}>
                      Rendement estimé: {((report.userDeposits * 0.20) / 12).toFixed(2)} USDT/mois
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
                    <Text fontWeight="bold">Transactions analysées:</Text>
                    <Text>{report.transactionCount} transactions ce mois</Text>
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
            <Alert status={report.performance >= 100 ? "success" : "warning"}>
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">
                  {report.performance >= 100 ? "✅ Performance Positive" : "⚠️ Performance à Surveiller"}
                </Text>
                <Text fontSize="sm">
                  {report.performance >= 100 
                    ? `Les rendements générés (${report.performance.toFixed(1)}%) dépassent les attentes. La stratégie d'investissement est performante.`
                    : `Les rendements générés (${report.performance.toFixed(1)}%) sont en dessous des attentes. Révision de la stratégie recommandée.`
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
        {/* En-tête avec champ de saisie */}
        <Card bg={bgColor}>
          <CardBody>
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
          </CardBody>
        </Card>

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
            <StatLabel color="white">Total Entré</StatLabel>
            <StatNumber color="green.500">{formatValueWithUSD(summary.totalIn)}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Toutes entrées
            </StatHelpText>
          </Stat>

          <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel color="white">Total Sorti</StatLabel>
            <StatNumber color="red.500">{formatValueWithUSD(summary.totalOut)}</StatNumber>
            <StatHelpText>
              <StatArrow type="decrease" />
              Toutes sorties
            </StatHelpText>
          </Stat>

          <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel color="white">Frais Totaux</StatLabel>
            <StatNumber color="orange.500">{formatValueWithUSD(summary.totalFees)}</StatNumber>
            <StatHelpText>Gas utilisé</StatHelpText>
          </Stat>

          <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel color="white">Flux Net</StatLabel>
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
              <Box textAlign="center" p={4} bg="blue.50" borderRadius="lg">
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {summary.byType.normal}
                </Text>
                <Text fontSize="sm" color="gray.600">Transactions</Text>
              </Box>
              <Box textAlign="center" p={4} bg="purple.50" borderRadius="lg">
                <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                  {summary.byType.internal}
                </Text>
                <Text fontSize="sm" color="gray.600">Internes</Text>
              </Box>
              <Box textAlign="center" p={4} bg="green.50" borderRadius="lg">
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {summary.byType.token}
                </Text>
                <Text fontSize="sm" color="gray.600">Tokens BEP-20</Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Onglets des transactions */}
        <Card bg={bgColor}>
          <CardBody p={0}>
            <Tabs index={activeCategory} onChange={setActiveCategory}>
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

        {/* Boutons d'export */}
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
        </HStack>

        {/* Modal du rapport de transparence */}
        <TransparencyReportModal />
      </VStack>
    </Box>
  );
};

export default WalletMonitoring;