import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';
import { useWallet } from './WalletContext';

// Mappage des adresses de tokens vers leurs symboles
const TOKEN_SYMBOLS: Record<string, string> = {
  "0x55d398326f99059fF775485246999027B3197955": "USDT",
  "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d": "USDC"
};

// Interfaces pour les composants
export interface InvestmentPlan {
  id: number;
  name: string;
  apr: number;
  duration: number;
  minAmount: number;
  active: boolean;
  description?: string; // Ajout de la description
}

export interface Investment {
  id: string;
  planId: number;
  amount: number;
  startDate: Date;
  endDate: Date;
  lastRewardTime: Date;
  token: string;
  active: boolean;
  dailyReturn: number;
}

// Interfaces pour les données du contrat
interface ContractPlan {
  apr: bigint;
  duration: bigint;
  minAmount: bigint;
  active: boolean;
}

interface ContractStake {
  planId: bigint;
  amount: bigint;
  startTime: bigint;
  endTime: bigint;
  lastRewardTime: bigint;
  token: string;
  active: boolean;
}

interface InvestmentContextType {
  activeInvestments: Investment[];
  plans: InvestmentPlan[];
  calculateReturns: (stakeId: number) => Promise<number>;
  withdrawReturns: (investmentId: string) => Promise<void>;
  withdrawCapital: (investmentId: string) => Promise<void>; // Ajoutez cette ligne
  getTotalInvested: () => number;
  getTotalReturns: () => Promise<number>;
  invest: (planId: number, amount: number, token: 'USDT' | 'USDC') => Promise<boolean>;
  stakingContract: ethers.Contract | null;
}

const InvestmentContext = createContext<InvestmentContextType | undefined>(undefined);

export const InvestmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, isConnected } = useWallet();
  const [activeInvestments, setActiveInvestments] = useState<Investment[]>([]);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [stakingContract, setStakingContract] = useState<ethers.Contract | null>(null);

  // Initialiser le contrat
  useEffect(() => {
    if (window.ethereum && isConnected) {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contract = new ethers.Contract(
        CONTRACTS.STAKING.address,
        CONTRACTS.STAKING.abi,
        provider
      );
      setStakingContract(contract);
    }
  }, [isConnected]);

// Charger les plans
// Charger les plans
useEffect(() => {
  const loadPlans = async () => {
    console.log("Tentative de chargement des plans...");
    console.log("stakingContract disponible:", !!stakingContract);
    
    if (!stakingContract) {
      // Fournir des plans par défaut même sans contrat
      console.log("Aucun contrat disponible, utilisation de plans par défaut");
      const defaultPlans = [
        {
          id: 0,
          name: "Starter",
          description: "Plan d'entrée idéal pour les nouveaux investisseurs. Offre un équilibre entre rendement et durée de blocage courte.",
          apr: 12,
          duration: 30,
          minAmount: 100,
          active: true
        },
        {
          id: 1,
          name: "Standard",
          description: "Plan intermédiaire avec un meilleur taux APR. Recommandé pour les investisseurs qui souhaitent un rendement stable sur une période moyenne.",
          apr: 18,
          duration: 60,
          minAmount: 500,
          active: true
        },
        {
          id: 2,
          name: "Premium",
          description: "Plan avancé offrant un APR élevé sur une période plus longue. Idéal pour maximiser les rendements à moyen terme.",
          apr: 24,
          duration: 90,
          minAmount: 1000,
          active: true
        }
      ];
      setPlans(defaultPlans);
      return;
    }
    
    try {
      let currentPlans: InvestmentPlan[] = [];
      let planId = 0;
      
      // Plans de base avec des noms et descriptions
      const defaultPlanData = [
        {
          name: "Starter",
          description: "Plan d'entrée idéal pour les nouveaux investisseurs. Offre un équilibre entre rendement et durée de blocage courte."
        },
        {
          name: "Standard",
          description: "Plan intermédiaire avec un meilleur taux APR. Recommandé pour les investisseurs qui souhaitent un rendement stable sur une période moyenne."
        },
        {
          name: "Premium",
          description: "Plan avancé offrant un APR élevé sur une période plus longue. Idéal pour maximiser les rendements à moyen terme."
        },
        {
          name: "Enterprise",
          description: "Notre plan le plus performant avec le taux APR le plus élevé. Destiné aux investisseurs sérieux recherchant des rendements maximaux."
        }
      ];
      
      console.log("Début de la récupération des plans du contrat...");
      
      // Limites pour éviter les boucles infinies
      let nullPlansCount = 0;
      const MAX_NULL_PLANS = 3; // Arrêter après 3 plans nuls consécutifs
      const MAX_PLANS = 10;     // Limiter à 10 plans maximum
      
      // Valeurs par défaut en cas de valeurs trop petites
      const defaultAprValues = [12, 18, 24, 30]; // 12% pour Starter, 18% pour Standard, etc.
      const defaultDurationValues = [30, 60, 90, 180]; // 30 jours pour Starter, 60 jours pour Standard, etc.
      
      while (planId < MAX_PLANS) {
        try {
          console.log(`Tentative de récupération du plan ${planId}...`);
          const contractPlan: ContractPlan = await stakingContract.plans(planId);
          
          // Log des valeurs brutes pour vérification
          console.log(`Plan ${planId} valeurs brutes:`, {
            apr: contractPlan.apr.toString(),
            duration: contractPlan.duration.toString(),
            minAmount: contractPlan.minAmount.toString(),
            active: contractPlan.active
          });
          
          // Vérifier si le plan a des valeurs significatives
          const isNullPlan = (
            contractPlan.apr === 0n && 
            contractPlan.duration === 0n && 
            contractPlan.minAmount === 0n
          );
          
          if (isNullPlan) {
            nullPlansCount++;
            // Si nous avons trouvé plusieurs plans nuls consécutifs, sortir de la boucle
            if (nullPlansCount >= MAX_NULL_PLANS) {
              console.log(`${MAX_NULL_PLANS} plans nuls consécutifs trouvés, arrêt de la récupération.`);
              break;
            }
          } else {
            // Réinitialiser le compteur si nous trouvons un plan non nul
            nullPlansCount = 0;
            
            // Vérifier les valeurs formatées
            //const aprFormatted = Number(ethers.formatUnits(contractPlan.apr, 16));
            //const durationDays = Math.floor(Number(contractPlan.duration) / 86400);
            const aprFormatted = Number(contractPlan.apr) / 100; // Convertir directement 1000 -> 10.00%
            const durationDays = Number(contractPlan.duration); // Utiliser la valeur directement comme jours 
            
            console.log(`Plan ${planId} valeurs formatées:`, {
              apr: aprFormatted,
              durationDays: durationDays
            });
            
            // Si les valeurs sont trop petites (presque nulles), utiliser des valeurs par défaut
            const finalApr = aprFormatted < 0.1 ? defaultAprValues[planId] || 12 : aprFormatted;
            const finalDuration = durationDays < 1 ? defaultDurationValues[planId] || 30 : durationDays;
            
            // Obtenir les données par défaut pour ce plan
            const defaultData = defaultPlanData[planId] || {
              name: `Plan ${planId + 1}`,
              description: `Plan d'investissement avec un APR de ${finalApr}% sur une période de ${finalDuration} jours.`
            };
            
            // Conversion du plan du contrat au format attendu par l'interface avec valeurs corrigées
            currentPlans.push({
              id: planId,
              name: defaultData.name,
              description: defaultData.description,
              apr: finalApr,
              duration: finalDuration,
              minAmount: Number(ethers.formatUnits(contractPlan.minAmount, 18)) || 100,
              active: contractPlan.active
            });
          }
          
          planId++;
        } catch (error) {
          console.log(`Erreur lors de la récupération du plan ${planId}, fin de la boucle:`, error);
          break;
        }
      }
      
      console.log(`${currentPlans.length} plans récupérés:`, currentPlans);
      
      // Si aucun plan n'a été récupéré, utiliser des plans par défaut
      if (currentPlans.length === 0) {
        console.log("Aucun plan récupéré du contrat, utilisation de plans par défaut");
        currentPlans = [
          {
            id: 0,
            name: "Starter",
            description: "Plan d'entrée idéal pour les nouveaux investisseurs. Offre un équilibre entre rendement et durée de blocage courte.",
            apr: 12,
            duration: 30,
            minAmount: 100,
            active: true
          },
          {
            id: 1,
            name: "Standard",
            description: "Plan intermédiaire avec un meilleur taux APR. Recommandé pour les investisseurs qui souhaitent un rendement stable sur une période moyenne.",
            apr: 18,
            duration: 60,
            minAmount: 500,
            active: true
          },
          {
            id: 2,
            name: "Premium",
            description: "Plan avancé offrant un APR élevé sur une période plus longue. Idéal pour maximiser les rendements à moyen terme.",
            apr: 24,
            duration: 90,
            minAmount: 1000,
            active: true
          }
        ];
      }
      
      // Filtrer pour n'afficher que les plans actifs si nécessaire
      // Si vous voulez afficher tous les plans, commentez ou supprimez cette ligne
      // currentPlans = currentPlans.filter(plan => plan.active);
      
      setPlans(currentPlans);
    } catch (error) {
      console.error('Erreur générale lors du chargement des plans:', error);
      
      // Fournir des plans par défaut en cas d'erreur
      console.log("Erreur de chargement, utilisation de plans par défaut");
      const defaultPlans = [
        {
          id: 0,
          name: "Starter",
          description: "Plan d'entrée idéal pour les nouveaux investisseurs. Offre un équilibre entre rendement et durée de blocage courte.",
          apr: 12,
          duration: 30,
          minAmount: 100,
          active: true
        },
        {
          id: 1,
          name: "Standard",
          description: "Plan intermédiaire avec un meilleur taux APR. Recommandé pour les investisseurs qui souhaitent un rendement stable sur une période moyenne.",
          apr: 18,
          duration: 60,
          minAmount: 500,
          active: true
        },
        {
          id: 2,
          name: "Premium",
          description: "Plan avancé offrant un APR élevé sur une période plus longue. Idéal pour maximiser les rendements à moyen terme.",
          apr: 24,
          duration: 90,
          minAmount: 1000,
          active: true
        }
      ];
      setPlans(defaultPlans);
    }
  };

  loadPlans();
}, [stakingContract]);

  // Charger les investissements
  useEffect(() => {
    const loadInvestments = async () => {
      if (!stakingContract || !address) return;

      try {
        const contractStakes: ContractStake[] = await stakingContract.getUserStakes(address);
        
        // Convertir les stakes du contrat au format attendu par l'interface
        const investments: Investment[] = contractStakes
          .filter(stake => stake.active)
          .map((stake, index) => {
            const startTime = Number(stake.startTime) * 1000;
            const endTime = Number(stake.endTime) * 1000;
            const amount = Number(ethers.formatUnits(stake.amount, 18));
            
            // Calcul du rendement quotidien basé sur le plan
            const plan = plans.find(p => p.id === Number(stake.planId));
            const dailyReturn = plan 
              ? (amount * (plan.apr / 100)) / 365
              : 0;
            
            return {
              id: index.toString(), // Utiliser l'index comme ID
              planId: Number(stake.planId),
              amount: amount,
              startDate: new Date(startTime),
              endDate: new Date(endTime),
              lastRewardTime: new Date(Number(stake.lastRewardTime) * 1000),
              token: TOKEN_SYMBOLS[stake.token] || stake.token, // Convertir l'adresse en symbole
              active: stake.active,
              dailyReturn: dailyReturn
            };
          });
        
        setActiveInvestments(investments);
      } catch (error) {
        console.error('Erreur lors du chargement des investissements:', error);
      }
    };

    loadInvestments();
  }, [stakingContract, address, plans]);

  const calculateReturns = async (stakeId: number): Promise<number> => {
    if (!stakingContract || !address) return 0;
    
    try {
      const rewards = await stakingContract.calculateRewards(address, stakeId);
      return Number(ethers.formatUnits(rewards, 18));
    } catch (error) {
      console.error('Erreur lors du calcul des récompenses:', error);
      return 0;
    }
  };

  const withdrawReturns = async (investmentId: string): Promise<void> => {
    if (!stakingContract) throw new Error('Contract not initialized');
    
    const stakeId = parseInt(investmentId);
    if (isNaN(stakeId)) throw new Error('ID d\'investissement invalide');
    
    try {
      const signer = await (new ethers.BrowserProvider(window.ethereum as any)).getSigner();
      const contractWithSigner = stakingContract.connect(signer);
      const tx = await contractWithSigner.claimRewards(stakeId);
      await tx.wait();
    } catch (error) {
      console.error('Erreur lors du retrait des récompenses:', error);
      throw error;
    }
  };

  const getTotalInvested = (): number => {
    return activeInvestments.reduce((total, investment) => {
      return total + investment.amount;
    }, 0);
  };

  const invest = async (planId: number, amount: number, token: 'USDT' | 'USDC'): Promise<boolean> => {
    if (!stakingContract) throw new Error('Contract not initialized');
    
    try {
      const signer = await (new ethers.BrowserProvider(window.ethereum as any)).getSigner();
      const contractWithSigner = stakingContract.connect(signer);
      
      // Convertir le montant en BigInt avec 18 décimales
      const amountInWei = ethers.parseUnits(amount.toString(), 18);
      
      // Adresses des tokens (à définir au niveau du contexte)
      const TOKEN_ADDRESSES = {
        USDT: "0x55d398326f99059fF775485246999027B3197955", 
        USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" 
      };
      
      // Trouver l'adresse du token
      const tokenAddress = token === 'USDT' 
        ? TOKEN_ADDRESSES.USDT 
        : TOKEN_ADDRESSES.USDC;
      
      // Utiliser stake au lieu de invest (selon votre ABI)
      const tx = await (contractWithSigner as any).stake(planId, amountInWei, tokenAddress);
      await tx.wait()
      
      // Rafraîchir les investissements après l'investissement
      const updatedStakes = await stakingContract.getUserStakes(address);
      const updatedInvestments: Investment[] = updatedStakes
        .filter((stake: ContractStake) => stake.active)
        .map((stake: ContractStake, index: number) => {
          const startTime = Number(stake.startTime) * 1000;
          const endTime = Number(stake.endTime) * 1000;
          const stakeAmount = Number(ethers.formatUnits(stake.amount, 18));
          
          const plan = plans.find(p => p.id === Number(stake.planId));
          const dailyReturn = plan 
            ? (stakeAmount * (plan.apr / 100)) / 365
            : 0;
          
          return {
            id: index.toString(),
            planId: Number(stake.planId),
            amount: stakeAmount,
            startDate: new Date(startTime),
            endDate: new Date(endTime),
            lastRewardTime: new Date(Number(stake.lastRewardTime) * 1000),
            token: stake.token,
            active: stake.active,
            dailyReturn: dailyReturn
          };
        });
      
      setActiveInvestments(updatedInvestments);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'investissement:', error);
      return false;
    }
  };

  const getTotalReturns = async (): Promise<number> => {
    try {
      const rewards = await Promise.all(
        activeInvestments.map((investment) => calculateReturns(parseInt(investment.id)))
      );
      return rewards.reduce((total, reward) => total + reward, 0);
    } catch (error) {
      console.error('Erreur lors du calcul des rendements totaux:', error);
      return 0;
    }
  };

  const withdrawCapital = async (investmentId: string): Promise<void> => {
  if (!stakingContract) throw new Error('Contract not initialized');
  
  const stakeId = parseInt(investmentId);
  if (isNaN(stakeId)) throw new Error('ID d\'investissement invalide');
  
  try {
    // Vérifier si la période de blocage est terminée
    const investment = activeInvestments.find(inv => inv.id === investmentId);
    if (!investment) {
      throw new Error('Investissement non trouvé');
    }
    
    const now = new Date();
    const endDate = new Date(investment.endDate);
    
    if (now < endDate) {
      throw new Error('La période de blocage n\'est pas encore terminée');
    }
    
    const signer = await (new ethers.BrowserProvider(window.ethereum as any)).getSigner();
    const contractWithSigner = stakingContract.connect(signer);
    
    // Appeler la fonction endStake du contrat
    const tx = await contractWithSigner.endStake(stakeId);
    await tx.wait();
    
    // Mettre à jour la liste des investissements après le retrait
    setActiveInvestments(prevInvestments => 
      prevInvestments.filter(inv => inv.id !== investmentId)
    );
  } catch (error) {
    console.error('Erreur lors du retrait du capital:', error);
    throw error;
  }
};

  const value = {
    activeInvestments,
    plans,
    calculateReturns,
    withdrawReturns,
    getTotalInvested,
    getTotalReturns,
    invest,
    withdrawCapital,
    stakingContract
  };

  return (
    <InvestmentContext.Provider value={value}>
      {children}
    </InvestmentContext.Provider>
  );
};

export const useInvestment = () => {
  const context = useContext(InvestmentContext);
  if (context === undefined) {
    throw new Error('useInvestment doit être utilisé à l\'intérieur d\'un InvestmentProvider');
  }
  return context;
};