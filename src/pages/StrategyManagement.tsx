//src/pages/StrategyManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  RefreshCw,
  PieChart,
  AlertTriangle,
  Check,
  Clock,
  ChevronDown,
  ArrowRightLeft,
  Wallet,
  Send,
  DollarSign
} from 'lucide-react';
import { ethers } from 'ethers';
import { useStrategies } from '../hooks/useStrategies';
import { useContracts } from '../hooks/useContracts';

// Adresses des wallets
const ADDRESSES = {
  USDC_TOKEN: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955",
  STAKING_CONTRACT: "0x719fd9F511DDc561D03801161742D84ECb9445e9",
  MANAGEMENT_FEE_WALLET: "0x7558cBa3b60F11FBbEcc9CcAB508afA65d88B3d2", // Wallet de gestion des frais
  RESERVE_WALLET: "0x3837944Bb983886ED6e8d26b5e5F54a27A2BF214", // Fond de Réserve
  OWNER_WALLET: "0x1FF70C1DFc33F5DDdD1AD2b525a07b172182d8eF", // Owner Wallet
  WALLET_OWNER_RECOMPENSE: "0x6Cf9fA1738C0c2AE386EF8a75025B53DEa95407a" // Wallet Owner Récompense
};

const erc20ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address recipient, uint256 amount) returns (bool)"
];

const StrategyManagement = () => {
  // Définition des types
  interface TransactionStatus {
    type: 'success' | 'error' | 'pending';
    message: string;
  }

  // Utiliser le hook useStrategies pour obtenir les données
  const {
    stakingBalances,
    loading,
    error,
    loadStrategiesData,
    transferToStrategy,
    transferFeesToReserve,
    transferFeesToOwner,
    transferDepositFeesToReserve,
    transferDepositFeesToOwner
  } = useStrategies();

  // Hook pour obtenir les contrats
  const { provider, signer, stakingContract } = useContracts();

  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);

  // États pour les différents formulaires
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [strategyFeesAmount, setStrategyFeesAmount] = useState('');
  const [depositFeesAmount, setDepositFeesAmount] = useState('');

  // États pour les soldes des wallets
  const [walletBalances, setWalletBalances] = useState({
    managementFee: 0,
    reserve: 0,
    owner: 0,
    ownerRecompense: 0
  });

  // Fonction pour charger les soldes des wallets
  const loadWalletBalances = async () => {
    if (!provider) return;
    
    try {
      const usdcContract = new ethers.Contract(ADDRESSES.USDC_TOKEN, erc20ABI, provider);
      const usdcDecimals = await usdcContract.decimals();
      
      const [managementBalance, reserveBalance, ownerBalance, ownerRecompenseBalance] = await Promise.all([
        usdcContract.balanceOf(ADDRESSES.MANAGEMENT_FEE_WALLET),
        usdcContract.balanceOf(ADDRESSES.RESERVE_WALLET),
        usdcContract.balanceOf(ADDRESSES.OWNER_WALLET),
        usdcContract.balanceOf(ADDRESSES.WALLET_OWNER_RECOMPENSE)
      ]);
      
      setWalletBalances({
        managementFee: Number(ethers.formatUnits(managementBalance, usdcDecimals)),
        reserve: Number(ethers.formatUnits(reserveBalance, usdcDecimals)),
        owner: Number(ethers.formatUnits(ownerBalance, usdcDecimals)),
        ownerRecompense: Number(ethers.formatUnits(ownerRecompenseBalance, usdcDecimals))
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des soldes des wallets:", error);
    }
  };

  // Ajouter un useEffect pour charger les soldes des wallets
  useEffect(() => {
    loadWalletBalances();
    const interval = setInterval(loadWalletBalances, 30000);
    return () => clearInterval(interval);
  }, [provider]);

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
      const tokenAddress = ADDRESSES.USDC_TOKEN;
      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(withdrawAmount, decimals);
      
      // Appeler adminWithdraw
      const tx = await stakingContract.adminWithdraw(tokenAddress, amountInWei);
      await tx.wait();
      
      setTransactionStatus({
        type: 'success',
        message: `${withdrawAmount} USDC retirés avec succès du pool vers votre wallet`
      });
      
      setWithdrawAmount('');
      loadStrategiesData();
      loadWalletBalances();
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

  // Fonction pour transférer vers la stratégie
  const handleTransferToStrategy = async () => {
    if (!transferAmount || Number(transferAmount) <= 0) return;

    setActionLoading(true);
    setTransactionStatus({ type: 'pending', message: 'Transfert vers stratégie en cours...' });

    try {
      const result = await transferToStrategy(transferAmount);
      
      setTransactionStatus({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      
      if (result.success) {
        setTransferAmount('');
        loadStrategiesData();
        loadWalletBalances();
      }
    } catch (err: any) {
      console.error("Erreur lors du transfert vers stratégie:", err);
      setTransactionStatus({
        type: 'error',
        message: err.message || 'Transfert vers stratégie échoué'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Fonction pour gérer les frais de stratégie vers la réserve (1%)
const handleStrategyFeesToReserve = async () => {
  if (!strategyFeesAmount || Number(strategyFeesAmount) <= 0) return;

  setActionLoading(true);
  setTransactionStatus({ type: 'pending', message: 'Transfert des frais stratégie vers Réserve en cours...' });

  try {
    const result = await transferFeesToReserve(strategyFeesAmount);
    
    setTransactionStatus({
      type: result.success ? 'success' : 'error',
      message: result.message
    });
    
    if (result.success) {
      setStrategyFeesAmount('');
      loadStrategiesData();
      loadWalletBalances();
    }
  } catch (err: any) {
    console.error('Erreur lors du transfert des frais stratégie vers Réserve:', err);
    setTransactionStatus({
      type: 'error',
      message: err.message || 'Transfert des frais stratégie vers Réserve échoué'
    });
  } finally {
    setActionLoading(false);
  }
};

// Fonction pour gérer les frais de stratégie vers l'owner (9%)
const handleStrategyFeesToOwner = async () => {
  if (!strategyFeesAmount || Number(strategyFeesAmount) <= 0) return;

  setActionLoading(true);
  setTransactionStatus({ type: 'pending', message: 'Transfert des frais stratégie vers Owner en cours...' });

  try {
    const result = await transferFeesToOwner(strategyFeesAmount);
    
    setTransactionStatus({
      type: result.success ? 'success' : 'error',
      message: result.message
    });
    
    if (result.success) {
      setStrategyFeesAmount('');
      loadStrategiesData();
      loadWalletBalances();
    }
  } catch (err: any) {
    console.error('Erreur lors du transfert des frais stratégie vers Owner:', err);
    setTransactionStatus({
      type: 'error',
      message: err.message || 'Transfert des frais stratégie vers Owner échoué'
    });
  } finally {
    setActionLoading(false);
  }
};

  // Fonction pour gérer les frais de dépôt
  const handleDepositFees = async (type: 'reserve' | 'owner') => {
    if (!depositFeesAmount || Number(depositFeesAmount) <= 0) return;

    setActionLoading(true);
    const actionText = type === 'reserve' ? 'Réserve' : 'Owner';
    setTransactionStatus({ type: 'pending', message: `Transfert des frais dépôt vers ${actionText} en cours...` });

    try {
      const result = type === 'reserve' 
        ? await transferDepositFeesToReserve(depositFeesAmount)
        : await transferDepositFeesToOwner(depositFeesAmount);
      
      setTransactionStatus({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      
      if (result.success) {
        setDepositFeesAmount('');
        loadStrategiesData();
        loadWalletBalances();
      }
    } catch (err: any) {
      console.error(`Erreur lors du transfert des frais dépôt vers ${actionText}:`, err);
      setTransactionStatus({
        type: 'error',
        message: err.message || `Transfert des frais dépôt vers ${actionText} échoué`
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Fonction de rafraîchissement manuel
  const handleRefresh = () => {
    loadStrategiesData();
    loadWalletBalances();
  };

  // Afficher un message de chargement
  if (loading && !stakingBalances) {
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
  if (error && !stakingBalances) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-lg mx-auto">
          <AlertTriangle size={36} className="mx-auto mb-4 text-red-500" />
          <p className="text-lg text-red-400 mb-2">Erreur lors du chargement des données</p>
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

        {/* Grid des cards de gestion */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Fees Dépôt Pool vers Réserve */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center mb-4">
              <Wallet className="text-blue-400 mr-2" size={20} />
              <h3 className="text-lg font-semibold text-white">Fees Dépôt Pool → Wallet Réserve</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Montant de base (USDC)
                </label>
                <input
                  type="number"
                  value={depositFeesAmount}
                  onChange={(e) => setDepositFeesAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Frais à transférer: {depositFeesAmount ? (Number(depositFeesAmount) * 0.005).toFixed(2) : '0.00'} USDC (0.5%)
                </p>
              </div>
              
              <button
                onClick={() => handleDepositFees('reserve')}
                disabled={actionLoading || !depositFeesAmount || Number(depositFeesAmount) <= 0}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} className="mr-2" />
                Transférer 0.5%
              </button>
              
              <div className="text-xs text-slate-400 bg-slate-700 p-2 rounded">
                <strong>Solde Réserve:</strong> ${walletBalances.reserve.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDC
              </div>
            </div>
          </div>

          {/* Card 2: Fees Dépôt Pool vers Owner */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center mb-4">
              <Wallet className="text-orange-400 mr-2" size={20} />
              <h3 className="text-lg font-semibold text-white">Fees Dépôt Pool → Récompense Owner</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Montant de base (USDC)
                </label>
                <input
                  type="number"
                  value={depositFeesAmount}
                  onChange={(e) => setDepositFeesAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Frais à transférer: {depositFeesAmount ? (Number(depositFeesAmount) * 0.015).toFixed(2) : '0.00'} USDC (1.5%)
                </p>
              </div>
              
              <button
                onClick={() => handleDepositFees('owner')}
                disabled={actionLoading || !depositFeesAmount || Number(depositFeesAmount) <= 0}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} className="mr-2" />
                Transférer 1.5%
              </button>
              
              <div className="text-xs text-slate-400 bg-slate-700 p-2 rounded">
                <strong>Solde Owner:</strong> ${walletBalances.owner.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDC
              </div>
            </div>
          </div>

          {/* Card 3: Transfert Vers Stratégie */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center mb-4">
              <ArrowRightLeft className="text-purple-400 mr-2" size={20} />
              <h3 className="text-lg font-semibold text-white">Pool → Stratégie Owner Wallet</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Montant (USDC)
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <button
                onClick={handleTransferToStrategy}
                disabled={actionLoading || !transferAmount || Number(transferAmount) <= 0}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} className="mr-2" />
                Transférer
              </button>
              
              <div className="text-xs text-slate-400 bg-slate-700 p-2 rounded">
                <strong>Solde Pool:</strong> ${stakingBalances && stakingBalances.USDC 
                  ? stakingBalances.USDC.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) 
                  : '0.00'} USDC
              </div>
            </div>
          </div>

          {/* Card 4: Fees Stratégie vers Réserve */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="text-teal-400 mr-2" size={20} />
              <h3 className="text-lg font-semibold text-white">Fees Stratégie → Wallet Réserve</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Montant de base (USDC)
                </label>
                <input
                  type="number"
                  value={strategyFeesAmount}
                  onChange={(e) => setStrategyFeesAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Frais à transférer: {strategyFeesAmount ? (Number(strategyFeesAmount) * 0.01).toFixed(2) : '0.00'} USDC (1%)
                </p>
              </div>
              
              <button
                onClick={handleStrategyFeesToReserve}
                disabled={actionLoading || !strategyFeesAmount || Number(strategyFeesAmount) <= 0}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} className="mr-2" />
                Transférer 1%
              </button>
              
              <div className="text-xs text-slate-400 bg-slate-700 p-2 rounded">
                <strong>Solde Réserve:</strong> ${walletBalances.reserve.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDC
              </div>
            </div>
          </div>

          {/* Card 5: Fees Stratégie vers Owner */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="text-yellow-400 mr-2" size={20} />
              <h3 className="text-lg font-semibold text-white">Fees Stratégie → Récompense Owner</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Montant de base (USDC)
                </label>
                <input
                  type="number"
                  value={strategyFeesAmount}
                  onChange={(e) => setStrategyFeesAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Frais à transférer: {strategyFeesAmount ? (Number(strategyFeesAmount) * 0.09).toFixed(2) : '0.00'} USDC (9%)
                </p>
              </div>
              
              <button
                onClick={handleStrategyFeesToOwner}
                disabled={actionLoading || !strategyFeesAmount || Number(strategyFeesAmount) <= 0}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} className="mr-2" />
                Transférer 9%
              </button>
              
              <div className="text-xs text-slate-400 bg-slate-700 p-2 rounded">
                <strong>Solde Réserve:</strong> ${walletBalances.ownerRecompense.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDC
              </div>
            </div>
          </div>

          {/* Card 6: Retirer des Fonds du Pool */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center mb-4">
              <ArrowRightLeft className="text-red-400 mr-2" size={20} />
              <h3 className="text-lg font-semibold text-white">Retirer du Pool → Owner Wallet</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Montant (USDC)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span></span>
                  <button
                    className="text-red-400 hover:text-red-300"
                    onClick={() => {
                      if (stakingBalances && stakingBalances.USDC) {
                        setWithdrawAmount(String(stakingBalances.USDC));
                      }
                    }}
                  >
                    Max
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleWithdrawFromPool}
                disabled={actionLoading || !withdrawAmount || Number(withdrawAmount) <= 0}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRightLeft size={16} className="mr-2" />
                Retirer
              </button>
              
              <div className="text-xs text-slate-400 bg-slate-700 p-2 rounded">
                <strong>Solde Pool:</strong> ${stakingBalances && stakingBalances.USDC 
                  ? stakingBalances.USDC.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) 
                  : '0.00'} USDC
              </div>
            </div>
          </div>
        </div>

        {/* Notification de statut */}
        {transactionStatus && (
          <div className={`mb-6 p-4 rounded-lg flex items-start ${
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

        {/* Guide d'utilisation */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Guide d'Utilisation</h2>
         
          <div className="space-y-4 text-slate-300">
            <p>
              <strong className="text-white">Fees Dépôt Pool:</strong> Transférez 0.5% vers la Réserve et 1.5% vers le Owner depuis le wallet de gestion des frais.
            </p>
            <p>
              <strong className="text-white">Transfert Vers Stratégie:</strong> Transférez des fonds du pool du smart contract vers le wallet Owner.
            </p>
            <p>
              <strong className="text-white">Fees Stratégie:</strong> Transférez 1% vers la Réserve et 9% vers le Owner depuis le pool du smart contract.
            </p>
            <p>
              <strong className="text-white">Retirer du Pool:</strong> Retirez des fonds du pool du smart contract vers votre wallet.
            </p>
            <p className="text-amber-400">
              <AlertTriangle size={16} className="inline mr-1" />
              Assurez-vous que les wallets ont suffisamment de fonds avant d'effectuer les transferts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyManagement;