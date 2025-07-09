
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calculator,
  RefreshCw,
  BarChart3,
  Target,
  Clock,
  DollarSign,
  Zap,
  Download,
  AlertCircle,
  ArrowRight,
  PieChart
} from 'lucide-react';

// Configuration identique à la page originale
const NFT_CONFIG = {
  bronze: {
    name: 'NFT Bronze',
    icon: '🥉',
    price: 120,
    multiplier: 1.2,
    plans: [
      { id: 'starter', name: 'Starter', apr: 12, duration: 30 }
    ]
  },
  silver: {
    name: 'NFT Argent',
    icon: '🥈',
    price: 250,
    multiplier: 1.5,
    plans: [
      { id: 'starter', name: 'Starter', apr: 12, duration: 30 },
      { id: 'standard', name: 'Standard', apr: 15, duration: 90 }
    ]
  },
  gold: {
    name: 'NFT Or',
    icon: '🥇',
    price: 500,
    multiplier: 2.0,
    plans: [
      { id: 'starter', name: 'Starter', apr: 12, duration: 30 },
      { id: 'standard', name: 'Standard', apr: 15, duration: 90 },
      { id: 'premium', name: 'Premium', apr: 20, duration: 180 }
    ]
  },
  privilege: {
    name: 'NFT Privilège',
    icon: '💎',
    price: 1000,
    multiplier: 2.5,
    plans: [
      { id: 'starter', name: 'Starter', apr: 12, duration: 30 },
      { id: 'standard', name: 'Standard', apr: 15, duration: 90 },
      { id: 'premium', name: 'Premium', apr: 20, duration: 180 },
      { id: 'enterprise', name: 'Enterprise', apr: 25, duration: 360 }
    ]
  }
};

interface SimulationStrategy {
  id: string;
  name: string;
  nft: keyof typeof NFT_CONFIG;
  plan: string;
  initialAmount: number;
  reinvestmentRate: number; // % des gains à réinvestir
  simulationPeriod: number; // en mois
}

interface SimulationResult {
  strategy: SimulationStrategy;
  monthlyData: {
    month: number;
    totalInvested: number;
    totalValue: number;
    monthlyGains: number;
    reinvestedAmount: number;
    withdrawnAmount: number;
    cumulativeGains: number;
    effectiveAPR: number;
  }[];
  finalStats: {
    totalInvested: number;
    finalValue: number;
    totalGains: number;
    totalWithdrawn: number;
    averageMonthlyReturn: number;
    roi: number;
  };
}

const CompoundInterestSimulator: React.FC = () => {
  const [strategies, setStrategies] = useState<SimulationStrategy[]>([
    {
      id: '1',
      name: 'Stratégie Conservative',
      nft: 'bronze',
      plan: 'starter',
      initialAmount: 1000,
      reinvestmentRate: 50,
      simulationPeriod: 12
    },
    {
      id: '2',
      name: 'Stratégie Équilibrée',
      nft: 'silver',
      plan: 'standard',
      initialAmount: 1000,
      reinvestmentRate: 75,
      simulationPeriod: 12
    },
    {
      id: '3',
      name: 'Stratégie Aggressive',
      nft: 'gold',
      plan: 'premium',
      initialAmount: 1000,
      reinvestmentRate: 100,
      simulationPeriod: 12
    }
  ]);

  const [results, setResults] = useState<SimulationResult[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('1');
  const [comparisonMode, setComparisonMode] = useState<boolean>(true);
  const [portfolioMode, setPortfolioMode] = useState<boolean>(false);

  // Calculer les intérêts composés pour une stratégie
  const calculateCompoundInterest = (strategy: SimulationStrategy): SimulationResult => {
    const nft = NFT_CONFIG[strategy.nft];
    const plan = nft.plans.find(p => p.id === strategy.plan);
    
    if (!plan) {
      throw new Error('Plan non trouvé');
    }

    const monthlyRate = (plan.apr / 100) * nft.multiplier / 12;
    const monthlyData = [];
    
    let currentAmount = strategy.initialAmount;
    let totalInvested = strategy.initialAmount;
    let totalWithdrawn = 0;
    let cumulativeGains = 0;

    for (let month = 1; month <= strategy.simulationPeriod; month++) {
      const monthlyGains = currentAmount * monthlyRate;
      const reinvestedAmount = monthlyGains * (strategy.reinvestmentRate / 100);
      const withdrawnAmount = monthlyGains - reinvestedAmount;
      
      currentAmount += reinvestedAmount;
      totalInvested += reinvestedAmount;
      totalWithdrawn += withdrawnAmount;
      cumulativeGains += monthlyGains;

      monthlyData.push({
        month,
        totalInvested,
        totalValue: currentAmount,
        monthlyGains,
        reinvestedAmount,
        withdrawnAmount,
        cumulativeGains,
        effectiveAPR: (plan.apr * nft.multiplier)
      });
    }

    const finalStats = {
      totalInvested,
      finalValue: currentAmount,
      totalGains: cumulativeGains,
      totalWithdrawn,
      averageMonthlyReturn: cumulativeGains / strategy.simulationPeriod,
      roi: ((currentAmount + totalWithdrawn - strategy.initialAmount) / strategy.initialAmount) * 100
    };

    return {
      strategy,
      monthlyData,
      finalStats
    };
  };

  // Recalculer les résultats quand les stratégies changent
  useEffect(() => {
    const newResults = strategies.map(calculateCompoundInterest);
    setResults(newResults);
  }, [strategies]);

  // Mettre à jour une stratégie
  const updateStrategy = (id: string, updates: Partial<SimulationStrategy>) => {
    setStrategies(prev => prev.map(strategy => 
      strategy.id === id ? { ...strategy, ...updates } : strategy
    ));
  };

  // Ajouter une nouvelle stratégie
  const addStrategy = () => {
    const newId = (strategies.length + 1).toString();
    const newStrategy: SimulationStrategy = {
      id: newId,
      name: `Stratégie ${newId}`,
      nft: 'bronze',
      plan: 'starter',
      initialAmount: 1000,
      reinvestmentRate: 50,
      simulationPeriod: 12
    };
    setStrategies(prev => [...prev, newStrategy]);
  };

  // Supprimer une stratégie
  const removeStrategy = (id: string) => {
    if (strategies.length > 1) {
      setStrategies(prev => prev.filter(s => s.id !== id));
    }
  };

  // Calculer le portefeuille combiné
  const calculatePortfolioResults = (): SimulationResult => {
    const maxPeriod = Math.max(...strategies.map(s => s.simulationPeriod));
    const portfolioData = [];
    
    let totalInvestedCumulative = strategies.reduce((sum, s) => sum + s.initialAmount, 0);
    let totalValueCumulative = totalInvestedCumulative;
    let totalWithdrawnCumulative = 0;
    let totalGainsCumulative = 0;

    for (let month = 1; month <= maxPeriod; month++) {
      let monthlyGainsTotal = 0;
      let monthlyReinvestedTotal = 0;
      let monthlyWithdrawnTotal = 0;
      
      // Calculer les gains pour chaque stratégie active ce mois-ci
      strategies.forEach(strategy => {
        if (month <= strategy.simulationPeriod) {
          const result = calculateCompoundInterest(strategy);
          const monthData = result.monthlyData[month - 1];
          if (monthData) {
            monthlyGainsTotal += monthData.monthlyGains;
            monthlyReinvestedTotal += monthData.reinvestedAmount;
            monthlyWithdrawnTotal += monthData.withdrawnAmount;
          }
        }
      });

      totalInvestedCumulative += monthlyReinvestedTotal;
      totalValueCumulative += monthlyReinvestedTotal;
      totalWithdrawnCumulative += monthlyWithdrawnTotal;
      totalGainsCumulative += monthlyGainsTotal;

      portfolioData.push({
        month,
        totalInvested: totalInvestedCumulative,
        totalValue: totalValueCumulative,
        monthlyGains: monthlyGainsTotal,
        reinvestedAmount: monthlyReinvestedTotal,
        withdrawnAmount: monthlyWithdrawnTotal,
        cumulativeGains: totalGainsCumulative,
        effectiveAPR: 0 // Sera calculé comme moyenne pondérée
      });
    }

    // Calculer l'APR effectif moyen pondéré
    const totalInitialInvestment = strategies.reduce((sum, s) => sum + s.initialAmount, 0);
    let weightedAPR = 0;
    strategies.forEach(strategy => {
      const nft = NFT_CONFIG[strategy.nft];
      const plan = nft.plans.find(p => p.id === strategy.plan);
      if (plan) {
        const weight = strategy.initialAmount / totalInitialInvestment;
        weightedAPR += (plan.apr * nft.multiplier) * weight;
      }
    });

    portfolioData.forEach(data => {
      data.effectiveAPR = weightedAPR;
    });

    const finalStats = {
      totalInvested: totalInvestedCumulative,
      finalValue: totalValueCumulative,
      totalGains: totalGainsCumulative,
      totalWithdrawn: totalWithdrawnCumulative,
      averageMonthlyReturn: totalGainsCumulative / maxPeriod,
      roi: ((totalValueCumulative + totalWithdrawnCumulative - totalInitialInvestment) / totalInitialInvestment) * 100
    };

    return {
      strategy: {
        id: 'portfolio',
        name: 'Portefeuille Combiné',
        nft: 'gold', // Valeur par défaut pour l'affichage
        plan: 'mixed',
        initialAmount: totalInitialInvestment,
        reinvestmentRate: 0, // Moyenne pondérée
        simulationPeriod: maxPeriod
      },
      monthlyData: portfolioData,
      finalStats
    };
  };

  // Exporter les résultats
  const exportResults = () => {
    const csvData = [
      ['Stratégie', 'NFT', 'Plan', 'Montant Initial', 'Taux Réinvestissement', 'Période', 'Valeur Finale', 'Gains Total', 'ROI %']
    ];

    results.forEach(result => {
      const strategy = result.strategy;
      const stats = result.finalStats;
      csvData.push([
        strategy.name,
        NFT_CONFIG[strategy.nft].name,
        NFT_CONFIG[strategy.nft].plans.find(p => p.id === strategy.plan)?.name || '',
        strategy.initialAmount.toString(),
        `${strategy.reinvestmentRate}%`,
        `${strategy.simulationPeriod} mois`,
        stats.finalValue.toFixed(2),
        stats.totalGains.toFixed(2),
        stats.roi.toFixed(2)
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation_interets_composes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Obtenir les plans disponibles pour un NFT
  const getAvailablePlans = (nftKey: keyof typeof NFT_CONFIG) => {
    return NFT_CONFIG[nftKey].plans;
  };

  const portfolioResult = calculatePortfolioResults();
  const selectedResult = portfolioMode ? portfolioResult : results.find(r => r.strategy.id === selectedStrategy);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <RefreshCw className="text-green-400" size={32} />
            <h1 className="text-4xl font-bold text-white">
              Simulateur d'Intérêts Composés
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Comparez différentes stratégies d'investissement et optimisez vos réinvestissements
          </p>
        </div>

        {/* Contrôles principaux */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                comparisonMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {comparisonMode ? 'Vue Comparaison' : 'Vue Détaillée'}
            </button>
            
            {!comparisonMode && (
              <button
                onClick={() => setPortfolioMode(!portfolioMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  portfolioMode 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {portfolioMode ? 'Portefeuille Combiné' : 'Stratégie Individuelle'}
              </button>
            )}
            
            <button
              onClick={addStrategy}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              + Ajouter Stratégie
            </button>
          </div>
          <button
            onClick={exportResults}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Download size={18} />
            <span>Exporter</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration des stratégies */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Target className="mr-2" size={20} />
                Configuration des Stratégies
              </h2>

              <div className="space-y-6">
                {strategies.map((strategy, index) => (
                  <div 
                    key={strategy.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedStrategy === strategy.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <input
                        type="text"
                        value={strategy.name}
                        onChange={(e) => updateStrategy(strategy.id, { name: e.target.value })}
                        className="bg-transparent text-white font-semibold text-sm border-none outline-none flex-1"
                        onClick={() => setSelectedStrategy(strategy.id)}
                      />
                      {strategies.length > 1 && (
                        <button
                          onClick={() => removeStrategy(strategy.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* NFT Selection */}
                    <div className="mb-3">
                      <label className="block text-slate-400 text-xs mb-2">NFT</label>
                      <select
                        value={strategy.nft}
                        onChange={(e) => {
                          const nftKey = e.target.value as keyof typeof NFT_CONFIG;
                          const firstPlan = NFT_CONFIG[nftKey].plans[0].id;
                          updateStrategy(strategy.id, { nft: nftKey, plan: firstPlan });
                        }}
                        className="w-full bg-slate-600 text-white text-sm rounded px-3 py-2 border border-slate-500"
                      >
                        {Object.entries(NFT_CONFIG).map(([key, nft]) => (
                          <option key={key} value={key}>
                            {nft.icon} {nft.name} ({nft.multiplier}x)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Plan Selection */}
                    <div className="mb-3">
                      <label className="block text-slate-400 text-xs mb-2">Plan</label>
                      <select
                        value={strategy.plan}
                        onChange={(e) => updateStrategy(strategy.id, { plan: e.target.value })}
                        className="w-full bg-slate-600 text-white text-sm rounded px-3 py-2 border border-slate-500"
                      >
                        {getAvailablePlans(strategy.nft).map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} ({plan.apr}% APR)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Montant Initial */}
                    <div className="mb-3">
                      <label className="block text-slate-400 text-xs mb-2">Montant Initial (USDC)</label>
                      <input
                        type="number"
                        value={strategy.initialAmount || ''}
                        onChange={(e) => updateStrategy(strategy.id, { initialAmount: Number(e.target.value) })}
                        className="w-full bg-slate-600 text-white text-sm rounded px-3 py-2 border border-slate-500"
                        min="1"
                      />
                    </div>

                    {/* Taux de Réinvestissement */}
                    <div className="mb-3">
                      <label className="block text-slate-400 text-xs mb-2">
                        Réinvestissement: {strategy.reinvestmentRate}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={strategy.reinvestmentRate}
                        onChange={(e) => updateStrategy(strategy.id, { reinvestmentRate: Number(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>0% (Tout retirer)</span>
                        <span>100% (Tout réinvestir)</span>
                      </div>
                    </div>

                    {/* Période de Simulation */}
                    <div className="mb-3">
                      <label className="block text-slate-400 text-xs mb-2">Période (mois)</label>
                      <input
                        type="number"
                        value={strategy.simulationPeriod}
                        onChange={(e) => updateStrategy(strategy.id, { simulationPeriod: Number(e.target.value) })}
                        className="w-full bg-slate-600 text-white text-sm rounded px-3 py-2 border border-slate-500"
                        min="1"
                        max="60"
                      />
                    </div>

                    {/* Aperçu rapide */}
                    {results.find(r => r.strategy.id === strategy.id) && (
                      <div className="mt-3 p-2 bg-slate-800 rounded text-center">
                        <div className="text-green-400 font-bold text-sm">
                          {results.find(r => r.strategy.id === strategy.id)?.finalStats.roi.toFixed(1)}% ROI
                        </div>
                        <div className="text-slate-300 text-xs">
                          Valeur finale: {results.find(r => r.strategy.id === strategy.id)?.finalStats.finalValue.toFixed(0)} USDC
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Résumé du portefeuille */}
              {strategies.length > 1 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg">
                  <h3 className="text-white font-semibold mb-3 flex items-center">
                    <PieChart className="mr-2" size={16} />
                    Résumé Portefeuille
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Investissement total:</span>
                      <span className="text-white font-semibold">
                        {strategies.reduce((sum, s) => sum + s.initialAmount, 0).toLocaleString()} USDC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Valeur finale combinée:</span>
                      <span className="text-green-400 font-semibold">
                        {portfolioResult.finalStats.finalValue.toFixed(0)} USDC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ROI combiné:</span>
                      <span className="text-green-400 font-semibold">
                        {portfolioResult.finalStats.roi.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">NFT utilisés:</span>
                      <span className="text-white">
                        {[...new Set(strategies.map(s => NFT_CONFIG[s.nft].icon))].join(' ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Résultats */}
          <div className="lg:col-span-2">
            {comparisonMode ? (
              /* Vue Comparaison */
              <div className="space-y-6">
                {/* Tableau de comparaison */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <BarChart3 className="mr-2" size={20} />
                    Comparaison des Stratégies
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-600">
                          <th className="text-left text-slate-400 py-3">Stratégie</th>
                          <th className="text-right text-slate-400 py-3">Config</th>
                          <th className="text-right text-slate-400 py-3">Valeur Finale</th>
                          <th className="text-right text-slate-400 py-3">Gains Total</th>
                          <th className="text-right text-slate-400 py-3">Retiré</th>
                          <th className="text-right text-slate-400 py-3">ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result, index) => {
                          const nft = NFT_CONFIG[result.strategy.nft];
                          const plan = nft.plans.find(p => p.id === result.strategy.plan);
                          return (
                            <tr 
                              key={result.strategy.id} 
                              className={`border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer ${
                                selectedStrategy === result.strategy.id ? 'bg-blue-500/10' : ''
                              }`}
                              onClick={() => setSelectedStrategy(result.strategy.id)}
                            >
                              <td className="py-3">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{nft.icon}</span>
                                  <div>
                                    <div className="text-white font-medium">{result.strategy.name}</div>
                                    <div className="text-slate-400 text-xs">{result.strategy.simulationPeriod} mois</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-right">
                                <div className="text-slate-300">{plan?.name}</div>
                                <div className="text-slate-400 text-xs">{result.strategy.reinvestmentRate}% réinv.</div>
                              </td>
                              <td className="py-3 text-right">
                                <div className="text-white font-semibold">
                                  {result.finalStats.finalValue.toFixed(0)} USDC
                                </div>
                              </td>
                              <td className="py-3 text-right">
                                <div className="text-green-400 font-semibold">
                                  +{result.finalStats.totalGains.toFixed(0)} USDC
                                </div>
                              </td>
                              <td className="py-3 text-right">
                                <div className="text-blue-400 font-semibold">
                                  {result.finalStats.totalWithdrawn.toFixed(0)} USDC
                                </div>
                              </td>
                              <td className="py-3 text-right">
                                <div className={`font-bold ${
                                  result.finalStats.roi > 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {result.finalStats.roi.toFixed(1)}%
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Graphique visuel simple */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <PieChart className="mr-2" size={20} />
                    Performance Visuelle
                  </h3>
                  
                  <div className="space-y-4">
                    {results.map((result, index) => {
                      const maxValue = Math.max(...results.map(r => r.finalStats.finalValue));
                      const barWidth = (result.finalStats.finalValue / maxValue) * 100;
                      
                      return (
                        <div key={result.strategy.id} className="flex items-center space-x-4">
                          <div className="w-32 text-sm text-slate-300 truncate">
                            {result.strategy.name}
                          </div>
                          <div className="flex-1 bg-slate-700 rounded-full h-6 relative">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-full rounded-full transition-all duration-1000"
                              style={{ width: `${barWidth}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                              {result.finalStats.finalValue.toFixed(0)} USDC
                            </div>
                          </div>
                          <div className="w-20 text-right text-sm text-green-400 font-semibold">
                            {result.finalStats.roi.toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Vue Détaillée */
              selectedResult && (
                <div className="space-y-6">
                  {/* Statistiques détaillées */}
                  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                      <Calculator className="mr-2" size={20} />
                      Détails: {selectedResult.strategy.name}
                      {portfolioMode && (
                        <span className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs rounded">
                          {strategies.length} stratégies
                        </span>
                      )}
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-700 rounded-lg p-4 text-center">
                        <DollarSign className="mx-auto mb-2 text-green-400" size={24} />
                        <div className="text-green-400 font-bold text-lg">
                          {selectedResult.finalStats.finalValue.toFixed(0)}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {portfolioMode ? 'Valeur Totale' : 'Valeur Finale'}
                        </div>
                      </div>
                      
                      <div className="bg-slate-700 rounded-lg p-4 text-center">
                        <TrendingUp className="mx-auto mb-2 text-blue-400" size={24} />
                        <div className="text-blue-400 font-bold text-lg">
                          {selectedResult.finalStats.roi.toFixed(1)}%
                        </div>
                        <div className="text-slate-400 text-sm">
                          {portfolioMode ? 'ROI Combiné' : 'ROI Total'}
                        </div>
                      </div>
                      
                      <div className="bg-slate-700 rounded-lg p-4 text-center">
                        <Zap className="mx-auto mb-2 text-yellow-400" size={24} />
                        <div className="text-yellow-400 font-bold text-lg">
                          {selectedResult.finalStats.totalGains.toFixed(0)}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {portfolioMode ? 'Gains Totaux' : 'Gains Total'}
                        </div>
                      </div>
                      
                      <div className="bg-slate-700 rounded-lg p-4 text-center">
                        <Clock className="mx-auto mb-2 text-purple-400" size={24} />
                        <div className="text-purple-400 font-bold text-lg">
                          {selectedResult.finalStats.averageMonthlyReturn.toFixed(0)}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {portfolioMode ? 'Revenus/Mois' : 'Moy. Mensuelle'}
                        </div>
                      </div>
                    </div>

                    {/* Progression mensuelle */}
                    <div className="mt-6">
                      <h4 className="text-white font-semibold mb-4 flex items-center">
                        {portfolioMode ? (
                          <>
                            <PieChart className="mr-2" size={16} />
                            Évolution du Portefeuille Combiné
                          </>
                        ) : (
                          'Évolution Mensuelle'
                        )}
                      </h4>
                      
                      {portfolioMode && (
                        <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                          <div className="text-purple-300 text-sm">
                            <strong>Mode Portefeuille:</strong> Les données ci-dessous représentent la somme de toutes vos stratégies actives.
                            Chaque mois additionne les gains de tous vos NFT et plans d'investissement.
                          </div>
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-600">
                              <th className="text-left text-slate-400 py-2">Mois</th>
                              <th className="text-right text-slate-400 py-2">Valeur</th>
                              <th className="text-right text-slate-400 py-2">Gains Mensuels</th>
                              <th className="text-right text-slate-400 py-2">Réinvesti</th>
                              <th className="text-right text-slate-400 py-2">Retiré</th>
                              <th className="text-right text-slate-400 py-2">Cumul Gains</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedResult.monthlyData.map((month, index) => (
                              <tr key={month.month} className="border-b border-slate-700">
                                <td className="py-2 text-white">{month.month}</td>
                                <td className="py-2 text-right text-white">
                                  {month.totalValue.toFixed(0)} USDC
                                </td>
                                <td className="py-2 text-right text-green-400">
                                  +{month.monthlyGains.toFixed(0)} USDC
                                </td>
                                <td className="py-2 text-right text-blue-400">
                                  {month.reinvestedAmount.toFixed(0)} USDC
                                </td>
                                <td className="py-2 text-right text-yellow-400">
                                  {month.withdrawnAmount.toFixed(0)} USDC
                                </td>
                                <td className="py-2 text-right text-green-400">
                                  {month.cumulativeGains.toFixed(0)} USDC
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Recommandations */}
                  <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <AlertCircle className="mr-2" size={20} />
                      Analyse de la Stratégie
                    </h3>
                    
                    <div className="space-y-3 text-slate-300">
                      <div className="flex items-start space-x-2">
                        <ArrowRight className="text-blue-400 mt-0.5 flex-shrink-0" size={16} />
                        <div>
                          <span className="font-semibold">Efficacité du réinvestissement:</span> 
                          {selectedResult.strategy.reinvestmentRate >= 80 ? 
                            ' Excellent pour maximiser la croissance' : 
                            selectedResult.strategy.reinvestmentRate >= 50 ? 
                            ' Équilibré entre croissance et liquidité' : 
                            ' Orienté vers les retraits réguliers'
                          }
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <ArrowRight className="text-blue-400 mt-0.5 flex-shrink-0" size={16} />
                        <div>
                          <span className="font-semibold">Impact du multiplicateur NFT:</span> 
                          {' '}Le multiplicateur {NFT_CONFIG[selectedResult.strategy.nft].multiplier}x 
                          booste vos gains de {((NFT_CONFIG[selectedResult.strategy.nft].multiplier - 1) * 100).toFixed(0)}%
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2"></div>
                          <ArrowRight className="text-blue-400 mt-0.5 flex-shrink-0" size={16} />
                        <div>
                          <span className="font-semibold">Rentabilité sur la période:</span> 
                          {' '}Votre investissement génère en moyenne {selectedResult.finalStats.averageMonthlyReturn.toFixed(0)} USDC par mois
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <ArrowRight className="text-blue-400 mt-0.5 flex-shrink-0" size={16} />
                        <div>
                          <span className="font-semibold">Recommandation:</span> 
                          {selectedResult.finalStats.roi > 50 ? 
                            ' Excellente stratégie, considérez prolonger la période' :
                            selectedResult.finalStats.roi > 25 ? 
                            ' Bonne performance, ajustez le taux de réinvestissement si nécessaire' :
                            ' Considérez un NFT avec un multiplicateur plus élevé'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
              )
            )}
          </div>
        </div>

        {/* Conseils et informations */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Target className="mr-2 text-green-400" size={20} />
              Stratégies Recommandées
            </h3>
            <div className="space-y-3 text-slate-300 text-sm">
              <div>
                <span className="font-semibold text-green-400">Conservative (0-50% réinvestissement):</span>
                <br />Idéale pour générer des revenus réguliers tout en préservant une partie du capital.
              </div>
              <div>
                <span className="font-semibold text-blue-400">Équilibrée (50-75% réinvestissement):</span>
                <br />Bon compromis entre croissance et liquidité. Recommandée pour la plupart des investisseurs.
              </div>
              <div>
                <span className="font-semibold text-purple-400">Aggressive (75-100% réinvestissement):</span>
                <br />Maximise la croissance à long terme. Idéale si vous n'avez pas besoin de liquidité immédiate.
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <AlertCircle className="mr-2 text-orange-400" size={20} />
              Points Importants
            </h3>
            <div className="space-y-3 text-slate-300 text-sm">
              <div>
                <span className="font-semibold text-orange-400">Multiplicateurs NFT:</span>
                <br />Plus le NFT est rare, plus le multiplicateur est élevé, augmentant significativement vos gains.
              </div>
              <div>
                <span className="font-semibold text-red-400">Gestion des risques:</span>
                <br />Diversifiez vos stratégies et ne réinvestissez pas 100% si vous avez besoin de liquidités.
              </div>
              <div>
                <span className="font-semibold text-yellow-400">Optimisation:</span>
                <br />Réajustez régulièrement votre taux de réinvestissement selon vos objectifs financiers.
              </div>
            </div>
          </div>
        </div>

        {/* Calculateur rapide d'objectifs */}
        <div className="mt-12 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Calculator className="mr-2" size={20} />
            Calculateur d'Objectifs Rapide
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Pour atteindre 10,000 USDC en 12 mois</h4>
              {Object.entries(NFT_CONFIG).map(([key, nft]) => {
                const bestPlan = nft.plans[nft.plans.length - 1];
                const monthlyRate = (bestPlan.apr / 100) * nft.multiplier / 12;
                const requiredInitial = 10000 / (Math.pow(1 + monthlyRate, 12));
                
                return (
                  <div key={key} className="bg-slate-700 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">
                        {nft.icon} {nft.name}
                      </span>
                      <span className="text-green-400 font-semibold text-sm">
                        {requiredInitial.toFixed(0)} USDC
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Avec {bestPlan.name} ({(bestPlan.apr * nft.multiplier).toFixed(1)}% effectif)
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-white">Avec 1,000 USDC initial</h4>
              {Object.entries(NFT_CONFIG).map(([key, nft]) => {
                const bestPlan = nft.plans[nft.plans.length - 1];
                const monthlyRate = (bestPlan.apr / 100) * nft.multiplier / 12;
                const finalAmount = 1000 * Math.pow(1 + monthlyRate, 12);
                
                return (
                  <div key={key} className="bg-slate-700 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">
                        {nft.icon} {nft.name}
                      </span>
                      <span className="text-blue-400 font-semibold text-sm">
                        {finalAmount.toFixed(0)} USDC
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Gain: +{(finalAmount - 1000).toFixed(0)} USDC
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-white">Revenus mensuels passifs</h4>
              {Object.entries(NFT_CONFIG).map(([key, nft]) => {
                const bestPlan = nft.plans[nft.plans.length - 1];
                const monthlyRate = (bestPlan.apr / 100) * nft.multiplier / 12;
                const requiredForMonthly = 1000 / monthlyRate; // Pour 1000 USDC/mois
                
                return (
                  <div key={key} className="bg-slate-700 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">
                        {nft.icon} {nft.name}
                      </span>
                      <span className="text-purple-400 font-semibold text-sm">
                        {requiredForMonthly.toFixed(0)} USDC
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Pour 1,000 USDC/mois
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer avec version et informations */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>
            Simulateur d'Intérêts Composés v2.0 - Les calculs sont basés sur les configurations NFT actuelles.
            <br />
            Les résultats sont des estimations et ne constituent pas des conseils financiers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompoundInterestSimulator;