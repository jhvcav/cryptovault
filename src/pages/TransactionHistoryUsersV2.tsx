import React, { useState, useEffect } from 'react';
import { 
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  Filter,
  Search,
  Download,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

const TransactionHistoryV2 = () => {
  const { address } = useWallet();
  const [activeTab, setActiveTab] = useState('investments');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Configuration
  const API_KEY = import.meta.env.VITE_BSCSCAN_API_KEY;
  const CONTRACT_ADDRESS = '0xcF76Fb0D057228BC84772cA654E17ab580725388'; // Adresse du contratV3
  
  // Adresses des tokens
  const TOKENS = {
    'USDT': '0x55d398326f99059fF775485246999027B3197955',
    'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
  };

  // Récupérer toutes les transactions du wallet avec le contrat
  const fetchTransactionHistory = async () => {
    if (!address || !API_KEY) {
      console.log('❌ Address ou API_KEY manquant');
      setLoading(false);
      return;
    }

    console.log('🔍 Récupération des transactions pour:', address);
    
    try {
      // 1. Transactions normales
      const normalTxResponse = await fetch(
        `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${API_KEY}`
      );
      const normalTxData = await normalTxResponse.json();
      
      // 2. Transactions de tokens (USDT/USDC)
      const tokenTxResponse = await fetch(
        `https://api.bscscan.com/api?module=account&action=tokentx&address=${address}&sort=desc&apikey=${API_KEY}`
      );
      const tokenTxData = await tokenTxResponse.json();

      console.log('📊 Transactions normales:', normalTxData);
      console.log('🪙 Transactions de tokens:', tokenTxData);

      let allTransactions = [];

      // Traiter les transactions normales avec le contrat
      if (normalTxData.status === '1' && normalTxData.result) {
        const contractTxs = normalTxData.result.filter(tx => 
          tx.to.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() ||
          tx.from.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
        );

        // On ne traite plus les transactions BNB - elles sont supprimées
        console.log('🚫 Transactions BNB ignorées:', contractTxs.length);
      }

      // Traiter les transactions de tokens avec le contrat
      if (tokenTxData.status === '1' && tokenTxData.result) {
        const contractTokenTxs = tokenTxData.result.filter(tx => 
          (tx.to.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() || 
           tx.from.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) &&
          (tx.tokenSymbol === 'USDT' || tx.tokenSymbol === 'USDC')
        );

        contractTokenTxs.forEach(tx => {
          const isDeposit = tx.to.toLowerCase() === CONTRACT_ADDRESS.toLowerCase();
          
          allTransactions.push({
            id: tx.hash + '_' + tx.tokenSymbol,
            hash: tx.hash,
            type: isDeposit ? 'deposit' : 'withdrawal',
            subType: isDeposit ? 'Dépôt' : 'Retrait',
            direction: isDeposit ? 'in' : 'out',
            amount: parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal)),
            token: tx.tokenSymbol,
            timestamp: new Date(parseInt(tx.timeStamp) * 1000),
            blockNumber: parseInt(tx.blockNumber),
            status: 'success',
            contractAddress: tx.contractAddress
          });
        });
      }

      // Trier par date décroissante
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);
      
      console.log('✅ Total transactions trouvées:', allTransactions.length);
      console.log('📋 Transactions:', allTransactions);
      
      setTransactions(allTransactions);

    } catch (error) {
      console.error('❌ Erreur API BSCScan:', error);
    } finally {
      setLoading(false);
    }
  };

  // Déterminer le nom de la méthode à partir de l'input
  const getMethodName = (input) => {
    if (!input || input === '0x') return 'Transfer';
    
    const methodSignatures = {
      '0xa694fc3a': 'stake',
      '0x2e17de78': 'unstake', 
      '0xe9fad8ee': 'claimRewards',
      '0x853828b6': 'claimRewards',
      '0x379607f5': 'claimRewards',
      '0xadc9772e': 'endStake'
    };
    
    const methodId = input.slice(0, 10);
    return methodSignatures[methodId] || 'Contract Call';
  };

  // Fonction de rafraîchissement
  const handleRefresh = async () => {
    console.log('🔄 Rafraîchissement des données');
    setRefreshing(true);
    await fetchTransactionHistory();
    setRefreshing(false);
  };

  // Charger les données au montage
  useEffect(() => {
    if (address) {
      fetchTransactionHistory();
    }
  }, [address]);

  // Filtrer les transactions
  const filterTransactions = () => {
    return transactions.filter(tx => {
      // Filtre par terme de recherche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          tx.hash.toLowerCase().includes(searchLower) ||
          tx.subType.toLowerCase().includes(searchLower) ||
          tx.token.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtre par date
      if (dateFilter !== 'all') {
        const now = new Date();
        const txDate = tx.timestamp;
        const diffTime = now - txDate;
        const diffDays = diffTime / (1000 * 3600 * 24);
        
        switch (dateFilter) {
          case '7days':
            if (diffDays > 7) return false;
            break;
          case '30days':
            if (diffDays > 30) return false;
            break;
          case '90days':
            if (diffDays > 90) return false;
            break;
        }
      }

      // Filtre par onglet
      if (activeTab === 'investments') {
        return tx.type === 'deposit' || (tx.type === 'contract' && (tx.subType === 'stake' || tx.subType === 'Contract Call'));
      } else {
        return tx.type === 'withdrawal' || (tx.type === 'contract' && (tx.subType === 'claimRewards' || tx.subType === 'endStake' || tx.subType === 'unstake'));
      }
    });
  };

  const filteredTransactions = filterTransactions();

  // Fonction d'export
  const exportData = () => {
    const csvContent = [
      ['Date', 'Type', 'Montant', 'Token', 'Direction', 'Hash de Transaction'],
      ...filteredTransactions.map(tx => [
        tx.timestamp.toLocaleDateString('fr-FR'),
        tx.subType,
        tx.amount.toFixed(6),
        tx.token,
        tx.direction === 'in' ? 'Entrée' : 'Sortie',
        tx.hash
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!address) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
            <Clock size={48} className="text-slate-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Wallet Non Connecté</h2>
            <p className="text-slate-400">
              Veuillez connecter votre wallet MetaMask pour voir l'historique de vos transactions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!API_KEY) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-800 rounded-lg p-8 border border-red-700 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Configuration Manquante</h2>
            <p className="text-red-300">
              Clé API BSCScan non configurée. Ajoutez VITE_BSCSCAN_API_KEY dans votre fichier .env
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-1">
              Historique des Transactions V2
            </h1>
            <p className="text-slate-400">
              Toutes vos transactions avec le smart contract
            </p>
            <p className="text-xs text-slate-500 mt-1">
              📡 Données récupérées via BSCScan API
            </p>
          </div>
          <div className="flex items-center mt-4 md:mt-0 space-x-2">
            <button
              onClick={exportData}
              className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Download size={16} className="mr-2" />
              Exporter CSV
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title="Rafraîchir les données"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('investments')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'investments'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownRight size={16} className="inline mr-2" />
            Dépôts & Investissements ({filteredTransactions.filter(tx => activeTab === 'investments' ? tx.type === 'deposit' || (tx.type === 'contract' && (tx.subType === 'stake' || tx.subType === 'Contract Call')) : false).length})
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'withdrawals'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight size={16} className="inline mr-2" />
            Retraits & Récompenses ({filteredTransactions.filter(tx => activeTab === 'withdrawals' ? tx.type === 'withdrawal' || (tx.type === 'contract' && (tx.subType === 'claimRewards' || tx.subType === 'endStake' || tx.subType === 'unstake')) : false).length})
          </button>
        </div>

        {/* Filtres */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par hash, type, token..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Toutes les dates</option>
              <option value="7days">7 derniers jours</option>
              <option value="30days">30 derniers jours</option>
              <option value="90days">90 derniers jours</option>
            </select>

            <div className="text-slate-400 text-sm flex items-center">
              Total: {filteredTransactions.length} transactions
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw size={32} className="text-slate-500 mx-auto mb-4 animate-spin" />
              <p className="text-slate-400">Chargement des transactions depuis BSCScan...</p>
            </div>
          ) : (
            <TransactionTable 
              transactions={filteredTransactions}
              activeTab={activeTab}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Composant pour le tableau des transactions
const TransactionTable = ({ transactions, activeTab }) => {
  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <TrendingUp size={48} className="text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Aucune Transaction Trouvée</h3>
        <p className="text-slate-400">
          Aucune transaction ne correspond aux critères de recherche.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-4 px-6 text-slate-300 font-medium">Date</th>
            <th className="text-left py-4 px-6 text-slate-300 font-medium">Type</th>
            <th className="text-left py-4 px-6 text-slate-300 font-medium">Direction</th>
            <th className="text-left py-4 px-6 text-slate-300 font-medium">Montant</th>
            <th className="text-left py-4 px-6 text-slate-300 font-medium">Token</th>
            <th className="text-left py-4 px-6 text-slate-300 font-medium">Statut</th>
            <th className="text-left py-4 px-6 text-slate-300 font-medium">Transaction</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-slate-700 hover:bg-slate-750">
              <td className="py-4 px-6">
                <div className="text-white text-sm">
                  {tx.timestamp.toLocaleDateString('fr-FR')}
                </div>
                <div className="text-xs text-slate-400">
                  {tx.timestamp.toLocaleTimeString('fr-FR')}
                </div>
              </td>
              <td className="py-4 px-6">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tx.type === 'deposit' ? 'bg-green-100 text-green-800' :
                  tx.type === 'withdrawal' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {tx.subType}
                </span>
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center">
                  {tx.direction === 'in' ? (
                    <ArrowDownRight size={16} className="text-green-500 mr-2" />
                  ) : (
                    <ArrowUpRight size={16} className="text-red-500 mr-2" />
                  )}
                  <span className={`text-sm ${tx.direction === 'out' ? 'text-red-400' : 'text-green-400'}`}>
                    {tx.direction === 'out' ? 'Sortie' : 'Entrée'}
                  </span>
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="text-white font-medium">
                  {tx.amount.toFixed(6)}
                </div>
              </td>
              <td className="py-4 px-6">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tx.token === 'USDT' ? 'bg-green-700 text-green-300' :
                  tx.token === 'USDC' ? 'bg-blue-700 text-blue-300' :
                  'bg-yellow-700 text-yellow-300'
                }`}>
                  {tx.token}
                </span>
              </td>
              <td className="py-4 px-6">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tx.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {tx.status === 'success' ? 'Réussi' : 'Échoué'}
                </span>
              </td>
              <td className="py-4 px-6">
                <a
                  href={`https://bscscan.com/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                >
                  {tx.hash.substring(0, 8)}...
                  <ExternalLink size={12} className="ml-1" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistoryV2;