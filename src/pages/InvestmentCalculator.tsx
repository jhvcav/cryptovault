import React, { useState, useEffect } from 'react';
import { ArrowRight, Calculator, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

// Définition des plans d'investissement
const INVESTMENT_PLANS = [
  { id: 'starter', name: 'Plan Starter', apr: 10, duration: 30 },
  { id: 'standard', name: 'Plan Standard', apr: 15, duration: 90 },
  { id: 'premium', name: 'Plan Premium', apr: 20, duration: 180 },
  { id: 'privilege', name: 'Plan Privilege', apr: 150, duration: 360}
];

const InvestmentCalculator = () => {
  // État pour stocker les entrées de l'utilisateur
  const [selectedPlan, setSelectedPlan] = useState(INVESTMENT_PLANS[0]);
  const [amount, setAmount] = useState(1000);
  const [results, setResults] = useState({
    dailyReturn: 0,
    monthlyReturn: 0,
    totalReturn: 0,
    totalAmount: 0
  });

  // Calculer les rendements lorsque le plan ou le montant change
  useEffect(() => {
    const numericAmount = typeof amount === 'string' ? 0 : amount;
  
  if (numericAmount <= 0) {
    setResults({
      dailyReturn: 0,
      monthlyReturn: 0,
      totalReturn: 0,
      totalAmount: 0
    });
    return;
  }

    // Calcul du rendement quotidien
    const dailyReturn = (amount * (selectedPlan.apr / 100)) / 365;
    
    // Calcul du rendement mensuel (basé sur 30 jours)
    const monthlyReturn = dailyReturn * 30;
    
    // Calcul du rendement total sur la durée du plan
    const totalReturn = dailyReturn * selectedPlan.duration;
    
    // Montant total à la fin de la période
    const totalAmount = amount + totalReturn;

    setResults({
      dailyReturn,
      monthlyReturn,
      totalReturn,
      totalAmount
    });
  }, [selectedPlan, amount]);

  // Gérer le changement de plan
  const handlePlanChange = (e) => {
    const plan = INVESTMENT_PLANS.find(p => p.id === e.target.value);
    if (plan) {
      setSelectedPlan(plan);
    }
  };

  // Gérer le changement de montant
  const handleAmountChange = (e) => {
  const value = e.target.value;
  
  // Permettre une chaîne vide temporaire
  if (value === '') {
    setAmount('');
    return;
  }
  
  const numericValue = parseFloat(value);
  setAmount(isNaN(numericValue) ? '' : numericValue);
};

  // Formater les nombres avec 2 décimales et séparateur de milliers
  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(num);
  };

  return (
    <div className="py-12 px-4 bg-slate-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Calculateur de récompense</h1>
          <p className="text-slate-400">
            Estimez vos récompenses potentielles en fonction de nos différents plans de récompense.
          </p>
        </div>
        
        <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Calculator className="mr-2 text-blue-400" size={24} />
              Simulez votre récompenses
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sélection du plan */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Choisissez un plan
                </label>
                <select
                  value={selectedPlan.id}
                  onChange={handlePlanChange}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  {INVESTMENT_PLANS.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.apr}% APR - {plan.duration} jours
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Montant de l'investissement */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Montant à investir (USDT/USDC)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  min="0"
                  step="100"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Entrez le montant"
                />
              </div>
            </div>
          </div>
          
          {/* Résultats du calcul */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="mr-2 text-green-400" size={20} />
              Résultats estimés
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Rendement Quotidien</div>
                <div className="text-xl font-bold text-white">
                  {formatNumber(results.dailyReturn)} USDT
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Rendement Mensuel</div>
                <div className="text-xl font-bold text-white">
                  {formatNumber(results.monthlyReturn)} USDT
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Rendement Total</div>
                <div className="text-xl font-bold text-green-400">
                  {formatNumber(results.totalReturn)} USDT
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Montant Final</div>
                <div className="text-xl font-bold text-white">
                  {formatNumber(results.totalAmount)} USDT
                </div>
              </div>
            </div>
            
            {/* Informations sur le plan */}
            <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Clock className="text-blue-400 mr-3 mt-1" size={20} />
                <div>
                  <h4 className="text-white font-medium mb-1">Détails du plan sélectionné</h4>
                  <p className="text-slate-400 text-sm">
                    Le <span className="text-white font-medium">{selectedPlan.name}</span> offre un taux annuel de <span className="text-white font-medium">{selectedPlan.apr}% APR</span> sur une période de <span className="text-white font-medium">{selectedPlan.duration} jours</span>. Les rendements sont calculés quotidiennement et peuvent être retirés à tout moment.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Call to action */}
            <div className="flex justify-center">
              <Link to="/invest" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center">
  Commencer à Investir
  <ArrowRight size={18} className="ml-2" />
</Link>
            </div>
          </div>
        </div>
        
        {/* Informations complémentaires */}
        <div className="mt-12 bg-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Informations importantes</h3>
          <div className="text-slate-400 space-y-4 text-sm">
            <p>
              Les rendements affichés sont des estimations basées sur le taux APR actuel. Les rendements réels peuvent varier en fonction des conditions du marché.
            </p>
            <p>
              Le calcul suppose que les résultats des stratégies restent constant pendant toute la durée de vos plan de récompense. Les récompenses quotidiens est calculé en divisant le taux APR annuel par 365 jours.
            </p>
            <p>
              Les plans de récompense comportent une période de blocage pendant laquelle le capital ne peut pas être retiré. Les rendements, cependant, peuvent être retirés à tout moment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentCalculator;