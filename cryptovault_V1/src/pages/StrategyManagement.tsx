import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  RefreshCw,
  PieChart,
  AlertTriangle,
  Check,
  Clock,
  ChevronDown,
  ArrowRightLeft
} from 'lucide-react';
import { ethers } from 'ethers'; // Ajout de cet import
import { useStrategies } from '../hooks/useStrategies';
import { useContracts } from '../hooks/useContracts'; // Ajout de cet import


// Ajout des constantes ADDRESSES et ABI
const ADDRESSES = {
  USDC_TOKEN: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955"
};

const erc20ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address recipient, uint256 amount) returns (bool)" // Ajout de la fonction transfer
];

const StrategyManagement = () => {

  // Définition des types
  interface TransactionStatus {
    type: 'success' | 'error' | 'pending';
    message: string;
  }

  interface Strategy {
    id: number;
    address: string;
    name: string;
    token: string;
    tokenSymbol: string;
    dailyYield: number;
    currentValue: string;
    remainingLockTime: number;
    isActive: boolean;
    statusMessage: string;
    decimals: number;
  }
  // Utiliser le hook useStrategies pour obtenir les données
  const {
    strategies, 
    stakingBalances, 
    loading, 
    error, 
    loadStrategiesData,
    deployToStrategy,
    withdrawFromStrategy,
    harvestRewards,
    emergencyExit,
    formatRemainingTime
  } = useStrategies();

  // Hook pour obtenir les contrats
  const { provider, signer, stakingContract } = useContracts();

  const [selectedToken, setSelectedToken] = useState<string>('USDC');
  const [amount, setAmount] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawToken, setWithdrawToken] = useState('USDC');

  interface WalletBalances {
    [key: string]: number;
  }
  
  const [walletBalances, setWalletBalances] = useState<WalletBalances>({ USDC: 0, USDT: 0 });

  // Fonction pour charger les soldes du wallet propriétaire
const loadWalletBalances = async () => {
  if (!signer || !provider) return;
  
  try {
    const ownerAddress = await signer.getAddress();
    
    const usdcContract = new ethers.Contract(ADDRESSES.USDC_TOKEN, erc20ABI, provider);
    const usdtContract = new ethers.Contract(ADDRESSES.USDT_TOKEN, erc20ABI, provider);
    
    const [usdcBalance, usdtBalance, usdcDecimals, usdtDecimals] = await Promise.all([
      usdcContract.balanceOf(ownerAddress),
      usdtContract.balanceOf(ownerAddress),
      usdcContract.decimals(),
      usdtContract.decimals()
    ]);
    
    const usdcBalanceFormatted = Number(ethers.formatUnits(usdcBalance, usdcDecimals));
    const usdtBalanceFormatted = Number(ethers.formatUnits(usdtBalance, usdtDecimals));
    
    setWalletBalances({
      USDC: usdcBalanceFormatted,
      USDT: usdtBalanceFormatted
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des soldes du wallet:", error);
  }
};

// Ajouter un useEffect pour charger les soldes du wallet
useEffect(() => {
  loadWalletBalances();
  const interval = setInterval(loadWalletBalances, 30000);
  return () => clearInterval(interval);
}, [signer, provider]);

  // Fonction pour retirer depuis le pool (étape 1)
  const handleWithdrawFromPool = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    if (!signer || !stakingContract) {
      setTransactionStatus({
        type: 'error',
        message: 'Connexion aux contrats non disponible'
      });
      return;
    }

    setActionLoading(true);
    setTransactionStatus({ type: 'pending', message: 'Retrait du pool en cours...' });

    try {
      const tokenAddress = withdrawToken === 'USDC' ? ADDRESSES.USDC_TOKEN : ADDRESSES.USDT_TOKEN;
      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(withdrawAmount, decimals);
      
      // Appeler adminWithdraw
      const tx = await stakingContract.adminWithdraw(tokenAddress, amountInWei);
      await tx.wait();
      
      setTransactionStatus({
        type: 'success',
        message: `${withdrawAmount} ${withdrawToken} retirés avec succès du pool vers votre wallet`
      });
      
      setWithdrawAmount('');
      loadStrategiesData();
    } catch (err: any) {
      console.error("Erreur lors du retrait du pool:", err);
      setTransactionStatus({
        type: 'error',
        message: err.message || 'Retrait du pool échoué'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Gestion du déploiement de fonds
  const handleDeployToStrategy = async () => {
    if (!amount || Number(amount) <= 0) return;

    setActionLoading(true);
    setTransactionStatus({ type: 'pending', message: 'Transaction en cours...' });

    try {
      const result = await deployToStrategy(selectedToken, amount);
      
      setTransactionStatus({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      
      if (result.success) {
        setAmount(''); // Réinitialiser le montant après une transaction réussie
        // Rafraîchir les données après une transaction réussie
        loadStrategiesData();
      }
    } catch (err: any) {
      console.error("Erreur lors du déploiement:", err);
      setTransactionStatus({
        type: 'error',
        message: err.message || 'Transaction échouée'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Gestion du retrait de fonds
  const handleWithdrawFromStrategy = async (strategy: Strategy) => {
    setActionLoading(true);
    setTransactionStatus({ type: 'pending', message: 'Retrait en cours...' });

    try {
      // Fonction à implémenter dans useStrategies
      const result = await withdrawFromStrategy(strategy.id);
      
      setTransactionStatus({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      
      if (result.success) {
        // Rafraîchir les données après une transaction réussie
        loadStrategiesData();
      }
    } catch (err: any) {
      console.error("Erreur lors du retrait:", err);
      setTransactionStatus({
        type: 'error',
        message: err.message || 'Retrait échoué'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Gestion de la récolte des récompenses
  const handleHarvestRewards = async (strategy: Strategy) => {
    setActionLoading(true);
    setTransactionStatus({ type: 'pending', message: 'Récolte des récompenses en cours...' });

    try {
      const result = await harvestRewards(strategy.id);
      
      setTransactionStatus({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      
      if (result.success) {
        loadStrategiesData();
      }
    } catch (err: any) {
      console.error("Erreur lors de la récolte:", err);
      setTransactionStatus({
        type: 'error',
        message: err.message || 'Récolte des récompenses échouée'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Gestion du retrait d'urgence
  const handleEmergencyExit = async (strategy: Strategy) => {
    if (!window.confirm('ATTENTION: Cette action retirera tous les fonds de la stratégie, même s\'ils sont verrouillés. Des pénalités peuvent s\'appliquer. Voulez-vous continuer?')) return;

    setActionLoading(true);
    setTransactionStatus({ type: 'pending', message: 'Retrait d\'urgence en cours...' });

    try {
      const result = await emergencyExit(strategy.id);
      
      setTransactionStatus({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      
      if (result.success) {
        loadStrategiesData();
      }
    } catch (err: any) {
      console.error("Erreur lors du retrait d'urgence:", err);
      setTransactionStatus({
        type: 'error',
        message: err.message || 'Retrait d\'urgence échoué'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Fonction de rafraîchissement manuel
  const handleRefresh = () => {
    loadStrategiesData();
  };

  // Afficher un message de chargement
  if (loading && !strategies.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw size={36} className="mx-auto mb-4 text-blue-500 animate-spin" />
          <p className="text-lg text-slate-300">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Afficher un message d'erreur
  if (error && !strategies.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-lg mx-auto">
          <AlertTriangle size={36} className="mx-auto mb-4 text-red-500" />
          <p className="text-lg text-red-400 mb-2">Erreur lors du chargement des stratégies</p>
          <p className="text-slate-400">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête et bouton de rafraîchissement */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Gestion des Stratégies</h1>
          <button
            onClick={handleRefresh}
            className="flex items-center bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
        </div>

        {/* Résumé des stratégies actives */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="bg-slate-800 rounded-lg border border-slate-700 p-5">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-medium text-white">{strategy.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${strategy.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {strategy.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
              
              <div className="space-y-3 mb-5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Valeur actuelle:</span>
                  <span className="text-white font-medium">${parseFloat(strategy.currentValue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">APR quotidien:</span>
                  <span className="text-green-400 font-medium">{strategy.dailyYield}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Verrouillage restant:</span>
                  <span className="text-white font-medium flex items-center">
                    <Clock size={14} className="mr-1" />
                    {formatRemainingTime(strategy.remainingLockTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Statut:</span>
                  <span className="text-white font-medium">{strategy.statusMessage}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleWithdrawFromStrategy(strategy)}
                  disabled={actionLoading || !strategy.isActive || parseFloat(strategy.currentValue) <= 0}
                  className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <ArrowRightLeft size={14} className="mr-1" />
                  Retirer
                </button>
                <button
                  onClick={() => handleHarvestRewards(strategy)}
                  disabled={actionLoading || !strategy.isActive}
                  className="flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <TrendingUp size={14} className="mr-1" />
                  Récolter
                </button>
                <button
                  onClick={() => handleEmergencyExit(strategy)}
                  disabled={actionLoading || !strategy.isActive}
                  className="col-span-2 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <AlertTriangle size={14} className="mr-1" />
                  Urgence
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Formulaire de retrait du pool */}
<div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
  <h2 className="text-xl font-semibold text-white mb-6">Retirer des Fonds du Pool</h2>
 
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Token à Retirer
      </label>
      <div className="relative">
        <select
          value={withdrawToken}
          onChange={(e) => setWithdrawToken(e.target.value)}
          className="block w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="USDC">USDC</option>
          <option value="USDT">USDT</option>
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Solde dans le pool: ${stakingBalances && stakingBalances[withdrawToken] 
          ? stakingBalances[withdrawToken].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) 
          : '0.00'}
      </p>
    </div>
   
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Montant à Retirer
      </label>
      <input
        type="number"
        value={withdrawAmount}
        onChange={(e) => setWithdrawAmount(e.target.value)}
        placeholder="0.00"
        className="block w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="mt-1 text-xs text-slate-400 flex justify-between">
        <span></span>
        <button
          className="text-blue-400 hover:text-blue-300"
          onClick={() => {
            if (stakingBalances && stakingBalances[withdrawToken]) {
              setWithdrawAmount(String(stakingBalances[withdrawToken]));
            }
          }}
        >
          Max
        </button>
      </p>
    </div>
   
    <div className="flex items-end">
      <button
        onClick={handleWithdrawFromPool}
        disabled={
          actionLoading ||
          !withdrawAmount ||
          Number(withdrawAmount) <= 0 ||
          !stakingBalances ||
          !stakingBalances[withdrawToken] ||
          Number(withdrawAmount) > stakingBalances[withdrawToken]
        }
        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2.5 px-6 rounded-lg font-medium flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {actionLoading ? (
          <>
            <RefreshCw size={18} className="animate-spin mr-2" />
            Traitement...
          </>
        ) : (
          <>Retirer du Pool</>
        )}
      </button>
    </div>
  </div>
</div>

        {/* Formulaire de déploiement vers PancakeSwap depuis le wallet propriétaire*/}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Déployer des Fonds vers PancakeSwap depuis votre Wallet</h2>
         
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Token à Déployer
              </label>
              <div className="relative">
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="block w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <p className="mt-1 text-xs text-slate-400">
              Solde disponible dans votre wallet: ${walletBalances && walletBalances[selectedToken] 
                  ? walletBalances[selectedToken].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) 
                  : '0.00'}
              </p>
            </div>
           
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Montant à Déployer
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="block w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-slate-400 flex justify-between">
                <span>Min: 10</span>
                <button
                  className="text-blue-400 hover:text-blue-300"
                  onClick={() => {
                    if (walletBalances && walletBalances[selectedToken]) {
                      const maxBalance = walletBalances[selectedToken];
                      setAmount(String(Math.floor(maxBalance * 1))); // 100% du solde disponible
                    }
                  }}
                >
                  Max
                </button>
              </p>
            </div>
           
            <div className="flex items-end">
              <button
                onClick={handleDeployToStrategy}
                disabled={
                  actionLoading ||
                  !amount ||
                  Number(amount) <= 0 ||
                  !walletBalances ||
                  !walletBalances[selectedToken] ||
                  Number(amount) > walletBalances[selectedToken]
                }
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2.5 px-6 rounded-lg font-medium flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin mr-2" />
                    Traitement...
                  </>
                ) : (
                  <>Déployer sur PancakeSwap</>
                )}
              </button>
            </div>
          </div>
         
          {/* Notification de statut */}
          {transactionStatus && (
            <div className={`mt-6 p-4 rounded-lg flex items-start ${
              transactionStatus.type === 'success'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : transactionStatus.type === 'error'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {transactionStatus.type === 'success' && <Check size={18} className="mr-2 mt-0.5 flex-shrink-0" />}
              {transactionStatus.type === 'error' && <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />}
              {transactionStatus.type === 'pending' && <RefreshCw size={18} className="mr-2 mt-0.5 animate-spin flex-shrink-0" />}
              <p>{transactionStatus.message}</p>
            </div>
          )}
        </div>
       
        {/* Guide d'utilisation */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Guide d'Utilisation des Stratégies</h2>
         
          <div className="space-y-4 text-slate-300">
            <p>
              <strong className="text-white">Déploiement</strong>: Utilisez le formulaire ci-dessus pour déployer des fonds du contrat principal vers PancakeSwap. Les fonds seront convertis en CAKE et stakés automatiquement.
            </p>
            <p>
              <strong className="text-white">Récolte</strong>: Récoltez les récompenses générées par vos stakes CAKE. Ces récompenses seront envoyées directement à votre portefeuille.
            </p>
            <p>
              <strong className="text-white">Retrait</strong>: Retirez vos fonds d'une stratégie. Les CAKE seront convertis en USDC/USDT et renvoyés au contrat principal.
            </p>
            <p>
              <strong className="text-white">Urgence</strong>: En cas de problème, cette fonction retire immédiatement tous les fonds de la stratégie, même s'ils sont verrouillés. Notez que des pénalités peuvent s'appliquer.
            </p>
            <p className="text-amber-400">
              <AlertTriangle size={16} className="inline mr-1" />
              Assurez-vous de toujours maintenir suffisamment de fonds dans le contrat principal pour payer les récompenses quotidiennes des investisseurs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyManagement;