import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Clock, Award, DollarSign, Calendar, Percent, Plus, Trash2, Copy } from 'lucide-react';

const NFTMultiPlanSimulator = () => {
  // Configuration des NFT et leurs accès
  const nftTypes = {
    bronze: {
      name: 'NFT Bronze',
      multiplier: 1.2,
      plans: ['starter'],
      color: 'from-orange-600 to-orange-800',
      icon: '🥉'
    },
    silver: {
      name: 'NFT Argent',
      multiplier: 1.5,
      plans: ['starter', 'standard'],
      color: 'from-gray-400 to-gray-600',
      icon: '🥈'
    },
    gold: {
      name: 'NFT Or',
      multiplier: 2.0,
      plans: ['starter', 'standard', 'premium'],
      color: 'from-yellow-400 to-yellow-600',
      icon: '🥇'
    },
    privilege: {
      name: 'NFT Privilège',
      multiplier: 2.5,
      plans: ['starter', 'standard', 'premium', 'enterprise'],
      color: 'from-purple-400 to-purple-600',
      icon: '👑'
    }
  };

  // Configuration des plans d'investissement
  const investmentPlans = {
    starter: {
      name: 'Starter',
      duration: 30,
      apr: 15,
      minDeposit: 150,
      description: 'Plan idéal pour débuter',
      color: 'bg-blue-600'
    },
    standard: {
      name: 'Standard',
      duration: 90,
      apr: 20,
      minDeposit: 500,
      description: 'Plan équilibré pour investisseurs réguliers',
      color: 'bg-green-600'
    },
    premium: {
      name: 'Premium',
      duration: 180,
      apr: 25,
      minDeposit: 1000,
      description: 'Plan avancé pour maximiser les rendements',
      color: 'bg-purple-600'
    },
    enterprise: {
      name: 'Enterprise',
      duration: 360,
      apr: 30,
      minDeposit: 2000,
      description: 'Plan exclusif pour gros investisseurs',
      color: 'bg-red-600'
    }
  };

  // États du composant
  const [selectedNFT, setSelectedNFT] = useState('gold');
  const [simulations, setSimulations] = useState([
    { id: 1, plan: 'starter', amount: '', results: null },
    { id: 2, plan: 'standard', amount: '', results: null },
    { id: 3, plan: 'premium', amount: '', results: null }
  ]);
  const [globalResults, setGlobalResults] = useState({
    totalInvestment: 0,
    totalDailyReturn: 0,
    totalMonthlyReturn: 0,
    totalRewards: 0,
    totalFinalAmount: 0
  });

  // Calculer les résultats pour une simulation
  const calculateSimulationResults = (plan, amount, nftMultiplier) => {
    const numericAmount = parseFloat(amount) || 0;
    const planConfig = investmentPlans[plan];
    
    if (!planConfig || numericAmount <= 0) {
      return null;
    }

    const isValidAmount = numericAmount >= planConfig.minDeposit;
    if (!isValidAmount) {
      return null;
    }

    const effectiveAPR = planConfig.apr * nftMultiplier;
    const dailyReturn = (numericAmount * (effectiveAPR / 100)) / 365;
    const monthlyReturn = dailyReturn * 30;
    const totalReturn = dailyReturn * planConfig.duration;
    const finalAmount = numericAmount + totalReturn;

    return {
      dailyReturn,
      monthlyReturn,
      totalReturn,
      finalAmount,
      effectiveAPR,
      isValidAmount: true
    };
  };

  // Recalculer toutes les simulations
  useEffect(() => {
    const nft = nftTypes[selectedNFT];
    const updatedSimulations = simulations.map(sim => ({
      ...sim,
      results: calculateSimulationResults(sim.plan, sim.amount, nft.multiplier)
    }));
    
    setSimulations(updatedSimulations);

    // Calculer les totaux globaux
    const validResults = updatedSimulations.filter(sim => sim.results);
    const totals = validResults.reduce((acc, sim) => {
      const amount = parseFloat(sim.amount) || 0;
      return {
        totalInvestment: acc.totalInvestment + amount,
        totalDailyReturn: acc.totalDailyReturn + sim.results.dailyReturn,
        totalMonthlyReturn: acc.totalMonthlyReturn + sim.results.monthlyReturn,
        totalRewards: acc.totalRewards + sim.results.totalReturn,
        totalFinalAmount: acc.totalFinalAmount + sim.results.finalAmount
      };
    }, {
      totalInvestment: 0,
      totalDailyReturn: 0,
      totalMonthlyReturn: 0,
      totalRewards: 0,
      totalFinalAmount: 0
    });

    setGlobalResults(totals);
  }, [simulations, selectedNFT]);

  // Gérer les changements dans les simulations
  const updateSimulation = (id, field, value) => {
    setSimulations(prev => 
      prev.map(sim => 
        sim.id === id ? { ...sim, [field]: value } : sim
      )
    );
  };

  // Ajouter une nouvelle simulation
  const addSimulation = () => {
    const newId = Math.max(...simulations.map(s => s.id)) + 1;
    const availablePlans = nftTypes[selectedNFT].plans;
    setSimulations(prev => [...prev, {
      id: newId,
      plan: availablePlans[0],
      amount: '',
      results: null
    }]);
  };

  // Supprimer une simulation
  const removeSimulation = (id) => {
    if (simulations.length > 1) {
      setSimulations(prev => prev.filter(sim => sim.id !== id));
    }
  };

  // Dupliquer une simulation
  const duplicateSimulation = (id) => {
    const simToDuplicate = simulations.find(sim => sim.id === id);
    const newId = Math.max(...simulations.map(s => s.id)) + 1;
    setSimulations(prev => [...prev, {
      ...simToDuplicate,
      id: newId,
      amount: ''
    }]);
  };

  // Formater les nombres
  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(num);
  };

  const formatPercent = (num) => {
    return new Intl.NumberFormat('fr-FR', { 
      minimumFractionDigits: 1, 
      maximumFractionDigits: 1 
    }).format(num);
  };

  const currentNFT = nftTypes[selectedNFT];
  const availablePlans = currentNFT.plans;

  return (
    <div className="py-12 px-4 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-4">
            Simulateur NFT Multi-Plans
          </h1>
          <p className="text-slate-400 text-lg">
            Comparez plusieurs stratégies d'investissement avec le même NFT
          </p>
        </div>

        {/* Sélection du NFT */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
            <Award className="mr-3 text-yellow-400" size={28} />
            Choisissez votre NFT
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {Object.entries(nftTypes).map(([key, nft]) => (
              <div
                key={key}
                onClick={() => setSelectedNFT(key)}
                className={`cursor-pointer rounded-xl p-4 border-2 transition-all duration-300 ${
                  selectedNFT === key 
                    ? 'border-blue-400 bg-slate-700' 
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <div className={`bg-gradient-to-r ${nft.color} rounded-lg p-4 text-center mb-3`}>
                  <div className="text-3xl mb-2">{nft.icon}</div>
                  <div className="text-white font-bold">{nft.name}</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-bold text-lg">
                    Bonus x{nft.multiplier}
                  </div>
                  <div className="text-slate-400 text-sm mt-1">
                    {nft.plans.length} plan{nft.plans.length > 1 ? 's' : ''} disponible{nft.plans.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">NFT sélectionné: {currentNFT.name}</h3>
            <p className="text-slate-400 text-sm">
              Plans disponibles: {availablePlans.map(plan => investmentPlans[plan].name).join(', ')}
            </p>
          </div>
        </div>

        {/* Simulations multiples */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white flex items-center">
              <Calculator className="mr-3 text-blue-400" size={28} />
              Simulations d'investissement
            </h2>
            <button
              onClick={addSimulation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Ajouter une simulation
            </button>
          </div>

          <div className="space-y-6">
            {simulations.map((simulation, index) => {
              const planConfig = investmentPlans[simulation.plan];
              return (
                <div key={simulation.id} className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-white font-medium text-lg flex items-center">
                      <div className={`w-8 h-8 ${planConfig.color} rounded-full flex items-center justify-center text-white text-sm font-bold mr-3`}>
                        {index + 1}
                      </div>
                      Simulation {index + 1}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => duplicateSimulation(simulation.id)}
                        className="text-blue-400 hover:text-blue-300 p-1"
                        title="Dupliquer"
                      >
                        <Copy size={18} />
                      </button>
                      {simulations.length > 1 && (
                        <button
                          onClick={() => removeSimulation(simulation.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Configuration */}
                    <div className="lg:col-span-1">
                      <div className="space-y-4">
                        {/* Sélection du plan */}
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">
                            Plan d'investissement
                          </label>
                          <select
                            value={simulation.plan}
                            onChange={(e) => updateSimulation(simulation.id, 'plan', e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {availablePlans.map(planKey => (
                              <option key={planKey} value={planKey}>
                                {investmentPlans[planKey].name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Montant */}
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">
                            Montant (USDT/USDC)
                          </label>
                          <input
                            type="number"
                            value={simulation.amount}
                            onChange={(e) => updateSimulation(simulation.id, 'amount', e.target.value)}
                            min={planConfig.minDeposit}
                            step="50"
                            className={`w-full px-4 py-3 rounded-lg bg-slate-700 border text-white focus:outline-none focus:ring-2 transition-all ${
                              simulation.results || !simulation.amount
                                ? 'border-slate-600 focus:ring-blue-500'
                                : 'border-red-500 focus:ring-red-500'
                            }`}
                            placeholder={`Min: ${planConfig.minDeposit}$`}
                          />
                          {simulation.amount && !simulation.results && (
                            <p className="text-red-400 text-sm mt-1">
                              Montant minimum: {planConfig.minDeposit}$ USDT/USDC
                            </p>
                          )}
                        </div>

                        {/* Infos du plan */}
                        <div className="bg-slate-600/50 rounded p-3">
                          <div className="text-xs text-slate-400 space-y-1">
                            <div>APR de base: {planConfig.apr}%</div>
                            <div>APR avec NFT: {formatPercent(planConfig.apr * currentNFT.multiplier)}%</div>
                            <div>Durée: {planConfig.duration} jours</div>
                            <div>Minimum: {planConfig.minDeposit}$</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Résultats */}
                    <div className="lg:col-span-2">
                      {simulation.results ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="bg-slate-600 rounded p-3">
                            <div className="text-xs text-slate-400">Quotidien</div>
                            <div className="text-sm font-semibold text-white">
                              {formatNumber(simulation.results.dailyReturn)} USDT
                            </div>
                          </div>
                          <div className="bg-slate-600 rounded p-3">
                            <div className="text-xs text-slate-400">Mensuel</div>
                            <div className="text-sm font-semibold text-white">
                              {formatNumber(simulation.results.monthlyReturn)} USDT
                            </div>
                          </div>
                          <div className="bg-slate-600 rounded p-3">
                            <div className="text-xs text-slate-400">Récompenses</div>
                            <div className="text-sm font-semibold text-green-400">
                              {formatNumber(simulation.results.totalReturn)} USDT
                            </div>
                          </div>
                          <div className="bg-slate-600 rounded p-3">
                            <div className="text-xs text-slate-400">Final</div>
                            <div className="text-sm font-semibold text-white">
                              {formatNumber(simulation.results.finalAmount)} USDT
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-24 text-slate-400">
                          {simulation.amount ? 'Montant insuffisant' : 'Entrez un montant pour voir les résultats'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Résultats globaux */}
        {globalResults.totalInvestment > 0 && (
          <div className="bg-slate-800 rounded-xl p-6 mb-8">
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <TrendingUp className="mr-3 text-green-400" size={28} />
              Résultats combinés
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Investissement Total</div>
                <div className="text-2xl font-bold text-blue-400">
                  {formatNumber(globalResults.totalInvestment)} USDT
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Rendement Quotidien</div>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(globalResults.totalDailyReturn)} USDT
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Rendement Mensuel</div>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(globalResults.totalMonthlyReturn)} USDT
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Récompenses Totales</div>
                <div className="text-2xl font-bold text-green-400">
                  {formatNumber(globalResults.totalRewards)} USDT
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4">
                <div className="text-sm text-green-100 mb-1">Montant Final</div>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(globalResults.totalFinalAmount)} USDT
                </div>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-start">
                <Clock className="text-blue-400 mr-3 mt-1" size={20} />
                <div>
                  <h4 className="text-white font-medium mb-1">Stratégie multi-plans avec {currentNFT.name}</h4>
                  <p className="text-slate-400 text-sm">
                    Vous diversifiez votre portefeuille avec {simulations.filter(s => s.results).length} investissement{simulations.filter(s => s.results).length > 1 ? 's' : ''} différent{simulations.filter(s => s.results).length > 1 ? 's' : ''}, 
                    profitant du bonus multiplicateur x{currentNFT.multiplier} sur tous vos plans.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informations importantes */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Conseils pour optimiser vos simulations</h3>
          <div className="text-slate-400 space-y-4 text-sm">
            <p>
              <strong>Diversification intelligente :</strong> Combinez différents plans pour équilibrer 
              rendement et durée de blocage selon vos objectifs financiers.
            </p>
            <p>
              <strong>Comparaison de stratégies :</strong> Testez plusieurs montants sur le même plan 
              ou répartissez votre capital sur différents plans pour optimiser vos rendements.
            </p>
            <p>
              <strong>Bonus NFT :</strong> Le multiplicateur s'applique à tous vos investissements. 
              Plus votre NFT est rare, plus tous vos plans bénéficient d'un bonus important.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTMultiPlanSimulator;