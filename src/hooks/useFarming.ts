import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';

export const useFarming = () => {
  const { farmingContract, isContractReady } = useContracts();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deposit = useCallback(async (farmId: number, amount: string) => {
    if (!isContractReady(farmingContract)) {
      setError('Contrat non initialisé');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const tx = await farmingContract.deposit(farmId, amount);
      await tx.wait();
      
      return true;
    } catch (err) {
      console.error('Erreur de dépôt:', err);
      setError(err instanceof Error ? err.message : 'Échec du dépôt');
      return false;
    } finally {
      setLoading(false);
    }
  }, [farmingContract, isContractReady]);

  const claimRewards = useCallback(async (positionId: number) => {
    if (!isContractReady(farmingContract)) {
      setError('Contrat non initialisé');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const tx = await farmingContract.claimRewards(positionId);
      await tx.wait();
      
      return true;
    } catch (err) {
      console.error('Erreur de réclamation:', err);
      setError(err instanceof Error ? err.message : 'Échec de la réclamation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [farmingContract, isContractReady]);

  const closePosition = useCallback(async (positionId: number) => {
    if (!isContractReady(farmingContract)) {
      setError('Contrat non initialisé');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const tx = await farmingContract.closePosition(positionId);
      await tx.wait();
      
      return true;
    } catch (err) {
      console.error('Erreur de fermeture:', err);
      setError(err instanceof Error ? err.message : 'Échec de la fermeture de position');
      return false;
    } finally {
      setLoading(false);
    }
  }, [farmingContract, isContractReady]);

  const emergencyWithdraw = useCallback(async (positionId: number) => {
    if (!isContractReady(farmingContract)) {
      setError('Contrat non initialisé');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const tx = await farmingContract.emergencyWithdraw(positionId);
      await tx.wait();
      
      return true;
    } catch (err) {
      console.error('Erreur de retrait:', err);
      setError(err instanceof Error ? err.message : 'Échec du retrait d\'urgence');
      return false;
    } finally {
      setLoading(false);
    }
  }, [farmingContract, isContractReady]);

  const getUserPositions = useCallback(async (address: string) => {
    if (!isContractReady(farmingContract)) {
      return [];
    }
    
    try {
      const positions = await farmingContract.getUserPositions(address);
      return positions;
    } catch (err) {
      console.error('Erreur de récupération:', err);
      setError(err instanceof Error ? err.message : 'Échec de la récupération des positions');
      return [];
    }
  }, [farmingContract, isContractReady]);

  const calculateRewards = useCallback(async (address: string, positionId: number) => {
    if (!isContractReady(farmingContract)) {
      return '0';
    }
    
    try {
      const rewards = await farmingContract.calculateRewards(address, positionId);
      return rewards;
    } catch (err) {
      console.error('Erreur de calcul:', err);
      setError(err instanceof Error ? err.message : 'Échec du calcul des récompenses');
      return '0';
    }
  }, [farmingContract, isContractReady]);

  return {
    deposit,
    claimRewards,
    closePosition,
    emergencyWithdraw,
    getUserPositions,
    calculateRewards,
    loading,
    error
  };
};