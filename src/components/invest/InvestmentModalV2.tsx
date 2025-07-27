//src/components/invest/InvestmentModalV2.tsx
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
  AlertIcon,
  Badge
} from '@chakra-ui/react';
import { useWallet } from '../../contexts/WalletContext';
import { useInvestmentV2, InvestmentPlanV2 } from '../../contexts/InvestmentContextV2';
import { TOKENS } from '../../config/tokens';
import { TrendingUp, Target, CheckCircle, XCircle, Wallet, Gift } from 'lucide-react';

// ✅ INTERFACE MODIFIÉE avec bonus NFT
interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: InvestmentPlanV2 | null;
  onInvest: (planId: number, amount: number, token: 'USDT' | 'USDC') => Promise<boolean>;
  nftMultiplier?: number; // ← NOUVEAU - multiplicateur NFT (ex: 1.2 pour +20%)
  effectiveAPR?: number;  // ← NOUVEAU - APR avec bonus NFT (ex: 28.8%)
}

// ✅ COMPOSANT MODIFIÉ avec bonus NFT
export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  plan,
  onInvest,
  nftMultiplier = 1,    // ← NOUVEAU - défaut 1 (pas de bonus)
  effectiveAPR          // ← NOUVEAU - APR avec bonus NFT
}) => {
  const { balance } = useWallet();
  const { loading } = useInvestmentV2();
  const toast = useToast();

  const [amount, setAmount] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<string>('USDT');
  const [isInvesting, setIsInvesting] = useState(false);
  const [investmentError, setInvestmentError] = useState<string | null>(null);

  // ✅ CALCULS CORRIGÉS avec bonus NFT
  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * 0.02; // 2% fee
  const investedAmount = amountNum - fee;
  
  // Utiliser l'APR effectif (avec bonus NFT) au lieu de plan.apr
  const finalAPR = effectiveAPR || (plan ? plan.apr : 0);
  const hasNFTBonus = nftMultiplier > 1;
  const bonusPercentage = hasNFTBonus ? ((nftMultiplier - 1) * 100) : 0;
  
  const dailyReturn = plan 
    ? (investedAmount * (finalAPR / 100)) / 365 
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
      console.log("NFT Multiplier:", nftMultiplier);
      console.log("Effective APR:", finalAPR);
      
      // Vérifications inchangées
      if (amountNum < plan.minAmount) {
        setInvestmentError(`Le montant minimum pour ce plan est de ${plan.minAmount} ${selectedToken}`);
        setIsInvesting(false);
        return;
      }
      
      if (amountNum > (selectedToken === 'USDT' ? balance.usdt : balance.usdc)) {
        setInvestmentError(`Solde insuffisant en ${selectedToken}`);
        setIsInvesting(false);
        return;
      }
      
      const result = await onInvest(plan.id, amountNum, selectedToken as 'USDT' | 'USDC');
      
      if (result) {
        onClose();
        toast({
          title: "Dépôt réussi !",
          description: `Vous avez déposé ${amount} ${selectedToken} dans ${plan.name}${hasNFTBonus ? ` avec bonus NFT de +${bonusPercentage.toFixed(0)}%` : ''}.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        setInvestmentError("Le dépôt a échoué. Veuillez réessayer.");
      }
    } catch (error: any) {
      console.error("Erreur lors du dépôt:", error);
      
      let errorMessage = "Une erreur s'est produite lors de votre dépôt.";
      
      if (error?.message?.includes("transfer amount exceeds allowance")) {
        errorMessage = "Autorisation insuffisante pour le transfert de tokens. Veuillez approuver le contrat et réessayer.";
      } else if (error?.message?.includes("insufficient funds")) {
        errorMessage = "Fonds insuffisants pour effectuer ce dépôt.";
      } else if (error?.message?.includes("user rejected")) {
        errorMessage = "Transaction annulée par l'utilisateur.";
      } else if (error?.reason) {
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
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay 
        bg="blackAlpha.800" 
        backdropFilter="blur(10px)" 
      />
      <ModalContent 
        bg="gray.900" 
        border="1px solid"
        borderColor="gray.700"
        borderRadius="xl"
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.8)"
        overflow="hidden"
      >
        {/* Header avec gradient */}
        <ModalHeader 
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          color="white"
          textAlign="center"
          py={2}
          position="relative"
        >
          <VStack spacing={2}>
            <TrendingUp size={24} color="white" opacity={0.8} />
            <Text fontSize="xl" fontWeight="bold">
              Faire un dépôt dans {plan.name}
            </Text>
            <Text fontSize="sm" opacity={0.8}>
              Version V2 {hasNFTBonus && `• Bonus NFT actif`}
            </Text>
          </VStack>
          <ModalCloseButton 
            color="white" 
            _hover={{ bg: "whiteAlpha.200" }}
            size="lg"
          />
        </ModalHeader>

        <ModalBody p={4}>
          <VStack spacing={4} align="stretch">
            
            {/* ✅ CARTE DES INFORMATIONS DU PLAN avec bonus NFT */}
            <Box 
              bg="linear-gradient(135deg, #1a202c 0%, #2d3748 100%)"
              rounded="xl" 
              p={4}
              border="1px solid"
              borderColor={hasNFTBonus ? "green.500" : "gray.600"}
              position="relative"
              overflow="hidden"
            >
              {/* Effet de brillance subtil */}
              <Box
                position="absolute"
                top="-50%"
                left="-50%"
                width="200%"
                height="200%"
                bg="linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)"
                transform="rotate(45deg)"
                pointerEvents="none"
              />
              
              {/* Badge bonus NFT en haut */}
              {hasNFTBonus && (
                <Box
                  position="absolute"
                  top={2}
                  right={2}
                  bg="green.600"
                  color="white"
                  px={2}
                  py={1}
                  rounded="md"
                  fontSize="xs"
                  fontWeight="bold"
                >
                  🎁 +{bonusPercentage.toFixed(0)}% NFT
                </Box>
              )}
              
              <HStack justify="space-between" mb={3}>
                <VStack align="start" spacing={1}>
                  <Text color="green.400" fontSize="sm" fontWeight="medium">
                    Récompenses {hasNFTBonus && `(avec bonus NFT)`}
                  </Text>
                  <HStack>
                    <Text color="white" fontSize="2xl" fontWeight="bold">
                      {finalAPR.toFixed(1)}%
                    </Text>
                    {hasNFTBonus && (
                      <VStack spacing={0} align="start">
                        <Text fontSize="xs" color="gray.400" lineHeight={1}>
                          Base: {plan.apr}%
                        </Text>
                        <Text fontSize="xs" color="green.400" lineHeight={1}>
                          +{bonusPercentage.toFixed(0)}% bonus
                        </Text>
                      </VStack>
                    )}
                  </HStack>
                </VStack>
                <VStack align="end" spacing={1}>
                  <Text color="blue.400" fontSize="sm" fontWeight="medium">
                    Durée
                  </Text>
                  <Text color="white" fontSize="2xl" fontWeight="bold">
                    {plan.duration} jours
                  </Text>
                </VStack>
              </HStack>
              
              <Divider borderColor="gray.600" my={3} />
              
              <HStack justify="center">
                <Text color="gray.300" fontSize="sm">
                  Montant minimum: 
                </Text>
                <Text color="yellow.400" fontWeight="semibold">
                  {plan.minAmount} $
                </Text>
              </HStack>
            </Box>

            {/* ✅ DÉTAILS D'INVESTISSEMENT avec calculs NFT corrects */}
            {amount && parseFloat(amount) > 0 && (
              <Box 
                bg="gray.800" 
                rounded="xl" 
                p={4}
                border="1px solid"
                borderColor={hasNFTBonus ? "green.600" : "gray.600"}
                transition="all 0.3s ease"
                _hover={{ 
                  borderColor: hasNFTBonus ? "green.500" : "blue.500",
                  boxShadow: hasNFTBonus ? "0 0 0 1px #38a169" : "0 0 0 1px #3182ce"
                }}
              >
                <Text color="white" fontSize="lg" fontWeight="semibold" mb={4}>
                  Détails de l'investissement
                </Text>
                
                <VStack spacing={3} fontSize="sm">
                  <Flex justifyContent="space-between" w="full">
                    <Text color="gray.400">Plan sélectionné</Text>
                    <HStack>
                      <Badge colorScheme="purple" variant="solid">
                        {plan.name}
                      </Badge>
                      <Text color="green.300">({finalAPR.toFixed(1)}%)</Text>
                      {hasNFTBonus && (
                        <Badge colorScheme="green" size="sm">
                          +{bonusPercentage.toFixed(0)}% NFT
                        </Badge>
                      )}
                    </HStack>
                  </Flex>
                  
                  <Flex justifyContent="space-between" w="full">
                    <Text color="gray.400">Durée d'investissement</Text>
                    <Text color="blue.300" fontWeight="medium">
                      {plan.duration} jours
                    </Text>
                  </Flex>
                  
                  <Flex justifyContent="space-between" w="full">
                    <HStack>
                      <Text color="gray.400">Frais plateforme</Text>
                      <Badge colorScheme="orange" size="sm">2%</Badge>
                    </HStack>
                    <Text color="orange.300" fontWeight="medium">
                      -{(parseFloat(amount) * 0.02).toFixed(2)} {selectedToken}
                    </Text>
                  </Flex>
                  
                  <Flex justifyContent="space-between" w="full">
                    <Text color="gray.400">Montant net investi</Text>
                    <Text color="white" fontWeight="semibold">
                      {(parseFloat(amount) * 0.98).toFixed(2)} {selectedToken}
                    </Text>
                  </Flex>
                  
                  <Divider borderColor="gray.600" my={2} />
                  
                  <Flex justifyContent="space-between" w="full">
                    <HStack>
                      <Text color="gray.400">Récompense quotidienne</Text>
                      <Text fontSize="xs" color="gray.500">(/jour)</Text>
                      {hasNFTBonus && (
                        <Badge colorScheme="green" size="sm">
                          +{bonusPercentage.toFixed(0)}% NFT
                        </Badge>
                      )}
                    </HStack>
                    <Text color="green.400" fontWeight="bold">
                      +{dailyReturn.toFixed(4)} {selectedToken}
                    </Text>
                  </Flex>
                  
                  <Flex justifyContent="space-between" w="full" p={3} bg="green.900" rounded="lg">
                    <HStack>
                      <Text color="green.200" fontWeight="medium">Récompense totale</Text>
                      <Target size={16} color="#68D391" />
                    </HStack>
                    <Text color="green.300" fontSize="lg" fontWeight="bold">
                      +{totalReturn.toFixed(2)} {selectedToken}
                    </Text>
                  </Flex>
                  
                  {/* ✅ AFFICHAGE DU BONUS NFT si applicable */}
                  {hasNFTBonus && (
                    <Box p={3} bg="purple.900" rounded="lg" w="full">
                      <HStack justify="center" spacing={2}>
                        <Gift size={16} color="#B794F6" />
                        <Text color="purple.200" fontSize="sm" textAlign="center">
                          Bonus NFT: +{((totalReturn * bonusPercentage) / 100).toFixed(2)} {selectedToken} supplémentaires grâce à vos NFT
                        </Text>
                      </HStack>
                    </Box>
                  )}
                </VStack>
              </Box>
            )}

            {/* Sélection du token avec style amélioré */}
            <FormControl>
              <FormLabel color="gray.300" fontWeight="semibold" mb={3}>
                Token de dépôt
              </FormLabel>
              <Select 
                value={selectedToken} 
                onChange={handleTokenChange}
                bg="gray.800"
                border="1px solid"
                borderColor="gray.600"
                rounded="lg"
                _hover={{ borderColor: "blue.400" }}
                _focus={{ 
                  borderColor: "blue.500",
                  boxShadow: "0 0 0 1px #3182ce"
                }}
                color="white"
                iconColor="gray.400"
              >
                {availableTokens.map(token => (
                  <option key={token.symbol} value={token.symbol} style={{ backgroundColor: '#2d3748' }}>
                    {token.symbol}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Input montant avec indicateurs visuels */}
            <FormControl>
              <FormLabel color="gray.300" fontWeight="semibold" mb={3}>
                Montant à déposer
              </FormLabel>
              <Box position="relative">
                <Input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder={`Minimum ${plan.minAmount} ${selectedToken}`}
                  bg="gray.800"
                  border="2px solid"
                  borderColor={
                    amount && parseFloat(amount) > 0 
                      ? parseFloat(amount) < plan.minAmount || parseFloat(amount) > (selectedToken === 'USDT' ? balance.usdt : balance.usdc)
                        ? "red.500"
                        : "green.500"
                      : "gray.600"
                  }
                  rounded="lg"
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ 
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px #3182ce"
                  }}
                  color="white"
                  fontSize="lg"
                  py={6}
                  pr={16}
                />
                {amount && parseFloat(amount) > 0 && (
                  <Box
                    position="absolute"
                    right={3}
                    top="50%"
                    transform="translateY(-50%)"
                  >
                    {parseFloat(amount) < plan.minAmount || parseFloat(amount) > (selectedToken === 'USDT' ? balance.usdt : balance.usdc) ? (
                      <XCircle size={20} color="#F56565" />
                    ) : (
                      <CheckCircle size={20} color="#48BB78" />
                    )}
                  </Box>
                )}
              </Box>
              
              {/* Messages d'erreur stylés */}
              {amount && parseFloat(amount) > 0 && (
                <VStack spacing={2} mt={3} align="stretch">
                  {parseFloat(amount) < plan.minAmount && (
                    <Alert status="warning" variant="left-accent" bg="orange.900" borderColor="orange.500">
                      <AlertIcon />
                      <Text fontSize="sm">
                        Le montant minimum est de {plan.minAmount} {selectedToken}
                      </Text>
                    </Alert>
                  )}
                  {parseFloat(amount) > (selectedToken === 'USDT' ? balance.usdt : balance.usdc) && (
                    <Alert status="error" variant="left-accent" bg="red.900" borderColor="red.500">
                      <AlertIcon />
                      <Text fontSize="sm">
                        Solde insuffisant
                      </Text>
                    </Alert>
                  )}
                </VStack>
              )}
            </FormControl>

            {/* Balance avec style amélioré */}
            <Box 
              bg="gray.800" 
              rounded="lg" 
              p={4}
              border="1px solid"
              borderColor="gray.600"
            >
              <HStack justify="space-between">
                <HStack>
                  <Wallet size={20} color="#63B3ED" />
                  <Text color="gray.300">Balance disponible:</Text>
                </HStack>
                <Text color="white" fontSize="lg" fontWeight="semibold">
                  {selectedToken === 'USDT' ? balance.usdt : balance.usdc} {selectedToken}
                </Text>
              </HStack>
            </Box>

            {/* Erreurs d'investissement */}
            {investmentError && (
              <Alert 
                status="error" 
                variant="solid" 
                borderRadius="lg"
                bg="red.900"
                border="1px solid"
                borderColor="red.500"
              >
                <AlertIcon />
                <Text>{investmentError}</Text>
              </Alert>
            )}

            {/* Bouton de dépôt avec gradient et animations */}
            <Button
              size="lg"
              py={6}
              bg={hasNFTBonus 
                ? "linear-gradient(135deg, #38a169 0%, #2d7738 100%)"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              }
              color="white"
              _hover={{
                bg: hasNFTBonus
                  ? "linear-gradient(135deg, #2f855a 0%, #25602d 100%)"
                  : "linear-gradient(135deg, #5a67d8 0%, #6b4596 100%)",
                transform: "translateY(-2px)",
                boxShadow: hasNFTBonus
                  ? "0 10px 25px rgba(56, 161, 105, 0.4)"
                  : "0 10px 25px rgba(102, 126, 234, 0.4)"
              }}
              _active={{
                transform: "translateY(0px)"
              }}
              onClick={handleInvest}
              isLoading={isInvesting || loading}
              isDisabled={!amount || parseFloat(amount) <= 0}
              transition="all 0.2s ease"
              rounded="xl"
              fontWeight="bold"
              fontSize="lg"
            >
              {isInvesting || loading 
                ? "Traitement en cours..." 
                : hasNFTBonus 
                  ? `Effectuer le dépôt (avec bonus +${bonusPercentage.toFixed(0)}%)`
                  : "Effectuer le dépôt"
              }
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default InvestmentModal;