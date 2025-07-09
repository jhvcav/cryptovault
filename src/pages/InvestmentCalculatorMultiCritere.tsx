import React, { useState, useEffect } from 'react';
import { ArrowRight, Calculator, TrendingUp, Clock, Plus, Minus } from 'lucide-react';

const InvestmentCalculatorMultiCritere = () => {
  // État pour stocker les 3 lignes d'investissement
  const [investments, setInvestments] = useState([
    { id: 1, apr: '', amount: '', duration: '', name: 'Investissement 1' },
    { id: 2, apr: '', amount: '', duration: '', name: 'Investissement 2' },
    { id: 3, apr: '', amount: '', duration: '', name: 'Investissement 3' },
    { id: 4, apr: '', amount: '', duration: '', name: 'Investissement 4' }
  ]);

  // État pour stocker les résultats combinés
  const [totalResults, setTotalResults] = useState({
    dailyReturn: 0,
    monthlyReturn: 0,
    totalReturn: 0,
    totalAmount: 0,
    totalInvested: 0
  });

  // État pour stocker les résultats individuels
  const [individualResults, setIndividualResults] = useState([]);

  // Calculer les rendements pour chaque investissement
  const calculateInvestmentReturns = (apr, amount, duration) => {
    const numericApr = parseFloat(apr) || 0;
    const numericAmount = parseFloat(amount) || 0;
    const numericDuration = parseFloat(duration) || 0;

    if (numericAmount <= 0 || numericApr <= 0 || numericDuration <= 0) {
      return {
        dailyReturn: 0,
        monthlyReturn: 0,
        totalReturn: 0,
        totalAmount: 0
      };
    }

    // Calcul du rendement quotidien
    const dailyReturn = (numericAmount * (numericApr / 100)) / 365;
    
    // Calcul du rendement mensuel (basé sur 30 jours)
    const monthlyReturn = dailyReturn * 30;
    
    // Calcul du rendement total sur la durée
    const totalReturn = dailyReturn * numericDuration;
    
    // Montant total à la fin de la période
    const totalAmount = numericAmount + totalReturn;

    return {
      dailyReturn,
      monthlyReturn,
      totalReturn,
      totalAmount
    };
  };

  // Recalculer tous les résultats quand les investissements changent
  useEffect(() => {
    const results = investments.map(inv => 
      calculateInvestmentReturns(inv.apr, inv.amount, inv.duration)
    );
    
    setIndividualResults(results);

    // Calculer les totaux
    const totalInvested = investments.reduce((sum, inv) => {
      const amount = parseFloat(inv.amount) || 0;
      return sum + amount;
    }, 0);

    const totalDailyReturn = results.reduce((sum, result) => sum + result.dailyReturn, 0);
    const totalMonthlyReturn = results.reduce((sum, result) => sum + result.monthlyReturn, 0);
    const totalReturnSum = results.reduce((sum, result) => sum + result.totalReturn, 0);
    const totalAmountSum = results.reduce((sum, result) => sum + result.totalAmount, 0);

    setTotalResults({
      dailyReturn: totalDailyReturn,
      monthlyReturn: totalMonthlyReturn,
      totalReturn: totalReturnSum,
      totalAmount: totalAmountSum,
      totalInvested
    });
  }, [investments]);

  // Gérer les changements dans les champs
  const handleInputChange = (id, field, value) => {
    setInvestments(prev => 
      prev.map(inv => 
        inv.id === id ? { ...inv, [field]: value } : inv
      )
    );
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
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Calculateur Multi-Investissements</h1>
          <p className="text-slate-400">
            Comparez et simulez jusqu'à 3 investissements avec des paramètres personnalisés
          </p>
        </div>
        
        <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg mb-8">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Calculator className="mr-2 text-blue-400" size={24} />
              Configurez vos investissements
            </h2>
            
            <div className="space-y-6">
              {investments.map((investment, index) => (
                <div key={investment.id} className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4 flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                      {index + 1}
                    </div>
                    {investment.name}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* APR */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        APR (%)
                      </label>
                      <input
                        type="number"
                        value={investment.apr}
                        onChange={(e) => handleInputChange(investment.id, 'apr', e.target.value)}
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Ex: 15"
                      />
                    </div>
                    
                    {/* Montant */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Montant (USDT/USDC)
                      </label>
                      <input
                        type="number"
                        value={investment.amount}
                        onChange={(e) => handleInputChange(investment.id, 'amount', e.target.value)}
                        min="0"
                        step="100"
                        className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Ex: 1000"
                      />
                    </div>
                    
                    {/* Durée */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Durée de blocage (jours)
                      </label>
                      <input
                        type="number"
                        value={investment.duration}
                        onChange={(e) => handleInputChange(investment.id, 'duration', e.target.value)}
                        min="0"
                        step="1"
                        className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Ex: 90"
                      />
                    </div>
                  </div>
                  
                  {/* Résultats individuels */}
                  {individualResults[index] && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-slate-600/50 rounded p-3">
                        <div className="text-xs text-slate-400">Quotidien</div>
                        <div className="text-sm font-semibold text-white">
                          {formatNumber(individualResults[index].dailyReturn)} USDT
                        </div>
                      </div>
                      <div className="bg-slate-600/50 rounded p-3">
                        <div className="text-xs text-slate-400">Mensuel</div>
                        <div className="text-sm font-semibold text-white">
                          {formatNumber(individualResults[index].monthlyReturn)} USDT
                        </div>
                      </div>
                      <div className="bg-slate-600/50 rounded p-3">
                        <div className="text-xs text-slate-400">Total</div>
                        <div className="text-sm font-semibold text-green-400">
                          {formatNumber(individualResults[index].totalReturn)} USDT
                        </div>
                      </div>
                      <div className="bg-slate-600/50 rounded p-3">
                        <div className="text-xs text-slate-400">Final</div>
                        <div className="text-sm font-semibold text-white">
                          {formatNumber(individualResults[index].totalAmount)} USDT
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Résultats totaux */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="mr-2 text-green-400" size={20} />
              Résultats combinés
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Investissement Total</div>
                <div className="text-xl font-bold text-blue-400">
                  {formatNumber(totalResults.totalInvested)} USDT
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Rendement Quotidien</div>
                <div className="text-xl font-bold text-white">
                  {formatNumber(totalResults.dailyReturn)} USDT
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Rendement Mensuel</div>
                <div className="text-xl font-bold text-white">
                  {formatNumber(totalResults.monthlyReturn)} USDT
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Rendement Total</div>
                <div className="text-xl font-bold text-green-400">
                  {formatNumber(totalResults.totalReturn)} USDT
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Montant Final</div>
                <div className="text-xl font-bold text-white">
                  {formatNumber(totalResults.totalAmount)} USDT
                </div>
              </div>
            </div>
            
            {/* Informations sur la stratégie */}
            <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Clock className="text-blue-400 mr-3 mt-1" size={20} />
                <div>
                  <h4 className="text-white font-medium mb-1">Stratégie d'investissement diversifiée</h4>
                  <p className="text-slate-400 text-sm">
                    En diversifiant vos investissements sur plusieurs plans avec des APR, montants et durées différents, vous optimisez votre portefeuille et réduisez les risques. Les rendements sont calculés quotidiennement pour chaque investissement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Informations complémentaires */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Informations importantes</h3>
          <div className="text-slate-400 space-y-4 text-sm">
            <p>
              Les rendements affichés sont des estimations basées sur les taux APR saisis. Les rendements réels peuvent varier en fonction des conditions du marché.
            </p>
            <p>
              Chaque investissement est calculé indépendamment. Le rendement quotidien est calculé en divisant le taux APR annuel par 365 jours, puis multiplié par la durée de blocage pour le rendement total.
            </p>
            <p>
              La diversification permet de répartir les risques sur plusieurs investissements avec des paramètres différents. Assurez-vous de bien comprendre les conditions de chaque plan avant d'investir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentCalculatorMultiCritere;