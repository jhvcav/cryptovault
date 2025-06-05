// src/hooks/useOwner.ts
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

export const useOwner = () => {
  const { user, isAuthenticated } = useAuth();
  const { address } = useWallet();
  
  const ownerAddress = import.meta.env.VITE_OWNER_WALLET_ADDRESS?.toLowerCase();
  
  // Vérifier si l'utilisateur est l'owner
  const isOwner = isAuthenticated && ownerAddress && (
    user?.walletAddress?.toLowerCase() === ownerAddress ||
    address?.toLowerCase() === ownerAddress
  );

  console.log('🔍 Owner check:', {
    ownerAddress,
    userWallet: user?.walletAddress?.toLowerCase(),
    connectedWallet: address?.toLowerCase(),
    isOwner
  });

  return {
    isOwner: !!isOwner,
    ownerAddress
  };
};