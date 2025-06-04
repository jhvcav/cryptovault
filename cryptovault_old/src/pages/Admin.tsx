import React, { useState, useEffect } from 'react';
import { useContract } from '../contexts/ContractContext';
import { formatEther, formatUnits } from 'ethers';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Box,
  Text,
  Flex,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Divider,
  Card,
  CardHeader,
  CardBody,
} from '@chakra-ui/react';

interface Investment {
  investor: string;
  amount: bigint;
  token: 'USDC' | 'USDT';
  planId: number;
  startDate: Date;
  lastWithdrawDate: Date;
  totalWithdrawn: bigint;
}

interface WithdrawalEvent {
  investor: string;
  amount: bigint;
  timestamp: Date;
}

interface PoolDeposit {
  amount: bigint;
  timestamp: Date;
}

const Admin = () => {
  const { contract, usdcContract, usdtContract } = useContract();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalEvent[]>([]);
  const [poolBalance, setPoolBalance] = useState<bigint>(BigInt(0));
  const [poolDeposits, setPoolDeposits] = useState<PoolDeposit[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!contract || !usdcContract || !usdtContract) return;

      try {
        // Récupérer tous les événements d'investissement
        const investFilter = contract.filters.InvestmentMade();
        const investEvents = await contract.queryFilter(investFilter);
        
        // Récupérer tous les événements de retrait
        const withdrawFilter = contract.filters.ReturnsWithdrawn();
        const withdrawEvents = await contract.queryFilter(withdrawFilter);
        
        // Récupérer tous les événements de dépôt dans le pool
        const depositFilter = contract.filters.PoolDeposit();
        const depositEvents = await contract.queryFilter(depositFilter);

        // Traiter les investissements
        const processedInvestments = await Promise.all(
          investEvents.map(async (event) => {
            const [investor, amount, token, planId] = event.args || [];
            const block = await event.getBlock();
            
            return {
              investor,
              amount,
              token: token === usdcContract.target ? 'USDC' : 'USDT',
              planId: Number(planId),
              startDate: new Date(Number(block.timestamp) * 1000),
              lastWithdrawDate: new Date(0),
              totalWithdrawn: BigInt(0)
            };
          })
        );

        // Traiter les retraits
        const processedWithdrawals = await Promise.all(
          withdrawEvents.map(async (event) => {
            const [investor, amount] = event.args || [];
            const block = await event.getBlock();
            
            return {
              investor,
              amount,
              timestamp: new Date(Number(block.timestamp) * 1000)
            };
          })
        );

        // Traiter les dépôts du pool
        const processedDeposits = await Promise.all(
          depositEvents.map(async (event) => {
            const [amount] = event.args || [];
            const block = await event.getBlock();
            
            return {
              amount,
              timestamp: new Date(Number(block.timestamp) * 1000)
            };
          })
        );

        // Récupérer le solde actuel du pool
        const currentPoolBalance = await usdcContract.balanceOf(contract.target);

        setInvestments(processedInvestments);
        setWithdrawals(processedWithdrawals);
        setPoolDeposits(processedDeposits);
        setPoolBalance(currentPoolBalance);

      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      }
    };

    fetchData();
  }, [contract, usdcContract, usdtContract]);

  const calculateDailyReturns = (amount: bigint, planId: number) => {
    const plans = [
      { apy: 12, duration: 30 },
      { apy: 15, duration: 60 },
      { apy: 18, duration: 90 }
    ];
    
    const plan = plans[planId - 1];
    const dailyRate = (plan.apy / 365) / 100;
    return Number(formatEther(amount)) * dailyRate;
  };

  return (
    <Box maxW="1200px" mx="auto" p={8}>
      <Heading mb={8}>Administration du Contrat</Heading>

      {/* Statistiques globales */}
      <Card mb={8}>
        <CardHeader>
          <Heading size="md">Statistiques Globales</Heading>
        </CardHeader>
        <CardBody>
          <StatGroup>
            <Stat>
              <StatLabel>Total Investisseurs</StatLabel>
              <StatNumber>{new Set(investments.map(i => i.investor)).size}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Total Investissements</StatLabel>
              <StatNumber>{investments.length}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Balance Pool USDC</StatLabel>
              <StatNumber>{formatUnits(poolBalance, 6)} USDC</StatNumber>
            </Stat>
          </StatGroup>
        </CardBody>
      </Card>

      {/* Liste des investissements */}
      <Card mb={8}>
        <CardHeader>
          <Heading size="md">Investissements</Heading>
        </CardHeader>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Investisseur</Th>
                <Th>Montant</Th>
                <Th>Token</Th>
                <Th>Plan</Th>
                <Th>Date</Th>
                <Th>Gains Journaliers</Th>
              </Tr>
            </Thead>
            <Tbody>
              {investments.map((investment, index) => (
                <Tr key={index}>
                  <Td>{`${investment.investor.substring(0, 6)}...${investment.investor.substring(38)}`}</Td>
                  <Td>{formatUnits(investment.amount, investment.token === 'USDC' ? 6 : 6)}</Td>
                  <Td>
                    <Badge colorScheme={investment.token === 'USDC' ? 'blue' : 'green'}>
                      {investment.token}
                    </Badge>
                  </Td>
                  <Td>Plan {investment.planId}</Td>
                  <Td>{investment.startDate.toLocaleDateString()}</Td>
                  <Td>
                    {calculateDailyReturns(investment.amount, investment.planId).toFixed(2)}
                    {' '}{investment.token}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Liste des retraits */}
      <Card mb={8}>
        <CardHeader>
          <Heading size="md">Historique des Retraits</Heading>
        </CardHeader>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Investisseur</Th>
                <Th>Montant</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {withdrawals.map((withdrawal, index) => (
                <Tr key={index}>
                  <Td>{`${withdrawal.investor.substring(0, 6)}...${withdrawal.investor.substring(38)}`}</Td>
                  <Td>{formatUnits(withdrawal.amount, 6)} USDC</Td>
                  <Td>{withdrawal.timestamp.toLocaleDateString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Historique des dépôts du pool */}
      <Card>
        <CardHeader>
          <Heading size="md">Historique des Dépôts du Pool</Heading>
        </CardHeader>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Montant</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {poolDeposits.map((deposit, index) => (
                <Tr key={index}>
                  <Td>{formatUnits(deposit.amount, 6)} USDC</Td>
                  <Td>{deposit.timestamp.toLocaleDateString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Admin;