
import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Brain,
  TrendingUp,
  DollarSign,
  Clock,
  Shield,
  Zap,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Calculator,
  PieChart,
  Star,
  Download,
  Lightbulb,
  BarChart3
} from 'lucide-react';

// Configuration identique
const NFT_CONFIG = {
  bronze: {
    name: 'NFT Bronze',
    icon: '🥉',
    price: 120,
    multiplier: 1.2,
    plans: [
      { id: 'starter', name: 'Starter', apr: 18, duration: 30 }
    ]
  },
  silver: {
    name: 'NFT Argent',
    icon: '🥈',
    price: 250,
    multiplier: 1.5,
    plans: [
      { id: 'starter', name: 'Starter', apr: 18, duration: 30 },
      { id: 'standard', name: 'Standard', apr: 30, duration: 90 }
    ]
  },
  gold: {
    name: 'NFT Or',
    icon: '🥇',
    price: 500,
    multiplier: 2.0,
    plans: [
      { id: 'starter', name: 'Starter', apr: 18, duration: 30 },
      { id: 'standard', name: 'Standard', apr: 30, duration: 90 },
      { id: 'premium', name: 'Premium', apr: 50, duration: 180 }
    ]
  },
  privilege: {
    name: 'NFT Privilège',
    icon: '💎',
    price: 1000,
    multiplier: 2.5,
    plans: [
      { id: 'starter', name: 'Starter', apr: 18, duration: 30 },
      { id: 'standard', name: 'Standard', apr: 30, duration: 90 },
      { id: 'premium', name: 'Premium', apr: 50, duration: 180 },
      { id: 'enterprise', name: 'Enterprise', apr: 75, duration: 360 }
    ]
  }
};

interface UserGoals {
  targetMonthlyIncome: number;
  maxBudget: number;
  riskTolerance: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short' | 'medium' | 'long'; // 0-3, 3-6, 6-12, 12+ mois
  priority: 'income' | 'growth' | 'balance';
  hasNFTs: string[]; // NFT déjà possédés
}

interface StrategyRecommendation {
  id: string;
  name: string;
  type: 'single' | 'diversified' | 'progressive';
  nfts: {
    nft: keyof typeof NFT_CONFIG;
    plan: string;
    amount: number;
  }[];
  totalInvestment: number;
  monthlyIncome: number;
  roi: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeToTarget: number; // mois
  score: number;
  pros: string[];
  cons: string[];
  description: string;
}

const StrategyRecommender: React.FC = () => {
  const [userGoals, setUserGoals] = useState<UserGoals>({
    targetMonthlyIncome: 500,
    maxBudget: 15000,
    riskTolerance: 'medium',
    timeframe: 'immediate',
    priority: 'income',
    hasNFTs: []
  });

  const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  // Générer toutes les stratégies possibles
  const generateAllStrategies = (): StrategyRecommendation[] => {
    const strategies: StrategyRecommendation[] = [];

    // 1. Stratégies simples (1 NFT)
    Object.entries(NFT_CONFIG).forEach(([nftKey, nft]) => {
      nft.plans.forEach(plan => {
        const effectiveAPR = (plan.apr / 100) * nft.multiplier;
        const monthlyRate = effectiveAPR / 12;
        const requiredCapital = userGoals.targetMonthlyIncome / monthlyRate;
        const totalInvestment = nft.price + requiredCapital;
        
        if (totalInvestment <= userGoals.maxBudget) {
          strategies.push({
            id: `single-${nftKey}-${plan.id}`,
            name: `${nft.name} ${plan.name}`,
            type: 'single',
            nfts: [{
              nft: nftKey as keyof typeof NFT_CONFIG,
              plan: plan.id,
              amount: requiredCapital
            }],
            totalInvestment,
            monthlyIncome: userGoals.targetMonthlyIncome,
            roi: (userGoals.targetMonthlyIncome * 12 / totalInvestment) * 100,
            riskLevel: nftKey === 'privilege' ? 'high' : nftKey === 'gold' ? 'medium' : 'low',
            timeToTarget: 0,
            score: 0,
            pros: [`APR effectif: ${(effectiveAPR * 100).toFixed(1)}%`, 'Stratégie simple', 'Revenus immédiats'],
            cons: totalInvestment > userGoals.maxBudget * 0.8 ? ['Investissement élevé'] : [],
            description: `Investissement direct dans ${nft.name} avec le plan ${plan.name} pour générer ${userGoals.targetMonthlyIncome}$ par mois.`
          });
        }
      });
    });

    // 2. Stratégies diversifiées (2 NFT)
    const nftKeys = Object.keys(NFT_CONFIG) as (keyof typeof NFT_CONFIG)[];
    
    for (let i = 0; i < nftKeys.length; i++) {
      for (let j = i + 1; j < nftKeys.length; j++) {
        const nft1 = NFT_CONFIG[nftKeys[i]];
        const nft2 = NFT_CONFIG[nftKeys[j]];
        
        nft1.plans.forEach(plan1 => {
          nft2.plans.forEach(plan2 => {
            const effectiveAPR1 = (plan1.apr / 100) * nft1.multiplier;
            const effectiveAPR2 = (plan2.apr / 100) * nft2.multiplier;
            const monthlyRate1 = effectiveAPR1 / 12;
            const monthlyRate2 = effectiveAPR2 / 12;
            
            // Répartir 50/50 l'objectif
            const targetPerNFT = userGoals.targetMonthlyIncome / 2;
            const capital1 = targetPerNFT / monthlyRate1;
            const capital2 = targetPerNFT / monthlyRate2;
            const totalInvestment = nft1.price + capital1 + nft2.price + capital2;
            
            if (totalInvestment <= userGoals.maxBudget) {
              const avgROI = ((targetPerNFT * 2 * 12) / totalInvestment) * 100;
              
              strategies.push({
                id: `diversified-${nftKeys[i]}-${nftKeys[j]}-${plan1.id}-${plan2.id}`,
                name: `${nft1.name} + ${nft2.name}`,
                type: 'diversified',
                nfts: [
                  { nft: nftKeys[i], plan: plan1.id, amount: capital1 },
                  { nft: nftKeys[j], plan: plan2.id, amount: capital2 }
                ],
                totalInvestment,
                monthlyIncome: userGoals.targetMonthlyIncome,
                roi: avgROI,
                riskLevel: 'medium',
                timeToTarget: 0,
                score: 0,
                pros: ['Diversification des risques', 'Multiplicateurs combinés', 'Revenus stables'],
                cons: ['Plus complexe à gérer', 'Coût initial plus élevé'],
                description: `Stratégie diversifiée combinant ${nft1.name} et ${nft2.name} pour répartir les risques.`
              });
            }
          });
        });
      }
    }

    // 3. Stratégies progressives (croissance par réinvestissement)
    Object.entries(NFT_CONFIG).forEach(([nftKey, nft]) => {
      nft.plans.forEach(plan => {
        const effectiveAPR = (plan.apr / 100) * nft.multiplier;
        const monthlyRate = effectiveAPR / 12;
        
        // Commencer avec un montant plus petit et calculer le temps nécessaire
        const startingCapital = Math.min(userGoals.maxBudget - nft.price, 10000);
        const totalInvestment = nft.price + startingCapital;
        
        if (totalInvestment <= userGoals.maxBudget) {
          // Simuler la croissance avec réinvestissement 100%
          let capital = startingCapital;
          let months = 0;
          
          while (capital * monthlyRate < userGoals.targetMonthlyIncome && months < 36) {
            capital *= (1 + monthlyRate);
            months++;
          }
          
          if (months <= 24) { // Stratégie viable si moins de 2 ans
            strategies.push({
              id: `progressive-${nftKey}-${plan.id}`,
              name: `${nft.name} ${plan.name} - Croissance`,
              type: 'progressive',
              nfts: [{
                nft: nftKey as keyof typeof NFT_CONFIG,
                plan: plan.id,
                amount: startingCapital
              }],
              totalInvestment,
              monthlyIncome: userGoals.targetMonthlyIncome,
              roi: (userGoals.targetMonthlyIncome * 12 / totalInvestment) * 100,
              riskLevel: 'medium',
              timeToTarget: months,
              score: 0,
              pros: ['Investissement initial réduit', 'Croissance exponentielle', 'Réinvestissement automatique'],
              cons: [`Temps d'attente: ${months} mois`, 'Revenus différés', 'Discipline requise'],
              description: `Commencer avec ${startingCapital.toFixed(0)}$ et réinvestir 100% des gains pendant ${months} mois.`
            });
          }
        }
      });
    });

    return strategies;
  };

  // Calculer le score de chaque stratégie
  const calculateStrategyScore = (strategy: StrategyRecommendation): number => {
    let score = 0;
    
    // Score basé sur le ROI (0-30 points)
    score += Math.min(strategy.roi / 2, 30);
    
    // Score basé sur le budget utilisé (0-20 points)
    const budgetUtilization = strategy.totalInvestment / userGoals.maxBudget;
    score += (1 - budgetUtilization) * 20;
    
    // Score basé sur la tolérance au risque (0-20 points)
    const riskAlignment = {
      low: { low: 20, medium: 10, high: 0 },
      medium: { low: 15, medium: 20, high: 15 },
      high: { low: 5, medium: 15, high: 20 }
    };
    score += riskAlignment[userGoals.riskTolerance][strategy.riskLevel];
    
    // Score basé sur le timeframe (0-20 points)
    const timeBonus = {
      immediate: strategy.timeToTarget === 0 ? 20 : Math.max(0, 20 - strategy.timeToTarget),
      short: strategy.timeToTarget <= 3 ? 20 : Math.max(0, 20 - strategy.timeToTarget * 2),
      medium: strategy.timeToTarget <= 6 ? 20 : Math.max(0, 20 - strategy.timeToTarget),
      long: strategy.timeToTarget <= 12 ? 20 : Math.max(0, 20 - strategy.timeToTarget * 0.5)
    };
    score += timeBonus[userGoals.timeframe];
    
    // Score basé sur la priorité (0-10 points)
    const priorityBonus = {
      income: strategy.type === 'single' ? 10 : 5,
      growth: strategy.type === 'progressive' ? 10 : 5,
      balance: strategy.type === 'diversified' ? 10 : 5
    };
    score += priorityBonus[userGoals.priority];
    
    return score;
  };

  // Générer et scorer les recommandations
  useEffect(() => {
    const allStrategies = generateAllStrategies();
    const scoredStrategies = allStrategies.map(strategy => ({
      ...strategy,
      score: calculateStrategyScore(strategy)
    }));
    
    // Trier par score et garder les 5 meilleures
    const topStrategies = scoredStrategies
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    setRecommendations(topStrategies);
    if (topStrategies.length > 0) {
      setSelectedStrategy(topStrategies[0].id);
    }
  }, [userGoals]);

  // Obtenir les détails d'une stratégie sélectionnée
  const getSelectedStrategy = () => {
    return recommendations.find(s => s.id === selectedStrategy);
  };

  // Exporter la stratégie recommandée
  const exportStrategy = () => {
    const strategy = getSelectedStrategy();
    if (!strategy) return;
    
    const csvData = [
      ['Recommandation Stratégique', ''],
      ['Nom de la stratégie', strategy.name],
      ['Type', strategy.type],
      ['Investissement total', `${strategy.totalInvestment.toFixed(2)} USDC`],
      ['Revenus mensuels cibles', `${strategy.monthlyIncome} USDC`],
      ['ROI annuel', `${strategy.roi.toFixed(1)}%`],
      ['Niveau de risque', strategy.riskLevel],
      ['Temps pour atteindre l\'objectif', `${strategy.timeToTarget} mois`],
      ['Score de recommandation', `${strategy.score.toFixed(1)}/100`],
      [''],
      ['Composition du portefeuille', ''],
      ['NFT', 'Plan', 'Capital requis'],
      ...strategy.nfts.map(nft => [
        NFT_CONFIG[nft.nft].name,
        NFT_CONFIG[nft.nft].plans.find(p => p.id === nft.plan)?.name || '',
        `${nft.amount.toFixed(2)} USDC`
      ]),
      [''],
      ['Avantages', ''],
      ...strategy.pros.map(pro => [pro, '']),
      [''],
      ['Inconvénients', ''],
      ...strategy.cons.map(con => [con, ''])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategie_recommandee_${strategy.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="text-purple-400" size={32} />
            <h1 className="text-4xl font-bold text-white">
              Recommandateur de Stratégies
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Obtenez des recommandations personnalisées basées sur vos objectifs et votre profil d'investisseur
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration des objectifs */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Target className="mr-2" size={20} />
                Vos Objectifs
              </h2>

              {/* Objectif de revenus mensuels */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-3">
                  Objectif de revenus mensuels (USDC)
                </label>
                <input
                  type="number"
                  value={userGoals.targetMonthlyIncome}
                  onChange={(e) => setUserGoals(prev => ({ 
                    ...prev, 
                    targetMonthlyIncome: Number(e.target.value) 
                  }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  min="50"
                  step="50"
                />
              </div>

              {/* Budget maximum */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-3">
                  Budget maximum (USDC)
                </label>
                <input
                  type="number"
                  value={userGoals.maxBudget}
                  onChange={(e) => setUserGoals(prev => ({ 
                    ...prev, 
                    maxBudget: Number(e.target.value) 
                  }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  min="1000"
                  step="1000"
                />
              </div>

              {/* Tolérance au risque */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-3">
                  Tolérance au risque
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'low', label: 'Conservative', icon: '🛡️', desc: 'Sécurité prioritaire' },
                    { value: 'medium', label: 'Équilibrée', icon: '⚖️', desc: 'Risque modéré' },
                    { value: 'high', label: 'Agressive', icon: '🚀', desc: 'Rendement maximal' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setUserGoals(prev => ({ 
                        ...prev, 
                        riskTolerance: option.value as 'low' | 'medium' | 'high' 
                      }))}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        userGoals.riskTolerance === option.value
                          ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                          : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{option.icon}</span>
                        <div>
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-xs text-slate-400">{option.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Horizon temporel */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-3">
                  Horizon temporel
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'immediate', label: 'Immédiat', desc: 'Revenus dès maintenant' },
                    { value: 'short', label: 'Court terme', desc: '1-3 mois' },
                    { value: 'medium', label: 'Moyen terme', desc: '3-12 mois' },
                    { value: 'long', label: 'Long terme', desc: '1+ année' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setUserGoals(prev => ({ 
                        ...prev, 
                        timeframe: option.value as 'immediate' | 'short' | 'medium' | 'long' 
                      }))}
                      className={`w-full p-2 rounded-lg border transition-all text-left text-sm ${
                        userGoals.timeframe === option.value
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-slate-400">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priorité */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-3">
                  Priorité principale
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'income', label: 'Revenus réguliers', icon: '💰' },
                    { value: 'growth', label: 'Croissance du capital', icon: '📈' },
                    { value: 'balance', label: 'Équilibre', icon: '⚖️' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setUserGoals(prev => ({ 
                        ...prev, 
                        priority: option.value as 'income' | 'growth' | 'balance' 
                      }))}
                      className={`w-full p-2 rounded-lg border transition-all text-left text-sm ${
                        userGoals.priority === option.value
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span className="mr-2">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommandations */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Liste des stratégies recommandées */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Lightbulb className="mr-2" size={20} />
                  Stratégies Recommandées
                </h3>
                
                <div className="space-y-4">
                  {recommendations.map((strategy, index) => (
                    <div
                      key={strategy.id}
                      onClick={() => setSelectedStrategy(strategy.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedStrategy === strategy.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <span className="text-lg font-bold text-white">#{index + 1}</span>
                            {index === 0 && <Star className="text-yellow-400" size={16} />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">{strategy.name}</h4>
                            <div className="flex items-center space-x-2 text-xs text-slate-400">
                              <span className="capitalize">{strategy.type}</span>
                              <span>•</span>
                              <span className="capitalize">{strategy.riskLevel} risque</span>
                              {strategy.timeToTarget > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{strategy.timeToTarget} mois</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">
                            {strategy.totalInvestment.toFixed(0)} USDC
                          </div>
                          <div className="text-green-400 text-sm font-semibold">
                            {strategy.roi.toFixed(1)}% ROI
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-slate-300">
                            <span className="text-green-400 font-semibold">
                              {strategy.monthlyIncome} USDC
                            </span>
                            /mois
                          </div>
                          <div className="flex items-center space-x-1">
                            {strategy.nfts.map((nft, i) => (
                              <span key={i} className="text-lg">
                                {NFT_CONFIG[nft.nft].icon}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-purple-400 font-semibold text-sm">
                            Score: {strategy.score.toFixed(0)}/100
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Détails de la stratégie sélectionnée */}
              {getSelectedStrategy() && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <Calculator className="mr-2" size={20} />
                      Détails: {getSelectedStrategy()?.name}
                    </h3>
                    <button
                      onClick={exportStrategy}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Download size={16} />
                      <span>Exporter</span>
                    </button>
                  </div>
                  
                  {(() => {
                    const strategy = getSelectedStrategy()!;
                    return (
                      <div className="space-y-6">
                        {/* Métriques principales */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-700 rounded-lg p-4 text-center">
                            <DollarSign className="mx-auto mb-2 text-green-400" size={20} />
                            <div className="text-green-400 font-bold">
                              {strategy.totalInvestment.toFixed(0)} USDC
                            </div>
                            <div className="text-slate-400 text-sm">Investissement</div>
                          </div>
                          
                          <div className="bg-slate-700 rounded-lg p-4 text-center">
                            <TrendingUp className="mx-auto mb-2 text-blue-400" size={20} />
                            <div className="text-blue-400 font-bold">
                              {strategy.monthlyIncome} USDC
                            </div>
                            <div className="text-slate-400 text-sm">Revenus/Mois</div>
                          </div>
                          
                          <div className="bg-slate-700 rounded-lg p-4 text-center">
                            <BarChart3 className="mx-auto mb-2 text-yellow-400" size={20} />
                            <div className="text-yellow-400 font-bold">
                              {strategy.roi.toFixed(1)}%
                            </div>
                            <div className="text-slate-400 text-sm">ROI Annuel</div>
                          </div>
                          
                          <div className="bg-slate-700 rounded-lg p-4 text-center">
                            <Clock className="mx-auto mb-2 text-purple-400" size={20} />
                            <div className="text-purple-400 font-bold">
                              {strategy.timeToTarget || 0} mois
                            </div>
                            <div className="text-slate-400 text-sm">Délai</div>
                            </div>

                            </div>

                        {/* Composition du portefeuille */}
                        <div>
                          <h4 className="text-white font-semibold mb-4 flex items-center">
                            <PieChart className="mr-2" size={16} />
                            Composition du Portefeuille
                          </h4>
                          <div className="space-y-3">
                            {strategy.nfts.map((nft, index) => {
                              const nftConfig = NFT_CONFIG[nft.nft];
                              const plan = nftConfig.plans.find(p => p.id === nft.plan);
                              const effectiveAPR = plan ? (plan.apr / 100) * nftConfig.multiplier : 0;
                              const monthlyIncome = nft.amount * (effectiveAPR / 12);
                              
                              return (
                                <div key={index} className="bg-slate-700 rounded-lg p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-2xl">{nftConfig.icon}</span>
                                      <div>
                                        <div className="font-semibold text-white">
                                          {nftConfig.name}
                                        </div>
                                        <div className="text-sm text-slate-400">
                                          Plan {plan?.name} • {effectiveAPR ? (effectiveAPR * 100).toFixed(1) : 0}% APR effectif
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-white font-semibold">
                                        {nft.amount.toFixed(0)} USDC
                                      </div>
                                      <div className="text-green-400 text-sm">
                                        +{monthlyIncome.toFixed(0)} USDC/mois
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-3 flex items-center justify-between text-sm">
                                    <div className="text-slate-400">
                                      Coût NFT: {nftConfig.price} USDC
                                    </div>
                                    <div className="text-slate-400">
                                      Multiplicateur: {nftConfig.multiplier}x
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Avantages et inconvénients */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-white font-semibold mb-3 flex items-center">
                              <CheckCircle className="mr-2 text-green-400" size={16} />
                              Avantages
                            </h4>
                            <ul className="space-y-2">
                              {strategy.pros.map((pro, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                  <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={14} />
                                  <span className="text-slate-300 text-sm">{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-white font-semibold mb-3 flex items-center">
                              <AlertTriangle className="mr-2 text-yellow-400" size={16} />
                              Inconvénients
                            </h4>
                            <ul className="space-y-2">
                              {strategy.cons.map((con, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                  <AlertTriangle className="text-yellow-400 mt-0.5 flex-shrink-0" size={14} />
                                  <span className="text-slate-300 text-sm">{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Description détaillée */}
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <h4 className="text-white font-semibold mb-2">Description de la stratégie</h4>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            {strategy.description}
                          </p>
                        </div>

                        {/* Plan d'action étape par étape */}
                        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
                          <h4 className="text-white font-semibold mb-4 flex items-center">
                            <ArrowRight className="mr-2 text-purple-400" size={16} />
                            Plan d'Action
                          </h4>
                          
                          <div className="space-y-4">
                            {strategy.type === 'single' && (
                              <>
                                <div className="flex items-start space-x-3">
                                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                                  <div>
                                    <div className="text-white font-medium">Acquérir le NFT</div>
                                    <div className="text-slate-400 text-sm">
                                      Achetez le {NFT_CONFIG[strategy.nfts[0].nft].name} pour {NFT_CONFIG[strategy.nfts[0].nft].price} USDC
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-start space-x-3">
                                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                                  <div>
                                    <div className="text-white font-medium">Investir le capital</div>
                                    <div className="text-slate-400 text-sm">
                                      Investissez {strategy.nfts[0].amount.toFixed(0)} USDC dans le plan {NFT_CONFIG[strategy.nfts[0].nft].plans.find(p => p.id === strategy.nfts[0].plan)?.name}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-start space-x-3">
                                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                                  <div>
                                    <div className="text-white font-medium">Percevoir les revenus</div>
                                    <div className="text-slate-400 text-sm">
                                      Recevez {strategy.monthlyIncome} USDC par mois automatiquement
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {strategy.type === 'diversified' && (
                              <>
                                <div className="flex items-start space-x-3">
                                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                                  <div>
                                    <div className="text-white font-medium">Acquérir les NFT</div>
                                    <div className="text-slate-400 text-sm">
                                      Achetez {strategy.nfts.map(nft => NFT_CONFIG[nft.nft].name).join(' et ')} 
                                      ({strategy.nfts.reduce((sum, nft) => sum + NFT_CONFIG[nft.nft].price, 0)} USDC total)
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-start space-x-3">
                                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                                  <div>
                                    <div className="text-white font-medium">Répartir les investissements</div>
                                    <div className="text-slate-400 text-sm">
                                      Investissez le capital selon la répartition recommandée
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-start space-x-3">
                                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                                  <div>
                                    <div className="text-white font-medium">Diversifier les revenus</div>
                                    <div className="text-slate-400 text-sm">
                                      Bénéficiez de revenus diversifiés et plus stables
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {strategy.type === 'progressive' && (
                              <>
                                <div className="flex items-start space-x-3">
                                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                                  <div>
                                    <div className="text-white font-medium">Investissement initial</div>
                                    <div className="text-slate-400 text-sm">
                                      Commencez avec {strategy.nfts[0].amount.toFixed(0)} USDC dans le {NFT_CONFIG[strategy.nfts[0].nft].name}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-start space-x-3">
                                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                                  <div>
                                    <div className="text-white font-medium">Réinvestissement automatique</div>
                                    <div className="text-slate-400 text-sm">
                                      Réinvestissez 100% des gains pendant {strategy.timeToTarget} mois
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-start space-x-3">
                                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                                  <div>
                                    <div className="text-white font-medium">Objectif atteint</div>
                                    <div className="text-slate-400 text-sm">
                                      Atteignez {strategy.monthlyIncome} USDC/mois après {strategy.timeToTarget} mois
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparaison des stratégies alternatives */}
        <div className="mt-12 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <BarChart3 className="mr-2" size={20} />
            Comparaison des Stratégies
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left text-slate-400 py-3">Stratégie</th>
                  <th className="text-center text-slate-400 py-3">Type</th>
                  <th className="text-right text-slate-400 py-3">Investissement</th>
                  <th className="text-right text-slate-400 py-3">Revenus/Mois</th>
                  <th className="text-right text-slate-400 py-3">ROI</th>
                  <th className="text-right text-slate-400 py-3">Délai</th>
                  <th className="text-right text-slate-400 py-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((strategy, index) => (
                  <tr 
                    key={strategy.id} 
                    className={`border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer ${
                      selectedStrategy === strategy.id ? 'bg-purple-500/10' : ''
                    }`}
                    onClick={() => setSelectedStrategy(strategy.id)}
                  >
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-white font-bold">#{index + 1}</span>
                          {index === 0 && <Star className="text-yellow-400" size={14} />}
                        </div>
                        <div className="flex items-center space-x-1">
                          {strategy.nfts.map((nft, i) => (
                            <span key={i} className="text-sm">
                              {NFT_CONFIG[nft.nft].icon}
                            </span>
                          ))}
                        </div>
                        <span className="text-white text-sm font-medium">
                          {strategy.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        strategy.type === 'single' ? 'bg-blue-500/20 text-blue-400' :
                        strategy.type === 'diversified' ? 'bg-green-500/20 text-green-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {strategy.type}
                      </span>
                    </td>
                    <td className="py-3 text-right text-white font-semibold">
                      {strategy.totalInvestment.toFixed(0)} USDC
                    </td>
                    <td className="py-3 text-right text-green-400 font-semibold">
                      {strategy.monthlyIncome} USDC
                    </td>
                    <td className="py-3 text-right text-blue-400 font-semibold">
                      {strategy.roi.toFixed(1)}%
                    </td>
                    <td className="py-3 text-right text-slate-300">
                      {strategy.timeToTarget === 0 ? 'Immédiat' : `${strategy.timeToTarget} mois`}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="text-purple-400 font-bold">
                          {strategy.score.toFixed(0)}
                        </div>
                        <div className="w-12 bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${strategy.score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conseils et recommandations générales */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Shield className="mr-2 text-green-400" size={20} />
              Conseils de Sécurité
            </h3>
            <div className="space-y-3 text-slate-300 text-sm">
              <div>
                <span className="font-semibold text-green-400">Diversification:</span>
                <br />Ne mettez pas tous vos œufs dans le même panier. Répartissez vos investissements.
              </div>
              <div>
                <span className="font-semibold text-green-400">Gestion du risque:</span>
                <br />Investissez seulement ce que vous pouvez vous permettre de perdre.
              </div>
              <div>
                <span className="font-semibold text-green-400">Suivi régulier:</span>
                <br />Surveillez régulièrement vos investissements et ajustez si nécessaire.
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Zap className="mr-2 text-blue-400" size={20} />
              Optimisation des Gains
            </h3>
            <div className="space-y-3 text-slate-300 text-sm">
              <div>
                <span className="font-semibold text-blue-400">Multiplicateurs NFT:</span>
                <br />Plus le NFT est rare, plus le multiplicateur boost vos gains.
              </div>
              <div>
                <span className="font-semibold text-blue-400">Plans premium:</span>
                <br />Les plans à plus long terme offrent généralement de meilleurs APR.
              </div>
              <div>
                <span className="font-semibold text-blue-400">Réinvestissement:</span>
                <br />Les intérêts composés sont votre meilleur ami pour la croissance.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>
            Recommandateur de Stratégies v1.0 - Analyse basée sur vos objectifs personnels
            <br />
            Les recommandations sont des estimations. Consultez un conseiller financier pour des décisions importantes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StrategyRecommender;