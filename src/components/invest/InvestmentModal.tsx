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
  Box,
  Flex,
  Alert,
  AlertIcon
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
  const [isInvesting, setIsInvesting] = useState(false);
  const [investmentError, setInvestmentError] = useState<string | null>(null);

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
    setIsInvesting(true);
    setInvestmentError(null);
    
    if (!plan) {
      setInvestmentError("Aucun plan sélectionné");
      setIsInvesting(false);
      return;
    }
    
    const amountNum = parseFloat(amount);
    
    try {
      console.log("Début de handleInvest");
      console.log("Plan:", plan);
      console.log("Amount:", amountNum);
      console.log("Selected Token:", selectedToken);
      
      // Vérification du montant minimum
      console.log("Vérification du montant minimum");
      if (amountNum < plan.minAmount) {
        setInvestmentError(`Le montant minimum pour ce plan est de ${plan.minAmount} ${selectedToken}`);
        setIsInvesting(false);
        return;
      }
      
      // Vérification du solde suffisant
      console.log("Token balance:", selectedToken === 'USDT' ? balance.usdt : balance.usdc);
      if (amountNum > (selectedToken === 'USDT' ? balance.usdt : balance.usdc)) {
        setInvestmentError(`Solde insuffisant en ${selectedToken}`);
        setIsInvesting(false);
        return;
      }
      
      console.log("Tentative de dépôt");
      console.log("handleInvest appelé avec:", { planId: plan.id, amount: amountNum, token: selectedToken });
      
      const result = await onInvest(plan.id, amountNum, selectedToken as 'USDT' | 'USDC');
      console.log("Résultat du dépôt:", result);
      
      if (result) {
        console.log("Dépôt réussi");
        onClose(); // Fermer le modal
        toast({
          title: "Demande de récompense réussi",
          description: `Vous avez déposé ${amount} ${selectedToken} dans le plan ${plan.name}.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        console.log("Échec dépôt");
        setInvestmentError("Le dépôt a échoué. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Erreur lors de du dépôt:", error);
      
      // Messages d'erreur personnalisés en fonction du type d'erreur
      let errorMessage = "Une erreur s'est produite lors de votre dépôt.";
      
      if (error.message?.includes("transfer amount exceeds allowance")) {
        errorMessage = "Autorisation insuffisante pour le transfert de tokens. Veuillez approuver le contrat et réessayer.";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Fonds insuffisants pour effectuer ce dépôt.";
      } else if (error.message?.includes("user rejected")) {
        errorMessage = "Transaction annulée par l'utilisateur.";
      } else if (error.reason) {
        // Si l'erreur contient une raison spécifique du contrat
        errorMessage = `Erreur: ${error.reason}`;
      }
      
      setInvestmentError(errorMessage);
    } finally {
      setIsInvesting(false);
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
        <ModalHeader>Faire un dépôt dans {plan.name} V2</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch" pb={4}>
            <Text>
              Récompenses: {plan.apr}% | Durée: {plan.duration} jours
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
                    <Text color="white">{plan.name} ({plan.apr}% Récompense)</Text>
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
                    <Text color="gray.300">Récompenses net</Text>
                    <Text color="white">
                      {(parseFloat(amount) * 0.98).toFixed(2)} {selectedToken}
                    </Text>
                  </Flex>
                  <Divider my={2} borderColor="gray.600" />
                  <Flex justifyContent="space-between">
                    <Text color="gray.300">Récompense quotidien</Text>
                    <Text color="green.400">
                      {((parseFloat(amount) * 0.98 * (plan.apr / 100)) / 365).toFixed(4)} {selectedToken}
                    </Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="gray.300">Récompense total</Text>
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
              <FormLabel>Montant à déposer</FormLabel>
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
                Le montant minimum de dépôt est de {plan.minAmount} {selectedToken}
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

            {/* Affichage des erreurs d'investissement */}
            {investmentError && (
              <Alert status="error" variant="solid" borderRadius="md">
                <AlertIcon />
                {investmentError}
              </Alert>
            )}

            <Button
              colorScheme="blue"
              onClick={handleInvest}
              isLoading={isInvesting || loading}
              isDisabled={!amount || parseFloat(amount) <= 0}
            >
              Dépôt
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default InvestmentModal;