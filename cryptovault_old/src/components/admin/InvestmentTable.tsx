import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Search } from 'lucide-react';
import { Investment } from '../../contexts/InvestmentContext';

interface InvestmentTableProps {
  investments: Investment[];
  loading: boolean;
  onRefresh: () => void;
}

const InvestmentTable = ({ investments, loading, onRefresh }: InvestmentTableProps) => {
  const [sortBy, setSortBy] = useState<keyof Investment>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSort = (column: keyof Investment) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  
  // Formater la date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Filtrer les investissements par terme de recherche
  const filteredInvestments = investments.filter(inv => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      inv.id.toLowerCase().includes(searchTermLower) ||
      inv.token.toLowerCase().includes(searchTermLower) ||
      inv.amount.toString().includes(searchTermLower)
    );
  });
  
  // Trier les investissements
  const sortedInvestments = [...filteredInvestments].sort((a, b) => {
    if (sortBy === 'startDate' || sortBy === 'endDate') {
      const dateA = new Date(a[sortBy]).getTime();
      const dateB = new Date(b[sortBy]).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortBy === 'amount' || sortBy === 'dailyReturn' || sortBy === 'accumulatedReturns') {
      return sortDirection === 'asc' 
        ? a[sortBy] - b[sortBy] 
        : b[sortBy] - a[sortBy];
    }
    return 0;
  });
  
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* En-tête du tableau avec recherche et rafraîchissement */}
      <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-white font-medium">Tous les Investissements</h3>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Rechercher des investissements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="bg-slate-700 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-slate-700">
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-4">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('id')}
                >
                  ID
                  {sortBy === 'id' && (
                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </button>
              </th>
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-4">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('planId')}
                >
                  Plan
                  {sortBy === 'planId' && (
                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </button>
              </th>
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-4">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('amount')}
                >
                  Montant
                  {sortBy === 'amount' && (
                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </button>
              </th>
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-4">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('startDate')}
                >
                  Date de Début
                  {sortBy === 'startDate' && (
                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </button>
              </th>
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-4">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('endDate')}
                >
                  Date de Fin
                  {sortBy === 'endDate' && (
                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </button>
              </th>
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-4">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('dailyReturn')}
                >
                  Rendement Quotidien
                  {sortBy === 'dailyReturn' && (
                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </button>
              </th>
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-4">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('accumulatedReturns')}
                >
                  Rendements Cumulés
                  {sortBy === 'accumulatedReturns' && (
                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </button>
              </th>
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-4">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                  Chargement des investissements...
                </td>
              </tr>
            ) : sortedInvestments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  Aucun investissement trouvé
                </td>
              </tr>
            ) : (
              sortedInvestments.map((investment) => (
                <tr key={investment.id} className="hover:bg-slate-750">
                  <td className="py-3 px-4 text-sm text-white truncate max-w-[100px]">
                    {investment.id}
                  </td>
                  <td className="py-3 px-4 text-sm text-white">
                    Plan {investment.planId}
                  </td>
                  <td className="py-3 px-4 text-sm text-white">
                    {investment.amount.toFixed(2)} {investment.token}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    {formatDate(investment.startDate)}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    {formatDate(investment.endDate)}
                  </td>
                  <td className="py-3 px-4 text-sm text-white">
                    {investment.dailyReturn.toFixed(4)} {investment.token}
                  </td>
                  <td className="py-3 px-4 text-sm text-green-400">
                    {investment.accumulatedReturns.toFixed(4)} {investment.token}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      investment.isActive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-slate-600/50 text-slate-400'
                    }`}>
                      {investment.isActive ? 'Actif' : 'Terminé'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvestmentTable;