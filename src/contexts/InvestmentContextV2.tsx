//src/contexts/InvestmentContextV2.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { CONTRACTSV2 } from '../config/contractsV2';
import { useWallet } from './WalletContext';

// Mappage des adresses de tokens vers leurs symboles
const TOKEN_SYMBOLS: Record<string, string> = {
  "0x55d398326f99059fF775485246999027B3197955": "USDT",
  "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d": "USDC"
};

// Interfaces pour les composants
export interface InvestmentPlanV2 {
  id: number;
  name: string;
  apr: number;
  duration: number;
  minAmount: number;
  active: boolean;
  description?: string; // Ajout de la description
}

export interface InvestmentV2 {
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
interface ContractPlanV2 {
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
  activeInvestments: InvestmentV2[];
  plans: InvestmentPlanV2[];
  calculateReturns: (stakeId: number) => Promise<number>;
  withdrawReturns: (investmentId: string) => Promise<void>;
  withdrawCapital: (investmentId: string) => Promise<void>; // Ajoutez cette ligne
  getTotalInvested: () => number;
  getTotalReturns: () => Promise<number>;
  invest: (planId: number, amount: number, token: 'USDT' | 'USDC') => Promise<boolean>;
  stakingContract: ethers.Contract | null;
  getStakeDetails: (userAddress: string, stakeId: number) => Promise<any>;
}

const InvestmentContextV2 = createContext<InvestmentContextType | undefined>(undefined);

export const InvestmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, isConnected } = useWallet();
  const [activeInvestments, setActiveInvestments] = useState<InvestmentV2[]>([]);
  const [plans, setPlans] = useState<InvestmentPlanV2[]>([]);
  const [stakingContract, setStakingContract] = useState<ethers.Contract | null>(null);

  // Initialiser le contrat
  useEffect(() => {
    if (window.ethereum && isConnected) {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contractV2 = new ethers.Contract(
        CONTRACTSV2.STAKING.address,
        CONTRACTSV2.STAKING.abi,
        provider
      );
      setStakingContract(contractV2);
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
          description: "Plan d'entrée idéal pour les nouveaux utilisateurs. Offre un équilibre entre récompense et durée de blocage courte.",
          apr: 12,
          duration: 30,
          minAmount: 150,
          active: true
        },
        {
          id: 1,
          name: "Standard",
          description: "Plan intermédiaire avec de meilleurs récompenses. Recommandé pour les utilisateurs qui souhaitent une récompense stable sur une période moyenne.",
          apr: 18,
          duration: 60,
          minAmount: 500,
          active: true
        },
        {
          id: 2,
          name: "Premium",
          description: "Plan avancé offrant des récompenses élevé sur une période plus longue. Idéal pour maximiser les récompenses à moyen terme.",
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
      let currentPlans: InvestmentPlanV2[] = [];
      let planId = 0;
      
      // Plans de base avec des noms et descriptions
      const defaultPlanData = [
        {
          name: "Starter",
          description: "Plan d'entrée idéal pour les nouveaux utilisateurs. Offre un équilibre entre récompense et durée de blocage courte."
        },
        {
          name: "Standard",
          description: "Plan intermédiaire avec de meilleurs récompenses. Recommandé pour les utilisateurs qui souhaitent une récompense stable sur une période moyenne."
        },
        {
          name: "Premium",
          description: "Plan avancé offrant des récompenses élevés sur une période plus longue. Idéal pour maximiser les récompenses à moyen terme."
        },
        {
          name: "Enterprise",
          description: "Notre plan le plus performant avec des récompenses les plus élevés. Destiné aux utilisateurs sérieux recherchant les meilleures récompenses."
        }
      ];
      
      console.log("Début de la récupération des plans du contrat...");
      
      // Limites pour éviter les boucles infinies
      let nullPlansCount = 0;
      const MAX_NULL_PLANS = 3; // Arrêter après 3 plans nuls consécutifs
      const MAX_PLANS = 10;     // Limiter à 10 plans maximum
      
      // Valeurs par défaut en cas de valeurs trop petites
      const defaultAprValues = [15, 20, 25, 30]; // 15% pour Starter, 20% pour Standard, etc.
      const defaultDurationValues = [30, 90, 180, 360]; // 30 jours pour Starter, 90 jours pour Standard, etc.
      
      while (planId < MAX_PLANS) {
        try {
          console.log(`Tentative de récupération du plan ${planId}...`);
          const contractPlan: ContractPlanV2 = await stakingContract.plans(planId);
          
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
              description: `Plan de récompense avec des récompense variables de ${finalApr}% sur une période de ${finalDuration} jours.`
            };
            
            // Conversion du plan du contrat au format attendu par l'interface avec valeurs corrigées
            currentPlans.push({
              id: planId,
              name: defaultData.name,
              description: defaultData.description,
              apr: finalApr,
              duration: finalDuration,
              minAmount: Number(ethers.formatUnits(contractPlan.minAmount, 18)) || 150,
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
            description: "Plan d'entrée idéal pour les nouveaux utilisateurs. Offre un équilibre entre récompense et durée de blocage courte.",
            apr: 12,
            duration: 30,
            minAmount: 150,
            active: true
          },
          {
            id: 1,
            name: "Standard",
            description: "Plan intermédiaire avec de meilleures récompenses. Recommandé pour les utilisateurs qui souhaitent une récompense stable sur une période moyenne.",
            apr: 18,
            duration: 60,
            minAmount: 150,
            active: true
          },
          {
            id: 2,
            name: "Premium",
            description: "Plan avancé offrant des récompenses élevés sur une période plus longue. Idéal pour maximiser les récompenses à moyen terme.",
            apr: 24,
            duration: 90,
            minAmount: 150,
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
          description: "Plan d'entrée idéal pour les nouveaux utilisateurs. Offre un équilibre entre récompense et durée de blocage courte.",
          apr: 12,
          duration: 30,
          minAmount: 150,
          active: true
        },
        {
          id: 1,
          name: "Standard",
          description: "Plan intermédiaire avec de meilleurs récompenses. Recommandé pour les utilisateurs qui souhaitent une récompense stable sur une période moyenne.",
          apr: 18,
          duration: 60,
          minAmount: 150,
          active: true
        },
        {
          id: 2,
          name: "Premium",
          description: "Plan avancé offrant des récompenses élevés sur une période plus longue. Idéal pour maximiser les récompenses à moyen terme.",
          apr: 24,
          duration: 90,
          minAmount: 150,
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
      
      console.log("🔍 Stakes récupérés du contrat:", contractStakes.length);
      
      // Convertir TOUS les stakes avec leur index original
      const allInvestments: InvestmentV2[] = contractStakes.map((stake, originalIndex) => {
        const startTime = Number(stake.startTime) * 1000;
        const endTime = Number(stake.endTime) * 1000;
        const amount = Number(ethers.formatUnits(stake.amount, 18));
        
        // Calcul du rendement quotidien basé sur le plan
        const plan = plans.find(p => p.id === Number(stake.planId));
        const dailyReturn = plan 
          ? (amount *(plan.apr / 100)) / 365
          : 0;
        
        console.log(`📋 Stake ${originalIndex}:`, {
          amount: amount,
          planId: Number(stake.planId),
          active: stake.active,
          startDate: new Date(startTime).toLocaleString(),
          endDate: new Date(endTime).toLocaleString()
        });
        
        return {
          id: originalIndex.toString(), // ← INDEX ORIGINAL = ID
          planId: Number(stake.planId),
          amount: amount,
          baseamount: amount, // Ajout de baseamount pour le calcul des rendements
          startDate: new Date(startTime),
          endDate: new Date(endTime),
          lastRewardTime: new Date(Number(stake.lastRewardTime) * 1000),
          token: TOKEN_SYMBOLS[stake.token] || stake.token,
          active: stake.active,
          dailyReturn: dailyReturn
        };
      });
      
      // Filtrer pour ne garder QUE les stakes actifs pour l'affichage
      const activeInvestments = allInvestments.filter(investment => investment.active);
      
      console.log("✅ Stakes actifs à afficher:", activeInvestments.map(inv => ({
        id: inv.id,
        amount: inv.amount,
        active: inv.active
      })));
      
      setActiveInvestments(activeInvestments);
    } catch (error) {
      console.error('Erreur lors du chargement des récompenses:', error);
    }
  };

  loadInvestments();
}, [stakingContract, address, plans]);

// La fonction calculateReturns reste la même
const calculateReturns = async (stakeId: number): Promise<number> => {
  if (!stakingContract || !address) return 0;
  
  try {
    console.log(`🔍 calculateRewards - StakeId: ${stakeId}`);
    
    const rewards = await stakingContract.calculateRewards(address, stakeId);
    const formattedRewards = Number(ethers.formatUnits(rewards, 18));
    
    console.log(`💰 Rewards pour stake ${stakeId}: ${formattedRewards.toFixed(8)}`);
    
    return formattedRewards;
  } catch (error) {
    console.error(`❌ Erreur calculateRewards (stakeId: ${stakeId}):`, error);
    return 0;
  }
};

  const withdrawReturns = async (investmentId: string): Promise<void> => {
    if (!stakingContract) throw new Error('Contract not initialized');
    
    const stakeId = parseInt(investmentId);
    if (isNaN(stakeId)) throw new Error('ID dépot invalide');
    
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
    
    // Adresses des tokens (à définir au niveau du contexte)
    const TOKEN_ADDRESSES = {
      USDT: "0x55d398326f99059fF775485246999027B3197955", 
      USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" 
    };
    
    // Trouver l'adresse du token
    const tokenAddress = token === 'USDT' 
      ? TOKEN_ADDRESSES.USDT 
      : TOKEN_ADDRESSES.USDC;
    
    // Convertir le montant en BigInt avec 18 décimales
    const amountInWei = ethers.parseUnits(amount.toString(), 18);
    
    // 1. Vérifier et demander l'approbation si nécessaire
    // Créer une instance du contrat de token
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)"
      ],
      signer
    );
    
    // Vérifier l'allowance actuelle
    const userAddress = await signer.getAddress();
    const currentAllowance = await tokenContract.allowance(userAddress, CONTRACTSV2.STAKING.address);
    
    console.log("Vérification de l'allowance pour le token:", token);
    console.log("Adresse du token:", tokenAddress);
    console.log("Adresse du contrat de staking:", CONTRACTSV2.STAKING.address);
    console.log("Allowance actuelle:", ethers.formatUnits(currentAllowance, 18));
    console.log("Montant requis:", amount.toString());
    
    // Si l'allowance est insuffisante, demander une approbation
    if (currentAllowance < amountInWei) {
      console.log("Allowance insuffisante. Demande d'approbation...");
      
      // Informer l'utilisateur qu'une approbation est nécessaire
      alert("Vous devez d'abord approuver le contrat à utiliser vos tokens. Une fenêtre de confirmation va s'ouvrir après avoir cliqué sur OK.");
      
      try {
        // Approuver un montant important pour éviter de futures approbations
        // Utilisation d'un grand nombre mais pas infini pour plus de sécurité
        const approvalAmount = ethers.parseUnits("1000000", 18); // 1 million de tokens
        
        console.log("Envoi de la transaction d'approbation...");
        const approveTx = await tokenContract.approve(CONTRACTSV2.STAKING.address, approvalAmount);
        
        console.log("Transaction d'approbation envoyée:", approveTx.hash);
        console.log("En attente de confirmation...");
        
        // Attendre que la transaction soit confirmée
        const approveReceipt = await approveTx.wait();
        console.log("Approbation confirmée! Transaction hash:", approveReceipt.hash);
      } catch (approvalError) {
        console.error("Erreur lors de l'approbation:", approvalError);
        throw new Error("L'approbation a échoué: " + (approvalError.message || approvalError));
      }
    } else {
      console.log("Allowance suffisante, poursuite du dépôt");
    }
    
    // 2. Procéder à l'investissement
    console.log("Connexion au contrat de staking avec le signer");
    const contractWithSigner = stakingContract.connect(signer);
    
    console.log("Préparation de la transaction stake...");
    console.log("Paramètres:", planId, amountInWei.toString(), tokenAddress);
    
    // Utiliser stake au lieu de invest (selon votre ABI)
    console.log("Envoi de la transaction stake...");
    const tx = await contractWithSigner.stake(planId, amountInWei, tokenAddress);
    
    console.log("Transaction stake envoyée:", tx.hash);
    console.log("En attente de confirmation...");
    
    // Attendre la confirmation de la transaction
    await tx.wait();
    console.log("Transaction stake confirmée!");
    
    // 3. Rafraîchir les investissements après l'investissement
    try {
      console.log("Récupération des récompenses mis à jour...");
      const updatedStakes = await stakingContract.getUserStakes(userAddress);
      
      // Convertir et mettre à jour les investissements selon votre implémentation actuelle
      const updatedInvestments: InvestmentV2[] = updatedStakes
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
            token: TOKEN_SYMBOLS[stake.token] || stake.token,
            active: stake.active,
            dailyReturn: dailyReturn
          };
        });
      
      setActiveInvestments(updatedInvestments);
      console.log("Récompenses mises à jour!");
    } catch (refreshError) {
      console.error("Erreur lors de la mise à jour des récompenses:", refreshError);
      // On continue quand même car l'investissement a réussi
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors du dépot:', error);
    throw error; // Relancer l'erreur pour que handleInvest puisse la gérer
  }
};

  const getTotalReturns = async (): Promise<number> => {
    try {
      const rewards = await Promise.all(
        activeInvestments.map((investment) => calculateReturns(parseInt(investment.id)))
      );
      return rewards.reduce((total, reward) => total + reward, 0);
    } catch (error) {
      console.error('Erreur lors du calcul des récompenses totaux:', error);
      return 0;
    }
  };

  const withdrawCapital = async (investmentId: string): Promise<void> => {
  if (!stakingContract) throw new Error('Contract not initialized');
  
  const stakeId = parseInt(investmentId);
  if (isNaN(stakeId)) throw new Error('ID de récompense invalide');
  
  try {
    // Vérifier si la période de blocage est terminée
    const investment = activeInvestments.find(inv => inv.id === investmentId);
    if (!investment) {
      throw new Error('Récompense non trouvé');
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

const getStakeDetails = async (userAddress: string, stakeId: number) => {
  if (!stakingContract || !userAddress) {
    throw new Error('Contract ou adresse utilisateur manquant');
  }
  
  try {
    const details = await stakingContract.getStakeDetails(userAddress, stakeId);
    return {
      baseRewards: details[0],
      bonusRewards: details[1], 
      totalRewards: details[2],
      nftMultiplier: details[3],
      currentUserMultiplier: details[4]
    };
  } catch (error) {
    console.error('Erreur getStakeDetails:', error);
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
    stakingContract,
    getStakeDetails,
  };

  return (
    <InvestmentContextV2.Provider value={value}>
      {children}
    </InvestmentContextV2.Provider>
  );
};

export const useInvestmentV2 = () => {
  const context = useContext(InvestmentContextV2);
  if (context === undefined) {
    throw new Error('useInvestment doit être utilisé à l\'intérieur d\'un InvestmentProvider');
  }
  return context;
};