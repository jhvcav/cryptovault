import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Clock,
  Wallet,
  AlertTriangle,
  Download,
  BarChart3,
  Gem
} from 'lucide-react';

// Configuration des NFT et plans
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

interface CalculationResult {
  dailyYield: number;
  monthlyYield: number;
  yearlyYield: number;
  totalWithPrincipal: number;
  effectiveAPR: number;
}

interface SimulationParams {
  selectedNFT: keyof typeof NFT_CONFIG;
  selectedPlan: string;
  investmentAmount: number;
  numberOfUsers: number;
}

const YieldCalculatorPage: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    selectedNFT: 'bronze',
    selectedPlan: 'starter',
    investmentAmount: 1000,
    numberOfUsers: 1
  });

  const [results, setResults] = useState<CalculationResult | null>(null);
  const [totalCapitalNeeded, setTotalCapitalNeeded] = useState(0);

  // Calculer les rendements
  const calculateYields = () => {
    const nft = NFT_CONFIG[params.selectedNFT];
    const plan = nft.plans.find(p => p.id === params.selectedPlan);
    
    if (!plan) return null;

    const effectiveAPR = (plan.apr / 100) * nft.multiplier;
    const principal = params.investmentAmount;
    
    // Calculs des rendements
    const yearlyYield = principal * effectiveAPR;
    const monthlyYield = yearlyYield / 12;
    const dailyYield = yearlyYield / 365;
    const totalWithPrincipal = principal + yearlyYield;

    return {
      dailyYield,
      monthlyYield,
      yearlyYield,
      totalWithPrincipal,
      effectiveAPR: effectiveAPR * 100
    };
  };

  // Calculer le capital total nécessaire
  const calculateTotalCapital = () => {
    const result = calculateYields();
    if (!result) return 0;

    // Capital pour rembourser le principal + rendements pour tous les utilisateurs
    const totalCapitalPerUser = result.totalWithPrincipal;
    const totalForAllUsers = totalCapitalPerUser * params.numberOfUsers;
    
    // Ajouter une marge de sécurité de 20%
    const securityMargin = totalForAllUsers * 0.2;
    const totalCapitalNeeded = totalForAllUsers + securityMargin;

    return totalCapitalNeeded;
  };

  // Recalculer quand les paramètres changent
  useEffect(() => {
    const result = calculateYields();
    setResults(result);
    
    if (result) {
      const capital = calculateTotalCapital();
      setTotalCapitalNeeded(capital);
    }
  }, [params]);

  // Obtenir les plans disponibles pour le NFT sélectionné
  const getAvailablePlans = () => {
    return NFT_CONFIG[params.selectedNFT].plans;
  };

  // Exporter les données en CSV
  const exportToCSV = () => {
    if (!results) return;

    const nft = NFT_CONFIG[params.selectedNFT];
    const plan = nft.plans.find(p => p.id === params.selectedPlan);
    
    const csvData = [
      ['Paramètre', 'Valeur'],
      ['NFT', nft.name],
      ['Plan', plan?.name || ''],
      ['Prix NFT (USDC)', nft.price],
      ['Multiplicateur', nft.multiplier],
      ['APR de base (%)', plan?.apr || 0],
      ['APR effectif (%)', results.effectiveAPR.toFixed(2)],
      ['Montant d\'investissement (USDC)', params.investmentAmount],
      ['Nombre d\'utilisateurs', params.numberOfUsers],
      [''],
      ['Rendements par utilisateur'],
      ['Rendement quotidien (USDC)', results.dailyYield.toFixed(4)],
      ['Rendement mensuel (USDC)', results.monthlyYield.toFixed(2)],
      ['Rendement annuel (USDC)', results.yearlyYield.toFixed(2)],
      ['Total avec capital (USDC)', results.totalWithPrincipal.toFixed(2)],
      [''],
      ['Capital total nécessaire'],
      ['Pour tous les utilisateurs (USDC)', (results.totalWithPrincipal * params.numberOfUsers).toFixed(2)],
      ['Avec marge de sécurité 20% (USDC)', totalCapitalNeeded.toFixed(2)]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yield_calculation_${params.selectedNFT}_${params.selectedPlan}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const currentNFT = NFT_CONFIG[params.selectedNFT];
  const currentPlan = currentNFT.plans.find(p => p.id === params.selectedPlan);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Calculator className="text-blue-400" size={32} />
            <h1 className="text-4xl font-bold text-white">
              Calculateur de Rendements
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Planifiez vos réserves de capital en simulant les rendements selon les NFT et plans d'investissement
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panneau de configuration */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <BarChart3 className="mr-2" size={20} />
                Paramètres de Simulation
              </h2>

              {/* Sélection NFT */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-3">NFT Sélectionné</label>
                <div className="space-y-2">
                  {Object.entries(NFT_CONFIG).map(([key, nft]) => (
                    <button
                      key={key}
                      onClick={() => setParams(prev => ({ 
                        ...prev, 
                        selectedNFT: key as keyof typeof NFT_CONFIG,
                        selectedPlan: nft.plans[0].id 
                      }))}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        params.selectedNFT === key
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{nft.icon}</span>
                          <span className="font-semibold">{nft.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{nft.price} USDC</div>
                          <div className="text-xs text-green-400">{nft.multiplier}x</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sélection Plan */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-3">Plan d'Investissement</label>
                <div className="space-y-2">
                  {getAvailablePlans().map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setParams(prev => ({ ...prev, selectedPlan: plan.id }))}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        params.selectedPlan === plan.id
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{plan.name}</div>
                          <div className="text-xs text-slate-400">{plan.duration} jours</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{plan.apr}% APR</div>
                          <div className="text-xs text-green-400">
                            Effectif: {(plan.apr * currentNFT.multiplier).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Montant d'investissement */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-3">
                  Montant d'Investissement Moyen (USDC)
                </label>
                <input
                  type="number"
                  value={params.investmentAmount || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setParams(prev => ({ 
                      ...prev, 
                      investmentAmount: value === '' ? 0 : Number(value)
                    }));
                  }}
                  onFocus={(e) => {
                    if (e.target.value === '0') {
                      e.target.value = '';
                    }
                  }}
                  placeholder="1000"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  min="1"
                  step="1"
                />
              </div>

              {/* Nombre d'utilisateurs */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-3">
                  Nombre d'Utilisateurs Estimé
                </label>
                <input
                  type="number"
                  value={params.numberOfUsers}
                  onChange={(e) => setParams(prev => ({ ...prev, numberOfUsers: Number(e.target.value) }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  min="1"
                  step="1"
                />
              </div>

              {/* Bouton Export */}
              <button
                onClick={exportToCSV}
                disabled={!results}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Download size={18} />
                <span>Exporter en CSV</span>
              </button>
            </div>
          </div>

          {/* Résultats */}
          <div className="lg:col-span-2 space-y-6">
            {results && currentPlan && (
              <>
                {/* Résumé de la configuration */}
                <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Gem className="mr-2" size={20} />
                    Configuration Actuelle
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl mb-1">{currentNFT.icon}</div>
                      <div className="text-white font-semibold">{currentNFT.name}</div>
                      <div className="text-blue-400 text-sm">{currentNFT.price} USDC</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">📋</div>
                      <div className="text-white font-semibold">{currentPlan.name}</div>
                      <div className="text-green-400 text-sm">{currentPlan.apr}% APR</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">⚡</div>
                      <div className="text-white font-semibold">Multiplicateur</div>
                      <div className="text-yellow-400 text-sm">{currentNFT.multiplier}x</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">🎯</div>
                      <div className="text-white font-semibold">APR Effectif</div>
                      <div className="text-green-400 text-sm">{results.effectiveAPR.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>

                {/* Rendements par utilisateur */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <TrendingUp className="mr-2" size={20} />
                    Rendements par Utilisateur ({params.investmentAmount} USDC)
                  </h3>
                  
                  {/* Rendements de base (sans multiplicateur) */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-slate-300 mb-4 flex items-center">
                      📊 Rendements de Base (sans multiplicateur NFT)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-700/50 rounded-lg p-4 text-center border border-slate-600">
                        <Clock className="mx-auto mb-2 text-slate-400" size={20} />
                        <h5 className="text-slate-300 font-medium mb-1">Par Jour</h5>
                        <p className="text-xl font-bold text-slate-400">
                          {((params.investmentAmount * (currentPlan.apr / 100)) / 365).toFixed(4)} USDC
                        </p>
                      </div>

                      <div className="bg-slate-700/50 rounded-lg p-4 text-center border border-slate-600">
                        <Calendar className="mx-auto mb-2 text-slate-400" size={20} />
                        <h5 className="text-slate-300 font-medium mb-1">Par Mois</h5>
                        <p className="text-xl font-bold text-slate-400">
                          {((params.investmentAmount * (currentPlan.apr / 100)) / 12).toFixed(2)} USDC
                        </p>
                      </div>

                      <div className="bg-slate-700/50 rounded-lg p-4 text-center border border-slate-600">
                        <TrendingUp className="mx-auto mb-2 text-slate-400" size={20} />
                        <h5 className="text-slate-300 font-medium mb-1">Par An</h5>
                        <p className="text-xl font-bold text-slate-400">
                          {(params.investmentAmount * (currentPlan.apr / 100)).toFixed(2)} USDC
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rendements avec multiplicateur NFT */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      ⚡ Rendements avec Multiplicateur NFT ({currentNFT.multiplier}x)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-700 rounded-lg p-4 text-center border-2 border-blue-500/30">
                        <Clock className="mx-auto mb-2 text-blue-400" size={24} />
                        <h5 className="text-white font-semibold mb-1">Par Jour</h5>
                        <p className="text-2xl font-bold text-blue-400">
                          {results.dailyYield.toFixed(4)} USDC
                        </p>
                        <p className="text-green-400 text-sm mt-1">
                          +{(results.dailyYield - ((params.investmentAmount * (currentPlan.apr / 100)) / 365)).toFixed(4)} bonus
                        </p>
                      </div>

                      <div className="bg-slate-700 rounded-lg p-4 text-center border-2 border-green-500/30">
                        <Calendar className="mx-auto mb-2 text-green-400" size={24} />
                        <h5 className="text-white font-semibold mb-1">Par Mois</h5>
                        <p className="text-2xl font-bold text-green-400">
                          {results.monthlyYield.toFixed(2)} USDC
                        </p>
                        <p className="text-green-400 text-sm mt-1">
                          +{(results.monthlyYield - ((params.investmentAmount * (currentPlan.apr / 100)) / 12)).toFixed(2)} bonus
                        </p>
                      </div>

                      <div className="bg-slate-700 rounded-lg p-4 text-center border-2 border-yellow-500/30">
                        <TrendingUp className="mx-auto mb-2 text-yellow-400" size={24} />
                        <h5 className="text-white font-semibold mb-1">Par An</h5>
                        <p className="text-2xl font-bold text-yellow-400">
                          {results.yearlyYield.toFixed(2)} USDC
                        </p>
                        <p className="text-green-400 text-sm mt-1">
                          +{(results.yearlyYield - (params.investmentAmount * (currentPlan.apr / 100))).toFixed(2)} bonus
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Capital total nécessaire */}
                <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Wallet className="mr-2" size={20} />
                    Capital Total Nécessaire
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Détails par utilisateur */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white mb-3">📊 Détails par utilisateur</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Investissement par utilisateur:</span>
                        <span className="text-white font-semibold">
                          {params.investmentAmount.toLocaleString()} USDC
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Rendement par utilisateur:</span>
                        <span className="text-green-400 font-semibold">
                          {results.yearlyYield.toFixed(2)} USDC
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Total par utilisateur:</span>
                        <span className="text-yellow-400 font-semibold">
                          {results.totalWithPrincipal.toFixed(2)} USDC
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Nombre d'utilisateurs:</span>
                        <span className="text-white font-semibold">
                          {params.numberOfUsers.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Capital nécessaire */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white mb-3">💰 Capital nécessaire</h4>
                      
                      {/* Capital par jour */}
                      <div className="bg-slate-700 rounded-lg p-4">
                        <div className="text-center">
                          <h5 className="text-blue-400 font-semibold mb-2">Capital Quotidien</h5>
                          <p className="text-xl font-bold text-blue-400">
                            {(results.dailyYield * params.numberOfUsers).toLocaleString()} USDC
                          </p>
                          <p className="text-slate-400 text-xs">Pour payer les rendements quotidiens</p>
                        </div>
                      </div>

                      {/* Capital par mois */}
                      <div className="bg-slate-700 rounded-lg p-4">
                        <div className="text-center">
                          <h5 className="text-green-400 font-semibold mb-2">Capital Mensuel</h5>
                          <p className="text-xl font-bold text-green-400">
                            {(results.monthlyYield * params.numberOfUsers).toLocaleString()} USDC
                          </p>
                          <p className="text-slate-400 text-xs">Pour payer les rendements mensuels</p>
                        </div>
                      </div>

                      {/* Capital minimum total */}
                      <div className="bg-slate-700 rounded-lg p-4">
                        <div className="text-center">
                          <h5 className="text-yellow-400 font-semibold mb-2">Capital Minimum Total</h5>
                          <p className="text-xl font-bold text-yellow-400">
                            {(results.totalWithPrincipal * params.numberOfUsers).toLocaleString()} USDC
                          </p>
                          <p className="text-slate-400 text-xs">Capital + rendements annuels</p>
                        </div>
                      </div>

                      {/* Capital recommandé */}
                      <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                        <div className="text-center">
                          <h5 className="text-red-400 font-semibold mb-2">Capital Recommandé</h5>
                          <p className="text-2xl font-bold text-red-400">
                            {totalCapitalNeeded.toLocaleString()} USDC
                          </p>
                          <p className="text-red-300 text-xs">Avec marge de sécurité 20%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="text-orange-400 mt-0.5 flex-shrink-0" size={16} />
                      <div className="text-orange-300 text-sm">
                        <p className="font-medium mb-1">Note importante:</p>
                        <p>
                          Les capitaux quotidiens et mensuels représentent les liquidités nécessaires pour payer 
                          les rendements selon la fréquence choisie. Le capital total doit couvrir les remboursements 
                          de capital + tous les rendements sur la durée complète.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YieldCalculatorPage;