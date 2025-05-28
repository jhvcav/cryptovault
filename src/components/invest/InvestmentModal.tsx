import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Text,
  useToast,
  HStack,
  Divider,
  Box,   // Ajout de Box
  Flex   // Ajout de Flex
} from '@chakra-ui/react';
import { useWallet } from '../../contexts/WalletContext';
import { useInvestment, InvestmentPlan } from '../../contexts/InvestmentContext';
import { TOKENS } from '../../config/tokens';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: InvestmentPlan | null;
  onInvest: (planId: number, amount: number, token: 'USDT' | 'USDC') => Promise<boolean>;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  plan,
  onInvest
}) => {
  const { balance } = useWallet();
  const { loading } = useInvestment();
  const toast = useToast();

  const [amount, setAmount] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<string>('USDT');

  // Calculs des détails de l'investissement
  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * 0.02; // 2% fee
  const investedAmount = amountNum - fee;
  
  // Correction des calculs
  const dailyReturn = plan 
    ? (investedAmount * (plan.apr / 100)) / 365 
    : 0;
  const totalReturn = plan 
    ? dailyReturn * plan.duration 
    : 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };


  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedToken(e.target.value);
  };

  const handleInvest = async () => {
    if (!plan) return;
  
    console.log('Début de handleInvest');
    console.log('Plan:', plan);
    console.log('Amount:', amount);
    console.log('Selected Token:', selectedToken);
  
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      console.log('Montant invalide');
      toast({
        title: 'Montant invalide',
        description: 'Veuillez entrer un montant valide',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
  
    console.log('Vérification du montant minimum');
    if (amountNum < plan.minAmount) {
      console.log(`Montant inférieur au minimum de ${plan.minAmount}`);
      toast({
        title: 'Montant insuffisant',
        description: `Le montant minimum pour ce plan est de ${plan.minAmount} ${selectedToken}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
  
    const tokenBalance = selectedToken === 'USDT' ? balance.usdt : balance.usdc;
    console.log('Token balance:', tokenBalance);
    if (amountNum > tokenBalance) {
      console.log('Solde insuffisant');
      toast({
        title: 'Solde insuffisant',
        description: `Votre solde en ${selectedToken} est insuffisant`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
  
    try {
      console.log('Tentative d\'investissement');
      const success = await onInvest(plan.id, amountNum, selectedToken as 'USDT' | 'USDC');
      console.log('Résultat de l\'investissement:', success);
  
      if (success) {
        toast({
          title: 'Investissement réussi',
          description: `Vous avez investi ${amountNum} ${selectedToken} dans le plan ${plan.name}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onClose();
        setAmount('');
      } else {
        console.log('Échec de l\'investissement');
        toast({
          title: 'Échec de l\'investissement',
          description: 'Impossible de compléter l\'investissement',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erreur durant l\'investissement:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!plan) return null;

  const availableTokens = Object.entries(TOKENS).map(([symbol, token]) => ({
    symbol,
    address: token.address,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Investir dans {plan.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch" pb={4}>
            <Text>
              APR: {plan.apr}% | Durée: {plan.duration} jours
            </Text>
            <Text>
              Montant minimum: {plan.minAmount} $
            </Text>
            <Divider />
  
            {/* Nouveau bloc de détails d'investissement */}
            {amount && parseFloat(amount) > 0 && (
              <Box bg="gray.700" rounded="lg" p={4} mb={4}>
                <VStack spacing={2} fontSize="sm" align="stretch">
                  <Flex justifyContent="space-between">
                    <Text color="gray.300">Plan</Text>
                    <Text color="white">{plan.name} ({plan.apr}% APR)</Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="gray.300">Durée</Text>
                    <Text color="white">{plan.duration} jours</Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="gray.300">Frais de plateforme (2%)</Text>
                    <Text color="white">
                      {(parseFloat(amount) * 0.02).toFixed(2)} {selectedToken}
                    </Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="gray.300">Investissement net</Text>
                    <Text color="white">
                      {(parseFloat(amount) * 0.98).toFixed(2)} {selectedToken}
                    </Text>
                  </Flex>
                  <Divider my={2} borderColor="gray.600" />
                  <Flex justifyContent="space-between">
                    <Text color="gray.300">Rendement quotidien</Text>
                    <Text color="green.400">
                      {((parseFloat(amount) * 0.98 * (plan.apr / 100)) / 365).toFixed(4)} {selectedToken}
                    </Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="gray.300">Rendement total</Text>
                    <Text color="green.400">
                      {((parseFloat(amount) * 0.98 * (plan.apr / 100) * plan.duration) / 365).toFixed(2)} {selectedToken}
                    </Text>
                  </Flex>
                </VStack>
              </Box>
            )}
  
            <FormControl>
              <FormLabel>Token</FormLabel>
              <Select value={selectedToken} onChange={handleTokenChange}>
                {availableTokens.map(token => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Montant à investir</FormLabel>
              <Input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder={`Minimum ${plan.minAmount}`}
              />
              {amount && parseFloat(amount) > 0 && (
              <>
              {parseFloat(amount) < plan.minAmount && (
              <Text color="red.500" fontSize="sm" mt={1}>
                Le montant minimum d'investissement est de {plan.minAmount} {selectedToken}
              </Text>
              )}
              {parseFloat(amount) > (selectedToken === 'USDT' ? balance.usdt : balance.usdc) && (
              <Text color="red.500" fontSize="sm" mt={1}>
                Solde insuffisant
              </Text>
              )}
              </>
              )}
            </FormControl>

            <HStack justify="space-between">
              <Text>Balance disponible:</Text>
              <Text>
                {selectedToken === 'USDT' ? balance.usdt : balance.usdc} {selectedToken}
              </Text>
            </HStack>
            <Button
              colorScheme="blue"
              onClick={handleInvest}
              isLoading={loading}
              isDisabled={!amount || parseFloat(amount) <= 0}
            >
              Investir
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default InvestmentModal;