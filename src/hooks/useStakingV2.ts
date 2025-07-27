import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContractsV2 } from './useContractsV2';

export const useStaking = () => {
  const { stakingContract } = useContractsV2();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stake = useCallback(async (planId: number, amount: string) => {
    if (!stakingContract) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const tx = await stakingContract.stake(planId, amount);
      await tx.wait();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec du staking');
      return false;
    } finally {
      setLoading(false);
    }
  }, [stakingContract]);

  const claimRewards = useCallback(async (stakeId: number) => {
    if (!stakingContract) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const tx = await stakingContract.claimRewards(stakeId);
      await tx.wait();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la réclamation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [stakingContract]);

  const endStake = useCallback(async (stakeId: number) => {
    if (!stakingContract) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const tx = await stakingContract.endStake(stakeId);
      await tx.wait();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la fin du stake');
      return false;
    } finally {
      setLoading(false);
    }
  }, [stakingContract]);

  const emergencyWithdraw = useCallback(async (stakeId: number) => {
    if (!stakingContract) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const tx = await stakingContract.emergencyWithdraw(stakeId);
      await tx.wait();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec du retrait d\'urgence');
      return false;
    } finally {
      setLoading(false);
    }
  }, [stakingContract]);

  const getUserStakes = useCallback(async (address: string) => {
    if (!stakingContract) return [];
    
    try {
      const stakes = await stakingContract.getUserStakes(address);
      return stakes;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la récupération des stakes');
      return [];
    }
  }, [stakingContract]);

  const calculateRewards = useCallback(async (address: string, stakeId: number) => {
    if (!stakingContract) return '0';
    
    try {
      const rewards = await stakingContract.calculateRewards(address, stakeId);
      return rewards;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec du calcul des récompenses');
      return '0';
    }
  }, [stakingContract]);

  return {
    stake,
    claimRewards,
    endStake,
    emergencyWithdraw,
    getUserStakes,
    calculateRewards,
    loading,
    error
  };
};