import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  RefreshCw, 
  Download,
  Filter
} from 'lucide-react';
import { ethers } from 'ethers';
import { useInvestment } from '../contexts/InvestmentContext';
import { useContracts } from '../hooks/useContracts';
import StatsCard from '../components/dashboard/StatsCard';
import InvestmentTable from '../components/admin/InvestmentTable';

const AdminDashboard = () => {
  const { activeInvestments, plans, loading, refreshInvestments } = useInvestment();
  const { stakingContract } = useContracts();
  const [refreshing, setRefreshing] = useState(false);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalInvested: 0,
    totalFees: 0,
    platformProfit: 0,
    recentActivity: []
  });
  
  const loadPlatformStats = async () => {
    if (!stakingContract) return;
  
    try {
      const [userCount, totalInvested, totalFees, platformProfit] = await Promise.all([
        stakingContract.getUserCount(),
        stakingContract.getTotalInvested(),
        stakingContract.getTotalFees(),
        stakingContract.getPlatformProfit()
      ]);

      setAdminStats(prev => ({
        ...prev,
        totalUsers: Number(userCount),
        totalInvested: Number(ethers.formatUnits(totalInvested, 18)),
        totalFees: Number(ethers.formatUnits(totalFees, 18)),
        platformProfit: Number(ethers.formatUnits(platformProfit, 18))
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const loadRecentActivity = async () => {
    if (!stakingContract) return;

    try {
      const filter = stakingContract.filters.Staked();
      const events = await stakingContract.queryFilter(filter);

      if (!events.length) return;

      const formattedEvents = await Promise.all(
        events.map(async (event) => {
          const block = await event.getBlock();
          return {
            id: event.transactionHash,
            address: event.args[0], // Premier argument de l'événement Staked
            planId: Number(event.args[1]), // Deuxième argument
            amount: Number(ethers.formatUnits(event.args[2], 6)), // Troisième argument
            date: new Date(block.timestamp * 1000).toLocaleDateString('fr-FR')
          };
        })
      );

      setAdminStats(prev => ({
        ...prev,
        recentActivity: formattedEvents.slice(0, 10)
      }));
    } catch (error) {
      console.error('Erreur lors du chargement de l\'activité récente:', error);
    }
  };

  useEffect(() => {
    if (stakingContract) {
      loadPlatformStats();
      loadRecentActivity();
    }
  }, [stakingContract]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadPlatformStats(),
        loadRecentActivity(),
        refreshInvestments()
      ]);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleExport = async () => {
    try {
      const exportData = {
        stats: adminStats,
        investments: activeInvestments.map(inv => ({
          ...inv,
          startDate: new Date(inv.startDate).toLocaleDateString('fr-FR'),
          endDate: new Date(inv.endDate).toLocaleDateString('fr-FR')
        }))
      };

      const csvContent = `data:text/csv;charset=utf-8,${
        Object.keys(exportData.stats).join(',')}\n${
        Object.values(exportData.stats).join(',')}\n\n${
        Object.keys(exportData.investments[0] || {}).join(',')}\n${
        exportData.investments.map(row => Object.values(row).join(',')).join('\n')}
      `;

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `cryptovault_admin_export_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des données');
    }
  };

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Tableau de Bord Admin</h1>
            <p className="text-slate-400">
              Gestion et analyses de la plateforme
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={handleRefresh}
              className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 transition-colors py-2 px-4 rounded-lg text-slate-300"
            >
              <Download size={16} />
              <span>Exporter</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            title="Total Utilisateurs" 
            value={adminStats.totalUsers.toString()}
            icon={<Users size={22} />}
            change={{ value: '+12%', positive: true }}
          />
          <StatsCard 
            title="Total Investi (USDT/USDC)" 
            value={`$${adminStats.totalInvested.toLocaleString()}`}
            icon={<DollarSign size={22} />}
            change={{ value: '+8.3%', positive: true }}
          />
          <StatsCard 
            title="Frais de Plateforme" 
            value={`$${adminStats.totalFees.toLocaleString()}`}
            icon={<TrendingUp size={22} />}
            change={{ value: '+5.7%', positive: true }}
          />
          <StatsCard 
            title="Bénéfice Plateforme" 
            value={`$${adminStats.platformProfit.toLocaleString()}`}
            icon={<PieChart size={22} />}
            change={{ value: '+10.2%', positive: true }}
          />
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Distribution des Investissements par Plan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => {
              const planInvestments = activeInvestments.filter(inv => inv.planId === plan.id);
              const planTotal = planInvestments.reduce((sum, inv) => sum + inv.amount, 0);
              const planCount = planInvestments.length;
              
              return (
                <div key={plan.id} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-medium">Plan {plan.name}</h3>
                    <div className="bg-blue-600 rounded-full px-3 py-1 text-xs font-semibold text-white">
                      {plan.apr}% APR
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Total Investi</p>
                      <p className="text-lg font-bold text-white">${planTotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Investissements Actifs</p>
                      <p className="text-lg font-bold text-white">{planCount}</p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full ${
                        plan.id === 1 
                          ? 'bg-blue-500' 
                          : plan.id === 2 
                            ? 'bg-indigo-500' 
                            : 'bg-violet-500'
                      }`}
                      style={{ 
                        width: `${
                          activeInvestments.length > 0 
                            ? (planCount / activeInvestments.length) * 100 
                            : 0
                        }%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400 text-right">
                    {activeInvestments.length > 0 
                      ? `${((planCount / activeInvestments.length) * 100).toFixed(1)}% des investissements totaux` 
                      : '0% des investissements totaux'
                    }
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative">
            <select className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les Plans</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>Plan {plan.name}</option>
              ))}
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          
          <div className="relative">
            <select className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les Tokens</option>
              <option value="USDT">USDT</option>
              <option value="USDC">USDC</option>
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          
          <div className="relative">
            <select className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les Statuts</option>
              <option value="active">Actif</option>
              <option value="ended">Terminé</option>
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          
          <div className="relative ml-auto">
            <select className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="newest">Plus Récent</option>
              <option value="oldest">Plus Ancien</option>
              <option value="highest">Montant le Plus Élevé</option>
              <option value="lowest">Montant le Plus Bas</option>
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        
        <InvestmentTable 
          investments={activeInvestments}
          loading={loading || refreshing}
          onRefresh={handleRefresh}
        />
        
        <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6">Activité Récente de la Plateforme</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-slate-700">
                  <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-4">Utilisateur</th>
                  <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-4">Action</th>
                  <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-4">Montant</th>
                  <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {adminStats.recentActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-750">
                    <td className="py-3 px-4 text-sm text-white">
                      {activity.address}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.action === 'Investissement Staking' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {activity.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-white">
                      ${activity.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {activity.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;