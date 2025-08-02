//src/pages/DashboardV2.tsx
import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight,
  DollarSign, 
  BarChart3, 
  Clock, 
  RefreshCw,
  History,
  Star
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useInvestmentV2 } from '../contexts/InvestmentContextV2';
import { useNFTAccess } from '../hooks/useNFTAccess';
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
    error,
    calculateDailyReturns,
    getDetailedStakeInfo,
  } = useInvestmentV2();
  
  const { 
    hasNFT, 
    multiplier, 
    loading: nftLoading,
    error: nftError
  } = useNFTAccess();
  
  const navigate = useNavigate();
  
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawingCapitalId, setWithdrawingCapitalId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [totalReturnsValue, setTotalReturnsValue] = useState(0);
  const [calculatedInvestments, setCalculatedInvestments] = useState<any[]>([]);
  
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    values: [] as number[]
  });

  const safeActiveInvestments = activeInvestments || [];
  const safePlans = plans || [];
  const safeBalance = balance || { usdt: 0, usdc: 0 };

  const formatWeekLabel = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // Debug de l'affichage
  console.log("🔍 === DEBUG AFFICHAGE DASHBOARD ===");
  console.log("📊 safeActiveInvestments.length:", safeActiveInvestments.length);
  console.log("📊 calculatedInvestments.length:", calculatedInvestments.length);
  console.log("📊 hasInvestments:", safeActiveInvestments.length > 0);

  console.log("📋 safeActiveInvestments détail:", safeActiveInvestments.map(inv => ({
    id: inv.id,
    planId: inv.planId,
    amount: inv.amount,
    active: inv.active,
    dailyReturn: inv.dailyReturn
  })));

  console.log("📋 calculatedInvestments détail:", calculatedInvestments.map(item => ({
    investmentId: item.investment?.id,
    planId: item.investment?.planId,
    planName: item.plan?.name,
    returns: item.returns,
    hasData: !!item.investment && !!item.plan
  })));

  // Générer des données de graphique
  useEffect(() => {
    if (calculatedInvestments.length === 0) {
      setChartData({
        labels: ['Aucune donnée'],
        values: [0]
      });
      return;
    }

    const sortedInvestments = [...calculatedInvestments].sort((a, b) => 
      new Date(a.investment.startDate).getTime() - new Date(b.investment.startDate).getTime()
    );

    const firstInvestmentDate = new Date(sortedInvestments[0].investment.startDate);
    const currentDate = new Date();
    
    const labels: string[] = [];
    const values: number[] = [];
    
    let currentWeek = new Date(firstInvestmentDate);
    
    while (currentWeek <= currentDate) {
      const weekLabel = formatWeekLabel(currentWeek);
      labels.push(weekLabel);
      
      const totalValue = sortedInvestments.reduce((sum, item) => {
        const investmentDate = new Date(item.investment.startDate);
        
        if (investmentDate <= currentWeek) {
          const timeDiff = Math.min(
            currentWeek.getTime() - investmentDate.getTime(),
            currentDate.getTime() - investmentDate.getTime()
          );
          const daysActive = Math.ceil(timeDiff / (1000 * 3600 * 24));
          const dailyReturnWithNFT = item.investment.dailyReturn;
          
          return sum + item.investment.amount + (dailyReturnWithNFT * daysActive);
        }
        return sum;
      }, 0);
      
      values.push(parseFloat(totalValue.toFixed(2)));
      currentWeek = addDays(currentWeek, 7);
    }
    
    setChartData({ labels, values });
  }, [calculatedInvestments]);
  
  // Calculer les rendements totaux
  useEffect(() => {
    const fetchTotalReturns = async () => {
      if (!getTotalReturns) return;
      
      try {
        const totalWithNFT = await getTotalReturns();
        setTotalReturnsValue(totalWithNFT || 0);
      } catch (error) {
        console.error('Erreur lors du calcul des récompenses totaux:', error);
        setTotalReturnsValue(0);
      }
    };
    
    fetchTotalReturns();
  }, [getTotalReturns, safeActiveInvestments]);
  
  // Traiter les investissements avec gestion d'erreurs robuste
  useEffect(() => {
    const calculateAllReturns = async () => {
      console.log("🔍 === DÉBUT CALCUL calculatedInvestments ===");
      console.log("📊 safeActiveInvestments.length:", safeActiveInvestments.length);
      console.log("📊 safePlans.length:", safePlans.length);
      
      if (!safeActiveInvestments.length || !safePlans.length) {
        console.log("⚠️ Pas d'investissements ou de plans, reset calculatedInvestments");
        setCalculatedInvestments([]);
        return;
      }
      
      try {
        const processed = [];
        
        for (let i = 0; i < safeActiveInvestments.length; i++) {
          const investment = safeActiveInvestments[i];
          console.log(`\n🔍 === TRAITEMENT INVESTMENT ${i} (ID: ${investment.id}) ===`);
          
          try {
            // 1. Trouver le plan
            const plan = safePlans.find(p => p.id === investment.planId);
            if (!plan) {
              console.error(`❌ Plan non trouvé pour l'investissement ${investment.id} (planId: ${investment.planId})`);
              console.log("📋 Plans disponibles:", safePlans.map(p => ({ id: p.id, name: p.name })));
              
              // Créer un plan fallback
              const fallbackPlan = {
                id: investment.planId,
                name: `Plan ${investment.planId}`,
                apr: 15,
                duration: 30,
                minAmount: 150,
                active: true,
                description: `Plan de secours pour ID ${investment.planId}`
              };
              
              processed.push({
                investment,
                plan: fallbackPlan,
                returns: 0,
                nftMultiplier: investment.nftMultiplierAtStake || 1,
                detailedInfo: null,
                hasError: true,
                errorMessage: "Plan non trouvé"
              });
              
              console.log(`🔄 Plan fallback créé pour investment ${investment.id}`);
              continue;
            }
            
            console.log(`✅ Plan trouvé: ${plan.name} (APR: ${plan.apr}%)`);
            
            // 2. Calculer les récompenses
            const stakeId = parseInt(investment.id);
            let totalRewards = 0;
            
            if (!isNaN(stakeId) && calculateReturns) {
              try {
                totalRewards = await calculateReturns(stakeId);
                console.log(`💰 Récompenses calculées: ${totalRewards.toFixed(8)}`);
              } catch (rewardsError) {
                console.error(`❌ Erreur calcul récompenses pour investment ${investment.id}:`, rewardsError);
                totalRewards = 0;
              }
            } else {
              console.warn(`⚠️ StakeId invalide ou calculateReturns manquant pour investment ${investment.id}`);
            }
            
            // 3. Obtenir les détails si possible
            let detailedInfo = null;
            if (!isNaN(stakeId) && getDetailedStakeInfo) {
              try {
                detailedInfo = await getDetailedStakeInfo(stakeId);
                console.log(`📊 Détails obtenus pour investment ${investment.id}`);
              } catch (detailError) {
                console.warn(`⚠️ Impossible d'obtenir les détails pour investment ${investment.id}:`, detailError);
              }
            }
            
            // 4. Créer l'objet final
            const processedItem = {
              investment: {
                ...investment,
                dailyReturn: investment.dailyReturn || 0,
                nftMultiplierAtStake: investment.nftMultiplierAtStake || 1
              },
              plan,
              returns: totalRewards,
              nftMultiplier: investment.nftMultiplierAtStake || 1,
              detailedInfo,
              hasError: false,
              errorMessage: null
            };
            
            processed.push(processedItem);
            
            console.log(`✅ Investment ${investment.id} traité avec succès:`, {
              planName: plan.name,
              returns: totalRewards.toFixed(8),
              nftMultiplier: (investment.nftMultiplierAtStake || 1) + 'x',
              dailyReturn: (investment.dailyReturn || 0).toFixed(8)
            });
            
          } catch (investmentError) {
            console.error(`❌ Erreur complète pour investment ${investment.id}:`, investmentError);
            
            processed.push({
              investment,
              plan: {
                id: investment.planId,
                name: `Plan ${investment.planId} (Erreur)`,
                apr: 15,
                duration: 30,
                minAmount: 150,
                active: true,
                description: `Plan en erreur pour ID ${investment.planId}`
              },
              returns: 0,
              nftMultiplier: investment.nftMultiplierAtStake || 1,
              detailedInfo: null,
              hasError: true,
              errorMessage: investmentError.message || "Erreur inconnue"
            });
          }
        }
        
        console.log(`\n🎯 RÉSULTAT FINAL calculatedInvestments:`);
        console.log(`📊 Nombre d'investissements traités: ${processed.length}`);
        console.log(`📊 Nombre d'investissements avec erreur: ${processed.filter(p => p.hasError).length}`);
        
        processed.forEach((item, index) => {
          console.log(`📋 Item ${index}:`, {
            investmentId: item.investment.id,
            planName: item.plan.name,
            hasError: item.hasError,
            returns: item.returns.toFixed(8),
            dailyReturn: item.investment.dailyReturn.toFixed(8)
          });
        });
        
        setCalculatedInvestments(processed);
        
      } catch (error) {
        console.error('❌ Erreur générale dans calculateAllReturns:', error);
        
        const fallbackProcessed = safeActiveInvestments.map(investment => ({
          investment,
          plan: {
            id: investment.planId,
            name: `Plan ${investment.planId}`,
            apr: 15,
            duration: 30,
            minAmount: 150,
            active: true,
            description: `Plan de secours pour ID ${investment.planId}`
          },
          returns: 0,
          nftMultiplier: investment.nftMultiplierAtStake || 1,
          detailedInfo: null,
          hasError: true,
          errorMessage: "Erreur générale de calcul"
        }));
        
        setCalculatedInvestments(fallbackProcessed);
      }
      
      console.log("🔍 === FIN CALCUL calculatedInvestments ===\n");
    };
    
    calculateAllReturns();
  }, [safeActiveInvestments, safePlans, calculateReturns, getDetailedStakeInfo]);
  
  const handleWithdraw = async (investmentId: string) => {
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
  
  const handleWithdrawCapital = async (investmentId: string) => {
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
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (getTotalReturns) {
        const totalWithNFT = await getTotalReturns();
        setTotalReturnsValue(totalWithNFT || 0);
      }
      
      console.log("🔄 Rafraîchissement des données terminé");
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const hasInvestments = safeActiveInvestments.length > 0;
  const totalInvested = getTotalInvested ? getTotalInvested() : 0;

  const totalDailyReturns = calculatedInvestments.reduce((sum, item) => {
    return sum + (item.investment.dailyReturn || 0);
  }, 0);

  const currentROI = totalInvested > 0 ? ((totalReturnsValue / totalInvested) * 100) : 0;

  const nftStakesCount = calculatedInvestments.filter(item => 
    (item.investment.nftMultiplierAtStake || 1) > 1
  ).length;
  
  const totalNFTBonus = calculatedInvestments.reduce((sum, item) => {
    const multiplier = item.investment.nftMultiplierAtStake || 1;
    if (multiplier > 1) {
      const baseDailyReturn = item.investment.dailyReturn / multiplier;
      const bonusDailyReturn = item.investment.dailyReturn - baseDailyReturn;
      return sum + bonusDailyReturn;
    }
    return sum;
  }, 0);

  if (isLoading || nftLoading) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            <span className="ml-4 text-white text-lg">Chargement du tableau de bord V2...</span>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-white mb-1">Tableau de Bord V2</h1>
            <p className="text-slate-400">
              Suivez vos récompenses
              {hasNFT && multiplier > 1 && (
                <span className="ml-2 text-green-400 font-medium">
                  • Bonus NFT: +{((multiplier - 1) * 100).toFixed(0)}% actif
                </span>
              )}
              {nftStakesCount > 0 && (
                <span className="ml-2 text-yellow-400 font-medium">
                  • {nftStakesCount} plan{nftStakesCount > 1 ? 's' : ''} avec bonus NFT
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
            title={
              <div className="flex items-center gap-1">
                <span>Récompenses Totaux</span>
                {nftStakesCount > 0 && <Star size={16} className="text-yellow-400" />}
              </div>
            }
            value={
              <div>
                <div>{totalReturnsValue.toFixed(4)} USDT/USDC</div>
                {totalNFTBonus > 0 && (
                  <div className="text-xs text-green-400 mt-1">
                    +{totalNFTBonus.toFixed(4)} bonus NFT/jour
                  </div>
                )}
              </div>
            }
            icon={<ArrowUpRight size={22} />}
            change={{ value: '8.2%', positive: true }}
          />
        </div>

        {/* Messages d'information */}
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
                      Vérifiez que vous possédez ces tokens sur BSC.
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
                <h2 className="text-xl font-semibold text-white">
                  Récompenses Actifs V2
                  {nftStakesCount > 0 && (
                    <span className="ml-2 text-sm text-green-400">
                      ({nftStakesCount} avec bonus NFT)
                    </span>
                  )}
                </h2>
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
                    Commencer à obtenir des récompenses
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Affichage robuste des cartes avec gestion d'erreurs */}
                  {calculatedInvestments.length > 0 ? (
                    calculatedInvestments.map((item, index) => {
                      // Vérification de sécurité
                      if (!item || !item.investment || !item.plan) {
                        console.error(`❌ Item ${index} invalide:`, item);
                        return (
                          <div key={`error-${index}`} className="bg-red-900/20 border border-red-600/40 rounded-lg p-4">
                            <h3 className="text-red-400 font-medium">Erreur d'affichage</h3>
                            <p className="text-red-300 text-sm">
                              Impossible d'afficher l'investissement {index + 1}
                            </p>
                          </div>
                        );
                      }
                      
                      const { investment, plan, returns, nftMultiplier, hasError, errorMessage } = item;
                      
                      // Vérification supplémentaire
                      if (!investment.id) {
                        console.error(`❌ Investment sans ID à l'index ${index}:`, investment);
                        return null;
                      }
                      
                      console.log(`🎨 Rendu carte ${index} pour investment ${investment.id}`);
                      
                      return (
                        <div key={investment.id} className="relative">
                          {/* Indicateur d'erreur si nécessaire */}
                          {hasError && (
                            <div className="absolute top-2 right-2 z-10">
                              <div className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
                                ⚠️ {errorMessage || 'Erreur'}
                              </div>
                            </div>
                          )}
                          
                          <InvestmentCardV2
                            investment={investment}
                            plan={plan}
                            calculatedReturns={returns || 0}
                            onWithdraw={handleWithdraw}
                            onWithdrawCapital={handleWithdrawCapital}
                            isWithdrawing={withdrawingId === investment.id}
                            isWithdrawingCapital={withdrawingCapitalId === investment.id}
                            nftMultiplier={investment.nftMultiplierAtStake || 1}
                          />
                        </div>
                      );
                    })
                  ) : (
                    // Fallback - Si calculatedInvestments est vide mais qu'on a des safeActiveInvestments
                    safeActiveInvestments.length > 0 ? (
                      <div className="col-span-2 bg-yellow-900/20 border border-yellow-600/40 rounded-lg p-6 text-center">
                        <h3 className="text-yellow-400 font-medium mb-2">Chargement des données en cours...</h3>
                        <p className="text-yellow-300 text-sm">
                          {safeActiveInvestments.length} investissement{safeActiveInvestments.length > 1 ? 's' : ''} détecté{safeActiveInvestments.length > 1 ? 's' : ''}, 
                          calcul des récompenses en cours...
                        </p>
                        <div className="flex justify-center mt-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                        </div>
                        
                        {/* Debug - Afficher les investissements bruts temporairement */}
                        <div className="mt-4 text-xs text-slate-400">
                          <details>
                            <summary className="cursor-pointer">Voir les détails de debug</summary>
                            <div className="mt-2 text-left">
                              <pre className="bg-slate-800 p-2 rounded text-xs overflow-auto">
                                {JSON.stringify(safeActiveInvestments.map(inv => ({
                                  id: inv.id,
                                  planId: inv.planId,
                                  amount: inv.amount,
                                  active: inv.active
                                })), null, 2)}
                              </pre>
                            </div>
                          </details>
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
            
            <InvestmentChart data={chartData} />
          </div>
          
          {/* Colonne droite - Statistiques */}
          <div className="space-y-8">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-2">
                Résumé des Récompenses
              </h2>
              {nftStakesCount > 0 && (
                <p className="text-green-400 text-sm mb-4 flex items-center gap-1">
                  <Star size={14} />
                  <span>
                    {nftStakesCount} plan{nftStakesCount > 1 ? 's' : ''} avec bonus NFT actif
                  </span>
                </p>
              )}
              
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
                    <span className="text-slate-400 flex items-center gap-1">
                      Récompenses Actuels
                      {nftStakesCount > 0 && <Star size={12} className="text-yellow-400" />}
                    </span>
                    <span className="text-white">{totalReturnsValue.toFixed(4)} USDT/USDC</span>
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
                    <span className="text-slate-400 flex items-center gap-1">
                      Récompenses Quotidiennes
                      {nftStakesCount > 0 && <Star size={12} className="text-yellow-400" />}
                    </span>
                    <div className="text-right">
                      <div className="text-white">{totalDailyReturns.toFixed(6)} USDT/USDC</div>
                      {totalNFTBonus > 0 && (
                        <div className="text-xs text-green-400">
                          +{totalNFTBonus.toFixed(6)} bonus NFT
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: totalDailyReturns > 0 ? '75%' : '0%' }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">ROI Actuel</span>
                    <span className="text-white">
                      {currentROI.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(currentROI, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Distribution des récompenses */}
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
                  {calculatedInvestments.map((item, index) => {
                    const percentage = totalInvested > 0 
                      ? (item.investment.amount / totalInvested) * 100 
                      : 0;
                    
                    const planColors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500'];
                    const colorClass = planColors[item.plan.id % planColors.length] || 'bg-gray-500';
                    
                    const actualMultiplier = item.investment.nftMultiplierAtStake || 1;
                    const hasNFTBonus = actualMultiplier > 1;
                    
                    return (
                      <div key={`${item.plan.id}-${index}`}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white flex items-center gap-1">
                            <span>Plan {item.plan.name} ({item.plan.apr}% APR)</span>
                            {hasNFTBonus && (
                              <>
                                <Star size={12} className="text-yellow-400" />
                                <span className="text-green-400">
                                  +{((actualMultiplier - 1) * 100).toFixed(0)}% NFT
                                </span>
                              </>
                            )}
                          </span>
                          <span className="text-slate-400">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${colorClass} ${hasNFTBonus ? 'shadow-lg shadow-green-500/30' : ''}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-slate-500">
                          <span>{item.investment.amount.toFixed(2)} USDC</span>
                          <span className="flex items-center gap-1">
                            <span>{item.investment.dailyReturn.toFixed(6)} USDC/jour</span>
                            {hasNFTBonus && (
                              <>
                                <Star size={10} className="text-yellow-400" />
                                <span className="text-green-400">
                                  ({actualMultiplier}x)
                                </span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Résumé bonus NFT si applicable */}
            {nftStakesCount > 0 && (
              <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-600/40 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Star className="text-yellow-400" />
                  <span>Bonus NFT Actifs</span>
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Plans avec bonus NFT:</span>
                    <span className="text-green-400 font-medium">{nftStakesCount}/{safeActiveInvestments.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Bonus quotidien total:</span>
                    <span className="text-green-400 font-medium">+{totalNFTBonus.toFixed(6)} USDC/jour</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Bonus mensuel estimé:</span>
                    <span className="text-green-400 font-medium">+{(totalNFTBonus * 30).toFixed(4)} USDC</span>
                  </div>
                  
                  {/* Détail par multiplicateur */}
                  <div className="mt-4 pt-4 border-t border-green-600/30">
                    <div className="text-xs text-slate-400 mb-2">Détail par multiplicateur:</div>
                    {calculatedInvestments
                      .filter(item => (item.investment.nftMultiplierAtStake || 1) > 1)
                      .map((item, index) => {
                        const multiplier = item.investment.nftMultiplierAtStake || 1;
                        const baseDailyReturn = item.investment.dailyReturn / multiplier;
                        const bonusDailyReturn = item.investment.dailyReturn - baseDailyReturn;
                        
                        return (
                          <div key={index} className="flex justify-between text-xs text-slate-300 mb-1">
                            <span>Plan {item.plan.name} (NFT {multiplier}x):</span>
                            <span className="text-green-400">+{bonusDailyReturn.toFixed(6)} USDC/jour</span>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              </div>
            )}
            
            {/* Transactions Récentes */}
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
                  {safeActiveInvestments.slice(0, 3).map((investment) => {
                    const plan = safePlans.find(p => p.id === investment.planId);
                    const hasNFTBonus = (investment.nftMultiplierAtStake || 1) > 1;
                    
                    return (
                      <div key={investment.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                        <div className="flex items-center">
                          <div className={`rounded-full p-2 mr-3 ${
                            hasNFTBonus 
                              ? 'bg-green-600/20' 
                              : 'bg-blue-600/20'
                          }`}>
                            {hasNFTBonus ? (
                              <Star size={16} className="text-green-400" />
                            ) : (
                              <Wallet size={16} className="text-blue-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium flex items-center gap-2">
                              <span>Dépôt dans le Plan {plan?.name || 'Inconnu'}</span>
                              {hasNFTBonus && (
                                <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full">
                                  NFT {investment.nftMultiplierAtStake}x
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-xs">
                              {investment.startDate.toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                        <div className="text-white text-right">
                          <div>{investment.amount.toFixed(2)} {investment.token}</div>
                          {hasNFTBonus && (
                            <div className="text-xs text-green-400">
                              +{((investment.nftMultiplierAtStake - 1) * 100).toFixed(0)}% bonus
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Lien vers l'historique complet */}
                  {safeActiveInvestments.length > 3 && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => navigate('/historyV2')}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                      >
                        Voir tous les {safeActiveInvestments.length} investissements →
                      </button>
                    </div>
                  )}
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