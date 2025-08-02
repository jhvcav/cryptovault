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
  description?: string;
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
  nftMultiplierAtStake: number;
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
  nftMultiplierAtStake: bigint;
}

interface InvestmentContextType {
  activeInvestments: InvestmentV2[];
  plans: InvestmentPlanV2[];
  calculateReturns: (stakeId: number) => Promise<number>;
  withdrawReturns: (investmentId: string) => Promise<void>;
  withdrawCapital: (investmentId: string) => Promise<void>;
  getTotalInvested: () => number;
  getTotalReturns: () => Promise<number>;
  invest: (planId: number, amount: number, token: 'USDT' | 'USDC') => Promise<boolean>;
  stakingContract: ethers.Contract | null;
  getStakeDetails: (userAddress: string, stakeId: number) => Promise<any>;
  calculateDailyReturns: (stakeId: number) => Promise<number>;
  getDetailedStakeInfo: (stakeId: number) => Promise<{
    baseRewards: number;
    bonusRewards: number;
    totalRewards: number;
    nftMultiplierAtStake: number;
    currentUserMultiplier: number;
    dailyReturnWithNFT: number;
    baseDailyReturn: number;
  }>;
  isLoading?: boolean;
  error?: any;
}

const InvestmentContextV2 = createContext<InvestmentContextType | undefined>(undefined);

export const InvestmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, isConnected } = useWallet();
  const [activeInvestments, setActiveInvestments] = useState<InvestmentV2[]>([]);
  const [plans, setPlans] = useState<InvestmentPlanV2[]>([]);
  const [stakingContract, setStakingContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // ✅ FONCTION UTILITAIRE - Conversion sécurisée des timestamps
  const safeTimestampToDate = (timestamp: bigint | number, label: string = ""): Date => {
    try {
      // Convertir en number si c'est un bigint
      const numTimestamp = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
      
      // Vérifier si c'est un timestamp valide (en secondes)
      if (numTimestamp <= 0 || numTimestamp > 4294967295) { // Max Unix timestamp 32-bit
        console.warn(`⚠️ Timestamp invalide ${label}:`, numTimestamp);
        return new Date(); // Retourner la date actuelle par défaut
      }
      
      // Multiplier par 1000 pour convertir de secondes vers millisecondes
      const dateMs = numTimestamp * 1000;
      const date = new Date(dateMs);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.warn(`⚠️ Date invalide créée ${label}:`, dateMs);
        return new Date(); // Retourner la date actuelle par défaut
      }
      
      console.log(`✅ Timestamp converti ${label}:`, {
        originalTimestamp: numTimestamp,
        dateMs: dateMs,
        date: date.toISOString()
      });
      
      return date;
    } catch (error) {
      console.error(`❌ Erreur conversion timestamp ${label}:`, error);
      return new Date(); // Retourner la date actuelle par défaut
    }
  };

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
  useEffect(() => {
    const loadPlans = async () => {
      console.log("Tentative de chargement des plans...");
      console.log("stakingContract disponible:", !!stakingContract);
      
      if (!stakingContract) {
        console.log("Aucun contrat disponible, utilisation de plans par défaut");
        const defaultPlans = [
          {
            id: 0,
            name: "Starter",
            description: "Plan d'entrée idéal pour les nouveaux utilisateurs. Offre un équilibre entre récompense et durée de blocage courte.",
            apr: 15,
            duration: 30,
            minAmount: 150,
            active: true
          },
          {
            id: 1,
            name: "Standard",
            description: "Plan intermédiaire avec de meilleurs récompenses. Recommandé pour les utilisateurs qui souhaitent une récompense stable sur une période moyenne.",
            apr: 20,
            duration: 90,
            minAmount: 500,
            active: true
          },
          {
            id: 2,
            name: "Premium",
            description: "Plan avancé offrant des récompenses élevé sur une période plus longue. Idéal pour maximiser les récompenses à moyen terme.",
            apr: 25,
            duration: 180,
            minAmount: 1000,
            active: true
          },
          {
            id: 3,
            name: "Enterprise",
            description: "Notre plan le plus performant avec des récompenses les plus élevés. Destiné aux utilisateurs sérieux recherchant les meilleures récompenses.",
            apr: 30,
            duration: 360,
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
            description: "Plan avancé offrant des récompenses élevé sur une période plus longue. Idéal pour maximiser les récompenses à moyen terme."
          },
          {
            name: "Enterprise",
            description: "Notre plan le plus performant avec des récompenses les plus élevés. Destiné aux utilisateurs sérieux recherchant les meilleures récompenses."
          }
        ];
        
        console.log("Début de la récupération des plans du contrat...");
        
        let nullPlansCount = 0;
        const MAX_NULL_PLANS = 3;
        const MAX_PLANS = 10;
        
        const defaultAprValues = [15, 20, 25, 30];
        const defaultDurationValues = [30, 90, 180, 360];
        
        while (planId < MAX_PLANS) {
          try {
            console.log(`Tentative de récupération du plan ${planId}...`);
            const contractPlan: ContractPlanV2 = await stakingContract.plans(planId);
            
            console.log(`Plan ${planId} valeurs brutes:`, {
              apr: contractPlan.apr.toString(),
              duration: contractPlan.duration.toString(),
              minAmount: contractPlan.minAmount.toString(),
              active: contractPlan.active
            });
            
            const isNullPlan = (
              contractPlan.apr === 0n && 
              contractPlan.duration === 0n && 
              contractPlan.minAmount === 0n
            );
            
            if (isNullPlan) {
              nullPlansCount++;
              if (nullPlansCount >= MAX_NULL_PLANS) {
                console.log(`${MAX_NULL_PLANS} plans nuls consécutifs trouvés, arrêt de la récupération.`);
                break;
              }
            } else {
              nullPlansCount = 0;
              
              const aprFormatted = Number(contractPlan.apr) / 100;
              const durationDays = Number(contractPlan.duration);
              
              console.log(`Plan ${planId} valeurs formatées:`, {
                apr: aprFormatted,
                durationDays: durationDays
              });
              
              const finalApr = aprFormatted < 0.1 ? defaultAprValues[planId] || 12 : aprFormatted;
              const finalDuration = durationDays < 1 ? defaultDurationValues[planId] || 30 : durationDays;
              
              const defaultData = defaultPlanData[planId] || {
                name: `Plan ${planId + 1}`,
                description: `Plan de récompense avec des récompense variables de ${finalApr}% sur une période de ${finalDuration} jours.`
              };
              
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
        
        setPlans(currentPlans);
      } catch (error) {
        console.error('Erreur générale lors du chargement des plans:', error);
        
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

  // Fonction calculateDailyReturns
  const calculateDailyReturns = async (stakeId: number): Promise<number> => {
  if (!stakingContract || !address) return 0;
  
  try {
    console.log(`🔍 calculateDailyReturns THÉORIQUE - StakeId: ${stakeId}`);
    
    // Récupérer les données du stake
    const userStakes = await stakingContract.getUserStakes(address);
    const stake = userStakes[stakeId];
    
    if (!stake) {
      console.warn(`❌ Stake ${stakeId} non trouvé`);
      return 0;
    }
    
    const amount = Number(ethers.formatUnits(stake.amount, 18));
    const planId = Number(stake.planId);
    const nftMultiplierAtStake = Number(stake.nftMultiplierAtStake || 10000);
    const multiplierRatio = nftMultiplierAtStake / 10000;
    
    // Trouver le plan
    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      console.warn(`⚠️ Plan ${planId} non trouvé pour stake ${stakeId}`);
      return 0;
    }
    
    // ✅ CALCUL THÉORIQUE FIXE
    const baseDailyReturn = (amount * (plan.apr / 100)) / 365;
    const dailyReturnWithNFT = baseDailyReturn * multiplierRatio;
    
    console.log(`📊 Récompenses quotidiennes THÉORIQUES pour stake ${stakeId}:`, {
      amount,
      planAPR: plan.apr + '%',
      nftMultiplier: multiplierRatio + 'x',
      baseDailyReturn: baseDailyReturn.toFixed(8),
      dailyReturnWithNFT: dailyReturnWithNFT.toFixed(8)
    });
    
    return dailyReturnWithNFT;
    
  } catch (error) {
    console.error(`❌ Erreur calculateDailyReturns (stakeId: ${stakeId}):`, error);
    return 0;
  }
};

  // Fonction getDetailedStakeInfo
  const getDetailedStakeInfo = async (stakeId: number) => {
    if (!stakingContract || !address) {
      throw new Error('Contract ou adresse manquant');
    }
    
    try {
      const stakeDetails = await stakingContract.getStakeDetails(address, stakeId);
      const userStakes = await stakingContract.getUserStakes(address);
      const stake = userStakes[stakeId];
      
      const baseRewards = Number(ethers.formatUnits(stakeDetails[0], 18));
      const bonusRewards = Number(ethers.formatUnits(stakeDetails[1], 18)); 
      const totalRewards = Number(ethers.formatUnits(stakeDetails[2], 18));
      const nftMultiplierAtStake = Number(stakeDetails[3]);
      const currentUserMultiplier = Number(stakeDetails[4]);
      
      const startTime = Number(stake.startTime) * 1000;
      const currentTime = Date.now();
      const daysElapsed = Math.max(0.1, (currentTime - startTime) / (1000 * 3600 * 24));
      
      // ✅ CALCUL THÉORIQUE FIXE - Ne change pas chaque jour
const amount = Number(ethers.formatUnits(stake.amount, 18));
const planId = Number(stake.planId);
const nftMultiplierRatio = nftMultiplierAtStake / 10000;

// Trouver le plan pour obtenir l'APR
const plan = plans.find(p => p.id === planId);
const apr = plan ? plan.apr : 15; // Fallback si plan non trouvé

// Calcul théorique quotidien (FIXE)
const baseDailyReturn = (amount * (apr / 100)) / 365;
const dailyReturnWithNFT = baseDailyReturn * nftMultiplierRatio;

console.log(`📊 Calcul récompenses quotidiennes théoriques pour stake ${stakeId}:`, {
  amount,
  apr: apr + '%',
  nftMultiplier: nftMultiplierRatio + 'x',
  baseDailyReturn: baseDailyReturn.toFixed(8),
  dailyReturnWithNFT: dailyReturnWithNFT.toFixed(8)
});
      
      
      return {
        baseRewards,
        bonusRewards,
        totalRewards,
        nftMultiplierAtStake: nftMultiplierAtStake / 10000,
        currentUserMultiplier: currentUserMultiplier / 10000,
        dailyReturnWithNFT,
        baseDailyReturn
      };
    } catch (error) {
      console.error('Erreur getDetailedStakeInfo:', error);
      throw error;
    }
  };

  // ✅ MODIFIÉ - Charger les investissements avec gestion sécurisée des timestamps
  useEffect(() => {
    const loadInvestments = async () => {
      if (!stakingContract || !address) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log("🔍 Début chargement des investissements...");
        const contractStakes: ContractStake[] = await stakingContract.getUserStakes(address);
        
        console.log("🔍 Stakes récupérés du contrat:", contractStakes.length);
        
        const allInvestments: InvestmentV2[] = [];
        
        for (let originalIndex = 0; originalIndex < contractStakes.length; originalIndex++) {
          const stake = contractStakes[originalIndex];
          
          console.log(`🔍 Traitement du Stake ${originalIndex} - Données brutes:`, {
            planId: stake.planId.toString(),
            amount: ethers.formatUnits(stake.amount, 18),
            startTime: stake.startTime.toString(),
            endTime: stake.endTime.toString(),
            lastRewardTime: stake.lastRewardTime.toString(),
            active: stake.active,
            nftMultiplierAtStake: stake.nftMultiplierAtStake ? stake.nftMultiplierAtStake.toString() : "undefined"
          });
          
          // ✅ CONVERSION SÉCURISÉE DES TIMESTAMPS
          const startDate = safeTimestampToDate(stake.startTime, `Stake ${originalIndex} startTime`);
          const endDate = safeTimestampToDate(stake.endTime, `Stake ${originalIndex} endTime`);
          const lastRewardTime = safeTimestampToDate(stake.lastRewardTime, `Stake ${originalIndex} lastRewardTime`);
          
          const amount = Number(ethers.formatUnits(stake.amount, 18));
          const nftMultiplierAtStake = Number(stake.nftMultiplierAtStake || 10000) / 10000;
          
          console.log(`🔍 Stake ${originalIndex} - Données traitées:`, {
            amount,
            planId: Number(stake.planId),
            nftMultiplierAtStake: nftMultiplierAtStake + 'x',
            active: stake.active,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            isExpired: new Date() >= endDate
          });
          
          const plan = plans.find(p => p.id === Number(stake.planId));
          if (!plan) {
            console.warn(`⚠️ Plan ${Number(stake.planId)} non trouvé pour le stake ${originalIndex}`);
          }
          
          let dailyReturn = 0;
          
          try {
            dailyReturn = await calculateDailyReturns(originalIndex);
            
            if (dailyReturn > 0) {
              console.log(`✅ Récompenses quotidiennes calculées pour Stake ${originalIndex}: ${dailyReturn.toFixed(8)}`);
            } else {
              if (plan && amount > 0) {
                const baseDailyReturn = (amount * (plan.apr / 100)) / 365;
                dailyReturn = baseDailyReturn * nftMultiplierAtStake;
                
                console.log(`🔄 Calcul théorique appliqué pour Stake ${originalIndex}:`, {
                  plan: plan.name,
                  apr: plan.apr + '%',
                  baseDailyReturn: baseDailyReturn.toFixed(8),
                  multiplier: nftMultiplierAtStake + 'x',
                  finalDailyReturn: dailyReturn.toFixed(8)
                });
              }
            }
            
          } catch (dailyReturnError) {
            console.error(`❌ Erreur calcul récompenses quotidiennes pour stake ${originalIndex}:`, dailyReturnError);
            
            if (plan && amount > 0) {
              const baseDailyReturn = (amount * (plan.apr / 100)) / 365;
              dailyReturn = baseDailyReturn * nftMultiplierAtStake;
              
              console.log(`🔄 Dernier fallback pour Stake ${originalIndex}:`, {
                baseDailyReturn: baseDailyReturn.toFixed(8),
                multiplier: nftMultiplierAtStake + 'x',
                finalDailyReturn: dailyReturn.toFixed(8)
              });
            }
          }
          
          const investment: InvestmentV2 = {
            id: originalIndex.toString(),
            planId: Number(stake.planId),
            amount: amount,
            startDate: startDate, // ✅ Date sécurisée
            endDate: endDate, // ✅ Date sécurisée
            lastRewardTime: lastRewardTime, // ✅ Date sécurisée
            token: TOKEN_SYMBOLS[stake.token] || stake.token,
            active: stake.active,
            dailyReturn: dailyReturn,
            nftMultiplierAtStake: nftMultiplierAtStake
          };
          
          allInvestments.push(investment);
          
          console.log(`📋 Stake ${originalIndex} CRÉÉ avec succès:`, {
            id: investment.id,
            amount: investment.amount,
            planId: investment.planId,
            active: investment.active,
            nftMultiplierAtStake: investment.nftMultiplierAtStake + 'x',
            dailyReturn: investment.dailyReturn.toFixed(8) + ' USDC/jour',
            startDate: investment.startDate.toISOString(),
            endDate: investment.endDate.toISOString()
          });
        }
        
        console.log(`📊 Total investissements créés: ${allInvestments.length}`);
        
        const activeInvestments = allInvestments.filter(investment => {
          const isActive = investment.active;
          const isNotExpired = new Date() < new Date(investment.endDate);
          
          console.log(`🔍 Filtrage investment ${investment.id}:`, {
            active: isActive,
            notExpired: isNotExpired,
            willBeIncluded: isActive
          });
          
          return isActive;
        });
        
        console.log("🎯 RÉSULTAT FINAL - Stakes qui seront affichés:", activeInvestments.length);
        console.log("📋 Détail des stakes affichés:", activeInvestments.map(inv => ({
          id: inv.id,
          planId: inv.planId,
          amount: inv.amount,
          active: inv.active,
          nftMultiplier: inv.nftMultiplierAtStake + 'x',
          dailyReturn: inv.dailyReturn.toFixed(8) + ' USDC/jour'
        })));
        
        if (activeInvestments.length < contractStakes.length) {
          console.warn(`⚠️ ATTENTION: ${contractStakes.length - activeInvestments.length} stake(s) filtrés`);
          
          const filteredStakes = allInvestments.filter(inv => !inv.active);
          console.warn("🚫 Stakes filtrés (inactifs):", filteredStakes.map(inv => ({
            id: inv.id,
            planId: inv.planId,
            amount: inv.amount,
            active: inv.active,
            endDate: inv.endDate.toISOString()
          })));
        }
        
        setActiveInvestments(activeInvestments);
        
      } catch (error) {
        console.error('Erreur lors du chargement des investissements:', error);
        setError(error);
        setActiveInvestments([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (plans.length > 0) {
      console.log("📋 Plans disponibles:", plans.map(p => ({ id: p.id, name: p.name, apr: p.apr })));
      loadInvestments();
    } else {
      console.log("⏳ En attente du chargement des plans...");
    }
  }, [stakingContract, address, plans]);

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
      
      const TOKEN_ADDRESSES = {
        USDT: "0x55d398326f99059fF775485246999027B3197955", 
        USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" 
      };
      
      const tokenAddress = token === 'USDT' 
        ? TOKEN_ADDRESSES.USDT 
        : TOKEN_ADDRESSES.USDC;
      
      const amountInWei = ethers.parseUnits(amount.toString(), 18);
      
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function approve(address spender, uint256 amount) external returns (bool)",
          "function allowance(address owner, address spender) external view returns (uint256)"
        ],
        signer
      );
      
      const userAddress = await signer.getAddress();
      const currentAllowance = await tokenContract.allowance(userAddress, CONTRACTSV2.STAKING.address);
      
      console.log("Vérification de l'allowance pour le token:", token);
      console.log("Adresse du token:", tokenAddress);
      console.log("Adresse du contrat de staking:", CONTRACTSV2.STAKING.address);
      console.log("Allowance actuelle:", ethers.formatUnits(currentAllowance, 18));
      console.log("Montant requis:", amount.toString());
      
      if (currentAllowance < amountInWei) {
        console.log("Allowance insuffisante. Demande d'approbation...");
        
        alert("Vous devez d'abord approuver le contrat à utiliser vos tokens. Une fenêtre de confirmation va s'ouvrir après avoir cliqué sur OK.");
        
        try {
          const approvalAmount = ethers.parseUnits("1000000", 18);
          
          console.log("Envoi de la transaction d'approbation...");
          const approveTx = await tokenContract.approve(CONTRACTSV2.STAKING.address, approvalAmount);
          
          console.log("Transaction d'approbation envoyée:", approveTx.hash);
          console.log("En attente de confirmation...");
          
          const approveReceipt = await approveTx.wait();
          console.log("Approbation confirmée! Transaction hash:", approveReceipt.hash);
        } catch (approvalError) {
          console.error("Erreur lors de l'approbation:", approvalError);
          throw new Error("L'approbation a échoué: " + (approvalError.message || approvalError));
        }
      } else {
        console.log("Allowance suffisante, poursuite du dépôt");
      }
      
      console.log("Connexion au contrat de staking avec le signer");
      const contractWithSigner = stakingContract.connect(signer);
      
      console.log("Préparation de la transaction stake...");
      console.log("Paramètres:", planId, amountInWei.toString(), tokenAddress);
      
      console.log("Envoi de la transaction stake...");
      const tx = await contractWithSigner.stake(planId, amountInWei, tokenAddress);
      
      console.log("Transaction stake envoyée:", tx.hash);
      console.log("En attente de confirmation...");
      
      await tx.wait();
      console.log("Transaction stake confirmée!");
      
      try {
        console.log("Récupération des récompenses mis à jour...");
        const updatedStakes = await stakingContract.getUserStakes(userAddress);
        
        const updatedInvestments: InvestmentV2[] = [];
        
        for (let index = 0; index < updatedStakes.length; index++) {
          const stake = updatedStakes[index];
          if (!stake.active) continue;
          
          // ✅ CONVERSION SÉCURISÉE DES TIMESTAMPS POUR LA MISE À JOUR
          const startDate = safeTimestampToDate(stake.startTime, `Updated Stake ${index} startTime`);
          const endDate = safeTimestampToDate(stake.endTime, `Updated Stake ${index} endTime`);
          const lastRewardTime = safeTimestampToDate(stake.lastRewardTime, `Updated Stake ${index} lastRewardTime`);
          
          const stakeAmount = Number(ethers.formatUnits(stake.amount, 18));
          const nftMultiplierAtStake = Number(stake.nftMultiplierAtStake || 10000) / 10000;
          
          let dailyReturn = 0;
          try {
            dailyReturn = await calculateDailyReturns(index);
          } catch (error) {
            console.error("Erreur calcul daily return:", error);
            const plan = plans.find(p => p.id === Number(stake.planId));
            if (plan) {
              const baseDailyReturn = (stakeAmount * (plan.apr / 100)) / 365;
              dailyReturn = baseDailyReturn * nftMultiplierAtStake;
            }
          }
          
          updatedInvestments.push({
            id: index.toString(),
            planId: Number(stake.planId),
            amount: stakeAmount,
            startDate: startDate,
            endDate: endDate,
            lastRewardTime: lastRewardTime,
            token: TOKEN_SYMBOLS[stake.token] || stake.token,
            active: stake.active,
            dailyReturn: dailyReturn,
            nftMultiplierAtStake: nftMultiplierAtStake
          });
        }
        
        setActiveInvestments(updatedInvestments);
        console.log("Récompenses mises à jour!");
      } catch (refreshError) {
        console.error("Erreur lors de la mise à jour des récompenses:", refreshError);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors du dépot:', error);
      throw error;
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
      
      const tx = await contractWithSigner.endStake(stakeId);
      await tx.wait();
      
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
    calculateDailyReturns,
    getDetailedStakeInfo,
    isLoading,
    error,
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