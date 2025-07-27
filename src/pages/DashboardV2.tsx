//src/pages/DashboardV2.tsx
import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight,
  DollarSign, 
  BarChart3, 
  Clock, 
  RefreshCw,
  History
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useInvestmentV2 } from '../contexts/InvestmentContextV2';
import { useNFTAccess } from '../hooks/useNFTAccess'; // ✅ AJOUTÉ
import { useNavigate, Link } from 'react-router-dom';
import StatsCard from '../components/dashboard/StatsCard';
import InvestmentCardV2 from '../components/dashboard/InvestmentCardV2';
import InvestmentChart from '../components/dashboard/InvestmentChart';

const DashboardV2 = () => {
  const { address, balance, chainId } = useWallet();
  const { 
    activeInvestments, 
    plans, 
    calculateReturns, 
    withdrawReturns, 
    withdrawCapital,
    getTotalInvested, 
    getTotalReturns,
    isLoading,
    error
  } = useInvestmentV2();
  
  // ✅ AJOUTÉ - Hook NFT pour le multiplicateur
  const { 
    hasNFT, 
    multiplier, 
    loading: nftLoading,
    error: nftError
  } = useNFTAccess();
  
  const navigate = useNavigate();
  
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [withdrawingCapitalId, setWithdrawingCapitalId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [totalReturnsValue, setTotalReturnsValue] = useState(0);
  const [calculatedInvestments, setCalculatedInvestments] = useState([]);
  
  // Données du graphique pour démonstration
  const [chartData, setChartData] = useState({
    labels: [],
    values: []
  });

  // ✅ SÉCURISATION: Vérifier que les données sont chargées
  const safeActiveInvestments = activeInvestments || [];
  const safePlans = plans || [];
  const safeBalance = balance || { usdt: 0, usdc: 0 };

  // Format pour afficher les dates de semaine
  const formatWeekLabel = (date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  // Fonction utilitaire pour ajouter des jours à une date
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // ✅ CORRIGÉ - Générer des données de graphique hebdomadaires avec bonus NFT
  useEffect(() => {
    if (calculatedInvestments.length === 0) {
      setChartData({
        labels: ['Aucune donnée'],
        values: [0]
      });
      return;
    }

    // Trier les investissements par date de début
    const sortedInvestments = [...calculatedInvestments].sort((a, b) => 
      new Date(a.investment.startDate).getTime() - new Date(b.investment.startDate).getTime()
    );

    // Trouver la date du premier investissement
    const firstInvestmentDate = new Date(sortedInvestments[0].investment.startDate);
    const currentDate = new Date();
    
    const labels = [];
    const values = [];
    
    // Créer un tableau de dates hebdomadaires entre le premier investissement et aujourd'hui
    let currentWeek = new Date(firstInvestmentDate);
    
    while (currentWeek <= currentDate) {
      const weekLabel = formatWeekLabel(currentWeek);
      labels.push(weekLabel);
      
      // ✅ CORRIGÉ - Calculer la valeur totale avec bonus NFT
      const totalValue = sortedInvestments.reduce((sum, item) => {
        const investmentDate = new Date(item.investment.startDate);
        
        if (investmentDate <= currentWeek) {
          const timeDiff = Math.min(
            currentWeek.getTime() - investmentDate.getTime(),
            currentDate.getTime() - investmentDate.getTime()
          );
          const daysActive = Math.ceil(timeDiff / (1000 * 3600 * 24));
          // ✅ CORRIGÉ - Appliquer le multiplicateur NFT
          const dailyReturnWithBonus = item.investment.dailyReturn * item.nftMultiplier;
          
          return sum + item.investment.amount + (dailyReturnWithBonus * daysActive);
        }
        return sum;
      }, 0);
      
      values.push(parseFloat(totalValue.toFixed(2)));
      currentWeek = addDays(currentWeek, 7);
    }
    
    setChartData({ labels, values });
  }, [calculatedInvestments]);
  
  // ✅ CORRIGÉ - Calculer les rendements totaux avec bonus NFT
  useEffect(() => {
    const fetchTotalReturns = async () => {
      try {
        const totalBase = await getTotalReturns();
        // ✅ CORRIGÉ - Appliquer le multiplicateur NFT
        const totalWithBonus = (totalBase || 0) * multiplier;
        setTotalReturnsValue(totalWithBonus);
      } catch (error) {
        console.error('Erreur lors du calcul des récompenses totaux:', error);
        setTotalReturnsValue(0);
      }
    };
    
    if (getTotalReturns && multiplier) {
      fetchTotalReturns();
    }
  }, [getTotalReturns, multiplier]); // ✅ AJOUTÉ multiplier dans les dépendances
  
  // ✅ CORRIGÉ - Traiter les investissements et calculer les rendements avec bonus NFT
  useEffect(() => {
    const calculateAllReturns = async () => {
      // ✅ CORRECTION: Vérifier que les données sont disponibles
      if (!safeActiveInvestments.length || !safePlans.length || !multiplier) {
        setCalculatedInvestments([]);
        return;
      }
      
      try {
        const processed = await Promise.all(safeActiveInvestments.map(async (investment) => {
          const plan = safePlans.find(p => p.id === investment.planId);
          if (!plan) {
            console.error(`Plan non trouvé pour les récompenses ${investment.id}`);
            return null;
          }
          
          const stakeId = parseInt(investment.id);
          const baseReturns = await calculateReturns(stakeId);
          // ✅ CORRIGÉ - Appliquer le multiplicateur NFT aux rendements
          const returnsWithBonus = baseReturns * multiplier;
          
          return { 
            investment, 
            plan, 
            returns: returnsWithBonus,
            baseReturns: baseReturns,
            nftMultiplier: multiplier // ✅ AJOUTÉ
          };
        }));
        
        setCalculatedInvestments(processed.filter(Boolean));
      } catch (error) {
        console.error('Erreur dans le calcul des récompenses:', error);
        setCalculatedInvestments([]);
      }
    };
    
    if (calculateReturns && multiplier) {
      calculateAllReturns();
    }
  }, [safeActiveInvestments, safePlans, calculateReturns, multiplier]); // ✅ AJOUTÉ multiplier
  
  // Gérer le retrait des rendements
  const handleWithdraw = async (investmentId) => {
    setWithdrawingId(investmentId);
    try {
      await withdrawReturns(investmentId);
      await handleRefresh();
    } catch (error) {
      console.error('Erreur de retrait:', error);
    } finally {
      setWithdrawingId(null);
    }
  };
  
  // Gérer le retrait du capital
  const handleWithdrawCapital = async (investmentId) => {
    setWithdrawingCapitalId(investmentId);
    try {
      await withdrawCapital(investmentId);
      await handleRefresh();
    } catch (error) {
      console.error('Erreur de retrait du capital:', error);
    } finally {
      setWithdrawingCapitalId(null);
    }
  };
  
  // ✅ CORRIGÉ - Gérer le rafraîchissement avec bonus NFT
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Rafraîchir uniquement les données d'investissement
      if (getTotalReturns && multiplier) {
        const totalBase = await getTotalReturns();
        const totalWithBonus = (totalBase || 0) * multiplier;
        setTotalReturnsValue(totalWithBonus);
      }
      
      // Recalculer tous les rendements avec bonus NFT
      if (safeActiveInvestments.length && safePlans.length && calculateReturns && multiplier) {
        const processed = await Promise.all(safeActiveInvestments.map(async (investment) => {
          const plan = safePlans.find(p => p.id === investment.planId);
          if (!plan) return null;
          
          const stakeId = parseInt(investment.id);
          const baseReturns = await calculateReturns(stakeId);
          const returnsWithBonus = baseReturns * multiplier;
          
          return { 
            investment, 
            plan, 
            returns: returnsWithBonus,
            baseReturns: baseReturns,
            nftMultiplier: multiplier
          };
        }));
        
        setCalculatedInvestments(processed.filter(Boolean));
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // ✅ CORRECTION: Vérification sécurisée des investissements
  const hasInvestments = safeActiveInvestments.length > 0;
  
  // ✅ CORRECTION: Calcul sécurisé des totaux
  const totalInvested = getTotalInvested ? getTotalInvested() : 0;

  // ✅ CORRECTION: Affichage d'un écran de chargement si les données ne sont pas prêtes
  if (isLoading || nftLoading) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-1">Chargement du tableau de bord V2...</span>
          </div>
        </div>
      </div>
    );
  }

  // ✅ CORRECTION: Affichage d'une erreur si les données n'ont pas pu être chargées
  if (error || nftError) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-red-800 font-medium text-lg mb-2">Erreur de chargement</h3>
            <p className="text-red-600 mb-4">
              {error?.message || nftError || 'Impossible de charger les données du tableau de bord'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-1">Tableau de Bord V2</h1>
            <p className="text-slate-400">
              Suivez vos récompenses
              {/* ✅ AJOUTÉ - Affichage du bonus NFT actif */}
              {hasNFT && multiplier > 1 && (
                <span className="ml-2 text-green-400 font-medium">
                  • Bonus NFT: +{((multiplier - 1) * 100).toFixed(0)}% actif
                </span>
              )}
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
              disabled={refreshing}
              className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title="Rafraîchir les données de récompenses"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/*Bouton accès Historique transactions users*/}
        <button
          onClick={() => navigate('/historyV2')}
          className="flex items-center px-5 py-2 bg-transparent border-2 border-white-500 text-white-500 hover:bg-purple-600 hover:text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 mb-4"
          title="Accéder à l'historique des transactions"
        >
          <History size={18} className="mr-3" />
          <span className="text-white">Historique Transaction</span>
        </button>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            title="Solde USDT" 
            value={`${safeBalance.usdt.toFixed(2)} USDT`}
            icon={<DollarSign size={22} />}
            className={safeBalance.usdt === 0 ? 'border-yellow-500' : ''}
          />
          <StatsCard 
            title="Solde USDC" 
            value={`${safeBalance.usdc.toFixed(2)} USDC`}
            icon={<DollarSign size={22} />}
            className={safeBalance.usdc === 0 ? 'border-yellow-500' : ''}
          />
          <StatsCard 
            title="Total Déposé" 
            value={`${totalInvested.toFixed(2)} USDT/USDC`}
            icon={<BarChart3 size={22} />}
            change={{ value: '15.3%', positive: true }}
          />
          <StatsCard 
            title={`Récompenses Totaux${hasNFT && multiplier > 1 ? ' (avec bonus NFT)' : ''}`}
            value={`${totalReturnsValue.toFixed(2)} USDT/USDC`}
            icon={<ArrowUpRight size={22} />}
            change={{ value: '8.2%', positive: true }}
          />
        </div>

        {/* Message d'information si soldes à 0 ou mauvais réseau */}
        {address && (
          <>
            {chainId && chainId !== 56 && (
              <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="bg-red-600/20 rounded-full p-2 mr-3">
                    <RefreshCw size={16} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-red-400 font-medium">Réseau incorrect détecté</h3>
                    <p className="text-red-300 text-sm mt-1">
                      Vous êtes connecté au réseau {chainId}. Les tokens USDC/USDT sont configurés pour BSC Mainnet (56). 
                      Veuillez changer de réseau dans MetaMask.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {chainId === 56 && safeBalance.usdt === 0 && safeBalance.usdc === 0 && (
              <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="bg-yellow-600/20 rounded-full p-2 mr-3">
                    <RefreshCw size={16} className="text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-yellow-400 font-medium">Soldes USDC/USDT non détectés</h3>
                    <p className="text-yellow-300 text-sm mt-1">
                      Vous êtes sur BSC Mainnet mais aucun solde USDC/USDT n'est détecté. 
                      Vérifiez que vous possédez ces tokens sur BSC. Les soldes se chargent automatiquement.
                      Consultez la console pour plus de détails.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Investissements actifs */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Récompenses Actifs V2</h2>
                {hasInvestments && (
                  <span className="bg-blue-600 rounded-full px-3 py-1 text-xs font-semibold text-white">
                    {safeActiveInvestments.length} Actif{safeActiveInvestments.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {!hasInvestments ? (
                <div className="text-center py-12">
                  <Clock size={48} className="text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Aucun plan de récompense Actif</h3>
                  <p className="text-slate-400 mb-6">
                    Vous n'avez pas encore de plan de récompense actifs. Commencez à choisir un plan de récompense pour voir votre portefeuille ici.
                  </p>
                  <Link 
                    to="/nft-collection"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 px-6 rounded-lg font-medium transition-all duration-200 inline-block"
                  >
                    Commencer à otenir des récompenses
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ✅ CORRIGÉ - Utiliser la bonne structure avec nftMultiplier */}
                  {calculatedInvestments.map(({ investment, plan, returns, nftMultiplier }) => (
                    <InvestmentCardV2
                      key={investment.id}
                      investment={investment}
                      plan={plan}
                      calculatedReturns={returns} // ✅ CORRIGÉ - Returns avec bonus NFT
                      onWithdraw={handleWithdraw}
                      onWithdrawCapital={handleWithdrawCapital}
                      isWithdrawing={withdrawingId === investment.id}
                      isWithdrawingCapital={withdrawingCapitalId === investment.id}
                      nftMultiplier={nftMultiplier} // ✅ CORRIGÉ - Passer le multiplicateur NFT
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
              <h2 className="text-xl font-semibold text-white mb-6">
                Résumé des Récompenses
                {/* ✅ AJOUTÉ - Indication du bonus NFT */}
                {hasNFT && multiplier > 1 && (
                  <span className="ml-2 text-green-400 text-sm">
                    (avec bonus NFT +{((multiplier - 1) * 100).toFixed(0)}%)
                  </span>
                )}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Total Dépôts</span>
                    <span className="text-white">{totalInvested.toFixed(2)} USDT/USDC</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: totalInvested > 0 ? '100%' : '0%' }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">
                      Récompenses Actuels
                      {hasNFT && multiplier > 1 && (
                        <span className="text-green-400 ml-1">(+{((multiplier - 1) * 100).toFixed(0)}%)</span>
                      )}
                    </span>
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
              <h2 className="text-xl font-semibold text-white mb-4">Distribution des Récompenses</h2>
              
              {!hasInvestments ? (
                <div className="text-center py-6">
                  <p className="text-slate-400">
                    Aucune donnée des récompenses à afficher
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {safePlans.map(plan => {
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
                  {safeActiveInvestments.slice(0, 3).map((investment) => (
                    <div key={investment.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                      <div className="flex items-center">
                        <div className="bg-blue-600/20 rounded-full p-2 mr-3">
                          <Wallet size={16} className="text-blue-400" />
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">
                            Dépôt dans le Plan {safePlans.find(p => p.id === investment.planId)?.name || 'Inconnu'}
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

export default DashboardV2;