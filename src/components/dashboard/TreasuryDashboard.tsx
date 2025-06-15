// components/admin/TreasuryDashboard.tsx
import React, { useState, useEffect } from 'react';
import treasuryNFTService, { TreasuryInfo, RevenueStats, TreasuryUtils } from '../../services/NFTService';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Shield,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  PieChart,
  BarChart3,
  Clock,
  Loader
} from 'lucide-react';

interface TreasuryDashboardProps {
  isAdmin: boolean;
}

const TreasuryDashboard: React.FC<TreasuryDashboardProps> = ({ isAdmin }) => {
  // États principaux
  const [treasuryInfo, setTreasuryInfo] = useState<TreasuryInfo | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // États pour la validation
  const [treasuryValid, setTreasuryValid] = useState<boolean | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Charger les données au montage
  useEffect(() => {
    loadTreasuryData();
  }, []);

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadTreasuryData();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadTreasuryData = async () => {
    setLoading(true);
    try {
      const [info, stats, validation] = await Promise.all([
        treasuryNFTService.getTreasuryInfo(),
        treasuryNFTService.getRevenueStats(),
        treasuryNFTService.verifyTreasurySetup()
      ]);

      setTreasuryInfo(info);
      setRevenueStats(stats);
      setTreasuryValid(validation.isCorrect);
      setLastUpdate(new Date());
      setError(null);

      console.log('📊 Données treasury chargées:', {
        totalRevenue: stats.totalRevenue,
        treasuryAddress: info.primaryTreasury,
        isValid: validation.isCorrect
      });

    } catch (err: any) {
      console.error('Erreur chargement treasury:', err);
      setError(err.message || 'Erreur lors du chargement des données treasury');
    } finally {
      setLoading(false);
    }
  };

  // Vérification d'accès
  if (!isAdmin) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="text-red-400" size={24} />
          <div>
            <h3 className="text-red-400 font-semibold">Accès Restreint</h3>
            <p className="text-red-300 text-sm">Seuls les administrateurs peuvent accéder au dashboard treasury.</p>
          </div>
        </div>
      </div>
    );
  }

  // Composant de statistique
  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <div className={`bg-gradient-to-br ${color} p-1 rounded-lg`}>
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">{title}</p>
            <p className="text-white text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-slate-300 text-xs mt-1">{subtitle}</p>}
          </div>
          <div className="text-white opacity-80">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );

  // Calculer les statistiques
  const totalRevenue = revenueStats ? parseFloat(revenueStats.totalRevenue) : 0;
  const topTier = revenueStats?.tierRevenues
    .filter(t => parseFloat(t.revenue) > 0)
    .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue))[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Treasury Dashboard</h2>
          <p className="text-slate-400">Monitoring des revenus NFT en temps réel</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Auto-refresh toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-slate-300 text-sm">Auto-refresh</span>
          </label>
          
          {/* Refresh button */}
          <button
            onClick={loadTreasuryData}
            disabled={loading}
            className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Status de validation du treasury */}
      <div className={`border rounded-lg p-4 ${
        treasuryValid === null ? 'bg-slate-800 border-slate-600' :
        treasuryValid ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'
      }`}>
        <div className="flex items-center space-x-3">
          {treasuryValid === null ? (
            <Loader size={20} className="text-slate-400 animate-spin" />
          ) : treasuryValid ? (
            <CheckCircle size={20} className="text-green-400" />
          ) : (
            <AlertCircle size={20} className="text-red-400" />
          )}
          
          <div className="flex-1">
            <h3 className={`font-semibold ${
              treasuryValid === null ? 'text-slate-300' :
              treasuryValid ? 'text-green-400' : 'text-red-400'
            }`}>
              {treasuryValid === null ? 'Vérification...' :
               treasuryValid ? 'Treasury Configuré Correctement' : 'Problème Treasury'}
            </h3>
            
            {treasuryInfo && (
              <div className="mt-2 space-y-1">
                <p className="text-slate-300 text-sm">
                  Adresse primaire: 
                  <span className="font-mono ml-2">{TreasuryUtils.formatTreasuryAddress(treasuryInfo.primaryTreasury)}</span>
                  <a 
                    href={`https://bscscan.com/address/${treasuryInfo.primaryTreasury}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink size={14} className="inline" />
                  </a>
                </p>
                
                <p className="text-slate-300 text-sm">
                  Adresse backup: 
                  <span className="font-mono ml-2">{TreasuryUtils.formatTreasuryAddress(treasuryInfo.backupTreasury)}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Revenus Total"
          value={TreasuryUtils.formatRevenue(treasuryInfo?.totalGenerated || '0')}
          icon={<DollarSign size={24} />}
          color="from-green-500 to-green-700"
          subtitle="Depuis le lancement"
        />
        
        <StatCard
          title="Revenus Smart Contract"
          value={TreasuryUtils.formatRevenue(revenueStats?.totalRevenue || '0')}
          icon={<TrendingUp size={24} />}
          color="from-blue-500 to-blue-700"
          subtitle="Tracking on-chain"
        />
        
        <StatCard
          title="Tiers les Plus Rentables"
          value={topTier ? `Tier ${topTier.tierId}` : 'N/A'}
          icon={<PieChart size={24} />}
          color="from-purple-500 to-purple-700"
          subtitle={topTier ? TreasuryUtils.formatRevenue(topTier.revenue) : 'Aucune vente'}
        />
        
        <StatCard
          title="Dernière Mise à Jour"
          value={lastUpdate ? lastUpdate.toLocaleTimeString() : 'Jamais'}
          icon={<Clock size={24} />}
          color="from-orange-500 to-orange-700"
          subtitle={autoRefresh ? 'Auto-refresh activé' : 'Manuel'}
        />
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="text-red-400" size={20} />
            <div>
              <h4 className="text-red-400 font-medium">Erreur</h4>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Revenus par tier */}
      {revenueStats && revenueStats.tierRevenues.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="text-blue-400" size={20} />
            <h3 className="text-xl font-bold text-white">Revenus par Tier NFT</h3>
          </div>
          
          <div className="space-y-3">
            {revenueStats.tierRevenues
              .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue))
              .map((tier) => {
                const percentage = totalRevenue > 0 ? (parseFloat(tier.revenue) / totalRevenue) * 100 : 0;
                
                return (
                  <div key={tier.tierId} className="flex items-center space-x-4">
                    <div className="w-16 text-slate-300 text-sm">
                      Tier {tier.tierId}
                    </div>
                    
                    <div className="flex-1 bg-slate-700 rounded-full h-6 relative">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-6 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-24 text-right text-white font-medium">
                      {TreasuryUtils.formatRevenue(tier.revenue)}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Informations de configuration */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="text-green-400" size={20} />
          <h3 className="text-xl font-bold text-white">Configuration Treasury</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-slate-300 font-medium mb-2">Adresses Configurées</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Primaire:</span>
                <span className="text-white font-mono">{TreasuryUtils.getTreasuryAddress()}</span>
              </div>
              {treasuryInfo && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Backup:</span>
                  <span className="text-white font-mono">{TreasuryUtils.formatTreasuryAddress(treasuryInfo.backupTreasury)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-slate-300 font-medium mb-2">Flux de Paiement</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <p>1. Utilisateur approuve USDC</p>
              <p>2. Achat NFT via smart contract</p>
              <p>3. USDC transféré automatiquement vers treasury</p>
              <p>4. NFT minté vers wallet utilisateur</p>
              <p>5. Revenus trackés on-chain</p>
            </div>
          </div>
        </div>

        {/* Liens utiles */}
        <div className="mt-6 pt-4 border-t border-slate-600">
          <h4 className="text-slate-300 font-medium mb-3">Liens Utiles</h4>
          <div className="flex flex-wrap gap-4">
            <a
              href={`https://bscscan.com/address/${TreasuryUtils.getTreasuryAddress()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <ExternalLink size={14} />
              <span>Voir Treasury sur BSCscan</span>
            </a>
            
            <a
              href={`https://bscscan.com/token/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d?a=${TreasuryUtils.getTreasuryAddress()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <ExternalLink size={14} />
              <span>Balance USDC Treasury</span>
            </a>
          </div>
        </div>
      </div>

      {/* Actions d'administration (si nécessaire) */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="text-orange-400" size={20} />
          <h3 className="text-xl font-bold text-white">Actions d'Administration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              window.open(`https://bscscan.com/address/${TreasuryUtils.getTreasuryAddress()}`, '_blank');
            }}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
          >
            <Wallet size={18} />
            <span>Voir Treasury</span>
          </button>
          
          <button
            onClick={loadTreasuryData}
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span>Actualiser Données</span>
          </button>
          
          <button
            onClick={() => {
              // Logique pour exporter les données (CSV, JSON, etc.)
              exportTreasuryData();
            }}
            className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition-colors"
          >
            <BarChart3 size={18} />
            <span>Exporter Données</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Fonction d'export des données
  function exportTreasuryData() {
    if (!revenueStats || !treasuryInfo) return;

    const data = {
      timestamp: new Date().toISOString(),
      treasury: {
        primaryAddress: treasuryInfo.primaryTreasury,
        backupAddress: treasuryInfo.backupTreasury,
        totalGenerated: treasuryInfo.totalGenerated
      },
      revenue: {
        total: revenueStats.totalRevenue,
        byTier: revenueStats.tierRevenues
      },
      validation: {
        isValid: treasuryValid,
        expectedAddress: TreasuryUtils.getTreasuryAddress()
      }
    };

    // Créer et télécharger le fichier JSON
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `treasury-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export default TreasuryDashboard;

// ========== COMPOSANT DE NOTIFICATION TREASURY ==========

// Composant pour afficher des notifications treasury en temps réel
export const TreasuryNotificationBar: React.FC<{ 
  showOnPurchase?: boolean;
  position?: 'top' | 'bottom';
}> = ({ 
  showOnPurchase = true,
  position = 'bottom'
}) => {
  const [lastRevenue, setLastRevenue] = useState<{
    tier: number;
    amount: string;
    timestamp: Date;
  } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!showOnPurchase) return;

    // Écouter les événements de revenus
    const handleRevenue = (tier: number, amount: string, treasury: string) => {
      setLastRevenue({
        tier,
        amount,
        timestamp: new Date()
      });
      setVisible(true);

      // Masquer après 5 secondes
      setTimeout(() => {
        setVisible(false);
      }, 5000);
    };

    treasuryNFTService.onRevenueGenerated(handleRevenue);

    return () => {
      treasuryNFTService.removeAllListeners();
    };
  }, [showOnPurchase]);

  if (!visible || !lastRevenue) return null;

  return (
    <div className={`fixed left-4 right-4 z-50 ${position === 'top' ? 'top-4' : 'bottom-4'}`}>
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-4 shadow-lg max-w-md mx-auto">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <DollarSign size={20} />
          </div>
          
          <div className="flex-1">
            <h4 className="font-semibold">Nouveau Revenu !</h4>
            <p className="text-sm opacity-90">
              Tier {lastRevenue.tier}: {TreasuryUtils.formatRevenue(lastRevenue.amount)}
            </p>
            <p className="text-xs opacity-75">
              {lastRevenue.timestamp.toLocaleTimeString()}
            </p>
          </div>
          
          <button
            onClick={() => setVisible(false)}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== HOOK POUR MONITORING TREASURY ==========

export const useTreasuryMonitoring = (options: {
  autoRefresh?: boolean;
  refreshInterval?: number;
}) => {
  const [treasuryInfo, setTreasuryInfo] = useState<TreasuryInfo | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [info, stats, validation] = await Promise.all([
        treasuryNFTService.getTreasuryInfo(),
        treasuryNFTService.getRevenueStats(),
        treasuryNFTService.verifyTreasurySetup()
      ]);

      setTreasuryInfo(info);
      setRevenueStats(stats);
      setIsValid(validation.isCorrect);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (!options.autoRefresh) return;

    const interval = setInterval(refreshData, options.refreshInterval || 30000);
    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshInterval]);

  return {
    treasuryInfo,
    revenueStats,
    isValid,
    loading,
    error,
    refreshData
  };
};

// ========== COMPOSANT WIDGET TREASURY COMPACT ==========

export const TreasuryWidget: React.FC<{
  className?: string;
  showDetails?: boolean;
}> = ({ 
  className = '',
  showDetails = false
}) => {
  const { treasuryInfo, revenueStats, isValid, loading } = useTreasuryMonitoring({
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute
  });

  if (loading && !treasuryInfo) {
    return (
      <div className={`bg-slate-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <Loader size={16} className="animate-spin text-slate-400" />
          <span className="text-slate-400 text-sm">Chargement treasury...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Wallet size={16} className="text-green-400" />
          <span className="text-white font-medium text-sm">Treasury</span>
          {isValid !== null && (
            isValid ? (
              <CheckCircle size={14} className="text-green-400" />
            ) : (
              <AlertCircle size={14} className="text-red-400" />
            )
          )}
        </div>
        
        {treasuryInfo && (
          <span className="text-green-400 font-bold">
            {TreasuryUtils.formatRevenue(treasuryInfo.totalGenerated)}
          </span>
        )}
      </div>

      {showDetails && revenueStats && (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Smart Contract:</span>
            <span>{TreasuryUtils.formatRevenue(revenueStats.totalRevenue)}</span>
          </div>
          
          <div className="flex justify-between text-slate-400">
            <span>Adresse:</span>
            <span className="font-mono">
              {TreasuryUtils.formatTreasuryAddress(TreasuryUtils.getTreasuryAddress())}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};