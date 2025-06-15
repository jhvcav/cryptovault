// contexts/InvestmentContext.tsx - Version mise à jour avec support NFT
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { useNFTAccess } from '../hooks/useNFT';

interface InvestmentPlan {
  id: number;
  name: string;
  description: string;
  apr: number;
  minInvestment: number;
  maxInvestment: number;
  lockPeriodDays: number;
  category: 'starter' | 'standard' | 'premium' | 'privilege';
  features: string[];
  risks: string[];
  requiredNFTTier: number; // Tier minimum requis (0 = aucun NFT requis)
  active: boolean;
}

interface UserInvestment {
  id: string;
  planId: number;
  amount: number;
  token: 'USDT' | 'USDC';
  startDate: Date;
  endDate: Date;
  currentRewards: number;
  totalRewardsEarned: number;
  nftMultiplier: number; // Multiplicateur appliqué grâce au NFT
  status: 'active' | 'completed' | 'withdrawn';
}

interface InvestmentContextType {
  // Plans
  plans: InvestmentPlan[];
  availablePlans: InvestmentPlan[]; // Plans accessibles selon le NFT
  
  // Investissements utilisateur
  userInvestments: UserInvestment[];
  totalInvested: number;
  totalRewards: number;
  
  // État
  loading: boolean;
  error: string | null;
  
  // Actions
  invest: (planId: number, amount: number, token: 'USDT' | 'USDC') => Promise<boolean>;
  withdrawRewards: (investmentId: string) => Promise<boolean>;
  getInvestmentDetails: (investmentId: string) => UserInvestment | null;
  
  // NFT
  nftMultiplier: number;
  hasNFTAccess: boolean;
}

const InvestmentContext = createContext<InvestmentContextType | undefined>(undefined);

// Plans d'investissement avec niveaux d'accès NFT
const INVESTMENT_PLANS: InvestmentPlan[] = [
  // Plans Starter (accessible avec NFT Bronze et plus)
  {
    id: 1,
    name: 'Starter 30 Jours',
    description: 'Plan d\'entrée parfait pour commencer',
    apr: 12,
    minInvestment: 50,
    maxInvestment: 1000,
    lockPeriodDays: 30,
    category: 'starter',
    requiredNFTTier: 1,
    features: [
      'APR 12% annuel',
      'Récompenses quotidiennes',
      'Capital garanti',
      'Support communautaire'
    ],
    risks: [
      'Rendements variables selon les conditions de marché',
      'Capital bloqué pendant 30 jours'
    ],
    active: true
  },
  
  // Plans Standard (accessible avec NFT Argent et plus)
  /*{
    id: 2,
    name: 'Standard 60 Jours',
    description: 'Plan équilibré pour investisseurs réguliers',
    apr: 18,
    minInvestment: 200,
    maxInvestment: 5000,
    lockPeriodDays: 60,
    category: 'standard',
    requiredNFTTier: 2,
    features: [
      'APR 18% annuel',
      'Récompenses quotidiennes',
      'Capital garanti',
      'Support prioritaire',
      'Analyses hebdomadaires'
    ],
    risks: [
      'Rendements variables selon les conditions de marché',
      'Capital bloqué pendant 60 jours'
    ],
    active: true
  },*/
  
  {
    id: 3,
    name: 'Standard 90 Jours',
    description: 'Plan standard avec période étendue',
    apr: 22,
    minInvestment: 500,
    maxInvestment: 10000,
    lockPeriodDays: 90,
    category: 'standard',
    requiredNFTTier: 2,
    features: [
      'APR 22% annuel',
      'Récompenses quotidiennes',
      'Capital garanti',
      'Support prioritaire',
      'Analyses hebdomadaires',
      'Bonus fin de période'
    ],
    risks: [
      'Rendements variables selon les conditions de marché',
      'Capital bloqué pendant 90 jours'
    ],
    active: true
  },

  // Plans Premium (accessible avec NFT Or et plus)
  {
    id: 4,
    name: 'Premium 120 Jours',
    description: 'Plan premium pour investisseurs expérimentés',
    apr: 28,
    minInvestment: 1000,
    maxInvestment: 25000,
    lockPeriodDays: 120,
    category: 'premium',
    requiredNFTTier: 3,
    features: [
      'APR 28% annuel',
      'Récompenses quotidiennes',
      'Capital garanti',
      'Support VIP 24/7',
      'Analyses quotidiennes',
      'Sessions 1-on-1 mensuelles',
      'Accès stratégies avancées'
    ],
    risks: [
      'Rendements variables selon les conditions de marché',
      'Capital bloqué pendant 120 jours',
      'Stratégies plus complexes'
    ],
    active: true
  },

  {
    id: 5,
    name: 'Premium 180 Jours',
    description: 'Plan premium longue durée',
    apr: 35,
    minInvestment: 2000,
    maxInvestment: 50000,
    lockPeriodDays: 180,
    category: 'premium',
    requiredNFTTier: 3,
    features: [
      'APR 35% annuel',
      'Récompenses quotidiennes',
      'Capital garanti',
      'Support VIP 24/7',
      'Analyses quotidiennes',
      'Sessions 1-on-1 bi-hebdomadaires',
      'Accès stratégies avancées',
      'Bonus loyauté'
    ],
    risks: [
      'Rendements variables selon les conditions de marché',
      'Capital bloqué pendant 180 jours',
      'Stratégies plus complexes'
    ],
    active: true
  },

  // Plans Privilège (accessible avec NFT Privilège uniquement)
  {
    id: 6,
    name: 'Privilège Elite 365 Jours',
    description: 'Plan exclusif pour les membres privilège',
    apr: 45,
    minInvestment: 5000,
    maxInvestment: 100000,
    lockPeriodDays: 365,
    category: 'privilege',
    requiredNFTTier: 4,
    features: [
      'APR 45% annuel',
      'Récompenses quotidiennes',
      'Capital garanti',
      'Gestionnaire dédié',
      'Analyses en temps réel',
      'Sessions 1-on-1 illimitées',
      'Accès toutes stratégies',
      'Participation gouvernance',
      'Événements privés',
      'Bonus fidélité progressif'
    ],
    risks: [
      'Rendements variables selon les conditions de marché',
      'Capital bloqué pendant 1 an',
      'Stratégies très avancées'
    ],
    active: true
  },

  {
    id: 7,
    name: 'Privilège Unlimited',
    description: 'Plan illimité pour les plus gros investisseurs',
    apr: 50,
    minInvestment: 10000,
    maxInvestment: 1000000,
    lockPeriodDays: 180,
    category: 'privilege',
    requiredNFTTier: 4,
    features: [
      'APR 50% annuel',
      'Récompenses quotidiennes',
      'Capital garanti',
      'Gestionnaire dédié',
      'Analyses en temps réel',
      'Sessions 1-on-1 illimitées',
      'Accès toutes stratégies',
      'Participation gouvernance',
      'Événements privés',
      'Conditions personnalisées',
      'Liquidité partielle'
    ],
    risks: [
      'Rendements variables selon les conditions de marché',
      'Capital majoritairement bloqué',
      'Stratégies très avancées',
      'Exposition marchés volatils'
    ],
    active: true
  }
];

export const InvestmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, isConnected } = useWallet();
  const { hasNFT, highestTier, multiplier, access } = useNFTAccess(address);

  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrer les plans selon l'accès NFT
  const availablePlans = INVESTMENT_PLANS.filter(plan => {
    if (!hasNFT) return false; // Aucun accès sans NFT
    
    return plan.requiredNFTTier <= highestTier;
  });

  // Calculer les totaux
  const totalInvested = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalRewards = userInvestments.reduce((sum, inv) => sum + inv.totalRewardsEarned, 0);

  // Charger les investissements utilisateur
  useEffect(() => {
    if (address && isConnected) {
      loadUserInvestments();
    }
  }, [address, isConnected]);

  const loadUserInvestments = async () => {
    setLoading(true);
    try {
      // TODO: Appel API pour charger les investissements
      // const investments = await InvestmentAPI.getUserInvestments(address);
      
      // Mock data pour l'instant
      const mockInvestments: UserInvestment[] = [
        // Exemple d'investissements existants
      ];
      
      setUserInvestments(mockInvestments);
      setError(null);
    } catch (err: any) {
      console.error('Erreur chargement des récompenses:', err);
      setError(err.message || 'Erreur lors du chargement des récompenses');
    } finally {
      setLoading(false);
    }
  };

  const invest = async (planId: number, amount: number, token: 'USDT' | 'USDC'): Promise<boolean> => {
    if (!address || !isConnected) {
      throw new Error('Wallet non connecté');
    }

    const plan = INVESTMENT_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Plan non trouvé');
    }

    // Vérifier l'accès NFT
    if (plan.requiredNFTTier > highestTier) {
      throw new Error(`NFT de niveau ${plan.requiredNFTTier} requis pour ce plan`);
    }

    // Vérifier les montants
    if (amount < plan.minInvestment) {
      throw new Error(`Montant minimum: ${plan.minInvestment} ${token}`);
    }

    if (amount > plan.maxInvestment) {
      throw new Error(`Montant maximum: ${plan.maxInvestment} ${token}`);
    }

    setLoading(true);
    try {
      // TODO: Intégrer avec le smart contract d'investissement
      console.log('🚀 Dépôt en cours:', {
        planId,
        amount,
        token,
        nftMultiplier: multiplier,
        userAddress: address
      });

      // Calculer les dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + plan.lockPeriodDays);

      // Créer le nouvel investissement
      const newInvestment: UserInvestment = {
        id: `inv_${Date.now()}`,
        planId,
        amount,
        token,
        startDate,
        endDate,
        currentRewards: 0,
        totalRewardsEarned: 0,
        nftMultiplier: multiplier,
        status: 'active'
      };

      // Ajouter à la liste (en réalité, ce serait sauvé en blockchain/DB)
      setUserInvestments(prev => [...prev, newInvestment]);

      // TODO: Appel au smart contract pour l'investissement réel
      // const tx = await InvestmentContract.invest(planId, amount, token);
      // await tx.wait();

      console.log('✅ Dépôt réussi:', newInvestment);
      return true;

    } catch (err: any) {
      console.error('❌ Erreur dépôt:', err);
      setError(err.message || 'Erreur lors de l\'investissement');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const withdrawRewards = async (investmentId: string): Promise<boolean> => {
    if (!address || !isConnected) {
      throw new Error('Wallet non connecté');
    }

    setLoading(true);
    try {
      // TODO: Intégrer avec le smart contract pour le retrait
      console.log('💰 Retrait récompenses:', investmentId);

      // Simuler le retrait
      setUserInvestments(prev => 
        prev.map(inv => 
          inv.id === investmentId 
            ? { ...inv, currentRewards: 0, totalRewardsEarned: inv.totalRewardsEarned + inv.currentRewards }
            : inv
        )
      );

      return true;
    } catch (err: any) {
      console.error('❌ Erreur retrait:', err);
      setError(err.message || 'Erreur lors du retrait des récompenses');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getInvestmentDetails = (investmentId: string): UserInvestment | null => {
    return userInvestments.find(inv => inv.id === investmentId) || null;
  };

  // Simuler l'accumulation de récompenses (en réalité, ce serait calculé par le smart contract)
  useEffect(() => {
    const interval = setInterval(() => {
      setUserInvestments(prev => 
        prev.map(inv => {
          if (inv.status !== 'active') return inv;

          const plan = INVESTMENT_PLANS.find(p => p.id === inv.planId);
          if (!plan) return inv;

          // Calculer les récompenses quotidiennes avec le multiplicateur NFT
          const dailyReward = (inv.amount * (plan.apr / 100) / 365) * inv.nftMultiplier;
          
          return {
            ...inv,
            currentRewards: inv.currentRewards + dailyReward / (24 * 60) // Récompense par minute pour la démo
          };
        })
      );
    }, 60000); // Mise à jour chaque minute

    return () => clearInterval(interval);
  }, [userInvestments]);

  const value: InvestmentContextType = {
    // Plans
    plans: INVESTMENT_PLANS,
    availablePlans,
    
    // Investissements utilisateur
    userInvestments,
    totalInvested,
    totalRewards,
    
    // État
    loading,
    error,
    
    // Actions
    invest,
    withdrawRewards,
    getInvestmentDetails,
    
    // NFT
    nftMultiplier: multiplier,
    hasNFTAccess: hasNFT
  };

  return (
    <InvestmentContext.Provider value={value}>
      {children}
    </InvestmentContext.Provider>
  );
};

export const useInvestment = (): InvestmentContextType => {
  const context = useContext(InvestmentContext);
  if (context === undefined) {
    throw new Error('useInvestment must be used within an InvestmentProvider');
  }
  return context;
};

export default InvestmentContext;