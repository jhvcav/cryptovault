// DeployFundsForm.jsx (exemple React)
import React, { useState } from 'react';
import { deployToStrategy } from '../services/strategies';
import  { ADDRESSES } from '../services/contracts';

function DeployFundsForm() {
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState(ADDRESSES.USDC_TOKEN);
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Déterminer quelle stratégie utiliser selon le token
      const strategyAddress = token === ADDRESSES.USDC_TOKEN 
        ? ADDRESSES.CAKE_STRATEGY_USDC 
        : ADDRESSES.CAKE_STRATEGY_USDT;
      
      // Convertir en unités avec 6 décimales (USDC/USDT)
      const amountInWei = ethers.utils.parseUnits(amount, 6);
      
      // Exécuter le déploiement
      await deployToStrategy(token, strategyAddress, amountInWei);
      
      alert("Fonds déployés avec succès!");
      setAmount('');
    } catch (error) {
      console.error("Erreur:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <h3>Déployer des fonds vers PancakeSwap</h3>
      
      <div>
        <label>Token:</label>
        <select value={token} onChange={e => setToken(e.target.value)}>
          <option value={ADDRESSES.USDC_TOKEN}>USDC</option>
          <option value={ADDRESSES.USDT_TOKEN}>USDT</option>
        </select>
      </div>
      
      <div>
        <label>Montant:</label>
        <input 
          type="number" 
          value={amount} 
          onChange={e => setAmount(e.target.value)}
          min="0" 
          step="0.1" 
          required 
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? "Traitement..." : "Déployer"}
      </button>
    </form>
  );
}