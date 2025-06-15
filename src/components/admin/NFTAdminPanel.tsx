// components/admin/NFTAdminPanel.tsx
import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import extensibleNFTService, { ExtendedTierInfo, CreateTierParams } from '../../services/NFTService';
import {
  Plus,
  Edit,
  Eye,
  Gift,
  Users,
  Crown,
  Settings,
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Loader,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface AdminPanelProps {
  isAdmin: boolean; // À vérifier selon votre système d'auth
}

const NFTAdminPanel: React.FC<AdminPanelProps> = ({ isAdmin }) => {
  const { address, isConnected } = useWallet();
  
  // États pour les tiers
  const [allTiers, setAllTiers] = useState<Record<number, ExtendedTierInfo>>({});
  const [specialTiers, setSpecialTiers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTier, setEditingTier] = useState<number | null>(null);
  
  // États pour les transactions
  const [txHash, setTxHash] = useState<string>('');
  const [txSuccess, setTxSuccess] = useState(false);

  // Charger les données
  useEffect(() => {
    if (isAdmin && isConnected) {
      loadAllData();
    }
  }, [isAdmin, isConnected]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [tiersInfo, specialTierIds] = await Promise.all([
        extensibleNFTService.getAllTiersInfo(),
        extensibleNFTService.getSpecialTiers()
      ]);
      
      setAllTiers(tiersInfo);
      setSpecialTiers(specialTierIds);
      setError(null);
    } catch (err: any) {
      console.error('Erreur chargement données admin:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Vérification d'accès admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Accès Refusé</h1>
          <p className="text-slate-300">Vous n'avez pas les permissions d'administrer les NFT.</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Wallet Non Connecté</h1>
          <p className="text-slate-300">Veuillez connecter votre wallet pour accéder au panel d'administration.</p>
        </div>
      </div>
    );
  }

  // Composant de statistiques
  const StatsCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = 
    ({ title, value, icon, color }) => (
      <div className={`bg-gradient-to-br ${color} p-1 rounded-lg`}>
        <div className="bg-slate-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">{title}</p>
              <p className="text-white text-2xl font-bold">{value}</p>
            </div>
            <div className="text-white opacity-80">
              {icon}
            </div>
          </div>
        </div>
      </div>
    );

  // Calculer les statistiques
  const totalTiers = Object.keys(allTiers).length;
  const totalSpecialTiers = specialTiers.length;
  const totalSupply = Object.values(allTiers).reduce((sum, tier) => sum + tier.supply, 0);
  const totalMinted = Object.values(allTiers).reduce((sum, tier) => sum + tier.minted, 0);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Administration NFT</h1>
            <p className="text-slate-400">Gérez les tiers NFT et créez de nouveaux types</p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Tiers"
            value={totalTiers}
            icon={<Package size={24} />}
            color="from-blue-500 to-blue-700"
          />
          <StatsCard
            title="Tiers Spéciaux"
            value={totalSpecialTiers}
            icon={<Crown size={24} />}
            color="from-purple-500 to-purple-700"
          />
          <StatsCard
            title="Supply Total"
            value={totalSupply.toLocaleString()}
            icon={<TrendingUp size={24} />}
            color="from-green-500 to-green-700"
          />
          <StatsCard
            title="NFT Mintés"
            value={`${totalMinted}/${totalSupply}`}
            icon={<Gift size={24} />}
            color="from-orange-500 to-orange-700"
          />
        </div>

        {/* Boutons d'action */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-lg transition-all"
          >
            <Plus size={20} />
            <span>Créer Nouveau Tier</span>
          </button>
          
          <button
            onClick={() => setShowEventModal(true)}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-4 rounded-lg transition-all"
          >
            <Gift size={20} />
            <span>NFT Événement</span>
          </button>
          
          <button
            onClick={() => setShowPartnerModal(true)}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 rounded-lg transition-all"
          >
            <Users size={20} />
            <span>NFT Partenariat</span>
          </button>
        </div>

        {/* Liste des tiers */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Tiers NFT Existants</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader size={32} className="animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
              <p className="text-red-300">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-600">
                  <tr className="text-left">
                    <th className="pb-3 text-slate-400 font-medium">ID</th>
                    <th className="pb-3 text-slate-400 font-medium">Nom</th>
                    <th className="pb-3 text-slate-400 font-medium">Prix (USDC)</th>
                    <th className="pb-3 text-slate-400 font-medium">Multiplicateur</th>
                    <th className="pb-3 text-slate-400 font-medium">Supply</th>
                    <th className="pb-3 text-slate-400 font-medium">Mintés</th>
                    <th className="pb-3 text-slate-400 font-medium">Statut</th>
                    <th className="pb-3 text-slate-400 font-medium">Actions</th>
                </tr>
                </thead>
                <tbody>
                  {Object.entries(allTiers).map(([tierId, tier]) => (
                    <tr key={tierId} className="border-b border-slate-700">
                      <td className="py-4 text-white font-mono">#{tierId}</td>
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{tier.name}</span>
                          {tier.isSpecial && (
                            <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">
                              Spécial
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-white">
                        {parseFloat(tier.price) === 0 ? 'Gratuit' : `${tier.price} USDC`}
                      </td>
                      <td className="py-4 text-green-400 font-semibold">{tier.multiplierDisplay}</td>
                      <td className="py-4 text-white">{tier.supply.toLocaleString()}</td>
                      <td className="py-4">
                        <span className={`${tier.remaining > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tier.minted}/{tier.supply}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          tier.active 
                            ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
                            : 'bg-red-900/30 text-red-400 border border-red-500/30'
                        }`}>
                          {tier.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingTier(parseInt(tierId));
                              setShowEditModal(true);
                            }}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="Modifier"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => window.open(`/nft-marketplace?tier=${tierId}`, '_blank')}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                            title="Voir sur le marketplace"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de succès de transaction */}
        {txSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Transaction Réussie !</h3>
                <p className="text-slate-300 mb-4">L'opération a été exécutée avec succès.</p>
                
                {txHash && (
                  <div className="mb-4">
                    <a 
                      href={`https://bscscan.com/tx/${txHash}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
                    >
                      <ExternalLink size={16} />
                      <span>Voir la transaction</span>
                    </a>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setTxSuccess(false);
                    setTxHash('');
                    loadAllData(); // Recharger les données
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales (à implémenter séparément) */}
      <CreateTierModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSuccess={(txHash) => {
          setTxHash(txHash);
          setTxSuccess(true);
          setShowCreateModal(false);
        }}
      />
      
      <CreateEventNFTModal 
        isOpen={showEventModal} 
        onClose={() => setShowEventModal(false)}
        onSuccess={(txHash) => {
          setTxHash(txHash);
          setTxSuccess(true);
          setShowEventModal(false);
        }}
      />
      
      <CreatePartnerNFTModal 
        isOpen={showPartnerModal} 
        onClose={() => setShowPartnerModal(false)}
        onSuccess={(txHash) => {
          setTxHash(txHash);
          setTxSuccess(true);
          setShowPartnerModal(false);
        }}
      />
      
      {editingTier && (
        <EditTierModal 
          isOpen={showEditModal} 
          onClose={() => {
            setShowEditModal(false);
            setEditingTier(null);
          }}
          tier={editingTier}
          tierInfo={allTiers[editingTier]}
          onSuccess={(txHash) => {
            setTxHash(txHash);
            setTxSuccess(true);
            setShowEditModal(false);
            setEditingTier(null);
          }}
        />
      )}
    </div>
  );
};

// ========== MODALES ==========

// Modal de création de tier standard
const CreateTierModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txHash: string) => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateTierParams>({
    name: '',
    description: '',
    price: '',
    supply: 100,
    multiplier: 100,
    baseURI: '',
    accessPlans: [],
    isSpecial: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const result = await extensibleNFTService.createNewTier(formData);
      
      if (result.success && result.txHash) {
        onSuccess(result.txHash);
      } else {
        setError(result.error || 'Erreur lors de la création du tier');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du tier');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">Créer un Nouveau Tier NFT</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">Nom du NFT</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm mb-2">Prix (USDC)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">Supply Total</label>
              <input
                type="number"
                value={formData.supply}
                onChange={(e) => setFormData({...formData, supply: parseInt(e.target.value)})}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm mb-2">Multiplicateur (%)</label>
              <input
                type="number"
                value={formData.multiplier}
                onChange={(e) => setFormData({...formData, multiplier: parseInt(e.target.value)})}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500"
                min="100"
                step="10"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                100 = 1.0x, 150 = 1.5x, 200 = 2.0x, etc.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">URI de Base (Métadonnées)</label>
            <input
              type="url"
              value={formData.baseURI}
              onChange={(e) => setFormData({...formData, baseURI: e.target.value})}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500"
              placeholder="https://api.example.com/nft/metadata/"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">Plans d'Accès</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['starter', 'standard', 'premium', 'privilege'].map(plan => (
                <label key={plan} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.accessPlans.includes(plan)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData, 
                          accessPlans: [...formData.accessPlans, plan]
                        });
                      } else {
                        setFormData({
                          ...formData, 
                          accessPlans: formData.accessPlans.filter(p => p !== plan)
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-slate-300 text-sm capitalize">{plan}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isSpecial}
                onChange={(e) => setFormData({...formData, isSpecial: e.target.checked})}
                className="rounded"
              />
              <span className="text-slate-300 text-sm">NFT Spécial (événement, partenariat, etc.)</span>
            </label>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  <span>Création...</span>
                </>
              ) : (
                <span>Créer le Tier</span>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal de création d'événement NFT (simplifié)
const CreateEventNFTModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txHash: string) => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    supply: 50,
    multiplier: 110,
    baseURI: '',
    accessPlans: ['starter']
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const result = await extensibleNFTService.createEventNFT(formData);
      
      if (result.success && result.txHash) {
        onSuccess(result.txHash);
      } else {
        setError(result.error || 'Erreur lors de la création du NFT événement');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du NFT événement');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">Créer un NFT Événement</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-2">Nom de l'Événement</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500"
              placeholder="Ex: Halloween 2024"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">Supply</label>
              <input
                type="number"
                value={formData.supply}
                onChange={(e) => setFormData({...formData, supply: parseInt(e.target.value)})}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm mb-2">Bonus (%)</label>
              <input
                type="number"
                value={formData.multiplier}
                onChange={(e) => setFormData({...formData, multiplier: parseInt(e.target.value)})}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500"
                min="100"
                step="5"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">URI Métadonnées</label>
            <input
              type="url"
              value={formData.baseURI}
              onChange={(e) => setFormData({...formData, baseURI: e.target.value})}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500"
              required
            />
          </div>

          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-300 text-sm">
              💡 Les NFT événement sont gratuits et peuvent être distribués manuellement.
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  <span>Création...</span>
                </>
              ) : (
                <span>Créer NFT Événement</span>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Autres modales (CreatePartnerNFTModal, EditTierModal) - structure similaire
const CreatePartnerNFTModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txHash: string) => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  // Structure similaire à CreateEventNFTModal mais avec prix
  if (!isOpen) return null;
  return <div>/* À implémenter */</div>;
};

const EditTierModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tier: number;
  tierInfo: ExtendedTierInfo;
  onSuccess: (txHash: string) => void;
}> = ({ isOpen, onClose, tier, tierInfo, onSuccess }) => {
  // Modal pour modifier les paramètres d'un tier existant
  if (!isOpen) return null;
  return <div>/* À implémenter */</div>;
};

export default NFTAdminPanel;