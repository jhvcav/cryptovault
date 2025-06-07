// src/pages/ContractMonitoring.tsx - MONITORING DU SMART CONTRACT
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
} from '@chakra-ui/react';
import { 
  ArrowUp, 
  ArrowDown, 
  ExternalLink,
  Calendar,
  Info,
  FileText,
  Activity
} from 'lucide-react';

// Types pour les Token Transfers du contrat
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

interface ContractSummary {
  totalDeposits: number;
  totalWithdrawals: number;
  totalFees: number;
  transactionCount: number;
  netFlow: number;
  userCount: number;
}

const ContractMonitoring: React.FC = () => {
  const [tokenTransfers, setTokenTransfers] = useState<TokenTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('7d');
  const [showReport, setShowReport] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('current-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const contractAddress = '0x719fd9F511DDc561D03801161742D84ECb9445e9'; // Votre contrat
  const API_KEY = import.meta.env.VITE_BSCSCAN_API_KEY;
  const USDC_PRICE_USD = 1; // 1 USDC = 1 USD

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Fonction pour récupérer les Token Transfers du contrat
  const fetchContractTokenTransfers = async () => {
    if (!API_KEY) {
      setError('Clé API BSCScan non configurée');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = 'https://api.bscscan.com/api';
      
      // Récupérer seulement les transferts de tokens BEP-20 du contrat
      const tokenTxsResponse = await fetch(
        `${baseUrl}?module=account&action=tokentx&address=${contractAddress}&sort=desc&apikey=${API_KEY}`
      );
      const tokenTxsData = await tokenTxsResponse.json();

      if (tokenTxsData.status === '1') {
        setTokenTransfers(tokenTxsData.result || []);
      } else {
        setError('Aucune donnée trouvée pour ce contrat');
      }

    } catch (err) {
      setError('Erreur lors de la récupération des données BSCScan');
      console.error('BSCScan API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractTokenTransfers();
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

  const calculateContractSummary = (): ContractSummary => {
    const filteredTokens = tokenTransfers.filter(tx => filterByDate(tx.timeStamp));
    
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalFees = 0;
    const uniqueUsers = new Set<string>();

    filteredTokens.forEach(tx => {
      const value = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));
      
      // Analyser les transactions selon la direction
      if (tx.to.toLowerCase() === contractAddress.toLowerCase()) {
        // Argent qui ENTRE dans le contrat = Dépôts utilisateurs
        totalDeposits += value;
        uniqueUsers.add(tx.from.toLowerCase());
      } else if (tx.from.toLowerCase() === contractAddress.toLowerCase()) {
        // Argent qui SORT du contrat = Retraits utilisateurs ou frais
        totalWithdrawals += value;
        uniqueUsers.add(tx.to.toLowerCase());
      }
    });

    return {
      totalDeposits,
      totalWithdrawals,
      totalFees: totalDeposits * 0.05, // Estimation 5% de frais
      transactionCount: filteredTokens.length,
      netFlow: totalDeposits - totalWithdrawals,
      userCount: uniqueUsers.size
    };
  };

  const summary = calculateContractSummary();

  const formatDate = (timestamp: string): string => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString('fr-FR');
  };

  const formatValue = (value: string, decimals = 18): string => {
    const val = parseFloat(value) / Math.pow(10, decimals);
    return val.toFixed(4);
  };

  const formatValueWithUSD = (usdcAmount: number): string => {
    const usdValue = usdcAmount * USDC_PRICE_USD;
    return `${usdcAmount.toFixed(2)} USDC ($${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
  };

  const getDirection = (from: string, to: string): 'in' | 'out' => {
    return to.toLowerCase() === contractAddress.toLowerCase() ? 'in' : 'out';
  };

  const DirectionIcon = ({ direction }: { direction: 'in' | 'out' }) => {
    const IconComponent = direction === 'in' ? ArrowDown : ArrowUp;
    const color = direction === 'in' ? '#38A169' : '#E53E3E';
    
    return <IconComponent size={16} color={color} />;
  };

  // Fonction pour analyser les transactions et générer le rapport du contrat
  const generateContractTransparencyReport = () => {
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
    
    const filteredTokens = tokenTransfers.filter(tx => {
      const txDate = new Date(parseInt(tx.timeStamp) * 1000);
      return txDate >= startDate && txDate <= endDate;
    });
    
    let userDeposits = 0;
    let userWithdrawals = 0;
    let platformFees = 0;
    let rewardPayments = 0;
    const uniqueUsers = new Set<string>();
    
    filteredTokens.forEach(tx => {
      const value = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));
      
      if (tx.to.toLowerCase() === contractAddress.toLowerCase()) {
        // Dépôts utilisateurs (argent qui ENTRE)
        userDeposits += value;
        uniqueUsers.add(tx.from.toLowerCase());
      } else if (tx.from.toLowerCase() === contractAddress.toLowerCase()) {
        // Sorties du contrat (retraits utilisateurs + frais)
        userWithdrawals += value;
        uniqueUsers.add(tx.to.toLowerCase());
      }
    });
    
    // Estimation des frais et récompenses
    platformFees = userDeposits * 0.05; // 5% de frais estimés
    rewardPayments = userWithdrawals - platformFees;
    
    return {
      period: periodLabel,
      userDeposits,
      userWithdrawals,
      platformFees,
      rewardPayments,
      netFlow: userDeposits - userWithdrawals,
      userCount: uniqueUsers.size,
      transactionCount: filteredTokens.length,
      contractAddress,
      startDate: startDate.toLocaleDateString('fr-FR'),
      endDate: endDate.toLocaleDateString('fr-FR'),
    };
  };

  const report = generateContractTransparencyReport();

  // Composant du rapport de transparence du contrat
  const ContractTransparencyReportModal = () => (
    <Modal isOpen={showReport} onClose={() => setShowReport(false)} size="6xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <FileText size={24} />
            <Text>Rapport Contrat - {report.period}</Text>
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
                </VStack>
              </CardBody>
            </Card>

            {/* Résumé Exécutif */}
            <Card>
              <CardHeader>
                <Heading size="md" color="blue.600">📊 Résumé Exécutif du Contrat</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Stat>
                    <StatLabel>Dépôts Utilisateurs</StatLabel>
                    <StatNumber color="green.500">
                      {formatValueWithUSD(report.userDeposits)}
                    </StatNumber>
                    <StatHelpText>Fonds reçus sur le contrat</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Retraits Utilisateurs</StatLabel>
                    <StatNumber color="orange.500">
                      {formatValueWithUSD(report.userWithdrawals)}
                    </StatNumber>
                    <StatHelpText>Gains + Capital distribués</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Flux Net du Contrat</StatLabel>
                    <StatNumber color={report.netFlow >= 0 ? "green.500" : "red.500"}>
                      {formatValueWithUSD(Math.abs(report.netFlow))}
                    </StatNumber>
                    <StatHelpText>
                      <StatArrow type={report.netFlow >= 0 ? "increase" : "decrease"} />
                      {report.netFlow >= 0 ? "Croissance" : "Décroissance"}
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Analyse des Flux du Contrat */}
            <Card>
              <CardHeader>
                <Heading size="md" color="purple.600">💰 Analyse des Flux du Contrat</Heading>
              </CardHeader>
              <CardBody>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Type de Flux</Th>
                        <Th>Montant</Th>
                        <Th>Description</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>
                          <Badge colorScheme="green">Dépôts Entrants</Badge>
                        </Td>
                        <Td>{formatValueWithUSD(report.userDeposits)}</Td>
                        <Td>Investissements des utilisateurs</Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <Badge colorScheme="blue">Paiements Récompenses</Badge>
                        </Td>
                        <Td>{formatValueWithUSD(report.rewardPayments)}</Td>
                        <Td>Gains distribués aux utilisateurs</Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <Badge colorScheme="orange">Frais Plateforme</Badge>
                        </Td>
                        <Td>{formatValueWithUSD(report.platformFees)}</Td>
                        <Td>Commission sur les investissements</Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <Badge colorScheme="purple">Total Sorties</Badge>
                        </Td>
                        <Td>{formatValueWithUSD(report.userWithdrawals)}</Td>
                        <Td>Toutes les sorties du contrat</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

            {/* Performance du Contrat */}
            <Card>
              <CardHeader>
                <Heading size="md" color="green.600">📈 Performance du Smart Contract</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={3} spacing={4}>
                  <Box p={4} bg="green.50" borderRadius="lg" textAlign="center">
                    <Text fontWeight="bold" color="green.600">Volume Total</Text>
                    <Text fontSize="2xl" fontWeight="bold">
                      {formatValueWithUSD(report.userDeposits + report.userWithdrawals)}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Activité du contrat</Text>
                  </Box>
                  
                  <Box p={4} bg="blue.50" borderRadius="lg" textAlign="center">
                    <Text fontWeight="bold" color="blue.600">Utilisateurs Actifs</Text>
                    <Text fontSize="2xl" fontWeight="bold">{report.userCount}</Text>
                    <Text fontSize="sm" color="gray.600">Utilisateurs uniques</Text>
                  </Box>
                  
                  <Box p={4} bg="purple.50" borderRadius="lg" textAlign="center">
                    <Text fontWeight="bold" color="purple.600">Transactions</Text>
                    <Text fontSize="2xl" fontWeight="bold">{report.transactionCount}</Text>
                    <Text fontSize="sm" color="gray.600">Token transfers</Text>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Traçabilité On-Chain du Contrat */}
            <Card>
              <CardHeader>
                <Heading size="md" color="teal.600">🔗 Traçabilité du Smart Contract</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Contrat analysé:</Text>
                    <Link href={`https://bscscan.com/address/${contractAddress}`} isExternal color="blue.500">
                      {contractAddress.slice(0, 20)}... <ExternalLink size={12} style={{display: 'inline'}} />
                    </Link>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Token transfers analysés:</Text>
                    <Text>{report.transactionCount} transactions sur la période</Text>
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

  const renderTokenTransferTable = () => {
    const data = tokenTransfers.filter(tx => filterByDate(tx.timeStamp));

    return (
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Hash</Th>
              <Th>Token</Th>
              <Th>Direction</Th>
              <Th>Montant</Th>
              <Th>De/Vers</Th>
              <Th>Date</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.slice(0, 100).map((item, idx) => (
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
                
                <Td>
                  <Badge colorScheme="green" size="sm">
                    {item.tokenSymbol}
                  </Badge>
                </Td>
                
                <Td>
                  <HStack>
                    <DirectionIcon direction={getDirection(item.from, item.to)} />
                    <Text color={getDirection(item.from, item.to) === 'in' ? 'green.500' : 'red.500'}>
                      {getDirection(item.from, item.to) === 'in' ? 'Dépôt' : 'Retrait'}
                    </Text>
                  </HStack>
                </Td>
                
                <Td fontWeight="medium">
                  {formatValue(item.value, parseInt(item.tokenDecimal))} {item.tokenSymbol}
                </Td>
                
                <Td fontSize="xs">
                  {getDirection(item.from, item.to) === 'in' ? 
                    `${item.from.slice(0, 6)}...${item.from.slice(-4)}` :
                    `${item.to.slice(0, 6)}...${item.to.slice(-4)}`
                  }
                </Td>
                
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
        {/* En-tête */}
        <Card bg={bgColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="lg">🏛️ Monitoring Smart Contract</Heading>
              <Text fontSize="sm" color="gray.600">
                Contrat: {contractAddress}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Surveillance des Token Transfers (BEP-20) du smart contract
              </Text>
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
          
          <Button onClick={fetchContractTokenTransfers} isLoading={loading} colorScheme="blue">
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
            <Text mt={2}>Chargement des données du contrat...</Text>
          </Box>
        )}

        {/* Résumé */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel color="white">Total Dépôts</StatLabel>
            <StatNumber color="green.500">{formatValueWithUSD(summary.totalDeposits)}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Fonds entrants
            </StatHelpText>
          </Stat>

          <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel color="white">Total Retraits</StatLabel>
            <StatNumber color="orange.500">{formatValueWithUSD(summary.totalWithdrawals)}</StatNumber>
            <StatHelpText>
              <StatArrow type="decrease" />
              Fonds sortants
            </StatHelpText>
          </Stat>

          <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel color="white">Flux Net</StatLabel>
            <StatNumber color={summary.netFlow >= 0 ? "green.500" : "red.500"}>
              {formatValueWithUSD(Math.abs(summary.netFlow))}
            </StatNumber>
            <StatHelpText>
              <StatArrow type={summary.netFlow >= 0 ? "increase" : "decrease"} />
              {summary.netFlow >= 0 ? "Croissance" : "Décroissance"}
            </StatHelpText>
          </Stat>

          <Stat bg={bgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel color="white">Utilisateurs Actifs</StatLabel>
            <StatNumber color="blue.500">{summary.userCount}</StatNumber>
            <StatHelpText>Participants uniques</StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Tableau des Token Transfers */}
        <Card bg={bgColor}>
          <CardBody p={0}>
            <Box p={4}>
              <HStack justify="space-between" align="center" mb={4}>
                <Heading size="md">
                  <Activity size={20} style={{display: 'inline', marginRight: '8px'}} />
                  Token Transfers (BEP-20)
                </Heading>
                <Text>({summary.transactionCount} transactions)</Text>
              </HStack>
            </Box>
            
            <Box overflowX="auto" maxW="100%">
              {renderTokenTransferTable()}
            </Box>
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
            Générer Rapport Contrat
          </Button>
        </HStack>

        {/* Modal du rapport de transparence */}
        <ContractTransparencyReportModal />
      </VStack>
    </Box>
  );
};

export default ContractMonitoring;