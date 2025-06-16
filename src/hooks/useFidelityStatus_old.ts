// src/hooks/useFidelityStatus.ts
import { useState, useEffect } from 'react';
import FidelityService, { FidelityResult } from '../services/FidelityService';

interface FidelityState extends FidelityResult {
  loading: boolean;
}

export const useFidelityStatus = (walletAddress: string | null) => {
  const [fidelityData, setFidelityData] = useState<FidelityState>({
    isFidel: false,
    hasClaimedNFT: false,
    userInfo: null,
    loading: true
  });

  useEffect(() => {
    const checkFidelity = async () => {
      if (!walletAddress) {
        setFidelityData(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        setFidelityData(prev => ({ ...prev, loading: true }));
        const result = await FidelityService.checkFidelityStatus(walletAddress);
        
        setFidelityData({
          ...result,
          loading: false
        });

      } catch (error) {
        console.error('Erreur vérification fidélité:', error);
        setFidelityData({
          isFidel: false,
          hasClaimedNFT: false,
          userInfo: null,
          loading: false
        });
      }
    };

    checkFidelity();
  }, [walletAddress]);

  return fidelityData;
};