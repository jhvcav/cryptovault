import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight,
  DollarSign, 
  BarChart3, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useInvestment } from '../contexts/InvestmentContext';
import StatsCard from '../components/dashboard/StatsCard';
import InvestmentCard from '../components/dashboard/InvestmentCard';
import InvestmentChart from '../components/dashboard/InvestmentChart';

const Dashboard = () => {
  const { address, balance } = useWallet();
  const { 
    activeInvestments, 
    plans, 
    calculateReturns, 
    withdrawReturns, 
    getTotalInvested, 
    getTotalReturns 
  } = useInvestment();
  
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [totalReturnsValue, setTotalReturnsValue] = useState(0);
  const [calculatedInvestments, setCalculatedInvestments] = useState<Array<{
    investment: typeof activeInvestments[0];
    plan: typeof plans[0];
    returns: number;
  }>>([]);
  
  // Données du graphique pour démonstration
  const [chartData] = useState({
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    values: [0.5, 1, 1.5, 2, 2.5, 3, 3.5]
  });
  
  // Calculer les rendements totaux
  useEffect(() => {
    const fetchTotalReturns = async () => {
      const total = await getTotalReturns();
      setTotalReturnsValue(total);
    };
    fetchTotalReturns();
  }, [getTotalReturns]);
  
  // Traiter les investissements et calculer les rendements actuels
  useEffect(() => {
    const calculateAllReturns = async () => {
      if (!activeInvestments.length || !plans.length) return;
      
      try {
        const processed = await Promise.all(activeInvestments.map(async (investment) => {
          const plan = plans.find(p => p.id === investment.planId);
          if (!plan) {
            console.error(`Plan non trouvé pour l'investissement ${investment.id}`);
            return null;
          }
          
          // Utiliser investment.id comme identifiant, qui est une chaîne
          const stakeId = parseInt(investment.id);
          const returns = await calculateReturns(stakeId);
          
          return { investment, plan, returns };
        }));
        
        // Filtrer les valeurs nulles
        setCalculatedInvestments(processed.filter(Boolean));
      } catch (error) {
        console.error('Erreur dans le calcul des rendements:', error);
      }
    };
    
    calculateAllReturns();
  }, [activeInvestments, plans, calculateReturns]);
  
  // Gérer le retrait des rendements
  const handleWithdraw = async (investmentId: string) => {
    setWithdrawingId(investmentId);
    try {
      await withdrawReturns(investmentId);
      
      // Rafraîchir les calculs après le retrait
      await handleRefresh();
    } catch (error) {
      console.error('Erreur de retrait:', error);
    } finally {
      setWithdrawingId(null);
    }
  };
  
  // Gérer le rafraîchissement des données
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const total = await getTotalReturns();
      setTotalReturnsValue(total);
      
      // Recalculer tous les rendements
      const processed = await Promise.all(activeInvestments.map(async (investment) => {
        const plan = plans.find(p => p.id === investment.planId);
        if (!plan) return null;
        
        const stakeId = parseInt(investment.id);
        const returns = await calculateReturns(stakeId);
        
        return { investment, plan, returns };
      }));
      
      setCalculatedInvestments(processed.filter(Boolean));
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Vérifier s'il y a des investissements actifs
  const hasInvestments = activeInvestments.length > 0;
  
  // Calculer les totaux
  const totalInvested = getTotalInvested();
  
  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Tableau de Bord</h1>
            <p className="text-slate-400">
              Suivez vos investissements et rendements
            </p>
          </div>
          <div className="flex items-center mt-4 md:mt-0">
            <div className="bg-slate-800 rounded-lg p-2 px-4 flex items-center mr-2">
              <Wallet size={16} className="text-blue-400 mr-2" />
              <span className="text-sm text-slate-300 mr-2">Portefeuille:</span>
              <span className="text-sm text-white">
                {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'Non connecté'}
              </span>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        
        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            title="Solde USDT" 
            value={`${balance.usdt.toFixed(2)} USDT`}
            icon={<DollarSign size={22} />}
          />
          <StatsCard 
            title="Solde USDC" 
            value={`${balance.usdc.toFixed(2)} USDC`}
            icon={<DollarSign size={22} />}
          />
          <StatsCard 
            title="Total Investi" 
            value={`${totalInvested.toFixed(2)} USDT/USDC`}
            icon={<BarChart3 size={22} />}
            change={{ value: '15.3%', positive: true }}
          />
          <StatsCard 
            title="Rendements Totaux" 
            value={`${totalReturnsValue.toFixed(2)} USDT/USDC`}
            icon={<ArrowUpRight size={22} />}
            change={{ value: '8.2%', positive: true }}
          />
        </div>
        
        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Investissements actifs */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Investissements Actifs</h2>
                {hasInvestments && (
                  <span className="bg-blue-600 rounded-full px-3 py-1 text-xs font-semibold text-white">
                    {activeInvestments.length} Actif{activeInvestments.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {!hasInvestments ? (
                <div className="text-center py-12">
                  <Clock size={48} className="text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Aucun Investissement Actif</h3>
                  <p className="text-slate-400 mb-6">
                    Vous n'avez pas encore d'investissements actifs. Commencez à investir pour voir votre portefeuille ici.
                  </p>
                  <a 
                    href="/invest"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 px-6 rounded-lg font-medium transition-all duration-200"
                  >
                    Commencer à Investir
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {calculatedInvestments.map(({ investment, plan, returns }) => (
                    <InvestmentCard
                      key={investment.id}
                      investment={investment}
                      plan={plan}
                      calculatedReturns={returns}
                      onWithdraw={handleWithdraw}
                      isWithdrawing={withdrawingId === investment.id}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <InvestmentChart data={chartData} />
          </div>
          
          {/* Colonne droite - Statistiques et informations */}
          <div className="space-y-8">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-6">Résumé des Investissements</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Total Investi</span>
                    <span className="text-white">{totalInvested.toFixed(2)} USDT/USDC</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Rendements Actuels</span>
                    <span className="text-white">{totalReturnsValue.toFixed(2)} USDT/USDC</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${totalInvested > 0 ? Math.min((totalReturnsValue / totalInvested) * 100, 100) : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">ROI</span>
                    <span className="text-white">
                      {totalInvested > 0 ? ((totalReturnsValue / totalInvested) * 100).toFixed(2) : '0.00'}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full" 
                      style={{ 
                        width: `${totalInvested > 0 ? Math.min((totalReturnsValue / totalInvested) * 100, 100) : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Distribution des Investissements</h2>
              
              {!hasInvestments ? (
                <div className="text-center py-6">
                  <p className="text-slate-400">
                    Aucune donnée d'investissement à afficher
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {plans.map(plan => {
                    const planInvestments = calculatedInvestments.filter(
                      item => item.investment.planId === plan.id
                    );
                    const planTotal = planInvestments.reduce(
                      (sum, item) => sum + item.investment.amount, 
                      0
                    );
                    const percentage = totalInvested > 0 
                      ? (planTotal / totalInvested) * 100 
                      : 0;
                    
                    return (
                      <div key={plan.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white">Plan {plan.name}</span>
                          <span className="text-slate-400">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              plan.id === 0
                                ? 'bg-blue-500' 
                                : plan.id === 1
                                  ? 'bg-indigo-500' 
                                  : 'bg-violet-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-6">Transactions Récentes</h2>
              
              {!hasInvestments ? (
                <div className="text-center py-6">
                  <p className="text-slate-400">
                    Aucun historique de transaction à afficher
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeInvestments.slice(0, 3).map((investment) => (
                    <div key={investment.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                      <div className="flex items-center">
                        <div className="bg-blue-600/20 rounded-full p-2 mr-3">
                          <Wallet size={16} className="text-blue-400" />
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">
                            Investissement dans le Plan {plans.find(p => p.id === investment.planId)?.name || 'Inconnu'}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {investment.startDate.toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <div className="text-white text-right">
                        {investment.amount.toFixed(2)} {investment.token}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;