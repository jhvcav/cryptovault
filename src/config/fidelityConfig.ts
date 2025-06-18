// src/config/fidelityConfig.ts
export const FIDELITY_NFT_CONFIG = {
  tier: 5,
  name: 'NFT Fidélité',
  displayName: 'NFT Fidélité Exclusive',
  icon: '🎁',
  originalPrice: '0',
  originalPriceUSD: 'GRATUIT',
  multiplier: '1.2X',
  multiplierPercent: '+20%',
  description: 'NFT exclusif réservé aux membres fidèles',
  supply: 12
};

export const getFidelityMessages = () => ({
  eligible: `Éligible pour recevoir un ${FIDELITY_NFT_CONFIG.displayName} gratuit`,
  claimed: `${FIDELITY_NFT_CONFIG.displayName} déjà réclamé`,
  owned: `${FIDELITY_NFT_CONFIG.displayName} possédé`,
  notEligible: 'Non éligible pour la fidélité',
  claimButton: `🎁 Réclamer ${FIDELITY_NFT_CONFIG.name}`,
  claimedButton: `✅ ${FIDELITY_NFT_CONFIG.name} Réclamé`,
  ownedButton: `✅ ${FIDELITY_NFT_CONFIG.name} Possédé`
});

export const isFidelityNFT = (nftName: string, tier: number): boolean => {
  return (nftName === FIDELITY_NFT_CONFIG.name && tier === FIDELITY_NFT_CONFIG.tier);
};