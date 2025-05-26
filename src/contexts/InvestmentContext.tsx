import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './WalletContext';
import { CONTRACTS } from '../config/contracts';
import { TOKENS } from '../config/tokens';
import { useContracts } from '../hooks/useContracts';

export interface InvestmentPlan {
  id: number;
  name: string;
  apr: number;
  duration: number;
  minAmount: number;
  description: string;
  active: boolean;
}

export interface Investment {
  id: string;
  planId: number;
  amount: number;
  token: string;
  startDate: Date;
  endDate: Date;
  dailyReturn: number;
  accumulatedReturns: number;
  lastWithdrawal: Date | null;
  isActive: boolean;
}

interface InvestmentContextType {
  plans: InvestmentPlan[];
  activeInvestments: Investment[];
  loading: boolean;
  error: string | null;
  invest: (planId: number, amount: number, token: string) => Promise<boolean>;
  withdrawReturns: (investmentId: string) => Promise<boolean>;
  calculateReturns: (investment: Investment) => number;
  getTotalInvested: () => number;
  getTotalReturns: () => number;
  refreshInvestments: () => Promise<void>;
}

interface InvestmentProviderProps {
  children: ReactNode;
}

const InvestmentContext = createContext<InvestmentContextType | undefined>(undefined);

export const InvestmentProvider = ({ children }: InvestmentProviderProps) => {
  const { isConnected, address, balance } = useWallet();
  const { stakingContract, provider } = useContracts();
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [activeInvestments, setActiveInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = async () => {
    if (!stakingContract) return;

    try {
      const defaultPlans = [
        {
          id: 0,
          name: 'Débutant',
          apr: 25,
          duration: 30,
          minAmount: 50,
          description: 'Plan de staking avec 25% APR sur 30 jours',
          active: true
        },
        {
          id: 1,
          name: 'Croissance',
          apr: 30,
          duration: 60,
          minAmount: 200,
          description: 'Plan de staking avec 30% APR sur 60 jours',
          active: true
        },
        {
          id: 2,
          name: 'Premium',
          apr: 35,
          duration: 90,
          minAmount: 500,
          description: 'Plan de staking avec 35% APR sur 90 jours',
          active: true
        }
      ];

      const plansData = await Promise.all(
        defaultPlans.map(async (plan) => {
          const planInfo = await stakingContract.plans(plan.id);
          return {
            ...plan,
            apr: Number(planInfo.apr) / 100,
            duration: Number(planInfo.duration),
            minAmount: Number(ethers.formatUnits(planInfo.minAmount, 18)),
            active: planInfo.active
          };
        })
      );

      setPlans(plansData);
    } catch (error) {
      console.error('Erreur lors du chargement des plans:', error);
      setError('Erreur lors du chargement des plans');
    }
  };

  const invest = async (planId: number, amount: number, token: string) => {
    console.log('Méthode invest appelée avec:', { planId, amount, token });
    console.log('Wallet connecté:', isConnected);
    console.log('Contrat de staking:', stakingContract);
    console.log('Adresse:', address);
  
    if (!isConnected || !stakingContract || !address || !window.ethereum) {
      console.error('Conditions non remplies pour investir');
      setError('Portefeuille non connecté');
      return false;
    }
  
    const plan = plans.find(p => p.id === planId);
    console.log('Plan trouvé:', plan);
  
    if (!plan) {
      console.error('Plan invalide');
      setError('Plan invalide');
      return false;
    }
  
    if (!plan.active) {
      console.error('Plan non actif');
      setError('Ce plan n\'est pas actif actuellement');
      return false;
    }
  
    if (amount < plan.minAmount) {
      console.error(`Montant minimal non respecté. Minimum: ${plan.minAmount}, Reçu: ${amount}`);
      setError(`Le montant minimum pour ce plan est de ${plan.minAmount} ${token}`);
      return false;
    }
  
    const userBalance = token === 'USDT' ? balance.usdt : balance.usdc;
    console.log('Balance utilisateur:', userBalance);
  
    if (amount > userBalance) {
      console.error(`Solde insuffisant. Balance: ${userBalance}, Demandé: ${amount}`);
      setError(`Solde ${token} insuffisant`);
      return false;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      const tokenAddress = TOKENS[token].address;
      console.log('Adresse du token:', tokenAddress);
  
      // Créez un provider avec Signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
  
      const tokenContract = new ethers.Contract(
        tokenAddress,
        TOKENS[token].abi,
        signer
      );
      console.log('Contrat de token créé');
  
      const amountWei = ethers.parseUnits(amount.toString(), TOKENS[token].decimals);
      console.log('Montant en Wei:', amountWei.toString());
  
      // Vérifier l'allowance
      const allowance = await tokenContract.allowance(address, CONTRACTS.STAKING.address);
      console.log('Allowance actuelle:', allowance.toString());
      
      if (allowance < amountWei) {
        console.log('Tentative d\'approbation du contrat');
        try {
          const approveTx = await tokenContract.approve(CONTRACTS.STAKING.address, amountWei);
          const approveReceipt = await approveTx.wait();
          console.log('Approbation réussie', approveReceipt);
        } catch (approveError) {
          console.error('Erreur lors de l\'approbation:', approveError);
          setError('Impossible d\'approuver le contrat');
          return false;
        }
      }
  
      // Vérifier si le token est autorisé
      const isTokenAllowed = await stakingContract.allowedTokens(tokenAddress);
      console.log('Token autorisé:', isTokenAllowed);
      
      if (!isTokenAllowed) {
        console.error('Token non autorisé');
        setError('Ce token n\'est pas autorisé pour le staking');
        return false;
      }
  
      console.log('Tentative de stake');
      const stakingContractSigned = stakingContract.connect(signer);
      const tx = await stakingContractSigned.stake(planId, amountWei, tokenAddress, {
        gasLimit: 500000
      });
      console.log('Transaction envoyée:', tx.hash);
  
      const receipt = await tx.wait();
      console.log('Transaction confirmée', receipt);
  
      // Recharger tous les investissements après la transaction
      await loadInvestments();
  
      console.log('Investissement ajouté avec succès');
      return true;
    } catch (error) {
      console.error('Erreur détaillée lors de l\'investissement:', error);
      
      // Gestion des erreurs
      if (error instanceof Error) {
        if (error.message.includes('user rejected transaction')) {
          setError('Transaction refusée par l\'utilisateur');
        } else if (error.message.includes('insufficient funds')) {
          setError('Fonds insuffisants pour payer les frais de gas');
        } else {
          setError(error.message);
        }
      } else {
        setError('Échec de l\'investissement');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const withdrawReturns = async (investmentId: string) => {
    if (!isConnected || !stakingContract) {
      setError('Portefeuille non connecté');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const tx = await stakingContract.claimRewards(investmentId);
      await tx.wait();

      const investmentIndex = activeInvestments.findIndex(inv => inv.id === investmentId);
      if (investmentIndex === -1) throw new Error('Investissement non trouvé');

      const updatedInvestment = {
        ...activeInvestments[investmentIndex],
        accumulatedReturns: 0,
        lastWithdrawal: new Date()
      };

      const updatedInvestments = [...activeInvestments];
      updatedInvestments[investmentIndex] = updatedInvestment;
      setActiveInvestments(updatedInvestments);

      return true;
    } catch (error) {
      console.error('Erreur de retrait:', error);
      setError(error instanceof Error ? error.message : 'Échec du retrait');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const calculateReturns = useCallback((investment: Investment) => {
    const now = new Date();
    const startDate = new Date(investment.startDate);
    
    if (now < startDate) return 0;
    
    const lastDate = investment.lastWithdrawal ? new Date(investment.lastWithdrawal) : startDate;
    const daysPassed = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return investment.accumulatedReturns + (investment.dailyReturn * daysPassed);
  }, []);

  const getTotalInvested = useCallback(() => {
    return activeInvestments.reduce((total, investment) => total + investment.amount, 0);
  }, [activeInvestments]);

  const getTotalReturns = useCallback(() => {
    return activeInvestments.reduce((total, investment) => {
      return total + calculateReturns(investment);
    }, 0);
  }, [activeInvestments, calculateReturns]);

  const loadInvestments = async () => {
    console.log('Début de loadInvestments');
    console.log('isConnected:', isConnected);
    console.log('stakingContract:', stakingContract);
    console.log('address:', address);
  
    if (!isConnected || !stakingContract || !address) {
      console.log('Conditions non remplies pour charger les investissements');
      return;
    }
  
    try {
      console.log('Tentative de récupération des stakes');
      const userStakes = await stakingContract.getUserStakes(address);
      console.log('Nombre de stakes:', userStakes.length);
      console.log('Stakes bruts:', userStakes);
      
      const investments: Investment[] = userStakes.map((stake: any, index: number) => {
        console.log(`Stake ${index}:`, stake);
        
        // Destructuration des valeurs du stake
        const [
          planId, 
          amount, 
          startTime, 
          endTime, 
          lastRewardTime, 
          tokenAddress, 
          active
        ] = stake;
  
        const tokenSymbol = Object.entries(TOKENS).find(
          ([, token]) => token.address.toLowerCase() === tokenAddress.toLowerCase()
        )?.[0] || 'UNKNOWN';
  
        const investment: Investment = {
          id: `stake-${index}`,
          planId: Number(planId),
          amount: parseFloat(ethers.formatUnits(amount, 18)),
          token: tokenSymbol,
          startDate: new Date(Number(startTime) * 1000),
          endDate: new Date(Number(endTime) * 1000),
          dailyReturn: parseFloat(ethers.formatUnits(amount, 18)) * 0.1 / 365, // Estimation approximative
          accumulatedReturns: 0,
          lastWithdrawal: lastRewardTime > 0 
            ? new Date(Number(lastRewardTime) * 1000) 
            : null,
          isActive: Boolean(active)
        };
  
        console.log('Investment mappé:', investment);
        return investment;
      });
  
      console.log('Investissements finaux:', investments);
      setActiveInvestments(investments);
    } catch (error) {
      console.error('Erreur lors du chargement des investissements:', error);
      console.error('Détails de l\'erreur:', error);
    }
  };

  useEffect(() => {
    if (stakingContract) {
      loadPlans();
    }
  }, [stakingContract]);

  useEffect(() => {
    if (isConnected && address && stakingContract) {
      console.log('Chargement des investissements');
      console.log('Adresse:', address);
      console.log('Contrat de staking:', stakingContract);
      
      loadInvestments();
    }
  }, [isConnected, address, stakingContract]);

  const value = {
    plans,
    activeInvestments,
    loading,
    error,
    invest,
    withdrawReturns,
    calculateReturns,
    getTotalInvested,
    getTotalReturns,
    refreshInvestments: loadInvestments
  };

  return <InvestmentContext.Provider value={value}>{children}</InvestmentContext.Provider>;
};

export const useInvestment = () => {
  const context = useContext(InvestmentContext);
  if (context === undefined) {
    throw new Error('useInvestment doit être utilisé à l\'intérieur d\'un InvestmentProvider');
  }
  return context;
};